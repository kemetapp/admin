import type { ReactNode } from 'react';
import heroImage from '../../../mobile/assets/food/grill.jpg';
import { Icon, type IconName } from './ui';

export type Tab =
  | 'overview'
  | 'restaurants'
  | 'users'
  | 'orders'
  | 'couriers'
  | 'finance'
  | 'reports'
  | 'messages'
  | 'products'
  | 'categories'
  | 'promos'
  | 'support'
  | 'settings'
  | 'activity';

export const NAV: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'لوحة التحكم', icon: 'overview' },
  { id: 'restaurants', label: 'المطاعم', icon: 'restaurants' },
  { id: 'users', label: 'العملاء', icon: 'users' },
  { id: 'orders', label: 'الطلبات', icon: 'orders' },
  { id: 'couriers', label: 'المندوبين', icon: 'courier' },
  { id: 'finance', label: 'المعاملات المالية', icon: 'wallet' },
  { id: 'reports', label: 'التقارير والتحليلات', icon: 'chart' },
  { id: 'messages', label: 'الرسائل والإشعارات', icon: 'message' },
  { id: 'products', label: 'إدارة المحتوى', icon: 'content' },
  { id: 'categories', label: 'الفئات', icon: 'categories' },
  { id: 'promos', label: 'الخصومات والعروض', icon: 'promos' },
  { id: 'support', label: 'الدعم الفني', icon: 'support' },
  { id: 'settings', label: 'إعدادات النظام', icon: 'settings' },
  { id: 'activity', label: 'سجل النشاطات', icon: 'activity' },
];

export const TAB_TITLE: Record<Tab, string> = {
  overview: 'لوحة التحكم',
  restaurants: 'المطاعم',
  users: 'العملاء',
  orders: 'الطلبات',
  couriers: 'المندوبين',
  finance: 'المعاملات المالية',
  reports: 'التقارير والتحليلات',
  messages: 'الرسائل والإشعارات',
  products: 'إدارة المحتوى',
  categories: 'الفئات',
  promos: 'الخصومات والعروض',
  support: 'الدعم الفني',
  settings: 'إعدادات النظام',
  activity: 'سجل النشاطات',
};

export function Sidebar({
  tab,
  onTab,
  onSignOut,
  userName,
  phone,
  collapsed,
  onToggle,
}: {
  tab: Tab;
  onTab: (next: Tab) => void;
  onSignOut: () => void;
  userName: string;
  phone: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="side-top">
        <button
          className="side-burger"
          onClick={onToggle}
          aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          <Icon name={collapsed ? 'menu' : 'close'} size={16} />
        </button>

        {collapsed ? null : (
          <div className="side-brand">
            <div className="mark">🪲</div>
            <div>
              <strong>KEMET</strong>
              <span>RESTAURANT PARTNER</span>
            </div>
          </div>
        )}
      </div>

      <nav className="side-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${tab === item.id ? 'active' : ''}`}
            onClick={() => onTab(item.id)}
            title={item.label}
          >
            <Icon name={item.icon} size={17} />
            {collapsed ? null : (
              <>
                <span>{item.label}</span>
                <Icon name="chevronLeft" size={12} />
              </>
            )}
          </button>
        ))}
      </nav>

      {collapsed ? null : (
        <div className="side-art" aria-hidden>
          <svg viewBox="0 0 240 120" width="100%" height="100%">
            <g stroke="rgba(243,228,188,0.26)" fill="none" strokeWidth="1.3" strokeLinecap="round">
              <circle cx="196" cy="26" r="10" />
              <path d="M154 76l30-38 30 38z" />
              <path d="M152 76h66" strokeDasharray="3 7" />
              <path d="M44 76v34" />
              <path d="M44 76c-8-5-17-5-24 0M44 76c8-5 17-5 24 0" />
              <circle cx="112" cy="44" r="10" />
              <path d="M99 43c0-9 6-16 13-16s13 7 13 16" />
              <path d="M99 43c-3 0-5 3-5 6s2 6 5 6M125 43c3 0 5 3 5 6s-2 6-5 6" />
              <path d="M101 54h22l3 24h-28z" />
              <path d="M101 60c-7 2-10 6-10 12M123 60c7 2 10 6 10 12" />
              <path d="M86 74v30M81 74h10" />
              <path d="M96 78h32v26H96z" />
              <path d="M90 106h44" />
            </g>
            <g fill="rgba(217,162,74,0.18)">
              <circle cx="196" cy="26" r="3.4" />
              <circle cx="112" cy="44" r="2.8" />
            </g>
          </svg>
        </div>
      )}

      <div className="side-foot">
        <div className="side-profile" title={`${userName} · ${phone}`}>
          <div className="side-avatar">{userName.charAt(0) || 'م'}</div>
          {collapsed ? null : (
            <>
              <div className="side-profile-body">
                <strong>{userName}</strong>
                <span>مدير النظام</span>
                <em>
                  <i className="status-dot" /> متصل
                </em>
              </div>
              <Icon name="chevronLeft" size={14} />
            </>
          )}
        </div>

        <button className="nav-btn logout" onClick={onSignOut} title="تسجيل الخروج">
          <Icon name="logout" size={17} />
          {collapsed ? null : <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}

export function Topbar({
  search,
  onSearch,
  liveOrders,
  onTab,
}: {
  search: string;
  onSearch: (next: string) => void;
  liveOrders: number;
  onTab: (next: Tab) => void;
}) {
  const now = new Date();
  const stamp = `${now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })} · ${now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <header className="topbar">
      <div className="search top-search">
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="ابحث في أي مكان…"
          aria-label="بحث"
        />
        <Icon name="search" size={15} />
      </div>

      <div className="top-actions">
        <button
          className="round-btn labelled"
          onClick={() => onTab('messages')}
          title="الرسائل"
          aria-label="الرسائل"
        >
          <Icon name="message" size={16} />
          <span>الرسائل</span>
        </button>
        <button
          className="round-btn labelled"
          onClick={() => onTab('users')}
          title="العملاء"
          aria-label="العملاء"
        >
          <Icon name="users" size={16} />
          <span>العملاء</span>
        </button>
        <button
          className="round-btn labelled"
          onClick={() => onTab('couriers')}
          title="المندوبين"
          aria-label="المندوبين"
        >
          <Icon name="courier" size={16} />
          <span>المندوبين</span>
        </button>

        <span className="top-sep" />

        <button className="round-btn" aria-label="الإشعارات" title="الإشعارات">
          <Icon name="bell" size={17} />
          {liveOrders > 0 ? <em className="dot-badge">{liveOrders}</em> : null}
        </button>
        <button className="round-btn" aria-label="المساعدة" title="المساعدة">
          <Icon name="question" size={17} />
        </button>
        <button className="round-btn" aria-label="الإعدادات" title="الإعدادات">
          <Icon name="settings" size={17} />
        </button>

        <div className="top-date">
          <strong>{stamp}</strong>
          <span>مساءً</span>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-shade" />
      <div className="hero-mark">
        <span>KEMET</span>
        <i>RESTAURANT PARTNER</i>
        <b>𓋹</b>
      </div>
      <div className="hero-content">
        <h1>مرحبًا بك في لوحة الإدارة</h1>
        <p>أدر أعمالك بذكاء، وارفع من كفاءتك</p>
      </div>
      <div className="hero-photo" style={{ backgroundImage: `url(${heroImage})` }} />
    </section>
  );
}

export function PageHeader({
  title,
  note,
  actions,
}: {
  title: string;
  note?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {note ? <p>{note}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

export function Section({
  title,
  extra,
  children,
  className = '',
  bare = false,
}: {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  bare?: boolean;
}) {
  return (
    <section className={`panel ${className}`}>
      {title ? (
        <div className="panel-head">
          <span>{title}</span>
          {extra}
        </div>
      ) : null}
      {bare ? children : <div className="panel-body">{children}</div>}
    </section>
  );
}
