// File: components/ArticlePage.tsx
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import ShareBar from './ShareBar';
import AuthorBox from './AuthorBox';
import Sidebar from './Sidebar';
import type { Noticia } from '@/lib/types';

interface ArticlePageProps {
  noticia: Noticia;
  relatedNews?: Noticia[];
  trendingNews?: Noticia[];
}

export default function ArticlePage({
  noticia,
  relatedNews = [],
  trendingNews = [],
}: ArticlePageProps) {
  const timeAgo = formatDistanceToNow(new Date(noticia.fecha || Date.now()), {
    addSuffix: true,
    locale: es,
  });

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/noticias/${noticia.slug}`
    : `https://nicaraguainformate.com/noticias/${noticia.slug}`;

  // Procesar contenido HTML
  const renderContent = () => {
    if (!noticia.contenido) return null;

    // Si es HTML puro, renderizarlo con precaución
    if (typeof noticia.contenido === 'string') {
      return (
        <div
          style={{
            fontSize: '16px',
            lineHeight: 1.8,
            color: 'var(--text)',
          }}
          dangerouslySetInnerHTML={{ __html: noticia.contenido }}
        />
      );
    }

    return <p style={{ fontSize: '16px', lineHeight: 1.8 }}>{noticia.contenido}</p>;
  };

  return (
    <article style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumb y volver */}
      <div style={{ padding: 'var(--spacing-lg) 0' }} className="container">
        <Link
          href="/noticias"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Volver a noticias
        </Link>
      </div>

      {/* Header del artículo */}
      <div className="container" style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            {noticia.categoria && (
              <>
                <span className="hero-category" style={{ margin: 0 }}>
                  {noticia.categoria}
                </span>
              </>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 7vw, 48px)', marginBottom: 'var(--spacing-lg)' }}>
            {noticia.titulo}
          </h1>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-lg)',
            paddingBottom: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--border)',
          }}>
            {noticia.autor && <span>{noticia.autor}</span>}
            {noticia.autor && <span>•</span>}
            <span>{timeAgo}</span>
            {noticia.fechaActualizacion && (
              <>
                <span>•</span>
                <span>
                  Actualizado {formatDistanceToNow(new Date(noticia.fechaActualizacion), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="main-grid container" style={{ marginBottom: 'var(--spacing-3xl)', flex: 1 }}>
        {/* Columna principal */}
        <div style={{ minWidth: 0 }}>
          {/* Imagen hero */}
          {noticia.imagen && (
            <div style={{ position: 'relative', width: '100%', height: '300px', marginBottom: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <Image
                src={noticia.imagen}
                alt={noticia.titulo}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 70vw, 860px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Descripción */}
          {noticia.resumen && (
            <div style={{
              fontSize: '18px',
              fontWeight: 500,
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-xl)',
              fontStyle: 'italic',
              padding: 'var(--spacing-lg)',
              background: 'var(--bg)',
              borderLeft: '4px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
            }}>
              {noticia.resumen}
            </div>
          )}

          {/* Contenido */}
          <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
            {renderContent()}
          </div>

          {/* Share bar */}
          <ShareBar title={noticia.titulo} url={fullUrl} />

          {/* Tags */}
          {noticia.tags && noticia.tags.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 'var(--spacing-md)',
              }}>
                Etiquetas
              </h3>
              <div className="tags-container">
                {noticia.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/noticias?tag=${encodeURIComponent(tag)}`}
                    className="tag"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author Box */}
          {noticia.autor && (
            <AuthorBox
              autor={noticia.autor}
              autorBio={undefined}
              autorAvatar={undefined}
              autorEmail={undefined}
              autorTwitter={undefined}
              autorFacebook={undefined}
            />
          )}

          {/* Related News */}
          {relatedNews.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-3xl)' }}>
              <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: 'var(--spacing-lg)' }}>
                Noticias relacionadas
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--spacing-lg)',
              }}>
                {relatedNews.slice(0, 3).map((news) => (
                  <Link
                    key={news.id}
                    href={`/noticias/${news.slug}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      transition: 'all var(--transition-base)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {news.imagen && (
                      <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                        <Image
                          src={news.imagen}
                          alt={news.titulo}
                          fill
                          sizes="(max-width: 640px) 100vw, 300px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div style={{ padding: 'var(--spacing-md)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', lineHeight: 1.4 }}>
                        {news.titulo}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {news.categoria}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar trendingNews={trendingNews} />
      </div>
    </article>
  );
}
