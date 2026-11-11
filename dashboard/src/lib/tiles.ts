/**
 * مصادر البلاطات — كلها مجانية وقانونية وبدون مفاتيح.
 * الشوارع: OpenStreetMap. الأقمار: Sentinel-2 cloudless (EOX, 10 متر/بكسل).
 */

export const ATTRIBUTION_OSM =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const ATTRIBUTION_SENTINEL =
  'Sentinel-2 cloudless (<a href="https://s2maps.eu">s2maps.eu</a>) by EOX';

export const OSM_TILES = {
  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  tileSize: 256,
  maxzoom: 19,
  attribution: ATTRIBUTION_OSM,
};

/** Sentinel-2 cloudless 2020 — دقة 10 متر، مجانية بالكامل. */
export const SENTINEL_TILES = {
  tiles: [
    'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
  ],
  tileSize: 256,
  maxzoom: 15,
  attribution: ATTRIBUTION_SENTINEL,
};

export type MapMode = 'street' | 'satellite' | 'hybrid';

export const MAP_MODES: { id: MapMode; label: string }[] = [
  { id: 'street', label: 'شوارع' },
  { id: 'satellite', label: 'أقمار صناعية' },
  { id: 'hybrid', label: 'هجين' },
];

/** أسلوب الخريطة حسب الوضع — الهجين = أقمار + شوارع شفافة فوقها. */
export function styleFor(mode: MapMode): { version: 8; sources: Record<string, unknown>; layers: unknown[] } {
  const sources: Record<string, unknown> = {};
  const layers: unknown[] = [];

  if (mode === 'street') {
    sources.osm = { type: 'raster', ...OSM_TILES };
    layers.push({ id: 'osm', type: 'raster', source: 'osm' });
  } else {
    sources.satellite = { type: 'raster', ...SENTINEL_TILES };
    layers.push({ id: 'satellite', type: 'raster', source: 'satellite' });
    if (mode === 'hybrid') {
      sources.street = { type: 'raster', ...OSM_TILES };
      layers.push({
        id: 'street-overlay',
        type: 'raster',
        source: 'street',
        paint: { 'raster-opacity': 0.35 },
      });
    }
  }

  return { version: 8, sources, layers };
}
