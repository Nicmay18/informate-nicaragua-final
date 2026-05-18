'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, Eye, Check, Link2, Play, Pause, Square } from 'lucide-react';
import BrandIcon from '@/components/BrandIcon';
import { formatearNoticia, limpiarHtml, tiempoLectura, formatDateES } from '@/lib/formateo';
import { FALLBACK_IMAGE } from '@/lib/types';
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

  /* Imágenes pequeñas (relacionadas): img nativo para control total de errores */
  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
      onError={e => {
        if ((e.target as HTMLImageElement).src !== FALLBACK_IMAGE) {
          (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
        }
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
  Tecnología: '#0ea5e9',
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
    } catch (err: unknown) {
      console.error('Audio error:', err);
      setIsLoading(false);

      const serverMsg = err instanceof Error ? err.message : '';

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

    </div>
  );
}

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
  return (
    <div className="reading-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <div className="reading-progress__bar" style={{ width: `${progress}%` }} />
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
   TIEMPO RELATIVO
   ================================================================ */
function timeAgo(dateStr: string): string {
  try {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 2) return 'Hace un momento';
    if (mins < 60) return `Hace ${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `Hace ${h} hora${h > 1 ? 's' : ''}`;
    const d = Math.floor(h / 24);
    if (d < 7) return `Hace ${d} día${d > 1 ? 's' : ''}`;
    return '';
  } catch { return ''; }
}

/* ================================================================
   NOTICIA EN 3 PUNTOS (BBC style)
   ================================================================ */
function extractPoints(resumen: string, raw: string): string[] {
  const plain = ((resumen || '') + '. ' + (raw || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
  return plain.split('. ')
    .map(s => s.trim().replace(/^[-•–]\s*/, ''))
    .filter(s => s.length > 40 && s.length < 230)
    .slice(0, 3);
}

function NewsIn3Points({ resumen, contenido }: { resumen: string; contenido: string }) {
  const pts = extractPoints(resumen, contenido);
  if (pts.length < 2) return null;
  return (
    <div className="news-3pts">
      <div className="news-3pts__header">
        <span>⚡</span> La noticia en {pts.length} puntos clave
      </div>
      <ul className="news-3pts__list">
        {pts.map((p, i) => (
          <li key={i} className="news-3pts__item">
            <span className="news-3pts__num">{i + 1}</span>
            <span>{p}.</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================
   PULL QUOTE (Reuters style)
   ================================================================ */
function PullQuote({ contenido }: { contenido: string }) {
  const plain = (contenido || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const sentences = plain.split('. ')
    .map(s => s.trim())
    .filter(s => s.length > 80 && s.length < 210);
  const quote = sentences[Math.floor(sentences.length / 2)] || sentences[1] || '';
  if (!quote) return null;
  return (
    <aside className="pull-quote-box">
      <p className="pull-quote-text">"{quote}."</p>
    </aside>
  );
}

/* ================================================================
   FLOATING SHARE — barra lateral fija en desktop (NYT/El País)
   ================================================================ */
function FloatingShare({ url, titulo }: { url: string; titulo: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const enc = encodeURIComponent;
  return (
    <div className="floating-share">
      <span className="floating-share__label">COMPARTIR</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer" className="floating-share__btn" style={{ background: '#1877f2' }} aria-label="Facebook"><BrandIcon name="facebook-f" size={14} /></a>
      <a href={`https://wa.me/?text=${enc(titulo + ' — ' + url)}`} target="_blank" rel="noopener noreferrer" className="floating-share__btn" style={{ background: '#25d366' }} aria-label="WhatsApp"><BrandIcon name="whatsapp" size={14} /></a>
      <a href={`https://t.me/share/url?url=${enc(url)}&text=${enc(titulo)}`} target="_blank" rel="noopener noreferrer" className="floating-share__btn" style={{ background: '#0088cc' }} aria-label="Telegram"><BrandIcon name="telegram" size={14} /></a>
      <button onClick={copy} className="floating-share__btn" style={{ background: copied ? '#059669' : '#6b7280' }} aria-label="Copiar enlace">
        {copied ? <Check size={14} /> : <Link2 size={14} />}
      </button>
    </div>
  );
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
  const [fontSize, setFontSize] = useState(1);
  const FONT_STEPS = [0.9, 1, 1.1, 1.2];

  if (!noticia) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Noticia no encontrada</div>;
  }

  const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
  const fechaStr = fmtDate(noticia.fecha);
  const ago = timeAgo(noticia.fecha);
  const rawAutor = (noticia.autor || '').trim();
  const autor = rawAutor && rawAutor.toLowerCase() !== 'directora editorial' ? rawAutor : 'Keyling Elieth Rivera Muñoz';
  const autorInicial = autor.charAt(0).toUpperCase();
  const lecturaMin = tiempoLectura(noticia.contenido || noticia.resumen);
  const vistas = fmtViews(noticia.vistas);
  const catColor = CAT_COLORS[noticia.categoria] || '#8c1d18';
  const tags = extractTags(noticia.categoria, noticia.titulo);

  return (
    <>
      <ReadingProgress />
      <FloatingShare url={url} titulo={noticia.titulo} />
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
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)' }}>{autor}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 500 }}>Periodista</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {ago && (
              <span style={{ fontSize: 13, color: 'var(--c-accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                🕐 {ago}
              </span>
            )}
            <time dateTime={noticia.fecha} style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={12} /> {fechaStr}
            </time>
            <span style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} /> {lecturaMin} min
            </span>
            <span style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={12} /> {vistas}
            </span>
            {/* A- / A+ font control */}
            <div className="font-size-ctrl">
              <button
                className="font-size-ctrl__btn"
                onClick={() => setFontSize(s => { const i = FONT_STEPS.indexOf(s); return FONT_STEPS[Math.max(0, i - 1)]; })}
                aria-label="Reducir texto" title="A−"
              >A−</button>
              <button
                className="font-size-ctrl__btn"
                onClick={() => setFontSize(s => { const i = FONT_STEPS.indexOf(s); return FONT_STEPS[Math.min(FONT_STEPS.length - 1, i + 1)]; })}
                aria-label="Aumentar texto" title="A+"
              >A+</button>
            </div>
          </div>
        </div>

        {/* ===== FEATURED IMAGE ===== */}
        <figure className="featured-figure">
          {isLuto ? (
            <LutoImage
              src={noticia.imagen || '/logo.png'}
              alt={noticia.titulo}
              nombre={noticia.titulo.split(':')[0] || noticia.titulo.split('–')[0]}
              className="featured-image-wrapper"
            />
          ) : noticia.imagen && (noticia.imagen.startsWith('http') || noticia.imagen.startsWith('/')) ? (
            <div className="featured-image-wrap">
              <img
                src={noticia.imagen}
                alt={noticia.titulo}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="featured-img"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div
              className="featured-image-wrap"
              style={{
                background: catColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '1.2rem',
                textTransform: 'uppercase',
                textAlign: 'center',
                padding: 24,
              }}
            >
              {noticia.categoria}
            </div>
          )}
          {noticia.imagen && noticia.imagen.trim().startsWith('http') && (
            <figcaption className="featured-caption">
              <span className="featured-credit">📷 Nicaragua Informate</span>
            </figcaption>
          )}
        </figure>

        {/* ===== AUDIO PLAYER ===== */}
        <AudioButton titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} articleId={noticia.id} />

        {/* ===== NOTICIA EN 3 PUNTOS ===== */}
        <NewsIn3Points resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} />

        {/* ===== ARTICLE BODY ===== */}
        <div
          className="article-body-pro drop-cap"
          style={{ fontSize: `${fontSize}em` }}
          dangerouslySetInnerHTML={{ __html: cleanHtml(noticia.contenido || '') }}
        />

        {/* ===== PULL QUOTE ===== */}
        <PullQuote contenido={noticia.contenido || ''} />

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
            <ShareChip href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(noticia.titulo)}`} label="✈️ Telegram" bg="#0088cc" icon="telegram" />
            <CopyButton url={url} />
          </div>
        </div>

        {/* ===== AUTHOR BIO (BBC/NYT style) ===== */}
        <div className="author-box-pro author-box-pro--enhanced">
          <div className="author-box-pro__avatar" style={{ background: catColor }}>
            {autorInicial}
          </div>
          <div className="author-box-pro__body">
            <div className="author-box-pro__name">{autor}</div>
            <div className="author-box-pro__role">
              {autor === 'Keyling Elieth Rivera Muñoz' ? 'Directora Editorial' : 'Periodista'} · {noticia.categoria}
            </div>
            <p className="author-box-pro__bio">
              {autor === 'Keyling Elieth Rivera Muñoz'
                ? 'Directora editorial y co-fundadora de Nicaragua Informate. Periodista con amplia trayectoria en cobertura de Sucesos, Nacionales, Deportes e Internacionales. Firme defensora del periodismo verificado y la independencia editorial.'
                : `Periodista de Nicaragua Informate. Especializado en la sección de ${noticia.categoria}. Comprometido con la información verificada y el análisis contextual.`}
            </p>
            <div className="author-box-pro__links">
              <Link href={autor === 'Keyling Elieth Rivera Muñoz' ? '/autor/keyling-rivera' : `/autor/${autor.toLowerCase().replace(/\s+/g, '-')}`} className="author-box-pro__link" rel="author">
                Más artículos →
              </Link>
            </div>
          </div>
        </div>

        {/* ===== RELATED ARTICLES ===== */}
        {related.length > 0 && (
          <div className="ni-related">
            <div className="ni-section-header">
              <span className="ni-section-accent" />
              <h3 className="ni-section-title">Otros están leyendo</h3>
            </div>
            <div className="ni-related-grid">
              {related.map((n) => (
                <Link key={n.slug} href={`/noticias/${n.slug}`} className="ni-related-card">
                  <article>
                    <div className="ni-related-img">
                      <ArticleImage src={n.imagen || '/logo.png'} alt={n.titulo} width={400} />
                    </div>
                    <div className="ni-related-body">
                      <span className="ni-related-cat" style={{ color: CAT_COLORS[n.categoria] || '#8c1d18' }}>
                        {n.categoria}
                      </span>
                      <h3 className="ni-related-title">{n.titulo}</h3>
                      <div className="ni-related-meta">
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

