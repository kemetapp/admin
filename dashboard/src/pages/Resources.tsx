import { emojiFor, FOOD_OPTIONS } from '../lib/food';
import { useCollectionDocs, type Doc } from '../lib/db';
import { ResourcePage, type Column, type FieldDef } from './ResourcePage';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' ? value : 0);

function visibility(row: Doc) {
  return row.active === false ? (
    <span className="badge off">مخفي</span>
  ) : (
    <span className="badge delivered">ظاهر</span>
  );
}

function nameCell(row: Doc, subtitle?: unknown) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="thumb">{emojiFor(row.image)}</div>
      <div>
        <div className="cell-title">{text(row.name) || row.id}</div>
        <div className="cell-sub">{text(subtitle)}</div>
      </div>
    </div>
  );
}

/* ------------------------------- المطاعم ------------------------------- */

const restaurantFields: FieldDef[] = [
  { key: 'name', label: 'اسم المطعم', type: 'text', placeholder: 'مطعم النوبة' },
  { key: 'cuisine', label: 'المطبخ', type: 'text', placeholder: 'نوبي · مشويات' },
  { key: 'tags', label: 'الوسوم (للبحث)', type: 'text', placeholder: 'نوبي · مشويات' },
  { key: 'image', label: 'الصورة', type: 'select', options: FOOD_OPTIONS },
  { key: 'rating', label: 'التقييم', type: 'number' },
  { key: 'reviews', label: 'عدد التقييمات', type: 'number' },
  { key: 'prep', label: 'وقت التجهيز', type: 'text', placeholder: '20–25 د' },
  { key: 'deliveryFee', label: 'رسوم التوصيل', type: 'number' },
  { key: 'sticker', label: 'ستيكر (اختياري)', type: 'text', placeholder: 'الأكثر طلبًا' },
  { key: 'menuTabs', label: 'تبويبات المنيو (بفاصلة)', type: 'list', placeholder: 'الأكثر طلبًا، المشويات' },
  { key: 'active', label: 'ظاهر في التطبيق', type: 'switch' },
];

const restaurantColumns: Column[] = [
  { key: 'name', label: 'المطعم', render: (row) => nameCell(row, row.cuisine) },
  { key: 'rating', label: 'التقييم', render: (row) => `⭐ ${num(row.rating)}` },
  { key: 'deliveryFee', label: 'التوصيل', render: (row) => `${num(row.deliveryFee)} ج.م` },
  { key: 'active', label: 'الحالة', render: visibility },
];

export function RestaurantsPage() {
  return (
    <ResourcePage
      collection="restaurants"
      title="المطاعم"
      singular="مطعم"
      fields={restaurantFields}
      columns={restaurantColumns}
      defaults={{
        name: '',
        cuisine: '',
        tags: '',
        image: 'grill',
        rating: 4.5,
        reviews: 0,
        prep: '20–30 د',
        deliveryFee: 15,
        sticker: '',
        menuTabs: ['الأكثر طلبًا'],
        active: true,
      }}
      searchKeys={['name', 'cuisine', 'tags']}
      summary={(rows) => `${rows.filter((row) => row.active !== false).length} ظاهر من ${rows.length}`}
    />
  );
}

/* ------------------------------- الأصناف ------------------------------- */

const productColumnsBase: Column[] = [
  { key: 'name', label: 'الصنف', render: (row) => nameCell(row, row.category) },
  { key: 'price', label: 'السعر', render: (row) => `${num(row.price)} ج.م` },
  { key: 'restaurantId', label: 'المطعم' },
];

export function ProductsPage() {
  const restaurants = useCollectionDocs('restaurants');
  const names = new Map(restaurants.rows.map((row) => [row.id, text(row.name) || row.id]));

  const fields: FieldDef[] = [
    {
      key: 'restaurantId',
      label: 'المطعم',
      type: 'select',
      options: restaurants.rows.map((row) => ({
        value: row.id,
        label: text(row.name) || row.id,
      })),
    },
    { key: 'name', label: 'اسم الصنف', type: 'text', placeholder: 'كفتة مشوية' },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'price', label: 'السعر', type: 'number' },
    { key: 'category', label: 'القسم داخل المنيو', type: 'text', placeholder: 'المشويات' },
    { key: 'serving', label: 'الحجم / التقديم', type: 'text', placeholder: '450 جم · تكفي شخصين' },
    { key: 'image', label: 'الصورة', type: 'select', options: FOOD_OPTIONS },
  ];

  const columns: Column[] = productColumnsBase.map((column) =>
    column.key === 'restaurantId'
      ? { ...column, render: (row: Doc) => names.get(text(row.restaurantId)) ?? '—' }
      : column,
  );

  return (
    <ResourcePage
      collection="products"
      title="الأصناف"
      singular="صنف"
      fields={fields}
      columns={columns}
      defaults={{
        restaurantId: restaurants.rows[0]?.id ?? '',
        name: '',
        description: '',
        price: 0,
        category: 'الأكثر طلبًا',
        serving: 'طبق فردي',
        image: 'grill',
      }}
      searchKeys={['name', 'category', 'description']}
      summary={(rows) => `${rows.length} صنف`}
    />
  );
}

/* ------------------------------- الأقسام ------------------------------- */

const categoryFields: FieldDef[] = [
  { key: 'label', label: 'اسم القسم', type: 'text', placeholder: 'مشويات' },
  { key: 'image', label: 'الصورة', type: 'select', options: FOOD_OPTIONS },
  { key: 'order', label: 'الترتيب', type: 'number' },
];

const categoryColumns: Column[] = [
  { key: 'label', label: 'القسم', render: (row) => nameCell(row, `ترتيب ${num(row.order)}`) },
  { key: 'image', label: 'مفتاح الصورة' },
];

export function CategoriesPage() {
  return (
    <ResourcePage
      collection="categories"
      title="الأقسام"
      singular="قسم"
      fields={categoryFields}
      columns={categoryColumns}
      defaults={{ label: '', image: 'grill', order: 1 }}
      searchKeys={['label']}
      summary={(rows) => `${rows.length} قسم`}
    />
  );
}

/* ------------------------------- العروض -------------------------------- */

const promoFields: FieldDef[] = [
  { key: 'title', label: 'العنوان', type: 'text', placeholder: 'خصم 25% على أول أوردر' },
  { key: 'kicker', label: 'السطر الصغير', type: 'text', placeholder: 'عرض الأسبوع' },
  { key: 'code', label: 'كود الخصم', type: 'text', placeholder: 'KEMET25' },
  { key: 'image', label: 'الصورة', type: 'select', options: FOOD_OPTIONS },
  { key: 'active', label: 'ظاهر في التطبيق', type: 'switch' },
];

const promoColumns: Column[] = [
  { key: 'title', label: 'العرض', render: (row) => nameCell(row, row.kicker) },
  { key: 'code', label: 'الكود' },
  { key: 'active', label: 'الحالة', render: visibility },
];

export function PromosPage() {
  return (
    <ResourcePage
      collection="promos"
      title="العروض"
      singular="عرض"
      fields={promoFields}
      columns={promoColumns}
      defaults={{ title: '', kicker: '', code: '', image: 'grill', active: true }}
      searchKeys={['title', 'kicker', 'code']}
      summary={(rows) => `${rows.filter((row) => row.active !== false).length} ظاهر من ${rows.length}`}
    />
  );
}
