import { orders as seedOrders, type Order } from '../data/mock';
import { createStore } from './createStore';

/** الطلبات اللي المستخدم عملها من التطبيق (بتحفظ محليًا). */
export const ordersStore = createStore<Order[]>('orders', []);

export function useOrders(): Order[] {
  const created = ordersStore.use();
  return [...created, ...seedOrders];
}

export function useLiveOrder(): Order | undefined {
  return useOrders().find((order) => order.status === 'live');
}

export function addOrder(order: Order) {
  ordersStore.set((prev) => [order, ...prev]);
}
