import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * نفس مشروع Firebase بتاع التطبيق.
 * المفاتيح دي عامة بطبيعتها — الأمان في قواعد Firestore.
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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
