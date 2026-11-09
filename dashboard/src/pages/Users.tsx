import { useMemo, useState } from 'react';
import { Btn, Empty, SearchBox, ToastHost, useToast } from '../components/ui';
import { patchDoc, useCollectionDocs } from '../lib/db';
import { PageHeader } from '../components/layout';

const text = (value: unknown) => (typeof value === 'string' ? value : '');

export function Users() {
  const { rows, loading, error } = useCollectionDocs('users');
  const { toast, show } = useToast();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        text(row.name).toLowerCase().includes(needle) ||
        text(row.phone).toLowerCase().includes(needle),
    );
  }, [rows, query]);

  const admins = rows.filter((row) => row.role === 'admin').length;

  const toggleRole = async (id: string, role: string) => {
    const next = role === 'admin' ? 'customer' : 'admin';
    if (next === 'admin' && !window.confirm('متحوّل الحساب ده لأدمن؟')) return;
    try {
      await patchDoc('users', id, { role: next });
      show(next === 'admin' ? 'بقى أدمن' : 'بقى عميل');
    } catch {
      show('التحديث فشل — تأكد إنك أدمن.', 'error');
    }
  };

  return (
    <>
      <PageHeader title="العملاء" note={`${rows.length} حساب · ${admins} أدمن`} />

      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الرقم…" />
        <span style={{ marginInlineStart: 'auto', fontSize: 12.5, color: 'var(--muted)' }}>
          {filtered.length} نتيجة
        </span>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="panel">
        {loading ? (
          <div className="empty">بيتم التحميل…</div>
        ) : filtered.length === 0 ? (
          <Empty title="مفيش حسابات" note="أول عميل يعمل حساب في التطبيق هيظهر هنا." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>الحساب</th>
                  <th>الموبايل</th>
                  <th>الدور</th>
                  <th style={{ width: 150 }}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isAdmin = row.role === 'admin';
                  return (
                    <tr key={row.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">{text(row.name).charAt(0) || '؟'}</div>
                          <div>
                            <div className="cell-title">{text(row.name) || 'بدون اسم'}</div>
                            <div className="cell-sub" dir="ltr">
                              {row.id.slice(0, 10)}…
                            </div>
                          </div>
                        </div>
                      </td>
                      <td dir="ltr" style={{ textAlign: 'right' }}>
                        {text(row.phone) || '—'}
                      </td>
                      <td>
                        <span className={`badge ${isAdmin ? 'delivered' : 'off'}`}>
                          {isAdmin ? 'أدمن' : 'عميل'}
                        </span>
                      </td>
                      <td>
                        <Btn size="sm" onClick={() => void toggleRole(row.id, text(row.role))}>
                          {isAdmin ? 'خلّيه عميل' : 'خلّيه أدمن'}
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToastHost toast={toast} />
    </>
  );
}
