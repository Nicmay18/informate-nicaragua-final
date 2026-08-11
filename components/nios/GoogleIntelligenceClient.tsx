'use client';

import { useState } from 'react';
import type {
  GoogleIntelligenceDashboard,
  ComplianceReport,
  AdSenseReadinessReport,
  ArticleFusion,
} from '@/lib/nios/intelligence/types';

interface Props {
  dashboard: GoogleIntelligenceDashboard | null;
  compliance: ComplianceReport | null;
  readiness: AdSenseReadinessReport | null;
  snapshotDate: string | null;
}

type Tab = 'google' | 'compliance' | 'readiness';

export default function GoogleIntelligenceClient({
  dashboard,
  compliance,
  readiness,
  snapshotDate,
}: Props) {
  const [tab, setTab] = useState<Tab>('google');

  if (!dashboard) {
    return (
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          NIOS Intelligence Platform
        </h1>
        <div style={{
          padding: '2rem',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          color: '#92400e',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No hay datos disponibles.</p>
          <p style={{ fontSize: '0.875rem' }}>
            Ejecuta el pipeline de recolección con un POST a <code>/api/admin/nios-collect</code> para comenzar a recopilar datos de Google Search Console y GA4.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
        NIOS Intelligence Platform v1.0
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Datos reales de Google Search Console y Google Analytics 4.
        Snapshot: {snapshotDate || 'N/A'} | Rango: {dashboard.dateRange.start} a {dashboard.dateRange.end}
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
        {([
          { id: 'google' as Tab, label: 'Google Intelligence' },
          { id: 'compliance' as Tab, label: 'Compliance Intelligence' },
          { id: 'readiness' as Tab, label: 'AdSense Readiness' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: tab === t.id ? '#0f766e' : 'transparent',
              color: tab === t.id ? '#fff' : '#64748b',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'google' && <GoogleTab dashboard={dashboard} />}
      {tab === 'compliance' && <ComplianceTab compliance={compliance} />}
      {tab === 'readiness' && <ReadinessTab readiness={readiness} />}
    </div>
  );
}

// ─── Google Intelligence Tab ───────────────────────────────────

function GoogleTab({ dashboard }: { dashboard: GoogleIntelligenceDashboard }) {
  if (!dashboard.hasData) {
    return (
      <div style={{
        padding: '1.5rem',
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 8,
        color: '#92400e',
      }}>
        <p style={{ fontWeight: 600 }}>No hay datos de Google Search Console disponibles.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Verifica que el sitio esté verificado en GSC y que el Service Account tenga acceso.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <KPI label="Impresiones" value={dashboard.totalImpressions.toLocaleString()} color="#0f766e" />
        <KPI label="Clics" value={dashboard.totalClicks.toLocaleString()} color="#0f766e" />
        <KPI label="CTR promedio" value={`${dashboard.avgCtr}%`} color="#3b82f6" />
        <KPI label="Posición media" value={dashboard.avgPosition.toFixed(1)} color="#8b5cf6" />
        <KPI label="Usuarios (GA4)" value={dashboard.totalUsers.toLocaleString()} color="#f59e0b" />
        <KPI label="Sesiones (GA4)" value={dashboard.totalSessions.toLocaleString()} color="#f59e0b" />
      </div>

      {/* Top 20 por impresiones */}
      <Section title="Top 20 notas con más impresiones">
        <ArticleTable articles={dashboard.topImpressions} />
      </Section>

      {/* Mejor CTR */}
      <Section title="Mejor CTR (mín. 100 impresiones)">
        <ArticleTable articles={dashboard.topCtr} />
      </Section>

      {/* Peor CTR */}
      <Section title="Peor CTR (mín. 500 impresiones)">
        <ArticleTable articles={dashboard.worstCtr} />
      </Section>

      {/* Top queries */}
      <Section title="Consultas que generan más tráfico">
        <QueryTable queries={dashboard.topQueries} />
      </Section>

      {/* Categorías */}
      <Section title="Tráfico por categoría">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {dashboard.categoryGrowth.map(cat => (
            <div key={cat.categoria} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 6,
            }}>
              <span style={{ fontWeight: 600 }}>{cat.categoria}</span>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                <span>{cat.impressions.toLocaleString()} impresiones</span>
                <span>{cat.clicks.toLocaleString()} clics</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* URLs que Google ignora */}
      <Section title="URLs que Google ignora (0 impresiones en 28 días)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {dashboard.zeroImpressionUrls.length === 0 ? (
            <p style={{ color: '#16a34a', fontWeight: 600 }}>No hay URLs sin impresiones.</p>
          ) : (
            dashboard.zeroImpressionUrls.slice(0, 20).map(url => (
              <div key={url.slug} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.5rem 1rem', background: '#fef2f2', borderRadius: 4,
                fontSize: '0.875rem',
              }}>
                <span>{url.titulo}</span>
                <span style={{ color: '#dc2626' }}>MENI: {url.fecha ? new Date(url.fecha).toLocaleDateString('es-NI') : 'N/A'}</span>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Recomendaciones */}
      <Section title={`Recomendaciones basadas en datos (${dashboard.recommendations.length})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dashboard.recommendations.length === 0 ? (
            <p style={{ color: '#16a34a', fontWeight: 600 }}>No hay recomendaciones. Todo está en orden.</p>
          ) : (
            dashboard.recommendations.slice(0, 30).map(rec => (
              <div key={rec.id} style={{
                padding: '1rem', borderRadius: 8,
                background: rec.severity === 'critical' ? '#fef2f2' : rec.severity === 'warning' ? '#fffbeb' : '#f0fdf4',
                border: `1px solid ${rec.severity === 'critical' ? '#ef4444' : rec.severity === 'warning' ? '#f59e0b' : '#22c55e'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{rec.title}</span>
                  <span style={{
                    fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: 4,
                    background: rec.severity === 'critical' ? '#ef4444' : rec.severity === 'warning' ? '#f59e0b' : '#22c55e',
                    color: '#fff', fontWeight: 600,
                  }}>{rec.severity}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '0.5rem' }}>{rec.description}</p>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {rec.evidence.map((ev, i) => (
                    <div key={i}>
                      <strong>{ev.source}</strong> → {ev.metric}: {ev.value}
                      {ev.comparison ? ` (${ev.comparison})` : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── Compliance Tab ────────────────────────────────────────────

function ComplianceTab({ compliance }: { compliance: ComplianceReport | null }) {
  if (!compliance) {
    return <EmptyState message="No hay reporte de compliance disponible." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary */}
      <div style={{
        padding: '1.5rem', background: '#f0fdf4', border: '1px solid #22c55e',
        borderRadius: 8,
      }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Resumen</h3>
        <p style={{ fontSize: '0.875rem', color: '#475569' }}>{compliance.summary}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <KPI label="Total artículos" value={compliance.totalArticles} color="#3b82f6" />
        <KPI label="Google ignora" value={compliance.articlesGoogleIgnores} color="#ef4444" />
        <KPI label="Google valora" value={compliance.articlesGoogleValues} color="#22c55e" />
        <KPI label="MENI sobreestima" value={compliance.meniOverestimates} color="#f59e0b" />
        <KPI label="MENI subestima" value={compliance.meniUnderestimates} color="#8b5cf6" />
        <KPI label="Alineados" value={compliance.alignedCount} color="#0f766e" />
      </div>

      {/* Top ignored: MENI alto pero Google ignora */}
      <Section title="MENI alto pero Google ignora (contenido de poco valor)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {compliance.topIgnored.length === 0 ? (
            <p style={{ color: '#16a34a', fontWeight: 600 }}>No hay artículos con MENI alto que Google ignore.</p>
          ) : (
            compliance.topIgnored.map(v => (
              <div key={v.slug} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: 6,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.titulo}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v.categoria}</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>MENI: {v.scoreMeni}</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>Google: {v.gscImpressions} imp.</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Top valued: Google muestra impresiones */}
      <Section title="Artículos que Google valora">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {compliance.topValued.length === 0 ? (
            <p style={{ color: '#64748b' }}>No hay artículos con impresiones de Google.</p>
          ) : (
            compliance.topValued.map(v => (
              <div key={v.slug} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: 6,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.titulo}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v.categoria}</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>{v.gscImpressions.toLocaleString()} imp.</span>
                  <span style={{ color: '#3b82f6' }}>{v.gscClicks} clics</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── Readiness Tab ─────────────────────────────────────────────

function ReadinessTab({ readiness }: { readiness: AdSenseReadinessReport | null }) {
  if (!readiness) {
    return <EmptyState message="No hay reporte de AdSense Readiness disponible." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary */}
      <div style={{
        padding: '1.5rem', background: readiness.averageReadinessScore >= 70 ? '#f0fdf4' : '#fffbeb',
        border: `1px solid ${readiness.averageReadinessScore >= 70 ? '#22c55e' : '#f59e0b'}`,
        borderRadius: 8,
      }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>AdSense Readiness Report</h3>
        <p style={{ fontSize: '0.875rem', color: '#475569' }}>{readiness.summary}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <KPI label="Total artículos" value={readiness.totalArticles} color="#3b82f6" />
        <KPI label="Ready (≥80)" value={readiness.readyArticles} color="#22c55e" />
        <KPI label="Needs work (50-79)" value={readiness.needsWorkArticles} color="#f59e0b" />
        <KPI label="Critical (<50)" value={readiness.criticalArticles} color="#ef4444" />
        <KPI label="Score promedio" value={`${readiness.averageReadinessScore}/100`} color="#8b5cf6" />
      </div>

      {/* Top issues */}
      <Section title="Issues más comunes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {readiness.topIssues.map(issue => (
            <div key={issue.issue} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 6,
            }}>
              <span style={{ fontSize: '0.875rem' }}>{issue.issue}</span>
              <span style={{ fontWeight: 700, color: '#ef4444' }}>{issue.count} artículos</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Google ignored with high MENI */}
      <Section title="MENI ≥ 90 pero Google ignora (0 impresiones)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {readiness.googleIgnoredWithHighMeni.length === 0 ? (
            <p style={{ color: '#16a34a', fontWeight: 600 }}>No hay artículos con MENI alto que Google ignore.</p>
          ) : (
            readiness.googleIgnoredWithHighMeni.map(a => (
              <div key={a.slug} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: 6,
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{a.titulo}</span>
                <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.875rem' }}>MENI: {a.scoreMeni}</span>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Artículos críticos */}
      <Section title="Artículos críticos (readiness < 50)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {readiness.articles.filter(a => a.readinessScore < 50).slice(0, 30).map(a => (
            <div key={a.slug} style={{
              padding: '0.75rem 1rem', background: '#fef2f2', borderRadius: 6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.titulo}</span>
                <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.875rem' }}>{a.readinessScore}/100</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {a.issues.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Componentes auxiliares ────────────────────────────────────

function KPI({ label, value, color }: { label: string; value: string | number; color: string }) {
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
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>{title}</h3>
      {children}
    </div>
  );
}

function ArticleTable({ articles }: { articles: ArticleFusion[] }) {
  if (articles.length === 0) {
    return <p style={{ color: '#64748b' }}>No hay datos.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 600 }}>Título</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>Impresiones</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>Clics</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>CTR</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>Pos.</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>MENI</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>Usuarios</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(a => (
            <tr key={a.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.titulo}
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>{a.gscImpressions.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.gscClicks.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem', color: a.gscCtr < 2 ? '#ef4444' : a.gscCtr > 5 ? '#22c55e' : '#64748b' }}>
                {a.gscCtr}%
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem', color: a.gscPosition > 20 ? '#ef4444' : a.gscPosition < 5 ? '#22c55e' : '#64748b' }}>
                {a.gscPosition.toFixed(1)}
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600, color: a.scoreMeni !== null ? (a.scoreMeni >= 90 ? '#22c55e' : a.scoreMeni < 80 ? '#ef4444' : '#f59e0b') : '#64748b' }}>
                {a.scoreMeni ?? '-'}
              </td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{a.ga4Users.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueryTable({ queries }: { queries: import('@/lib/nios/intelligence/types').GSCQueryRow[] }) {
  if (queries.length === 0) {
    return <p style={{ color: '#64748b' }}>No hay datos de consultas.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 600 }}>Consulta</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>Impresiones</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>Clics</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>CTR</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>Pos.</th>
          </tr>
        </thead>
        <tbody>
          {queries.map(q => (
            <tr key={q.query} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.5rem', fontWeight: 500 }}>{q.query}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{q.impressions.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 600 }}>{q.clicks.toLocaleString()}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{q.ctr}%</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>{q.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 8, color: '#64748b',
    }}>
      <p>{message}</p>
    </div>
  );
}
