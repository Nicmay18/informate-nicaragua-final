'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';
import { getCategory, SITE_CONFIG } from '@/lib/constants';
import { tiempoLectura, fmtViews, formatDateES, extractPoints } from '@/lib/formateo';
import { injectTocIds } from '@/lib/toc';
import { enhanceArticleHtml } from '@/lib/html';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import KeyPoints from './KeyPoints';
import ShareBar from './ShareBar';
import AuthorCard from './AuthorCard';
import NewsletterSignup from './NewsletterSignup';
import ReadingProgress from './ReadingProgress';
import type { Noticia } from '@/lib/types';

/* Lazy-load componentes pesados que no están en el viewport inicial */
const AudioButton = lazy(() => import('./AudioButton'));
const PullQuote = lazy(() => import('./PullQuote'));
const AdsenseUnit = lazy(() => import('./AdsenseUnit'));

/* ================================================================
   ARTICLE PAGE — ESTILOS INLINE COMPLETOS (sin Tailwind)
   ================================================================ */
interface ArticlePageProps {
  noticia: Noticia;
  related?: Noticia[];
}

export default function ArticlePage({ noticia, related = [] }: ArticlePageProps) {
  const FONT_STEPS = useMemo(() => [0.9, 1, 1.1, 1.2], []);
  const [fontIndex, setFontIndex] = useState(1); // índice 1 = tamaño normal (1em)
  const fontSize = FONT_STEPS[fontIndex];

  // Reset completo de estados locales cuando cambia el artículo (navegación SPA)
  useEffect(() => {
    setFontIndex(1);
  }, [noticia.id]);

  // Optimistic +1: muestra inmediatamente la vista del usuario actual
  const [views, setViews] = useState(() => (noticia.vistas || 0) + 1);

  useEffect(() => {
    setViews((noticia.vistas || 0) + 1);
  }, [noticia.id, noticia.vistas]);

  useEffect(() => {
    if (!noticia.slug) return;
    const controller = new AbortController();
    // CORREGIDO: usa el endpoint correcto /api/views/[slug] (no /api/view)
    fetch(`/api/views/${encodeURIComponent(noticia.slug)}`, {
      method: 'POST',
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return null;
        try {
          return await res.json();
        } catch {
          return null;
        }
      })
      .then((json) => {
        if (!controller.signal.aborted && json && typeof json.vistas === 'number') {
          setViews(json.vistas);
        }
      })
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [noticia.id, noticia.slug]);

  const category = getCategory(noticia.categoria);
  const url = `${SITE_CONFIG.url}/noticias/${noticia.slug}`;
  const lecturaMin = tiempoLectura(noticia.contenido || noticia.resumen || '');
  const vistas = fmtViews(views);
  const tags = useMemo(() => [noticia.categoria, ...extractPoints(noticia.titulo, 3)], [noticia.categoria, noticia.titulo]);
  const readAlso = related.slice(0, 3);

  const pieDeFoto = noticia.pieFoto?.trim()
    ? noticia.pieFoto
    : 'Foto: Nicaragua Informate / Archivo';

  // Procesar TOC para artículos largos y mejorar HTML (enlaces/imágenes)
  const { html: processedHtml, items: tocItems } = injectTocIds(noticia.contenido || '');
  const enhancedHtml = enhanceArticleHtml(processedHtml, SITE_CONFIG.url);
  const showToc = tocItems.length >= 3;

  // Container principal
  const containerStyle: React.CSSProperties = {
    maxWidth: 896,
    margin: '0 auto',
    padding: '24px 16px 64px',
  };

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 16px',
    fontSize: 14,
    color: '#6b7280',
    paddingBottom: 16,
    marginBottom: 24,
    borderBottom: '1px solid #e5e5e5',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    borderRadius: 9999,
    marginBottom: 12,
    backgroundColor: category.color,
  };

  const fontBtnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid #e5e5e5',
    backgroundColor: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#374151',
  };

  const imgContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    maxHeight: 480,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  };

  const captionStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 24,
    padding: '4px 8px',
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  };

  const contentStyle: React.CSSProperties = {
    fontSize: `${fontSize}em`,
    lineHeight: 1.8,
    color: '#374151',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: '#4b5563',
    backgroundColor: '#f3f4f6',
    borderRadius: 9999,
    textDecoration: 'none',
  };

  const navCardStyle: React.CSSProperties = {
    display: 'block',
    padding: 16,
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e5e5',
    borderRadius: 12,
    textDecoration: 'none',
    transition: 'border-color 0.2s',
  };

  const relatedCardStyle: React.CSSProperties = {
    display: 'block',
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
    textDecoration: 'none',
    transition: 'box-shadow 0.2s',
  };

  return (
    <div suppressHydrationWarning>
      <ReadingProgress />
      <ShareBar url={url} title={noticia.titulo} variant="floating" />

      <article style={containerStyle} itemScope itemType="https://schema.org/NewsArticle">
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280', marginBottom: 16 }} aria-label="Miga de pan">
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Inicio</Link>
          <span>/</span>
          <Link href={`/categoria/${category.slug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{category.name}</Link>
          <span>/</span>
          <span style={{ color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{noticia.titulo}</span>
        </nav>

        {/* Category Badge */}
        <span style={badgeStyle} itemProp="articleSection">{category.name}</span>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#111827', lineHeight: 1.2, margin: '0 0 16px' }} itemProp="headline">
          {noticia.titulo}
        </h1>

        {/* Resumen */}
        {noticia.resumen && (
          <p style={{ fontSize: 18, color: '#4b5563', lineHeight: 1.6, marginBottom: 24 }} itemProp="description">
            {noticia.resumen}
          </p>
        )}

        {/* Meta bar */}
        <div style={metaStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <time dateTime={noticia.fecha} itemProp="datePublished">{formatDateES(noticia.fecha)}</time>
            {noticia.fechaActualizacion && (
              <>
                <span style={{ color: '#9ca3af' }}>·</span>
                <time dateTime={noticia.fechaActualizacion} itemProp="dateModified" style={{ color: '#991b1b', fontWeight: 500 }}>
                  Actualizado {formatDateES(noticia.fechaActualizacion)}
                </time>
              </>
            )}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
            {lecturaMin} min de lectura
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            {vistas} vistas
          </span>
          <span style={{ color: '#991b1b', fontWeight: 600 }}>{formatDateES(noticia.fecha)}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button onClick={() => setFontIndex(i => Math.max(0, i - 1))} style={fontBtnStyle} aria-label="Reducir texto">A−</button>
            <button onClick={() => setFontIndex(i => Math.min(FONT_STEPS.length - 1, i + 1))} style={fontBtnStyle} aria-label="Aumentar texto">A+</button>
          </div>
        </div>

        {/* Imagen destacada — aspect-ratio 16:9 responsive, max 480px */}
        {noticia.imagen && (
          <figure style={imgContainerStyle} itemProp="image" itemScope itemType="https://schema.org/ImageObject">
            <meta itemProp="url" content={noticia.imagen} />
            <OptimizedImage
              src={noticia.imagen}
              alt={noticia.titulo}
              variant="hero"
              fill
              priority
              fetchPriority="high"
            />
            <figcaption style={captionStyle}>
              <span style={{ fontWeight: 500 }}>{pieDeFoto}</span>
              {noticia.pieFoto?.trim() && (
                <span style={{ color: '#9ca3af', marginLeft: 4 }}>| Nicaragua Informate</span>
              )}
            </figcaption>
          </figure>
        )}

        {/* Banner de calidad si el artículo está marcado para revisión editorial */}
        {(noticia as any).necesitaRevision === true && (
          <div style={{ margin: '16px 0', padding: '12px 16px', backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '0 8px 8px 0' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
              Este artículo está siendo revisado por nuestro equipo editorial para garantizar la calidad de la información.
            </p>
          </div>
        )}

        {/* Audio — lazy-loaded, no bloquea LCP */}
        <Suspense fallback={null}>
          <AudioButton articleId={noticia.id} titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} />
        </Suspense>

        {/* 3 Puntos Clave */}
        <KeyPoints titulo={noticia.titulo} resumen={noticia.resumen} contenido={noticia.contenido} categoria={noticia.categoria} />

        {/* Tabla de contenidos (artículos largos) */}
        {showToc && (
          <nav aria-label="Tabla de contenidos" style={{ margin: '24px 0', padding: '16px 20px', backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e5e5' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>En este artículo</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {tocItems.map((item) => (
                <li key={item.id} style={{ margin: '6px 0', paddingLeft: item.level === 3 ? 16 : 0 }}>
                  <a href={`#${item.id}`} style={{ fontSize: 14, color: '#374151', textDecoration: 'none', fontWeight: item.level === 2 ? 600 : 400 }}>
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Contenido — sanitizado antes de inyección para prevenir XSS */}
        <div className="article-body" style={contentStyle} itemProp="articleBody" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(enhancedHtml || noticia.resumen || '') }} />

        {/* In-article Ad — lazy-loaded para no afectar LCP */}
        <Suspense fallback={null}>
          <AdsenseUnit
            slot="2957454965"
            format="fluid"
            layout="in-article"
            style={{ margin: '32px 0' }}
          />
        </Suspense>

        {/* Pull Quote — lazy-loaded */}
        <Suspense fallback={null}>
          <PullQuote contenido={noticia.contenido || ''} />
        </Suspense>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
            {tags.map((tag, i) => (
              <Link key={i} href={`/buscar?q=${encodeURIComponent(tag)}`} style={tagStyle} rel="nofollow">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Donacion PayPal */}
        <div style={{ marginTop: 32, padding: '24px 20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1e40af', margin: '0 0 4px' }}>Apoyá nuestro periodismo</p>
          <p style={{ fontSize: 13, color: '#3b82f6', margin: '0 0 16px' }}>Tu aporte nos ayuda a mantener la cobertura informativa de Nicaragua.</p>
          <a
            href="https://paypal.me/NicaraguaInformate"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#fff',
              backgroundColor: '#0070ba',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: 15,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.63l-1.496 9.478h2.79c.457 0 .85-.334.922-.788l.04-.19.73-4.627.047-.255a.933.933 0 0 1 .922-.788h.58c3.76 0 6.705-1.528 7.565-5.946.025-.13.048-.26.066-.39a5.65 5.65 0 0 0-.04-1.722c-.01-.065-.02-.13-.032-.194a3.506 3.506 0 0 0-.108-.313z"/>
            </svg>
            Donar vía PayPal
          </a>
        </div>

        {/* Share */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e5e5' }}>
          <ShareBar url={url} title={noticia.titulo} variant="chips" />
        </div>

        {/* Author */}
        <div style={{ marginTop: 32 }}>
          <AuthorCard
            name={noticia.autor}
            photo={noticia.autorFoto}
            publishedDate={noticia.fecha}
            updatedDate={(noticia as any).fechaActualizacion}
          />
        </div>

        {/* Newsletter */}
        <div style={{ marginTop: 32, padding: '24px 20px', background: 'var(--bg-secondary, #f9fafb)', borderRadius: 12, border: '1px solid var(--border, #e5e7eb)' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>📰 Recibe noticias en tu correo</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>Resumen diario de las noticias más importantes de Nicaragua.</p>
          <NewsletterSignup />
        </div>

        {/* Navegación */}
        {readAlso.length > 0 && (
          <nav style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {readAlso[0] && (
              <Link href={`/noticias/${readAlso[0].slug}`} style={navCardStyle} legacyBehavior>
                <a style={navCardStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
                    Anterior
                  </span>
                  <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: 15, lineHeight: 1.4 }}>{readAlso[0].titulo}</p>
                </a>
              </Link>
            )}
            {readAlso[1] && (
              <Link href={`/noticias/${readAlso[1].slug}`} style={{ ...navCardStyle, textAlign: 'right' }} legacyBehavior>
                <a style={{ ...navCardStyle, textAlign: 'right' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }}>
                    Siguiente
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>
                  </span>
                  <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: 15, lineHeight: 1.4 }}>{readAlso[1].titulo}</p>
                </a>
              </Link>
            )}
          </nav>
        )}

        {/* Volver al inicio */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = '#e5e7eb'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = '#f3f4f6'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            Volver al inicio
          </a>
        </div>

        {/* Multiplex Ad — lazy-loaded para no bloquear LCP */}
        <Suspense fallback={null}>
          <AdsenseUnit
            slot="7942423751"
            format="autorelaxed"
            style={{ margin: '40px 0 0' }}
          />
        </Suspense>

        {/* Related News */}
        {related.length > 3 && (
          <section style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Lea también</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {related.slice(3, 6).map(item => (
                <Link key={item.slug} href={`/noticias/${item.slug}`} style={relatedCardStyle}>
                  {item.imagen && (
                    <div style={{ position: 'relative', width: '100%', height: 180, backgroundColor: '#f3f4f6' }}>
                      <OptimizedImage src={item.imagen} alt={item.titulo} variant="card" fill priority={false} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#991b1b' }}>{item.categoria}</span>
                    <h3 style={{ margin: '4px 0 0', fontWeight: 600, color: '#111827', fontSize: 15, lineHeight: 1.4 }}>{item.titulo}</h3>
                    <time style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, display: 'block' }} dateTime={item.fecha}>{formatDateES(item.fecha)}</time>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comments — placeholder sin funcionalidad para evitar confusión */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Comentarios</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Los comentarios estarán disponibles próximamente.</p>
        </section>

      </article>
    </div>
  );
}
