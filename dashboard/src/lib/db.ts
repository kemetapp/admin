import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export type Doc = { id: string } & Record<string, unknown>;

/** اشتراك لحظي في مجموعة كاملة. `nonce` بيعيد الاشتراك لما يتغيّر (زر تحديث). */
export function useCollectionDocs(name: string, nonce = 0) {
  const [rows, setRows] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, name),
      (snap) => {
        setRows(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
        setLoading(false);
        setError(null);
      },
      () => {
        setError('مش قادر أقرا «' + name + '» — راجع قواعد Firestore.');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [name, nonce]);

  return { rows, loading, error };
}

/** بتفضّي مجموعة كاملة (حذف نهائي) — للتصفير قبل التشغيل. */
export async function clearCollection(name: string): Promise<number> {
  const { getDocs, writeBatch } = await import('firebase/firestore');
  const snapshot = await getDocs(collection(db, name));
  let deleted = 0;
  const docs = snapshot.docs;

  for (let index = 0; index < docs.length; index += 400) {
    const batch = writeBatch(db);
    docs.slice(index, index + 400).forEach((item) => {
      batch.delete(item.ref);
      deleted += 1;
    });
    await batch.commit();
  }
  return deleted;
}

/** تحديث نفس الحقول على كل مستندات مجموعة (مثال: تصفير التقييمات). */
export async function bulkPatch(
  name: string,
  patch: Record<string, unknown>,
): Promise<number> {
  const { getDocs, writeBatch, doc: docRef } = await import('firebase/firestore');
  const snapshot = await getDocs(collection(db, name));
  const docs = snapshot.docs;
  let updated = 0;

  for (let index = 0; index < docs.length; index += 400) {
    const batch = writeBatch(db);
    docs.slice(index, index + 400).forEach((item) => {
      batch.update(docRef(db, name, item.id), patch);
      updated += 1;
    });
    await batch.commit();
  }
  return updated;
}

/** اشتراك لحظي في مستند واحد. */
export function useDoc(name: string, id: string) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, name, id),
      (snap) => {
        setData(snap.exists() ? snap.data() : null);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('مش قادر أقرا «' + name + '/' + id + '» — راجع قواعد Firestore.');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [name, id]);

  return { data, loading, error };
}

/** إنشاء مستند جديد أو تحديث واحد موجود. */
export async function saveDoc(
  name: string,
  id: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  if (id) {
    await updateDoc(doc(db, name, id), data);
    return;
  }
  await addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() });
}

/** تحديث جزئي (لتبديل حالة أو دور). */
export async function patchDoc(
  name: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(db, name, id), data);
}

export async function removeDoc(name: string, id: string): Promise<void> {
  await deleteDoc(doc(db, name, id));
}

/** كتابة مستند بمعرّف ثابت (للتهيئة). */
export async function upsertDoc(
  name: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, name, id), data, { merge: true });
}
