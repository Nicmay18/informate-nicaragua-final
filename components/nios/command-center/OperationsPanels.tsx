'use client';

import { useState } from 'react';
import {
  Swords,
  LayoutTemplate,
  Send,
  Radar,
  AlertTriangle,
  Check,
  Copy,
} from 'lucide-react';
import type {
  ContentWarRoom,
  DistributionCommand,
  HomeQuality,
  OpportunityHunter,
  Severity,
} from '@/lib/nios/command-center';
import { Chip, Empty, Metric, ScoreRing, Section, TONE_COLOR, type Tone } from './primitives';

const SEVERITY_TONE: Record<Severity, Tone> = {
  critica: 'danger',
  alta: 'warn',
  media: 'info',
  baja: 'muted',
};

export function WarRoomPanel({ warRoom }: { warRoom: ContentWarRoom }) {
  return (
    <Section
      title="Content War Room"
      subtitle={`Plan de producción para ${warRoom.date}`}
      icon={<Swords size={17} />}
    >
      <div className="ncc-card" style={{ marginBottom: 16 }}>
        <div className="ncc-metric-label" style={{ marginBottom: 10 }}>Por qué este plan</div>
        <ul className="ncc-list">
          {warRoom.rationale.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="ncc-grid ncc-grid--3">
        {warRoom.slots.map((s, i) => (
          <div
            key={s.id}
            className="ncc-decision"
            style={{ ['--slot-accent' as string]: TONE_COLOR[SEVERITY_TONE[s.priority]] }}
          >
            <div className="ncc-decision-top">
              <span className="ncc-row-index">{i + 1}</span>
              <span className="ncc-decision-kind">{s.category}</span>
              <span style={{ marginLeft: 'auto' }}>
                <Chip tone={SEVERITY_TONE[s.priority]}>{s.priority}</Chip>
              </span>
            </div>
            <h3 className="ncc-decision-headline" style={{ fontSize: '0.95rem' }}>{s.format}</h3>
            <p className="ncc-decision-detail">{s.brief}</p>
            <p className="ncc-decision-why">{s.reason}</p>
            {s.conditional && (
              <div className="ncc-alert" style={{ fontSize: '0.78rem', padding: '10px 12px' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{s.conditional}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function HomePanel({ home }: { home: HomeQuality }) {
  return (
    <Section
      title="Home Quality Control"
      subtitle="La portada como declaración de marca"
      icon={<LayoutTemplate size={17} />}
    >
      <div className="ncc-grid ncc-grid--2">
        <div className="ncc-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
            <ScoreRing value={home.score} label="Portada" />
            <div>
              <h3 style={{ fontSize: '0.98rem', marginBottom: 6 }}>{home.verdict}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ncc-muted)', lineHeight: 1.5 }}>
                {home.analyzed} posiciones analizadas
                {home.dominantCategory ? ` · ${home.dominantCategory} ocupa el ${home.dominantShare}%` : ''}
              </p>
            </div>
          </div>

          <div className="ncc-metric-label" style={{ marginBottom: 10 }}>Reglas incumplidas</div>
          {home.violations.length === 0 ? (
            <Empty>La portada cumple todas las reglas de marca.</Empty>
          ) : (
            home.violations.map((v) => (
              <div key={v} className="ncc-alert ncc-alert--danger">
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{v}</span>
              </div>
            ))
          )}
        </div>

        <div className="ncc-card">
          <div className="ncc-metric-label" style={{ marginBottom: 12 }}>Vitrina de marca</div>
          {home.brandSlots.length === 0 ? (
            <Empty>Sin posiciones para auditar.</Empty>
          ) : (
            <div className="ncc-rows">
              {home.brandSlots.map((s) => (
                <div key={s.slug} className="ncc-row">
                  <span
                    className="ncc-row-index"
                    style={{
                      background: s.onBrand ? 'rgba(52,211,153,0.14)' : 'rgba(251,113,133,0.14)',
                      color: s.onBrand ? '#34d399' : '#fb7185',
                    }}
                  >
                    {s.position}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ncc-row-title">{s.title}</div>
                    <div className="ncc-row-note">{s.note}</div>
                  </div>
                  <Chip tone={s.onBrand ? 'ok' : 'danger'}>{s.category}</Chip>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="ncc-copy-btn" onClick={handleCopy}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export function DistributionPanel({ distribution }: { distribution: DistributionCommand }) {
  const [openId, setOpenId] = useState<string | null>(distribution.plans[0]?.id ?? null);

  return (
    <Section
      title="Distribution Command"
      subtitle="Un texto distinto por canal. Nunca el mismo mensaje cinco veces"
      icon={<Send size={17} />}
    >
      {distribution.plans.length === 0 ? (
        <Empty>No hay notas recientes para distribuir.</Empty>
      ) : (
        <div className="ncc-rows">
          {distribution.plans.map((p) => {
            const open = openId === p.id;
            return (
              <div key={p.id} className="ncc-card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : p.id)}
                  aria-expanded={open}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 13,
                    padding: '15px 18px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ncc-row-title">{p.title}</div>
                    <div className="ncc-row-note">{p.reason}</div>
                  </div>
                  <Chip tone={SEVERITY_TONE[p.priority]}>{p.category}</Chip>
                </button>

                {open && (
                  <div style={{ padding: '0 18px 18px' }}>
                    <div className="ncc-grid ncc-grid--2">
                      {p.copies.map((c) => (
                        <div key={c.channel} className="ncc-copy">
                          <div className="ncc-copy-head">
                            <span className="ncc-copy-channel">{c.channel}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <span className="ncc-copy-count">{c.charCount} car.</span>
                              <CopyBlock text={c.text} />
                            </span>
                          </div>
                          <p className="ncc-copy-angle">{c.angle}</p>
                          <pre className="ncc-copy-text">{c.text}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

export function HunterPanel({ hunter }: { hunter: OpportunityHunter }) {
  return (
    <Section
      title="Content Opportunity Hunter"
      subtitle="Lo que los nicaragüenses buscan y el medio todavía no responde"
      icon={<Radar size={17} />}
    >
      <div className="ncc-grid ncc-grid--4" style={{ marginBottom: 16 }}>
        <Metric label="Sin cubrir" value={hunter.uncovered} note="huecos de demanda" tone={hunter.uncovered > 4 ? 'danger' : 'warn'} />
        <Metric label="Cubiertos" value={hunter.covered} note="con pieza permanente" tone="ok" />
        <Metric
          label="Alto valor comercial"
          value={hunter.items.filter((i) => !i.covered && i.commercialValue === 'alto').length}
          note="sin cubrir y monetizables"
          tone="warn"
        />
        <Metric
          label="Demanda permanente"
          value={hunter.items.filter((i) => i.demand === 'permanente').length}
          note="tráfico todo el año"
          tone="info"
        />
      </div>

      <div className="ncc-grid ncc-grid--3">
        {hunter.items.map((i) => (
          <div
            key={i.id}
            className="ncc-card ncc-card--flat"
            style={{ opacity: i.covered ? 0.62 : 1 }}
          >
            <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
              <Chip tone={i.covered ? 'ok' : 'danger'}>{i.covered ? 'cubierto' : 'sin cubrir'}</Chip>
              <Chip tone="muted">{i.demand}</Chip>
              <Chip tone={i.commercialValue === 'alto' ? 'warn' : 'muted'}>valor {i.commercialValue}</Chip>
            </div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>{i.topic}</h3>
            <p style={{ fontSize: '0.82rem', color: '#c7d3e8', lineHeight: 1.55, marginBottom: 10 }}>{i.rationale}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--ncc-muted)', marginBottom: 8 }}>
              Formato sugerido: <strong style={{ color: '#93c5fd' }}>{i.format}</strong> · intención {i.intent}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#93c5fd', fontWeight: 600 }}>{i.action}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
