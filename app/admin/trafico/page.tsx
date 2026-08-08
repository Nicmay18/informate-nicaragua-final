'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { Send, Search, MessageCircle, Users, TrendingUp } from 'lucide-react';

interface TrafficData {
  total: number;
  sources: Record<string, number>;
  topArticles: { slug: string; views: number; sources: Record<string, number> }[];
  recent: { slug: string; titulo: string; source: string; timestamp: string }[];
  hours: number;
  generatedAt: string;
}

const sourceIcons: Record<string, React.ReactNode> = {
  facebook: <Users size={20} />,
  telegram: <Send size={20} />,
  google: <Search size={20} />,
  whatsapp: <MessageCircle size={20} />,
  directo: <Users size={20} />,
  otro: <Users size={20} />,
};

const sourceLabels: Record<string, string> = {
  facebook: 'Facebook',
  telegram: 'Telegram',
  google: 'Google / Discover',
  whatsapp: 'WhatsApp',
  directo: 'Directo',
  otro: 'Otro',
};

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return 'ahora';
  if (diff < 60) return `hace ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export default function TraficoPage() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { adminFetch } = useAdminFetch();

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/trafico?horas=24&top=10', { cache: 'no-store' });
        const d = await res.json();
        if (!res.ok || d.error) throw new Error(d.error || `Error ${res.status}`);
        setData(d);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [adminFetch]);

  if (loading) {
    return <div style={{ padding: 40 }}>Cargando tráfico...</div>;
  }

  if (error || !data) {
    return <div style={{ padding: 40, color: '#ef4444' }}>Error: {error || 'Sin datos'}</div>;
  }

  const mainSources = ['facebook', 'telegram', 'google', 'whatsapp'];
  const sourceCards = mainSources.map((key) => ({
    key,
    label: sourceLabels[key] || key,
    value: data.sources[key] || 0,
    icon: sourceIcons[key] || <Users size={20} />,
    color: key === 'facebook' ? '#3b82f6' : key === 'telegram' ? '#0ea5e9' : key === 'google' ? '#22c55e' : '#10b981',
  }));

  const topArticlesWithTitles = data.topArticles.slice(0, 10);

  return (
    <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#1e293b' }}>Analytics & Tráfico Real</h1>
        <p style={{ color: '#64748b' }}>Métricas en tiempo real — De dónde vienen tus lectores y qué están leyendo ahora.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {sourceCards.map((s) => (
          <div
            key={s.key}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              borderTop: `4px solid ${s.color}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#1e293b' }}>{s.value.toLocaleString('es-NI')}</span>
              <span style={{ color: s.color, background: `${s.color}15`, padding: 10, borderRadius: 12 }}>{s.icon}</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 14 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} color="#f59e0b" />
            Top 10 en las últimas {data.hours}h
          </h2>
          {topArticlesWithTitles.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Esperando datos de tráfico...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topArticlesWithTitles.map((a, i) => (
                <div
                  key={a.slug}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, color: '#64748b', minWidth: 24 }}>{i + 1}</span>
                    <Link
                      href={`/noticias/${a.slug}`}
                      style={{ color: '#1e293b', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}
                    >
                      {a.slug.length > 50 ? a.slug.slice(0, 50) + '…' : a.slug}
                    </Link>
                  </div>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{a.views}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="#8b5cf6" />
            Últimos Visitantes
          </h2>
          {data.recent.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Buscando actividad reciente...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.recent.slice(0, 10).map((r, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                      {r.titulo || r.slug || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      fuente: <strong style={{ textTransform: 'capitalize' }}>{r.source}</strong> · {formatTimeAgo(r.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, color: '#94a3b8', fontSize: 12, textAlign: 'right' }}>
        Total visitas {data.hours}h: <strong>{data.total.toLocaleString('es-NI')}</strong> · generado {formatTimeAgo(data.generatedAt)}
      </div>
    </main>
  );
}
