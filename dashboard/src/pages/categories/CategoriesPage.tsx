import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Btn, Empty, Field, Icon, Modal, ToastHost, useToast } from '../../components/ui';
import { patchDoc, removeDoc, saveDoc, useCollectionDocs } from '../../lib/db';

type CategoryRow = {
  id: string;
  label?: string;
  name?: string;
  image?: string;
  imageUrl?: string;
  order?: number;
  active?: boolean;
};

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' ? value : 0);
const PAGE = 8;

const titleOf = (row: CategoryRow) => text(row.label) || text(row.name) || row.id;

/** رابط صورة مش قابل للتحميل (معاينات جوجل وغيرها). */
const isBadImageUrl = (url: string) =>
  Boolean(url) &&
  !url.startsWith('data:image') &&
  !/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(url);

/**
 * ضغط الصورة وتحويلها لـbase64 — بتتحفظ جوه مستند Firestore.
 * مجاني بالكامل (بدون Firebase Storage) ومقاسها بيبقى أقل من حد المستند 1MB.
 */
async function compressToDataUrl(file: File, size = 256, quality = 0.7): Promise<string> {
  const bitmap = await createImageBitmap(file);
  return drawSquare(bitmap, size, quality);
}

/** قص مربع + تصغير + ضغط لأي صورة (ملف أو صورة محمّلة). */
function drawSquare(bitmap: { width: number; height: number }, size: number, quality: number): string {
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    bitmap as CanvasImageSource,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );

  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  // نحافظ على الصورة صغيرة عشان التطبيق يبقى سريع (حد آمن 120KB).
  let nextQuality = quality;
  while (dataUrl.length > 120_000 && nextQuality > 0.3) {
    nextQuality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', nextQuality);
  }
  return dataUrl;
}

/** إعادة ضغط صورة base64 محفوظة مسبقًا. */
function recompressDataUrl(dataUrl: string, size = 256, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        resolve(drawSquare(image, size, quality));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error('decode'));
    image.src = dataUrl;
  });
}

/** مقاسات الصورة الموصى بها — بتظهر في تعليمات الرفع. */
const IMAGE_SPECS = [
  { label: 'المقاس', value: '512 × 512 px' },
  { label: 'النسبة', value: '1:1 (مربعة)' },
  { label: 'الصيغة', value: 'JPG أو PNG' },
  { label: 'التخزين', value: 'داخل Firestore' },
];

export function CategoriesPage() {
  const categories = useCollectionDocs('categories');
  const products = useCollectionDocs('products');
  const { toast, show } = useToast();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [form, setForm] = useState<{ row: CategoryRow | null } | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [audit, setAudit] = useState<{ name: string; problem: string }[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  /** إعادة ضغط الصور المحفوظة كـbase64 — بتقلل اللاج في التطبيق. */
  const optimizeImages = async () => {
    if (optimizing) return;
    setOptimizing(true);
    let changed = 0;
    let saved = 0;
    try {
      for (const row of rows) {
        const url = text(row.imageUrl);
        if (!url.startsWith('data:image')) continue;
        try {
          const next = await recompressDataUrl(url);
          if (next.length < url.length) {
            await patchDoc('categories', row.id, { imageUrl: next });
            changed += 1;
            saved += url.length - next.length;
          }
        } catch {
          /* صورة مش قابلة للفك — نتخطاها */
        }
      }
      show(
        changed
          ? `تم تحسين ${changed} صورة (توفير ${Math.round(saved / 1024)} كيلوبايت)`
          : 'كل الصور محسّنة بالفعل',
      );
    } catch {
      show('التحسين فشل', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const rows = categories.rows as CategoryRow[];

  const productsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    products.rows.forEach((product) => {
      const key = text(product.categoryId) || text(product.category);
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [products.rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (q && !titleOf(row).toLowerCase().includes(q)) return false;
        if (status === 'active' && row.active === false) return false;
        if (status === 'inactive' && row.active !== false) return false;
        return true;
      })
      .sort((a, b) => num(a.order) - num(b.order) || titleOf(a).localeCompare(titleOf(b), 'ar'));
  }, [rows, query, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE, current * PAGE);

  /** فحص صور الفئات: ناقصة · مفتاح محلي · رابط مكسور. */
  const checkImages = async () => {
    if (checking) return;
    setChecking(true);
    const issues: { name: string; problem: string }[] = [];

    const probe = (url: string) =>
      new Promise<boolean>((resolve) => {
        const image = new Image();
        const timer = window.setTimeout(() => resolve(false), 6000);
        image.onload = () => {
          window.clearTimeout(timer);
          resolve(true);
        };
        image.onerror = () => {
          window.clearTimeout(timer);
          resolve(false);
        };
        image.src = url;
      });

    for (const row of rows) {
      const url = text(row.imageUrl);
      if (!url) {
        issues.push({ name: titleOf(row), problem: 'بدون صورة (بتظهر صورة افتراضية)' });
        continue;
      }
      if (url.startsWith('data:image')) continue;
      const ok = await probe(url);
      if (!ok) issues.push({ name: titleOf(row), problem: 'الرابط مكسور أو مش متاح' });
    }

    setAudit(issues);
    setChecking(false);
  };

  const remove = async (row: CategoryRow) => {
    const linked = productsByCategory.get(row.id) ?? 0;
    if (linked > 0) {
      show(`مش ممكن تحذف «${titleOf(row)}» — مرتبط بـ${linked} صنف. انقل الأصناف الأول.`, 'error');
      setDeleting(null);
      return;
    }
    try {
      await removeDoc('categories', row.id);
      show('تم حذف الفئة');
    } catch {
      show('الحذف فشل — صلاحيات الأدمن مطلوبة', 'error');
    }
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title="إدارة الفئات"
        note="نظّم أقسام المتجر — أي تعديل بيظهر في التطبيق فورًا"
        actions={
          <div className="page-actions">
            <Btn variant="primary" onClick={() => setForm({ row: null })}>
              <Icon name="plus" size={14} /> فئة جديدة
            </Btn>
            <Btn onClick={() => void optimizeImages()} disabled={optimizing}>
              <Icon name="refresh" size={14} /> {optimizing ? 'بيتم التحسين…' : 'تحسين الصور'}
            </Btn>
            <Btn onClick={() => void checkImages()} disabled={checking}>
              <Icon name="search" size={14} /> {checking ? 'بيتم الفحص…' : 'فحص الصور'}
            </Btn>
          </div>
        }
      />

      <div className="cat-hint">
        <span className="cat-hint-icon">
          <Icon name="content" size={14} />
        </span>
        <div>
          <strong>مقاس صورة الفئة</strong>
          <em>
            512×512 · مربعة · JPG أو PNG — الصورة بتتضغط تلقائيًا وبتتحفظ في قاعدة البيانات (بدون
            Storage)
          </em>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="ابحث باسم الفئة…"
          />
          <Icon name="search" size={15} />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشطة</option>
          <option value="inactive">موقوفة</option>
        </select>
        <Btn size="sm" onClick={() => { setQuery(''); setStatus('all'); setPage(1); }}>
          إعادة تعيين
        </Btn>
      </div>

      {categories.error ? <div className="alert alert-error">{categories.error}</div> : null}

      {categories.loading ? (
        <div className="table-wrap">
          <div className="skeleton-rows">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton-row" />
            ))}
          </div>
        </div>
      ) : visible.length === 0 ? (
        <Empty
          title="مفيش فئات مطابقة"
          note={rows.length === 0 ? 'ابدأ بإضافة أول فئة للمتجر.' : 'جرّب تغيير البحث أو الفلتر.'}
        />
      ) : (
        <div className="table-wrap">
          <table className="data cat-table">
            <thead>
              <tr>
                <th>الفئة</th>
                <th>الترتيب</th>
                <th>الأصناف</th>
                <th>الحالة</th>
                <th aria-label="إجراءات" />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const linked = productsByCategory.get(row.id) ?? 0;
                const active = row.active !== false;
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="resto-cell">
                        {text(row.imageUrl) ? (
                          <img className="cat-thumb" src={text(row.imageUrl)} alt="" />
                        ) : (
                          <span className="cat-thumb fallback">{titleOf(row).charAt(0)}</span>
                        )}
                        <div>
                          <div className="cell-title">
                            {titleOf(row)}
                            {isBadImageUrl(text(row.imageUrl)) ? (
                              <span className="warn-dot" title="رابط الصورة مش قابل للتحميل" />
                            ) : null}
                          </div>
                          <div className="cell-sub">{linked ? `${linked} صنف` : 'بدون أصناف'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="order-chip">{num(row.order)}</span>
                    </td>
                    <td>{linked}</td>
                    <td>
                      <button
                        className={`status-pill ${active ? 'on' : 'off'}`}
                        onClick={() =>
                          void patchDoc('categories', row.id, { active: !active })
                            .then(() => show(active ? 'تم الإيقاف' : 'تم التفعيل'))
                            .catch(() => show('فشل التحديث', 'error'))
                        }
                        aria-label={active ? 'إيقاف الفئة' : 'تفعيل الفئة'}
                      >
                        <i />
                        {active ? 'نشطة' : 'موقوفة'}
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        {isBadImageUrl(text(row.imageUrl)) ? (
                          <button
                            className="icon-btn danger"
                            aria-label="تنظيف رابط الصورة"
                            title="الرابط مش قابل للتحميل — اضغط لمسحه وارفع صورة"
                            onClick={() =>
                              void patchDoc('categories', row.id, { imageUrl: '' })
                                .then(() => show('تم مسح الرابط — ارفع صورة من التعديل'))
                                .catch(() => show('فشل التنظيف', 'error'))
                            }
                          >
                            <Icon name="refresh" size={13} />
                          </button>
                        ) : null}
                        <button className="icon-btn" onClick={() => setForm({ row })} aria-label="تعديل">
                          <Icon name="edit" size={13} />
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => setDeleting(row)}
                          aria-label="حذف"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="pager">
          <span>
            {filtered.length} فئة · صفحة {current} من {pages}
          </span>
          <div className="pager-btns">
            <Btn size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              السابق
            </Btn>
            <Btn size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>
              التالي
            </Btn>
          </div>
        </div>
      ) : null}

      {form ? (
        <CategoryForm
          row={form.row}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            show(form.row ? 'تم تحديث الفئة' : 'تم إضافة الفئة');
          }}
        />
      ) : null}

      {deleting ? (
        <Modal
          open
          title="حذف الفئة"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Btn onClick={() => setDeleting(null)}>إلغاء</Btn>
              <Btn variant="danger" onClick={() => void remove(deleting)}>
                حذف نهائي
              </Btn>
            </>
          }
        >
          <p className="hint">
            هتحذف «{titleOf(deleting)}».
            {(productsByCategory.get(deleting.id) ?? 0) > 0
              ? ` فيها ${productsByCategory.get(deleting.id)} صنف — الحذف ممنوع لحد ما تنقلهم.`
              : ' العملية مش قابلة للرجوع.'}
          </p>
        </Modal>
      ) : null}

      {audit ? (
        <Modal
          open
          title="فحص صور الفئات"
          onClose={() => setAudit(null)}
          footer={<Btn onClick={() => setAudit(null)}>تم</Btn>}
        >
          {audit.length === 0 ? (
            <p className="hint">كل الفئات صورها سليمة ✓</p>
          ) : (
            <>
              <p className="hint">
                {audit.length} فئة محتاجة مراجعة من أصل {rows.length}:
              </p>
              <ul className="audit-list">
                {audit.map((item) => (
                  <li key={item.name}>
                    <strong>{item.name}</strong>
                    <span>{item.problem}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      ) : null}

      <ToastHost toast={toast} />
    </>
  );
}

function CategoryForm({
  row,
  onClose,
  onSaved,
}: {
  row: CategoryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(row ? titleOf(row) : '');
  const [order, setOrder] = useState(String(num(row?.order) || 1));
  const [active, setActive] = useState(row ? row.active !== false : true);
  const [imageUrl, setImageUrl] = useState(text(row?.imageUrl));
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast, show } = useToast();

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      show('اختار ملف صورة', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      show('الصورة كبيرة جدًا — اختار صورة أقل من 8MB', 'error');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressToDataUrl(file);
      setImageUrl(dataUrl);
      show('تم تجهيز الصورة ✓');
    } catch {
      show('معالجة الصورة فشلت — جرّب صورة تانية', 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!label.trim()) {
      show('اسم الفئة مطلوب', 'error');
      return;
    }
    // روابط معاينة جوجل/المحركات بتمنع التحميل وبتنتهي — لازم صورة مرفوعة فعليًا.
    const link = imageUrl.trim();
    if (link && !link.startsWith('data:image') && /encrypted-tbn|gstatic|googleusercontent/.test(link)) {
      show('الرابط ده من جوجل ومش بيتحمّل — استخدم «رفع صورة» بدلها', 'error');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await saveDoc('categories', row?.id ?? null, {
        label: label.trim(),
        name: label.trim(),
        order: Number(order) || 1,
        active,
        imageUrl: imageUrl.trim(),
        updatedAt: new Date().toISOString(),
      });
      onSaved();
    } catch {
      show('الحفظ فشل — صلاحيات الأدمن مطلوبة', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={row ? `تعديل: ${titleOf(row)}` : 'فئة جديدة'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>إلغاء</Btn>
          <Btn variant="primary" onClick={() => void save()} disabled={busy || uploading}>
            {busy ? 'بيتم الحفظ…' : 'حفظ'}
          </Btn>
        </>
      }
    >
      <div className="cat-form">
        <div className="cat-upload">
          {imageUrl ? (
            <img className="cat-preview" src={imageUrl} alt="" />
          ) : (
            <div className="cat-preview empty">
              <Icon name="content" size={22} />
            </div>
          )}
          <label className="cat-upload-btn">
            {uploading ? 'بيتم الرفع…' : 'رفع صورة'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </label>
          {imageUrl ? (
            <button className="cat-remove" onClick={() => setImageUrl('')} type="button">
              إزالة
            </button>
          ) : null}
        </div>

        <div className="cat-fields">
          <Field label="اسم الفئة *">
            <input value={label} onChange={(event) => setLabel(event.target.value)} />
          </Field>
          <div className="field-row">
            <Field label="ترتيب الظهور">
              <input
                type="number"
                value={order}
                onChange={(event) => setOrder(event.target.value)}
              />
            </Field>
            <Field label="الحالة">
              <select
                value={active ? 'active' : 'inactive'}
                onChange={(event) => setActive(event.target.value === 'active')}
              >
                <option value="active">نشطة</option>
                <option value="inactive">موقوفة</option>
              </select>
            </Field>
          </div>
          <Field label="أو رابط الصورة">
            <input
              dir="ltr"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://…"
            />
          </Field>
        </div>
      </div>

      <div className="spec-grid">
        {IMAGE_SPECS.map((item) => (
          <div key={item.label} className="spec">
            <span>{item.label}</span>
            <b>{item.value}</b>
          </div>
        ))}
      </div>

      <ToastHost toast={toast} />
    </Modal>
  );
}
