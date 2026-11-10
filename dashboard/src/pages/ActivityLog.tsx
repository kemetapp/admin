import { useMemo, useState } from 'react';
import { PageHeader, Section } from '../components/layout';
import { Empty, Icon, Segmented, type IconName } from '../components/ui';
import { useCollectionDocs } from '../lib/db';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' ? value : 0);
const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

type Kind = 'all' | 'orders' | 'users' | 'messages';

type Entry = {
  id: string;
  kind: Exclude<Kind, 'all'>;
  title: string;
  note: string;
  time: number;
};

const ICONS: Record<Entry['kind'], IconName> = {
  orders: 'orders',
  users: 'users',
  messages: 'message',
};

export function ActivityLogPage() {
  const orders = useCollectionDocs('orders');
  const users = useCollectionDocs('users');
  const messages = useCollectionDocs('messages');
  const [kind, setKind] = useState<Kind>('all');

  const entries = useMemo(() => {
    const list: Entry[] = [];

    users.rows.forEach((row) => {
      list.push({
        id: `u-${row.id}`,
        kind: 'users',
        title: `حساب جديد: ${text(row.name) || 'بدون اسم'}`,
        note: `${text(row.phone) || '—'} · ${text(row.role) === 'admin' ? 'أدمن' : 'عميل'}`,
        time: millis(row.createdAt),
      });
    });

    orders.rows.forEach((row) => {
      list.push({
        id: `o-${row.id}`,
        kind: 'orders',
        title: `طلب من ${text(row.restaurantName) || 'مطعم'}`,
        note: `${num(row.total)} ج.م · ${text(row.status) || 'live'}`,
        time: millis(row.createdAt),
      });
    });

    messages.rows.forEach((row) => {
      list.push({
        id: `m-${row.id}`,
        kind: 'messages',
        title: `تنبيه: ${text(row.title) || 'بدون عنوان'}`,
        note: text(row.body),
        time: millis(row.createdAt) || millis(row.sentAt),
      });
    });

    return list.sort((a, b) => b.time - a.time).slice(0, 60);
  }, [orders.rows, users.rows, messages.rows]);

  const filtered = kind === 'all' ? entries : entries.filter((entry) => entry.kind === kind);

  return (
    <>
      <PageHeader
        title="سجل النشاطات"
        note={`${entries.length} حدث في آخر فترة`}
        actions={
          <Segmented<Kind>
            value={kind}
            onChange={setKind}
            options={[
              { id: 'all', label: 'الكل' },
              { id: 'orders', label: 'طلبات' },
              { id: 'users', label: 'عملاء' },
              { id: 'messages', label: 'رسائل' },
            ]}
          />
        }
      />

      <Section>
        {filtered.length === 0 ? (
          <Empty title="مفيش نشاط" note="لما يبدأ العملاء يستخدموا التطبيق، كل حاجة هتتسجل هنا." />
        ) : (
          <ul className="activity-list timeline">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <span className="activity-icon">
                  <Icon name={ICONS[entry.kind]} size={14} />
                </span>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.note || '—'}</span>
                </div>
                <time>
                  {entry.time
                    ? new Date(entry.time).toLocaleString('ar-EG', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '—'}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
