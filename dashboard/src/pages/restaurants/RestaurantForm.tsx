import { useState } from 'react';
import { Btn, Field, Icon, Modal, ToastHost, useToast } from '../../components/ui';
import { saveDoc } from '../../lib/db';
import {
  approvalOf,
  operatingOf,
  phoneOf,
  textOf,
  type RestaurantRow,
} from './types';

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const STEPS = ['البيانات الأساسية', 'بيانات المالك', 'الموقع والتوصيل', 'الإعدادات المالية', 'أوقات العمل', 'المستندات والمراجعة'];

type Draft = {
  name: string;
  nameEn: string;
  description: string;
  cuisine: string;
  logoUrl: string;
  coverUrl: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  area: string;
  lat: string;
  lng: string;
  minOrder: string;
  commission: string;
  taxPercent: string;
  settlement: string;
  documents: { name: string; url: string }[];
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
};

function toDraft(row: RestaurantRow | null): Draft {
  const hours: Draft['workingHours'] = {};
  DAYS.forEach((day) => {
    const value = row?.workingHours?.[day];
    hours[day] = { open: value?.open ?? '10:00', close: value?.close ?? '23:00', closed: value?.closed ?? false };
  });
  return {
    name: textOf(row?.name),
    nameEn: textOf(row?.nameEn),
    description: textOf(row?.description),
    cuisine: textOf(row?.cuisine),
    logoUrl: textOf(row?.logoUrl),
    coverUrl: textOf(row?.coverUrl),
    ownerName: textOf(row?.ownerName),
    phone: phoneOf(row ?? ({ id: '' } as RestaurantRow)),
    email: textOf(row?.email),
    address: textOf(row?.address),
    city: textOf(row?.city),
    area: textOf(row?.area),
    lat: row?.lat !== undefined ? String(row.lat) : '',
    lng: row?.lng !== undefined ? String(row.lng) : '',
    minOrder: row?.minOrder !== undefined ? String(row.minOrder) : '30',
    commission: row?.commission !== undefined ? String(row.commission) : '15',
    taxPercent: row?.taxPercent !== undefined ? String(row.taxPercent) : '0',
    settlement: textOf(row?.settlementIban),
    documents: Array.isArray(row?.documents)
      ? row!.documents!.map((item) => ({ name: item.name ?? '', url: item.url ?? '' }))
      : [],
    workingHours: hours,
  };
}

export function RestaurantForm({
  row,
  onClose,
  onSaved,
}: {
  row: RestaurantRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => toDraft(row));
  const [busy, setBusy] = useState(false);
  const { toast, show } = useToast();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = 'اسم المطعم مطلوب';
  if (!draft.ownerName.trim()) errors.ownerName = 'اسم المالك مطلوب';
  if (!/^01[0125]\d{8}$/.test(draft.phone.trim())) errors.phone = 'رقم موبايل مصري غير صحيح';
  if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email.trim())) errors.email = 'بريد غير صحيح';
  const commission = Number(draft.commission);
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
    errors.commission = 'العمولة من 0 لـ100';
  }

  const stepErrors = [
    ['name'],
    ['ownerName', 'phone', 'email'],
    [],
    ['commission'],
    [],
    [],
  ] as const;

  const canNext = stepErrors[step].every((key) => !errors[key]);

  const submit = async () => {
    if (Object.keys(errors).length > 0) {
      show('فيه بيانات ناقصة أو غير صحيحة', 'error');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(),
        nameEn: draft.nameEn.trim(),
        description: draft.description.trim(),
        cuisine: draft.cuisine.trim(),
        logoUrl: draft.logoUrl.trim(),
        coverUrl: draft.coverUrl.trim(),
        ownerName: draft.ownerName.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        address: draft.address.trim(),
        city: draft.city.trim(),
        area: draft.area.trim(),
        lat: draft.lat ? Number(draft.lat) : null,
        lng: draft.lng ? Number(draft.lng) : null,
        minOrder: Number(draft.minOrder) || 0,
        commission,
        taxPercent: Number(draft.taxPercent) || 0,
        settlementIban: draft.settlement.trim(),
        workingHours: draft.workingHours,
        documents: draft.documents.filter((doc) => doc.name.trim()),
        approvalStatus: row ? approvalOf(row) : 'pending',
        operatingStatus: row ? operatingOf(row) : 'inactive',
        active: row ? operatingOf(row) === 'active' : false,
        updatedAt: new Date().toISOString(),
      };
      await saveDoc('restaurants', row?.id ?? null, payload);
      onSaved();
    } catch {
      show('الحفظ فشل — صلاحيات الأدمن مطلوبة', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      wide
      title={row ? `تعديل: ${textOf(row.name)}` : 'إضافة مطعم جديد'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>
            {step === 0 ? 'إلغاء' : 'السابق'}
          </Btn>
          {step < STEPS.length - 1 ? (
            <Btn variant="primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
              التالي
            </Btn>
          ) : (
            <Btn variant="primary" disabled={busy} onClick={() => void submit()}>
              {busy ? 'بيتم الحفظ…' : row ? 'حفظ التعديلات' : 'إرسال للتسجيل'}
            </Btn>
          )}
        </>
      }
    >
      <div className="stepper">
        {STEPS.map((label, index) => (
          <button
            key={label}
            className={`stepper-item ${index === step ? 'on' : ''} ${index < step ? 'done' : ''}`}
            onClick={() => setStep(index)}
            type="button"
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <div className="form-grid">
          <Field label="اسم المطعم بالعربية *">
            <input value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="اسم المطعم بالإنجليزية">
            <input dir="ltr" value={draft.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
          </Field>
          <Field label="التصنيف">
            <input value={draft.cuisine} onChange={(e) => set('cuisine', e.target.value)} placeholder="مشويات · كشري" />
          </Field>
          <Field label="رابط الشعار">
            <input dir="ltr" value={draft.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://" />
          </Field>
          <Field label="رابط صورة الغلاف">
            <input dir="ltr" value={draft.coverUrl} onChange={(e) => set('coverUrl', e.target.value)} placeholder="https://" />
          </Field>
          <Field label="وصف المطعم">
            <textarea value={draft.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="form-grid">
          <Field label="اسم المالك *">
            <input value={draft.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
          </Field>
          <Field label="رقم الهاتف *">
            <input dir="ltr" value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01xxxxxxxxx" />
          </Field>
          <Field label="البريد الإلكتروني">
            <input dir="ltr" value={draft.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <p className="hint" style={{ gridColumn: '1 / -1' }}>
            حساب المالك بيتعمل من تبويب «العملاء» — أو يقدّر يسجّل بنفسه من التطبيق بنفس الرقم.
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="form-grid">
          <Field label="العنوان">
            <input value={draft.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="المحافظة">
            <input value={draft.city} onChange={(e) => set('city', e.target.value)} placeholder="أسوان" />
          </Field>
          <Field label="المنطقة">
            <input value={draft.area} onChange={(e) => set('area', e.target.value)} placeholder="كورنيش النيل" />
          </Field>
          <Field label="الحد الأدنى للطلب (ج.م)">
            <input type="number" value={draft.minOrder} onChange={(e) => set('minOrder', e.target.value)} />
          </Field>
          <Field label="خط العرض (lat)">
            <input dir="ltr" value={draft.lat} onChange={(e) => set('lat', e.target.value)} />
          </Field>
          <Field label="خط الطول (lng)">
            <input dir="ltr" value={draft.lng} onChange={(e) => set('lng', e.target.value)} />
          </Field>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="form-grid">
          <Field label="نسبة العمولة %">
            <input type="number" value={draft.commission} onChange={(e) => set('commission', e.target.value)} />
          </Field>
          <Field label="نسبة الضريبة %">
            <input type="number" value={draft.taxPercent} onChange={(e) => set('taxPercent', e.target.value)} />
          </Field>
          <Field label="IBAN / بيانات التسوية">
            <input dir="ltr" value={draft.settlement} onChange={(e) => set('settlement', e.target.value)} />
          </Field>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="hours-grid">
          {DAYS.map((day) => {
            const value = draft.workingHours[day];
            return (
              <div key={day} className={`hours-row ${value.closed ? 'off' : ''}`}>
                <strong>{day}</strong>
                <input
                  type="time"
                  value={value.open}
                  disabled={value.closed}
                  onChange={(event) =>
                    set('workingHours', {
                      ...draft.workingHours,
                      [day]: { ...value, open: event.target.value },
                    })
                  }
                />
                <input
                  type="time"
                  value={value.close}
                  disabled={value.closed}
                  onChange={(event) =>
                    set('workingHours', {
                      ...draft.workingHours,
                      [day]: { ...value, close: event.target.value },
                    })
                  }
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={value.closed}
                    onChange={(event) =>
                      set('workingHours', {
                        ...draft.workingHours,
                        [day]: { ...value, closed: event.target.checked },
                      })
                    }
                  />
                  مغلق
                </label>
              </div>
            );
          })}
        </div>
      ) : null}

      {step === 5 ? (
        <div>
          <div className="doc-list">
            {draft.documents.length === 0 ? (
              <p className="hint">مفيش مستندات مضافة (اختياري).</p>
            ) : (
              draft.documents.map((item, index) => (
                <div key={index} className="doc-row">
                  <input
                    placeholder="اسم المستند (سجل تجاري…)"
                    value={item.name}
                    onChange={(event) => {
                      const next = [...draft.documents];
                      next[index] = { ...item, name: event.target.value };
                      set('documents', next);
                    }}
                  />
                  <input
                    dir="ltr"
                    placeholder="رابط الملف"
                    value={item.url}
                    onChange={(event) => {
                      const next = [...draft.documents];
                      next[index] = { ...item, url: event.target.value };
                      set('documents', next);
                    }}
                  />
                  <button
                    className="icon-btn"
                    onClick={() => set('documents', draft.documents.filter((_, i) => i !== index))}
                    aria-label="حذف"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              ))
            )}
            <Btn size="sm" onClick={() => set('documents', [...draft.documents, { name: '', url: '' }])}>
              <Icon name="plus" size={13} /> إضافة مستند
            </Btn>
          </div>

          <div className="review">
            <div className="review-row"><span>الاسم</span><b>{draft.name || '—'}</b></div>
            <div className="review-row"><span>المالك</span><b>{draft.ownerName || '—'}</b></div>
            <div className="review-row"><span>الهاتف</span><b dir="ltr">{draft.phone || '—'}</b></div>
            <div className="review-row"><span>المنطقة</span><b>{draft.area || '—'}</b></div>
            <div className="review-row"><span>العمولة</span><b>{draft.commission}%</b></div>
            <div className="review-row"><span>الحد الأدنى</span><b>{draft.minOrder} ج.م</b></div>
          </div>
        </div>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <div className="alert alert-error" style={{ marginTop: 10 }}>
          {Object.values(errors).join(' · ')}
        </div>
      ) : null}

      <ToastHost toast={toast} />
    </Modal>
  );
}
