import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useDoc } from './db';

/** إعدادات التطبيق — مستند واحد في Firestore: settings/app */
export type AppSettings = {
  storeName: string;
  supportPhone: string;
  whatsapp: string;
  email: string;

  deliveryFee: number;
  freeDeliveryOver: number;
  minOrder: number;
  etaMinutes: number;
  serviceAreas: string;

  taxPercent: number;
  payCash: boolean;
  payWallet: boolean;
  payCard: boolean;

  storeOpen: boolean;
  acceptingOrders: boolean;
  openTime: string;
  closeTime: string;

  notifyOrders: boolean;
  notifyCustomers: boolean;
  notifyMarketing: boolean;

  couponsEnabled: boolean;
  maxDiscount: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'كيميت',
  supportPhone: '0971234567',
  whatsapp: '201012345678',
  email: 'support@kemet.app',

  deliveryFee: 15,
  freeDeliveryOver: 200,
  minOrder: 30,
  etaMinutes: 25,
  serviceAreas: 'أسوان، الجزيرة، الصداقة',

  taxPercent: 0,
  payCash: true,
  payWallet: true,
  payCard: false,

  storeOpen: true,
  acceptingOrders: true,
  openTime: '10:00',
  closeTime: '23:00',

  notifyOrders: true,
  notifyCustomers: true,
  notifyMarketing: false,

  couponsEnabled: true,
  maxDiscount: 50,
};

export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC = 'app';

function coerce(key: keyof AppSettings, raw: unknown): unknown {
  const fallback = DEFAULT_SETTINGS[key];
  if (typeof fallback === 'number') return typeof raw === 'number' ? raw : fallback;
  if (typeof fallback === 'boolean') return typeof raw === 'boolean' ? raw : fallback;
  return typeof raw === 'string' ? raw : fallback;
}

export function mergeSettings(raw: Record<string, unknown> | null): AppSettings {
  const next: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  if (raw) {
    (Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]).forEach((key) => {
      if (key in raw) next[key] = coerce(key, raw[key]);
    });
  }
  return next as AppSettings;
}

/** بيقرا الإعدادات لحظيًا، ويرجّع الافتراضي لأي حقل مش موجود. */
export function useAppSettings() {
  const { data, loading, error } = useDoc(SETTINGS_COLLECTION, SETTINGS_DOC);
  return {
    settings: mergeSettings(data),
    loading,
    error,
    exists: data !== null,
    updatedAt: (data?.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? null,
  };
}

export async function saveAppSettings(next: AppSettings): Promise<void> {
  await setDoc(
    doc(db, SETTINGS_COLLECTION, SETTINGS_DOC),
    { ...next, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
