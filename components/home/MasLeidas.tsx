import Link from 'next/link';
import type { Noticia } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

export default function MasLeidas({ noticias }: { noticias: Noticia[] }) {
  if (!noticias.length) return null;

  return (
    <div style={{ background: '#faf9f7', borderRadius: 8, padding: 20, marginBottom: 24, border: '1px solid #f0f0f4' }}>
      {/* Widget Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #1a1a2e' }}>
        <i className="fas fa-fire" style={{ color: '#c41e3a', fontSize: 14 }} />
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 900, color: '#1a1a2e', margin: 0 }}>Más Leídas</h3>
      </div>

      <style>{`
        .masleidas-link { display: flex; gap: 12px; padding: 12px 0; text-decoration: none; color: inherit; transition: all 0.2s; border-bottom: 1px solid #f0f0f4; }
        .masleidas-link:last-child { border-bottom: none; }
        .masleidas-link:hover { padding-left: 8px; }
        .masleidas-link:hover .masleidas-rank { color: #c41e3a; }
        .masleidas-link:hover .masleidas-title { color: #c41e3a; }
      `}</style>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {noticias.map((n, i) => (
          <li key={n.id}>
            <Link
              href={`/noticias/${n.slug}`}
              className="masleidas-link"
            >
              <span className="masleidas-rank" style={{
                fontSize: 24,
                fontWeight: 900,
                color: i === 0 ? '#c41e3a' : '#e8e8ec',
                lineHeight: 1,
                minWidth: 28,
                fontFamily: 'Georgia, serif',
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
                <p className="masleidas-title" style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: '#1a1a2e',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
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
