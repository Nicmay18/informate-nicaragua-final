'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Clock, Eye, Check, Link2, Play, Pause, Square, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import BrandIcon from '@/components/BrandIcon';
import { formatearNoticia, limpiarHtml, tiempoLectura, formatDateES } from '@/lib/formateo';
import { injectTocIds } from '@/lib/toc';
import { FALLBACK_IMAGE } from '@/lib/types';
import LutoImage from '@/components/LutoImage';

function ArticleImage({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  const validSrc = src?.trim();
  const isValid = validSrc && (validSrc.startsWith('http') || validSrc.startsWith('/') || validSrc.startsWith('data:'));
  const imgSrc = isValid ? validSrc : FALLBACK_IMAGE;

  if (priority) {
    /* Imagen principal del artículo: Next.js Image para LCP optimizado */
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 800px"
        priority
        onError={() => { /* Next.js maneja fallback internamente */ }}
      />
    );
  }

  /* Imágenes pequeñas (relacionadas): Next.js Image con lazy loading */
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 400px"
      loading="lazy"
      onError={() => { /* Next.js maneja fallback internamente */ }}
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
  serverNow?: number;
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

const slugifyCategory = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

/* ================================================================
   AUDIO BUTTON (reproductor con ondas animadas)
   ================================================================ */
const WAVE_BARS = [6, 12, 8, 16, 10, 14, 7, 18, 9, 13, 11, 15, 8, 12, 6];

export function AudioButton({ titulo, resumen, contenido, articleId = '' }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

      // Mostrar error suave en UI
      if (serverMsg.includes('API Key') || serverMsg.includes('no configurada')) {
        setErrorMsg('Servicio de voz no configurado. Contacte al administrador.');
      } else if (serverMsg.includes('Network') || serverMsg.includes('fetch')) {
        setErrorMsg('Error de conexión. Verifique su internet e intente de nuevo.');
      } else {
        setErrorMsg('No se pudo generar el audio: ' + serverMsg);
      }
      setTimeout(() => setErrorMsg(''), 6000);
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
      {errorMsg && (
        <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca' }}>
          {errorMsg}
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
function timeAgo(dateStr: string, nowOverride?: number): string {
  try {
    const now = typeof nowOverride === 'number' ? nowOverride : Date.now();
    const mins = Math.floor((now - new Date(dateStr).getTime()) / 60000);
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
        <Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} /> La noticia en {pts.length} puntos clave
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
      <p className="pull-quote-text">“{quote}.”</p>
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
      <a href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(titulo)}`} target="_blank" rel="noopener noreferrer" className="floating-share__btn" style={{ background: '#000000' }} aria-label="X"><BrandIcon name="x-twitter" size={14} /></a>
      <a href={`https://wa.me/?text=${enc(titulo + ' — ' + url)}`} target="_blank" rel="noopener noreferrer" className="floating-share__btn" style={{ background: '#128c7e' }} aria-label="WhatsApp"><BrandIcon name="whatsapp" size={14} /></a>
      <a href={`https://t.me/share/url?url=${enc(url)}&text=${enc(titulo)}`} target="_blank" rel="noopener noreferrer" className="floating-share__btn" style={{ background: '#0066aa' }} aria-label="Telegram"><BrandIcon name="telegram" size={14} /></a>
      <button onClick={copy} className="floating-share__btn" style={{ background: copied ? '#059669' : '#4b5563' }} aria-label="Copiar enlace">
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
  serverNow,
}: ArticleClientProps) {
  const FONT_STEPS = [0.9, 1, 1.1, 1.2];
  const [fontIndex, setFontIndex] = useState(1); // índice 1 = tamaño normal (1em)
  const fontSize = FONT_STEPS[fontIndex];

  if (!noticia) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Noticia no encontrada</div>;
  }

  const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
  const fechaStr = fmtDate(noticia.fecha);
  const ago = timeAgo(noticia.fecha, serverNow);
  const rawAutor = (noticia.autor || '').trim();
  const autor = rawAutor && rawAutor.toLowerCase() !== 'directora editorial' ? rawAutor : 'Keyling Elieth Rivera Muñoz';
  const autorInicial = autor.charAt(0).toUpperCase();
  const autorFoto = autor === 'Keyling Elieth Rivera Muñoz' ? '/keyling-rivera.jpg' : null;
  const autorSlug = autor === 'Keyling Elieth Rivera Muñoz' ? 'keyling-eliet-rivera-munoz' : undefined;
  const autorRole = autor === 'Keyling Elieth Rivera Muñoz' ? 'Directora Editorial' : 'Periodista';
  const lecturaMin = tiempoLectura(noticia.contenido || noticia.resumen);
  const vistas = fmtViews(noticia.vistas);
  const catColor = CAT_COLORS[noticia.categoria] || '#8c1d18';
  const tags = extractTags(noticia.categoria, noticia.titulo);
  const categorySlug = `/categoria/${slugifyCategory(noticia.categoria || 'actualidad')}`;
  const publishedISO = noticia.fecha || new Date().toISOString();
  const updatedISO = (noticia as { fechaActualizacion?: string }).fechaActualizacion || noticia.fecha || publishedISO;
  const readAlso = related.slice(0, 3);
  const moreFromCategory = related.slice(3, 6);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(noticia.titulo);
  const encodedShareCopy = encodeURIComponent(`${noticia.titulo} — ${url}`);
  const isUpdated = false; // Desactivado temporalmente para ocultar fecha de corrección en lote de noticias históricas

  // Procesar TOC para artículos largos
  const { html: processedHtml, items: tocItems } = injectTocIds(noticia.contenido || '');
  const showToc = tocItems.length >= 3;

  return (
    <div suppressHydrationWarning>
      <ReadingProgress />
      <FloatingShare url={url} titulo={noticia.titulo} />
      <div className="article-page"><main className="article-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 40px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '32px', alignItems: 'start' }}>
        <div>
        <div className="breadcrumbs">
          <Link href="/">Inicio</Link> / <Link href={categorySlug}>{noticia.categoria}</Link> / <span>{noticia.titulo}</span>
        </div>
        <div className="article-content">
          <header>
            <span className="article-tag" style={{ background: catColor }} itemProp="articleSection">
              {noticia.categoria}
            </span>
            <h1 className="article-title" itemProp="headline">{noticia.titulo}</h1>
            {noticia.resumen && (
              <p className="article-lead" itemProp="description">{noticia.resumen}</p>
            )}
            <div className="article-meta" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'10px 16px', paddingTop:16, borderTop:'1px solid var(--c-border,#e5e7eb)' }}>
              <div className="article-author" style={{ display:'flex', alignItems:'center', gap:10, flex:'1 1 auto', minWidth:0 }}>
                <div className="author-avatar" style={{ background:catColor, width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:16, flexShrink:0, overflow:'hidden' }}>
                  {autorFoto ? <img src={autorFoto} alt={autor} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : autorInicial}
                </div>
                <div className="author-info" style={{ display:'flex', flexDirection:'column', gap:2, minWidth:0, overflow:'hidden' }}>
                  <div itemProp="author" itemScope itemType="https://schema.org/Person" style={{minWidth:0}}>
                    {autorSlug ? (
                      <Link href={`/autor/${autorSlug}`} rel="author" className="author-name" itemProp="name" style={{ color:'var(--c-accent)', textDecoration:'none', fontWeight:700, fontSize:14 }}>{autor}</Link>
                    ) : (
                      <span className="author-name" itemProp="name" style={{ fontWeight:700, fontSize:14 }}>{autor}</span>
                    )}
                  </div>
                  <span className="author-role" style={{ fontSize:12, color:'var(--c-text-muted,#6b7280)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{autorRole}</span>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px 16px', flexWrap:'wrap', flex:'1 1 auto', justifyContent:'flex-end' }}>
                {ago && <span style={{ fontSize:13, color:'var(--c-accent)', fontWeight:700, display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>🕐 {ago}</span>}
                <time dateTime={publishedISO} itemProp="datePublished" style={{ fontSize:13, color:'var(--c-text-muted)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}><CalendarDays size={12} /> {fechaStr}</time>
                {isUpdated && <time dateTime={updatedISO} itemProp="dateModified" className="article-updated" style={{ fontSize:12, color:'var(--c-text-muted)', whiteSpace:'nowrap' }}>Actualizado</time>}
                <span style={{ fontSize:13, color:'var(--c-text-muted)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}><Clock size={12} /> {lecturaMin} min</span>
                <span style={{ fontSize:13, color:'var(--c-text-muted)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}><Eye size={12} /> {vistas}</span>
                <div className="font-size-ctrl" style={{ display:'flex', gap:4 }}>
                  <button className="font-size-ctrl__btn" onClick={() => setFontIndex(i => Math.max(0, i - 1))} aria-label="Reducir texto" title="A−">A−</button>
                  <button className="font-size-ctrl__btn" onClick={() => setFontIndex(i => Math.min(FONT_STEPS.length - 1, i + 1))} aria-label="Aumentar texto" title="A+">A+</button>
                </div>
              </div>
            </div>
          </header>

          <figure className="article-hero" itemProp="image" itemScope itemType="https://schema.org/ImageObject">
            {isLuto ? (
              <LutoImage
                src={noticia.imagen || '/logo.svg'}
                alt={noticia.titulo}
                nombre={noticia.titulo.split(':')[0] || noticia.titulo.split('–')[0]}
                className="featured-image-wrapper"
              />
            ) : noticia.imagen && (noticia.imagen.startsWith('http') || noticia.imagen.startsWith('/')) ? (
              <div className="featured-image-wrap" style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                <Image
                  src={noticia.imagen}
                  alt={noticia.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                  itemProp="url"
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
              <div className="article-caption">
                📷 Nicaragua Informate
              </div>
            )}
          </figure>

          <AudioButton titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} articleId={noticia.id} />
          <NewsIn3Points resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} />

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

          <div
            className="article-body"
            style={{ fontSize: `${fontSize}em` }}
            itemProp="articleBody"
            dangerouslySetInnerHTML={{ __html: cleanHtml(processedHtml) }}
          />

          <PullQuote contenido={noticia.contenido || ''} />

          <div className="article-tags">
            {tags.map(tag => (
              <Link key={tag} href={`/buscar?q=${encodeURIComponent(tag)}`} className="article-tag-link">#{tag}</Link>
            ))}
          </div>

          {(readAlso[0] || readAlso[1]) && (
            <div className="article-nav">
              {readAlso[0] && (
                <Link href={`/noticias/${readAlso[0].slug}`} className="article-nav-card">
                  <div className="article-nav-label"><ArrowLeft size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Anterior</div>
                  <div className="article-nav-title">{readAlso[0].titulo}</div>
                </Link>
              )}
              {readAlso[1] && (
                <Link href={`/noticias/${readAlso[1].slug}`} className="article-nav-card next">
                  <div className="article-nav-label">Siguiente <ArrowRight size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }} /></div>
                  <div className="article-nav-title">{readAlso[1].titulo}</div>
                </Link>
              )}
            </div>
          )}

          <div className="comments-section">
            <h3 className="comments-header">Comentarios (0)</h3>
            <textarea className="comment-box" placeholder="Escribe tu comentario..."></textarea>
            <button className="comment-submit">Publicar comentario</button>
          </div>

          <aside className="share-bar">
            <span>Compartir:</span>
            <div className="share-buttons">
              <ShareChip href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} label="Facebook" bg="#1877f2" icon="facebook-f" />
              <ShareChip href={`https://wa.me/?text=${encodedShareCopy}`} label="WhatsApp" bg="#128c7e" icon="whatsapp" />
              <ShareChip href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} label="X / Twitter" bg="#0f172a" icon="x-twitter" />
              <ShareChip href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} label="Telegram" bg="#0066aa" icon="telegram" />
              <CopyButton url={url} />
            </div>
          </aside>

          <div className="author-box-pro author-box-pro--enhanced" itemProp="author" itemScope itemType="https://schema.org/Person">
            <div className="author-box-pro__avatar" style={{ background: catColor, overflow: 'hidden', padding: 0 }}>
              {autorFoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={autorFoto} alt={autor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : autorInicial}
            </div>
            <div className="author-box-pro__body">
              <div className="author-box-pro__name" itemProp="name">{autor}</div>
              <div className="author-box-pro__role">
                {autor === 'Keyling Elieth Rivera Muñoz' ? 'Directora Editorial y Cofundadora' : 'Periodista'} · {noticia.categoria}
              </div>
              <p className="author-box-pro__bio">
                {autor === 'Keyling Elieth Rivera Muñoz'
                  ? 'Directora editorial y cofundadora de Nicaragua Informate. Especializada en cobertura de Sucesos, Nacionales, Deportes e Internacionales. Comprometida con una cobertura responsable, clara y cercana a la audiencia nicaragüense.'
                  : `Periodista de Nicaragua Informate. Especializado en la sección de ${noticia.categoria}. Comprometido con la información verificada y el análisis contextual.`}
              </p>
              <div className="author-box-pro__links">
                <Link href={autor === 'Keyling Elieth Rivera Muñoz' ? '/autor/keyling-rivera' : `/autor/${autor.toLowerCase().replace(/\s+/g, '-')}`} className="author-box-pro__link" rel="author">
                  Más artículos <ArrowRight size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }} />
                </Link>
              </div>
            </div>
          </div>

          <NewsletterInline />

          {readAlso.length >= 1 && (
            <section className="related-posts">
              <h3>Lea también</h3>
              <div className="related-grid">
                {readAlso.map(item => (
                  <Link key={item.slug} href={`/noticias/${item.slug}`}>
                    <article>
                      <div className="related-thumb">
                        <ArticleImage src={item.imagen} alt={item.titulo} />
                      </div>
                      <div className="related-body">
                        <span>{item.categoria}</span>
                        <h4>{item.titulo}</h4>
                        <time dateTime={item.fecha}>{fmtDate(item.fecha)}</time>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {moreFromCategory.length >= 1 && (
            <section className="more-from-category">
              <h3>Más de {noticia.categoria}</h3>
              <div className="related-grid">
                {moreFromCategory.map(item => (
                  <Link key={item.slug} href={`/noticias/${item.slug}`}>
                    <article>
                      <div className="related-thumb">
                        <ArticleImage src={item.imagen} alt={item.titulo} />
                      </div>
                      <div className="related-body">
                        <span>{item.categoria}</span>
                        <h4>{item.titulo}</h4>
                        <time dateTime={item.fecha}>{fmtDate(item.fecha)}</time>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
          </div>
        </div>

        <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '340px', width: '340px' }}>
          {readAlso.length > 0 && (
            <div className="sidebar-widget">
              <h3 className="widget-title">Artículos Relacionados</h3>
              <div className="related-list">
                {readAlso.map(item => (
                  <Link key={item.slug} href={`/noticias/${item.slug}`} className="related-item">
                    <img src={item.imagen || '/logo.png'} alt={item.titulo} className="related-thumb" />
                    <div className="related-content">
                      <div className="related-tag">{item.categoria}</div>
                      <div className="related-title">{item.titulo}</div>
                      <div className="related-meta">{fmtDate(item.fecha)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main></div>
    </div>
  );
}

/* ===== NEWSLETTER INLINE ===== */
function NewsletterInline() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ni_newsletter') || '[]'); } catch { return []; }
  });
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    const updated = [...saved, email];
    setSaved(updated);
    try { localStorage.setItem('ni_newsletter', JSON.stringify(updated)); } catch {}
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 4000);
  };
  return (
    <div className="article-newsletter">
      <h3 className="article-newsletter__title">Reciba las noticias importantes</h3>
      <p className="article-newsletter__desc">Reciba cada mañana un resumen con las noticias más relevantes de Nicaragua.</p>
      <form className="article-newsletter__form" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="su@email.com"
          className="article-newsletter__input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="article-newsletter__btn">{submitted ? '¡Suscrito!' : 'Suscribirse'}</button>
      </form>
    </div>
  );
}
