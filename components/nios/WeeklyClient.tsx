'use client';

import type {
  NIOSWeeklyReport,
  GoogleTrustReport,
  ArticleFusion,
  CategoryOpportunity,
  ContentUpdateCandidate,
  GoogleTrustArticle,
} from '@/lib/nios/intelligence/types';

interface Props {
  weekly: NIOSWeeklyReport | null;
  trust: GoogleTrustReport | null;
  snapshotDate: string | null;
}

export default function WeeklyClient({
  weekly,
  trust,
  snapshotDate,
}: Props) {
  if (!weekly || !trust) {
    return (
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          NIOS Weekly Intelligence
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

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
        NIOS Weekly Intelligence
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Semana: {weekly.periodStart} a {weekly.periodEnd} | Snapshot: {snapshotDate || 'N/A'}
      </p>

      {/* Summary */}
      <div style={{
        padding: '1.5rem', background: '#f0fdf4', border: '1px solid #22c55e',
        borderRadius: 8, marginBottom: '1.5rem',
      }}>
        <p style={{ fontSize: '0.875rem', color: '#475569' }}>{weekly.summary}</p>
      </div>

      {/* 1. Contenido funcionando */}
      <Section title="1. ¿Qué contenido está funcionando en Google?">
        {weekly.topPerforming.length === 0 ? (
          <p style={{ color: '#64748b' }}>Datos insuficientes.</p>
        ) : (
          <ArticleTable articles={weekly.topPerforming} />
        )}
      </Section>

      {/* 2. Contenido sin datos de GSC */}
      <Section title="2. ¿Qué contenido no tiene datos de GSC?">
        {weekly.noGscData.length === 0 ? (
          <p style={{ color: '#16a34a' }}>Todo el contenido tiene datos de GSC.</p>
        ) : (
          <ArticleTable articles={weekly.noGscData} />
        )}
      </Section>

      {/* 3. Categorías con oportunidad */}
      <Section title="3. ¿Qué categorías tienen oportunidad?">
        {weekly.categoryOpportunities.length === 0 ? (
          <p style={{ color: '#64748b' }}>Datos insuficientes.</p>
        ) : (
          <CategoryTable categories={weekly.categoryOpportunities} />
        )}
      </Section>

      {/* 4. Qué producir */}
      <Section title="4. ¿Qué debemos producir la próxima semana?">
        {weekly.productionRecommendations.length === 0 ? (
          <p style={{ color: '#64748b' }}>Datos insuficientes.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {weekly.productionRecommendations.map(r => (
              <div key={r.id} style={{
                padding: '1rem', borderRadius: 8, background: '#f0f9ff',
                border: '1px solid #0ea5e9',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{r.title}</div>
                <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{r.description}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 5. Qué actualizar */}
      <Section title="5. ¿Qué debemos actualizar?">
        {weekly.updateCandidates.length === 0 ? (
          <p style={{ color: '#64748b' }}>Datos insuficientes.</p>
        ) : (
          <UpdateTable candidates={weekly.updateCandidates} />
        )}
      </Section>

      {/* 6. Qué bloquea AdSense */}
      <Section title="6. ¿Qué está bloqueando AdSense?">
        {weekly.adsenseBlockers.length === 0 ? (
          <p style={{ color: '#16a34a' }}>No se detectaron bloqueadores de AdSense.</p>
        ) : (
          <RiskTable articles={weekly.adsenseBlockers} />
        )}
      </Section>

      {/* Trust KPIs */}
      <Section title="Google Trust Score">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <Metric label="Alto riesgo" value={trust.highRiskArticles} color="#ef4444" />
          <Metric label="Medio riesgo" value={trust.mediumRiskArticles} color="#f59e0b" />
          <Metric label="Bajo riesgo" value={trust.lowRiskArticles} color="#22c55e" />
          <Metric label="Thin content" value={trust.thinContentCount} color="#dc2626" />
          <Metric label="Promedio Trust" value={`${trust.averageGoogleTrustScore}/100`} color="#0f766e" />
        </div>
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

function ArticleTable({ articles }: { articles: ArticleFusion[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Título</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Impresiones</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Clics</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>CTR</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Pos.</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>MENI</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(a => (
            <tr key={a.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{a.titulo}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.categoria}</div>
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscImpressions.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscClicks.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscCtr}%</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscPosition.toFixed(1)}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 700 }}>{a.scoreMeni}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryTable({ categories }: { categories: CategoryOpportunity[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Categoría</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Artículos</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Impresiones</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>CTR</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Pos.</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Oport.</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(c => (
            <tr key={c.categoria} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{c.categoria}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.reasoning}</div>
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.totalArticles}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.googleImpressions.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.avgCtr}%</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.avgPosition.toFixed(1)}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                <span style={{
                  color: c.opportunity === 'alta' ? '#22c55e' : c.opportunity === 'media' ? '#f59e0b' : '#64748b',
                  fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem',
                }}>{c.opportunity}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpdateTable({ candidates }: { candidates: ContentUpdateCandidate[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {candidates.map(c => (
        <div key={c.slug} style={{
          padding: '1rem', borderRadius: 8, background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.titulo}</span>
            <span style={{
              color: c.expectedImpact === 'alto' ? '#ef4444' : c.expectedImpact === 'medio' ? '#f59e0b' : '#64748b',
              fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase',
            }}>Impacto {c.expectedImpact}</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{c.reason}</p>
        </div>
      ))}
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
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Palabras</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>MENI</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Trust</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(a => (
            <tr key={a.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{a.titulo}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.categoria}</div>
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.palabras}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.scoreMeni}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 700, color: '#ef4444' }}>{a.googleTrustScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
