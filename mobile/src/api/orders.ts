import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Order } from '../data/mock';

/** هوية المستخدم المسجّل — بتتحدّث لحظيًا. */
export function useAuthUid(): string | null {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
    return unsubscribe;
  }, []);
  return uid;
}

const millisOf = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

const textOf = (value: unknown) => (typeof value === 'string' ? value : '');
const numOf = (value: unknown) => (typeof value === 'number' ? value : 0);

/** تحويل مستند الطلب من Firestore لشكل الشاشات. */
function mapOrder(id: string, data: Record<string, unknown>): Order & { created: number } {
  const status = textOf(data.status);
  const done = status === 'delivered' || status === 'cancelled';
  return {
    id,
    restaurantId: textOf(data.restaurantId),
    restaurantName: textOf(data.restaurantName) || 'مطعم',
    itemsCount: numOf(data.itemsCount),
    total: numOf(data.total),
    status: done ? 'delivered' : 'live',
    when: status === 'cancelled' ? 'ملغي' : status === 'delivered' ? 'تم التسليم' : 'جاري التنفيذ',
    eta: textOf(data.eta) || undefined,
    image: (textOf(data.image) || 'grill') as Order['image'],
    created: millisOf(data.createdAt),
  };
}

/** طلبات العميل الحقيقية من Firestore — فاضية لأي عميل جديد أو زائر. */
export function useMyOrders(uid: string | null): { orders: Order[]; loading: boolean } {
  const [rows, setRows] = useState<(Order & { created: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((item) => mapOrder(item.id, item.data()));
        list.sort((a, b) => b.created - a.created);
        setRows(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [uid]);

  return { orders: uid ? rows : [], loading: uid ? loading : false };
}

export type OrderDetail = {
  id: string;
  number: number | null;
  status: string;
  restaurantId: string;
  restaurantName: string;
  itemsCount: number;
  total: number;
  eta: string;
  addressLabel: string;
  addressDetail: string;
  addressLat: number | null;
  addressLng: number | null;
  courierName: string;
  courierPhone: string;
  paymentLabel: string;
  createdAtMs: number;
};

const mapDetail = (id: string, data: Record<string, unknown>): OrderDetail => {
  const address = (data.address ?? {}) as { label?: unknown; detail?: unknown };
  return {
    id,
    number: typeof data.number === 'number' ? data.number : null,
    status: textOf(data.status) || 'pending',
    restaurantId: textOf(data.restaurantId),
    restaurantName: textOf(data.restaurantName) || 'مطعم',
    itemsCount: numOf(data.itemsCount),
    total: numOf(data.total),
    eta: textOf(data.eta),
    addressLabel: textOf(address.label),
    addressDetail: textOf(address.detail),
    addressLat: (address as { lat?: unknown }).lat as number | null,
    addressLng: (address as { lng?: unknown }).lng as number | null,
    courierName: textOf(data.courierName),
    courierPhone: textOf(data.courierPhone),
    paymentLabel: textOf((data.payment as { label?: unknown } | undefined)?.label),
    createdAtMs: millisOf(data.createdAt),
  };
};

/** أحدث طلب للعميل (الشغّال أولًا) مع بيانات المندوب والحالة الحقيقية. */
export function useMyOrderDetail(uid: string | null): { order: OrderDetail | null; loading: boolean } {
  const [rows, setRows] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs.map((item) => mapDetail(item.id, item.data()));
        list.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setRows(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [uid]);

  const list = uid ? rows : [];
  const active = list.find((row) => row.status !== 'delivered' && row.status !== 'cancelled');
  return { order: active ?? list[0] ?? null, loading: uid ? loading : false };
}

/** ترتيب مراحل الطلب — بيحدد الخطوة الحالية في التتبع. */
export function statusStepIndex(status: string): number {
  const flow = [
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'out_for_delivery',
    'arrived',
    'delivered',
  ];
  const index = flow.indexOf(status);
  return index < 0 ? 0 : index;
}

export type PlaceOrderInput = {
  restaurantId: string;
  restaurantName: string;
  items: { name: string; qty: number; price: number }[];
  itemsCount: number;
  subtotal: number;
  delivery: number;
  tax: number;
  discount: number;
  total: number;
  address: { label: string; detail: string; lat?: number; lng?: number };
  payment: { kind: string; label: string };
  eta: string;
  image: string;
};

/**
 * إنشاء الطلب في Firestore:
 * - رقم تسلسلي من `counters/orders` (أول رقم 1001).
 * - الحقول المطلوبة في قواعد Firestore: status/userId/customerId/restaurantId/items/itemsCount/total.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('not-signed-in');

  const counter = doc(db, 'counters', 'orders');
  let number = 1001;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counter);
    if (!snap.exists()) {
      number = 1001;
      tx.set(counter, { value: 1001 });
      return;
    }
    const current = typeof snap.data().value === 'number' ? (snap.data().value as number) : 1000;
    number = current + 1;
    tx.update(counter, { value: number });
  });

  const created = await addDoc(collection(db, 'orders'), {
    number,
    status: 'pending',
    userId: uid,
    customerId: uid,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    items: input.items,
    itemsCount: input.itemsCount,
    subtotal: input.subtotal,
    delivery: input.delivery,
    tax: input.tax,
    discount: input.discount,
    total: input.total,
    address: input.address,
    payment: input.payment,
    eta: input.eta,
    image: input.image,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}
