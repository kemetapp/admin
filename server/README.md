# KEMET GIS — تشغيل محلي

## 1. Docker
محتاج **Docker Desktop** (Windows/Mac) أو `docker` + `docker compose` (لينكس).

## 2. تشغيل الخدمات الأساسية
```bash
docker compose up -d db redis api nginx
```
- API: http://localhost:8080
- Health: http://localhost:8080/health

## 3. بيانات OSRM (مصر) — مرة واحدة
```bash
mkdir -p data/osrm && cd data/osrm
curl -O https://download.geofabrik.de/africa/egypt-latest.osm.pbf
docker run -t -v "%cd%:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/egypt-latest.osm.pbf
docker run -t -v "%cd%:/data" osrm/osrm-backend osrm-partition /data/egypt-latest.osrm
docker run -t -v "%cd%:/data" osrm/osrm-backend osrm-customize /data/egypt-latest.osrm
docker compose up -d osrm
```

## 4. Nominatim (بحث العناوين) — مرة واحدة، ثقيل (~40GB)
```bash
docker compose up -d nominatim
docker logs -f kemet-nominatim   # استنى لحد ما يخلص الاستيراد
```

## 5. المتغيرات
انسخ `.env.example` إلى `.env` وغيّر `JWT_SECRET` و`DB_PASSWORD`.

## 6. البلاطات
- الشوارع: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (مجاني، استخدمه بلطف)
- الأقمار: Sentinel-2 cloudless من EOX — دقة **10 متر**، مش تصوير عالي الدقة.

للإنتاج: ضع كاش بلاطات (nginx مضبوط في `nginx/nginx.conf` على `/tiles/`).
