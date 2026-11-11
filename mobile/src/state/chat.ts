import { loadJSON, saveJSON } from './storage';
import { getSession } from './session';

const KEY = 'chat-id';

/** معرّف محادثة العميل مع الإدارة — ثابت على الجهاز. */
export async function getChatId(): Promise<string> {
  const existing = await loadJSON<string>(KEY);
  if (existing) return existing;
  const session = await getSession();
  const id = session?.phone ? `c${session.phone}` : `g${Date.now().toString(36)}`;
  await saveJSON(KEY, id);
  return id;
}
