import { addresses as seedAddresses, type Address } from '../data/mock';
import { createStore } from './createStore';

/**
 * عناوين العميل — بقت مخزن حقيقي مش مصفوفة ثابتة، عشان المستخدم يقدر
 * يضيف عنوان جديد أو يشيل واحد من عنده.
 */
export const addressListStore = createStore<Address[]>('addresses', seedAddresses);

/** العنوان المختار حاليًا للتوصيل. */
export const addressSelectedStore = createStore<string>('address', seedAddresses[0].id);

/** بنستخدمه لو المستخدم شال كل العناوين — عشان الشاشات متقعش. */
const FALLBACK_ADDRESS: Address = {
  id: 'none',
  label: 'مفيش عنوان',
  detail: 'ضيف عنوان التوصيل من حسابي',
};

export function useAddresses(): Address[] {
  return addressListStore.use();
}

export function useAddress(): Address {
  const list = addressListStore.use();
  const id = addressSelectedStore.use();
  return list.find((address) => address.id === id) ?? list[0] ?? FALLBACK_ADDRESS;
}

export function selectAddress(id: string) {
  addressSelectedStore.set(id);
}

export function addAddress(input: { label: string; detail: string; note?: string }): string {
  const id = `addr-${Date.now()}`;
  addressListStore.set((prev) => [...prev, { id, ...input }]);
  addressSelectedStore.set(id);
  return id;
}

export function removeAddress(id: string) {
  addressListStore.set((prev) => prev.filter((address) => address.id !== id));
  if (addressSelectedStore.get() === id) {
    const rest = addressListStore.get();
    addressSelectedStore.set(rest[0]?.id ?? 'none');
  }
}
