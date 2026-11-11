import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { createClient } from 'redis';
import { WebSocketServer, type WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 4000);
const OSRM = process.env.OSRM_URL ?? 'http://localhost:5000';
const NOMINATIM = process.env.NOMINATIM_URL ?? 'http://localhost:8081';
const JWT_SECRET = process.env.JWT_SECRET ?? 'change_me_in_production';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect().catch(() => undefined);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

type Role = 'customer' | 'courier' | 'admin';
type Auth = { uid: string; role: Role };

function auth(req: express.Request): Auth | null {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; role?: Role };
    if (!payload.sub) return null;
    return { uid: payload.sub, role: payload.role ?? 'customer' };
  } catch {
    return null;
  }
}

const requireAuth =
  (roles: Role[] = ['customer', 'courier', 'admin']) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = auth(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'forbidden' });
    (req as express.Request & { user: Auth }).user = user;
    next();
  };

const point = (lat: number, lng: number) => `SRID=4326;POINT(${lng} ${lat})`;

/* ------------------------------- health ------------------------------- */
app.get('/health', async (_req, res) => {
  const db = await pool.query('select postgis_version() as v').then((r) => r.rows[0].v).catch(() => null);
  res.json({ ok: true, db: Boolean(db), postgis: db, redis: redis.isOpen });
});

/* ------------------------------ geocoding ----------------------------- */
app.get('/api/geocode', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 3) return res.status(400).json({ error: 'query too short' });
  const key = `geo:${q.toLowerCase()}`;
  const cached = await redis.get(key).catch(() => null);
  if (cached) return res.json({ source: 'cache', results: JSON.parse(cached) });
  try {
    const response = await fetch(
      `${NOMINATIM}/search?format=jsonv2&limit=5&accept-language=ar&q=${encodeURIComponent(q)}`,
    );
    const data = await response.json();
    await redis.set(key, JSON.stringify(data), { EX: 86400 }).catch(() => undefined);
    res.json({ source: 'nominatim', results: data });
  } catch {
    res.status(502).json({ error: 'geocoder unavailable' });
  }
});

app.get('/api/reverse', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'bad coords' });
  const key = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = await redis.get(key).catch(() => null);
  if (cached) return res.json({ source: 'cache', result: JSON.parse(cached) });
  try {
    const response = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&accept-language=ar&lat=${lat}&lon=${lng}`,
    );
    const data = await response.json();
    await redis.set(key, JSON.stringify(data), { EX: 86400 }).catch(() => undefined);
    res.json({ source: 'nominatim', result: data });
  } catch {
    res.status(502).json({ error: 'geocoder unavailable' });
  }
});

/* ------------------------------- distance ----------------------------- */
app.get('/api/distance', async (req, res) => {
  const fromLat = Number(req.query.fromLat);
  const fromLng = Number(req.query.fromLng);
  const toLat = Number(req.query.toLat);
  const toLng = Number(req.query.toLng);
  const mode = String(req.query.mode ?? 'both');
  if ([fromLat, fromLng, toLat, toLng].some((n) => !Number.isFinite(n))) {
    return res.status(400).json({ error: 'bad coords' });
  }

  const straightQuery = await pool.query(
    `select ST_Distance($1::geography, $2::geography) as meters`,
    [point(fromLat, fromLng), point(toLat, toLng)],
  );
  const straight = Number(straightQuery.rows[0].meters);

  let road: { meters: number; seconds: number } | null = null;
  if (mode !== 'straight') {
    try {
      const response = await fetch(
        `${OSRM}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`,
      );
      const data = (await response.json()) as { routes?: { distance: number; duration: number }[] };
      const first = data.routes?.[0];
      if (first) road = { meters: first.distance, seconds: first.duration };
    } catch {
      road = null;
    }
  }

  res.json({
    straightMeters: Math.round(straight),
    roadMeters: road ? Math.round(road.meters) : null,
    roadSeconds: road ? Math.round(road.seconds) : null,
    ratio: road ? Number((road.meters / Math.max(1, straight)).toFixed(2)) : null,
  });
});

/* -------------------------------- route ------------------------------- */
app.get('/api/route', async (req, res) => {
  const fromLat = Number(req.query.fromLat);
  const fromLng = Number(req.query.fromLng);
  const toLat = Number(req.query.toLat);
  const toLng = Number(req.query.toLng);
  if ([fromLat, fromLng, toLat, toLng].some((n) => !Number.isFinite(n))) {
    return res.status(400).json({ error: 'bad coords' });
  }
  try {
    const response = await fetch(
      `${OSRM}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
    );
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(502).json({ error: 'router unavailable' });
  }
});

/* ------------------------------ addresses ----------------------------- */
app.get('/api/addresses', requireAuth(), async (req, res) => {
  const user = (req as express.Request & { user: Auth }).user;
  const rows = await pool.query(
    `select a.id, a.label, a.detail, a.note, a.place_name,
            ST_Y(a.location::geometry) as lat, ST_X(a.location::geometry) as lng
       from addresses a join users u on u.id = a.user_id
      where u.firebase_uid = $1 order by a.created_at desc`,
    [user.uid],
  );
  res.json(rows.rows);
});

app.post('/api/addresses', requireAuth(), async (req, res) => {
  const user = (req as express.Request & { user: Auth }).user;
  const { label, detail, note, placeName, lat, lng } = req.body as Record<string, unknown>;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !label) {
    return res.status(400).json({ error: 'label, lat, lng required' });
  }
  const inserted = await pool.query(
    `insert into addresses (user_id, label, detail, note, place_name, location)
     select id, $2, $3, $4, $5, $6::geography from users where firebase_uid = $1
     returning id`,
    [user.uid, label, detail ?? null, note ?? null, placeName ?? null, point(lat, lng)],
  );
  if (inserted.rowCount === 0) return res.status(404).json({ error: 'user not found' });
  res.status(201).json({ id: inserted.rows[0].id });
});

app.delete('/api/addresses/:id', requireAuth(), async (req, res) => {
  const user = (req as express.Request & { user: Auth }).user;
  const deleted = await pool.query(
    `delete from addresses a using users u
      where a.id = $1 and a.user_id = u.id and u.firebase_uid = $2`,
    [req.params.id, user.uid],
  );
  res.status(deleted.rowCount ? 204 : 404).end();
});

/* -------------------------------- zones ------------------------------- */
app.get('/api/zones', requireAuth(), async (_req, res) => {
  const rows = await pool.query(
    `select id, name, base_fee, per_km, max_km, active,
            ST_AsGeoJSON(area::geometry) as geojson
       from delivery_zones where active order by name`,
  );
  res.json(rows.rows);
});

app.post('/api/zones', requireAuth(['admin']), async (req, res) => {
  const { name, points, baseFee, perKm, maxKm } = req.body as {
    name?: string;
    points?: { lat: number; lng: number }[];
    baseFee?: number;
    perKm?: number;
    maxKm?: number;
  };
  if (!name || !Array.isArray(points) || points.length < 3) {
    return res.status(400).json({ error: 'name and 3+ points required' });
  }
  const ring = [...points, points[0]].map((p) => `${p.lng} ${p.lat}`).join(',');
  const inserted = await pool.query(
    `insert into delivery_zones (name, area, base_fee, per_km, max_km)
     values ($1, ST_GeogFromText($2), $3, $4, $5) returning id`,
    [name, `SRID=4326;POLYGON((${ring}))`, baseFee ?? 0, perKm ?? 0, maxKm ?? 15],
  );
  res.status(201).json({ id: inserted.rows[0].id });
});

app.delete('/api/zones/:id', requireAuth(['admin']), async (req, res) => {
  const deleted = await pool.query('delete from delivery_zones where id = $1', [req.params.id]);
  res.status(deleted.rowCount ? 204 : 404).end();
});

/** هل نقطة داخل أي منطقة توصيل؟ */
app.get('/api/zones/check', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'bad coords' });
  const rows = await pool.query(
    `select id, name, base_fee, per_km from delivery_zones
      where active and ST_Contains(area::geometry, $1::geometry)`,
    [point(lat, lng)],
  );
  res.json({ covered: (rows.rowCount ?? 0) > 0, zones: rows.rows });
});

/* --------------------------------- gps -------------------------------- */
app.post('/api/gps', requireAuth(['courier', 'admin']), async (req, res) => {
  const user = (req as express.Request & { user: Auth }).user;
  const { courierId, orderId, lat, lng, heading, speedKmh } = req.body as Record<string, unknown>;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat, lng required' });
  }
  await pool.query(
    `insert into gps_points (courier_id, order_id, location, heading, speed_kmh)
     values ($1, $2, $3::geography, $4, $5)`,
    [courierId ?? null, orderId ?? null, point(lat, lng), heading ?? null, speedKmh ?? null],
  );
  if (courierId) {
    await pool.query(
      `update couriers set last_location = $2::geography, last_seen = now() where id = $1`,
      [courierId, point(lat, lng)],
    );
  }
  const payload = JSON.stringify({ type: 'gps', courierId, orderId, lat, lng, heading, speedKmh });
  await redis.publish('kemet:gps', payload).catch(() => undefined);
  broadcast(payload);
  res.status(202).json({ ok: true, uid: user.uid });
});

app.get('/api/tracking/:orderId', requireAuth(), async (req, res) => {
  const latest = await pool.query(
    `select ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng,
            heading, speed_kmh, recorded_at
       from gps_points where order_id = $1
      order by recorded_at desc limit 1`,
    [req.params.orderId],
  );
  res.json({ last: latest.rows[0] ?? null });
});

/* ------------------------------ websocket ----------------------------- */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<WebSocket>();

wss.on('connection', (socket, request) => {
  const token = new URL(request.url ?? '/', 'http://localhost').searchParams.get('token') ?? '';
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    socket.close(4401, 'unauthorized');
    return;
  }
  clients.add(socket);
  socket.on('close', () => clients.delete(socket));
  socket.send(JSON.stringify({ type: 'hello' }));
});

function broadcast(payload: string) {
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(payload);
  });
}

// بثّ GPS من Redis لباقي نسخ الـAPI (توسّع أفقي)
const subscriber = redis.duplicate();
await subscriber.connect().catch(() => undefined);
await subscriber.subscribe('kemet:gps', (message) => broadcast(message)).catch(() => undefined);

server.listen(PORT, () => {
  console.log(`KEMET GIS API on :${PORT} (osrm=${OSRM}, nominatim=${NOMINATIM})`);
});
