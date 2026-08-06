'use client';

import type {
  AdSenseRecoveryFullReport,
  RecoveryArticle,
} from '@/lib/nios/intelligence/types';

interface Props {
  report: AdSenseRecoveryFullReport | null;
  snapshotDate: string | null;
}

export default function AdSenseReportClient({ report, snapshotDate }: Props) {
  if (!report) {
    return (
      <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          AdSense Recovery Report
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
            Ejecuta el pipeline de recolección con POST <code>/api/admin/nios-collect</code>.
          </p>
        </div>
      </div>
    );
  }

  const readyColor = report.readyToReapply === 'yes' ? '#22c55e' : report.readyToReapply === 'maybe' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
        AdSense Recovery Report
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Snapshot: {snapshotDate || 'N/A'}
      </p>

      {/* 1. Razón probable */}
      <Section title="1. ¿Por qué Google rechazó probablemente el sitio?">
        <div style={{
          padding: '1.5rem', background: '#fef2f2', border: '1px solid #ef4444',
          borderRadius: 8, color: '#7f1d1d',
        }}>
          {report.likelyRejectionReason}
        </div>
      </Section>

      {/* 2. Top 50 afectando */}
      <Section title="2. ¿Cuáles son las 50 URLs que más afectan?">
        {report.topAffectingUrls.length === 0 ? (
          <p>No se detectaron URLs de alto riesgo.</p>
        ) : (
          <RecoveryTable articles={report.topAffectingUrls} />
        )}
      </Section>

      {/* 3. Top 30 potencial */}
      <Section title="3. ¿Cuáles son las 30 URLs con mayor potencial?">
        {report.topPotentialUrls.length === 0 ? (
          <p>Datos insuficientes.</p>
        ) : (
          <RecoveryTable articles={report.topPotentialUrls} />
        )}
      </Section>

      {/* 4. Categorías fortalecen autoridad */}
      <Section title="4. ¿Qué categorías fortalecen autoridad?">
        {report.authorityCategories.length === 0 ? (
          <p>Datos insuficientes.</p>
        ) : (
          <CategoryTable categories={report.authorityCategories.filter(c => c.strengthensAuthority)} />
        )}
      </Section>

      {/* 5. Categorías necesitan transformación */}
      <Section title="5. ¿Qué categorías necesitan transformación?">
        {report.transformationCategories.length === 0 ? (
          <p>Ninguna categoría en transformación.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.transformationCategories.map(c => (
              <div key={c.categoria} style={{
                padding: '1rem', borderRadius: 8, background: '#fffbeb', border: '1px solid #f59e0b',
              }}>
                <div style={{ fontWeight: 700 }}>{c.categoria}</div>
                <div style={{ fontSize: '0.875rem', color: '#475569' }}>{c.reason}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 6. Listo para solicitar */}
      <Section title="6. ¿Está listo para volver a solicitar AdSense?">
        <div style={{
          padding: '1.5rem', borderRadius: 8, border: `1px solid ${readyColor}`,
          background: report.readyToReapply === 'yes' ? '#f0fdf4' : report.readyToReapply === 'maybe' ? '#fffbeb' : '#fef2f2',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: readyColor, textTransform: 'uppercase' }}>
            {report.readyToReapply}
          </div>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>
            Trust Check: {report.trustCheck.adSenseTrustScore}/100 ({report.trustCheck.status}).
            Recovery: {report.contentRecovery.greenPct}% GREEN, {report.contentRecovery.redPct}% RED.
          </p>
        </div>
      </Section>

      {/* Trust Check */}
      <Section title="AdSense Trust Check">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <Metric label="AdSense Trust" value={`${report.trustCheck.adSenseTrustScore}/100`} color="#0f766e" />
          <Metric label="Identidad" value={`${report.trustCheck.editorialIdentityScore}/100`} color="#3b82f6" />
          <Metric label="Calidad" value={`${report.trustCheck.contentQualityScore}/100`} color="#8b5cf6" />
          <Metric label="UX" value={`${report.trustCheck.userExperienceScore}/100`} color="#0ea5e9" />
          <Metric label="Confianza" value={`${report.trustCheck.trustScore}/100`} color="#f59e0b" />
        </div>
      </Section>

      {/* Recomendaciones */}
      <Section title="Recomendaciones">
        {report.trustCheck.recommendations.length === 0 ? (
          <p style={{ color: '#16a34a' }}>No hay recomendaciones activas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {report.trustCheck.recommendations.map(r => (
              <div key={r.id} style={{
                padding: '1rem', borderRadius: 8,
                background: r.severity === 'critical' ? '#fef2f2' : r.severity === 'warning' ? '#fffbeb' : '#f0fdf4',
                border: `1px solid ${r.severity === 'critical' ? '#ef4444' : r.severity === 'warning' ? '#f59e0b' : '#22c55e'}`,
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.title}</div>
                <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{r.description}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Mejoras por artículo */}
      <Section title="Mejoras recomendadas por artículo">
        {report.improvements.length === 0 ? (
          <p>No hay mejoras identificadas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.improvements.slice(0, 30).map(i => (
              <div key={i.id} style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{i.titulo}</span>
                  <span style={{
                    color: i.priority === 'critical' ? '#ef4444' : i.priority === 'high' ? '#f59e0b' : '#64748b',
                    fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase',
                  }}>{i.priority}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{i.recommendedAction}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
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

function RecoveryTable({ articles }: { articles: RecoveryArticle[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Título</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Categoría</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Rec.</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Imp.</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>CTR</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Problema</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(a => (
            <tr key={a.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{a.titulo}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.slug}</div>
              </td>
              <td style={{ padding: '0.5rem' }}>{a.categoria}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 700, color: a.status === 'green' ? '#22c55e' : a.status === 'yellow' ? '#f59e0b' : '#ef4444' }}>
                {a.recoveryScore}
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscImpressions.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscCtr}%</td>
              <td style={{ padding: '0.5rem', maxWidth: 300 }}>{a.mainProblem}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryTable({ categories }: { categories: { categoria: string; avgGoogleTrust: number; avgMeni: number; articleCount: number }[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Categoría</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Artículos</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Trust</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>MENI</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(c => (
            <tr key={c.categoria} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.categoria}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.articleCount}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.avgGoogleTrust}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.avgMeni}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
