import { createStore } from './createStore';

/** معرّفات المطاعم المفضّلة. */
export const favoritesStore = createStore<string[]>('favorites', ['nuba']);

export function useFavorites(): string[] {
  return favoritesStore.use();
}

export function toggleFavorite(id: string) {
  favoritesStore.set((prev) =>
    prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
  );
}
