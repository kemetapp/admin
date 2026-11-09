import { useEffect, useSyncExternalStore } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * إعدادات التطبيق من Firestore (`settings/app`) — بتتظبط من لوحة التحكم.
 * نفس نمط مخزن الكتالوج: حالة واحدة + مشتركون، من غير Providers.
 */
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

/** نفس القيم الافتراضية اللي في لوحة التحكم — التطبيق بيشتغل بيها لو الإعدادات لسه مش متظبطة. */
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

let state: AppSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();
const getSnapshot = () => state;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(next: AppSettings) {
  state = next;
  listeners.forEach((listener) => listener());
}

function coerce<K extends keyof AppSettings>(key: K, raw: unknown): AppSettings[K] {
  const fallback = DEFAULT_SETTINGS[key];
  if (typeof fallback === 'number') {
    return (typeof raw === 'number' ? raw : fallback) as AppSettings[K];
  }
  if (typeof fallback === 'boolean') {
    return (typeof raw === 'boolean' ? raw : fallback) as AppSettings[K];
  }
  return (typeof raw === 'string' ? raw : fallback) as AppSettings[K];
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

let started = false;

function start() {
  if (started) return;
  started = true;

  onSnapshot(
    doc(db, 'settings', 'app'),
    (snap) => {
      if (!snap.exists()) return;
      emit(mergeSettings(snap.data() as Record<string, unknown>));
    },
    () => undefined,
  );
}

/** بيتنادى مرة واحدة في الـRootLayout. */
export function useSettingsSync() {
  useEffect(() => {
    start();
  }, []);
}

export function useSettings(): AppSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
