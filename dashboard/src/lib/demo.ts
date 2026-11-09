import { collection, doc, Timestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { Doc } from './db';

const T = (value: unknown) => (typeof value === 'string' ? value : '');
const N = (value: unknown) => (typeof value === 'number' ? value : 0);

const DAY = 24 * 60 * 60 * 1000;

const ADDRESSES = [
  '12 كورنيش النيل، أسوان',
  'شارع أبطال التحرير، أسوان',
  'حي الصداقة، الجزيرة',
  'ميدان المحطة، أسوان',
];

/**
 * توليد طلبات تجريبية — بيستخدمها الأدمن من زر في اللوحة عشان يشوف
 * الرسوم البيانية والجداول شغالة قبل ما يبدأ طلبات حقيقية.
 */
export async function seedDemoOrders(
  restaurants: Doc[],
  products: Doc[],
  count = 42,
): Promise<number> {
  if (restaurants.length === 0) throw new Error('مفيش مطاعم — ارفع الكتالوج الأول.');

  const batch = writeBatch(db);
  const now = Date.now();
  // القواعد بتشترط إن userId يساوي حساب الأدمن اللي بيكتب.
  const userId = auth.currentUser?.uid ?? 'demo';

  for (let index = 0; index < count; index += 1) {
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const menu = products.filter((product) => product.restaurantId === restaurant.id);
    const pool = menu.length > 0 ? menu : products;

    const picked = new Map<string, { productId: string; name: string; qty: number; price: number }>();
    const itemCount = 1 + Math.floor(Math.random() * 3);

    for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
      const product = pool[Math.floor(Math.random() * pool.length)];
      if (!product) continue;
      const existing = picked.get(product.id);
      if (existing) existing.qty += 1;
      else {
        picked.set(product.id, {
          productId: product.id,
          name: T(product.name),
          qty: 1,
          price: N(product.price),
        });
      }
    }

    const items = [...picked.values()];
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const delivery = 15;
    const total = subtotal + delivery;
    const itemsCount = items.reduce((sum, item) => sum + item.qty, 0);

    const roll = Math.random();
    const status = roll > 0.86 ? 'cancelled' : roll > 0.42 ? 'delivered' : 'live';

    const createdAt = now - Math.floor(Math.random() * 12) * DAY - Math.floor(Math.random() * DAY);

    batch.set(doc(collection(db, 'orders')), {
      userId,
      restaurantId: restaurant.id,
      restaurantName: T(restaurant.name),
      items,
      itemsCount,
      subtotal,
      delivery,
      discount: 0,
      total,
      status,
      address: ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)],
      payment: { kind: 'cash', label: 'كاش عند الاستلام' },
      createdAt: Timestamp.fromMillis(createdAt),
    });
  }

  await batch.commit();
  return count;
}
