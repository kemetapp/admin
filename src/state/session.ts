import { loadJSON, saveJSON, removeKey } from './storage';

export type Session = {
  name: string;
  phone: string;
  memberSince: string;
};

const SESSION_KEY = 'session';
const ONBOARDED_KEY = 'onboarded';

export const getSession = () => loadJSON<Session>(SESSION_KEY);
export const saveSession = (session: Session) => saveJSON(SESSION_KEY, session);
export const clearSession = () => removeKey(SESSION_KEY);

export async function isOnboarded(): Promise<boolean> {
  return (await loadJSON<boolean>(ONBOARDED_KEY)) === true;
}

export const markOnboarded = () => saveJSON(ONBOARDED_KEY, true);
