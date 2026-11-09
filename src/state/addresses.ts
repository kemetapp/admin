import { addresses, type Address } from '../data/mock';
import { createStore } from './createStore';

/** العنوان المختار حاليًا للتوصيل. */
export const addressStore = createStore<string>('address', addresses[0].id);

export function useAddress(): Address {
  const id = addressStore.use();
  return addresses.find((address) => address.id === id) ?? addresses[0];
}

export function selectAddress(id: string) {
  addressStore.set(id);
}
