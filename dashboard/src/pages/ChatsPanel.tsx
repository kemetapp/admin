import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { Btn, Empty, Icon, ToastHost, useToast } from '../components/ui';
import { db } from '../firebase';
import { useCollectionDocs } from '../lib/db';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

type Chat = {
  id: string;
  customerId?: string;
  name?: string;
  phone?: string;
  updatedAt?: { toMillis?: () => number };
  lastReadByAdmin?: { toMillis?: () => number };
  lastText?: string;
};

type Message = { id: string; text?: string; sender?: string; createdAt?: { toMillis?: () => number } };

/** محادثة فيها رسائل جديدة للأدمن؟ */
export function isChatUnread(row: { updatedAt?: unknown; lastReadByAdmin?: unknown }): boolean {
  const updated = millis(row.updatedAt);
  if (!updated) return false;
  return updated > millis(row.lastReadByAdmin);
}

/** محادثات العملاء — قراءة ورد مباشر من لوحة التحكم. */
export function ChatsPanel() {
  const chats = useCollectionDocs('chats');
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const { toast, show } = useToast();

  const rows = useMemo(() => {
    const list = (chats.rows as Chat[]).slice();
    list.sort((a, b) => millis(b.updatedAt) - millis(a.updatedAt));
    return list;
  }, [chats.rows]);

  const active = rows.find((row) => row.id === selected) ?? null;

  /** فتح محادثة = تعليمها كمقروءة. */
  useEffect(() => {
    if (!selected) return;
    void setDoc(doc(db, 'chats', selected), { lastReadByAdmin: serverTimestamp() }, { merge: true }).catch(
      () => undefined,
    );
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    const unsubscribe = onSnapshot(
      query(collection(db, 'chats', selected, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => {
        setMessages(
          snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Message, 'id'>) })),
        );
      },
      () => setMessages([]),
    );
    return unsubscribe;
  }, [selected]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async () => {
    const body = reply.trim();
    if (!body || !selected || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'chats', selected, 'messages'), {
        text: body,
        sender: 'admin',
        createdAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, 'chats', selected),
        { updatedAt: serverTimestamp(), lastReadByAdmin: serverTimestamp() },
        { merge: true },
      );
      setReply('');
    } catch {
      show('الرد فشل — صلاحيات الأدمن مطلوبة', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="chat-layout">
        <div className="chat-list">
          {chats.loading ? (
            <div className="skeleton-rows">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton-row" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty title="مفيش محادثات" note="رسائل العملاء من التطبيق هتظهر هنا." />
          ) : (
            rows.map((row) => (
              <button
                key={row.id}
                className={`chat-item ${row.id === selected ? 'on' : ''} ${isChatUnread(row) ? 'unread' : ''}`}
                onClick={() => setSelected(row.id)}
              >
                <span className="avatar">{(text(row.name) || 'ز').charAt(0)}</span>
                <span className="chat-item-body">
                  <strong>
                    {text(row.name) || 'زائر'}
                    {isChatUnread(row) ? <i className="unread-dot" /> : null}
                  </strong>
                  <em dir="ltr">{text(row.phone) || row.id}</em>
                </span>
                <span className="chat-item-time">
                  {millis(row.updatedAt)
                    ? new Date(millis(row.updatedAt)).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="chat-thread">
          {!active ? (
            <div className="chat-placeholder">
              <Icon name="message" size={26} />
              <p>اختار محادثة من القائمة</p>
            </div>
          ) : (
            <>
              <div className="chat-head">
                <div>
                  <strong>{text(active.name) || 'زائر'}</strong>
                  <em dir="ltr">{text(active.phone) || active.id}</em>
                </div>
                {text(active.phone) ? (
                  <a className="btn btn-ghost btn-sm" href={`tel:${text(active.phone)}`}>
                    اتصال
                  </a>
                ) : null}
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <p className="hint">مفيش رسائل لسه.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`bubble ${message.sender === 'admin' ? 'mine' : 'theirs'}`}
                    >
                      <p>{text(message.text)}</p>
                      <span>
                        {millis(message.createdAt)
                          ? new Date(millis(message.createdAt)).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              <div className="chat-compose">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="اكتب ردك…"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                />
                <Btn variant="primary" onClick={() => void send()} disabled={sending || !reply.trim()}>
                  {sending ? '…' : 'إرسال'}
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>

      <ToastHost toast={toast} />
    </>
  );
}
