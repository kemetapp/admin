import { createStore } from './createStore';

/** طريقة الدفع المفضّلة (كاش افتراضيًا). */
export const paymentStore = createStore<string>('payment', 'cash');

export function usePayment(): string {
  return paymentStore.use();
}

export function setPayment(id: string) {
  paymentStore.set(id);
}
