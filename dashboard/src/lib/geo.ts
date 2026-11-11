export type LatLng = { lat: number; lng: number };

const R = 6371008.8; // متوسط نصف قطر الأرض بالمتر
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** المسافة بخط مستقيم (Haversine) بالمتر. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** طول خط مستقيم عبر عدة نقاط (متر). */
export function pathMeters(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += haversineMeters(points[i - 1], points[i]);
  return total;
}

/** مساحة مضلّع على سطح كرة (متر مربع) — دقيقة للحدود المحلية. */
export function polygonAreaM2(points: LatLng[]): number {
  if (points.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    total +=
      (toRad(p2.lng) - toRad(p1.lng)) * (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
  }
  return Math.abs((total * R * R) / 2);
}

/** محيط مضلّع (متر) — بيقفل الضلع الأخير. */
export function polygonPerimeterM(points: LatLng[]): number {
  if (points.length < 2) return 0;
  return pathMeters([...points, points[0]]);
}

export const formatMeters = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(2)} كم` : `${Math.round(m)} م`;

export const formatArea = (m2: number) => {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} كم²`;
  if (m2 >= 10_000) return `${(m2 / 10_000).toFixed(2)} هكتار`;
  return `${Math.round(m2).toLocaleString('ar-EG')} م²`;
};

/** وقت التقريب بسرعة متوسطة (كم/ساعة). */
export const etaMinutes = (meters: number, speedKmh = 24) =>
  Math.max(1, Math.round((meters / 1000 / speedKmh) * 60));

/** مركز نقاط. */
export function centerOf(points: LatLng[]): LatLng | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), {
    lat: 0,
    lng: 0,
  });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** هل نقطة داخل مضلّع (ray casting). */
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects =
      a.lat > point.lat !== b.lat > point.lat &&
      point.lng < ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (intersects) inside = !inside;
  }
  return inside;
}
