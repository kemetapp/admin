import { notifications, type AppNotification } from '../data/mock';
import { createStore } from './createStore';

/** معرّفات الإشعارات اللي المستخدم قراها. */
export const readStore = createStore<string[]>('notifications-read', []);

export type NotificationItem = AppNotification & { read: boolean };

export function useNotifications(): NotificationItem[] {
  const read = readStore.use();
  return notifications.map((item) => ({ ...item, read: read.includes(item.id) }));
}

export function useUnreadCount(): number {
  const read = readStore.use();
  return notifications.filter((item) => !read.includes(item.id)).length;
}

export function markAllRead() {
  readStore.set(notifications.map((item) => item.id));
}

export function markRead(id: string) {
  readStore.set((prev) => (prev.includes(id) ? prev : [...prev, id]));
}
