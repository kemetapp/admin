import { useMemo, useState } from 'react';
import { PageHeader, Section } from '../components/layout';
import { Btn, Empty, Segmented, ToastHost, useToast } from '../components/ui';
import { displayPhone, mailHref, telHref, whatsappHref } from '../lib/contact';
import { patchDoc, useCollectionDocs } from '../lib/db';
import { useAppSettings } from '../lib/settings';

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

type Filter = 'open' | 'closed' | 'all';

export function SupportPage() {
  const tickets = useCollectionDocs('tickets');
  const { settings } = useAppSettings();
  const { toast, show } = useToast();
  const [filter, setFilter] = useState<Filter>('open');

  const filtered = useMemo(() => {
    return [...tickets.rows]
      .filter((row) => {
        const status = text(row.status) || 'open';
        if (filter === 'all') return true;
        return status === filter;
      })
      .sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
  }, [tickets.rows, filter]);

  const resolve = async (id: string) => {
    try {
      await patchDoc('tickets', id, { status: 'closed' });
      show('اتقفلت التذكرة');
    } catch {
      show('التحديث فشل — تأكد إنك أدمن.', 'error');
    }
  };

  const reopen = async (id: string) => {
    try {
      await patchDoc('tickets', id, { status: 'open' });
      show('اتفتحت التذكرة تاني');
    } catch {
      show('التحديث فشل', 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="الدعم الفني"
        note={`${tickets.rows.filter((row) => (text(row.status) || 'open') === 'open').length} تذكرة مفتوحة`}
        actions={
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'open', label: 'مفتوحة' },
              { id: 'closed', label: 'مقفولة' },
              { id: 'all', label: 'الكل' },
            ]}
          />
        }
      />

      <div className="duo">
        <Section title="تذاكر العملاء">
          {tickets.loading ? (
            <div className="empty">بيتم التحميل…</div>
          ) : filtered.length === 0 ? (
            <Empty
              title="مفيش تذاكر هنا"
              note="أي عميل يبعت شكوى أو استفسار من التطبيق هتظهر هنا."
            />
          ) : (
            <ul className="ticket-list">
              {filtered.map((row) => {
                const closed = text(row.status) === 'closed';
                return (
                  <li key={row.id} className={closed ? 'closed' : ''}>
                    <div className="ticket-head">
                      <strong>{text(row.subject) || 'بدون عنوان'}</strong>
                      <span className={`badge ${closed ? 'off' : 'live'}`}>
                        {closed ? 'مقفولة' : 'مفتوحة'}
                      </span>
                    </div>
                    <p>{text(row.body) || '—'}</p>
                    <div className="ticket-foot">
                      <span>
                        {text(row.name) || 'عميل'} · <span dir="ltr">{text(row.phone) || '—'}</span>
                      </span>
                      <Btn size="sm" onClick={() => void (closed ? reopen(row.id) : resolve(row.id))}>
                        {closed ? 'إعادة فتح' : 'إقفال'}
                      </Btn>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="بيانات التواصل">
          <ul className="status-list">
            <li>
              <span>رقم الدعم</span>
              <a dir="ltr" href={telHref(settings.supportPhone)}>
                {displayPhone(settings.supportPhone)}
              </a>
            </li>
            <li>
              <span>واتساب</span>
              <a href={whatsappHref(settings.whatsapp)} target="_blank" rel="noreferrer">
                فتح المحادثة
              </a>
            </li>
            <li>
              <span>الإيميل</span>
              <a href={mailHref(settings.email)}>{settings.email}</a>
            </li>
            <li>
              <span>مواعيد الدعم</span>
              <b>
                {settings.openTime} — {settings.closeTime}
              </b>
            </li>
          </ul>

          <div className="faq-mini">
            <strong>أسئلة متكررة</strong>
            <p>• الأوردر بيتأكد فورًا وبيظهر في «طلباتي».</p>
            <p>• الطلب بيتقفل على مطعم واحد كل مرة.</p>
            <p>• التوصيل داخل {settings.serviceAreas}.</p>
          </div>
        </Section>
      </div>

      <ToastHost toast={toast} />
    </>
  );
}
