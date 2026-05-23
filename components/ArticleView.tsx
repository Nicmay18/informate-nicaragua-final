'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Noticia } from '@/lib/types';
import { formatDateES, tiempoLectura } from '@/lib/formateo';

interface ArticleViewProps {
  noticia: Noticia & {
    caption?: string;
    tiempoLectura?: string;
    resumen?: string | Array<{ num: number; titulo?: string; texto: string }>;
    contenidoHTML?: string;
    autorNombre?: string;
    autorFoto?: string;
    autorBio?: string;
    autorRedes?: { twitter?: string; facebook?: string; email?: string; linkedin?: string };
    analisisTag?: string;
    analisisTitulo?: string;
    analisisParrafos?: string[];
    donacionActiva?: boolean;
  };
  relatedNews?: Noticia[];
  trendingNews?: Noticia[];
}

function ShareIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    twitter: 'M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 8v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z',
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z',
  };
  return (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
      <path d={icons[type] || icons.twitter} />
    </svg>
  );
}

export default function ArticleView({ noticia, relatedNews = [], trendingNews = [] }: ArticleViewProps) {
  const [copied, setCopied] = useState(false);
  const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

  // Leer tiempo de lectura (string directo o calcular)
  const readTime = noticia.tiempoLectura || tiempoLectura((noticia as any).contenidoHTML || noticia.contenido || (noticia.resumen as string) || '');

  const catSlug = `/categoria/${noticia.categoria.toLowerCase().replace(/\s+/g, '-')}`;

  // Autor: autorNombre extendido o autor estándar
  const autorName = (noticia as any).autorNombre || noticia.autor || 'Redacción';
  const autorBio = (noticia as any).autorBio || `Periodista de Nicaragua Informate. Especializado en la sección de ${noticia.categoria}. Comprometido con la información verificada.`;
  const autorFoto = (noticia as any).autorFoto;
  const autorRedes = (noticia as any).autorRedes;

  // Contenido: contenidoHTML extendido o contenido estándar
  const bodyHTML = (noticia as any).contenidoHTML || noticia.contenido || '';

  // Resumen: array de objetos extendido o extraer de contenido
  const resumenArray = Array.isArray(noticia.resumen) ? noticia.resumen : null;

  // Análisis
  const analisisTag = (noticia as any).analisisTag;
  const analisisTitulo = (noticia as any).analisisTitulo;
  const analisisParrafos = (noticia as any).analisisParrafos;

  // Caption
  const caption = (noticia as any).caption;

  const handleShare = (platform: string) => {
    const enc = encodeURIComponent;
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(noticia.titulo)}`,
      whatsapp: `https://wa.me/?text=${enc(noticia.titulo + ' — ' + url)}`,
    };
    window.open(links[platform], '_blank', 'width=600,height=400');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extraer puntos clave del contenido como fallback
  const extractPoints = (html: string): string[] => {
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = plain.split('. ').map(s => s.trim()).filter(s => s.length > 40 && s.length < 200);
    return sentences.slice(0, 3);
  };

  const points = bodyHTML ? extractPoints(bodyHTML) : [];

  return (
    <div className="article-view">
      {/* ARTICLE HEADER */}
      <div className="av-header">
        <nav className="av-breadcrumb">
          <Link href="/">Inicio</Link>
          <span className="av-breadcrumb-sep">/</span>
          <Link href={catSlug}>{noticia.categoria}</Link>
          <span className="av-breadcrumb-sep">/</span>
          <span>{noticia.titulo.slice(0, 40)}...</span>
        </nav>
        <span className="av-category">{noticia.categoria}</span>
        <h1 className="av-title">{noticia.titulo}</h1>
        <div className="av-meta">
          <div className="av-meta-author">
            {autorFoto ? (
              <img src={autorFoto} alt={autorName} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>
                {autorName[0].toUpperCase()}
              </div>
            )}
            <div className="av-meta-author-info">
              <strong>{autorName}</strong>
              <span>Periodista</span>
            </div>
          </div>
          <span>{formatDateES(noticia.fecha)}</span>
          <span className="av-meta-reading">{readTime} min de lectura</span>
        </div>
      </div>

      {/* ARTICLE HERO */}
      <div className="av-hero">
        <div className="av-hero-img">
          {noticia.imagen ? (
            <img src={noticia.imagen} alt={noticia.titulo} />
          ) : (
            <div style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase', padding: 24, height: 240 }}>
              {noticia.categoria}
            </div>
          )}
          {noticia.imagen && (
            <div className="av-hero-caption">{caption || 'Nicaragua Informate'}</div>
          )}
        </div>
      </div>

      {/* ARTICLE LAYOUT */}
      <div className="av-layout">
        <article className="av-body">
          {/* RESUMEN ARRAY (Firestore extendido) */}
          {resumenArray && resumenArray.length > 0 && (
            <div className="av-summary">
              <h3>En {resumenArray.length} puntos clave</h3>
              <ul>
                {resumenArray.map((item: any, i: number) => (
                  <li key={i}>
                    <span className="av-point-num">{item.num || i + 1}</span>
                    <span className="av-point-text">
                      {item.titulo && <strong>{item.titulo}. </strong>}
                      {item.texto}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* RESUMEN fallback (estándar) */}
          {!resumenArray && points.length >= 2 && (
            <div className="av-summary">
              <h3>En {points.length} puntos clave</h3>
              <ul>
                {points.map((p, i) => (
                  <li key={i}>
                    <span className="av-point-num">{i + 1}</span>
                    <span className="av-point-text">{p}.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ANÁLISIS (Firestore extendido) */}
          {analisisTag && analisisTitulo && (
            <div className="av-analysis">
              <span className="av-analysis-tag">{analisisTag}</span>
              <h3>{analisisTitulo}</h3>
              {analisisParrafos && analisisParrafos.map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {/* CONTENIDO */}
          {bodyHTML ? (
            <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />
          ) : (
            <p>{noticia.resumen as string}</p>
          )}

          {/* SHARE */}
          <div className="av-share">
            <span className="av-share-label">Compartir:</span>
            <button className="av-share-btn" onClick={() => handleShare('facebook')} title="Facebook">
              <ShareIcon type="facebook" />
            </button>
            <button className="av-share-btn" onClick={() => handleShare('twitter')} title="Twitter/X">
              <ShareIcon type="twitter" />
            </button>
            <button className="av-share-btn" onClick={() => handleShare('whatsapp')} title="WhatsApp">
              <ShareIcon type="whatsapp" />
            </button>
            <button className="av-share-btn" onClick={handleCopy} title="Copiar enlace" style={copied ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : undefined}>
              {copied ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
            </button>
          </div>

          {/* TAGS */}
          {noticia.tags && noticia.tags.length > 0 && (
            <div className="av-tags">
              {noticia.tags.map((tag, i) => (
                <span key={i} className="av-tag">{tag}</span>
              ))}
            </div>
          )}

          {/* AUTHOR BOX */}
          <div className="av-author">
            {autorFoto ? (
              <img src={autorFoto} alt={autorName} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid var(--accent)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 800, fontSize: 24, flexShrink: 0 }}>
                {autorName[0].toUpperCase()}
              </div>
            )}
            <div>
              <h4>{autorName}</h4>
              <p>{autorBio}</p>
              <div className="av-author-social">
                {autorRedes?.twitter && <a href={autorRedes.twitter} title="Twitter" target="_blank" rel="noopener noreferrer">𝕏</a>}
                {autorRedes?.facebook && <a href={autorRedes.facebook} title="Facebook" target="_blank" rel="noopener noreferrer">f</a>}
                {autorRedes?.email && <a href={`mailto:${autorRedes.email}`} title="Email">@</a>}
                {autorRedes?.linkedin && <a href={autorRedes.linkedin} title="LinkedIn" target="_blank" rel="noopener noreferrer">in</a>}
                {!autorRedes && (
                  <>
                    <a href="#" title="Twitter">𝕏</a>
                    <a href="#" title="Facebook">f</a>
                    <a href="#" title="Email">@</a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RELATED */}
          {relatedNews.length > 0 && (
            <>
              <h3 className="av-related-title">Noticias relacionadas</h3>
              <div className="av-related-grid">
                {relatedNews.slice(0, 3).map((n) => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="av-related-card">
                    {n.imagen ? (
                      <img src={n.imagen} alt={n.titulo} />
                    ) : (
                      <div style={{ width: 80, height: 80, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {n.categoria}
                      </div>
                    )}
                    <div>
                      <h5>{n.titulo}</h5>
                      <span>{formatDateES(n.fecha)} • {n.categoria}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* COMMENTS */}
          <div className="av-comments">
            <div className="av-comments-header">
              <h3>Comentarios</h3>
              <span className="av-comments-count">0 comentarios</span>
            </div>
            <div className="av-comment-form">
              <div className="form-row">
                <input type="text" placeholder="Nombre" />
                <input type="email" placeholder="Email (no se publicará)" />
              </div>
              <textarea placeholder="¿Qué opinas sobre esta noticia? Comparte tu perspectiva..."></textarea>
              <button>Publicar comentario</button>
            </div>
          </div>
        </article>

        {/* SIDEBAR */}
        <aside className="av-sidebar">
          {/* TRENDING */}
          {trendingNews.length > 0 && (
            <div className="av-sidebar-widget">
              <h3 className="av-widget-title">Lo más leído</h3>
              {trendingNews.slice(0, 4).map((n, i) => (
                <Link href={`/noticias/${n.slug}`} key={n.slug} className="av-trending-item">
                  <span className="av-trending-num">{i + 1}</span>
                  <div className="av-trending-content">
                    <h4>{n.titulo}</h4>
                    <span>{formatDateES(n.fecha)} • {n.categoria}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* NEWSLETTER */}
          <div className="av-sidebar-widget">
            <h3 className="av-widget-title">Newsletter</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Recibe cada mañana las noticias más importantes de Nicaragua.
            </p>
            <input type="email" placeholder="tu@email.com" style={{ width: '100%', padding: 12, border: '1.5px solid var(--border)', borderRadius: 8, marginBottom: 12, fontFamily: 'Inter, sans-serif', background: 'var(--bg)', color: 'var(--text)' }} />
            <button style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              Suscribirme gratis
            </button>
          </div>

          {/* CATEGORIES */}
          <div className="av-sidebar-widget">
            <h3 className="av-widget-title">Categorías</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Nacionales', 'Internacionales', 'Sucesos', 'Tecnología', 'Deportes', 'Economía'].map((cat) => (
                <Link key={cat} href={`/categoria/${cat.toLowerCase()}`} className="av-tag">{cat}</Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
