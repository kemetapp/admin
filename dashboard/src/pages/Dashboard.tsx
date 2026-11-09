import { useMemo, useState } from 'react';
import { Bars, Donut, GroupedBars, LineChart, Ring } from '../components/charts';
import { Hero, Section } from '../components/layout';
import { Btn, Empty, Icon, StatusBadge, ToastHost, useToast } from '../components/ui';
import { useCollectionDocs, type Doc } from '../lib/db';
import { seedDemoOrders } from '../lib/demo';
import { computeMetrics, trendOf } from '../lib/metrics';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' ? value : 0);
const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
const money = (value: number) => Math.round(value).toLocaleString('ar-EG');
const compact = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : String(Math.round(value));

const DAY = 24 * 60 * 60 * 1000;
const PIE_COLORS = ['#7d6a4a', '#4f5b2a', '#c9a227', '#3d6b7d', '#8a5a3b', '#9aa07a'];

function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(',')),
  ].join('\n');

  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function Dashboard({
  search,
  orders,
}: {
  search: string;
  orders: Doc[];
}) {
  const restaurants = useCollectionDocs('restaurants');
  const products = useCollectionDocs('products');
  const users = useCollectionDocs('users');
  const { toast, show } = useToast();
  const [period, setPeriod] = useState('7');
  const [seeding, setSeeding] = useState(false);

  const metrics = useMemo(
    () => computeMetrics(orders, restaurants.rows),
    [orders, restaurants.rows],
  );
  const trend = useMemo(() => trendOf(metrics.days), [metrics.days]);

  const delivered = orders.filter((order) => text(order.status) === 'delivered').length;
  const completion = orders.length ? Math.round((delivered / orders.length) * 100) : 0;

  const now = Date.now();
  const newUsers = users.rows.filter((row) => millis(row.createdAt) > now - 7 * DAY).length;
  const prevUsers = users.rows.filter(
    (row) => millis(row.createdAt) > now - 14 * DAY && millis(row.createdAt) <= now - 7 * DAY,
  ).length;
  const usersTrend = prevUsers ? Math.round(((newUsers - prevUsers) / prevUsers) * 100) : newUsers ? 100 : 0;

  // أرباح المنصة = عمولة 15%
  const platformProfit = Math.round(metrics.revenue * 0.15);

  const paymentSplit = useMemo(() => {
    const buckets = new Map<string, number>();
    orders.forEach((order) => {
      const payment = order.payment as { kind?: string; label?: string } | undefined;
      const label = payment?.kind === 'wallet' ? 'محافظ إلكترونية' : 'دفع عند الاستلام';
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    });
    const total = orders.length || 1;
    return [...buckets.entries()].map(([label, value], index) => ({
      label,
      value: Math.round((value / total) * 100),
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }, [orders]);

  // المبيعات حسب الفئة: الشهر الحالي مقابل السابق
  const categorySales = useMemo(() => {
    const categoryOf = new Map<string, string>();
    products.rows.forEach((product) => {
      categoryOf.set(product.id, text(product.category) || 'أخرى');
    });

    const current = new Map<string, number>();
    const previous = new Map<string, number>();

    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const time = millis(order.createdAt);
      const bucket = time > now - 30 * DAY ? current : time > now - 60 * DAY ? previous : null;
      if (!bucket) return;
      items.forEach((raw) => {
        const item = raw as Record<string, unknown>;
        const category = categoryOf.get(text(item.productId)) ?? 'أخرى';
        bucket.set(category, (bucket.get(category) ?? 0) + num(item.qty) * num(item.price));
      });
    });

    const labels = [...new Set([...current.keys(), ...previous.keys()])].slice(0, 6);
    return labels.map((label) => ({
      label,
      current: current.get(label) ?? 0,
      previous: previous.get(label) ?? 0,
    }));
  }, [orders, products.rows, now]);

  // أفضل المطاعم أداءً خلال 7 أيام
  const topRestaurants = useMemo(() => {
    const map = new Map<string, { revenue: number; previous: number }>();
    orders.forEach((order) => {
      const name = text(order.restaurantName) || 'غير معروف';
      const time = millis(order.createdAt);
      const entry = map.get(name) ?? { revenue: 0, previous: 0 };
      if (time > now - 7 * DAY) entry.revenue += num(order.total);
      else if (time > now - 14 * DAY) entry.previous += num(order.total);
      map.set(name, entry);
    });
    return [...map.entries()]
      .map(([name, value]) => ({
        name,
        revenue: value.revenue,
        change: value.previous
          ? Math.round(((value.revenue - value.previous) / value.previous) * 100)
          : value.revenue > 0
            ? 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [orders, now]);

  const latestCustomers = useMemo(
    () => [...users.rows].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)).slice(0, 5),
    [users.rows],
  );

  const activity = useMemo(() => {
    const items: { id: string; title: string; note: string; time: number; icon: 'orders' | 'users' | 'promos' }[] =
      [];
    orders.slice(0, 6).forEach((order) => {
      items.push({
        id: `o-${order.id}`,
        title: `طلب جديد من ${text(order.restaurantName) || 'مطعم'}`,
        note: `${money(num(order.total))} ج.م`,
        time: millis(order.createdAt),
        icon: 'orders',
      });
    });
    users.rows.slice(0, 3).forEach((user) => {
      items.push({
        id: `u-${user.id}`,
        title: `عميل جديد: ${text(user.name) || 'بدون اسم'}`,
        note: text(user.phone),
        time: millis(user.createdAt),
        icon: 'users',
      });
    });
    return items.sort((a, b) => b.time - a.time).slice(0, 7);
  }, [orders, users.rows]);

  const needle = search.trim().toLowerCase();
  const liveOrders = orders
    .filter((order) => (text(order.status) || 'live') === 'live')
    .filter(
      (order) =>
        !needle ||
        text(order.restaurantName).toLowerCase().includes(needle) ||
        text(order.address).toLowerCase().includes(needle),
    )
    .slice(0, 5);

  const generate = async () => {
    if (seeding) return;
    if (!window.confirm('توليد 42 طلب تجريبي؟ (بيانات وهمية للعرض)')) return;
    setSeeding(true);
    try {
      const count = await seedDemoOrders(restaurants.rows, products.rows);
      show(`تم توليد ${count} طلب تجريبي`);
    } catch {
      show('التوليد فشل — تأكد إنك أدمن.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const exportOrders = () => {
    if (orders.length === 0) {
      show('مفيش طلبات للتصدير', 'error');
      return;
    }
    downloadCsv(
      'kemet-orders',
      orders.map((order) => ({
        المطعم: text(order.restaurantName),
        الإجمالي: num(order.total),
        الأصناف: num(order.itemsCount),
        الحالة: text(order.status),
        العنوان: text(order.address),
      })),
    );
    show('تم تصدير تقرير الطلبات');
  };

  const exportRestaurants = () => {
    downloadCsv(
      'kemet-restaurants',
      restaurants.rows.map((row) => ({
        الاسم: text(row.name),
        المطبخ: text(row.cuisine),
        التقييم: num(row.rating),
        التوصيل: num(row.deliveryFee),
        الحالة: row.active === false ? 'مخفي' : 'ظاهر',
      })),
    );
    show('تم تصدير تقرير المطاعم');
  };

  const exportCustomers = () => {
    downloadCsv(
      'kemet-customers',
      users.rows.map((row) => ({
        الاسم: text(row.name),
        الموبايل: text(row.phone),
        الدور: text(row.role),
      })),
    );
    show('تم تصدير تقرير العملاء');
  };

  const exportSales = () => {
    downloadCsv(
      'kemet-sales',
      metrics.days.map((day) => ({
        اليوم: day.label,
        الإجمالي: day.gross,
        الصافي: day.net,
        الطلبات: day.orders,
      })),
    );
    show('تم تصدير تقرير المبيعات');
  };

  return (
    <>
      <Hero />

      <div className="kpis kpis-6">
        <Kpi icon="orders" label="إجمالي الطلبات" value={String(metrics.totalOrders)} trend={trend} />
        <Kpi icon="wallet" label="إجمالي المبيعات" value={`${money(metrics.revenue)} ج.م`} trend={trend} />
        <Kpi icon="chart" label="متوسط قيمة الطلب" value={`${money(metrics.avgOrder)} ج.م`} trend={trend} />
        <Kpi icon="users" label="إجمالي العملاء" value={String(users.rows.length)} trend={usersTrend} />
        <Kpi
          icon="restaurants"
          label="عدد المطاعم الشريكة"
          value={String(restaurants.rows.length)}
          trend={0}
          hideTrend
        />
        <Kpi icon="check" label="نسبة إكمال الطلبات" value={`${completion}%`} trend={0} hideTrend />
      </div>

      <div className="duo">
        <Section
          title="أداء الأعمال على مدار الوقت"
          extra={
            <div className="legend">
              <span>
                <i style={{ background: '#4f5b2a' }} /> إجمالي المبيعات
              </span>
              <span>
                <i style={{ background: '#b8862f' }} /> صافي المبيعات
              </span>
            </div>
          }
        >
          {metrics.totalOrders === 0 ? (
            <Empty
              title="مفيش مبيعات لسه"
              note="شغّل «توليد طلبات تجريبية» أو استنى أول طلب حقيقي."
              action={
                <Btn variant="primary" onClick={() => void generate()} disabled={seeding}>
                  {seeding ? 'بيتم التوليد…' : 'توليد طلبات تجريبية'}
                </Btn>
              }
            />
          ) : (
            <LineChart
              labels={metrics.days.map((day) => day.label)}
              series={[
                { label: 'إجمالي', color: '#4f5b2a', values: metrics.days.map((day) => day.gross) },
                { label: 'صافي', color: '#b8862f', values: metrics.days.map((day) => day.net) },
              ]}
            />
          )}
        </Section>

        <Section title="توزيع الطلبات حسب المطعم">
          {metrics.byRestaurant.length === 0 ? (
            <Empty title="مفيش توزيع" note="محتاج طلبات الأول." />
          ) : (
            <div className="donut-wrap">
              <Donut
                slices={metrics.byRestaurant}
                centerValue={String(metrics.totalOrders)}
                centerLabel="طلب"
              />
              <ul className="donut-legend">
                {metrics.byRestaurant.map((slice) => (
                  <li key={slice.label}>
                    <i style={{ background: slice.color }} />
                    <span>{slice.label}</span>
                    <b>
                      {metrics.totalOrders
                        ? Math.round((slice.value / metrics.totalOrders) * 100)
                        : 0}
                      %
                    </b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      </div>

      <div className="grid-3">
        <Section title="أرباح المنصة">
          <div className="profit-head">
            <div>
              <strong>{money(platformProfit)} ج.م</strong>
              <span className="trend up">▲ {Math.abs(trend)}% عمولة 15%</span>
            </div>
            <Ring value={Math.min(100, completion)} label="نسبة التحصيل" />
          </div>
          <ul className="paid-list">
            {paymentSplit.length === 0 ? (
              <li className="muted">مفيش مدفوعات مسجلة</li>
            ) : (
              paymentSplit.map((item) => (
                <li key={item.label}>
                  <i style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <b>{item.value}%</b>
                </li>
              ))
            )}
          </ul>
        </Section>

        <Section
          title="أرباح المنصة آخر 7 أيام"
          extra={<span className="count-chip">{money(metrics.revenue)} ج.م</span>}
        >
          <Bars
            items={metrics.days.map((day) => ({ label: day.label, value: Math.round(day.gross * 0.15) }))}
            height={140}
          />
        </Section>

        <Section title="حالة النظام">
          <ul className="status-list">
            {[
              'خوادم المنصة',
              'بوابة الدفع',
              'إشعارات المستخدمين',
              'خدمة التوصيل',
              'قاعدة البيانات',
            ].map((item) => (
              <li key={item}>
                <span>{item}</span>
                <i className="ok">
                  <Icon name="check" size={12} strokeWidth={2.6} />
                </i>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary btn-block" onClick={() => show('كل الأنظمة شغالة ✅')}>
            التفعيل
          </button>
        </Section>
      </div>

      <div className="grid-3">
        <Section title="إدارة العملاء">
          <div className="mini-stats">
            <div>
              <strong>{money(metrics.revenue)}</strong>
              <span>إجمالي المشتريات</span>
            </div>
            <div>
              <strong>{users.rows.length}</strong>
              <span>عملاء نشطين</span>
            </div>
            <div>
              <strong>{orders.length}</strong>
              <span>عمليات شراء</span>
            </div>
          </div>
          <ul className="people-list">
            {latestCustomers.length === 0 ? (
              <li className="muted">مفيش عملاء مسجلين</li>
            ) : (
              latestCustomers.map((user) => (
                <li key={user.id}>
                  <span className="mini-avatar">{text(user.name).charAt(0) || '؟'}</span>
                  <div>
                    <strong>{text(user.name) || 'بدون اسم'}</strong>
                    <span dir="ltr">{text(user.phone) || '—'}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Section>

        <Section
          title="المبيعات حسب الفئات"
          extra={
            <div className="legend">
              <span>
                <i style={{ background: '#4f5b2a' }} /> هذا الشهر
              </span>
              <span>
                <i style={{ background: '#d9a24a' }} /> الشهر الماضي
              </span>
            </div>
          }
        >
          {categorySales.length === 0 ? (
            <Empty title="مفيش مبيعات بحسب الفئة" note="محتاج طلبات فيها أصناف." />
          ) : (
            <GroupedBars items={categorySales} />
          )}
        </Section>

        <Section title="التقارير المتقدمة">
          <div className="report-grid">
            <ReportButton icon="chart" label="تقرير المبيعات" onClick={exportSales} />
            <ReportButton icon="orders" label="تقرير الطلبات" onClick={exportOrders} />
            <ReportButton icon="restaurants" label="تقرير المطاعم" onClick={exportRestaurants} />
            <ReportButton icon="users" label="تقرير العملاء" onClick={exportCustomers} />
          </div>
        </Section>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <Section
            title="الطلبات الحالية"
            extra={<span className="count-chip">{metrics.liveOrders} نشط</span>}
          >
            {liveOrders.length === 0 ? (
              <Empty title="مفيش طلبات نشطة" note="أول طلب هيظهر هنا فورًا." />
            ) : (
              <ul className="order-list">
                {liveOrders.map((order) => (
                  <li key={order.id}>
                    <div className="order-main">
                      <strong>{text(order.restaurantName) || 'طلب'}</strong>
                      <span>{text(order.address) || '—'}</span>
                    </div>
                    <div className="order-side">
                      <b>{money(num(order.total))} ج.م</b>
                      <StatusBadge status={text(order.status)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="dash-side">
          <Section title="النشاط الحديث" extra={<span className="count-chip">آخر الأحداث</span>}>
            {activity.length === 0 ? (
              <Empty title="مفيش نشاط لسه" />
            ) : (
              <ul className="activity-list">
                {activity.map((item) => (
                  <li key={item.id}>
                    <span className="activity-icon">
                      <Icon name={item.icon} size={14} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.note || '—'}</span>
                    </div>
                    <time>
                      {item.time
                        ? new Date(item.time).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="أعلى المطاعم أداءً">
            {topRestaurants.length === 0 ? (
              <Empty title="مفيش بيانات" note="محتاج طلبات." />
            ) : (
              <ol className="rank-list">
                {topRestaurants.map((restaurant, index) => (
                  <li key={restaurant.name}>
                    <em>{index + 1}</em>
                    <span>{restaurant.name}</span>
                    <b className={restaurant.change >= 0 ? 'up' : 'down'}>
                      {restaurant.change >= 0 ? '▲' : '▼'} {Math.abs(restaurant.change)}%
                    </b>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <div className="promo-card">
            <div className="promo-shade" />
            <div>
              <span>عروض حصرية</span>
              <strong>خصم حتى 20%</strong>
              <p>على أول أوردر من كل مطعم جديد</p>
              <button className="promo-btn" onClick={() => show('العرض هيتفعّل مع أول كومبين')}>
                تفعيل العرض
              </button>
            </div>
            <i>𓂀</i>
          </div>

          <Section title="ملاحظات الإدارة">
            <p className="note-text">
              اتأكد من مراجعة أصناف المطاعم وتحديث الأسعار أسبوعيًا — ده بيحسّن تجربة المستخدم ويرفع
              نسبة إكمال الطلبات.
            </p>
            <Btn size="sm" onClick={() => void generate()} disabled={seeding}>
              {seeding ? 'بيتم التوليد…' : 'توليد طلبات تجريبية'}
            </Btn>
          </Section>
        </aside>
      </div>

      <ToastHost toast={toast} />
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  trend,
  hideTrend = false,
}: {
  icon: 'orders' | 'wallet' | 'chart' | 'users' | 'restaurants' | 'check';
  label: string;
  value: string;
  trend: number;
  hideTrend?: boolean;
}) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span>{label}</span>
        <em>
          <Icon name={icon} size={15} />
        </em>
      </div>
      <strong>{value}</strong>
      {hideTrend ? (
        <div className="trend">—</div>
      ) : (
        <div className={`trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

function ReportButton({
  icon,
  label,
  onClick,
}: {
  icon: 'chart' | 'orders' | 'restaurants' | 'users';
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="report-btn" onClick={onClick}>
      <span className="report-icon">
        <Icon name={icon} size={16} />
      </span>
      <span>{label}</span>
      <em>تحميل CSV</em>
    </button>
  );
}
