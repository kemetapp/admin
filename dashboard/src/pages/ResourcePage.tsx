import { useMemo, useState, type ReactNode } from 'react';
import {
  Btn,
  Empty,
  Field,
  Icon,
  Modal,
  SearchBox,
  ToastHost,
  useToast,
} from '../components/ui';
import { removeDoc, saveDoc, useCollectionDocs, type Doc } from '../lib/db';
import { PageHeader } from '../components/layout';

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'list';
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export type Column = {
  key: string;
  label: string;
  render?: (row: Doc) => ReactNode;
};

type Props = {
  collection: string;
  title: string;
  singular: string;
  fields: FieldDef[];
  columns: Column[];
  defaults: Record<string, unknown>;
  searchKeys: string[];
  summary?: (rows: Doc[]) => string;
};

const asText = (value: unknown) => (typeof value === 'string' ? value : '');

/** صفحة إدارة عامة: قائمة + بحث + إضافة + تعديل + حذف. */
export function ResourcePage({
  collection,
  title,
  singular,
  fields,
  columns,
  defaults,
  searchKeys,
  summary,
}: Props) {
  const { rows, loading, error } = useCollectionDocs(collection);
  const { toast, show } = useToast();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(defaults);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim();
    if (!needle) return rows;
    return rows.filter((row) =>
      searchKeys.some((key) => asText(row[key]).toLowerCase().includes(needle.toLowerCase())),
    );
  }, [rows, query, searchKeys]);

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...defaults });
    setOpen(true);
  };

  const startEdit = (row: Doc) => {
    const next: Record<string, unknown> = { ...defaults };
    fields.forEach((field) => {
      const value = row[field.key];
      if (field.type === 'list') {
        next[field.key] = Array.isArray(value) ? value.join(', ') : '';
      } else {
        next[field.key] = value ?? defaults[field.key];
      }
    });
    setEditingId(row.id);
    setForm(next);
    setOpen(true);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {};
      fields.forEach((field) => {
        const raw = form[field.key];
        if (field.type === 'number') {
          const number = Number(raw);
          payload[field.key] = Number.isFinite(number) ? number : 0;
        } else if (field.type === 'switch') {
          payload[field.key] = raw === true;
        } else if (field.type === 'list') {
          payload[field.key] = asText(raw)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        } else {
          payload[field.key] = asText(raw).trim();
        }
      });

      await saveDoc(collection, editingId, payload);
      setOpen(false);
      show(editingId ? `تم تحديث ${singular}` : `تم إضافة ${singular}`);
    } catch {
      show('الحفظ فشل — تأكد إنك أدمن.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const destroy = async (row: Doc) => {
    const label = asText(row.name) || asText(row.label) || asText(row.title) || row.id;
    if (!window.confirm(`متأكد إنك عايز تحذف «${label}»؟`)) return;
    try {
      await removeDoc(collection, row.id);
      show('تم الحذف');
    } catch {
      show('الحذف فشل — تأكد إنك أدمن.', 'error');
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        note={summary ? summary(rows) : `${rows.length} عنصر`}
        actions={
          <Btn variant="primary" onClick={startCreate}>
            <Icon name="plus" size={16} /> إضافة {singular}
          </Btn>
        }
      />

      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder={`ابحث في ${title}…`} />
        <span style={{ marginInlineStart: 'auto', fontSize: 12.5, color: 'var(--muted)' }}>
          {filtered.length} نتيجة
        </span>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="panel">
        {loading ? (
          <div className="empty">بيتم التحميل…</div>
        ) : filtered.length === 0 ? (
          <Empty
            title={query ? 'مفيش نتايج للبحث' : `مفيش ${title} لسه`}
            note={query ? 'جرّب كلمة تانية.' : 'ابدأ بإضافة أول عنصر.'}
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th style={{ width: 120 }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.render ? column.render(row) : asText(row[column.key]) || '—'}
                      </td>
                    ))}
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => startEdit(row)} aria-label="تعديل">
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => void destroy(row)}
                          aria-label="حذف"
                          style={{ color: 'var(--clay)' }}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        title={editingId ? `تعديل ${singular}` : `إضافة ${singular}`}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Btn variant="primary" onClick={() => void submit()} disabled={busy}>
              {busy ? 'بيتم الحفظ…' : 'حفظ'}
            </Btn>
            <Btn onClick={() => setOpen(false)}>إلغاء</Btn>
          </>
        }
      >
        {fields.map((field) => (
          <Field key={field.key} label={field.label}>
            {field.type === 'textarea' ? (
              <textarea
                value={asText(form[field.key])}
                placeholder={field.placeholder}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              />
            ) : field.type === 'select' ? (
              <select
                value={asText(form[field.key])}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              >
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'switch' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form[field.key] !== false}
                  onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })}
                  style={{ width: 18, height: 18, minHeight: 0 }}
                />
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {form[field.key] !== false ? 'ظاهر في التطبيق' : 'مخفي'}
                </span>
              </label>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={asText(form[field.key])}
                placeholder={field.placeholder}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              />
            )}
          </Field>
        ))}
      </Modal>

      <ToastHost toast={toast} />
    </>
  );
}
