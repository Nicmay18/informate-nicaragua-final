'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';
import { getCategory, SITE_CONFIG } from '@/lib/constants';
import { tiempoLectura, fmtViews, formatDateES, extractPoints } from '@/lib/formateo';
import { getResponsiveImageUrl } from '@/lib/image-utils';
import { injectTocIds } from '@/lib/toc';
import { enhanceArticleHtml } from '@/lib/html';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { injectInternalLinks } from '@/lib/article-links';
import { trackViewAction } from '@/app/actions/track-view';
import KeyPoints from './KeyPoints';
import ShareBar from './ShareBar';
import AuthorCard from './AuthorCard';
import NewsletterSignup from './NewsletterSignup';
import ReadingProgress from './ReadingProgress';
import ArticleFaq from './ArticleFaq';
import SupportMedium from './editorial/SupportMedium';
import type { Noticia } from '@/lib/types';
import { AUTHORS } from '@/lib/authors';
import '@/app/article-page.css';

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

  // ============================================================
  // TRACKING DE VISTAS: Server Action (sin Firestore client)
  // ============================================================
  useEffect(() => {
    if (!noticia.slug) return;

    const sessionKey = `viewed_${noticia.slug}`;
    const alreadyViewed = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : 'true';
    if (alreadyViewed) return;

    const trackView = async () => {
      try {
        const referrer = typeof document !== 'undefined' ? document.referrer : '';
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const utmSource = urlParams?.get('utm_source') || '';
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const result = await trackViewAction(noticia.slug, referrer, utmSource, userAgent);
        if (result.ok && typeof result.views === 'number') {
          setViews(result.views);
          sessionStorage.setItem(sessionKey, 'true');
        }
      } catch (err) {
        console.error('[views] Tracking failed:', err instanceof Error ? err.message : String(err));
      }
    };

    trackView();
  }, [noticia.id, noticia.slug]);

  const category = getCategory(noticia.categoria);
  const url = `${SITE_CONFIG.url}/noticias/${noticia.slug}`;


  const lecturaMin = tiempoLectura(noticia.contenido || noticia.resumen || '');
  const vistas = fmtViews(views);
  const tags = useMemo(() => [noticia.categoria, ...extractPoints(noticia.titulo, 3)], [noticia.categoria, noticia.titulo]);

  const wordCount = useMemo(() => {
    const text = (noticia.contenido || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').filter(w => w.length > 0).length : 0;
  }, [noticia.contenido]);

  const autorData = useMemo(
    () => Object.values(AUTHORS).find((a) => a.name === noticia.autor?.trim()),
    [noticia.autor]
  );
  const rawAuthorPhoto = autorData?.photo || noticia.autorFoto;
  const authorPhoto = rawAuthorPhoto && !rawAuthorPhoto.toLowerCase().includes('logo') ? rawAuthorPhoto : undefined;

  const pieDeFoto = noticia.pieFoto?.trim()
    ? noticia.pieFoto
    : 'Foto: Nicaragua Informate / Archivo';

  // Procesar TOC para artículos largos y mejorar HTML (enlaces/imágenes)
  const { html: processedHtml, items: tocItems } = injectTocIds(noticia.contenido || '');
  const enhancedHtml = enhanceArticleHtml(processedHtml, SITE_CONFIG.url);
  const showToc = tocItems.length >= 3;

  // Container principal (estilos en article-page.css)

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px 22px',
    fontSize: 13.5,
    color: '#64748b',
    padding: '16px 0',
    marginBottom: 30,
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '5px 14px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#fff',
    borderRadius: 9999,
    marginBottom: 12,
    backgroundColor: category.color,
  };

  const fontBtnStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 7,
    border: 'none',
    backgroundColor: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s, color 0.15s',
  };

  // Imagen destacada (estilos en article-page.css)

  const captionStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: 12,
    color: '#fff',
    textAlign: 'right',
    marginTop: -38,
    marginBottom: 28,
    padding: '12px 16px',
    background: 'linear-gradient(transparent, rgba(15,23,42,0.88))',
    borderRadius: '0 0 14px 14px',
    zIndex: 2,
  };

  const contentStyle: React.CSSProperties = {
    fontFamily: "'Merriweather', serif",
    fontSize: `${fontSize}em`,
    lineHeight: 1.85,
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

  return (
    <div suppressHydrationWarning>
      <ReadingProgress />
      <ShareBar url={url} title={noticia.titulo} variant="floating" />


      <article className="article-page" itemScope itemType="https://schema.org/NewsArticle">
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280', marginBottom: 16 }} aria-label="Miga de pan">
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Inicio</Link>
          <span>/</span>
          <Link href={`/categoria/${category.slug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{category.name}</Link>
          <span>/</span>
          <span style={{ color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{noticia.titulo}</span>
        </nav>

        <header>
          {/* Category Badge */}
        <span style={badgeStyle} itemProp="articleSection">{category.name}</span>

        {/* Title */}
        <h1 className="article-headline" style={{ fontFamily: "'Merriweather', serif", fontSize: 'clamp(1.85rem, 5.2vw, 3.2rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.16, margin: '0 0 20px', textWrap: 'balance', letterSpacing: '-0.3px' }} itemProp="headline">
          {noticia.titulo}
        </h1>

        {/* Resumen / Lead con acento editorial */}
        {noticia.resumen && (
          <p style={{ fontFamily: "'Merriweather', serif", fontSize: 20, color: '#334155', lineHeight: 1.6, marginBottom: 28, paddingLeft: 20, borderLeft: `4px solid ${category.color}`, fontWeight: 500 }} itemProp="description">
            {noticia.resumen}
          </p>
        )}

        {/* Byline de autor profesional */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          {authorPhoto ? (
            <img src={authorPhoto} alt={noticia.autor || 'Redacción'} width={42} height={42} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top center', border: `2px solid ${category.color}` }} />
          ) : (
            <span style={{ width: 42, height: 42, borderRadius: '50%', background: category.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {(noticia.autor || 'R').trim().charAt(0).toUpperCase()}
            </span>
          )}
          <div style={{ lineHeight: 1.3 }}>
            {autorData?.slug ? (
              <Link href={`/autor/${autorData.slug}`} rel="author" style={{ fontSize: 14.5, fontWeight: 700, color: '#1e293b', textDecoration: 'none' }}>
                {noticia.autor || 'Redacción Nicaragua Informate'}
              </Link>
            ) : (
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1e293b' }}>{noticia.autor || 'Redacción Nicaragua Informate'}</div>
            )}
            <div style={{ fontSize: 12.5, color: '#94a3b8' }}>{autorData?.role || 'Redacción'} · {category.name}</div>
          </div>
        </div>

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
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Texto</span>
            <div style={{ display: 'flex', gap: 2, padding: 3, background: '#f1f5f9', borderRadius: 9 }}>
              <button onClick={() => setFontIndex(i => Math.max(0, i - 1))} style={fontBtnStyle} aria-label="Reducir tamaño del texto" disabled={fontIndex === 0}>A−</button>
              <button onClick={() => setFontIndex(i => Math.min(FONT_STEPS.length - 1, i + 1))} style={{ ...fontBtnStyle, fontSize: 17 }} aria-label="Aumentar tamaño del texto" disabled={fontIndex === FONT_STEPS.length - 1}>A+</button>
            </div>
          </div>
        </div>
        </header>

        {/* AdSense 728x90 — debajo del título, lazy-loaded */}
        <Suspense fallback={null}>
          <AdsenseUnit
            slot="3827619433"
            format="horizontal"
            responsive={true}
            minHeight={90}
            style={{ margin: '0 0 24px', maxWidth: 728, marginLeft: 'auto', marginRight: 'auto' }}
          />
        </Suspense>

        {/* Imagen destacada — aspect-ratio 16:9 responsive, max 480px */}
        {noticia.imagen && (
          <figure style={{ margin: 0, marginBottom: 8 }} itemProp="image" itemScope itemType="https://schema.org/ImageObject">
            <div className="article-hero-img">
              <meta itemProp="url" content={noticia.imagen} />
              <OptimizedImage
                src={getResponsiveImageUrl(noticia.imagen)}
                alt={noticia.titulo}
                variant="hero"
                priority={true}
                fill
                fetchPriority="high"
              />
            </div>
            <figcaption style={captionStyle}>
              <span style={{ fontWeight: 500 }}>{pieDeFoto}</span>
              {noticia.pieFoto?.trim() && (
                <span style={{ color: '#9ca3af', marginLeft: 4 }}>| Nicaragua Informate</span>
              )}
            </figcaption>
          </figure>
        )}

        <section>
        {/* Banner de calidad si el artículo está marcado para revisión editorial */}
        {(noticia as any).necesitaRevision === true && (
          <div style={{ margin: '16px 0', padding: '12px 16px', backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '0 8px 8px 0' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
              Este artículo está siendo revisado por nuestro equipo editorial para garantizar la calidad de la información.
            </p>
          </div>
        )}

        {/* Fuentes declaradas */}
        {(noticia.fuente || (noticia.fuentesComplementarias && noticia.fuentesComplementarias.length > 0)) && (
          <div
            style={{
              margin: '28px 0',
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Fuentes
            </h3>
            {noticia.fuente && (
              <p style={{ margin: '0 0 8px', fontSize: 14, color: '#475569' }}>
                <strong>Fuente principal:</strong> {noticia.fuente}
              </p>
            )}
            {noticia.fuentesComplementarias && noticia.fuentesComplementarias.length > 0 && (
              <div style={{ fontSize: 14, color: '#475569' }}>
                <strong>Fuentes complementarias:</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  {noticia.fuentesComplementarias.map((f, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Audio — lazy-loaded, no bloquea LCP */}
        <Suspense fallback={null}>
          <AudioButton articleId={noticia.id} titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} />
        </Suspense>

        {/* 3 Puntos Clave */}
        <KeyPoints titulo={noticia.titulo} resumen={noticia.resumen} contenido={noticia.contenido} categoria={noticia.categoria} puntosClave={noticia.puntosClave} />

        {/* AdSense 300x250 — inline entre contenido superior y cuerpo */}
        <Suspense fallback={null}>
          <AdsenseUnit
            slot="4492386174"
            format="rectangle"
            responsive={true}
            minHeight={250}
            style={{ margin: '24px auto', maxWidth: 336, display: 'flex', justifyContent: 'center' }}
          />
        </Suspense>

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
        <div className="article-body" style={contentStyle} itemProp="articleBody" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(injectInternalLinks(enhancedHtml || noticia.resumen || '', noticia.related_links)) }} />

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

        {/* FAQ visible — mejora SEO y AI Search */}
        <ArticleFaq contenidoHtml={noticia.contenido || ''} resumen={noticia.resumen || ''} />

        </section>

        {/* Tags */}
        {tags.length > 0 && (
          <footer style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
            {tags.map((tag, i) => (
              <Link key={i} href={`/buscar?q=${encodeURIComponent(tag)}`} style={tagStyle} rel="nofollow">
                #{tag}
              </Link>
            ))}
          </footer>
        )}

        {/* Share */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e5e5' }}>
          <ShareBar url={url} title={noticia.titulo} variant="chips" />
        </div>

        {/* Author */}
        <aside aria-label="Autor" style={{ marginTop: 32 }} itemScope itemType="https://schema.org/Person">
          <meta itemProp="name" content={noticia.autor} />
          <AuthorCard
            name={noticia.autor}
            photo={authorPhoto}
            bio={autorData?.bio}
            role={autorData?.role}
            slug={autorData?.slug}
            publishedDate={noticia.fecha}
            updatedDate={(noticia as any).fechaActualizacion}
          />
        </aside>

        {/* Newsletter */}
        <div style={{ marginTop: 32, padding: '24px 20px', background: 'var(--bg-secondary, #f9fafb)', borderRadius: 12, border: '1px solid var(--border, #e5e7eb)' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>📰 Recibe noticias en tu correo</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>Resumen diario de las noticias más importantes de Nicaragua.</p>
          <NewsletterSignup />
        </div>

        {/* Lea también */}
        {related.length > 0 && (
          <aside aria-label="Lea también" style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 20px' }}>Lea también</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {related.slice(0, 4).map(item => {
                const itemCat = getCategory(item.categoria);
                return (
                  <Link
                    key={item.slug}
                    href={`/noticias/${item.slug}`}
                    style={{
                      display: 'block',
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      border: '1px solid #e5e5e5',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px -10px rgba(15,23,42,0.28)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', maxHeight: 150, backgroundColor: '#f3f4f6' }}>
                      {item.imagen ? (
                        <OptimizedImage src={item.imagen} alt={item.titulo} variant="card" fill priority={false} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📰</div>
                      )}
                      <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: itemCat.color, padding: '2px 8px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{itemCat.name}</span>
                    </div>
                    <div style={{ padding: 14 }}>
                      <h3 style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 14.5, lineHeight: 1.4 }}>{item.titulo}</h3>
                      <time style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, display: 'block' }} dateTime={item.fecha}>{formatDateES(item.fecha)}</time>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}

        {/* Apoyo al medio — después de relacionadas, antes de footer */}
        {wordCount >= 500 && (
          <SupportMedium slug={noticia.slug} />
        )}

        {/* Volver al inicio */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link
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
          </Link>
        </div>

        {/* Multiplex Ad — lazy-loaded para no bloquear LCP */}
        <Suspense fallback={null}>
          <AdsenseUnit
            slot="7942423751"
            format="autorelaxed"
            style={{ margin: '40px 0 0' }}
          />
        </Suspense>
      </article>
    </div>
  );
}
