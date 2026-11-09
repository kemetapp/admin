import { loadJSON, saveJSON, removeKey } from './storage';

export type Session = {
  name: string;
  phone: string;
  memberSince: string;
};

const SESSION_KEY = 'session';
const ONBOARDED_KEY = 'onboarded';
const GUEST_KEY = 'guest';

export const getSession = () => loadJSON<Session>(SESSION_KEY);
export const saveSession = (session: Session) => saveJSON(SESSION_KEY, session);
export const clearSession = () => removeKey(SESSION_KEY);

export async function isOnboarded(): Promise<boolean> {
  return (await loadJSON<boolean>(ONBOARDED_KEY)) === true;
}

export const markOnboarded = () => saveJSON(ONBOARDED_KEY, true);

/**
 * «زائر» — عميل دخل يتفرّج من غير حساب. بنحفظ الحالة عشان لو قفل التطبيق
 * وفتحه تاني يفضل يتصفّح، وأول ما يعمل حساب أو يسجّل دخول بنمسحها.
 */
export async function isGuest(): Promise<boolean> {
  return (await loadJSON<boolean>(GUEST_KEY)) === true;
}

export const markGuest = () => saveJSON(GUEST_KEY, true);
export const clearGuest = () => removeKey(GUEST_KEY);
