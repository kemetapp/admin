import type { Doc } from './db';

const T = (value: unknown) => (typeof value === 'string' ? value : '');
const N = (value: unknown) => (typeof value === 'number' ? value : 0);
const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

const DAY = 24 * 60 * 60 * 1000;

export type DayPoint = { label: string; gross: number; net: number; orders: number };

export type Metrics = {
  totalOrders: number;
  revenue: number;
  net: number;
  avgOrder: number;
  cancelRate: number;
  avgRating: number;
  avgPrep: number;
  days: DayPoint[];
  byRestaurant: { label: string; value: number; color: string }[];
  topProducts: { name: string; count: number; revenue: number }[];
  liveOrders: number;
};

const PALETTE = ['#4f5b2a', '#b8862f', '#b4562f', '#8fa05a', '#6e8b7b', '#d9a24a'];

const dayLabel = (date: Date) =>
  date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });

export function computeMetrics(orders: Doc[], restaurants: Doc[]): Metrics {
  const revenue = orders.reduce((sum, order) => sum + N(order.total), 0);
  const totalOrders = orders.length;
  const cancelled = orders.filter((order) => T(order.status) === 'cancelled').length;
  const liveOrders = orders.filter((order) => (T(order.status) || 'live') === 'live').length;

  const rated = restaurants.filter((row) => typeof row.rating === 'number');
  const avgRating = rated.length
    ? rated.reduce((sum, row) => sum + N(row.rating), 0) / rated.length
    : 0;

  const prepValues = restaurants
    .map((row) => T(row.prep).match(/\d+/)?.[0])
    .filter((value): value is string => Boolean(value))
    .map(Number);
  const avgPrep = prepValues.length
    ? Math.round(prepValues.reduce((sum, value) => sum + value, 0) / prepValues.length)
    : 0;

  // آخر 7 أيام
  const today = new Date();
  const days: DayPoint[] = [];
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today.getTime() - index * DAY);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const end = start + DAY;
    const inRange = orders.filter((order) => {
      const time = millis(order.createdAt);
      return time >= start && time < end;
    });
    const gross = inRange.reduce((sum, order) => sum + N(order.total), 0);
    days.push({
      label: dayLabel(date),
      gross,
      net: Math.round(gross * 0.85),
      orders: inRange.length,
    });
  }

  const counts = new Map<string, number>();
  orders.forEach((order) => {
    const name = T(order.restaurantName) || 'غير معروف';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  const byRestaurant = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], index) => ({
      label,
      value,
      color: PALETTE[index % PALETTE.length],
    }));

  const productMap = new Map<string, { count: number; revenue: number }>();
  orders.forEach((order) => {
    const items = order.items;
    if (!Array.isArray(items)) return;
    items.forEach((raw) => {
      const item = raw as Record<string, unknown>;
      const name = T(item.name);
      if (!name) return;
      const qty = N(item.qty) || 1;
      const price = N(item.price);
      const current = productMap.get(name) ?? { count: 0, revenue: 0 };
      productMap.set(name, {
        count: current.count + qty,
        revenue: current.revenue + qty * price,
      });
    });
  });
  const topProducts = [...productMap.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalOrders,
    revenue,
    net: Math.round(revenue * 0.85),
    avgOrder: totalOrders ? Math.round(revenue / totalOrders) : 0,
    cancelRate: totalOrders ? (cancelled / totalOrders) * 100 : 0,
    avgRating,
    avgPrep,
    days,
    byRestaurant,
    topProducts,
    liveOrders,
  };
}

/** نسبة التغيير مقارنة بنفس الفترة السابقة. */
export function trendOf(days: DayPoint[]): number {
  const half = Math.floor(days.length / 2);
  const first = days.slice(0, half).reduce((sum, day) => sum + day.gross, 0);
  const second = days.slice(half).reduce((sum, day) => sum + day.gross, 0);
  if (first === 0) return second > 0 ? 100 : 0;
  return Math.round(((second - first) / first) * 100);
}
