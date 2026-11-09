import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

/**
 * Firebase مفيهاش «رقم موبايل + باسورد». عشان نشتغل من غير OTP (ومجانًا)
 * بنحوّل الرقم لإيميل داخلي ثابت: 01012345678 → 01012345678@kemet.app
 * العميل بيشوف «رقم + باسورد»، والتخزين تحت بيرقى Email/Password.
 * لما نضيف OTP بعدين، الرقم موجود أصلًا فالترقية سهلة.
 */
const EMAIL_DOMAIN = 'kemet.app';

export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@${EMAIL_DOMAIN}`;
}

/** رقم مصري: 11 رقم ويبدأ بـ010/011/012/015. */
export function isValidEgyptianPhone(phone: string): boolean {
  return /^01[0125]\d{8}$/.test(phone.replace(/\D/g, ''));
}

export type AuthUser = { uid: string; name: string; phone: string };

const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'الرقم ده متسجل قبل كده — جرّب تسجّل الدخول.',
  'auth/invalid-credential': 'الرقم أو كلمة السر مش صح.',
  'auth/wrong-password': 'كلمة السر مش صح.',
  'auth/user-not-found': 'مفيش حساب بالرقم ده — اعمل حساب الأول.',
  'auth/weak-password': 'كلمة السر لازم 6 حروف على الأقل.',
  'auth/invalid-email': 'رقم الموبايل مش مكتوب صح.',
  'auth/network-request-failed': 'مفيش إنترنت — اتأكد من الاتصال وجرّب تاني.',
  'auth/too-many-requests': 'محاولات كتير — استنى شوية وجرّب تاني.',
  'auth/operation-not-allowed': 'تسجيل الدخول بالإيميل والباسورد مش مفعّل في Firebase بعد.',
  'permission-denied': 'مفيش صلاحية للكتابة في قاعدة البيانات — راجع قواعد Firestore.',
};

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  return MESSAGES[code] ?? 'حصلت مشكلة — جرّب تاني.';
}

export async function signUpWithPhone(input: {
  name: string;
  phone: string;
  password: string;
}): Promise<AuthUser> {
  const phone = input.phone.trim();
  const name = input.name.trim();

  const cred = await createUserWithEmailAndPassword(auth, phoneToEmail(phone), input.password);

  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    phone,
    role: 'customer',
    createdAt: serverTimestamp(),
  });

  return { uid: cred.user.uid, name, phone };
}

export async function signInWithPhone(input: {
  phone: string;
  password: string;
}): Promise<AuthUser> {
  const phone = input.phone.trim();
  const cred = await signInWithEmailAndPassword(auth, phoneToEmail(phone), input.password);

  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  const name = (snap.data() as { name?: string } | undefined)?.name ?? 'عميل كيميت';

  return { uid: cred.user.uid, name, phone };
}

export const signOutUser = () => signOut(auth);
