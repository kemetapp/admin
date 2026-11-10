import { useMemo, useState } from 'react';
import { Bars, Donut, LineChart } from '../components/charts';
import { PageHeader, Section } from '../components/layout';
import { Btn, Empty, StatusBadge, ToastHost, useToast } from '../components/ui';
import { useCollectionDocs } from '../lib/db';
import { downloadCsv } from '../lib/csv';
import { computeMetrics, trendOf } from '../lib/metrics';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' ? value : 0);
const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
const money = (value: number) => Math.round(value).toLocaleString('ar-EG');

const DAY = 24 * 60 * 60 * 1000;

const RANGES = [
  { id: '7', label: 'آخر 7 أيام', days: 7 },
  { id: '30', label: 'آخر 30 يوم', days: 30 },
  { id: '90', label: 'آخر 90 يوم', days: 90 },
];

export function ReportsPage() {
  const orders = useCollectionDocs('orders');
  const restaurants = useCollectionDocs('restaurants');
  const products = useCollectionDocs('products');
  const { toast, show } = useToast();
  const [range, setRange] = useState('30');

  const days = RANGES.find((item) => item.id === range)?.days ?? 30;
  const since = Date.now() - days * DAY;

  const scoped = useMemo(
    () => orders.rows.filter((order) => millis(order.createdAt) >= since),
    [orders.rows, since],
  );

  const metrics = useMemo(
    () => computeMetrics(scoped, restaurants.rows),
    [scoped, restaurants.rows],
  );
  const trend = useMemo(() => trendOf(metrics.days), [metrics.days]);

  const statusSplit = useMemo(() => {
    const delivered = scoped.filter((row) => row.status === 'delivered').length;
    const live = scoped.filter((row) => (text(row.status) || 'live') === 'live').length;
    const cancelled = scoped.filter((row) => row.status === 'cancelled').length;
    return [
      { label: 'مكتمل', value: delivered, color: '#4f5b2a' },
      { label: 'في الطريق', value: live, color: '#d9a24a' },
      { label: 'ملغي', value: cancelled, color: '#b4562f' },
    ].filter((slice) => slice.value > 0);
  }, [scoped]);

  const byCity = useMemo(() => {
    const map = new Map<string, number>();
    scoped.forEach((order) => {
      const key = text(order.address) || 'غير محدد';
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  }, [scoped]);

  const exportSales = () => {
    const ok = downloadCsv(
      `kemet-sales-${days}d`,
      metrics.days.map((day) => ({
        اليوم: day.label,
        الإجمالي: day.gross,
        الصافي: day.net,
        الطلبات: day.orders,
      })),
    );
    show(ok ? 'تم تصدير تقرير المبيعات' : 'مفيش بيانات للتصدير', ok ? 'ok' : 'error');
  };

  const exportOrders = () => {
    const ok = downloadCsv(
      `kemet-orders-${days}d`,
      scoped.map((order) => ({
        المطعم: text(order.restaurantName),
        الإجمالي: num(order.total),
        الأصناف: num(order.itemsCount),
        الحالة: text(order.status),
        العنوان: text(order.address),
        التاريخ: order.createdAt ? new Date(millis(order.createdAt)).toLocaleString('ar-EG') : '',
      })),
    );
    show(ok ? 'تم تصدير تقرير الطلبات' : 'مفيش بيانات للتصدير', ok ? 'ok' : 'error');
  };

  const exportProducts = () => {
    const ok = downloadCsv(
      `kemet-products-${days}d`,
      metrics.topProducts.map((product) => ({
        الصنف: product.name,
        الكمية: product.count,
        الإيراد: product.revenue,
      })),
    );
    show(ok ? 'تم تصدير تقرير الأصناف' : 'مفيش بيانات للتصدير', ok ? 'ok' : 'error');
  };

  return (
    <>
      <PageHeader
        title="التقارير والتحليلات"
        note={`${scoped.length} طلب في الفترة المختارة`}
        actions={
          <div className="seg">
            {RANGES.map((item) => (
              <button
                key={item.id}
                className={range === item.id ? 'on' : ''}
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="kpis">
        <div className="kpi">
          <div className="kpi-top">
            <span>إجمالي المبيعات</span>
            <em>💰</em>
          </div>
          <strong>{money(metrics.revenue)} ج.م</strong>
          <div className={`trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <span>صافي المبيعات</span>
            <em>📈</em>
          </div>
          <strong>{money(metrics.net)} ج.م</strong>
          <div className="trend">بعد عمولة 15%</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <span>الطلبات</span>
            <em>🧾</em>
          </div>
          <strong>{metrics.totalOrders}</strong>
          <div className="trend">{metrics.liveOrders} نشط</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <span>متوسط الطلب</span>
            <em>🛍️</em>
          </div>
          <strong>{money(metrics.avgOrder)} ج.م</strong>
          <div className="trend">لكل طلب</div>
        </div>
      </div>

      <div className="duo">
        <Section
          title="المبيعات على مدار الفترة"
          extra={
            <div className="legend">
              <span>
                <i style={{ background: '#4f5b2a' }} /> إجمالي
              </span>
              <span>
                <i style={{ background: '#b8862f' }} /> صافي
              </span>
            </div>
          }
        >
          {metrics.totalOrders === 0 ? (
            <Empty title="مفيش بيانات في الفترة دي" note="جرّب فترة أطول أو ولّد طلبات تجريبية." />
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

        <Section title="توزيع حالات الطلبات">
          {statusSplit.length === 0 ? (
            <Empty title="مفيش طلبات" />
          ) : (
            <div className="donut-wrap">
              <Donut
                slices={statusSplit}
                centerValue={String(metrics.totalOrders)}
                centerLabel="طلب"
              />
              <ul className="donut-legend">
                {statusSplit.map((slice) => (
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
        <Section title="الطلبات آخر 7 أيام">
          <Bars items={metrics.days.map((day) => ({ label: day.label, value: day.orders }))} />
        </Section>

        <Section title="أكثر الأصناف مبيعًا">
          {metrics.topProducts.length === 0 ? (
            <Empty title="مفيش أصناف مبيعة" />
          ) : (
            <ol className="rank-list">
              {metrics.topProducts.map((product, index) => (
                <li key={product.name}>
                  <em>{index + 1}</em>
                  <span>{product.name}</span>
                  <b>{product.count}×</b>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="التوزيع حسب العنوان">
          {byCity.length === 0 ? (
            <Empty title="مفيش بيانات" />
          ) : (
            <ul className="rank-list">
              {byCity.map((item) => (
                <li key={item.label}>
                  <em>📍</em>
                  <span>{item.label}</span>
                  <b>{item.value}</b>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="تصدير التقارير">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <Btn onClick={exportSales}>
            📊 تقرير المبيعات
          </Btn>
          <Btn onClick={exportOrders}>
            🧾 تقرير الطلبات
          </Btn>
          <Btn onClick={exportProducts}>
            🍽️ تقرير الأصناف
          </Btn>
          <span style={{ marginInlineStart: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            {products.rows.length} صنف في الكتالوج
          </span>
        </div>
      </Section>

      <ToastHost toast={toast} />
    </>
  );
}
