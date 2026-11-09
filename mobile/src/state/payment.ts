import { createStore } from './createStore';

/**
 * طرق الدفع — بقت مخزن حقيقي عشان العميل يضيف محفظة أو يشيل واحدة.
 * البطاقة البنكية (فيزا/ماستركارد) اتشالت بطلب من صاحب المشروع،
 * والكاش ثابت مينفعش يتشال.
 */
export type PaymentMethod = {
  id: string;
  kind: 'cash' | 'wallet';
  label: string;
  detail: string;
};

const SEED: PaymentMethod[] = [
  {
    id: 'cash',
    kind: 'cash',
    label: 'كاش عند الاستلام',
    detail: 'ادفع للمندوب لما يوصلك',
  },
  {
    id: 'wallet-vodafone',
    kind: 'wallet',
    label: 'فودافون كاش',
    detail: '010 1234 5678',
  },
];

export const paymentListStore = createStore<PaymentMethod[]>('payments', SEED);
export const paymentSelectedStore = createStore<string>('payment', 'cash');

export function usePayments(): PaymentMethod[] {
  return paymentListStore.use();
}

export function usePayment(): PaymentMethod {
  const list = paymentListStore.use();
  const id = paymentSelectedStore.use();
  return list.find((method) => method.id === id) ?? list[0] ?? SEED[0];
}

export function selectPayment(id: string) {
  paymentSelectedStore.set(id);
}

export function addWallet(label: string, detail: string) {
  const id = `wallet-${Date.now()}`;
  paymentListStore.set((prev) => [...prev, { id, kind: 'wallet', label, detail }]);
  paymentSelectedStore.set(id);
}

/** الكاش مش بيتشال — لازم تفضل طريقة دفع واحدة على الأقل. */
export function removePayment(id: string) {
  const target = paymentListStore.get().find((method) => method.id === id);
  if (!target || target.kind === 'cash') return;
  paymentListStore.set((prev) => prev.filter((method) => method.id !== id));
  if (paymentSelectedStore.get() === id) paymentSelectedStore.set('cash');
}
