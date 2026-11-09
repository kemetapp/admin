import { useMemo } from 'react';
import { Empty, StatusBadge } from '../components/ui';
import { useCollectionDocs } from '../lib/db';
import { emojiFor } from '../lib/food';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const millisOf = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
const money = (value: number) => value.toLocaleString('ar-EG');

export function Overview() {
  const restaurants = useCollectionDocs('restaurants');
  const products = useCollectionDocs('products');
  const orders = useCollectionDocs('orders');
  const users = useCollectionDocs('users');

  const visibleRestaurants = restaurants.rows.filter((row) => row.active !== false).length;
  const liveOrders = orders.rows.filter((row) => (text(row.status) || 'live') === 'live').length;
  const delivered = orders.rows.filter((row) => row.status === 'delivered');
  const revenue = delivered.reduce(
    (sum, row) => sum + (typeof row.total === 'number' ? row.total : 0),
    0,
  );

  const recent = useMemo(
    () => [...orders.rows].sort((a, b) => millisOf(b.createdAt) - millisOf(a.createdAt)).slice(0, 6),
    [orders.rows],
  );

  const topRestaurants = useMemo(() => {
    const counts = new Map<string, number>();
    orders.rows.forEach((row) => {
      const name = text(row.restaurantName) || 'غير معروف';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    const list = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = list[0]?.[1] ?? 1;
    return { list, max };
  }, [orders.rows]);

  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <span>مطاعم ظاهرة</span>
          <strong>{visibleRestaurants}</strong>
          <em>من {restaurants.rows.length} مطعم</em>
        </div>
        <div className="kpi">
          <span>أصناف</span>
          <strong>{products.rows.length}</strong>
          <em>في الكتالوج</em>
        </div>
        <div className="kpi">
          <span>طلبات</span>
          <strong>{orders.rows.length}</strong>
          <em>{liveOrders} في الطريق</em>
        </div>
        <div className="kpi">
          <span>إيرادات مكتملة</span>
          <strong>{money(revenue)}</strong>
          <em>جنيه · {delivered.length} طلب</em>
        </div>
        <div className="kpi">
          <span>مستخدمين</span>
          <strong>{users.rows.length}</strong>
          <em>حسابات مسجّلة</em>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <span>أحدث الطلبات</span>
            <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
              لحظي
            </span>
          </div>
          {recent.length === 0 ? (
            <Empty title="مفيش طلبات لسه" note="أول طلب من التطبيق هيظهر هنا فورًا." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>المطعم</th>
                    <th>الأصناف</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="cell-title">{text(row.restaurantName) || 'طلب'}</div>
                      </td>
                      <td>{String(row.itemsCount ?? 0)}</td>
                      <td>{String(row.total ?? 0)} ج.م</td>
                      <td>
                        <StatusBadge status={text(row.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>المطاعم الأكثر طلبًا</span>
          </div>
          <div className="panel-body">
            {topRestaurants.list.length === 0 ? (
              <Empty title="مفيش بيانات" note="لما تيجي طلبات، الترتيب هيظهر هنا." />
            ) : (
              <div className="bars">
                {topRestaurants.list.map(([name, count]) => (
                  <div key={name}>
                    <div className="bar-label">
                      <span>{name}</span>
                      <span style={{ color: 'var(--olive)', fontWeight: 700 }}>{count}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.round((count / topRestaurants.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span>حالة المطاعم</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>المطعم</th>
                <th>التقييم</th>
                <th>التوصيل</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="thumb">{emojiFor(row.image)}</div>
                      <div>
                        <div className="cell-title">{text(row.name) || row.id}</div>
                        <div className="cell-sub">{text(row.cuisine)}</div>
                      </div>
                    </div>
                  </td>
                  <td>⭐ {String(row.rating ?? '—')}</td>
                  <td>{String(row.deliveryFee ?? 0)} ج.م</td>
                  <td>
                    <span className={`badge ${row.active === false ? 'off' : 'delivered'}`}>
                      {row.active === false ? 'مخفي' : 'ظاهر'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
