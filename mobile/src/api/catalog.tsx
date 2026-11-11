import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  type Category,
  type Product,
  type Promo,
  type Restaurant,
} from '../data/mock';

/** مستندات Firestore فيها حقول زيادة عن نموذج التطبيق. */
type CategoryRow = Category & { order?: number };
type RestaurantRow = Restaurant & { active?: boolean; createdAt?: { toMillis?: () => number } };
type PromoRow = Promo & { active?: boolean };

type CatalogState = {
  categories: Category[];
  restaurants: Restaurant[];
  products: Product[];
  promos: Promo[];
  /** تاريخ افتتاح كل مطعم بالمللي ثانية — لفلتر «أحدث المطاعم». */
  restaurantDates: Record<string, number>;
  ready: boolean;
};

const FALLBACK_RESTAURANT: Restaurant = {
  id: 'none',
  name: 'مطعم',
  cuisine: '',
  tags: '',
  rating: 0,
  reviews: 0,
  prep: '',
  deliveryFee: 0,
  image: 'grill',
  menuTabs: [],
};

const FALLBACK_PRODUCT: Product = {
  id: 'none',
  restaurantId: 'none',
  name: 'صنف',
  description: '',
  price: 0,
  image: 'grill',
  category: '',
};

/**
 * مخزن الكتالوج — نفس فكرة `createStore` في المشروع:
 * حالة واحدة على مستوى الوحدة + مشتركون، من غير Context ولا Providers.
 *
 * بيبدأ ببيانات الـmock عشان أول رسم يبان فورًا، وأول ما Firestore يرد
 * بتحل محلها. والحقول المخفية من لوحة التحكم (`active: false`) مش بتظهر.
 */
let state: CatalogState = {
  categories: [],
  restaurants: [],
  products: [],
  promos: [],
  restaurantDates: {},
  ready: false,
};

const listeners = new Set<() => void>();

function update(patch: Partial<CatalogState>) {
  state = { ...state, ...patch, ready: true };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

let started = false;

/** بتفتح اشتراكات Firestore مرة واحدة بس لعمر التطبيق. */
function start() {
  if (started) return;
  started = true;

  onSnapshot(
    collection(db, 'categories'),
    (snap) => {
      const rows = snap.docs
        .map((doc) => {
          const data = doc.data() as Omit<CategoryRow, 'id'>;
          return {
            ...data,
            id: doc.id,
            // الفئات اللي بتتضاف من اللوحة بصور مرفوعة ممكن ميكونش لها مفتاح صورة محلي.
            image: data.image ?? 'grill',
            label: data.label ?? doc.id,
          } as CategoryRow;
        })
        .filter((row) => row.active !== false);
      rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      update({ categories: rows });
    },
    () => undefined,
  );

  onSnapshot(
    collection(db, 'restaurants'),
    (snap) => {
      const dates: Record<string, number> = {};
      const rows = snap.docs
        .map((doc) => {
          const data = doc.data() as Omit<RestaurantRow, 'id'>;
          dates[doc.id] = data.createdAt?.toMillis?.() ?? 0;
          return { ...data, id: doc.id };
        })
        .filter((row) => row.active !== false);
      rows.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      update({ restaurants: rows, restaurantDates: dates });
    },
    () => undefined,
  );

  onSnapshot(
    collection(db, 'products'),
    (snap) => {
      update({
        products: snap.docs.map((doc) => ({
          ...(doc.data() as Omit<Product, 'id'>),
          id: doc.id,
        })),
      });
    },
    () => undefined,
  );

  onSnapshot(
    collection(db, 'promos'),
    (snap) => {
      const rows = snap.docs
        .map((doc) => ({ ...(doc.data() as Omit<PromoRow, 'id'>), id: doc.id }))
        .filter((row) => row.active !== false);
      update({ promos: rows });
    },
    () => undefined,
  );
}

export type Catalog = {
  categories: Category[];
  restaurants: Restaurant[];
  products: Product[];
  promos: Promo[];
  ready: boolean;
  getRestaurant: (id: string) => Restaurant;
  getProduct: (id: string) => Product;
  productsForRestaurant: (id: string) => Product[];
  /** 0 لو المستند مش فيه تاريخ — الفلتر بيرجع للترتيب الافتراضي وقتها. */
  createdAtOf: (id: string) => number;
};

/** بيتنادى مرة واحدة في الـRootLayout. */
export function useCatalogSync() {
  useEffect(() => {
    start();
  }, []);
}

export function useCatalog(): Catalog {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(() => {
    const visibleIds = new Set(snapshot.restaurants.map((restaurant) => restaurant.id));
    const products = snapshot.products.filter((product) => visibleIds.has(product.restaurantId));

    return {
      categories: snapshot.categories,
      restaurants: snapshot.restaurants,
      products,
      promos: snapshot.promos,
      ready: snapshot.ready,
      getRestaurant: (id) =>
        snapshot.restaurants.find((restaurant) => restaurant.id === id) ??
        snapshot.restaurants[0] ??
        FALLBACK_RESTAURANT,
      getProduct: (id) => products.find((product) => product.id === id) ?? products[0] ?? FALLBACK_PRODUCT,
      productsForRestaurant: (id) => products.filter((product) => product.restaurantId === id),
      createdAtOf: (id) => snapshot.restaurantDates[id] ?? 0,
    };
  }, [snapshot]);
}
