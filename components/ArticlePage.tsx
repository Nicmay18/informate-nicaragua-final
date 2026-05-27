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
            <div className="article-hero-meta">
              {noticia.autor && <span><User size={14} /> {noticia.autor}</span>}
              <span><Calendar size={14} /> <time dateTime={noticia.fecha}>{formatDate(noticia.fecha)}</time></span>
              <span><Clock size={14} /> {timeAgo(noticia.fecha)}</span>
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

          {/* Autor real */}
          <div className="article-author">
            <img
              src="/keyling-rivera.jpg"
              alt="Keyling Rivera M. - Directora Editorial"
              className="article-author-avatar"
            />
            <div className="article-author-info">
              <div className="article-author-name">Keyling Rivera M.</div>
              <div className="article-author-role">Directora Editorial</div>
              <p className="article-author-bio">
                Periodista de Nicaragua Informate. Especializada en cobertura nacional e internacional.
                Comprometida con el periodismo verificado y la información de calidad para nicaragüenses.
              </p>
              <div className="article-author-social">
                <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
                <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">W</a>
                <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" aria-label="Telegram">T</a>
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
