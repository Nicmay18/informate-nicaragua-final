'use client';

import type {
  AdSenseRecoveryReport,
  GoogleTrustReport,
  GoogleTrustArticle,
  ThinContentArticle,
} from '@/lib/nios/intelligence/types';

interface Props {
  recovery: AdSenseRecoveryReport | null;
  trust: GoogleTrustReport | null;
  snapshotDate: string | null;
}

export default function AdSenseRecoveryClient({
  recovery,
  trust,
  snapshotDate,
}: Props) {
  if (!recovery || !trust) {
    return (
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          AdSense Recovery
        </h1>
        <div style={{
          padding: '2rem',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          color: '#92400e',
        }}>
          <p style={{ fontWeight: 600 }}>No hay datos disponibles.</p>
          <p style={{ fontSize: '0.875rem' }}>
            Ejecuta el pipeline de recolección con POST <code>/api/admin/nios-collect</code>.
          </p>
        </div>
      </div>
    );
  }

  const riskColor = recovery.riskLevel === 'alto' ? '#ef4444' : recovery.riskLevel === 'medio' ? '#f59e0b' : '#22c55e';
  const riskBg = recovery.riskLevel === 'alto' ? '#fef2f2' : recovery.riskLevel === 'medio' ? '#fffbeb' : '#f0fdf4';

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
        AdSense Recovery
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Estado de riesgo: {snapshotDate || 'N/A'}
      </p>

      <div style={{
        padding: '1.5rem', background: riskBg, border: `1px solid ${riskColor}`,
        borderRadius: 8, marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: riskColor, marginBottom: '0.5rem' }}>
          Riesgo: {recovery.riskLevel.toUpperCase()}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#475569' }}>{recovery.summary}</p>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Metric label="Original" value={`${recovery.contentOriginalityPct}%`} color="#22c55e" />
        <Metric label="Con autor" value={`${recovery.contentAuthorPct}%`} color="#3b82f6" />
        <Metric label="Con contexto" value={`${recovery.contentContextPct}%`} color="#8b5cf6" />
        <Metric label="Con profundidad" value={`${recovery.contentSourcesPct}%`} color="#0ea5e9" />
        <Metric label="Útil" value={`${recovery.contentUsefulPct}%`} color="#f59e0b" />
        <Metric label="Trust Score" value={`${trust.averageGoogleTrustScore}/100`} color={trust.averageGoogleTrustScore >= 70 ? '#22c55e' : '#ef4444'} />
      </div>

      {/* Top 20 URLs que afectan */}
      <Section title="20 URLs que probablemente afectan la aprobación de AdSense">
        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: 600 }}>
          No borrar automáticamente. Revisar manualmente.
        </p>
        {recovery.topRiskUrls.length === 0 ? (
          <p style={{ color: '#16a34a', fontWeight: 600 }}>No se detectaron URLs de alto riesgo.</p>
        ) : (
          <RiskTable articles={recovery.topRiskUrls} />
        )}
      </Section>

      {/* Thin content */}
      <Section title="Thin content detectado">
        {recovery.thinContent.length === 0 ? (
          <p style={{ color: '#16a34a' }}>No hay thin content detectado.</p>
        ) : (
          <ThinTable thin={recovery.thinContent} />
        )}
      </Section>

      {/* Recomendaciones */}
      <Section title="Recomendaciones AdSense">
        {recovery.recommendations.length === 0 ? (
          <p style={{ color: '#16a34a' }}>No hay recomendaciones activas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recovery.recommendations.map(r => (
              <div key={r.id} style={{
                padding: '1rem', borderRadius: 8,
                background: r.severity === 'critical' ? '#fef2f2' : r.severity === 'warning' ? '#fffbeb' : '#f0fdf4',
                border: `1px solid ${r.severity === 'critical' ? '#ef4444' : r.severity === 'warning' ? '#f59e0b' : '#22c55e'}`,
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{r.title}</div>
                <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{r.description}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      padding: '1rem', background: '#fff', borderRadius: 8,
      border: '1px solid #e2e8f0', textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>{title}</h3>
      {children}
    </div>
  );
}

function RiskTable({ articles }: { articles: GoogleTrustArticle[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Título</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>MENI</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Imp.</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Trust</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Riesgo</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(a => (
            <tr key={a.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{a.titulo}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.categoria}</div>
                {a.thinContentFlags.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                    {a.thinContentFlags.slice(0, 2).join(' · ')}
                  </div>
                )}
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.scoreMeni}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscImpressions.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 700 }}>{a.googleTrustScore}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                <span style={{
                  color: a.risk === 'alto' ? '#ef4444' : a.risk === 'medio' ? '#f59e0b' : '#22c55e',
                  fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem',
                }}>{a.risk}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThinTable({ thin }: { thin: ThinContentArticle[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {thin.slice(0, 30).map(t => (
        <div key={t.slug} style={{
          padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.titulo}</span>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{t.palabras} palabras · MENI {t.scoreMeni}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {t.reasons.join(' · ')}
          </div>
        </div>
      ))}
    </div>
  );
}
