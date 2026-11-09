import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * تخزين محلي بسيط (AsyncStorage على الموبايل / localStorage على الويب).
 * كل المفاتيح بادئتها `kemet:v1:` عشان نسهّل مسح بيانات النسخة لو احتجنا.
 */
const PREFIX = 'kemet:v1:';

export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* التخزين مش متاح — نتجاهل بهدوء */
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** يمسح كل بيانات كيميت المحلية (مفيد للاختبار). */
export async function clearAll(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    /* ignore */
  }
}
