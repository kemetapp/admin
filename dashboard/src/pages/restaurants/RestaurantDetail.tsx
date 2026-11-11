import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Btn, Empty, Icon, StatusBadge, ToastHost, useToast } from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { patchDoc, useCollectionDocs } from '../../lib/db';
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

type Tab =
  | 'overview'
  | 'basic'
  | 'menu'
  | 'orders'
  | 'ratings'
  | 'finance'
  | 'profits'
  | 'hours'
  | 'documents'
  | 'activity';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'basic', label: 'البيانات الأساسية' },
  { id: 'menu', label: 'قائمة الطعام' },
  { id: 'orders', label: 'الطلبات' },
  { id: 'ratings', label: 'التقييمات' },
  { id: 'finance', label: 'المعاملات المالية' },
  { id: 'profits', label: 'الأرباح والعمولات' },
  { id: 'hours', label: 'أوقات العمل' },
  { id: 'documents', label: 'المستندات' },
  { id: 'activity', label: 'سجل النشاطات' },
];

const money = (value: number) => Math.round(value).toLocaleString('ar-EG');

export function RestaurantDetail({
  row,
  onBack,
  onEdit,
}: {
  row: RestaurantRow;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const products = useCollectionDocs('products');
  const orders = useCollectionDocs('orders');
  const ratings = useCollectionDocs('ratings');
  const { toast, show } = useToast();

  const approval = approvalOf(row);
  const operating = operatingOf(row);

  const myOrders = useMemo(
    () => orders.rows.filter((order) => textOf(order.restaurantId) === row.id),
    [orders.rows, row.id],
  );

  const myProducts = useMemo(
    () => products.rows.filter((product) => textOf(product.restaurantId) === row.id),
    [products.rows, row.id],
  );

  const myRatings = useMemo(
    () => ratings.rows.filter((item) => textOf(item.restaurantId) === row.id),
    [ratings.rows, row.id],
  );

  const totals = useMemo(() => {
    const sales = myOrders.reduce((sum, order) => sum + numOf(order.total), 0);
    const delivered = myOrders.filter((order) => textOf(order.status) === 'delivered');
    const cancelled = myOrders.filter((order) => textOf(order.status) === 'cancelled');
    const commissionRate = numOf(row.commission) || 15;
    const commission = Math.round((sales * commissionRate) / 100);
    return {
      sales,
      delivered: delivered.length,
      cancelled: cancelled.length,
      commission,
      net: sales - commission,
    };
  }, [myOrders, row.commission]);

  const toggle = async (patch: Record<string, unknown>, message: string) => {
    try {
      await patchDoc('restaurants', row.id, patch);
      show(message);
    } catch {
      show('التحديث فشل', 'error');
    }
  };

  const exportStatement = () => {
    downloadCsv(
      `kemet-restaurant-${row.id}`,
      myOrders.map((order) => ({
        الطلب: order.id,
        الإجمالي: numOf(order.total),
        الحالة: textOf(order.status),
        التاريخ: millisOf(order.createdAt)
          ? new Date(millisOf(order.createdAt)).toLocaleString('ar-EG')
          : '',
      })),
    );
    show('تم تصدير كشف المطعم');
  };

  return (
    <>
      <div className="crumb">
        <button onClick={onBack} className="crumb-back">
          لوحة التحكم
        </button>
        <i>/</i>
        <button onClick={onBack} className="crumb-back">
          المطاعم
        </button>
        <i>/</i>
        <b>{textOf(row.name) || row.id}</b>
      </div>

      <section className="resto-hero">
        <div
          className="resto-cover"
          style={
            textOf(row.coverUrl)
              ? { backgroundImage: `url(${textOf(row.coverUrl)})` }
              : undefined
          }
        />
        <div className="resto-hero-body">
          <div className="resto-hero-logo">
            {textOf(row.logoUrl) ? (
              <img src={textOf(row.logoUrl)} alt="" />
            ) : (
              <span>{initialsOf(row)}</span>
            )}
          </div>
          <div className="resto-hero-info">
            <h2>{textOf(row.name) || row.id}</h2>
            <p>
              <span dir="ltr">#{row.id.slice(0, 8)}</span> · {textOf(row.cuisine) || 'بدون تصنيف'} ·{' '}
              {textOf(row.area) || 'منطقة غير محددة'}
            </p>
            <div className="badge-col" style={{ flexDirection: 'row', marginTop: 8 }}>
              <span className={`badge ${APPROVAL_TONE[approval]}`}>{APPROVAL_LABEL[approval]}</span>
              <span className={`badge ${OPERATING_TONE[operating]}`}>{OPERATING_LABEL[operating]}</span>
              <span className="badge live">⭐ {numOf(row.rating).toFixed(1)}</span>
            </div>
          </div>
          <div className="resto-hero-actions">
            <Btn onClick={onEdit}>
              <Icon name="edit" size={14} /> تعديل
            </Btn>
            {approval === 'pending' ? (
              <Btn
                variant="primary"
                onClick={() => void toggle({ approvalStatus: 'approved' }, 'تم الاعتماد')}
              >
                اعتماد
              </Btn>
            ) : null}
            <Btn
              onClick={() =>
                void toggle(
                  operating === 'active'
                    ? { operatingStatus: 'suspended', active: false }
                    : { operatingStatus: 'active', active: true },
                  operating === 'active' ? 'تم الإيقاف' : 'تم التفعيل',
                )
              }
            >
              {operating === 'active' ? 'إيقاف' : 'تفعيل'}
            </Btn>
          </div>
        </div>
      </section>

      <div className="stat-grid">
        {[
          { label: 'إجمالي الطلبات', value: myOrders.length },
          { label: 'مكتملة', value: totals.delivered },
          { label: 'ملغية', value: totals.cancelled },
          { label: 'إجمالي المبيعات', value: `${money(totals.sales)} ج.م` },
          { label: 'مستحقات المطعم', value: `${money(totals.net)} ج.م` },
          { label: 'عمولة المنصة', value: `${money(totals.commission)} ج.م` },
        ].map((card) => (
          <div key={card.label} className="stat-card static">
            <strong>{card.value}</strong>
            <span className="stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={`tab ${tab === item.id ? 'on' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="duo">
          <section className="panel">
            <div className="panel-head"><span>بيانات سريعة</span></div>
            <div className="panel-body">
              <ul className="status-list">
                <li><span>المالك</span><b>{textOf(row.ownerName) || '—'}</b></li>
                <li><span>الهاتف</span><b dir="ltr">{phoneOf(row) || '—'}</b></li>
                <li><span>البريد</span><b dir="ltr">{textOf(row.email) || '—'}</b></li>
                <li><span>العنوان</span><b>{textOf(row.address) || '—'}</b></li>
                <li><span>الحد الأدنى للطلب</span><b>{numOf(row.minOrder)} ج.م</b></li>
                <li><span>العمولة</span><b>{numOf(row.commission) || 15}%</b></li>
              </ul>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><span>آخر الطلبات</span></div>
            <div className="panel-body">
              {myOrders.length === 0 ? (
                <Empty title="مفيش طلبات" />
              ) : (
                <ul className="activity-list">
                  {myOrders.slice(0, 5).map((order) => (
                    <li key={order.id}>
                      <span className="activity-icon"><Icon name="orders" size={13} /></span>
                      <div>
                        <strong>طلب {order.id.slice(0, 6)}</strong>
                        <span>{money(numOf(order.total))} ج.م · {textOf(order.status)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'basic' ? (
        <section className="panel">
          <div className="panel-head"><span>البيانات الأساسية</span></div>
          <div className="panel-body">
            <ul className="status-list">
              <li><span>الاسم بالعربية</span><b>{textOf(row.name) || '—'}</b></li>
              <li><span>الاسم بالإنجليزية</span><b dir="ltr">{textOf(row.nameEn) || '—'}</b></li>
              <li><span>التصنيف</span><b>{textOf(row.cuisine) || '—'}</b></li>
              <li><span>الوصف</span><b>{textOf(row.description) || '—'}</b></li>
              <li><span>المحافظة</span><b>{textOf(row.city) || '—'}</b></li>
              <li><span>المنطقة</span><b>{textOf(row.area) || '—'}</b></li>
              <li><span>الإحداثيات</span><b dir="ltr">{row.lat !== undefined ? `${row.lat}, ${row.lng}` : '—'}</b></li>
              <li><span>تاريخ التسجيل</span><b>{millisOf(row.createdAt) ? new Date(millisOf(row.createdAt)).toLocaleDateString('ar-EG') : '—'}</b></li>
            </ul>
          </div>
        </section>
      ) : null}

      {tab === 'menu' ? (
        <section className="panel">
          <div className="panel-head"><span>قائمة الطعام ({myProducts.length})</span></div>
          <div className="panel-body">
            {myProducts.length === 0 ? (
              <Empty title="مفيش أصناف" note="ضيف أصناف من تبويب المنيو." />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr><th>الصنف</th><th>السعر</th><th>الفئة</th></tr>
                  </thead>
                  <tbody>
                    {myProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="cell-title">{textOf(product.name) || product.id}</td>
                        <td>{money(numOf(product.price))} ج.م</td>
                        <td>{textOf(product.category) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'orders' ? (
        <section className="panel">
          <div className="panel-head"><span>الطلبات ({myOrders.length})</span></div>
          <div className="panel-body">
            {myOrders.length === 0 ? (
              <Empty title="مفيش طلبات" />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr><th>الطلب</th><th>الإجمالي</th><th>الحالة</th><th>التاريخ</th></tr>
                  </thead>
                  <tbody>
                    {myOrders.slice(0, 30).map((order) => (
                      <tr key={order.id}>
                        <td className="cell-title" dir="ltr">{order.id.slice(0, 8)}</td>
                        <td>{money(numOf(order.total))} ج.م</td>
                        <td><StatusBadge status={textOf(order.status)} /></td>
                        <td>{millisOf(order.createdAt) ? new Date(millisOf(order.createdAt)).toLocaleDateString('ar-EG') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'ratings' ? (
        <section className="panel">
          <div className="panel-head"><span>التقييمات ({myRatings.length})</span></div>
          <div className="panel-body">
            {myRatings.length === 0 ? (
              <Empty title="مفيش تقييمات" note="التقييمات بتظهر بعد توصيل الطلبات." />
            ) : (
              <ul className="activity-list">
                {myRatings.map((item) => (
                  <li key={item.id}>
                    <span className="activity-icon"><Icon name="star" size={13} /></span>
                    <div>
                      <strong>⭐ {numOf(item.rating)} / 5</strong>
                      <span>{textOf(item.comment) || 'بدون تعليق'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'finance' || tab === 'profits' ? (
        <div className="duo">
          <section className="panel">
            <div className="panel-head"><span>ملخص مالي</span></div>
            <div className="panel-body">
              <ul className="status-list">
                <li><span>إجمالي المبيعات</span><b>{money(totals.sales)} ج.م</b></li>
                <li><span>نسبة العمولة</span><b>{numOf(row.commission) || 15}%</b></li>
                <li><span>عمولة المنصة</span><b>{money(totals.commission)} ج.م</b></li>
                <li><span>صافي مستحقات المطعم</span><b>{money(totals.net)} ج.م</b></li>
                <li><span>عدد العمليات</span><b>{myOrders.length}</b></li>
              </ul>
              <Btn size="sm" onClick={exportStatement} style={{ marginTop: 10 }}>
                تصدير كشف الحساب
              </Btn>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><span>التسوية المالية</span></div>
            <div className="panel-body">
              <ul className="status-list">
                <li><span>IBAN</span><b dir="ltr">{textOf(row.settlementIban) || '—'}</b></li>
                <li><span>الضريبة</span><b>{numOf(row.taxPercent)}%</b></li>
              </ul>
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'hours' ? (
        <section className="panel">
          <div className="panel-head"><span>أوقات العمل</span></div>
          <div className="panel-body">
            {row.workingHours ? (
              <ul className="status-list">
                {Object.entries(row.workingHours).map(([day, value]) => (
                  <li key={day}>
                    <span>{day}</span>
                    <b dir="ltr">
                      {value?.closed ? 'مغلق' : `${value?.open ?? '—'} → ${value?.close ?? '—'}`}
                    </b>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="أوقات العمل غير محددة" note="اضبطها من زر التعديل." />
            )}
          </div>
        </section>
      ) : null}

      {tab === 'documents' ? (
        <section className="panel">
          <div className="panel-head"><span>المستندات والتراخيص</span></div>
          <div className="panel-body">
            {Array.isArray(row.documents) && row.documents.length > 0 ? (
              <ul className="activity-list">
                {row.documents.map((doc, index) => (
                  <li key={`${doc.name}-${index}`}>
                    <span className="activity-icon"><Icon name="content" size={13} /></span>
                    <div>
                      <strong>{doc.name || 'مستند'}</strong>
                      <span dir="ltr">{doc.url || 'بدون ملف'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="مفيش مستندات" note="ارفعها من زر التعديل → تبويب المستندات." />
            )}
          </div>
        </section>
      ) : null}

      {tab === 'activity' ? (
        <section className="panel">
          <div className="panel-head"><span>سجل النشاطات</span></div>
          <div className="panel-body">
            <ul className="activity-list timeline">
              <li>
                <span className="activity-icon"><Icon name="check" size={13} /></span>
                <div>
                  <strong>حالة الاعتماد: {APPROVAL_LABEL[approval]}</strong>
                  <span>حالة التشغيل: {OPERATING_LABEL[operating]}</span>
                </div>
              </li>
              <li>
                <span className="activity-icon"><Icon name="orders" size={13} /></span>
                <div>
                  <strong>{myOrders.length} طلب مسجّل</strong>
                  <span>آخر تحديث من قاعدة البيانات</span>
                </div>
              </li>
            </ul>
          </div>
        </section>
      ) : null}

      <ToastHost toast={toast} />
    </>
  );
}
