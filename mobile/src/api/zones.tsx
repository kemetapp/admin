import { useEffect, useSyncExternalStore } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { pointInPolygon, type LatLng } from '../lib/geo';

export type Zone = {
  id: string;
  name: string;
  points: LatLng[];
  active?: boolean;
};

/** مناطق التوصيل المرسومة من لوحة التحكم. */
let zones: Zone[] = [];
let ready = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let started = false;

function start() {
  if (started) return;
  started = true;
  onSnapshot(
    collection(db, 'zones'),
    (snap) => {
      zones = snap.docs
        .map((docSnap) => {
          const data = docSnap.data() as { name?: string; points?: LatLng[]; active?: boolean };
          return {
            id: docSnap.id,
            name: data.name ?? 'منطقة',
            points: Array.isArray(data.points) ? data.points : [],
            active: data.active !== false,
          };
        })
        .filter((zone) => zone.active !== false && zone.points.length >= 3);
      ready = true;
      emit();
    },
    () => {
      ready = true;
      emit();
    },
  );
}

export function useZonesSync() {
  useEffect(() => {
    start();
  }, []);
}

export function useZones(): { zones: Zone[]; ready: boolean } {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => `${zones.length}|${ready ? 1 : 0}`,
    () => `${zones.length}|${ready ? 1 : 0}`,
  );
  void snapshot;
  return { zones, ready };
}

/** بترجّع المنطقة اللي النقطة جواها، أو null لو خارج التغطية. */
export function zoneAt(point: LatLng, list: Zone[]): Zone | null {
  return list.find((zone) => pointInPolygon(point, zone.points)) ?? null;
}
