import type { NiosBrief } from '@/lib/nios/nios-speaks';
import type { NiosGrowthOpportunity } from '@/lib/nios/nios-growth-radar';

interface Props {
  brief: NiosBrief;
}

function impactColor(impact: 'Alto' | 'Medio' | 'Bajo'): string {
  switch (impact) {
    case 'Alto':
      return '#dc2626';
    case 'Medio':
      return '#ca8a04';
    default:
      return '#64748b';
  }
}

function statusColor(status: 'ok' | 'warning' | 'alert' | 'neutral' | undefined): string {
  switch (status) {
    case 'ok':
      return '#16a34a';
    case 'warning':
      return '#ca8a04';
    case 'alert':
      return '#dc2626';
    default:
      return '#64748b';
  }
}

function statusBg(status: 'ok' | 'warning' | 'alert' | 'neutral' | undefined): string {
  switch (status) {
    case 'ok':
      return 'rgba(22,163,74,0.08)';
    case 'warning':
      return 'rgba(202,138,4,0.08)';
    case 'alert':
      return 'rgba(220,38,38,0.08)';
    default:
      return 'rgba(100,116,139,0.08)';
  }
}

export function NiosTeHabla({ brief }: Props) {
  return (
    <section
      style={{
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        background: 'var(--ni-bg)',
        marginBottom: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, marginBottom: 6 }}>{brief.greeting}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {brief.headline}
          </p>
        </div>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: 999,
            background: statusBg(brief.status),
            color: statusColor(brief.status),
            textTransform: 'uppercase',
          }}
        >
          {brief.statusLabel}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        {brief.sections.map((section) => (
          <div
            key={section.title}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 10 }}>
              <span style={{ marginRight: 8 }}>{section.icon}</span>
              {section.title}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: statusBg(item.status),
                    color: item.status === 'neutral' ? 'var(--text)' : statusColor(item.status),
                    fontSize: '0.9rem',
                  }}
                >
                  {item.label && (
                    <span style={{ fontWeight: 700, display: 'block', marginBottom: 2 }}>{item.label}</span>
                  )}
                  {item.value}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {brief.opportunities.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 10 }}>🚀 Top 5 oportunidades de hoy</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {brief.opportunities.slice(0, 5).map((o: NiosGrowthOpportunity, i) => (
              <li
                key={i}
                style={{
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${impactColor(o.impact)}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: '0.92rem',
                }}
              >
                <div style={{ fontWeight: 700 }}>{o.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>
                  {o.evidence} · Confianza {o.confidence.toLowerCase()} · Impacto {o.impact.toLowerCase()}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
                  Acción: {o.action}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 2 }}>
                  Resultado esperado: {o.expectedResult}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.plan.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 10 }}>🎯 Plan de hoy</h3>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            {brief.plan.slice(0, 7).map((p, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {p.text}
                <span
                  style={{
                    fontSize: '0.75rem',
                    marginLeft: 8,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: p.source === 'human' ? '#fee2e2' : p.source === 'repair' ? '#fef3c7' : '#dcfce7',
                    color: p.source === 'human' ? '#991b1b' : p.source === 'repair' ? '#92400e' : '#166534',
                  }}
                >
                  {p.source === 'ceo' ? 'NIOS' : p.source === 'repair' ? 'reparación' : 'humano'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <span>🕒 {brief.freshness.note}</span>
        {brief.sources.map((s) => (
          <span key={s.name}>
            {s.name}: <strong>{s.status}</strong>
          </span>
        ))}
      </div>
    </section>
  );
}
