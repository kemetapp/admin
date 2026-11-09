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

/** اشتراك لحظي في مجموعة كاملة. */
export function useCollectionDocs(name: string) {
  const [rows, setRows] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [name]);

  return { rows, loading, error };
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
