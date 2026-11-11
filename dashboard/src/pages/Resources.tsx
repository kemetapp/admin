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

/**
 * صفحة المطاعم بقت صفحة متكاملة في `./restaurants/RestaurantsPage`
 * (إحصائيات · فلاتر · تفاصيل · نموذج إضافة/تعديل).
 */
export { RestaurantsPage } from './restaurants/RestaurantsPage';

/* ------------------------------- الأصناف ------------------------------- */

/** صفحة الأصناف بقت متكاملة في `./products/ProductsPage` (أسعار · مخزون · فئات · صور). */
export { ProductsPage } from './products/ProductsPage';

/* ------------------------------- الأقسام ------------------------------- */

/** صفحة الفئات بقت متكاملة (رئيسية/فرعية · رفع صور · حماية من الحذف). */
export { CategoriesPage } from './categories/CategoriesPage';

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
