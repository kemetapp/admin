import { useSyncExternalStore } from 'react';
import { loadJSON, saveJSON } from './storage';

type Updater<T> = T | ((prev: T) => T);

export type PersistedStore<T> = {
  get: () => T;
  set: (next: Updater<T>) => void;
  hydrate: () => Promise<void>;
  subscribe: (listener: () => void) => () => void;
  use: () => T;
};

/**
 * مخزن صغير محفوظ محليًا ومربوط بـ React عن طريق `useSyncExternalStore`.
 * بيسمح لأكتر من شاشة تقرأ نفس القيمة وتتحدّث فورًا لما تتغير.
 */
export function createStore<T>(key: string, initial: T): PersistedStore<T> {
  let value = initial;
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    get: () => value,
    set: (next) => {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      void saveJSON(key, value);
      emit();
    },
    hydrate: async () => {
      if (hydrated) return;
      hydrated = true;
      const saved = await loadJSON<T>(key);
      if (saved !== null && saved !== undefined) {
        value = saved;
        emit();
      }
    },
    subscribe,
    use: () => useSyncExternalStore(subscribe, () => value, () => value),
  };
}
