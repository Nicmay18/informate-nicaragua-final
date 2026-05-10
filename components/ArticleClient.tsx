'use client';

import { useState, useRef, useCallback } from 'react';
import { formatearNoticia, limpiarHtml } from '@/lib/formateo';

interface AudioButtonProps {
  titulo: string;
  resumen: string;
  contenido: string;
  articleId?: string;
}

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

      if (!data.success || !data.audioBase64) {
        throw new Error(data.error || 'Error generando audio');
      }

      const audio = new Audio(data.audioBase64);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        alert('Error reproduciendo el audio');
      };

      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
      startProgressTracker();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      alert('No se pudo generar el audio. Verifica tu conexión o la configuración de ElevenLabs.');
    }
  };

  const startProgressTracker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(Number.isFinite(pct) ? pct : 0);
      }
    }, 500);
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
    <div
      style={{
        margin: '0 0 32px',
        padding: '18px 22px',
        background: '#f7f4ee',
        border: '1px solid #ddd6ce',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: 'none',
            background: isLoading ? '#c6beb5' : isPlaying ? '#8c1d18' : '#8c1d18',
            color: '#fff',
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.2s',
          }}
        >
          {isLoading ? (
            <div
              style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          ) : (
            <i
              className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}
              style={{ fontSize: 18, marginLeft: isPlaying ? 0 : 2 }}
            />
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#18181b' }}>
            {isLoading
              ? 'Generando audio profesional...'
              : isPlaying
              ? 'Reproduciendo noticia'
              : 'Escuchar noticia en voz profesional'}
          </div>
          <div style={{ fontSize: 12, color: '#9f968d', marginTop: 3 }}>
            {isLoading
              ? 'Esto puede tomar unos segundos la primera vez'
              : 'Voz generada con inteligencia artificial'}
          </div>
        </div>

        {isPlaying && (
          <button
            onClick={stop}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #ddd6ce',
              background: '#fff',
              color: '#756d66',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <i className="fas fa-stop" style={{ fontSize: 10 }} /> Detener
          </button>
        )}
      </div>

      {(isPlaying || progress > 0) && (
        <div style={{ width: '100%', height: 4, background: '#e5e0d8', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#8c1d18',
              borderRadius: 2,
              transition: 'width 0.3s linear',
            }}
          />
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

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
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1px solid #e5e7eb',
        background: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: copied ? '#16a34a' : '#374151',
      }}
    >
      <i className={`fas ${copied ? 'fa-check' : 'fa-link'}`} style={{ fontSize: 14 }} />
    </button>
  );
}

export function ShareChip({ href, label, bg }: { href: string; label: string; bg: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: '8px 14px',
        borderRadius: 8,
        background: bg,
        color: '#fff',
        textDecoration: 'none',
        fontSize: 12,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {label}
    </a>
  );
}

export function ShareSticky({ href, icon, color }: { href: string; icon: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: '#fff',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <i className={`fab fa-${icon}`} style={{ fontSize: 15 }} />
    </a>
  );
}

export function SocialFooter({ href, icon }: { href: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        textDecoration: 'none',
      }}
    >
      <i className={`fab fa-${icon}`} style={{ fontSize: 13 }} />
    </a>
  );
}

type NoticiaProps = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido?: string;
  categoria: string;
  imagen: string;
  fecha: string;
  autor?: string;
};

const CAT_COLORS: Record<string, string> = { 
  Sucesos: '#dc2626', 
  Nacionales: '#1d4ed8', 
  Deportes: '#16a34a', 
  Internacionales: '#7c3aed', 
  Espectáculos: '#db2777' 
};

function fmtDate(ts: unknown): string {
  if (!ts) return 'Hace un momento';
  try {
    const d = typeof ts === 'string' ? new Date(ts) : new Date(String(ts));
    return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return 'Hace un momento'; }
}

function cleanHtml(html: string): string {
  if (!html) return '';
  // Si es texto plano, formatear como HTML
  if (!html.includes('<')) {
    return formatearNoticia(html);
  }
  // Si ya tiene HTML, limpiar y formatear
  return formatearNoticia(limpiarHtml(html));
}

export default function ArticleClient({ noticia }: { noticia: NoticiaProps }) {
  if (!noticia) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Noticia no encontrada</div>;
  }

  const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
  const fechaStr = fmtDate(noticia.fecha);
  const autor = noticia.autor || 'Keyling Rivera M.';

  return (
    <>
      <main className="w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <article style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              color: '#fff', 
              padding: '4px 10px', 
              background: CAT_COLORS[noticia.categoria] || '#8c1d18', 
              borderRadius: 3,
              display: 'inline-block',
              marginBottom: 12
            }}>
              {noticia.categoria || 'General'}
            </span>
            <span style={{ fontSize: 12, color: '#8c8c8c', display: 'block' }}>{fechaStr}</span>
          </div>

          <h1 style={{ 
            fontFamily: "Georgia, serif", 
            fontSize: 'clamp(24px, 5vw, 38px)', 
            fontWeight: 700, 
            color: '#121212', 
            lineHeight: 1.15, 
            marginBottom: 16 
          }}>
            {noticia.titulo}
          </h1>
          
          {noticia.resumen && (
            <p style={{ fontSize: 17, color: '#595959', lineHeight: 1.5, marginBottom: 20 }}>
              {noticia.resumen}
            </p>
          )}

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            marginBottom: 24, 
            padding: '12px 0', 
            borderTop: '1px solid #e2e2e2', 
            borderBottom: '1px solid #e2e2e2' 
          }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              background: '#8c1d18', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontWeight: 700, 
              fontSize: 14 
            }}>
              {autor.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#121212' }}>{autor}</div>
            </div>
          </div>

          {noticia.imagen && (
            <img 
              src={noticia.imagen} 
              alt={noticia.titulo}
              style={{ width: '100%', borderRadius: 8, marginBottom: 24, display: 'block' }} 
            />
          )}

          <AudioButton titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} articleId={noticia.id} />

          <div
            className="prose prose-invert max-w-none text-gray-300 text-lg leading-relaxed [&>p]:mb-6 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:border-red-900/30 first-letter:text-7xl first-letter:font-black first-letter:text-red-600 first-letter:mr-3 first-letter:float-left first-letter:leading-[0.7] first-letter:mt-3"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            dangerouslySetInnerHTML={{ __html: cleanHtml(noticia.contenido || '') }}
          />

          <div style={{ 
            margin: '40px 0', 
            padding: '24px 0', 
            borderTop: '1px solid #e2e2e2', 
            borderBottom: '1px solid #e2e2e2' 
          }}>
            <div style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              color: '#8c8c8c', 
              marginBottom: 12 
            }}>
              Compartir
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ShareChip href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} label="Facebook" bg="#1877f2" />
              <ShareChip href={`https://wa.me/?text=${encodeURIComponent(noticia.titulo + ' — ' + url)}`} label="WhatsApp" bg="#25d366" />
              <ShareChip href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(noticia.titulo)}`} label="Telegram" bg="#0088cc" />
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
