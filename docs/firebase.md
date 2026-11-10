# Firebase — الربط والدليل

## المشروع

| | |
|---|---|
| **projectId** | `kemet-app-eaa34` |
| **Auth** | Email/Password |
| **Database** | Firestore |
| **التطبيق** | `mobile/` بـSDK **`firebase` JS** (بيشتغل على Expo Go) |

> استخدمنا **JS SDK** مش `@react-native-firebase` لأن الأخير محتاج native code
> وdevelopment build، يعني مش هيشتغل في Expo Go.

---

## 1) إزاي بنعمل «رقم + باسورد» بدون OTP

Firebase مفيهاش Phone+Password. عشان نفضل على الخطة المجانية وبدون OTP،
بنحوّل الرقم لإيميل داخلي ثابت:

```
01012345678  →  01012345678@kemet.app
```

- العميل بيشوف ويُدخِل **رقم موبايل + باسورد**.
- التخزين تحت بيستخدم **Email/Password** الرسمي.
- لما نضيف OTP بعدين: الرقم موجود أصلًا في `users/{uid}.phone`، فالترقية
  بتبقى إضافة خطوة تحقق مش إعادة بناء.

الكود: `mobile/src/api/auth.ts`

---

## 2) شكل البيانات

```
users/{uid}
  name        : string
  phone       : string          // 01xxxxxxxxx
  role        : 'customer' | 'admin'
  createdAt   : timestamp
  addresses   : Address[]       // لسه محليًا، هيتنقل هنا في المرحلة 4
  favorites   : string[]        // ids مطاعم

categories/{id}
  label, image, order

restaurants/{id}
  name, cuisine, tags, rating, reviews, prep, deliveryFee,
  image, sticker?, menuTabs[], active: boolean

products/{id}
  restaurantId, name, description, price, image,
  category, serving?, sizes?, extras[]

promos/{id}
  kicker, title, code, image, active

orders/{id}
  userId, restaurantId, restaurantName, items[], itemsCount,
  subtotal, delivery, discount, total, promo?,
  status: 'live' | 'delivered' | 'cancelled',
  address: { label, detail, note? },
  payment:  { kind, label },
  createdAt, eta?

settings/app
  storeName, supportPhone, whatsapp, email,
  deliveryFee, freeDeliveryOver, minOrder, etaMinutes, serviceAreas,
  taxPercent, payCash, payWallet, payCard,
  storeOpen, acceptingOrders, openTime, closeTime,
  notifyOrders, notifyCustomers, notifyMarketing,
  couponsEnabled, maxDiscount, updatedAt
```

---

## 3) قواعد Firestore — **لازم تنشرها**

من غير القواعد دي، أول عملية تسجيل هترجع `permission-denied`.

**Firebase Console → Firestore Database → تبويب Rules → الصق → Publish**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isSignedIn() && userDoc().role == 'admin';
    }

    // المستخدم بيقرا ويعدّل ملفه بس، والأدمن بيشوف الكل
    match /users/{uid} {
      allow read:   if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow create: if isSignedIn() && request.auth.uid == uid;
      allow update: if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow delete: if isAdmin();
    }

    // الكتالوج: قراءة للجميع، كتابة للأدمن فقط
    match /categories/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /restaurants/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /products/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /promos/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // الإعدادات + الرسائل + التذاكر — قراءة للجميع، كتابة للأدمن فقط
    match /settings/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /messages/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /tickets/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // المندوبين والطلبات الجديدة من التطبيق
    match /couriers/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // الطلبات: العميل بيعمل طلبه ويقرا طلباته، والأدمن بيدير الحالة
    match /orders/{id} {
      allow read:   if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

> **ليه `get()` في كل طلب؟** ده استعلام إضافي بيتحسب من حصة القراءة.
> مقبول للمرحلة دي؛ لو الحجم كبر بننقل `role` لـCustom Claims (محتاج Blaze).

---

## 4) خطوات لسه عليك

1. **Firestore → Rules → الصق القواعد → Publish** ← الأهم
2. **Authentication → Sign-in method → Email/Password** يكون **Enabled**
3. بعد ما تعمل أول حساب من التطبيق، افتح **Firestore → users** وغيّر
   `role` بتاعك من `customer` لـ**`admin`** — كده تبقى الأدمن.
4. **⚙️ Project settings → Your apps → Add app → Web** باسم `kemet-dashboard`
   عشان لوحة التحكم (ليها نفس الإعدادات، مفيش app جديد مطلوب فعليًا —
   نفس `firebaseConfig` شغال للاتنين).

---

## 5) ملاحظات أمان

- `apiKey` و`appId` **عامة** بطبيعتها — بتظهر في كود أي تطبيق Firebase.
  الحماية الحقيقية هي **القواعد** فوق.
- **ممنوع** تحط مفتاح Service Account (ملف JSON) في التطبيق أو في المستودع.
  لوحة التحكم بتستخدم نفس الـconfig العام + دور `admin`.
- قبل رفع المشروع على GitHub تأكد إن `.env` (لو حطيناه) مستثنى في `.gitignore`.
- شغّل **App Check** في المرحلة النهائية عشان تمنع أي حد يستخدم مشروعك من بره التطبيق.
