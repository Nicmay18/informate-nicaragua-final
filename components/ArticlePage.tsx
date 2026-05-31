'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCategory, SITE_CONFIG } from '@/lib/constants';
import { tiempoLectura, fmtViews, formatDateES, stripHtml, extractPoints } from '@/lib/formateo';
import { getResponsiveImageUrl } from '@/lib/image-utils';
import KeyPoints from './KeyPoints';
import ShareBar from './ShareBar';
import AuthorCard from './AuthorCard';
import type { Noticia } from '@/lib/types';

/* ================================================================
   READING PROGRESS BAR
   ================================================================ */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const barStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 9999,
    backgroundColor: '#e5e5e5',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#991b1b',
    transition: 'width 0.15s ease-out',
    width: `${progress}%`,
  };

  return (
    <div style={barStyle} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <div style={fillStyle} />
    </div>
  );
}

/* ================================================================
   AUDIO BUTTON
   ================================================================ */
function AudioButton({ titulo, resumen, contenido }: { titulo: string; resumen: string; contenido: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullText = `${titulo}. ${resumen ? resumen + '. ' : ''}${stripHtml(contenido)}`.slice(0, 4500);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const playNativeTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'es-NI';
    utterance.rate = 1;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onstart = () => { setIsPlaying(true); setIsLoading(false); };
    utterance.onend = () => { setIsPlaying(false); setProgress(0); };
    utterance.onerror = () => { setIsPlaying(false); setIsLoading(false); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const play = async () => {
    if (isLoading) return;
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.audioBase64) throw new Error(data.error || 'Error del servidor');

      const audio = new Audio(data.audioBase64);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); setProgress(0); };
      audio.onerror = () => { setIsPlaying(false); setIsLoading(false); };
      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);

      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(Number.isFinite(pct) ? pct : 0);
        }
      }, 500);
    } catch {
      setIsLoading(false);
      if (!playNativeTTS()) {
        setErrorMsg('No se pudo generar el audio. Intenta de nuevo.');
        setTimeout(() => setErrorMsg(''), 6000);
      }
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      play();
    }
  };

  useEffect(() => () => stop(), [stop]);

  const btnBase: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  };

  const wrapStyle: React.CSSProperties = {
    margin: '24px 0',
    padding: 20,
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: 12,
  };

  return (
    <div style={wrapStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            ...btnBase,
            backgroundColor: isLoading ? '#9ca3af' : '#991b1b',
            color: '#fff',
            cursor: isLoading ? 'wait' : 'pointer',
          }}
          aria-label={isPlaying ? 'Pausar' : isLoading ? 'Cargando' : 'Reproducir audio'}
        >
          {isLoading ? (
            <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111827' }}>
            {isLoading ? 'Generando audio profesional...' : isPlaying ? 'Reproduciendo noticia' : 'Escuchar noticia en voz profesional'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
            {isLoading ? 'Esto puede tomar unos segundos' : 'Voz generada con inteligencia artificial'}
          </p>
        </div>

        {isPlaying && (
          <button
            onClick={stop}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: '#4b5563',
              backgroundColor: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            aria-label="Detener reproducción"
          >
            Detener
          </button>
        )}
      </div>

      {isPlaying && (
        <div style={{ marginTop: 12, height: 4, backgroundColor: '#e5e5e5', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', backgroundColor: '#991b1b', borderRadius: 2, transition: 'width 0.3s ease', width: `${progress}%` }} />
        </div>
      )}

      {errorMsg && (
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}

/* ================================================================
   PULL QUOTE
   ================================================================ */
function PullQuote({ contenido }: { contenido: string }) {
  const plain = stripHtml(contenido);
  const sentences = plain.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 80 && s.length < 210);
  const quote = sentences[Math.floor(sentences.length / 2)] || sentences[1] || '';
  if (!quote) return null;

  return (
    <aside style={{ margin: '32px 0', paddingLeft: 24, borderLeft: '4px solid #991b1b', paddingTop: 8, paddingBottom: 8 }}>
      <p style={{ fontSize: 20, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1f2937', lineHeight: 1.6, margin: 0 }}>
        &ldquo;{quote}.&rdquo;
      </p>
    </aside>
  );
}

/* ================================================================
   AD PLACEHOLDER
   ================================================================ */
function AdPlaceholder({ label, size }: { label: string; size: string }) {
  return (
    <div style={{ margin: '32px 0', padding: '32px 16px', backgroundColor: '#f9fafb', border: '1px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} role="complementary" aria-label={label}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af' }}>{label}</span>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>{size}</p>
    </div>
  );
}

/* ================================================================
   ARTICLE PAGE — ESTILOS INLINE COMPLETOS (sin Tailwind)
   ================================================================ */
interface ArticlePageProps {
  noticia: Noticia;
  related?: Noticia[];
}

export default function ArticlePage({ noticia, related = [] }: ArticlePageProps) {
  const router = useRouter();
  const FONT_STEPS = [0.9, 1, 1.1, 1.2];
  const [fontIndex, setFontIndex] = useState(1); // índice 1 = tamaño normal (1em)
  const fontSize = FONT_STEPS[fontIndex];

  if (!noticia) {
    return (
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Noticia no encontrada</p>
        <button onClick={() => router.back()} style={{ marginTop: 16, color: '#991b1b', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>← Volver</button>
      </div>
    );
  }

  const category = getCategory(noticia.categoria);
  const url = `${SITE_CONFIG.url}/noticias/${noticia.slug}`;
  const lecturaMin = tiempoLectura(noticia.contenido || noticia.resumen || '');
  const vistas = fmtViews(noticia.vistas);
  const tags = [noticia.categoria, ...extractPoints(noticia.titulo, 3)];
  const readAlso = related.slice(0, 3);

  const pieDeFoto = noticia.pieFoto?.trim()
    ? noticia.pieFoto
    : 'Foto: Nicaragua Informate / Archivo';

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
    height: 480,
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

      <article style={containerStyle}>
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

        {/* Imagen destacada — ALTURA FIJA 480px */}
        {noticia.imagen && (
          <figure style={imgContainerStyle} itemScope itemType="https://schema.org/ImageObject">
            <Image
              src={noticia.imagen}
              alt={noticia.titulo}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 800px"
              priority
              crossOrigin="anonymous"
            />
          </figure>
        )}

        {/* Pie de foto */}
        <figcaption style={captionStyle}>
          <span style={{ fontWeight: 500 }}>{pieDeFoto}</span>
          {noticia.pieFoto?.trim() && (
            <span style={{ color: '#9ca3af', marginLeft: 4 }}>| Nicaragua Informate</span>
          )}
        </figcaption>

        {/* Audio */}
        <AudioButton titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} />

        {/* 3 Puntos Clave */}
        <KeyPoints titulo={noticia.titulo} resumen={noticia.resumen} contenido={noticia.contenido} categoria={noticia.categoria} />

        {/* Ad Top */}
        <AdPlaceholder label="Publicidad" size="In-article Top" />

        {/* Contenido */}
        <div className="article-body" style={contentStyle} itemProp="articleBody" dangerouslySetInnerHTML={{ __html: noticia.contenido || noticia.resumen || '' }} />

        {/* Pull Quote */}
        <PullQuote contenido={noticia.contenido || ''} />

        {/* Ad Mid */}
        <AdPlaceholder label="Publicidad" size="In-article Mid" />

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32 }}>
            {tags.map((tag, i) => (
              <Link key={i} href={`/buscar?q=${encodeURIComponent(tag)}`} style={tagStyle}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

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

        {/* Navegación */}
        {readAlso.length > 0 && (
          <nav style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {readAlso[0] && (
              <Link href={`/noticias/${readAlso[0].slug}`} style={navCardStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
                  Anterior
                </span>
                <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: 15, lineHeight: 1.4 }}>{readAlso[0].titulo}</p>
              </Link>
            )}
            {readAlso[1] && (
              <Link href={`/noticias/${readAlso[1].slug}`} style={{ ...navCardStyle, textAlign: 'right' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }}>
                  Siguiente
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>
                </span>
                <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: 15, lineHeight: 1.4 }}>{readAlso[1].titulo}</p>
              </Link>
            )}
          </nav>
        )}

        {/* Volver al inicio */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
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

        {/* Related News */}
        {related.length > 3 && (
          <section style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Lea también</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {related.slice(3, 6).map(item => (
                <Link key={item.slug} href={`/noticias/${item.slug}`} style={relatedCardStyle}>
                  {item.imagen && (
                    <div style={{ position: 'relative', width: '100%', height: 180, backgroundColor: '#f3f4f6' }}>
                      <Image src={getResponsiveImageUrl(item.imagen, 400)} alt={item.titulo} fill style={{ objectFit: 'cover' }} sizes="300px" loading="lazy" />
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

        {/* Comments */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Comentarios (0)</h2>
          <textarea
            style={{ width: '100%', padding: 16, border: '1px solid #e5e5e5', borderRadius: 12, resize: 'none', fontFamily: 'inherit', fontSize: 15, minHeight: 100 }}
            placeholder="¿Qué opinas sobre esta noticia? Comparte tu perspectiva..."
          />
          <button style={{ marginTop: 8, padding: '10px 24px', backgroundColor: '#991b1b', color: '#fff', fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15 }}>
            Publicar comentario
          </button>
        </section>

        {/* Ad Bottom */}
        <AdPlaceholder label="Publicidad" size="728x90" />
      </article>
    </div>
  );
}
