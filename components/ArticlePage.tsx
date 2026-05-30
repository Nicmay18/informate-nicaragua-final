'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User } from 'lucide-react';
import ShareBar from './ShareBar';
import Sidebar from './Sidebar';
import type { Noticia } from '@/lib/types';

interface ArticlePageProps {
  noticia: Noticia;
  relatedNews?: Noticia[];
  trendingNews?: Noticia[];
}

function formatDate(date: string) {
  try {
    const d = new Date(date);
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  } catch { return date; }
}

function timeAgo(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  } catch { return date; }
}

export default function ArticlePage({ noticia, relatedNews = [], trendingNews = [] }: ArticlePageProps) {
  const fullUrl = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

  const renderContent = () => {
    if (!noticia.contenido) return null;
    if (typeof noticia.contenido === 'string') {
      return <div className="article-body" dangerouslySetInnerHTML={{ __html: noticia.contenido }} />;
    }
    return <p className="article-body">{noticia.contenido}</p>;
  };

  // Parsear puntos clave del resumen si vienen con numeración
  const puntosClave = noticia.resumen
    ? noticia.resumen.split(/\n|•/).filter(s => s.trim().length > 10).slice(0, 3)
    : [];

  return (
    <article className="article-page">
      {/* Breadcrumb grande */}
      <nav className="article-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="breadcrumb-link">Inicio</Link>
        <span className="breadcrumb-sep">/</span>
        {noticia.categoria && (
          <>
            <Link href={`/categoria/${noticia.categoria.toLowerCase()}`} className="breadcrumb-link">{noticia.categoria}</Link>
            <span className="breadcrumb-sep">/</span>
          </>
        )}
        <span className="breadcrumb-current">{noticia.titulo.slice(0, 40)}…</span>
      </nav>

      {/* Hero con imagen + overlay oscuro + texto blanco */}
      {noticia.imagen && (
        <div className="article-hero">
          <Image
            src={noticia.imagen}
            alt={noticia.titulo}
            fill
            priority
            className="article-hero-img"
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />
          <div className="article-hero-overlay" />
          <div className="article-hero-content">
            {noticia.categoria && <span className="article-hero-badge">{noticia.categoria}</span>}
            <h1 className="article-hero-title">{noticia.titulo}</h1>
            <div className="article-hero-meta" style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              gap: '6px 14px', marginTop: 12
            }}>
              {noticia.autor && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap' }}>
                  <User size={14} /> {noticia.autor}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap' }}>
                <Calendar size={14} /> <time dateTime={noticia.fecha}>{formatDate(noticia.fecha)}</time>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap' }}>
                <Clock size={14} /> {timeAgo(noticia.fecha)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Layout principal */}
      <div className="article-layout">
        <div className="article-main">
          {/* Puntos clave grandes */}
          {puntosClave.length > 0 && (
            <div className="article-summary">
              <h2 className="article-summary-title">En {puntosClave.length} puntos clave</h2>
              <ol className="article-summary-list">
                {puntosClave.map((punto, i) => (
                  <li key={i} className="article-summary-item">
                    <span className="article-summary-num">{i + 1}</span>
                    <p>{punto.trim()}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Contenido */}
          <div className="article-content-wrapper">
            {renderContent()}
          </div>

          {/* Share */}
          <ShareBar title={noticia.titulo} url={fullUrl} />

          {/* Tags */}
          {noticia.tags && noticia.tags.length > 0 && (
            <div className="article-tags">
              <h3>Etiquetas</h3>
              <div className="tags-row">
                {noticia.tags.map((tag) => (
                  <Link key={tag} href={`/noticias?tag=${encodeURIComponent(tag)}`} className="tag-pill">{tag}</Link>
                ))}
              </div>
            </div>
          )}

          {/* Autor — CORREGIDO RESPONSIVE */}
          <div className="article-author" style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '12px 16px',
            padding: '20px', background: 'var(--bg-secondary, #f9fafb)', borderRadius: 12,
            border: '1px solid var(--border, #e5e7eb)'
          }}>
            <Link href="/autor/keyling-eliet-rivera-munoz" rel="author">
              <Image
                src="/keyling-rivera.jpg"
                alt="Keyling Elieth Rivera Muñoz - Directora Editorial"
                width={60}
                height={60}
                className="article-author-avatar"
                style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            </Link>
            <div className="article-author-info" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <Link href="/autor/keyling-eliet-rivera-munoz" rel="author" style={{ textDecoration: 'none' }}>
                <div className="article-author-name" style={{
                  fontSize: 16, fontWeight: 700, color: 'var(--text, #111)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {noticia.autor || 'Keyling Elieth Rivera Muñoz'}
                </div>
              </Link>
              <div className="article-author-role" style={{
                fontSize: 13, color: 'var(--accent, #8c1d18)', fontWeight: 600,
                marginTop: 2
              }}>
                Directora Editorial — Nicaragua Informate
              </div>
              <p className="article-author-bio" style={{
                fontSize: 13, color: 'var(--text-secondary, #6b7280)',
                lineHeight: 1.6, marginTop: 8, marginBottom: 0
              }}>
                Periodista de Nicaragua Informate. Especializada en cobertura nacional e internacional.
                Comprometida con el periodismo verificado y la información de calidad para nicaragüenses.
              </p>
              <div className="article-author-social" style={{
                display: 'flex', gap: 10, marginTop: 12
              }}>
                <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#1877f2',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none'
                }}>f</a>
                <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#128c7e',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none'
                }}>W</a>
                <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" aria-label="Telegram" style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#0066aa',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none'
                }}>T</a>
              </div>
            </div>
          </div>

          {/* Noticias relacionadas limpias */}
          {relatedNews.length > 0 && (
            <section className="article-related">
              <h2 className="article-related-title">Noticias relacionadas</h2>
              <div className="article-related-grid">
                {relatedNews.slice(0, 3).map((news) => (
                  <Link href={`/noticias/${news.slug}`} key={news.id} className="related-card">
                    {news.imagen && (
                      <div className="related-card-image">
                        <Image src={news.imagen} alt={news.titulo} fill sizes="300px" style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                    <div className="related-card-body">
                      <span className="related-card-category">{news.categoria}</span>
                      <h4 className="related-card-title">{news.titulo}</h4>
                      <time className="related-card-date" dateTime={news.fecha} suppressHydrationWarning>{timeAgo(news.fecha)}</time>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="article-sidebar">
          <Sidebar trendingNews={trendingNews} />
        </aside>
      </div>
    </article>
  );
}
