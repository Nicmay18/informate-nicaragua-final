import type { ReactNode } from 'react';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'muted';

export const TONE_COLOR: Record<Tone, string> = {
  ok: '#34d399',
  warn: '#fbbf24',
  danger: '#fb7185',
  info: '#38bdf8',
  muted: '#8ea1c0',
};

export function scoreTone(score: number): Tone {
  if (score >= 75) return 'ok';
  if (score >= 50) return 'warn';
  return 'danger';
}

export function Chip({ tone = 'muted', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`ncc-chip ncc-chip--${tone}`}>{children}</span>;
}

export function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="ncc-section">
      <div className="ncc-section-head">
        <span className="ncc-section-icon">{icon}</span>
        <div>
          <h2 className="ncc-section-title">{title}</h2>
          {subtitle && <p className="ncc-section-sub">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  note,
  tone = 'info',
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: Tone;
}) {
  return (
    <div className="ncc-metric">
      <div className="ncc-metric-label">{label}</div>
      <div className="ncc-metric-value" style={{ color: TONE_COLOR[tone] }}>
        {value}
      </div>
      {note && <div className="ncc-metric-note">{note}</div>}
    </div>
  );
}

export function ScoreRing({ value, label }: { value: number; label: string }) {
  const color = TONE_COLOR[scoreTone(value)];
  return (
    <div
      className="ncc-ring"
      style={{ ['--ring-value' as string]: String(value), ['--ring-color' as string]: color }}
      role="img"
      aria-label={`${label}: ${value} de 100`}
    >
      <div className="ncc-ring-inner">
        <div className="ncc-ring-value">{value}</div>
        <div className="ncc-ring-label">{label}</div>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="ncc-empty">{children}</div>;
}
