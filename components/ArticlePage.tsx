'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock, Eye, Play, Pause, Square, ArrowLeft, ArrowRight } from 'lucide-react';
import { getCategory, SITE_CONFIG } from '@/lib/constants';
import { timeAgo, tiempoLectura, fmtViews, formatDateES, stripHtml, extractPoints } from '@/lib/formateo';
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

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-gray-200" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-red-800 transition-all duration-150" style={{ width: `${progress}%` }} />
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

  return (
    <div className="my-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${isLoading ? 'bg-gray-400 cursor-wait' : 'bg-red-800 hover:bg-red-900'}`}
          aria-label={isPlaying ? 'Pausar' : isLoading ? 'Cargando' : 'Reproducir audio'}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {isLoading ? 'Generando audio profesional...' : isPlaying ? 'Reproduciendo noticia' : 'Escuchar noticia en voz profesional'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLoading ? 'Esto puede tomar unos segundos' : 'Voz generada con inteligencia artificial'}
          </p>
        </div>
        {isPlaying && (
          <button onClick={stop} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50" aria-label="Detener reproducción">
            <Square size={10} className="inline mr-1" fill="currentColor" />
            Detener
          </button>
        )}
      </div>
      {isPlaying && (
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-red-800 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      {errorMsg && (
        <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMsg}</p>
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
    <aside className="my-8 pl-6 border-l-4 border-red-800 py-2">
      <p className="text-xl font-serif italic text-gray-800 leading-relaxed">"{quote}."</p>
    </aside>
  );
}

/* ================================================================
   AD PLACEHOLDER
   ================================================================ */
function AdPlaceholder({ label, size }: { label: string; size: string }) {
  return (
    <div className="my-8 py-8 px-4 bg-gray-50 border border-gray-200 rounded-lg text-center" role="complementary" aria-label={label}>
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <p className="text-sm text-gray-500 mt-1">{size}</p>
    </div>
  );
}

/* ================================================================
   ARTICLE PAGE - CON PIE DE FOTO SIEMPRE VISIBLE
   ================================================================ */
interface ArticlePageProps {
  noticia: Noticia;
  related?: Noticia[];
}

export default function ArticlePage({ noticia, related = [] }: ArticlePageProps) {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(1);
  const FONT_STEPS = [0.9, 1, 1.1, 1.2];

  if (!noticia) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Noticia no encontrada</p>
        <button onClick={() => router.back()} className="mt-4 text-red-800 hover:underline">← Volver</button>
      </div>
    );
  }

  const category = getCategory(noticia.categoria);
  const url = `${SITE_CONFIG.url}/noticias/${noticia.slug}`;
  const lecturaMin = tiempoLectura(noticia.contenido || noticia.resumen || '');
  const vistas = fmtViews(noticia.vistas);
  const tags = [noticia.categoria, ...extractPoints(noticia.titulo, 3)];
  const readAlso = related.slice(0, 3);

  // Pie de foto con atribución por defecto si no existe en Firebase
  const pieDeFoto = noticia.pieFoto?.trim()
    ? noticia.pieFoto
    : 'Foto: Nicaragua Informate / Archivo';

  return (
    <>
      <ReadingProgress />
      <ShareBar url={url} title={noticia.titulo} variant="floating" />

      <article className="max-w-4xl mx-auto px-4 pt-6 pb-16" itemScope itemType="https://schema.org/NewsArticle">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4" aria-label="Miga de pan">
          <Link href="/" className="hover:text-red-800 transition-colors">Inicio</Link>
          <span>/</span>
          <Link href={`/categoria/${category.slug}`} className="hover:text-red-800 transition-colors">{category.name}</Link>
          <span>/</span>
          <span className="text-gray-400 truncate max-w-[200px]">{noticia.titulo}</span>
        </nav>

        {/* Category Badge */}
        <span className="inline-block px-3 py-1 text-xs font-bold text-white rounded-full mb-3" style={{ backgroundColor: category.color }} itemProp="articleSection">
          {category.name}
        </span>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4" itemProp="headline">
          {noticia.titulo}
        </h1>

        {/* Lead / Resumen */}
        {noticia.resumen && (
          <p className="text-lg text-gray-600 leading-relaxed mb-6" itemProp="description">
            {noticia.resumen}
          </p>
        )}

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 pb-4 mb-6 border-b border-gray-200">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden="true" />
            <time dateTime={noticia.fecha} itemProp="datePublished">{formatDateES(noticia.fecha)}</time>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} aria-hidden="true" />
            {lecturaMin} min de lectura
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={14} aria-hidden="true" />
            {vistas} vistas
          </span>
          {timeAgo(noticia.fecha) && (
            <span className="text-red-800 font-medium">{timeAgo(noticia.fecha)}</span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setFontSize(s => FONT_STEPS[Math.max(0, FONT_STEPS.indexOf(s) - 1)])} className="w-8 h-8 rounded border border-gray-200 text-sm font-bold hover:bg-gray-50" aria-label="Reducir texto">A−</button>
            <button onClick={() => setFontSize(s => FONT_STEPS[Math.min(FONT_STEPS.length - 1, FONT_STEPS.indexOf(s) + 1)])} className="w-8 h-8 rounded border border-gray-200 text-sm font-bold hover:bg-gray-50" aria-label="Aumentar texto">A+</button>
          </div>
        </div>

        {/* Imagen destacada */}
        {noticia.imagen && (
          <figure
            style={{ position: 'relative', width: '100%', maxHeight: 480, aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', marginBottom: 8, backgroundColor: '#f3f4f6' }}
            itemProp="image"
            itemScope
            itemType="https://schema.org/ImageObject"
          >
            <Image
              src={noticia.imagen}
              alt={noticia.titulo}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 800px"
              priority
              itemProp="url"
            />
            <meta itemProp="width" content="1200" />
            <meta itemProp="height" content="630" />
          </figure>
        )}

        {/* Pie de foto: SIEMPRE VISIBLE */}
        <figcaption className="text-xs text-gray-500 text-right mb-6 px-1 py-1 bg-gray-50 rounded">
          <span className="font-medium">{pieDeFoto}</span>
          {noticia.pieFoto?.trim() && (
            <span className="text-gray-400 ml-1">| Nicaragua Informate</span>
          )}
        </figcaption>

        {/* Audio */}
        <AudioButton titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} />

        {/* 3 Puntos Clave */}
        <KeyPoints titulo={noticia.titulo} resumen={noticia.resumen} contenido={noticia.contenido} categoria={noticia.categoria} />

        {/* Ad Top */}
        <AdPlaceholder label="Publicidad" size="In-article Top" />

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-red-800 prose-a:no-underline hover:prose-a:underline"
          style={{ fontSize: `${fontSize}em` }}
          itemProp="articleBody"
          dangerouslySetInnerHTML={{ __html: noticia.contenido || noticia.resumen || '' }}
        />

        {/* Pull Quote */}
        <PullQuote contenido={noticia.contenido || ''} />

        {/* Ad Mid */}
        <AdPlaceholder label="Publicidad" size="In-article Mid" />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {tags.map((tag, i) => (
              <Link key={i} href={`/buscar?q=${encodeURIComponent(tag)}`} className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <ShareBar url={url} title={noticia.titulo} variant="chips" />
        </div>

        {/* Author */}
        <div className="mt-8">
          <AuthorCard
            name={noticia.autor}
            publishedDate={noticia.fecha}
            updatedDate={(noticia as any).fechaActualizacion}
          />
        </div>

        {/* Navigation */}
        {readAlso.length > 0 && (
          <nav className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {readAlso[0] && (
              <Link href={`/noticias/${readAlso[0].slug}`} className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-red-200 transition-colors">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase mb-1">
                  <ArrowLeft size={14} /> Anterior
                </span>
                <p className="font-semibold text-gray-900 group-hover:text-red-800 transition-colors line-clamp-2">{readAlso[0].titulo}</p>
              </Link>
            )}
            {readAlso[1] && (
              <Link href={`/noticias/${readAlso[1].slug}`} className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-red-200 transition-colors md:text-right">
                <span className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-500 uppercase mb-1">
                  Siguiente <ArrowRight size={14} />
                </span>
                <p className="font-semibold text-gray-900 group-hover:text-red-800 transition-colors line-clamp-2">{readAlso[1].titulo}</p>
              </Link>
            )}
          </nav>
        )}

        {/* Related News */}
        {related.length > 3 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lea también</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.slice(3, 6).map(item => (
                <Link key={item.slug} href={`/noticias/${item.slug}`} className="group">
                  <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {item.imagen && (
                      <div className="relative aspect-video bg-gray-100">
                        <Image src={item.imagen} alt={item.titulo} fill className="object-cover" sizes="300px" loading="lazy" />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="text-xs font-semibold text-red-800">{item.categoria}</span>
                      <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-red-800 transition-colors">{item.titulo}</h3>
                      <time className="text-xs text-gray-500 mt-2 block" dateTime={item.fecha}>{formatDateES(item.fecha)}</time>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comments Placeholder */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comentarios (0)</h2>
          <textarea className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-red-800 focus:border-transparent" rows={4} placeholder="¿Qué opinas sobre esta noticia? Comparte tu perspectiva..." />
          <button className="mt-2 px-6 py-2 bg-red-800 text-white font-semibold rounded-lg hover:bg-red-900 transition-colors">Publicar comentario</button>
        </section>

        {/* Ad Bottom */}
        <AdPlaceholder label="Publicidad" size="728x90" />
      </article>
    </>
  );
}
