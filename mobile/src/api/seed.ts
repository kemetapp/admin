import { doc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { categories, products, promos, restaurants } from '../data/mock';

/** Firestore بيسمح بـ500 عملية كتابة في الدفعة الواحدة كحد أقصى. */
const BATCH_LIMIT = 450;

/**
 * تاريخ افتتاح ثابت لكل مطعم عشان فلتر «أحدث المطاعم» يبقى له معنى.
 * أول مطعم في القائمة = الأحدث، وكل واحد قبله بأسبوع.
 */
const OPENING_BASE = Date.UTC(2026, 0, 20);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type PendingWrite = { path: string; data: Record<string, unknown>; merge?: boolean };

/**
 * تهيئة بيانات العرض في Firestore — بتحوّل الكتالوج اللي كان في
 * `src/data/mock.ts` لمستندات حقيقية.
 *
 * **بتشتغل بحساب أدمن بس** (قواعد Firestore بتمنع أي حد تاني).
 * بتستخدم الكتابة بـ`set` عشان لو شغّلتها تاني تحدّث بدل ما تكرّر.
 */
export async function seedCatalog() {
  const writes: PendingWrite[] = [];

  categories.forEach((category, index) => {
    writes.push({
      path: `categories/${category.id}`,
      data: { label: category.label, image: category.image, order: index },
    });
  });

  restaurants.forEach((restaurant, index) => {
    writes.push({
      path: `restaurants/${restaurant.id}`,
      // merge عشان إخفاء/إظهار المطعم من لوحة التحكم ميتلغيش لما نعيد التهيئة.
      data: {
        ...restaurant,
        createdAt: Timestamp.fromMillis(OPENING_BASE - index * WEEK_MS),
      },
      merge: true,
    });
  });

  products.forEach((product) => {
    writes.push({ path: `products/${product.id}`, data: { ...product } });
  });

  promos.forEach((promo) => {
    writes.push({
      path: `promos/${promo.id}`,
      data: { ...promo, active: true },
    });
  });

  for (let index = 0; index < writes.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db);
    writes.slice(index, index + BATCH_LIMIT).forEach((write) => {
      batch.set(doc(db, write.path), write.data, { merge: write.merge === true });
    });
    await batch.commit();
  }

  return {
    categories: categories.length,
    restaurants: restaurants.length,
    products: products.length,
    promos: promos.length,
    total: writes.length,
  };
}
