import Link from 'next/link';
import OptimizedImage from './OptimizedImage';
import { getCategory } from '@/lib/constants';
import { formatDateES } from '@/lib/formateo';
import type { Noticia } from '@/lib/types';

interface NoticiasListProps {
  noticias: Noticia[];
}

/**
 * Listado editorial denso para /noticias: imagen, categoría, título,
 * bajada y fecha por cada artículo. Sin hero ni secciones de portada.
 */
export default function NoticiasList({ noticias }: NoticiasListProps) {
  if (!noticias.length) {
    return (
      <p style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px', color: '#64748b', fontSize: 15 }}>
        No hay noticias disponibles en este momento.
      </p>
    );
  }

  return (
    <section
      aria-label="Listado de noticias"
      style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 20px 24px' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {noticias.map((n) => {
          const cat = getCategory(n.categoria);
          return (
            <Link
              key={n.slug}
              href={`/noticias/${n.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                overflow: 'hidden',
                textDecoration: 'none',
              }}
            >
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#f3f4f6' }}>
                {n.imagen ? (
                  <OptimizedImage src={n.imagen} alt={n.titulo} variant="card" fill priority={false} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📰</div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    background: cat.color,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {cat.name}
                </span>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <h2 style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 15.5, lineHeight: 1.4 }}>
                  {n.titulo}
                </h2>
                {n.resumen && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#4b5563',
                      lineHeight: 1.55,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {n.resumen}
                  </p>
                )}
                <time
                  style={{ fontSize: 11, color: '#9ca3af', marginTop: 'auto', display: 'block' }}
                  dateTime={n.fecha}
                >
                  {formatDateES(n.fecha)}
                </time>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
