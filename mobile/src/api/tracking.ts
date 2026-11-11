import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type CourierPosition = {
  lat: number;
  lng: number;
  heading?: number;
  updatedAt?: number;
};

/**
 * تتبّع المندوب الحي لطلب معيّن — بيقرا من `tracking/{orderId}`.
 * أي تحديث من تطبيق المندوب أو لوحة التحكم بيوصل فورًا.
 */
export function useOrderTracking(orderId: string | null): CourierPosition | null {
  const [position, setPosition] = useState<CourierPosition | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsubscribe = onSnapshot(
      doc(db, 'tracking', orderId),
      (snap) => {
        if (!snap.exists()) {
          setPosition(null);
          return;
        }
        const data = snap.data() as { lat?: unknown; lng?: unknown; heading?: unknown; updatedAt?: { toMillis?: () => number } };
        if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
          setPosition(null);
          return;
        }
        setPosition({
          lat: data.lat,
          lng: data.lng,
          heading: typeof data.heading === 'number' ? data.heading : undefined,
          updatedAt: data.updatedAt?.toMillis?.() ?? 0,
        });
      },
      () => setPosition(null),
    );
    return unsubscribe;
  }, [orderId]);

  return position;
}
