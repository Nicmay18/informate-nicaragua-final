import type { DailyEditorReport } from '@/lib/nios/daily-editor';
import type { ReactNode } from 'react';
import { Target, AlertTriangle, Lightbulb, Search, TrendingUp, Calendar, CheckCircle, BarChart3 } from 'lucide-react';

const levelColor: Record<string, string> = {
  alto: '#16a34a',
  medio: '#ca8a04',
  bajo: '#dc2626',
};

const levelBg: Record<string, string> = {
  alto: 'rgba(22,163,74,0.1)',
  medio: 'rgba(202,138,4,0.1)',
  bajo: 'rgba(220,38,38,0.1)',
};

export function DailyEditorPanel({ daily }: { daily: DailyEditorReport }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={22} />
        NIOS Daily Editor
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>
        {daily.date} · {daily.publishedCount} noticias publicadas · Categoría dominante: <strong>{daily.dominantCategory}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card icon={<CheckCircle size={20} />} title="Recomendación diaria" count={daily.recommendations.length}>
          {daily.recommendations.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.9rem', lineHeight: 1.5 }}>
              {daily.recommendations.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sin recomendaciones hoy.</p>
          )}
        </Card>

        <Card icon={<AlertTriangle size={20} />} title="Categorías a fortalecer" count={daily.categoriesToStrengthen.length}>
          {daily.categoriesToStrengthen.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {daily.categoriesToStrengthen.map((c) => (
                <span key={c} style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '4px 10px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600 }}>{c}</span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Todas las categorías saludables.</p>
          )}
        </Card>

        <Card icon={<Search size={20} />} title="SEO pendiente" count={daily.seo.total}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(daily.seo.counts).map(([k, v]) => (
              <div key={k} style={{ fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{formatIssue(k)}:</span>{' '}
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={<Lightbulb size={20} />} title="Oportunidades" count={daily.opportunities.length}>
          {daily.opportunities.slice(0, 4).map((o) => (
            <div key={o.id} style={{ borderLeft: `4px solid ${o.priority === 'high' ? '#dc2626' : '#ca8a04'}`, padding: '6px 8px', borderRadius: 6, background: 'var(--ni-bg)', marginBottom: 6, fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600 }}>{o.topic}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{o.action}</div>
            </div>
          ))}
        </Card>

        <Card icon={<TrendingUp size={20} />} title="Señales comerciales" count={daily.businessSignals.length} wide>
          {daily.businessSignals.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              {daily.businessSignals.map((s) => (
                <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', background: 'var(--ni-bg)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.category}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.potential.toUpperCase()} · {s.contentCount} piezas</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sin señales comerciales hoy.</p>
          )}
        </Card>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: 'var(--ni-bg)', marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={18} />
          Salud editorial por categoría
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {Object.entries(daily.categoryHealth).map(([cat, data]) => (
            <div key={cat} style={{ borderRadius: 10, padding: 12, background: levelBg[data.level], border: `1px solid ${levelColor[data.level]}`, }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cat}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: levelColor[data.level] }}>{data.level}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                7d: {data.count7} · 30d: {data.count30} · vistas 7d: {data.views7}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: 'var(--ni-bg)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={18} />
          Plan de contenido sugerido
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '8px 0' }}>Día</th>
              <th style={{ padding: '8px 0' }}>Tipos de piezas</th>
            </tr>
          </thead>
          <tbody>
            {daily.weeklyMix.map((m) => (
              <tr key={m.day} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 0', fontWeight: 600 }}>{m.day}</td>
                <td style={{ padding: '8px 0' }}>{m.items.join(' + ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Card({ icon, title, count, children, wide = false }: { icon: ReactNode; title: string; count: number; children: ReactNode; wide?: boolean }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 16, background: 'var(--ni-bg)', gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {title} <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 6 }}>({count})</span>
      </div>
      {children}
    </div>
  );
}

function formatIssue(key: string): string {
  const map: Record<string, string> = {
    titulo_largo: 'Título largo',
    meta_larga: 'Meta larga',
    meta_vacia: 'Meta vacía',
    sin_autor: 'Sin autor',
    sin_imagen: 'Sin imagen',
    sin_alt: 'Sin alt',
  };
  return map[key] || key;
}
