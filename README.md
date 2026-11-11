# KEMET — منصة توصيل الطعام

مشروع واحد فيه تطبيق العميل ولوحة الإدارة، مربوطين بنفس قاعدة بيانات Firebase.

```
mobile/      تطبيق العميل (Expo SDK 58 · React Native · expo-router)
dashboard/   لوحة الإدارة (Vite · React 19 · TypeScript)
server/      خدمات GIS (PostGIS · OSRM · Nominatim) — جاهزة للتشغيل عبر Docker
docs/        توثيق Firebase ونموذج البيانات
```

## التشغيل

```bash
# التطبيق
cd mobile && npm install && npx expo start

# لوحة التحكم
cd dashboard && npm install && npm run dev
```

## قاعدة البيانات

Firebase (Firestore + Auth). القواعد في [`firestore.rules`](firestore.rules) — لازم تُنشر من Firebase Console قبل الاستخدام.

## المزايا

- **التطبيق:** تصفّح · سلة · دفع · تتبّع حي · محفظة · مفضلة · شات دعم · مجتمع
- **اللوحة:** 15 شاشة إدارة — مطاعم · أصناف · فئات · طلبات · مندوبين · مالية · تقارير · رسائل · دعم · خرائط · إعدادات
- **الخرائط:** MapLibre + OpenStreetMap + Sentinel-2 (مفتوحة المصدر)
- **الصور:** مضغوطة ومحفوظة داخل Firestore (بدون تكلفة Storage)

## الحقوق

MIT
