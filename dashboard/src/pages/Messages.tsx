import { useMemo, useState } from 'react';
import { PageHeader, Section } from '../components/layout';
import { Btn, Empty, Field, Icon, ToastHost, useToast } from '../components/ui';
import { removeDoc, saveDoc, useCollectionDocs } from '../lib/db';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

const AUDIENCES = [
  { value: 'all', label: 'كل المستخدمين' },
  { value: 'customers', label: 'العملاء' },
  { value: 'restaurants', label: 'المطاعم' },
];

export function MessagesPage() {
  const messages = useCollectionDocs('messages');
  const { toast, show } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [busy, setBusy] = useState(false);

  const canSend = title.trim().length > 2 && body.trim().length > 4;

  const sent = useMemo(
    () => [...messages.rows].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)),
    [messages.rows],
  );

  const send = async () => {
    if (!canSend || busy) return;
    setBusy(true);
    try {
      await saveDoc('messages', null, {
        title: title.trim(),
        body: body.trim(),
        audience,
        sentAt: null,
      });
      setTitle('');
      setBody('');
      show('تم إرسال التنبيه');
    } catch {
      show('الإرسال فشل — تأكد إنك أدمن وإن قاعدة messages مضافة.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const destroy = async (id: string) => {
    if (!window.confirm('تحذف الرسالة دي؟')) return;
    try {
      await removeDoc('messages', id);
      show('تم الحذف');
    } catch {
      show('الحذف فشل', 'error');
    }
  };

  return (
    <>
      <PageHeader title="الرسائل والإشعارات" note={`${sent.length} رسالة مرسلة`} />

      <div className="duo">
        <Section title="إرسال تنبيه جديد">
          <Field label="عنوان الرسالة">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="خصم 20% النهاردة"
            />
          </Field>
          <Field label="نص الرسالة">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="اكتب الرسالة اللي هتوصل للمستخدمين…"
            />
          </Field>
          <Field label="الجمهور">
            <select value={audience} onChange={(event) => setAudience(event.target.value)}>
              {AUDIENCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Btn variant="primary" block onClick={() => void send()} disabled={!canSend || busy}>
            {busy ? 'بيتم الإرسال…' : 'إرسال التنبيه'}
          </Btn>
        </Section>

        <Section title="آخر التنبيهات">
          {sent.length === 0 ? (
            <Empty title="مفيش رسائل لسه" note="أول تنبيه هتكتبه هيظهر هنا." />
          ) : (
            <ul className="activity-list">
              {sent.map((row) => (
                <li key={row.id}>
                  <span className="activity-icon">
                    <Icon name="message" size={14} />
                  </span>
                  <div>
                    <strong>{text(row.title) || 'بدون عنوان'}</strong>
                    <span>{text(row.body)}</span>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => void destroy(row.id)}
                    aria-label="حذف"
                    style={{ color: 'var(--clay)' }}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <ToastHost toast={toast} />
    </>
  );
}
