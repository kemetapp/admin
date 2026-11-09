import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type Profile = {
  name?: string;
  phone?: string;
  role?: 'customer' | 'admin';
};

/** نفس طريقة التطبيق: رقم الموبايل بيتحوّل لإيميل داخلي. */
const phoneToEmail = (phone: string) => `${phone.replace(/\D/g, '')}@kemet.app`;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (!next) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', next.uid));
        setProfile((snap.data() as Profile | undefined) ?? null);
      } catch {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  return { user, profile, loading };
}

export const signIn = (phone: string, password: string) =>
  signInWithEmailAndPassword(auth, phoneToEmail(phone), password);

export const signOutUser = () => signOut(auth);

/** رسائل عربية لأشهر أخطاء Firebase. */
const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'الرقم أو كلمة السر مش صح.',
  'auth/user-not-found': 'مفيش حساب بالرقم ده.',
  'auth/wrong-password': 'كلمة السر مش صح.',
  'auth/too-many-requests': 'محاولات كتير — استنى شوية.',
  'auth/network-request-failed': 'مفيش اتصال بالإنترنت.',
  'auth/operation-not-allowed': 'تسجيل الدخول بالإيميل مش مفعّل في Firebase.',
};

export function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  return MESSAGES[code] ?? 'حصلت مشكلة — جرّب تاني.';
}
