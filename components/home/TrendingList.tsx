import Link from 'next/link';
import type { Noticia } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

export default function TrendingList({ noticias }: { noticias: Noticia[] }) {
  if (!noticias.length) return null;

  return (
    <div className="sidebar-widget trending-widget" style={{ background: '#faf9f7', borderRadius: 8, padding: 20, marginBottom: 24, border: '1px solid #f0f0f4' }}>
      {/* Widget Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #1a1a2e' }}>
        <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }} />
        <h3 style={{ fontFamily: 'var(--font-merri)', fontSize: 16, fontWeight: 900, color: '#1a1a2e', margin: 0 }}>Tendencias</h3>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <style>{`
        .trending-link { display: flex; gap: 12px; padding: 12px 0; text-decoration: none; color: inherit; transition: all 0.2s; border-bottom: 1px solid #f0f0f4; }
        .trending-link:last-child { border-bottom: none; }
        .trending-link:hover { padding-left: 8px; }
        .trending-link:hover .trending-rank { color: #c41e3a; }
        .trending-link:hover .trending-title { color: #c41e3a; }
      `}</style>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {noticias.map((n, i) => (
          <li key={n.id}>
            <Link
              href={`/noticias/${n.slug}`}
              className="trending-link"
            >
              <span className="trending-rank" style={{
                fontSize: 24,
                fontWeight: 900,
                color: i === 0 ? '#c41e3a' : '#e8e8ec',
                lineHeight: 1,
                minWidth: 28,
                fontFamily: 'var(--font-merri)',
                transition: 'color 0.2s',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: CATEGORY_COLORS[n.categoria] || '#c41e3a',
                  marginBottom: 4,
                  display: 'block',
                }}>
                  {n.categoria}
                </span>
                <p className="trending-title sidebar-text" style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: '#1a1a2e',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  transition: 'color 0.2s',
                }}>
                  {n.titulo}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
