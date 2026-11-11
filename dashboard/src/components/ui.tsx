import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  أيقونات — SVG خطّي 24×24 بنفس لغة المرجع                            */
/* ------------------------------------------------------------------ */

export type IconName =
  | 'overview'
  | 'restaurants'
  | 'users'
  | 'orders'
  | 'courier'
  | 'wallet'
  | 'chart'
  | 'bell'
  | 'content'
  | 'support'
  | 'promos'
  | 'settings'
  | 'activity'
  | 'categories'
  | 'products'
  | 'search'
  | 'close'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'logout'
  | 'check'
  | 'chevronLeft'
  | 'question'
  | 'star'
  | 'menu'
  | 'clock'
  | 'message'
  | 'pin'
  | 'refresh'
  | 'lock';

const PATHS: Record<IconName, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </>
  ),
  restaurants: (
    <>
      <path d="M5 10V4h14v6" />
      <path d="M3.5 10h17l-1.3 8.8A2 2 0 0 1 17.2 20.5H6.8a2 2 0 0 1-2-1.7z" />
      <path d="M9.5 20.5v-4.5h5v4.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-2-4" />
    </>
  ),
  orders: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  courier: (
    <>
      <circle cx="5.5" cy="17.5" r="2.6" />
      <circle cx="18.5" cy="17.5" r="2.6" />
      <path d="M8.1 17.5h5.4l2.6-8.5H19" />
      <path d="M13.6 9h3.4l1.5 5.6" />
      <path d="M3.5 6h3" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a3 3 0 0 1 3 3v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17z" />
      <path d="M3 9h18" />
      <circle cx="17" cy="14.5" r="1.1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7" y="12" width="3" height="6" rx="1" />
      <rect x="12" y="8" width="3" height="10" rx="1" />
      <rect x="17" y="10" width="3" height="8" rx="1" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2.5 8-2.5 8h17S18 14 18 8" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </>
  ),
  content: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  support: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="2.5" y="13" width="4" height="6" rx="2" />
      <rect x="17.5" y="13" width="4" height="6" rx="2" />
      <path d="M19.5 19v.5a2.5 2.5 0 0 1-2.5 2.5h-3" />
    </>
  ),
  promos: (
    <>
      <path d="M20.5 13.5 13 21a2 2 0 0 1-2.8 0L3 13.8V3h10.8L21 11.2a2 2 0 0 1-.5 2.3z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
    </>
  ),
  activity: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  categories: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  products: (
    <>
      <path d="M4 12h16a8 8 0 0 1-16 0z" />
      <path d="M3 12h18" />
      <path d="M8 8c0-2 1.5-3 4-3s4 1 4 3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V5h6v2" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.6 2.6 0 1 1 3.4 2.5c-.6.2-.9.8-.9 1.5v.4" />
      <circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
    </>
  ),
  star: (
    <path d="M12 3.2l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.6l6-.8z" />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  message: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H8l-5 3V11.5A8.5 8.5 0 0 1 11.5 3h1A8.5 8.5 0 0 1 21 11.5z" />
      <circle cx="8.6" cy="11.5" r=".9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.5" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="11.5" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  أزرار                                                              */
/* ------------------------------------------------------------------ */

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: CSSProperties;
};

export function Btn({
  children,
  onClick,
  variant = 'ghost',
  size = 'md',
  block = false,
  disabled = false,
  type = 'button',
  style,
}: BtnProps) {
  const classes = ['btn', `btn-${variant}`];
  if (size === 'sm') classes.push('btn-sm');
  if (block) classes.push('btn-block');

  return (
    <button
      className={classes.join(' ')}
      onClick={onClick}
      disabled={disabled}
      type={type}
      style={style}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  حقول ومودال                                                        */
/* ------------------------------------------------------------------ */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        style={wide ? { maxWidth: 680 } : undefined}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <Icon name="close" size={15} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  توست                                                               */
/* ------------------------------------------------------------------ */

export type ToastState = { message: string; kind: 'ok' | 'error' };

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  return {
    toast,
    show: (message: string, kind: 'ok' | 'error' = 'ok') => setToast({ message, kind }),
  };
}

export function ToastHost({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return <div className={`toast ${toast.kind === 'error' ? 'error' : ''}`}>{toast.message}</div>;
}

/* ------------------------------------------------------------------ */
/*  عناصر مساعدة                                                       */
/* ------------------------------------------------------------------ */

export function Empty({
  title,
  note,
  action,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {note ? <div>{note}</div> : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'ابحث…',
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <Icon name="search" size={15} />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="seg" role="tablist">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          className={value === option.id ? 'on' : ''}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  if (status === 'delivered') return <span className="badge delivered">تم التوصيل</span>;
  if (status === 'cancelled') return <span className="badge cancelled">ملغي</span>;
  return <span className="badge live">في الطريق</span>;
}
