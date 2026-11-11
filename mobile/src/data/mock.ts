import type { FoodKey } from '../theme/images';

export type Option = {
  id: string;
  label: string;
  price: number;
};

export type Product = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: FoodKey;
  /** صورة مرفوعة من اللوحة (base64 أو رابط) — بتاخد الأولوية. */
  imageUrl?: string;
  category: string;
  serving?: string;
  sizes?: Option[];
  extras?: Option[];
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  tags: string;
  rating: number;
  reviews: number;
  prep: string;
  deliveryFee: number;
  image: FoodKey;
  sticker?: string;
  menuTabs: string[];
};

export type Promo = {
  id: string;
  kicker: string;
  title: string;
  code: string;
  image: FoodKey;
};

export type Category = {
  id: string;
  label: string;
  image: FoodKey;
  /** صورة مرفوعة من لوحة التحكم — لو موجودة بتاخد الأولوية على المفتاح المحلي. */
  imageUrl?: string;
  /** الفئة الأب — فاضي = فئة رئيسية. */
  parentId?: string;
  description?: string;
  active?: boolean;
  order?: number;
};

export type CartLine = {
  key: string;
  productId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  image: FoodKey;
  unitPrice: number;
  qty: number;
  options: string[];
};

export const location = {
  city: 'أسوان',
  area: 'كورنيش النيل',
  full: 'أسوان، كورنيش النيل',
};

export type Address = {
  id: string;
  label: string;
  detail: string;
  note?: string;
  /** اسم المنطقة من الخريطة/العنونة العكسية. */
  area?: string;
  placeName?: string;
  /** إحداثيات العنوان — من الـGPS أو من الخريطة. */
  lat?: number;
  lng?: number;
};

export const addresses: Address[] = [];

export const coupons = [
  { code: 'KEMET25', title: 'خصم 25 ج.م', hint: 'على أي أوردر فوق 100 ج.م' },
  { code: 'ASWAN0', title: 'توصيل مجاني', hint: 'لأول 3 طلبات من أي مطعم' },
];

export type AppNotification = {
  id: string;
  kind: 'order' | 'offer' | 'info';
  title: string;
  body: string;
  when: string;
};

export const notifications: AppNotification[] = [
  {
    id: 'n2',
    kind: 'offer',
    title: 'خصم 25 ج.م على أول أوردر',
    body: 'استخدم كود KEMET25 عند الدفع واستمتع بالخصم على أي أوردر.',
    when: 'النهاردة',
  },
  {
    id: 'n3',
    kind: 'offer',
    title: 'توصيل مجاني من كشري أسوان',
    body: 'أول 3 طلبات توصيلها مجاني بكود ASWAN0 — جرّبها قبل ما تخلص.',
    when: 'امبارح',
  },
];

export const promos: Promo[] = [
  {
    id: 'p1',
    kicker: 'عرض الأسبوع',
    title: 'خصم 25% على أول أوردر',
    code: 'KEMET25',
    image: 'grill',
  },
  {
    id: 'p2',
    kicker: 'أهل أسوان',
    title: 'توصيل مجاني لأول 3 طلبات',
    code: 'ASWAN0',
    image: 'shawarma',
  },
];

export const categories: Category[] = [
  { id: 'koshary', label: 'كشري', image: 'rice' },
  { id: 'grill', label: 'مشويات', image: 'grill' },
  { id: 'nubian', label: 'نوبي', image: 'falafel' },
  { id: 'shawarma', label: 'شاورما', image: 'shawarma' },
  { id: 'sweets', label: 'حلويات', image: 'dessert' },
  { id: 'drinks', label: 'مشروبات', image: 'juice' },
];

export const restaurants: Restaurant[] = [
  {
    id: 'nuba',
    name: 'مطعم النوبة',
    cuisine: 'نوبي · مشويات',
    tags: 'نوبي · مشويات',
    rating: 4.8,
    reviews: 320,
    prep: '20–25 د',
    deliveryFee: 15,
    image: 'grill',
    sticker: 'الأكثر طلبًا',
    menuTabs: ['الأكثر طلبًا', 'المشويات', 'الطواجن', 'المشروبات'],
  },
  {
    id: 'koshary',
    name: 'كشري أسوان',
    cuisine: 'كشري · مصري',
    tags: 'كشري · مصري',
    rating: 4.9,
    reviews: 540,
    prep: '15–20 د',
    deliveryFee: 10,
    image: 'rice',
    sticker: 'توصيل مجاني',
    menuTabs: ['الأكثر طلبًا', 'الكشري', 'المكرونة', 'المشروبات'],
  },
  {
    id: 'south',
    name: 'مشويات الجنوب',
    cuisine: 'مشويات · مشري',
    tags: 'مشويات · مشري',
    rating: 4.7,
    reviews: 210,
    prep: '25–30 د',
    deliveryFee: 20,
    image: 'chicken',
    sticker: 'خصم 20%',
    menuTabs: ['الأكثر طلبًا', 'المشويات', 'الطواجن'],
  },
  {
    id: 'gazira',
    name: 'كافيه الجزيرة',
    cuisine: 'كافيه · حلويات',
    tags: 'كافيه · حلويات',
    rating: 4.6,
    reviews: 180,
    prep: '10–15 د',
    deliveryFee: 15,
    image: 'dessert',
    menuTabs: ['الأكثر طلبًا', 'حلويات', 'مشروبات'],
  },
  {
    id: 'shawarma',
    name: 'شاورما النيل',
    cuisine: 'شاورما · سوري',
    tags: 'شاورما · سوري',
    rating: 4.5,
    reviews: 260,
    prep: '15–20 د',
    deliveryFee: 12,
    image: 'shawarma',
    menuTabs: ['الأكثر طلبًا', 'شاورما', 'ساندوتشات'],
  },
  {
    id: 'sweets',
    name: 'حلويات النيل',
    cuisine: 'حلويات · شرقي',
    tags: 'حلويات · شرقي',
    rating: 4.8,
    reviews: 150,
    prep: '10–15 د',
    deliveryFee: 10,
    image: 'dessert',
    menuTabs: ['الأكثر طلبًا', 'حلويات شرقية'],
  },
];

export const products: Product[] = [
  // مطعم النوبة
  {
    id: 'nuba-kofta',
    restaurantId: 'nuba',
    name: 'كفتة مشوية',
    description: 'لحمة بلدي مفرومة مع البقدونس والبهارات، مشوية على الفحم.',
    price: 65,
    image: 'grill',
    category: 'الأكثر طلبًا',
    serving: '450 جم · تكفي شخصين',
    sizes: [
      { id: 'regular', label: 'عادي', price: 0 },
      { id: 'large', label: 'كبير', price: 15 },
    ],
    extras: [
      { id: 'cheese', label: 'جبنة', price: 10 },
      { id: 'fries', label: 'بطاطس مقلية', price: 15 },
      { id: 'hot', label: 'صوص حار', price: 5 },
    ],
  },
  {
    id: 'nuba-ribs',
    restaurantId: 'nuba',
    name: 'ريش ضاني',
    description: 'ريش مشوية على الفحم، بتتقدم مع أرز بالشعرية وسلطة.',
    price: 120,
    image: 'chicken',
    category: 'المشويات',
    serving: '500 جم · تكفي شخصين',
    sizes: [
      { id: 'regular', label: 'عادي', price: 0 },
      { id: 'large', label: 'كبير', price: 30 },
    ],
    extras: [
      { id: 'rice', label: 'أرز بالشعرية', price: 10 },
      { id: 'salad', label: 'سلطة بلدي', price: 8 },
    ],
  },
  {
    id: 'nuba-potato',
    restaurantId: 'nuba',
    name: 'طاجن بطاطس باللحمة',
    description: 'بطاطس مقطعة مع قطع لحمة في طاجن فخار، متسوية في الفرن.',
    price: 75,
    image: 'rice',
    category: 'الطواجن',
    serving: 'طاجن فردي',
    extras: [
      { id: 'cheese', label: 'جبنة موتزاريلا', price: 12 },
      { id: 'bread', label: 'عيش بلدي', price: 5 },
    ],
  },
  {
    id: 'nuba-pigeon',
    restaurantId: 'nuba',
    name: 'حمام محشي',
    description: 'حمام بلدي محشي أرز بالكبد والقوانص، متسوي في الفرن.',
    price: 140,
    image: 'chicken',
    category: 'الطواجن',
    serving: 'حمامة كاملة',
  },
  {
    id: 'nuba-salad',
    restaurantId: 'nuba',
    name: 'سلطة بلدي',
    description: 'طماطم وخيار وبصل وبقدونس مع دبس رمان وليمون.',
    price: 30,
    image: 'salad',
    category: 'الأكثر طلبًا',
    serving: 'طبق جانبي',
    extras: [
      { id: 'nonoin', label: 'بدون بصل', price: 0 },
      { id: 'extra', label: 'دبس رمان زيادة', price: 5 },
    ],
  },
  // كشري أسوان
  {
    id: 'koshary-plate',
    restaurantId: 'koshary',
    name: 'طبق كشري',
    description: 'أرز ومكرونة وعدس وحمص، مع صوص الطماطم والبصل المقرمش.',
    price: 35,
    image: 'rice',
    category: 'الأكثر طلبًا',
    serving: 'طبق متوسط',
    sizes: [
      { id: 'small', label: 'صغير', price: -5 },
      { id: 'regular', label: 'عادي', price: 0 },
      { id: 'large', label: 'كبير', price: 10 },
    ],
    extras: [
      { id: 'extra-sauce', label: 'صوص زيادة', price: 5 },
      { id: 'onion', label: 'بصل مقرمش زيادة', price: 5 },
    ],
  },
  {
    id: 'koshary-tagen',
    restaurantId: 'koshary',
    name: 'طاجن كشري',
    description: 'كشري في طاجن فخار بالفرن، بطبقة جبنة وصوص حار.',
    price: 45,
    image: 'rice',
    category: 'الأكثر طلبًا',
    serving: 'طاجن فردي',
    extras: [
      { id: 'cheese', label: 'جبنة زيادة', price: 8 },
      { id: 'hot', label: 'صوص حار', price: 3 },
    ],
  },
  {
    id: 'koshary-pasta',
    restaurantId: 'koshary',
    name: 'مكرونة بالبشاميل',
    description: 'مكرونة باللحمة المفرومة والبشاميل، متسوية في الفرن.',
    price: 55,
    image: 'pasta',
    category: 'المكرونة',
    serving: 'طبق فردي',
  },
  // مشويات الجنوب
  {
    id: 'south-mix',
    restaurantId: 'south',
    name: 'مشويات مشكلة',
    description: 'تشكيلة كفتة وريش وشيش طاووق، مع أرز وسلطة.',
    price: 180,
    image: 'grill',
    category: 'الأكثر طلبًا',
    serving: 'تكفي شخصين',
  },
  {
    id: 'south-shish',
    restaurantId: 'south',
    name: 'شيش طاووق',
    description: 'قطع فراخ متبلة ومشوية على الفحم مع صوص الثوم.',
    price: 130,
    image: 'chicken',
    category: 'المشويات',
    serving: '4 أسياخ',
  },
  {
    id: 'south-kofta',
    restaurantId: 'south',
    name: 'كفتة مشوية',
    description: 'كفتة بلدي مشوية على الفحم مع عيش وسلطة.',
    price: 70,
    image: 'grill',
    category: 'المشويات',
    serving: '3 أسياخ',
  },
  // كافيه الجزيرة
  {
    id: 'gazira-omali',
    restaurantId: 'gazira',
    name: 'أم علي',
    description: 'أم علي باللبن والمكسرات، متسوية في الفرن.',
    price: 40,
    image: 'dessert',
    category: 'حلويات',
    serving: 'طبق فردي',
    extras: [
      { id: 'nuts', label: 'مكسرات زيادة', price: 8 },
      { id: 'cream', label: 'كريمة', price: 6 },
    ],
  },
  {
    id: 'gazira-cheesecake',
    restaurantId: 'gazira',
    name: 'تشيز كيك',
    description: 'تشيز كيك كريمي على بسكويت بالزبدة.',
    price: 45,
    image: 'dessert',
    category: 'حلويات',
    serving: 'قطعة',
  },
  {
    id: 'gazira-coffee',
    restaurantId: 'gazira',
    name: 'قهوة تركي',
    description: 'قهوة تركي على الرمل، سادة أو بمبسطة.',
    price: 25,
    image: 'coffee',
    category: 'مشروبات',
    serving: 'كوب',
  },
  // شاورما النيل
  {
    id: 'shawarma-chicken',
    restaurantId: 'shawarma',
    name: 'شاورما فراخ',
    description: 'شاورما فراخ متبلة مع صوص الثوم والمخلل في عيش صاج.',
    price: 55,
    image: 'shawarma',
    category: 'الأكثر طلبًا',
    serving: 'ساندوتش كبير',
    sizes: [
      { id: 'regular', label: 'عادي', price: 0 },
      { id: 'double', label: 'دوبل', price: 25 },
    ],
    extras: [
      { id: 'cheese', label: 'جبنة', price: 8 },
      { id: 'fries', label: 'بطاطس جوه', price: 6 },
      { id: 'hot', label: 'صوص حار', price: 3 },
    ],
  },
  {
    id: 'shawarma-beef',
    restaurantId: 'shawarma',
    name: 'شاورما لحمة',
    description: 'شاورما لحمة بلدي مع طحينة وبصل وبقدونس.',
    price: 65,
    image: 'shawarma',
    category: 'شاورما',
    serving: 'ساندوتش كبير',
  },
  {
    id: 'shawarma-fries',
    restaurantId: 'shawarma',
    name: 'بطاطس مقلية',
    description: 'بطاطس مقرمشة مع توابل الكيميت.',
    price: 25,
    image: 'falafel',
    category: 'ساندوتشات',
    serving: 'طبق جانبي',
  },
  // حلويات النيل
  {
    id: 'sweets-omali',
    restaurantId: 'sweets',
    name: 'أم علي',
    description: 'أم علي باللبن والمكسرات، متسوية في الفرن.',
    price: 40,
    image: 'dessert',
    category: 'الأكثر طلبًا',
    serving: 'طبق فردي',
  },
  {
    id: 'sweets-basbousa',
    restaurantId: 'sweets',
    name: 'بسبوسة',
    description: 'بسبوسة بالسميد واللبن، مع شربات خفيف.',
    price: 35,
    image: 'dessert',
    category: 'حلويات شرقية',
    serving: '4 قطع',
  },
  {
    id: 'sweets-konafa',
    restaurantId: 'sweets',
    name: 'كنافة بالكريمة',
    description: 'كنافة ناعمة بالكريمة والمكسرات.',
    price: 55,
    image: 'dessert',
    category: 'حلويات شرقية',
    serving: 'طبق',
  },
  // مشروبات وأصناف إضافية
  {
    id: 'nuba-tea',
    restaurantId: 'nuba',
    name: 'شاي نوبي',
    description: 'شاي أسواني بالقرنفل والقرفة، على الرمل.',
    price: 12,
    image: 'coffee',
    category: 'المشروبات',
    serving: 'كوب',
  },
  {
    id: 'nuba-karkade',
    restaurantId: 'nuba',
    name: 'كركديه بارد',
    description: 'كركديه أسواني مثلج، محلى على حسب الطلب.',
    price: 18,
    image: 'juice',
    category: 'المشروبات',
    serving: 'كوب كبير',
  },
  {
    id: 'koshary-soda',
    restaurantId: 'koshary',
    name: 'بيبسي',
    description: 'بيبسي بارد 330 مل.',
    price: 15,
    image: 'juice',
    category: 'المشروبات',
    serving: 'زجاجة',
  },
  {
    id: 'koshary-cane',
    restaurantId: 'koshary',
    name: 'عصير قصب',
    description: 'قصب طازج معصور في المحل.',
    price: 20,
    image: 'juice',
    category: 'المشروبات',
    serving: 'كوب كبير',
  },
  {
    id: 'gazira-mango',
    restaurantId: 'gazira',
    name: 'عصير مانجو',
    description: 'مانجو طازج باللبن، سميك وبارد.',
    price: 30,
    image: 'juice',
    category: 'مشروبات',
    serving: 'كوب كبير',
  },
  {
    id: 'gazira-crepe',
    restaurantId: 'gazira',
    name: 'كريب نوتيلا',
    description: 'كريب رفيع بالنوتيلا والمكسرات، مع كريمة.',
    price: 55,
    image: 'dessert',
    category: 'الأكثر طلبًا',
    serving: 'قطعة كبيرة',
    extras: [
      { id: 'nuts', label: 'مكسرات زيادة', price: 8 },
      { id: 'cream', label: 'كريمة زيادة', price: 6 },
    ],
  },
  {
    id: 'south-tagen',
    restaurantId: 'south',
    name: 'طاجن فراخ بالبصل',
    description: 'فراخ بلدي في طاجن فخار بالبصل والتوابل، متسوية في الفرن.',
    price: 90,
    image: 'rice',
    category: 'الطواجن',
    serving: 'طاجن فردي',
    extras: [
      { id: 'rice', label: 'أرز بالشعرية', price: 10 },
      { id: 'bread', label: 'عيش بلدي', price: 5 },
    ],
  },
];

export const trendingIds = ['nuba-kofta', 'koshary-tagen', 'shawarma-chicken', 'sweets-omali'];

export function getRestaurant(id: string): Restaurant {
  return restaurants.find((r) => r.id === id) ?? restaurants[0];
}

export function getProduct(id: string): Product {
  return products.find((p) => p.id === id) ?? products[0];
}

export function productsForRestaurant(restaurantId: string): Product[] {
  return products.filter((p) => p.restaurantId === restaurantId);
}

export const seedCart: CartLine[] = [
  {
    key: 'seed-kofta',
    productId: 'nuba-kofta',
    restaurantId: 'nuba',
    restaurantName: 'مطعم النوبة',
    name: 'كفتة مشوية',
    image: 'grill',
    unitPrice: 65,
    qty: 2,
    options: ['عادي', 'جبنة إضافية'],
  },
  {
    key: 'seed-salad',
    productId: 'nuba-salad',
    restaurantId: 'nuba',
    restaurantName: 'مطعم النوبة',
    name: 'سلطة بلدي',
    image: 'salad',
    unitPrice: 30,
    qty: 1,
    options: ['بدون بصل'],
  },
];

export type Order = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  itemsCount: number;
  total: number;
  status: 'live' | 'delivered';
  when: string;
  eta?: string;
  image: FoodKey;
};

export const orders: Order[] = [
  {
    id: 'o-live',
    restaurantId: 'nuba',
    restaurantName: 'مطعم النوبة',
    itemsCount: 2,
    total: 150,
    status: 'live',
    when: 'متوقع 9:52 م',
    eta: '9:52 م',
    image: 'grill',
  },
  {
    id: 'o-2',
    restaurantId: 'koshary',
    restaurantName: 'كشري أسوان',
    itemsCount: 3,
    total: 95,
    status: 'delivered',
    when: 'أمس 8:30 م',
    image: 'rice',
  },
  {
    id: 'o-3',
    restaurantId: 'gazira',
    restaurantName: 'كافيه الجزيرة',
    itemsCount: 2,
    total: 120,
    status: 'delivered',
    when: 'الجمعة 9:05 م',
    image: 'burger',
  },
  {
    id: 'o-4',
    restaurantId: 'sweets',
    restaurantName: 'حلويات النيل',
    itemsCount: 1,
    total: 55,
    status: 'delivered',
    when: 'الخميس 7:40 م',
    image: 'dessert',
  },
];
