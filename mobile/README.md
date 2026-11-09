# كيميت · KEMET — تطبيق العميل

تطبيق توصيل أكل مصري (MVP) لمدينة **أسوان**، عربي أولاً واتجاه RTL، بهوية «فرعوني معاصر»
(زيتي + كريمي + ذهبي). مبني بـ **React Native + Expo (SDK 58)** و**Expo Router**.

> «أكل البلد، لحد باب البيت»

---

## التشغيل

```bash
npm install
npx expo start          # Expo Go / محاكي
npx expo start --web    # نسخة الويب
```

فحص المشروع:

```bash
npx tsc --noEmit        # typecheck
npx expo lint           # ESLint (eslint-config-expo)
npx expo-doctor         # فحص الاعتماديات والإعدادات
npx expo export -p web  # بناء نسخة الويب في dist/
```

> ملاحظة: Expo SDK 58 يطلب Node `>= 22.13`. على Node 20 ينجح البناء لكن الأمر
> يخرج بكود 1 مع رسالة «Something prevented Expo from exiting».

---

## الهيكل

```
src/
  app/                 # مسارات Expo Router (ملفات الراوتينج فقط)
    _layout.tsx        # Stack الجذر + تحميل الخطوط + CartProvider
    index.tsx          # تحويل حسب الجلسة/الأونبوردنج المحفوظين
    onboarding.tsx  login.tsx  signup.tsx
    (tabs)/            # الرئيسية · بحث · طلباتي · حسابي (+ سلوت السلة)
    restaurant/[id].tsx  item/[id].tsx  cart.tsx  checkout.tsx  tracking.tsx
  screens/             # محتوى الشاشات (خارج مجلد الراوتينج)
  components/          # AppText · Icon · motifs · PromoCarousel · ProductCard …
  hooks/useRtlRail.ts  # ضبط بداية الرولات الأفقية RTL
  state/
    CartContext.tsx    # السلة + الحفظ التلقائي
    storage.ts         # AsyncStorage (localStorage على الويب)
    session.ts         # الجلسة + الأونبوردنج
  data/mock.ts         # مطاعم · أقسام · منتجات · عروض · أوردرات تجريبية
  theme/               # ألوان · خطوط · ظلال · خريطة صور الأكل
  utils/arabic.ts      # مفرد/جمع «صنف/أصناف»
scripts/make-icons.ps1 # توليد الأيقونة والسبلاش (GDI+)
assets/                # icon · splash · adaptive icon · favicon
```

---

## قرارات التصميم

- **RTL يدوي**: `flexDirection: 'row-reverse'` + `textAlign: 'right'` + محاذاة
  الرولات الأفقية لآخر عنصر عبر `useRtlRail` (بدون `I18nManager.forceRTL`).
- **الخطوط**: Alexandria للعناوين، IBM Plex Sans Arabic للنصوص.
- **الزخارف**: خرطوش الشعار، قرص الشمس المجنّح، لوتس قبل عناوين الأقسام،
  إطارات ذهبية شعرية، خلفية بردية — بدون هيروغليفية مقروءة أو شخصيات كرتونية.
- **الرئيسية** بالترتيب: بانرات عرض 2:1 (سوايب) ← «هتاكل إيه النهاردة؟» ←
  «ترند دلوقتي» ← المطاعم كبانرات كاملة العرض.
- **بانر الإعلان**: صورة فقط 2:1 بدون أي كتابة فوقها (الإطار الذهبي زخرفة فقط).
- **بانر المطعم**: صورة المطعم بعرض كامل بنسبة 2:1، وتحتها بلوك معلومات
  (اسم المطعم · التقييم · التصنيف · وقت التجهيز · رسوم التوصيل).
- **السلة**: سعر ثابت للتوصيل 15 ج.م، وأكواد خصم تجريبية `KEMET25` (‏−25 ج.م)
  و`ASWAN0` (توصيل مجاني).
- **البحث والفلاتر**: فلترة بالتصنيفات + نص حر على اسم/وصف الصنف واسم/مطبخ
  المطعم، مع ترتيب «الأنسب / الأعلى تقييمًا / أقل توصيل» وحالة فراغ واضحة.
- **الأيقونة والسبلاش**: خرطوش كريمي على خلفية زيتية متدرجة بحرف «ك»
  (Alexandria ExtraBold) وشريط ذهبي — مولّدة بـ `scripts/make-icons.ps1`.

---

## التخزين المحلي

كل البيانات بتتحفظ على الجهاز عبر AsyncStorage (و`localStorage` على الويب)،
بمفاتيح بادئتها `kemet:v1:`:

| المفتاح | المحتوى |
| --- | --- |
| `kemet:v1:cart` | أصناف السلة + كود الخصم |
| `kemet:v1:session` | اسم/تليفون/تاريخ العضوية |
| `kemet:v1:onboarded` | إن المستخدم خلّص الأونبوردنج |

- أول تشغيل → أونبوردنج. بعد التخطي/الإكمال → تسجيل الدخول. بعد الدخول →
  الرئيسية مباشرة عند أي إعادة تشغيل.
- تغييرات السلة بتتحفظ فورًا، وتسجيل الخروج بيمسح الجلسة فقط (السلة بتفضل).
- لمسح كل بيانات كيميت محليًا: `clearAll()` من `src/state/storage.ts`.

---

## الأيقونة والسبلاش

```bash
powershell -ExecutionPolicy Bypass -File scripts\make-icons.ps1
```

السكربت بيولّد `icon.png` (1024) · `splash-icon.png` (1024) ·
`android-icon-{background,foreground,monochrome}.png` · `favicon.png`.
بيستخدم GDI+ وخط Alexandria من `node_modules`، وبيعاير تمركز الحرف بقياس
حبر الرسم — فالنتيجة ثابتة (deterministic) من غير أي أدوات خارجية.

> السكربت لازم يتحفظ UTF-8 **مع BOM** عشان PowerShell 5.1 يقرأ النصوص العربية.

---

## QA (نسخة الويب)

```bash
npx expo export -p web
node qa-setup.js        # يكتب dist/qa.html (إطار 390×844)
node qa-server.js       # http://localhost:4174/qa.html
```

`qa-server.js` سيرفر ثابت بسيط بدون clean URLs (لأن `/qa.html` لازم تفضل كما هي).

---

## الحالة

- الشاشات: أونبوردنج (3) · دخول · تسجيل · رئيسية · مطعم · تخصيص صنف ·
  سلة · دفع · تتبع · طلباتي · بحث · حسابي — كلها متصلة ببعضها.
- **الجلسة والأونبوردنج والسلة** بتتحفظ محليًا وتفضل بعد إعادة التشغيل.
- **البحث** شغّال: تصنيفات + نص حر + ترتيب + مسح الفلاتر + حالة فراغ.
- **أيقونة وسبلاش** مخصصين بهوية كيميت (بدل أيقونة Expo الافتراضية).
- `npx tsc --noEmit` و`npx expo lint` نظاف، `npx expo-doctor` ‏20/20،
  وبناء الويب وبناء أندرويد (Hermes) بينجحوا.
- البيانات كلها تجريبية (`src/data/mock.ts`) — مفيش باك إند لسه.
- **الخطوة الجاية**: صور مطاعم حقيقية، باك إند + OTP، ودفع أونلاين.
