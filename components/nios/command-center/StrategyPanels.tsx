import {
  Target,
  Scale,
  ShieldCheck,
  Banknote,
  Gauge,
  ArrowUpRight,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import type {
  BusinessCommandCenter,
  BusinessHealth,
  CeoDecision,
  EditorialBalance,
  GoogleTrust,
  RevenueEngine,
} from '@/lib/nios/command-center';
import { Chip, Empty, Metric, ScoreRing, Section, TONE_COLOR, scoreTone, type Tone } from './primitives';

const KIND_ACCENT: Record<CeoDecision['kind'], string> = {
  inmediata: '#fb7185',
  crecimiento: '#34d399',
  negocio: '#fbbf24',
  google: '#38bdf8',
  riesgo: '#f97316',
};

const KIND_LABEL: Record<CeoDecision['kind'], string> = {
  inmediata: 'Acción inmediata',
  crecimiento: 'Crecimiento',
  negocio: 'Negocio',
  google: 'Google',
  riesgo: 'Riesgo',
};

const SEVERITY_TONE: Record<CeoDecision['severity'], Tone> = {
  critica: 'danger',
  alta: 'warn',
  media: 'info',
  baja: 'muted',
};

function DecisionCard({ d }: { d: CeoDecision }) {
  const accent = KIND_ACCENT[d.kind];
  return (
    <article className="ncc-decision" style={{ ['--slot-accent' as string]: accent }}>
      <div className="ncc-decision-top">
        <span className="ncc-decision-emoji" aria-hidden>{d.icon}</span>
        <span className="ncc-decision-kind">{KIND_LABEL[d.kind]}</span>
        <span style={{ marginLeft: 'auto' }}>
          <Chip tone={SEVERITY_TONE[d.severity]}>{d.severity}</Chip>
        </span>
      </div>
      <h3 className="ncc-decision-headline">{d.headline}</h3>
      <p className="ncc-decision-detail">{d.detail}</p>
      <p className="ncc-decision-why">{d.why}</p>
      {d.href ? (
        <a className="ncc-decision-action" href={d.href} target="_blank" rel="noopener noreferrer">
          {d.action}
          <ArrowUpRight size={14} />
        </a>
      ) : (
        <span className="ncc-decision-action">
          {d.action}
          <ArrowUpRight size={14} />
        </span>
      )}
      <p style={{ fontSize: '0.68rem', color: 'var(--ncc-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Fuente: {d.source}
      </p>
    </article>
  );
}

export function OverviewPanel({ cc }: { cc: BusinessCommandCenter }) {
  const { decisions, business, trust, balance, home, revenue } = cc;

  return (
    <>
      <Section
        title="CEO Daily Decision"
        subtitle="Qué debe hacer Nicaragua Informate hoy"
        icon={<Target size={17} />}
      >
        {decisions.length === 0 ? (
          <Empty>Sin decisiones pendientes. El sistema no detecta acciones críticas para hoy.</Empty>
        ) : (
          <div className="ncc-grid ncc-grid--3">
            {decisions.map((d) => (
              <DecisionCard key={d.id} d={d} />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Business Health"
        subtitle="Nicaragua Informate como empresa"
        icon={<Gauge size={17} />}
      >
        <div className="ncc-card" style={{ display: 'flex', flexWrap: 'wrap', gap: 26, alignItems: 'center' }}>
          <ScoreRing value={business.score} label={business.stage} />
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{business.verdict}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ncc-muted)', lineHeight: 1.55, marginBottom: 16 }}>
              Próximo hito: {business.nextMilestone}
            </p>
            <div className="ncc-grid ncc-grid--4">
              {business.pillars.map((p) => (
                <PillarMini key={p.id} pillar={p} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Indicadores de mando" subtitle="Lectura rápida del estado del medio" icon={<TrendingUp size={17} />}>
        <div className="ncc-grid ncc-grid--4">
          <Metric label="Google Trust" value={`${trust.score}`} note={`Confianza ${trust.level}`} tone={scoreTone(trust.score)} />
          <Metric label="Identidad editorial" value={`${balance.identityScore}`} note={balance.dominant ? `Domina ${balance.dominant}` : 'Sin categoría dominante'} tone={scoreTone(balance.identityScore)} />
          <Metric label="Calidad de portada" value={`${home.score}`} note={`${home.violations.length} regla${home.violations.length === 1 ? '' : 's'} incumplida${home.violations.length === 1 ? '' : 's'}`} tone={scoreTone(home.score)} />
          <Metric label="Inventario comercial" value={`${revenue.commercialShare}%`} note={`${revenue.monetizableArticles} piezas monetizables`} tone={revenue.commercialShare >= 20 ? 'ok' : revenue.commercialShare >= 10 ? 'warn' : 'danger'} />
        </div>
      </Section>
    </>
  );
}

function PillarMini({ pillar }: { pillar: BusinessHealth['pillars'][number] }) {
  const tone = scoreTone(pillar.score);
  return (
    <div className="ncc-metric">
      <div className="ncc-metric-label">{pillar.label}</div>
      <div className="ncc-metric-value" style={{ fontSize: '1.45rem', color: TONE_COLOR[tone] }}>
        {pillar.score}
      </div>
      <div className="ncc-metric-note">{pillar.reading}</div>
    </div>
  );
}

export function BalancePanel({ balance }: { balance: EditorialBalance }) {
  return (
    <Section
      title="Editorial Balance Engine"
      subtitle="Distribución real frente a la mezcla editorial objetivo"
      icon={<Scale size={17} />}
    >
      <div className="ncc-grid ncc-grid--2">
        <div className="ncc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <ScoreRing value={balance.identityScore} label="Identidad" />
            <div>
              <h3 style={{ fontSize: '0.98rem', marginBottom: 6 }}>{balance.verdict}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ncc-muted)', lineHeight: 1.5 }}>
                {balance.total} piezas analizadas
                {balance.dominant ? ` · categoría dominante: ${balance.dominant}` : ''}
              </p>
            </div>
          </div>

          {balance.categories.map((c) => {
            const tone: Tone = c.status === 'equilibrado' ? 'ok' : c.status === 'excedido' ? 'danger' : 'warn';
            return (
              <div key={c.category} className="ncc-bar-row">
                <div className="ncc-bar-head">
                  <span className="ncc-bar-name">{c.category}</span>
                  <span className="ncc-bar-nums">
                    {c.share}% · objetivo {c.target}% · {c.count} notas
                  </span>
                </div>
                <div className="ncc-bar-track">
                  <div
                    className="ncc-bar-fill"
                    style={{ width: `${Math.min(100, c.share)}%`, background: TONE_COLOR[tone] }}
                  />
                  <span
                    className="ncc-bar-target"
                    style={{ left: `${Math.min(100, c.target)}%` }}
                    title={`Objetivo ${c.target}%`}
                  />
                </div>
                <div className="ncc-bar-verdict">{c.verdict}</div>
              </div>
            );
          })}
        </div>

        <div className="ncc-card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Alertas de identidad</h3>
          {balance.alerts.length === 0 ? (
            <Empty>La mezcla editorial está dentro del plan. Sin alertas.</Empty>
          ) : (
            balance.alerts.map((a) => (
              <div key={a} className={`ncc-alert${a.includes('domina') ? ' ncc-alert--danger' : ''}`}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{a}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  );
}

export function TrustPanel({ trust }: { trust: GoogleTrust }) {
  return (
    <Section
      title="Google Trust Score"
      subtitle="Cómo lee Google la autoridad de Nicaragua Informate"
      icon={<ShieldCheck size={17} />}
    >
      <div className="ncc-card" style={{ display: 'flex', flexWrap: 'wrap', gap: 26, alignItems: 'center', marginBottom: 14 }}>
        <ScoreRing value={trust.score} label={trust.level} />
        <div className="ncc-grid ncc-grid--3" style={{ flex: '1 1 420px' }}>
          <GoogleSees title="Fortaleza" items={trust.googleSees.strengths} dot="#34d399" />
          <GoogleSees title="Debilidad" items={trust.googleSees.weaknesses} dot="#fb7185" />
          <GoogleSees title="Próxima acción" items={trust.googleSees.nextActions} dot="#38bdf8" />
        </div>
      </div>

      <div className="ncc-grid ncc-grid--3">
        {trust.pillars.map((p) => {
          const tone = scoreTone(p.score);
          return (
            <div key={p.id} className="ncc-card ncc-card--flat">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: '0.92rem' }}>{p.label}</h3>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: TONE_COLOR[tone] }}>{p.score}</span>
              </div>
              <div className="ncc-bar-track" style={{ marginBottom: 12 }}>
                <div className="ncc-bar-fill" style={{ width: `${p.score}%`, background: TONE_COLOR[tone] }} />
              </div>
              <ul className="ncc-list">
                <li style={{ ['--list-dot' as string]: '#34d399' }}>{p.strength}</li>
                <li style={{ ['--list-dot' as string]: '#fb7185' }}>{p.weakness}</li>
                <li style={{ ['--list-dot' as string]: '#38bdf8' }}>{p.nextAction}</li>
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function GoogleSees({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <div>
      <div className="ncc-metric-label" style={{ marginBottom: 9 }}>{title}</div>
      <ul className="ncc-list" style={{ ['--list-dot' as string]: dot }}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export function RevenuePanel({ revenue }: { revenue: RevenueEngine }) {
  return (
    <Section
      title="Revenue Engine"
      subtitle="Dónde el inventario editorial ya puede convertirse en ingreso"
      icon={<Banknote size={17} />}
    >
      <div className="ncc-grid ncc-grid--4" style={{ marginBottom: 16 }}>
        <Metric
          label="Inventario comercial"
          value={`${revenue.commercialShare}%`}
          note="del archivo publicado"
          tone={revenue.commercialShare >= 20 ? 'ok' : 'warn'}
        />
        <Metric label="Piezas monetizables" value={revenue.monetizableArticles} note="con volumen suficiente" tone="info" />
        <Metric
          label="Listas para vender"
          value={revenue.opportunities.filter((o) => o.effort === 'bajo').length}
          note="esfuerzo bajo"
          tone="ok"
        />
        <Metric
          label="Verticales por abrir"
          value={revenue.opportunities.filter((o) => o.potential === 'exploratorio').length}
          note="sin inventario"
          tone="muted"
        />
      </div>

      <div className={`ncc-alert${revenue.commercialShare < 12 ? ' ncc-alert--danger' : ''}`} style={{ marginBottom: 16 }}>
        <Banknote size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{revenue.verdict}</span>
      </div>

      <div className="ncc-grid ncc-grid--3">
        {revenue.opportunities.map((o) => (
          <div key={o.id} className="ncc-card ncc-card--flat">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <Chip tone="info">{o.category}</Chip>
              <Chip tone={o.potential === 'alto' ? 'ok' : o.potential === 'medio' ? 'warn' : 'muted'}>
                {o.potential}
              </Chip>
              <Chip tone={o.effort === 'bajo' ? 'ok' : o.effort === 'medio' ? 'warn' : 'danger'}>
                esfuerzo {o.effort}
              </Chip>
            </div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>{o.title}</h3>
            <p style={{ fontSize: '0.83rem', color: '#c7d3e8', lineHeight: 1.55, marginBottom: 12 }}>{o.rationale}</p>
            <div className="ncc-bar-head">
              <span className="ncc-bar-nums">Preparación comercial</span>
              <span className="ncc-bar-nums">{o.readiness}/100</span>
            </div>
            <div className="ncc-bar-track" style={{ marginBottom: 12 }}>
              <div
                className="ncc-bar-fill"
                style={{ width: `${o.readiness}%`, background: TONE_COLOR[scoreTone(o.readiness)] }}
              />
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--ncc-muted)', marginBottom: 10 }}>
              Anunciantes naturales: {o.advertisers.join(', ')}.
            </p>
            <p style={{ fontSize: '0.82rem', color: '#93c5fd', fontWeight: 600 }}>{o.nextStep}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
