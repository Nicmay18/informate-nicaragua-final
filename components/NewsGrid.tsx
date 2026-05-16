'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Flag, Trophy, Globe, Star, Cpu, Newspaper, ArrowDown } from 'lucide-react';
import { FALLBACK_IMAGE, type Noticia } from '@/lib/types';
import { formatDateShortES } from '@/lib/formateo';
import { getResponsiveImageUrl } from '@/lib/image-utils';
import LazySection from '@/components/LazySection';

function ArticleImage({ src, alt }: { src: string; alt: string }) {
  const validSrc = src?.trim();
  const isValid = validSrc && (validSrc.startsWith('http') || validSrc.startsWith('/') || validSrc.startsWith('data:'));
  const imgSrc = isValid ? getResponsiveImageUrl(validSrc, 200, 150) : FALLBACK_IMAGE;
  const [error, setError] = useState(false);
  const finalSrc = error ? FALLBACK_IMAGE : imgSrc;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={finalSrc}
      alt={alt}
      width={200}
      height={150}
      loading="lazy"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setError(true)}
    />
  );
}

const CAT_COLORS: Record<string, string> = {
  Sucesos: '#991b1b', Nacionales: '#1e3a8a', Deportes: '#166534',
  Internacionales: '#0c4a6e', 'Espectáculos': '#db2777', 'Tecnología': '#0ea5e9', General: '#374151',
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  Sucesos: <AlertTriangle size={10} />, Nacionales: <Flag size={10} />,
  Deportes: <Trophy size={10} />, Internacionales: <Globe size={10} />, 'Espectáculos': <Star size={10} />,
  'Tecnología': <Cpu size={10} />,
};

const CATS = ['Todas', 'Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'];
const PAGE_SIZE = 15;

function readTime(titulo: string, resumen: string): number {
  return Math.max(1, Math.ceil((titulo + ' ' + resumen).split(/\s+/).length / 180));
}

function timeAgo(iso: string): string {
  return iso ? formatDateShortES(iso) : '';
}

export default function NewsGrid({ noticias, showAll = false }: { noticias: Noticia[]; showAll?: boolean }) {
  const [activeCat, setActiveCat] = useState('Todas');
  const [page, setPage] = useState(1);

  const filtered = activeCat === 'Todas' ? noticias : noticias.filter(n => n.categoria === activeCat);
  const shown = showAll ? filtered : filtered.slice(0, page * PAGE_SIZE);
  const hasMore = !showAll && shown.length < filtered.length;

  function switchCat(c: string) { setActiveCat(c); setPage(1); }

  return (
    <div>
      {/* Section Header */}
      <div className="ng-section-header">
        <h2 className="ng-section-title">
          <span style={{ width: 4, height: 24, background: '#c41e3a', borderRadius: 2, display: 'inline-block' }} />
          Últimas Noticias
        </h2>
        <span className="ng-count">{filtered.length} artículos</span>
        <span className="ng-count" style={{ fontSize: 13, color: '#595959', fontWeight: 500 }}>{filtered.length} artículos</span>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: 4,
      }}>
        {CATS.map(c => {
          const active = c === activeCat;
          return (
            <button
              key={c}
              onClick={() => switchCat(c)}
              className={`ng-cat-btn${active ? ' active' : ''}`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {c !== 'Todas' && <span style={{ marginRight: 5 }}>{CAT_ICONS[c] || <Newspaper size={10} />}</span>}
              {c}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: '#8a8a9e' }}>
          <Newspaper size={34} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Sin publicaciones por el momento</div>
          <div style={{ fontSize: 14 }}>Actualizaremos esta sección en cuanto haya nueva información.</div>
        </div>
      ) : (
        <div className="news-list">
          {/* Primeras 3 noticias — siempre visibles */}
          {shown.slice(0, 3).map(n => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="ng-card" data-debug-imagen={n.imagen}>
              <div className="ng-thumb">
                <ArticleImage src={n.imagen} alt={n.titulo} />
                <span className="category-badge" style={{ background: CAT_COLORS[n.categoria] || '#1e293b', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.02em', position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                  {n.categoria}
                </span>
              </div>

              <div className="ng-content">
                <div className="ng-meta">
                  <span className="category">{n.categoria}</span>
                  <span>{timeAgo(n.fecha)}</span>
                  {readTime(n.titulo, n.resumen) > 2 && (
                    <span>{readTime(n.titulo, n.resumen)} min lectura</span>
                  )}
                </div>
                <h3 className="ng-title">{n.titulo}</h3>
                {n.resumen && (
                  <p className="ng-excerpt">{n.resumen}</p>
                )}
              </div>
            </Link>
          ))}

          {/* Resto — lazy render vía IntersectionObserver */}
          {shown.length > 3 && (
            <LazySection id="news-rest" minHeight="600px" rootMargin="100px">
              {shown.slice(3).map(n => (
                <Link key={n.id} href={`/noticias/${n.slug}`} className="ng-card" data-debug-imagen={n.imagen}>
                  <div className="ng-thumb">
                    <ArticleImage src={n.imagen} alt={n.titulo} />
                    <span className="category-badge" style={{ background: CAT_COLORS[n.categoria] || '#1e293b', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.02em', position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                      {n.categoria}
                    </span>
                  </div>

                  <div className="ng-content">
                    <div className="ng-meta">
                      <span className="category">{n.categoria}</span>
                      <span>{timeAgo(n.fecha)}</span>
                      {readTime(n.titulo, n.resumen) > 2 && (
                        <span>{readTime(n.titulo, n.resumen)} min lectura</span>
                      )}
                    </div>
                    <h3 className="ng-title">{n.titulo}</h3>
                    {n.resumen && (
                      <p className="ng-excerpt">{n.resumen}</p>
                    )}
                  </div>
                </Link>
              ))}
            </LazySection>
          )}
        </div>
      )}

      {/* Load More */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
        {hasMore && (
          <button onClick={() => setPage(p => p + 1)} className="ng-load-btn">
            <ArrowDown size={14} style={{ marginRight: 8 }} />
            Cargar más
          </button>
        )}
        <Link href={activeCat === 'Todas' ? '/noticias' : `/noticias?cat=${encodeURIComponent(activeCat)}`}
          style={{ padding: '12px 28px', color: '#fff', background: '#c41e3a', borderRadius: 4, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#a01830'}
          onMouseLeave={e => e.currentTarget.style.background = '#c41e3a'}>
          <Newspaper size={14} />
          {activeCat === 'Todas' ? 'Ver todas' : `Ver: ${activeCat}`}
        </Link>
      </div>
    </div>
  );
}
