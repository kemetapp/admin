import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Btn, Empty, Icon, Modal, ToastHost, useToast } from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { patchDoc, removeDoc, useCollectionDocs } from '../../lib/db';
import { RestaurantDetail } from './RestaurantDetail';
import { RestaurantForm } from './RestaurantForm';
import {
  APPROVAL_LABEL,
  APPROVAL_TONE,
  OPERATING_LABEL,
  OPERATING_TONE,
  approvalOf,
  initialsOf,
  millisOf,
  numOf,
  operatingOf,
  phoneOf,
  textOf,
  type RestaurantRow,
} from './types';

const PAGE_SIZE = 10;
const DAY = 24 * 60 * 60 * 1000;

type SortKey = 'newest' | 'orders' | 'rating';
type StatusFilter = 'all' | 'active' | 'suspended' | 'pending' | 'rejected' | 'approved';

const money = (value: number) => Math.round(value).toLocaleString('ar-EG');

export function RestaurantsPage() {
  const [nonce, setNonce] = useState(0);
  const restaurants = useCollectionDocs('restaurants', nonce);
  const orders = useCollectionDocs('orders');
  const categories = useCollectionDocs('categories');
  const { toast, show } = useToast();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('all');
  const [rating, setRating] = useState('all');
  const [period, setPeriod] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<RestaurantRow | null>(null);
  const [form, setForm] = useState<{ row: RestaurantRow | null } | null>(null);
  const [deleting, setDeleting] = useState<RestaurantRow | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const rows = restaurants.rows as RestaurantRow[];

  const ordersByRestaurant = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    orders.rows.forEach((order) => {
      const id = textOf(order.restaurantId);
      if (!id) return;
      const current = map.get(id) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += numOf(order.total);
      map.set(id, current);
    });
    return map;
  }, [orders.rows]);

  const stats = useMemo(() => {
    const monthStart = Date.now() - 30 * DAY;
    return {
      total: rows.length,
      active: rows.filter((row) => operatingOf(row) === 'active' && approvalOf(row) === 'approved').length,
      pending: rows.filter((row) => approvalOf(row) === 'pending').length,
      suspended: rows.filter((row) => operatingOf(row) === 'suspended').length,
      rejected: rows.filter((row) => approvalOf(row) === 'rejected').length,
      fresh: rows.filter((row) => millisOf(row.createdAt) >= monthStart).length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const since = period === 'all' ? 0 : Date.now() - Number(period) * DAY;

    const list = rows.filter((row) => {
      if (q) {
        const haystack = [textOf(row.name), textOf(row.nameEn), textOf(row.phone), textOf(row.ownerName)]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (status !== 'all') {
        const approval = approvalOf(row);
        const operating = operatingOf(row);
        if (status === 'approved' && approval !== 'approved') return false;
        if (status === 'pending' && approval !== 'pending') return false;
        if (status === 'rejected' && approval !== 'rejected') return false;
        if (status === 'active' && !(approval === 'approved' && operating === 'active')) return false;
        if (status === 'suspended' && operating !== 'suspended') return false;
      }
      if (category !== 'all' && textOf(row.cuisine) !== category) return false;
      if (rating !== 'all' && numOf(row.rating) < Number(rating)) return false;
      if (since && millisOf(row.createdAt) < since) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sort === 'rating') return numOf(b.rating) - numOf(a.rating);
      if (sort === 'orders') {
        return (ordersByRestaurant.get(b.id)?.count ?? 0) - (ordersByRestaurant.get(a.id)?.count ?? 0);
      }
      return millisOf(b.createdAt) - millisOf(a.createdAt);
    });
    return list;
  }, [rows, query, status, category, rating, period, sort, ordersByRestaurant]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const resetFilters = () => {
    setQuery('');
    setStatus('all');
    setCategory('all');
    setRating('all');
    setPeriod('all');
    setSort('newest');
    setPage(1);
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      const value = textOf(row.cuisine);
      if (value) set.add(value);
    });
    categories.rows.forEach((row) => {
      const label = textOf(row.name) || textOf(row.label);
      if (label) set.add(label);
    });
    return [...set].sort();
  }, [rows, categories.rows]);

  const act = async (row: RestaurantRow, patch: Record<string, unknown>, message: string) => {
    try {
      await patchDoc('restaurants', row.id, patch);
      show(message);
    } catch {
      show('التحديث فشل — صلاحيات الأدمن مطلوبة', 'error');
    }
    setOpenMenu(null);
  };

  const exportCsv = () => {
    const ok = downloadCsv(
      'kemet-restaurants',
      filtered.map((row) => ({
        المطعم: textOf(row.name),
        المعرف: row.id,
        المالك: textOf(row.ownerName),
        الهاتف: phoneOf(row),
        التصنيف: textOf(row.cuisine),
        المنطقة: textOf(row.area),
        الطلبات: ordersByRestaurant.get(row.id)?.count ?? 0,
        التقييم: numOf(row.rating),
        العمولة: numOf(row.commission),
        الاعتماد: APPROVAL_LABEL[approvalOf(row)],
        التشغيل: OPERATING_LABEL[operatingOf(row)],
        التسجيل: millisOf(row.createdAt)
          ? new Date(millisOf(row.createdAt)).toLocaleDateString('ar-EG')
          : '',
      })),
    );
    show(ok ? `تم تصدير ${filtered.length} مطعم` : 'مفيش بيانات للتصدير', ok ? 'ok' : 'error');
  };

  if (detail) {
    return (
      <RestaurantDetail
        row={detail}
        onBack={() => setDetail(null)}
        onEdit={() => {
          setForm({ row: detail });
          setDetail(null);
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="إدارة المطاعم"
        note="إدارة ومتابعة جميع المطاعم المسجلة في المنصة"
        actions={
          <div className="page-actions">
            <Btn variant="primary" onClick={() => setForm({ row: null })}>
              <Icon name="plus" size={14} /> مطعم جديد
            </Btn>
            <Btn onClick={exportCsv}>
              <Icon name="content" size={14} /> تصدير
            </Btn>
            <Btn onClick={() => setNonce((value) => value + 1)}>
              <Icon name="refresh" size={14} /> تحديث
            </Btn>
          </div>
        }
      />

      <div className="crumb">
        <span>لوحة التحكم</span>
        <i>/</i>
        <b>المطاعم</b>
      </div>

      <div className="stat-grid">
        {[
          { key: 'all', label: 'إجمالي المطاعم', value: stats.total, icon: 'restaurants' },
          { key: 'active', label: 'نشطة', value: stats.active, icon: 'check' },
          { key: 'pending', label: 'قيد المراجعة', value: stats.pending, icon: 'clock' },
          { key: 'suspended', label: 'موقوفة', value: stats.suspended, icon: 'lock' },
          { key: 'rejected', label: 'مرفوضة', value: stats.rejected, icon: 'close' },
          { key: 'new', label: 'جديدة هذا الشهر', value: stats.fresh, icon: 'chart' },
        ].map((card) => (
          <button
            key={card.key}
            className={`stat-card ${status === card.key ? 'on' : ''}`}
            onClick={() => {
              setStatus(card.key === 'new' ? 'all' : (card.key as StatusFilter));
              setPeriod(card.key === 'new' ? '30' : 'all');
              setPage(1);
            }}
          >
            <span className="stat-icon">
              <Icon name={card.icon as never} size={15} />
            </span>
            <strong>{card.value}</strong>
            <span className="stat-label">{card.label}</span>
          </button>
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
            placeholder="ابحث بالاسم أو الهاتف أو المالك…"
          />
          <Icon name="search" size={15} />
        </div>

        <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
          <option value="all">كل الحالات</option>
          <option value="approved">معتمد</option>
          <option value="active">نشط</option>
          <option value="pending">قيد المراجعة</option>
          <option value="suspended">موقوف</option>
          <option value="rejected">مرفوض</option>
        </select>

        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">كل التصنيفات</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select value={rating} onChange={(event) => setRating(event.target.value)}>
          <option value="all">كل التقييمات</option>
          <option value="4.5">4.5+</option>
          <option value="4">4+</option>
          <option value="3">3+</option>
        </select>

        <select value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="all">كل الفترات</option>
          <option value="7">آخر 7 أيام</option>
          <option value="30">آخر 30 يوم</option>
          <option value="90">آخر 90 يوم</option>
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
          <option value="newest">الأحدث</option>
          <option value="orders">الأكثر طلبًا</option>
          <option value="rating">الأعلى تقييمًا</option>
        </select>

        <Btn size="sm" onClick={resetFilters}>
          إعادة تعيين
        </Btn>
      </div>

      {restaurants.error ? <div className="alert alert-error">{restaurants.error}</div> : null}

      {restaurants.loading ? (
        <div className="table-wrap">
          <div className="skeleton-rows">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton-row" />
            ))}
          </div>
        </div>
      ) : visible.length === 0 ? (
        <Empty
          title="مفيش مطاعم مطابقة"
          note={
            rows.length === 0
              ? 'ابدأ بإضافة أول مطعم للمنصة.'
              : 'جرّب تغيير البحث أو إعادة تعيين الفلاتر.'
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>المطعم</th>
                <th>المالك</th>
                <th>الهاتف</th>
                <th>التصنيف</th>
                <th>المنطقة</th>
                <th>الطلبات</th>
                <th>التقييم</th>
                <th>العمولة</th>
                <th>الحالة</th>
                <th>التسجيل</th>
                <th aria-label="الإجراءات" />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const approval = approvalOf(row);
                const operating = operatingOf(row);
                const metrics = ordersByRestaurant.get(row.id);
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="resto-cell">
                        {textOf(row.logoUrl) ? (
                          <img className="resto-logo" src={textOf(row.logoUrl)} alt="" />
                        ) : (
                          <span className="resto-logo fallback">{initialsOf(row)}</span>
                        )}
                        <div>
                          <div className="cell-title">{textOf(row.name) || row.id}</div>
                          <div className="cell-sub" dir="ltr">
                            {row.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{textOf(row.ownerName) || '—'}</td>
                    <td dir="ltr">{phoneOf(row) || '—'}</td>
                    <td>{textOf(row.cuisine) || '—'}</td>
                    <td>{textOf(row.area) || '—'}</td>
                    <td>{metrics?.count ?? 0}</td>
                    <td>⭐ {numOf(row.rating).toFixed(1)}</td>
                    <td>{numOf(row.commission) ? `${numOf(row.commission)}%` : '—'}</td>
                    <td>
                      <div className="badge-col">
                        <span className={`badge ${APPROVAL_TONE[approval]}`}>{APPROVAL_LABEL[approval]}</span>
                        <span className={`badge ${OPERATING_TONE[operating]}`}>{OPERATING_LABEL[operating]}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {millisOf(row.createdAt)
                        ? new Date(millisOf(row.createdAt)).toLocaleDateString('ar-EG')
                        : '—'}
                    </td>
                    <td>
                      <div className="row-menu">
                        <button
                          className="icon-btn"
                          onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}
                          aria-label="إجراءات"
                        >
                          <Icon name="menu" size={14} />
                        </button>
                        {openMenu === row.id ? (
                          <div className="menu-pop">
                            <button onClick={() => { setDetail(row); setOpenMenu(null); }}>عرض التفاصيل</button>
                            <button onClick={() => { setForm({ row }); setOpenMenu(null); }}>تعديل</button>
                            {approval === 'pending' ? (
                              <>
                                <button onClick={() => void act(row, { approvalStatus: 'approved' }, 'تم اعتماد المطعم')}>
                                  قبول
                                </button>
                                <button onClick={() => void act(row, { approvalStatus: 'rejected' }, 'تم رفض المطعم')}>
                                  رفض
                                </button>
                              </>
                            ) : null}
                            <button
                              onClick={() =>
                                void act(
                                  row,
                                  { operatingStatus: operating === 'active' ? 'suspended' : 'active', active: operating !== 'active' },
                                  operating === 'active' ? 'تم إيقاف المطعم' : 'تم تفعيل المطعم',
                                )
                              }
                            >
                              {operating === 'active' ? 'إيقاف' : 'تفعيل'}
                            </button>
                            <button onClick={() => { setDetail(row); setOpenMenu(null); }}>قائمة الطعام</button>
                            <button
                              className="danger"
                              onClick={() => { setDeleting(row); setOpenMenu(null); }}
                            >
                              حذف
                            </button>
                          </div>
                        ) : null}
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
            {filtered.length} مطعم · صفحة {current} من {pages}
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
        <RestaurantForm
          row={form.row}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            setNonce((value) => value + 1);
            show(form.row ? 'تم تحديث المطعم' : 'تم إضافة المطعم');
          }}
        />
      ) : null}

      {deleting ? (
        <Modal
          open
          title="حذف المطعم"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Btn onClick={() => setDeleting(null)}>إلغاء</Btn>
              <Btn
                variant="danger"
                onClick={async () => {
                  try {
                    await removeDoc('restaurants', deleting.id);
                    show('تم حذف المطعم');
                    setNonce((value) => value + 1);
                  } catch {
                    show('الحذف فشل — صلاحيات الأدمن مطلوبة', 'error');
                  }
                  setDeleting(null);
                }}
              >
                حذف نهائي
              </Btn>
            </>
          }
        >
          <p className="hint">
            هتحذف «{textOf(deleting.name) || deleting.id}» نهائيًا. العملية مش قابلة للرجوع.
          </p>
        </Modal>
      ) : null}

      <ToastHost toast={toast} />
    </>
  );
}
