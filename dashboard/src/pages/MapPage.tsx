import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker, MapMouseEvent } from 'maplibre-gl';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PageHeader } from '../components/layout';
import { Btn, Icon, SearchBox, ToastHost, useToast } from '../components/ui';
import { saveDoc, useCollectionDocs } from '../lib/db';
import { formatArea, formatMeters, haversineMeters, pathMeters, polygonAreaM2, polygonPerimeterM, etaMinutes, type LatLng } from '../lib/geo';
import { MAP_MODES, styleFor, type MapMode } from '../lib/tiles';

const ASUAN: [number, number] = [32.8998, 24.0915];
type Mode = 'idle' | 'pin' | 'measure' | 'zone' | 'courier';

export function MapPage() {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');
  const [mapMode, setMapMode] = useState<MapMode>('street');
  const [points, setPoints] = useState<LatLng[]>([]);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [address, setAddress] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [route, setRoute] = useState<{ meters: number; seconds: number } | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast, show } = useToast();
  const zones = useCollectionDocs('zones');
  const restaurants = useCollectionDocs('restaurants');
  const orders = useCollectionDocs('orders');
  const [trackOrderId, setTrackOrderId] = useState('');

  const modeRef = useRef(mode);
  modeRef.current = mode;

  /* إنشاء الخريطة */
  useEffect(() => {
    if (!container.current || map.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: styleFor('street') as never,
      center: ASUAN,
      zoom: 12,
      attributionControl: { compact: true },
    });
    instance.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');
    instance.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    instance.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), 'top-left');

    instance.on('load', () => setReady(true));
    instance.on('click', (event: MapMouseEvent) => {
      const next = { lat: Number(event.lngLat.lat.toFixed(6)), lng: Number(event.lngLat.lng.toFixed(6)) };
      const current = modeRef.current;
      if (current === 'pin') {
        setPin(next);
        setPoints([next]);
        void reverseGeocode(next);
      } else if (current === 'measure' || current === 'zone') {
        setPoints((prev) => [...prev, next]);
      } else if (current === 'courier') {
        void sendCourier(next);
      }
    });

    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  /* تبديل الطبقة */
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setStyle(styleFor(mapMode) as never);
  }, [mapMode, ready]);

  /* رسم النقاط والخطوط */
  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;

    markers.current.forEach((marker) => marker.remove());
    markers.current = points.map((point, index) =>
      new maplibregl.Marker({ color: mode === 'zone' ? '#b4562f' : '#4f5b2a' })
        .setLngLat([point.lng, point.lat])
        .setPopup(new maplibregl.Popup().setText(`نقطة ${index + 1} · ${point.lat}, ${point.lng}`))
        .addTo(instance),
    );

    const addGeo = () => {
      if (!instance.getStyle()) return;
      const lineId = 'measure-line';
      const fillId = 'zone-fill';
      if (instance.getLayer(lineId)) instance.removeLayer(lineId);
      if (instance.getLayer(fillId)) instance.removeLayer(fillId);
      if (instance.getSource('measure')) instance.removeSource('measure');
      if (instance.getSource('zone')) instance.removeSource('zone');

      if (points.length >= 2) {
        const coords = points.map((point) => [point.lng, point.lat]);
        instance.addSource('measure', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
        });
        instance.addLayer({
          id: lineId,
          type: 'line',
          source: 'measure',
          paint: { 'line-color': mode === 'zone' ? '#b4562f' : '#4f5b2a', 'line-width': 3, 'line-dasharray': [2, 1] },
        });
      }
      if (mode === 'zone' && points.length >= 3) {
        const ring = [...points.map((point) => [point.lng, point.lat]), [points[0].lng, points[0].lat]];
        instance.addSource('zone', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} },
        });
        instance.addLayer({
          id: fillId,
          type: 'fill',
          source: 'zone',
          paint: { 'fill-color': '#4f5b2a', 'fill-opacity': 0.18, 'fill-outline-color': '#b4562f' },
        });
      }
    };

    if (instance.isStyleLoaded()) addGeo();
    else instance.once('idle', addGeo);
  }, [points, ready, mode]);

  /* مطاعم على الخريطة */
  useEffect(() => {
    if (!ready || !map.current) return;
    restaurants.rows.forEach((row) => {
      const lat = Number(row.lat);
      const lng = Number(row.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const marker = new maplibregl.Marker({ color: '#d9a24a' })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setText(String(row.name ?? 'مطعم')))
        .addTo(map.current!);
      markers.current.push(marker);
    });
  }, [ready, restaurants.rows]);

  /* رسم حدود مناطق التوصيل المحفوظة */
  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;

    const draw = () => {
      if (!instance.getStyle()) return;
      if (instance.getLayer('zones-fill')) instance.removeLayer('zones-fill');
      if (instance.getSource('zones')) instance.removeSource('zones');

      const features = zones.rows
        .map((zone) => {
          const points = Array.isArray(zone.points) ? (zone.points as LatLng[]) : [];
          if (points.length < 3) return null;
          const ring = [...points.map((point) => [point.lng, point.lat]), [points[0].lng, points[0].lat]];
          return {
            type: 'Feature' as const,
            properties: { name: String(zone.name ?? 'منطقة') },
            geometry: { type: 'Polygon' as const, coordinates: [ring] },
          };
        })
        .filter((feature): feature is NonNullable<typeof feature> => feature !== null);

      if (features.length === 0) return;

      instance.addSource('zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });
      instance.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': '#4f5b2a',
          'fill-opacity': 0.12,
          'fill-outline-color': '#b4562f',
        },
      });
    };

    if (instance.isStyleLoaded()) draw();
    else instance.once('idle', draw);
  }, [ready, zones.rows, mapMode]);

  /** إرسال موقع المندوب لطلب معيّن — بيظهر للعميل لحظيًا في التطبيق. */
  const sendCourier = async (point: LatLng) => {
    if (!trackOrderId) {
      show('اختار طلب الأول', 'error');
      return;
    }
    try {
      await setDoc(
        doc(db, 'tracking', trackOrderId),
        { lat: point.lat, lng: point.lng, updatedAt: serverTimestamp() },
        { merge: true },
      );
      show('تم تحديث موقع المندوب');
    } catch {
      show('التحديث فشل — راجع الصلاحيات', 'error');
    }
  };

  const reverseGeocode = async (point: LatLng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}&accept-language=ar`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = (await response.json()) as { display_name?: string };
      setAddress(data.display_name ?? '');
    } catch {
      setAddress('');
    }
  };

  const search = async () => {
    if (query.trim().length < 3) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ar&viewbox=32.7,24.2,33.1,23.9&bounded=0&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = (await response.json()) as { display_name: string; lat: string; lon: string }[];
      setResults(
        data.map((item) => ({ label: item.display_name, lat: Number(item.lat), lng: Number(item.lon) })),
      );
    } catch {
      show('البحث فشل — جرّب تاني', 'error');
    }
  };

  const buildRoute = async (target: LatLng) => {
    const origin = restaurants.rows[0];
    const lat = Number(origin?.lat);
    const lng = Number(origin?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      show('محتاج مطعم عنده إحداثيات', 'error');
      return;
    }
    setBusy(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${target.lng},${target.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = (await response.json()) as {
        routes?: { distance: number; duration: number; geometry: { coordinates: number[][] } }[];
      };
      const first = data.routes?.[0];
      if (!first || !map.current) throw new Error('no route');
      setRoute({ meters: first.distance, seconds: first.duration });

      const instance = map.current;
      const draw = () => {
        if (instance.getSource('route')) instance.removeSource('route');
        if (instance.getLayer('route-line')) instance.removeLayer('route-line');
        instance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: first.geometry.coordinates },
          },
        });
        instance.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#b4562f', 'line-width': 5, 'line-opacity': 0.9 },
        });
        const bounds = first.geometry.coordinates.reduce(
          (box, coordinate) => box.extend(coordinate as [number, number]),
          new maplibregl.LngLatBounds(
            first.geometry.coordinates[0] as [number, number],
            first.geometry.coordinates[0] as [number, number],
          ),
        );
        instance.fitBounds(bounds, { padding: 60 });
      };
      if (instance.isStyleLoaded()) draw();
      else instance.once('idle', draw);
    } catch {
      show('حساب المسار فشل (OSRM)', 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveZone = async () => {
    if (points.length < 3) return show('المضلّع محتاج 3 نقاط على الأقل', 'error');
    const area = polygonAreaM2(points);
    try {
      await saveDoc('zones', null, {
        name: zoneName.trim() || 'منطقة توصيل',
        points,
        areaM2: Math.round(area),
        perimeterM: Math.round(polygonPerimeterM(points)),
      });
      show('اتحفظت المنطقة');
      setZoneName('');
      setPoints([]);
    } catch {
      show('الحفظ فشل — راجع صلاحيات zones', 'error');
    }
  };

  const straight = points.length >= 2 ? pathMeters(points) : 0;
  const area = points.length >= 3 ? polygonAreaM2(points) : 0;

  return (
    <>
      <PageHeader
        title="الخرائط والتوصيل"
        note="OpenStreetMap · Sentinel-2 · OSRM — مجاني ومفتوح المصدر"
        actions={
          <div className="seg">
            {MAP_MODES.map((item) => (
              <button
                key={item.id}
                className={mapMode === item.id ? 'on' : ''}
                onClick={() => setMapMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="map-layout">
        <div className="map-side">
          <div className="map-tools">
            <Btn variant={mode === 'pin' ? 'primary' : 'ghost'} onClick={() => { setMode('pin'); setPoints([]); }}>
              <Icon name="pin" size={14} /> تحديد موقع
            </Btn>
            <Btn variant={mode === 'measure' ? 'primary' : 'ghost'} onClick={() => { setMode('measure'); setPoints([]); }}>
              <Icon name="chart" size={14} /> قياس
            </Btn>
            <Btn variant={mode === 'zone' ? 'primary' : 'ghost'} onClick={() => { setMode('zone'); setPoints([]); }}>
              <Icon name="categories" size={14} /> منطقة
            </Btn>
            <Btn variant={mode === 'courier' ? 'primary' : 'ghost'} onClick={() => { setMode('courier'); setPoints([]); }}>
              <Icon name="courier" size={14} /> موقع مندوب
            </Btn>
            <Btn onClick={() => { setMode('idle'); setPoints([]); setPin(null); setRoute(null); }}>مسح</Btn>
          </div>

          {mode === 'courier' ? (
            <div className="map-card">
              <div className="cell-title">تتبّع مباشر</div>
              <select
                value={trackOrderId}
                onChange={(event) => setTrackOrderId(event.target.value)}
                style={{ width: '100%', marginTop: 6 }}
              >
                <option value="">اختار طلب…</option>
                {orders.rows
                  .filter((row) => {
                    const status = String(row.status ?? 'pending');
                    return status !== 'delivered' && status !== 'cancelled';
                  })
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      #{String(row.number ?? row.id.slice(0, 6))} · {String(row.restaurantName ?? 'طلب')}
                    </option>
                  ))}
              </select>
              <p className="hint" style={{ marginTop: 6 }}>
                دوس على الخريطة عند مكان المندوب — الموقع بيوصل للعميل فورًا.
              </p>
            </div>
          ) : null}

          <SearchBox value={query} onChange={setQuery} placeholder="ابحث عن عنوان…" />
          <Btn size="sm" onClick={() => void search()} style={{ marginTop: 6 }}>
            بحث في Nominatim
          </Btn>

          {results.length > 0 ? (
            <ul className="map-results">
              {results.map((item) => (
                <li key={`${item.lat},${item.lng}`}>
                  <button
                    onClick={() => {
                      map.current?.flyTo({ center: [item.lng, item.lat], zoom: 16 });
                      setPin({ lat: item.lat, lng: item.lng });
                      setAddress(item.label);
                      setResults([]);
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {pin ? (
            <div className="map-card">
              <div className="cell-title">الموقع المحدد</div>
              <div className="cell-sub" dir="ltr">
                {pin.lat}, {pin.lng}
              </div>
              {address ? <div className="cell-sub">{address}</div> : null}
              <div className="map-actions">
                <Btn size="sm" onClick={() => void buildRoute(pin)} disabled={busy}>
                  {busy ? '…' : 'مسار الطريق'}
                </Btn>
                <Btn
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(`${pin.lat}, ${pin.lng}`);
                    show('اتنسخ الإحداثيات');
                  }}
                >
                  نسخ
                </Btn>
              </div>
            </div>
          ) : null}

          {route ? (
            <div className="map-card">
              <div className="cell-title">المسار (OSRM)</div>
              <div className="cell-sub">طريق فعلي: {formatMeters(route.meters)}</div>
              <div className="cell-sub">
                زمن متوقع: {Math.round(route.seconds / 60)} دقيقة
              </div>
              {pin ? (
                <div className="cell-sub">
                  خط مستقيم: {formatMeters(haversineMeters(
                    { lat: Number(restaurants.rows[0]?.lat), lng: Number(restaurants.rows[0]?.lng) },
                    pin,
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {points.length > 0 ? (
            <div className="map-card">
              <div className="cell-title">{mode === 'zone' ? 'المضلّع' : 'القياس'}</div>
              <div className="cell-sub">
                خط مستقيم: {formatMeters(straight)} · {points.length} نقطة
              </div>
              {mode === 'zone' && points.length >= 3 ? (
                <>
                  <div className="cell-sub">المساحة: {formatArea(area)}</div>
                  <div className="cell-sub">المحيط: {formatMeters(polygonPerimeterM(points))}</div>
                  <input
                    className="input"
                    placeholder="اسم المنطقة"
                    value={zoneName}
                    onChange={(event) => setZoneName(event.target.value)}
                    style={{ marginTop: 8 }}
                  />
                  <Btn size="sm" variant="primary" onClick={() => void saveZone()} style={{ marginTop: 6 }}>
                    حفظ المنطقة
                  </Btn>
                </>
              ) : null}
              {mode === 'measure' && straight > 0 ? (
                <div className="cell-sub">زمن تقريبي: {etaMinutes(straight)} دقيقة</div>
              ) : null}
            </div>
          ) : null}

          {zones.rows.length > 0 ? (
            <div className="map-card">
              <div className="cell-title">مناطق محفوظة</div>
              <ul className="map-results">
                {zones.rows.map((zone) => (
                  <li key={zone.id}>
                    <span>{String(zone.name ?? 'منطقة')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="map-canvas-wrap">
          <div ref={container} className="map-canvas" />
          {!ready ? <div className="map-loading">بيتم تحميل الخريطة…</div> : null}
        </div>
      </div>

      <ToastHost toast={toast} />
    </>
  );
}
