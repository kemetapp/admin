import { useMemo, useState, type FormEvent } from 'react';
import { errorMessage, signIn, signOutUser, useAuth } from './useAuth';
import { Btn, Icon } from './components/ui';
import { Sidebar, TAB_TITLE, Topbar, type Tab } from './components/layout';
import { useCollectionDocs } from './lib/db';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { SettingsPage } from './pages/Settings';
import { Users } from './pages/Users';
import { CategoriesPage, ProductsPage, PromosPage, RestaurantsPage } from './pages/Resources';

const IMPLEMENTED: Tab[] = [
  'overview',
  'orders',
  'products',
  'categories',
  'promos',
  'restaurants',
  'users',
  'settings',
];

export function App() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const orders = useCollectionDocs('orders');

  const liveOrders = useMemo(
    () => orders.rows.filter((row) => (row.status ?? 'live') === 'live').length,
    [orders.rows],
  );

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <span>بيتم التحميل…</span>
      </div>
    );
  }

  if (!user) return <Login />;
  if (profile?.role !== 'admin') return <Denied email={user.email ?? ''} />;

  const userName = profile?.name?.trim() || 'أدمن كيميت';

  return (
    <div className="shell">
      <Sidebar
        tab={tab}
        onTab={setTab}
        onSignOut={() => void signOutUser()}
        userName={userName}
        phone={profile?.phone ?? ''}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />

      <main className="main">
        <Topbar
          search={search}
          onSearch={setSearch}
          liveOrders={liveOrders}
          onTab={setTab}
        />

        <div className="content">
          {tab === 'overview' ? <Dashboard search={search} orders={orders.rows} /> : null}
          {tab === 'orders' ? <Orders /> : null}
          {tab === 'products' ? <ProductsPage /> : null}
          {tab === 'categories' ? <CategoriesPage /> : null}
          {tab === 'promos' ? <PromosPage /> : null}
          {tab === 'restaurants' ? <RestaurantsPage /> : null}
          {tab === 'users' ? <Users /> : null}
          {tab === 'settings' ? <SettingsPage /> : null}
          {IMPLEMENTED.includes(tab) ? null : <Soon label={TAB_TITLE[tab]} />}
        </div>
      </main>
    </div>
  );
}

function Soon({ label }: { label: string }) {
  return (
    <div className="panel">
      <div className="panel-body">
        <div className="soon">
          <div className="soon-icon">
            <Icon name="content" size={26} />
          </div>
          <h3>{label}</h3>
          <p>
            الشاشة دي لسه تحت التنفيذ. كل الأقسام التانية شغالة بالكامل — الطلبات، المطاعم،
            المنيو، الفئات، العروض، والعملاء.
          </p>
        </div>
      </div>
    </div>
  );
}

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(phone, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <div className="mark">ك</div>
          <h1>KEMET</h1>
          <p>لوحة التحكم · دخول الأدمن</p>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <div className="field">
          <label htmlFor="phone">رقم الموبايل</label>
          <input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="01xxxxxxxxx"
            inputMode="tel"
            autoComplete="username"
            dir="ltr"
          />
        </div>

        <div className="field">
          <label htmlFor="password">كلمة السر</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            dir="ltr"
          />
        </div>

        <Btn variant="primary" block type="submit" disabled={busy}>
          {busy ? 'بيتم الدخول…' : 'دخول'}
        </Btn>
      </form>
    </div>
  );
}

function Denied({ email }: { email: string }) {
  return (
    <div className="auth">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand">
          <div className="mark" style={{ background: 'rgba(180,86,47,0.12)', color: '#8f2f22' }}>
            !
          </div>
          <h1 style={{ fontSize: 17, letterSpacing: 0, color: '#8f2f22' }}>الحساب مش أدمن</h1>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.9 }}>
          دخلت بحساب <code dir="ltr">{email}</code> لكن دوره مش <code>admin</code>.
          <br />
          افتح Firestore → <code>users</code> وغيّر <code>role</code> لـ <code>admin</code>، وبعدين
          اعمل خروج ودخول تاني.
        </p>

        <Btn block onClick={() => void signOutUser()}>
          تسجيل الخروج
        </Btn>
      </div>
    </div>
  );
}
