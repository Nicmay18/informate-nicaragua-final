import type { Metadata } from 'next';
import { getGrowthMetrics } from '@/lib/growth';
import { BarChart3, Eye, Users, Newspaper, Activity, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Growth Dashboard | Admin' },
};

export default async function GrowthDashboardPage() {
  const metrics = await getGrowthMetrics();

  return (
    <main style={{ padding: '32px 20px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
        <BarChart3 size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10 }} />
        Growth Dashboard
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Métricas de visitas, contenido, fuentes de tráfico y artículos más leídos.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatBox icon={<Newspaper size={20} />} label="Noticias publicadas" value={metrics.totalNews} />
        <StatBox icon={<Eye size={20} />} label="Vistas totales" value={metrics.totalViews.toLocaleString('es-NI')} />
        <StatBox icon={<Activity size={20} />} label="Visitas recientes" value={metrics.recentVisits} />
        <StatBox icon={<Users size={20} />} label="Fuentes de tráfico" value={Object.keys(metrics.trafficSources).length} />
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
        <TrendingUp size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
        Artículos más leídos
      </h2>
      <div style={{ display: 'grid', gap: 10, marginBottom: 32 }}>
        {metrics.topArticles.length > 0 ? (
          metrics.topArticles.map((a) => (
            <div key={a.slug} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>{a.titulo}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{a.vistas} vistas</div>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No hay datos de vistas todavía.</p>
        )}
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Fuentes de tráfico</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {Object.entries(metrics.trafficSources).length > 0 ? (
          Object.entries(metrics.trafficSources).map(([source, count]) => (
            <div key={source} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{source}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{count}</div>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No hay datos de fuentes de tráfico todavía.</p>
        )}
      </div>
    </main>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: 'var(--ni-bg)' }}>
      <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
}
