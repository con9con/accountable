import React from 'react';
import type { Toast } from '@/types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  home: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
  home2: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>
  ),
  card: (
    <>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </>
  ),
  calc: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="12" y2="14" />
    </>
  ),
  car: (
    <>
      <path d="M5 17H3a2 2 0 01-2-2V9l3-6h12l3 6v6a2 2 0 01-2 2h-2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  person: (
    <>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  graduation: (
    <>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </>
  ),
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  chevronUp: <polyline points="18 15 12 9 6 15" />,
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  fire: (
    <path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0c0-3-2-5-2-5s-1 3-3 3-2-2 0-8z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  trending: <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />,
  dollar: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  alert: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  arrowDown: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
};

interface IconProps {
  name: keyof typeof ICON_PATHS;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 18, className = '', style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled,
  className = '',
  style,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────

export function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`card ${className}`} style={style}>{children}</div>;
}

export function CardHead({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card-h">
      <span className="card-title">{children}</span>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`card-b ${className}`} style={style}>{children}</div>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

export function Field({ label, error, children, hint }: FieldProps) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ─── Pill (type chip) ────────────────────────────────────────────────────────

interface PillProps {
  label: string;
  color?: string;
}

export function Pill({ label, color }: PillProps) {
  return (
    <span className="pill" style={color ? { '--pill-color': color } as React.CSSProperties : undefined}>
      {label}
    </span>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

interface RingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}

export function Ring({ pct, size = 80, stroke = 8, color = 'var(--accent)', children }: RingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, Math.max(0, pct));
  return (
    <div className="ring-wrap" style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--border)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      {children && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: number[];
  height?: number;
  color?: string;
  fill?: boolean;
}

export function Sparkline({ data, height = 32, color = 'var(--accent)', fill = true }: SparklineProps) {
  if (!data || data.length < 2) return null;
  const w = 120;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      {fill && <path d={fillPath} fill={color} fillOpacity={0.12} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartPoint[];
  height?: number;
  color?: string;
  secondData?: LineChartPoint[];
  secondColor?: string;
}

export function LineChart({ data, height = 120, color = 'var(--accent)', secondData, secondColor = 'var(--positive)' }: LineChartProps) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
        Not enough data
      </div>
    );
  }

  const allValues = [
    ...data.map((d) => d.value),
    ...(secondData ?? []).map((d) => d.value),
  ];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const pad = { t: 8, r: 8, b: 28, l: 8 };
  const W = 500;
  const H = height;
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  function toPath(points: LineChartPoint[]) {
    return points.map((p, i) => {
      const x = pad.l + (i / (points.length - 1)) * iw;
      const y = pad.t + ih - ((p.value - min) / range) * ih;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  const path1 = toPath(data);
  const firstPt = { x: pad.l, y: pad.t + ih - ((data[0].value - min) / range) * ih };
  const lastPt = { x: pad.l + iw, y: pad.t + ih - ((data[data.length - 1].value - min) / range) * ih };
  const fillPath = `${path1} L${lastPt.x.toFixed(1)},${(pad.t + ih).toFixed(1)} L${firstPt.x.toFixed(1)},${(pad.t + ih).toFixed(1)} Z`;

  const tickInterval = Math.ceil(data.length / 6);
  const ticks = data.filter((_, i) => i % tickInterval === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
      {/* fill */}
      <path d={fillPath} fill={color} fillOpacity={0.08} />
      {/* line */}
      <path d={path1} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* second line */}
      {secondData && secondData.length >= 2 && (
        <path d={toPath(secondData)} fill="none" stroke={secondColor} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {/* x-axis ticks */}
      {ticks.map((t, i) => {
        const idx = data.indexOf(t);
        const x = pad.l + (idx / (data.length - 1)) * iw;
        return (
          <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--ink-4)">
            {t.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Toast Host ───────────────────────────────────────────────────────────────

interface ToastHostProps {
  toasts: Toast[];
  dismiss: (id: string) => void;
}

export function ToastHost({ toasts, dismiss }: ToastHostProps) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.msg}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="toast-close">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function Confirm({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false }: ConfirmProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onCancel}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>{message}</p>
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
