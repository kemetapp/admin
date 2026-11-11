import { createStore } from './createStore';

export type DeviceLocation = { lat: number; lng: number };

/** موقع الجهاز اللي اتاخد من الـGPS. */
export const deviceLocationStore = createStore<DeviceLocation | null>('device-location', null);

/** هل سألنا المستخدم عن إذن الموقع قبل كده؟ */
export const locationAskedStore = createStore<boolean>('location-asked', false);
