'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Flag, Trophy, Globe, Star, Cpu, Newspaper, ArrowDown, Clock } from 'lucide-react';
import { FALLBACK_IMAGE, type Noticia } from '@/lib/types';
import { formatDateShortES } from '@/lib/formateo';
import { getResponsiveImageUrl } from '@/lib/image-utils';

function ArticleImage({ src, alt }: { src: string; alt: string }) {
  const validSrc = src?.trim();
  const isValid = validSrc && (validSrc.startsWith('http') || validSrc.startsWith('/') || validSrc.startsWith('data:'));
  const imgSrc = isValid ? getResponsiveImageUrl(validSrc, 800, 450) : FALLBACK_IMAGE;
  const [error, setError] = useState(false);
  const finalSrc = error ? FALLBACK_IMAGE : imgSrc;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={finalSrc} alt={alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setError(true)} />
  );
}

const CAT_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  Sucesos: { color: '#DC2626', icon: <AlertTriangle size={12} /> },
  Nacionales: { color: '#1E40AF', icon: <Flag size={12} /> },
  Deportes: { color: '#D97706', icon: <Trophy size={12} /> },
  Internacionales: { color: '#059669', icon: <Globe size={12} /> },
  Espectáculos: { color: '#EC4899', icon: <Star size={12} /> },
  Tecnología: { color: '#7C3AED', icon: <Cpu size={12} /> },
  General: { color: '#64748B', icon: <Newspaper size={12} /> },
};

const CATS = ['Todas', 'Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos', 'Tecnología'];
const PAGE_SIZE = 12;

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
      <div className="ni-section-header">
        <h2 className="ni-section-title">
          <span className="ni-section-accent" />
          Últimas Noticias
        </h2>
        <span className="ni-section-count">{filtered.length} artículos</span>
      </div>

      {/* Filter Pills */}
      <div className="ni-filter-scroll">
        {CATS.map(c => {
          const active = c === activeCat;
          const cfg = CAT_CONFIG[c] || CAT_CONFIG.General;
          return (
            <button
              key={c}
              onClick={() => switchCat(c)}
              className={`ni-filter-pill${active ? ' active' : ''}`}
            >
              {c !== 'Todas' && <span style={{ color: active ? '#fff' : cfg.color }}>{cfg.icon}</span>}
              {c}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="ni-empty-state">
          <Newspaper size={40} />
          <div className="ni-empty-title">Sin publicaciones por el momento</div>
          <div className="ni-empty-desc">Actualizaremos esta sección en cuanto haya nueva información.</div>
        </div>
      ) : (
        <div className="ni-news-grid">
          {shown.map((n, i) => (
            <Link
              key={n.id}
              href={`/noticias/${n.slug}`}
              className="ni-news-card"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="ni-news-card-img">
                <ArticleImage src={n.imagen} alt={n.titulo} />
                <span
                  className="ni-news-card-cat"
                  style={{ background: CAT_CONFIG[n.categoria]?.color || '#64748B' }}
                >
                  {n.categoria}
                </span>
              </div>
              <div className="ni-news-card-body">
                <div className="ni-news-card-meta">
                  <span className="ni-news-card-catname">{n.categoria}</span>
                  <span className="ni-news-card-dot" />
                  <span className="ni-news-card-time">
                    <Clock size={12} />
                    {timeAgo(n.fecha)}
                  </span>
                  {readTime(n.titulo, n.resumen) > 2 && (
                    <>
                      <span className="ni-news-card-dot" />
                      <span>{readTime(n.titulo, n.resumen)} min</span>
                    </>
                  )}
                </div>
                <h3 className="ni-news-card-title">{n.titulo}</h3>
                {n.resumen && <p className="ni-news-card-excerpt">{n.resumen}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      <div className="flex gap-3 mt-8 justify-center">
        {hasMore && (
          <button onClick={() => setPage(p => p + 1)} className="ni-btn-outline">
            <ArrowDown size={14} />
            Cargar más
          </button>
        )}
        <Link href={activeCat === 'Todas' ? '/noticias' : `/noticias?cat=${encodeURIComponent(activeCat)}`} className="ni-btn-primary">
          <Newspaper size={14} />
          {activeCat === 'Todas' ? 'Ver todas' : `Ver: ${activeCat}`}
        </Link>
      </div>
    </div>
  );
}
