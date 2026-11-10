import { ResourcePage, type Column, type FieldDef } from './ResourcePage';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' ? value : 0);

const vehicleOptions = [
  { value: 'سكوتر', label: 'سكوتر' },
  { value: 'موتوسيكل', label: 'موتوسيكل' },
  { value: 'عربية', label: 'عربية' },
  { value: 'مشي', label: 'مشي (مساحات قريبة)' },
];

const fields: FieldDef[] = [
  { key: 'name', label: 'اسم المندوب', type: 'text', placeholder: 'أحمد مصطفى' },
  { key: 'phone', label: 'رقم الموبايل', type: 'text', placeholder: '01xxxxxxxxx' },
  { key: 'vehicle', label: 'المركبة', type: 'select', options: vehicleOptions },
  { key: 'zone', label: 'منطقة العمل', type: 'text', placeholder: 'أسوان · كورنيش النيل' },
  { key: 'rating', label: 'التقييم', type: 'number' },
  { key: 'deliveries', label: 'عدد التوصيلات', type: 'number' },
  { key: 'active', label: 'متاح للعمل', type: 'switch' },
];

const columns: Column[] = [
  {
    key: 'name',
    label: 'المندوب',
    render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="avatar">{text(row.name).charAt(0) || 'م'}</div>
        <div>
          <div className="cell-title">{text(row.name) || row.id}</div>
          <div className="cell-sub" dir="ltr">
            {text(row.phone) || '—'}
          </div>
        </div>
      </div>
    ),
  },
  { key: 'vehicle', label: 'المركبة' },
  { key: 'zone', label: 'المنطقة' },
  { key: 'rating', label: 'التقييم', render: (row) => `⭐ ${num(row.rating) || '—'}` },
  { key: 'deliveries', label: 'التوصيلات', render: (row) => String(num(row.deliveries)) },
  {
    key: 'active',
    label: 'الحالة',
    render: (row) =>
      row.active === false ? (
        <span className="badge off">موقوف</span>
      ) : (
        <span className="badge delivered">متاح</span>
      ),
  },
];

export function CouriersPage() {
  return (
    <ResourcePage
      collection="couriers"
      title="المندوبين"
      singular="مندوب"
      fields={fields}
      columns={columns}
      defaults={{
        name: '',
        phone: '',
        vehicle: 'سكوتر',
        zone: 'أسوان',
        rating: 4.5,
        deliveries: 0,
        active: true,
      }}
      searchKeys={['name', 'phone', 'zone']}
      summary={(rows) =>
        `${rows.filter((row) => row.active !== false).length} متاح من ${rows.length}`
      }
    />
  );
}
