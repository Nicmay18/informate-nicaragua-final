'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Clock, Eye, Check, Link2, Play, Pause, Square } from 'lucide-react';
import BrandIcon from '@/components/BrandIcon';
import { formatearNoticia, limpiarHtml, tiempoLectura, formatDateES } from '@/lib/formateo';
import { FALLBACK_IMAGE } from '@/lib/types';
import { getResponsiveImageUrl } from '@/lib/image-utils';
import LutoImage from '@/components/LutoImage';

function ArticleImage({ src, alt, style, width = 800, priority }: { src: string; alt: string; style?: React.CSSProperties; width?: number; priority?: boolean }) {
  const validSrc = src?.trim();
  const isValid = validSrc && (validSrc.startsWith('http') || validSrc.startsWith('/') || validSrc.startsWith('data:'));
  const imgSrc = isValid ? validSrc : FALLBACK_IMAGE;

  if (priority) {
    /* Imagen principal del artículo: <img> nativo para LCP directo sin proxy */
    return (
      <img
        src={imgSrc}
        alt={alt}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        width={width}
        height={Math.round(width * 0.56)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', ...style,
        }}
        onError={e => {
          if ((e.target as HTMLImageElement).src !== FALLBACK_IMAGE) {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }
        }}
      />
    );
  }

  /* Imágenes pequeñas (relacionadas): next/image normal con lazy loading */
  const optimizedSrc = isValid ? getResponsiveImageUrl(validSrc, width, Math.round(width * 0.56)) : FALLBACK_IMAGE;
  const [currentSrc, setCurrentSrc] = useState(optimizedSrc);
  useEffect(() => { setCurrentSrc(optimizedSrc); }, [optimizedSrc]);
  const sizes = width <= 400
    ? '(max-width: 768px) 50vw, 400px'
    : '(max-width: 768px) 100vw, 665px';

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes}
      style={{ objectFit: 'cover', ...style }}
      loading="lazy"
      onError={() => {
        if (currentSrc !== FALLBACK_IMAGE) setCurrentSrc(FALLBACK_IMAGE);
      }}
    />
  );
}

/* ================================================================
   TIPOS
   ================================================================ */
interface AudioButtonProps {
  titulo: string;
  resumen: string;
  contenido: string;
  articleId?: string;
}

interface NoticiaProps {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido?: string;
  categoria: string;
  imagen: string;
  fecha: string;
  autor?: string;
  vistas?: number;
}

interface ArticleClientProps {
  noticia: NoticiaProps;
  related: NoticiaProps[];
  isLuto?: boolean;
  adSlot?: React.ReactNode;
}

/* ================================================================
   COLORES DE CATEGORÍA
   ================================================================ */
const CAT_COLORS: Record<string, string> = {
  Sucesos: '#dc2626',
  Nacionales: '#1d4ed8',
  Deportes: '#16a34a',
  Internacionales: '#7c3aed',
  Espectáculos: '#db2777',
};

/* ================================================================
   AUDIO BUTTON (reproductor con ondas animadas)
   ================================================================ */
const WAVE_BARS = [6, 12, 8, 16, 10, 14, 7, 18, 9, 13, 11, 15, 8, 12, 6];

export function AudioButton({ titulo, resumen, contenido, articleId = '' }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanText = (html: string) => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const fullText = `${titulo}. ${resumen ? resumen + '. ' : ''}${cleanText(contenido)}`.slice(0, 4500);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const startProgressTracker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(Number.isFinite(pct) ? pct : 0);
      }
    }, 500);
  };

  const playNativeTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return false;
    }
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'es-NI';
    utterance.rate = 1;
    utterance.pitch = 1;

    // Buscar voz en español (getVoices puede estar vacío inicialmente en algunos navegadores)
    let voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      // Si no hay voces cargadas, usar voz por defecto del sistema
      voices = [];
    }
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
      startProgressTracker();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText, articleId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.audioBase64) {
        throw new Error(data.error || data.detail || `Error del servidor (${res.status})`);
      }

      const audio = new Audio(data.audioBase64);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); setProgress(0); if (intervalRef.current) clearInterval(intervalRef.current); };
      audio.onerror = () => { setIsPlaying(false); setIsLoading(false); };
      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
      startProgressTracker();
    } catch (err: any) {
      console.error('Audio error:', err);
      setIsLoading(false);

      const serverMsg = err?.message || '';

      // Fallback a Web Speech API nativo del navegador
      if (playNativeTTS()) {
        return;
      }

      // Mostrar error específico
      if (serverMsg.includes('API Key') || serverMsg.includes('no configurada')) {
        alert('El servicio de voz profesional no está configurado.\n\nContacta al administrador para activar ElevenLabs.');
      } else if (serverMsg.includes('Network') || serverMsg.includes('fetch')) {
        alert('Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else {
        alert('No se pudo generar el audio: ' + serverMsg);
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

  return (
    <div style={{
      margin: '0 0 32px',
      padding: '18px 22px',
      background: '#f7f4ee',
      border: '1px solid #ddd6ce',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            width: 52, height: 52, borderRadius: '50%', border: 'none',
            background: isLoading ? '#c6beb5' : '#8c1d18', color: '#fff',
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'transform 0.2s',
          }}
        >
          {isLoading ? (
            <div style={{
              width: 20, height: 20,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#18181b' }}>
            {isLoading ? 'Generando audio profesional...' : isPlaying ? 'Reproduciendo noticia' : 'Escuchar noticia en voz profesional'}
          </div>
          <div style={{ fontSize: 12, color: '#9f968d', marginTop: 3 }}>
            {isLoading ? 'Esto puede tomar unos segundos la primera vez' : 'Voz generada con inteligencia artificial'}
          </div>
        </div>

        {/* Wave animation */}
        {isPlaying && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 20 }}>
            {WAVE_BARS.map((h, i) => (
              <span key={i} style={{
                display: 'inline-block', width: 3, height: h,
                background: '#8c1d18', borderRadius: 1.5,
                animation: `wvbar ${0.4 + (i % 3) * 0.15}s ease-in-out ${i * 0.04}s infinite alternate`,
              }} />
            ))}
          </div>
        )}

        {isPlaying && (
          <button onClick={stop} style={{
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid #ddd6ce', background: '#fff',
            color: '#756d66', fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>
            <Square size={10} fill="#756d66" /> Detener
          </button>
        )}
      </div>

      {(isPlaying || progress > 0) && (
        <div style={{ width: '100%', height: 4, background: '#e5e0d8', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#8c1d18', borderRadius: 2, transition: 'width 0.3s linear' }} />
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes wvbar{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
}

/* ================================================================
   COPY BUTTON
   ================================================================ */
export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copiar enlace"
      style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '1px solid #e5e7eb', background: '#fff',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: copied ? '#16a34a' : '#374151',
      }}
    >
      {copied ? <Check size={14} color="#16a34a" /> : <Link2 size={14} />}
    </button>
  );
}

/* ================================================================
   SHARE CHIP
   ================================================================ */
export function ShareChip({ href, label, bg, icon }: { href: string; label: string; bg: string; icon?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: '10px 16px', borderRadius: 8, background: bg, color: '#fff',
        textDecoration: 'none', fontSize: 13, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'opacity 0.2s',
      }}
      className="share-chip-hover"
    >
      {icon && <BrandIcon name={icon} size={14} />}
      {label}
    </a>
  );
}

/* ================================================================
   UTILIDADES
   ================================================================ */
function fmtDate(ts: unknown): string {
  if (!ts) return 'Hace un momento';
  try {
    return formatDateES(typeof ts === 'string' ? ts : String(ts));
  } catch { return 'Hace un momento'; }
}

function cleanHtml(html: string): string {
  if (!html) return '';
  if (!html.includes('<')) return formatearNoticia(html);
  // Si ya tiene HTML estructurado (p, h2, blockquote, ul, etc.), solo limpiar basura
  return limpiarHtml(html);
}

function fmtViews(v?: number): string {
  if (!v || v === 0) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
}

function extractTags(categoria: string, titulo: string): string[] {
  const base = [categoria];
  const words = titulo.toLowerCase().split(/\s+/).filter(w => w.length > 5);
  const significant = words.filter(w => !['sobre', 'entre', 'desde', 'hasta', 'durante', 'contra', 'según'].includes(w));
  return [...base, ...significant.slice(0, 4)].map(t => t.charAt(0).toUpperCase() + t.slice(1));
}

/* ================================================================
   ARTICLE CLIENT (diseño profesional)
   ================================================================ */
export default function ArticleClient({
  noticia,
  related = [],
  isLuto = false,
  adSlot,
}: ArticleClientProps) {
  if (!noticia) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Noticia no encontrada</div>;
  }

  const url = `https://www.nicaraguainformate.com/noticias/${noticia.slug}`;
  const fechaStr = fmtDate(noticia.fecha);
  const rawAutor = (noticia.autor || '').trim();
  const autor = rawAutor && rawAutor.toLowerCase() !== 'directora editorial' ? rawAutor : 'Keyling Rivera M.';
  const autorInicial = autor.charAt(0).toUpperCase();
  const lecturaMin = tiempoLectura(noticia.contenido || noticia.resumen);
  const vistas = fmtViews(noticia.vistas);
  const catColor = CAT_COLORS[noticia.categoria] || '#8c1d18';
  const tags = extractTags(noticia.categoria, noticia.titulo);

  return (
    <>
      <article className="article-page">
        {/* ===== BREADCRUMB ===== */}
        <nav className="article-breadcrumb">
          <Link href="/">Inicio</Link>
          <span>›</span>
          <span style={{ color: catColor, fontWeight: 700 }}>{noticia.categoria}</span>
          <span>›</span>
          <span>Artículo</span>
        </nav>

        {/* ===== CATEGORY BADGE ===== */}
        <span className="article-category-badge" style={{ background: catColor }}>
          {noticia.categoria}
        </span>

        {/* ===== TITLE ===== */}
        <h1 className="article-title-pro">{noticia.titulo}</h1>

        {/* ===== LEAD / SUMMARY ===== */}
        {noticia.resumen && (
          <p className="article-lead-pro">{noticia.resumen}</p>
        )}

        {/* ===== META BAR ===== */}
        <div className="article-meta-bar">
          <div className="author-avatar-pro" style={{ background: catColor }}>
            {autorInicial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#121212' }}>{autor}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 500 }}>Periodista</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={12} /> {fechaStr}
            </span>
            <span style={{ fontSize: 13, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} /> {lecturaMin} min de lectura
            </span>
            <span style={{ fontSize: 13, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={12} /> {vistas} vistas
            </span>
          </div>
        </div>

        {/* ===== FEATURED IMAGE ===== */}
        <figure className="featured-figure" style={{ margin: '0 0 40px' }}>
          {isLuto ? (
            <LutoImage
              src={noticia.imagen || '/logo.png'}
              alt={noticia.titulo}
              nombre={noticia.titulo.split(':')[0] || noticia.titulo.split('–')[0]}
              className="featured-image-wrapper"
            />
          ) : (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: 520, borderRadius: 12, overflow: 'hidden' }}>
              <ArticleImage src={noticia.imagen || '/logo.png'} alt={noticia.titulo} priority />
            </div>
          )}
          <figcaption className="featured-caption">
            {noticia.titulo}
            <span className="featured-credit">Foto: Nicaragua Informate</span>
          </figcaption>
        </figure>

        {/* ===== AUDIO PLAYER ===== */}
        <AudioButton titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} articleId={noticia.id} />

        {/* ===== ARTICLE BODY ===== */}
        <div
          className="article-body-pro drop-cap"
          dangerouslySetInnerHTML={{ __html: cleanHtml(noticia.contenido || '') }}
        />

        {/* ===== IN-ARTICLE AD ===== */}
        {adSlot && (
          <div style={{ margin: '36px 0', maxWidth: 680 }}>
            {adSlot}
          </div>
        )}

        {/* ===== TAGS ===== */}
        <div style={{ margin: '36px 0 28px', paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
            🏷️ Etiquetas
          </div>
          <div className="tags-list">
            {tags.map((tag) => (
              <span key={tag} className="tag-pro">{tag}</span>
            ))}
          </div>
        </div>

        {/* ===== SHARE BAR ===== */}
        <div className="share-bar-pro">
          <div className="share-label">📤 Compartir artículo</div>
          <div className="share-buttons">
            <ShareChip href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} label="📘 Facebook" bg="#1877f2" icon="facebook-f" />
            <ShareChip href={`https://wa.me/?text=${encodeURIComponent(noticia.titulo + ' — ' + url)}`} label="💬 WhatsApp" bg="#25d366" icon="whatsapp" />
            <ShareChip href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(noticia.titulo)}&url=${encodeURIComponent(url)}`} label="🐦 X / Twitter" bg="#0f1419" icon="x-twitter" />
            <ShareChip href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(noticia.titulo)}`} label="✈️ Telegram" bg="#0088cc" icon="telegram" />
            <CopyButton url={url} />
          </div>
        </div>

        {/* ===== AUTHOR BIO ===== */}
        <div className="author-box-pro" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div className="author-avatar-pro" style={{ width: 80, height: 80, fontSize: 32, background: '#2563eb', margin: '0 auto 16px' }}>
            {autorInicial}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{autor}</div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563eb', marginBottom: 14 }}>
            Periodista | {noticia.categoria}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 auto', maxWidth: 480 }}>
            Periodista especializada en el análisis de sucesos y eventos de relevancia en el territorio nicaragüense. Enfocada en reportes detallados con rigor informativo y compromiso con la verdad.
          </p>
        </div>

        {/* ===== RELATED ARTICLES ===== */}
        {related.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div className="section-header" style={{ marginBottom: 20 }}>
              <h3 className="section-title">Noticias relacionadas</h3>
            </div>
            <div className="related-grid-pro">
              {related.map((n) => (
                <Link key={n.slug} href={`/noticias/${n.slug}`} className="related-card-pro">
                  <article>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden' }}>
                      <ArticleImage src={n.imagen || '/logo.png'} alt={n.titulo} width={400} />
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: CAT_COLORS[n.categoria] || '#8c1d18',
                        marginBottom: 8,
                      }}>
                        {n.categoria}
                      </span>
                      <h3 style={{
                        fontSize: 15, fontWeight: 700, color: '#121212',
                        lineHeight: 1.35, margin: 0, flex: 1,
                      }}>
                        {n.titulo}
                      </h3>
                      <div style={{ fontSize: 12, color: '#a0a0a0', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={10} /> {fmtDate(n.fecha)}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}

