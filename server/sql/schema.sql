-- KEMET GIS schema — PostgreSQL + PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- العملاء (مربوطين بـFirebase uid)
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text UNIQUE NOT NULL,
  name        text,
  phone       text,
  role        text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','courier','admin')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- العناوين المحفوظة
CREATE TABLE IF NOT EXISTS addresses (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label     text NOT NULL,
  detail    text,
  note      text,
  place_name text,
  location  geography(Point, 4326) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS addresses_user_idx ON addresses(user_id);
CREATE INDEX IF NOT EXISTS addresses_geog_idx ON addresses USING GIST (location);

-- المطاعم
CREATE TABLE IF NOT EXISTS restaurants (
  id        text PRIMARY KEY,
  name      text NOT NULL,
  location  geography(Point, 4326),
  delivery_radius_km numeric DEFAULT 8,
  base_fee  numeric DEFAULT 8,
  per_km    numeric DEFAULT 2,
  active    boolean DEFAULT true
);
CREATE INDEX IF NOT EXISTS restaurants_geog_idx ON restaurants USING GIST (location);

-- الطلبات
CREATE TABLE IF NOT EXISTS orders (
  id            text PRIMARY KEY,
  user_id       uuid REFERENCES users(id),
  restaurant_id text REFERENCES restaurants(id),
  status        text NOT NULL DEFAULT 'pending',
  total         numeric NOT NULL DEFAULT 0,
  address_id    uuid REFERENCES addresses(id),
  drop_location geography(Point, 4326),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_drop_geog_idx ON orders USING GIST (drop_location);

-- المندوبين
CREATE TABLE IF NOT EXISTS couriers (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  phone     text,
  active    boolean DEFAULT true,
  last_location geography(Point, 4326),
  last_seen timestamptz
);
CREATE INDEX IF NOT EXISTS couriers_geog_idx ON couriers USING GIST (last_location);

-- مناطق التوصيل (مضلّعات)
CREATE TABLE IF NOT EXISTS delivery_zones (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  area       geography(Polygon, 4326) NOT NULL,
  base_fee   numeric DEFAULT 0,
  per_km     numeric DEFAULT 0,
  max_km     numeric DEFAULT 15,
  active     boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS zones_geog_idx ON delivery_zones USING GIST (area);

-- تتبّع GPS (تاريخي)
CREATE TABLE IF NOT EXISTS gps_points (
  id         bigserial PRIMARY KEY,
  courier_id uuid REFERENCES couriers(id) ON DELETE CASCADE,
  order_id   text REFERENCES orders(id) ON DELETE SET NULL,
  location   geography(Point, 4326) NOT NULL,
  heading    numeric,
  speed_kmh  numeric,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gps_courier_time_idx ON gps_points(courier_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS gps_geog_idx ON gps_points USING GIST (location);

-- قياسات محفوظة من لوحة التحكم
CREATE TABLE IF NOT EXISTS measurements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL CHECK (kind IN ('line','polygon')),
  points     jsonb NOT NULL,
  length_m   numeric,
  area_m2    numeric,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
