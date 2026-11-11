import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Btn, Empty, Field, Icon, Modal, ToastHost, useToast } from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { patchDoc, removeDoc, saveDoc, useCollectionDocs } from '../../lib/db';
import { compressFile, isBadImageUrl } from '../../lib/image';

type ProductRow = {
  id: string;
  name?: string;
  nameEn?: string;
  description?: string;
  shortDescription?: string;
  restaurantId?: string;
  categoryId?: string;
  category?: string;
  sku?: string;
  barcode?: string;
  price?: number;
  salePrice?: number;
  discountPrice?: number;
  discountPercent?: number;
  purchasePrice?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  active?: boolean;
  available?: boolean;
  featured?: boolean;
  isNew?: boolean;
  bestSeller?: boolean;
  image?: string;
  imageUrl?: string;
  images?: string[];
};

type CategoryRow = {
  id: string;
  label?: string;
  name?: string;
  parentId?: string;
  active?: boolean;
  order?: number;
};

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const PAGE = 10;

const titleOf = (row: ProductRow) => text(row.name) || row.id;
const categoryName = (row: CategoryRow) => text(row.label) || text(row.name) || row.id;

const money = (value: number) => Math.round(value).toLocaleString('ar-EG');

const UNITS = ['قطعة', 'كيلو', 'جرام', 'لتر', 'عبوة'];

const effectivePrice = (row: ProductRow) => num(row.discountPrice) || num(row.salePrice) || num(row.price);
const hasDiscount = (row: ProductRow) =>
  num(row.discountPrice) > 0 && num(row.salePrice || row.price) > num(row.discountPrice);

export function ProductsPage() {
  const products = useCollectionDocs('products');
  const categories = useCollectionDocs('categories');
  const restaurants = useCollectionDocs('restaurants');
  const { toast, show } = useToast();

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'newest' | 'price' | 'stock' | 'name'>('newest');
  const [page, setPage] = useState(1);

  const [form, setForm] = useState<{ row: ProductRow | null } | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const [stockFor, setStockFor] = useState<ProductRow | null>(null);

  const rows = products.rows as ProductRow[];
  const cats = categories.rows as CategoryRow[];

  const mains = useMemo(
    () => cats.filter((cat) => !text(cat.parentId)).sort((a, b) => num(a.order) - num(b.order)),
    [cats],
  );

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    cats.forEach((cat) => map.set(cat.id, categoryName(cat)));
    return map;
  }, [cats]);

  const restaurantById = useMemo(() => {
    const map = new Map<string, string>();
    restaurants.rows.forEach((row) => map.set(row.id, text(row.name) || row.id));
    return map;
  }, [restaurants.rows]);

  const stockState = (row: ProductRow): 'out' | 'low' | 'in' => {
    const stock = num(row.stock);
    if (stock <= 0) return 'out';
    if (num(row.minStock) > 0 && stock <= num(row.minStock)) return 'low';
    return 'in';
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (q) {
        const haystack = `${titleOf(row)} ${text(row.sku)} ${text(row.barcode)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (categoryId !== 'all') {
        const inMain = text(row.categoryId) === categoryId;
        const inChild = cats.some((cat) => text(cat.parentId) === categoryId && cat.id === text(row.categoryId));
        if (!inMain && !inChild) return false;
      }
      if (status === 'active' && row.active === false) return false;
      if (status === 'inactive' && row.active !== false) return false;
      if (stockFilter !== 'all' && stockState(row) !== stockFilter) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sort === 'price') return effectivePrice(b) - effectivePrice(a);
      if (sort === 'stock') return num(a.stock) - num(b.stock);
      if (sort === 'name') return titleOf(a).localeCompare(titleOf(b), 'ar');
      return 0;
    });
    return list;
  }, [rows, query, categoryId, status, stockFilter, sort, cats]);

  const stats = useMemo(() => {
    const out = rows.filter((row) => stockState(row) === 'out').length;
    const low = rows.filter((row) => stockState(row) === 'low').length;
    const value = rows.reduce((sum, row) => sum + num(row.stock) * num(row.purchasePrice || row.price), 0);
    return { total: rows.length, out, low, value };
  }, [rows]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE, current * PAGE);

  const exportCsv = () => {
    const ok = downloadCsv(
      'kemet-products',
      filtered.map((row) => ({
        الاسم: titleOf(row),
        SKU: text(row.sku),
        الباركود: text(row.barcode),
        الفئة: nameById.get(text(row.categoryId)) ?? text(row.category),
        سعر_البيع: num(row.salePrice) || num(row.price),
        سعر_الخصم: num(row.discountPrice),
        المخزون: num(row.stock),
        الوحدة: text(row.unit),
        الحالة: row.active === false ? 'موقوف' : 'نشط',
      })),
    );
    show(ok ? `تم تصدير ${filtered.length} صنف` : 'مفيش بيانات للتصدير', ok ? 'ok' : 'error');
  };

  const duplicate = async (row: ProductRow) => {
    try {
      const { id: _ignored, ...rest } = row;
      void _ignored;
      await saveDoc('products', null, {
        ...rest,
        name: `${titleOf(row)} (نسخة)`,
        sku: text(row.sku) ? `${text(row.sku)}-COPY` : '',
        active: false,
      });
      show('تم نسخ الصنف');
    } catch {
      show('النسخ فشل', 'error');
    }
  };

  const toggleActive = async (row: ProductRow) => {
    try {
      await patchDoc('products', row.id, { active: row.active === false });
      show(row.active === false ? 'تم التفعيل' : 'تم الإخفاء');
    } catch {
      show('فشل التحديث', 'error');
    }
  };

  const remove = async (row: ProductRow) => {
    try {
      await removeDoc('products', row.id);
      show('تم حذف الصنف');
    } catch {
      show('الحذف فشل', 'error');
    }
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title="إدارة الأصناف"
        note="المنيو · الأسعار · المخزون — مربوط بالفئات والتطبيق"
        actions={
          <div className="page-actions">
            <Btn variant="primary" onClick={() => setForm({ row: null })}>
              <Icon name="plus" size={14} /> صنف جديد
            </Btn>
            <Btn onClick={exportCsv}>
              <Icon name="content" size={14} /> تصدير CSV
            </Btn>
          </div>
        }
      />

      <div className="stat-grid">
        {[
          { label: 'إجمالي الأصناف', value: stats.total, tone: '' },
          { label: 'نفد المخزون', value: stats.out, tone: 'bad' },
          { label: 'مخزون منخفض', value: stats.low, tone: 'warn' },
          { label: 'قيمة المخزون', value: `${money(stats.value)} ج.م`, tone: '' },
        ].map((card) => (
          <div key={card.label} className={`stat-card static ${card.tone}`}>
            <strong>{card.value}</strong>
            <span className="stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <div className="search">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="ابحث بالاسم أو SKU أو الباركود…"
          />
          <Icon name="search" size={15} />
        </div>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="all">كل الفئات</option>
          {mains.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {categoryName(cat)}
            </option>
          ))}
        </select>
        <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)}>
          <option value="all">كل المخزون</option>
          <option value="in">متوفر</option>
          <option value="low">منخفض</option>
          <option value="out">نفد</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">موقوف</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="newest">الأحدث</option>
          <option value="price">الأعلى سعرًا</option>
          <option value="stock">الأقل مخزونًا</option>
          <option value="name">الاسم</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <Empty
          title="مفيش أصناف مطابقة"
          note={rows.length === 0 ? 'ابدأ بإضافة أول صنف للمنيو.' : 'جرّب تغيير البحث أو الفلتر.'}
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>SKU</th>
                <th>الفئة</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الحالة</th>
                <th aria-label="إجراءات" />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const stock = stockState(row);
                const price = effectivePrice(row);
                const before = num(row.salePrice) || num(row.price);
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="resto-cell">
                        {text(row.imageUrl) && !isBadImageUrl(text(row.imageUrl)) ? (
                          <img className="cat-thumb" src={text(row.imageUrl)} alt="" />
                        ) : (
                          <span className="cat-thumb fallback">{titleOf(row).charAt(0)}</span>
                        )}
                        <div>
                          <div className="cell-title">{titleOf(row)}</div>
                          <div className="cell-sub">
                            {nameById.get(text(row.categoryId)) ||
                              restaurantById.get(text(row.restaurantId)) ||
                              text(row.category) ||
                              'بدون فئة'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td dir="ltr">{text(row.sku) || '—'}</td>
                    <td>{nameById.get(text(row.categoryId)) || text(row.category) || '—'}</td>
                    <td>
                      <div className="cell-title">{money(price)} ج.م</div>
                      {hasDiscount(row) ? (
                        <div className="cell-sub" style={{ textDecoration: 'line-through' }}>
                          {money(before)} ج.م
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`stock-chip ${stock}`}>
                        {num(row.stock)} {text(row.unit)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.active === false ? 'off' : 'delivered'}`}>
                        {row.active === false ? 'موقوف' : 'نشط'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setStockFor(row)} aria-label="المخزون">
                          <Icon name="chart" size={13} />
                        </button>
                        <button className="icon-btn" onClick={() => void duplicate(row)} aria-label="نسخ">
                          <Icon name="content" size={13} />
                        </button>
                        <button className="icon-btn" onClick={() => void toggleActive(row)} aria-label="إظهار/إخفاء">
                          <Icon name={row.active === false ? 'check' : 'lock'} size={13} />
                        </button>
                        <button className="icon-btn" onClick={() => setForm({ row })} aria-label="تعديل">
                          <Icon name="edit" size={13} />
                        </button>
                        <button className="icon-btn danger" onClick={() => setDeleting(row)} aria-label="حذف">
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
            {filtered.length} صنف · صفحة {current} من {pages}
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
        <ProductForm
          row={form.row}
          products={rows}
          mains={mains}
          subs={cats}
          restaurants={restaurants.rows}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            show(form.row ? 'تم تحديث الصنف' : 'تم إضافة الصنف');
          }}
        />
      ) : null}

      {stockFor ? (
        <StockModal
          row={stockFor}
          onClose={() => setStockFor(null)}
        />
      ) : null}

      {deleting ? (
        <Modal
          open
          title="حذف الصنف"
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
          <p className="hint">هتحذف «{titleOf(deleting)}» نهائيًا من المنيو.</p>
        </Modal>
      ) : null}

      <ToastHost toast={toast} />
    </>
  );
}

type Draft = {
  name: string;
  nameEn: string;
  shortDescription: string;
  description: string;
  mainId: string;
  subId: string;
  sku: string;
  barcode: string;
  purchasePrice: string;
  salePrice: string;
  discountPrice: string;
  stock: string;
  minStock: string;
  unit: string;
  active: boolean;
  featured: boolean;
  isNew: boolean;
  bestSeller: boolean;
  imageUrl: string;
  images: string[];
  restaurantId: string;
};

function ProductForm({
  row,
  products,
  mains,
  subs,
  restaurants,
  onClose,
  onSaved,
}: {
  row: ProductRow | null;
  products: ProductRow[];
  mains: CategoryRow[];
  subs: CategoryRow[];
  restaurants: Record<string, unknown>[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const currentCategory = subs.find((cat) => cat.id === text(row?.categoryId));
  const [draft, setDraft] = useState<Draft>({
    name: row ? titleOf(row) : '',
    nameEn: text(row?.nameEn),
    shortDescription: text(row?.shortDescription),
    description: text(row?.description),
    mainId: currentCategory?.parentId ? text(currentCategory.parentId) : text(row?.categoryId),
    subId: currentCategory?.parentId ? currentCategory.id : '',
    sku: text(row?.sku),
    barcode: text(row?.barcode),
    purchasePrice: String(num(row?.purchasePrice) || ''),
    salePrice: String(num(row?.salePrice) || num(row?.price) || ''),
    discountPrice: String(num(row?.discountPrice) || ''),
    stock: String(num(row?.stock) || 0),
    minStock: String(num(row?.minStock) || 0),
    unit: text(row?.unit) || 'قطعة',
    active: row ? row.active !== false : true,
    featured: Boolean(row?.featured),
    isNew: Boolean(row?.isNew),
    bestSeller: Boolean(row?.bestSeller),
    imageUrl: text(row?.imageUrl),
    images: Array.isArray(row?.images) ? (row!.images as string[]) : [],
    restaurantId: text(row?.restaurantId),
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast, show } = useToast();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const childOptions = subs.filter((cat) => text(cat.parentId) === draft.mainId);

  const sale = Number(draft.salePrice) || 0;
  const discount = Number(draft.discountPrice) || 0;
  const discountPercent =
    sale > 0 && discount > 0 && discount < sale ? Math.round(((sale - discount) / sale) * 100) : 0;

  const skuTaken = products.some(
    (item) => item.id !== row?.id && text(item.sku).toLowerCase() === draft.sku.trim().toLowerCase() && draft.sku.trim(),
  );

  const upload = async (file: File, target: 'main' | 'extra') => {
    setUploading(true);
    try {
      const dataUrl = await compressFile(file, 320, 0.72);
      if (target === 'main') set('imageUrl', dataUrl);
      else set('images', [...draft.images, dataUrl]);
      show('تم تجهيز الصورة');
    } catch {
      show('معالجة الصورة فشلت', 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!draft.name.trim()) return show('اسم الصنف مطلوب', 'error');
    if (!draft.mainId) return show('اختار الفئة الرئيسية', 'error');
    if (sale <= 0) return show('سعر البيع مطلوب', 'error');
    if (discount >= sale && discount > 0) return show('سعر الخصم لازم يكون أقل من سعر البيع', 'error');
    if (skuTaken) return show('SKU مستخدم في صنف تاني', 'error');
    if (busy) return;

    setBusy(true);
    try {
      const categoryRow = subs.find((cat) => cat.id === (draft.subId || draft.mainId));
      await saveDoc('products', row?.id ?? null, {
        name: draft.name.trim(),
        nameEn: draft.nameEn.trim(),
        shortDescription: draft.shortDescription.trim(),
        description: draft.description.trim(),
        categoryId: draft.subId || draft.mainId,
        category: categoryRow ? categoryName(categoryRow) : '',
        sku: draft.sku.trim(),
        barcode: draft.barcode.trim(),
        purchasePrice: Number(draft.purchasePrice) || 0,
        salePrice: sale,
        // price = السعر المعروض في التطبيق
        price: discount > 0 ? discount : sale,
        discountPrice: discount,
        discountPercent,
        stock: Number(draft.stock) || 0,
        minStock: Number(draft.minStock) || 0,
        unit: draft.unit,
        active: draft.active,
        available: (Number(draft.stock) || 0) > 0,
        featured: draft.featured,
        isNew: draft.isNew,
        bestSeller: draft.bestSeller,
        imageUrl: draft.imageUrl,
        images: draft.images,
        restaurantId: draft.restaurantId,
        updatedAt: new Date().toISOString(),
      });
      onSaved();
    } catch {
      show('الحفظ فشل', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      wide
      title={row ? `تعديل: ${titleOf(row)}` : 'صنف جديد'}
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
      <div className="form-grid">
        <Field label="اسم الصنف *">
          <input value={draft.name} onChange={(event) => set('name', event.target.value)} />
        </Field>
        <Field label="الاسم بالإنجليزية">
          <input dir="ltr" value={draft.nameEn} onChange={(event) => set('nameEn', event.target.value)} />
        </Field>
        <Field label="وصف مختصر">
          <input
            value={draft.shortDescription}
            onChange={(event) => set('shortDescription', event.target.value)}
          />
        </Field>
        <Field label="المطعم / المتجر">
          <select value={draft.restaurantId} onChange={(event) => set('restaurantId', event.target.value)}>
            <option value="">بدون</option>
            {restaurants.map((restaurant) => (
              <option key={String(restaurant.id)} value={String(restaurant.id)}>
                {String(restaurant.name ?? restaurant.id)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="الفئة الرئيسية *">
          <select
            value={draft.mainId}
            onChange={(event) => {
              set('mainId', event.target.value);
              set('subId', '');
            }}
          >
            <option value="">اختار فئة</option>
            {mains.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {categoryName(cat)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="الفئة الفرعية">
          <select
            value={draft.subId}
            onChange={(event) => set('subId', event.target.value)}
            disabled={childOptions.length === 0}
          >
            <option value="">بدون</option>
            {childOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {categoryName(cat)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="SKU / كود الصنف">
          <input dir="ltr" value={draft.sku} onChange={(event) => set('sku', event.target.value)} />
        </Field>
        <Field label="الباركود">
          <input dir="ltr" value={draft.barcode} onChange={(event) => set('barcode', event.target.value)} />
        </Field>
        <Field label="سعر الشراء">
          <input type="number" value={draft.purchasePrice} onChange={(event) => set('purchasePrice', event.target.value)} />
        </Field>
        <Field label="سعر البيع *">
          <input type="number" value={draft.salePrice} onChange={(event) => set('salePrice', event.target.value)} />
        </Field>
        <Field label={`سعر الخصم ${discountPercent ? `(${discountPercent}%)` : ''}`}>
          <input type="number" value={draft.discountPrice} onChange={(event) => set('discountPrice', event.target.value)} />
        </Field>
        <Field label="الكمية في المخزون">
          <input type="number" value={draft.stock} onChange={(event) => set('stock', event.target.value)} />
        </Field>
        <Field label="الحد الأدنى للمخزون">
          <input type="number" value={draft.minStock} onChange={(event) => set('minStock', event.target.value)} />
        </Field>
        <Field label="الوحدة">
          <select value={draft.unit} onChange={(event) => set('unit', event.target.value)}>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </Field>
        <Field label="الوصف التفصيلي">
          <textarea value={draft.description} onChange={(event) => set('description', event.target.value)} />
        </Field>
      </div>

      <div className="upload-row">
        {draft.imageUrl ? (
          <img className="cat-preview" src={draft.imageUrl} alt="" />
        ) : (
          <div className="cat-preview empty">
            <Icon name="content" size={20} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label className="cat-upload-btn">
            {uploading ? 'بيتم الرفع…' : 'صورة الصنف'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file, 'main');
              }}
            />
          </label>
          <div className="flags">
            {[
              { key: 'active', label: 'نشط' },
              { key: 'featured', label: 'مميز' },
              { key: 'isNew', label: 'جديد' },
              { key: 'bestSeller', label: 'الأكثر مبيعًا' },
            ].map((flag) => (
              <label key={flag.key} className="flag">
                <input
                  type="checkbox"
                  checked={Boolean(draft[flag.key as keyof Draft])}
                  onChange={(event) => set(flag.key as keyof Draft, event.target.checked as never)}
                />
                {flag.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <p className="hint" style={{ marginTop: 8 }}>
        SKU فريد · سعر الخصم بيظهر في التطبيق تلقائيًا · المخزون صفر = غير متوفر.
      </p>

      <ToastHost toast={toast} />
    </Modal>
  );
}

function StockModal({ row, onClose }: { row: ProductRow; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast, show } = useToast();

  const apply = async (sign: 1 | -1) => {
    const delta = Number(amount);
    if (!Number.isFinite(delta) || delta <= 0) {
      show('اكتب كمية صحيحة', 'error');
      return;
    }
    setBusy(true);
    try {
      const next = Math.max(0, num(row.stock) + sign * delta);
      await patchDoc('products', row.id, { stock: next, available: next > 0 });
      await saveDoc('stock_movements', null, {
        productId: row.id,
        productName: titleOf(row),
        delta: sign * delta,
        stockAfter: next,
      });
      show(`المخزون بقى ${next}`);
      onClose();
    } catch {
      show('التحديث فشل', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={`مخزون: ${titleOf(row)}`}
      onClose={onClose}
      footer={<Btn onClick={onClose}>إغلاق</Btn>}
    >
      <p className="hint">
        المخزون الحالي: <b>{num(row.stock)}</b> {text(row.unit)}
      </p>
      <Field label="الكمية">
        <input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </Field>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn variant="primary" disabled={busy} onClick={() => void apply(1)}>
          إضافة
        </Btn>
        <Btn variant="danger" disabled={busy} onClick={() => void apply(-1)}>
          خصم
        </Btn>
      </div>
      <ToastHost toast={toast} />
    </Modal>
  );
}
