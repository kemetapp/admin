import { useEffect, useMemo, useState } from 'react';
import { PageHeader, Section } from '../components/layout';
import { Btn, Field, Icon, ToastHost, useToast } from '../components/ui';
import {
  DEFAULT_SETTINGS,
  saveAppSettings,
  useAppSettings,
  type AppSettings,
} from '../lib/settings';

export function SettingsPage() {
  const { settings, loading, error, exists, updatedAt } = useAppSettings();
  const { toast, show } = useToast();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (form === null && !loading) setForm(settings);
  }, [form, loading, settings]);

  const value = form ?? settings;

  const dirty = useMemo(
    () => JSON.stringify(value) !== JSON.stringify(settings),
    [value, settings],
  );

  const patch = <K extends keyof AppSettings>(key: K, next: AppSettings[K]) =>
    setForm({ ...value, [key]: next });

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveAppSettings(value);
      show('تم حفظ الإعدادات');
    } catch {
      show('الحفظ فشل — تأكد إنك أدمن، وإن قاعدة settings مضافة.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm({ ...DEFAULT_SETTINGS });
    show('رجّعت القيم الافتراضية — لسه محتاج تحفظ');
  };

  return (
    <>
      <PageHeader
        title="إعدادات النظام"
        note={
          exists
            ? `محفوظة في Firestore${updatedAt ? ` · آخر تحديث ${updatedAt.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}` : ''}`
            : 'لسه مفيش إعدادات محفوظة — دي القيم الافتراضية'
        }
        actions={
          dirty ? <span className="count-chip warn">تغييرات غير محفوظة</span> : null
        }
      />

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="settings-grid">
        <Section title="بيانات المتجر">
          <Field label="اسم المتجر">
            <input value={value.storeName} onChange={(e) => patch('storeName', e.target.value)} />
          </Field>
          <Field label="رقم الدعم">
            <input
              dir="ltr"
              value={value.supportPhone}
              onChange={(e) => patch('supportPhone', e.target.value)}
            />
          </Field>
          <Field label="واتساب (بكود الدولة)">
            <input
              dir="ltr"
              value={value.whatsapp}
              onChange={(e) => patch('whatsapp', e.target.value)}
            />
          </Field>
          <Field label="البريد الإلكتروني">
            <input dir="ltr" value={value.email} onChange={(e) => patch('email', e.target.value)} />
          </Field>
        </Section>

        <Section title="التوصيل والطلبات">
          <div className="field-row">
            <Field label="رسوم التوصيل (ج.م)">
              <input
                type="number"
                value={value.deliveryFee}
                onChange={(e) => patch('deliveryFee', Number(e.target.value))}
              />
            </Field>
            <Field label="توصيل مجاني بعد (ج.م)">
              <input
                type="number"
                value={value.freeDeliveryOver}
                onChange={(e) => patch('freeDeliveryOver', Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="field-row">
            <Field label="الحد الأدنى للطلب (ج.م)">
              <input
                type="number"
                value={value.minOrder}
                onChange={(e) => patch('minOrder', Number(e.target.value))}
              />
            </Field>
            <Field label="وقت التوصيل المتوقع (دقيقة)">
              <input
                type="number"
                value={value.etaMinutes}
                onChange={(e) => patch('etaMinutes', Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="مناطق التوصيل">
            <input
              value={value.serviceAreas}
              onChange={(e) => patch('serviceAreas', e.target.value)}
              placeholder="أسوان، الجزيرة، الصداقة"
            />
          </Field>
        </Section>

        <Section title="الدفع والضريبة">
          <Field label="نسبة الضريبة (%)">
            <input
              type="number"
              value={value.taxPercent}
              onChange={(e) => patch('taxPercent', Number(e.target.value))}
            />
          </Field>
          <Toggle
            label="الدفع عند الاستلام"
            note="كاش للمندوب"
            checked={value.payCash}
            onChange={(next) => patch('payCash', next)}
          />
          <Toggle
            label="المحافظ الإلكترونية"
            note="فودافون كاش · إنستاباي"
            checked={value.payWallet}
            onChange={(next) => patch('payWallet', next)}
          />
          <Toggle
            label="البطاقة البنكية"
            note="فيزا · ماستركارد · ميزة"
            checked={value.payCard}
            onChange={(next) => patch('payCard', next)}
          />
        </Section>

        <Section title="حالة المتجر والمواعيد">
          <Toggle
            label="المتجر مفتوح"
            note="لما يقفل، التطبيق بيقول للعميل إن المتجر مقفول"
            checked={value.storeOpen}
            onChange={(next) => patch('storeOpen', next)}
          />
          <Toggle
            label="استقبال طلبات جديدة"
            note="إيقافه بيوقف استقبال الأوردرات الجديدة"
            checked={value.acceptingOrders}
            onChange={(next) => patch('acceptingOrders', next)}
          />
          <div className="field-row">
            <Field label="يفتح">
              <input
                type="time"
                value={value.openTime}
                onChange={(e) => patch('openTime', e.target.value)}
              />
            </Field>
            <Field label="يقفل">
              <input
                type="time"
                value={value.closeTime}
                onChange={(e) => patch('closeTime', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="الإشعارات">
          <Toggle
            label="إشعارات الطلبات"
            note="لكل طلب جديد أو تغيير حالة"
            checked={value.notifyOrders}
            onChange={(next) => patch('notifyOrders', next)}
          />
          <Toggle
            label="إشعارات العملاء"
            note="تسجيل عملاء جدد وتقييمات"
            checked={value.notifyCustomers}
            onChange={(next) => patch('notifyCustomers', next)}
          />
          <Toggle
            label="الرسائل التسويقية"
            note="عروض وحملات دورية"
            checked={value.notifyMarketing}
            onChange={(next) => patch('notifyMarketing', next)}
          />
        </Section>

        <Section title="العروض والخصومات">
          <Toggle
            label="الكوبونات مفعّلة"
            note="إيقافها بيمنع أي كود خصم"
            checked={value.couponsEnabled}
            onChange={(next) => patch('couponsEnabled', next)}
          />
          <Field label="أقصى قيمة خصم (ج.م)">
            <input
              type="number"
              value={value.maxDiscount}
              onChange={(e) => patch('maxDiscount', Number(e.target.value))}
            />
          </Field>
        </Section>
      </div>

      <div className="save-bar">
        <span className="save-note">
          <Icon name="settings" size={14} />
          {dirty ? 'عندك تغييرات مش محفوظة' : 'كل الإعدادات محفوظة'}
        </span>
        <div className="save-actions">
          <Btn onClick={reset} disabled={busy}>
            استرجاع الافتراضي
          </Btn>
          <Btn variant="primary" onClick={() => void submit()} disabled={busy || !dirty}>
            {busy ? 'بيتم الحفظ…' : 'حفظ التغييرات'}
          </Btn>
        </div>
      </div>

      <ToastHost toast={toast} />
    </>
  );
}

function Toggle({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="switch-row">
      <div>
        <strong>{label}</strong>
        {note ? <span>{note}</span> : null}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i className="switch-ui" aria-hidden />
    </label>
  );
}
