import { useMemo, useState } from 'react';
import {
  Btn,
  Empty,
  Icon,
  SearchBox,
  Segmented,
  StatusBadge,
  ToastHost,
  useToast,
} from '../components/ui';
import { patchDoc, removeDoc, useCollectionDocs } from '../lib/db';
import { PageHeader } from '../components/layout';

type Filter = 'all' | 'live' | 'delivered' | 'cancelled';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const millisOf = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

function formatDate(value: unknown) {
  const millis = millisOf(value);
  if (!millis) return '—';
  return new Date(millis).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
}

export function Orders() {
  const { rows, loading, error } = useCollectionDocs('orders');
  const { toast, show } = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...rows]
      .sort((a, b) => millisOf(b.createdAt) - millisOf(a.createdAt))
      .filter((row) => {
        const status = text(row.status) || 'live';
        if (filter !== 'all' && status !== filter) return false;
        if (!needle) return true;
        return (
          text(row.restaurantName).toLowerCase().includes(needle) ||
          text(row.address).toLowerCase().includes(needle)
        );
      });
  }, [rows, query, filter]);

  const changeStatus = async (id: string, status: string) => {
    try {
      await patchDoc('orders', id, { status });
      show('تم تغيير حالة الطلب');
    } catch {
      show('التحديث فشل — تأكد إنك أدمن.', 'error');
    }
  };

  const destroy = async (id: string) => {
    if (!window.confirm('متأكد إنك عايز تحذف الطلب؟')) return;
    try {
      await removeDoc('orders', id);
      show('تم حذف الطلب');
    } catch {
      show('الحذف فشل — تأكد إنك أدمن.', 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="الطلبات"
        note={`${filtered.length} طلب · بيتحدّث لحظيًا`}
        actions={
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'الكل' },
              { id: 'live', label: 'في الطريق' },
              { id: 'delivered', label: 'مكتمل' },
              { id: 'cancelled', label: 'ملغي' },
            ]}
          />
        }
      />

      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="ابحث باسم المطعم أو العنوان…" />
        <span style={{ marginInlineStart: 'auto', fontSize: 12.5, color: 'var(--muted)' }}>
          الإجمالي: {rows.reduce((sum, row) => sum + (typeof row.total === 'number' ? row.total : 0), 0)} ج.م
        </span>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="panel">
        {loading ? (
          <div className="empty">بيتم التحميل…</div>
        ) : filtered.length === 0 ? (
          <Empty title="مفيش طلبات هنا" note="غيّر الفلتر أو استنى أول طلب من التطبيق." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>المطعم</th>
                  <th>الأصناف</th>
                  <th>الإجمالي</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th style={{ width: 210 }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="cell-title">{text(row.restaurantName) || 'طلب'}</div>
                      <div className="cell-sub">{text(row.address) || '—'}</div>
                    </td>
                    <td>{String(row.itemsCount ?? 0)}</td>
                    <td>{String(row.total ?? 0)} ج.م</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.createdAt)}</td>
                    <td>
                      <StatusBadge status={text(row.status)} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <Btn size="sm" onClick={() => void changeStatus(row.id, 'live')}>
                          في الطريق
                        </Btn>
                        <Btn size="sm" onClick={() => void changeStatus(row.id, 'delivered')}>
                          تم
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => void changeStatus(row.id, 'cancelled')}>
                          إلغاء
                        </Btn>
                        <button
                          className="icon-btn"
                          onClick={() => void destroy(row.id)}
                          aria-label="حذف"
                          style={{ color: 'var(--clay)' }}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToastHost toast={toast} />
    </>
  );
}
