import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * إعداد Firebase.
 *
 * المفاتيح دي **عامة بطبيعتها** — Firebase مصممة إنها تكون ظاهرة في كود
 * المتصفح، والحماية الحقيقية في قواعد Firestore (docs/firebase.md).
 * أي مفتاح إداري (Service Account) **ممنوع** يتحط هنا.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAtWvE2fT4ECtzQKH4kLl9D9UMBeoAc8cU',
  authDomain: 'kemet-app-eaa34.firebaseapp.com',
  projectId: 'kemet-app-eaa34',
  storageBucket: 'kemet-app-eaa34.firebasestorage.app',
  messagingSenderId: '463377039315',
  appId: '1:463377039315:web:45a2f3f42001a1074b7926',
  measurementId: 'G-1DLK54CFN4',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

type PersistenceLike = NonNullable<
  NonNullable<Parameters<typeof firebaseAuth.initializeAuth>[1]>['persistence']
>;

/**
 * `getReactNativePersistence` موجود في وقت التشغيل على الموبايل بس
 * (بيتبني من نسخة @firebase/auth الخاصة بـreact-native)، وملفاته النوعية
 * مش بتصدّره. فبنقراه بشكل دفاعي بدل ما الـimport يفشل على الويب.
 */
const reactNativeHelpers = firebaseAuth as unknown as {
  getReactNativePersistence?: (storage: unknown) => PersistenceLike;
};

function createAuth() {
  const getPersistence = reactNativeHelpers.getReactNativePersistence;

  // على الويب الافتراضي (localStorage) هو الصح.
  if (Platform.OS === 'web' || !getPersistence) return firebaseAuth.getAuth(app);

  try {
    return firebaseAuth.initializeAuth(app, {
      persistence: getPersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh بيعيد التهيئة — نرجع للنسخة الموجودة.
    return firebaseAuth.getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);

export default app;
