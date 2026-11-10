import { useMemo } from 'react';
import { Donut } from '../components/charts';
import { PageHeader, Section } from '../components/layout';
import { Btn, Empty, StatusBadge, ToastHost, useToast } from '../components/ui';
import { downloadCsv } from '../lib/csv';
import { useCollectionDocs } from '../lib/db';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' ? value : 0);
const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
const money = (value: number) => Math.round(value).toLocaleString('ar-EG');

const COMMISSION = 0.15;

export function FinancePage() {
  const orders = useCollectionDocs('orders');
  const { toast, show } = useToast();

  const paid = useMemo(
    () => orders.rows.filter((row) => text(row.status) !== 'cancelled'),
    [orders.rows],
  );

  const collected = paid.reduce((sum, row) => sum + num(row.total), 0);
  const commission = Math.round(collected * COMMISSION);
  const restaurantsDue = collected - commission;

  const walletTotal = paid
    .filter((row) => (row.payment as { kind?: string } | undefined)?.kind === 'wallet')
    .reduce((sum, row) => sum + num(row.total), 0);
  const cashTotal = collected - walletTotal;

  const split = [
    { label: 'كاش عند الاستلام', value: Math.round(cashTotal), color: '#4f5b2a' },
    { label: 'محافظ إلكترونية', value: Math.round(walletTotal), color: '#d9a24a' },
  ].filter((slice) => slice.value > 0);

  const transactions = useMemo(
    () => [...paid].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)).slice(0, 40),
    [paid],
  );

  const exportLedger = () => {
    const ok = downloadCsv(
      'kemet-ledger',
      transactions.map((row) => ({
        المطعم: text(row.restaurantName),
        الإجمالي: num(row.total),
        العمولة: Math.round(num(row.total) * COMMISSION),
        مستحق_المطعم: Math.round(num(row.total) * (1 - COMMISSION)),
        طريقة_الدفع: text((row.payment as { label?: string } | undefined)?.label) || '—',
        الحالة: text(row.status),
      })),
    );
    show(ok ? 'تم تصدير كشف الحساب' : 'مفيش عمليات للتصدير', ok ? 'ok' : 'error');
  };

  return (
    <>
      <PageHeader
        title="المعاملات المالية"
        note={`${paid.length} عملية · عمولة المنصة ${COMMISSION * 100}%`}
        actions={<Btn onClick={exportLedger}>📤 تصدير كشف الحساب</Btn>}
      />

      <div className="kpis">
        <div className="kpi">
          <div className="kpi-top">
            <span>إجمالي المحصّل</span>
            <em>💰</em>
          </div>
          <strong>{money(collected)} ج.م</strong>
          <div className="trend up">من {paid.length} عملية</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <span>عمولة المنصة</span>
            <em>🏛️</em>
          </div>
          <strong>{money(commission)} ج.م</strong>
          <div className="trend">{COMMISSION * 100}% من المحصّل</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <span>مستحقات المطاعم</span>
            <em>🏪</em>
          </div>
          <strong>{money(restaurantsDue)} ج.م</strong>
          <div className="trend">{(1 - COMMISSION) * 100}% من المحصّل</div>
        </div>
        <div className="kpi">
          <div className="kpi-top">
            <span>متوسط العملية</span>
            <em>🧾</em>
          </div>
          <strong>{paid.length ? money(collected / paid.length) : '0'} ج.م</strong>
          <div className="trend">لكل طلب</div>
        </div>
      </div>

      <div className="duo">
        <Section title="توزيع طرق الدفع">
          {split.length === 0 ? (
            <Empty title="مفيش مدفوعات" note="محتاج طلبات الأول." />
          ) : (
            <div className="donut-wrap">
              <Donut slices={split} centerValue={money(collected)} centerLabel="ج.م" />
              <ul className="donut-legend">
                {split.map((slice) => (
                  <li key={slice.label}>
                    <i style={{ background: slice.color }} />
                    <span>{slice.label}</span>
                    <b>{money(slice.value)} ج.م</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section title="ملخص سريع">
          <ul className="status-list">
            <li>
              <span>كاش عند الاستلام</span>
              <b>{money(cashTotal)} ج.م</b>
            </li>
            <li>
              <span>محافظ إلكترونية</span>
              <b>{money(walletTotal)} ج.م</b>
            </li>
            <li>
              <span>الطلبات الملغية</span>
              <b>{orders.rows.length - paid.length}</b>
            </li>
            <li>
              <span>صافي بعد العمولة</span>
              <b>{money(restaurantsDue)} ج.م</b>
            </li>
          </ul>
        </Section>
      </div>

      <Section title="آخر العمليات">
        {transactions.length === 0 ? (
          <Empty title="مفيش عمليات مالية" note="أول طلب هيظهر هنا." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>المطعم</th>
                  <th>الإجمالي</th>
                  <th>العمولة</th>
                  <th>مستحق المطعم</th>
                  <th>الدفع</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => (
                  <tr key={row.id}>
                    <td className="cell-title">{text(row.restaurantName) || 'طلب'}</td>
                    <td>{money(num(row.total))} ج.م</td>
                    <td>{money(num(row.total) * COMMISSION)} ج.م</td>
                    <td>{money(num(row.total) * (1 - COMMISSION))} ج.م</td>
                    <td>{text((row.payment as { label?: string } | undefined)?.label) || '—'}</td>
                    <td>
                      <StatusBadge status={text(row.status)} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {millis(row.createdAt)
                        ? new Date(millis(row.createdAt)).toLocaleDateString('ar-EG')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <ToastHost toast={toast} />
    </>
  );
}
