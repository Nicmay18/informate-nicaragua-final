'use client';

import type { EditorCEOReport } from '@/lib/nios/intelligence/types';

interface Props {
  report: EditorCEOReport | null;
  snapshotDate: string | null;
}

export default function EditorialStrategyClient({ report, snapshotDate }: Props) {
  if (!report || !report.hasData) {
    return (
      <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          Editorial Strategy — CEO Report
        </h1>
        <div style={{
          padding: '2rem',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          color: '#92400e',
        }}>
          <p style={{ fontWeight: 600 }}>Datos insuficientes para evaluar.</p>
          <p style={{ fontSize: '0.875rem' }}>
            Ejecuta el pipeline con POST <code>/api/admin/nios-collect</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
        Editorial Strategy — CEO Report
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Periodo: {report.periodStart} a {report.periodEnd} | Snapshot: {snapshotDate || 'N/A'}
      </p>

      {/* Summary */}
      <div style={{
        padding: '1.5rem', background: '#f8fafc', borderRadius: 8,
        border: '1px solid #e2e8f0', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#334155',
      }}>
        {report.summary}
      </div>

      {/* 1. ¿Qué funcionó? */}
      <Section title="1. ¿Qué funcionó esta semana?" color="#22c55e">
        {report.whatWorked.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay artículos con desempeño destacado.</p>
        ) : (
          <List items={report.whatWorked.map(w => ({
            title: w.titulo,
            subtitle: w.categoria,
            value: w.value,
            metric: w.metric,
          }))} color="#22c55e" />
        )}
      </Section>

      {/* 2. ¿Qué fracasó? */}
      <Section title="2. ¿Qué fracasó?" color="#ef4444">
        {report.whatFailed.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay fracasos detectados.</p>
        ) : (
          <List items={report.whatFailed.map(w => ({
            title: w.titulo,
            subtitle: w.categoria,
            value: w.value,
            metric: w.metric,
          }))} color="#ef4444" />
        )}
      </Section>

      {/* 3. ¿Qué repetir? */}
      <Section title="3. ¿Qué debemos repetir?" color="#3b82f6">
        {report.whatToRepeat.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay patrones claros para repetir.</p>
        ) : (
          <ActionList actions={report.whatToRepeat} color="#3b82f6" />
        )}
      </Section>

      {/* 4. ¿Qué dejar de hacer? */}
      <Section title="4. ¿Qué debemos dejar de hacer?" color="#f59e0b">
        {report.whatToStop.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay acciones que detener.</p>
        ) : (
          <ActionList actions={report.whatToStop} color="#f59e0b" />
        )}
      </Section>

      {/* 5. Oportunidades de temas */}
      <Section title="5. ¿Qué temas tienen oportunidad?" color="#8b5cf6">
        {report.topicOpportunities.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay oportunidades detectadas.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Consulta</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Imp.</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>CTR</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Pos.</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Recomendación</th>
                </tr>
              </thead>
              <tbody>
                {report.topicOpportunities.map(o => (
                  <tr key={o.query} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{o.query}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{o.impressions.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{o.ctr}%</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{o.position.toFixed(1)}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.75rem' }}>{o.opportunityType}</td>
                    <td style={{ padding: '0.5rem', maxWidth: 400 }}>{o.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 6. Artículos a actualizar */}
      <Section title="6. ¿Qué artículos actualizar?" color="#0ea5e9">
        {report.articlesToUpdate.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay artículos que requieran actualización.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Título</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Categoría</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Imp.</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Pos.</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Días</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Razón</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {report.articlesToUpdate.map(a => (
                  <tr key={a.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{a.titulo}</td>
                    <td style={{ padding: '0.5rem' }}>{a.categoria}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscImpressions.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscPosition.toFixed(1)}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.daysSincePublication}</td>
                    <td style={{ padding: '0.5rem', maxWidth: 250 }}>{a.reason}</td>
                    <td style={{ padding: '0.5rem', maxWidth: 300 }}>{a.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Content Mix */}
      <Section title="Content Mix — Próxima semana" color="#0f766e">
        {report.contentMix.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay recomendaciones de content mix.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.contentMix.map((m, i) => (
              <div key={i} style={{
                padding: '1rem', borderRadius: 8, background: '#f0fdfa', border: '1px solid #0f766e',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  {m.cantidad}x {m.tipo} en {m.categoria}
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{m.razon}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* MENI Learning */}
      {report.meniLearning && report.meniLearning.hasHistoricalData && (
        <Section title="Aprendizaje MENI" color="#7c3aed">
          <div style={{
            padding: '1rem', borderRadius: 8, background: '#faf5ff', border: '1px solid #7c3aed',
            fontSize: '0.875rem', color: '#475569',
          }}>
            {report.meniLearning.summary}
          </div>
          {report.meniLearning.rulesCorrect.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong style={{ color: '#22c55e', fontSize: '0.8125rem' }}>Reglas acertadas:</strong>
              <ul style={{ fontSize: '0.8125rem', color: '#475569', paddingLeft: '1.5rem' }}>
                {report.meniLearning.rulesCorrect.map((r, i) => (
                  <li key={i}>{r.rule}: {r.count} casos</li>
                ))}
              </ul>
            </div>
          )}
          {report.meniLearning.rulesIncorrect.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong style={{ color: '#ef4444', fontSize: '0.8125rem' }}>Reglas equivocadas:</strong>
              <ul style={{ fontSize: '0.8125rem', color: '#475569', paddingLeft: '1.5rem' }}>
                {report.meniLearning.rulesIncorrect.map((r, i) => (
                  <li key={i}>{r.rule}: {r.count} casos</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{
        fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem',
        color, borderBottom: `2px solid ${color}`, paddingBottom: '0.5rem',
      }}>{title}</h3>
      {children}
    </div>
  );
}

function List({ items, color }: {
  items: { title: string; subtitle: string; value: string; metric: string }[];
  color: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: '0.75rem 1rem', borderRadius: 6,
          background: color === '#22c55e' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${color}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.subtitle}</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
            <strong>{item.metric}:</strong> {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionList({ actions, color }: {
  actions: { action: string; reasoning: string; evidence: { source: string; metric: string; value: string | number }[] }[];
  color: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {actions.map((a, i) => (
        <div key={i} style={{
          padding: '1rem', borderRadius: 8,
          background: color === '#3b82f6' ? '#eff6ff' : '#fffbeb',
          border: `1px solid ${color}`,
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{a.action}</div>
          <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{a.reasoning}</p>
        </div>
      ))}
    </div>
  );
}
