export type LatLng = { lat: number; lng: number };

const R = 6371008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** المسافة بخط مستقيم (Haversine) بالمتر. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const formatMeters = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(2)} كم` : `${Math.round(m)} م`;

/** زمن تقريبي بالدقائق على متوسط سرعة. */
export const etaMinutes = (meters: number, speedKmh = 24) =>
  Math.max(1, Math.round((meters / 1000 / speedKmh) * 60));

/** هل النقطة جوه المضلّع؟ (ray casting) */
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
