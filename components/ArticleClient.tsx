'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioButtonProps {
  titulo: string;
  resumen: string;
  contenido: string;
}

export function AudioButton({ titulo, resumen, contenido }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cleanText = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const fullText = `${titulo}. ${resumen ? resumen + '. ' : ''}${cleanText(contenido)}`;

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const spanishVoices = available.filter(v => v.lang.startsWith('es'));
      setVoices(spanishVoices.length ? spanishVoices : available);
      if (spanishVoices.length) {
        const preferred = spanishVoices.find(v => 
          v.name.includes('Google') || 
          v.name.includes('Sabina') || 
          v.name.includes('Elena') ||
          v.name.includes('Paulina') ||
          v.name.includes('Monica')
        );
        setSelectedVoice(preferred?.name || spanishVoices[0].name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const play = useCallback(() => {
    if (!window.speechSynthesis) {
      alert('Tu navegador no soporta lectura de noticias.');
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(fullText);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utter.voice = voice;
    
    utter.lang = 'es-NI';
    utter.rate = 0.95;
    utter.pitch = 1.02;
    
    utter.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utter.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utter.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [fullText, voices, selectedVoice]);

  const pause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (typeof window === 'undefined') return null;

  return (
    <div style={{ 
      margin: '0 0 32px', 
      padding: '16px 20px', 
      background: '#f7f4ee', 
      border: '1px solid #ddd6ce', 
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
        <div style={{ 
          width: 44, 
          height: 44, 
          borderRadius: '50%', 
          background: isPlaying ? '#8c1d18' : '#e5e0d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isPlaying ? '#fff' : '#8c1d18',
          transition: 'all 0.3s',
          flexShrink: 0
        }}>
          <i className={`fas ${isPlaying ? 'fa-volume-high' : 'fa-headphones'}`} style={{ fontSize: 16 }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b' }}>
            {isPlaying ? 'Escuchando noticia...' : 'Escuchar noticia'}
          </div>
          <div style={{ fontSize: 11, color: '#9f968d', marginTop: 2 }}>
            {isPlaying ? 'Voz en español' : 'Disponible sin conexión'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!isPlaying ? (
          <button 
            onClick={play}
            style={{ 
              padding: '8px 18px', 
              borderRadius: 8, 
              border: 'none', 
              background: '#8c1d18', 
              color: '#fff', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <i className="fas fa-play" style={{ fontSize: 10 }} /> Reproducir
          </button>
        ) : (
          <>
            {isPaused ? (
              <button 
                onClick={resume}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #8c1d18', background: '#fff', color: '#8c1d18', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                <i className="fas fa-play" style={{ fontSize: 10 }} /> Continuar
              </button>
            ) : (
              <button 
                onClick={pause}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #8c1d18', background: '#fff', color: '#8c1d18', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                <i className="fas fa-pause" style={{ fontSize: 10 }} /> Pausar
              </button>
            )}
            <button 
              onClick={stop}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd6ce', background: '#fff', color: '#756d66', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              <i className="fas fa-stop" style={{ fontSize: 10 }} /> Detener
            </button>
          </>
        )}

        {voices.length > 1 && (
          <select 
            value={selectedVoice}
            onChange={(e) => {
              setSelectedVoice(e.target.value);
              if (isPlaying) {
                stop();
                setTimeout(play, 100);
              }
            }}
            style={{ 
              padding: '8px 10px', 
              borderRadius: 8, 
              border: '1px solid #ddd6ce', 
              background: '#fff', 
              fontSize: 12, 
              color: '#4b5563',
              maxWidth: 160
            }}
            title="Seleccionar voz"
          >
            {voices.map(v => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
        )}
      </div>
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
    <button onClick={handleCopy} title="Copiar enlace" style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#16a34a' : '#374151' }}>
      <i className={`fas ${copied ? 'fa-check' : 'fa-link'}`} style={{ fontSize: 14 }} />
    </button>
  );
}

export function ShareChip({ href, label, bg }: { href: string; label: string; bg: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px', borderRadius: 8, background: bg, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {label}
    </a>
  );
}

export function ShareSticky({ href, icon, color }: { href: string; icon: string; color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <i className={`fab fa-${icon}`} style={{ fontSize: 15 }} />
    </a>
  );
}

export function SocialFooter({ href, icon }: { href: string; icon: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none' }}>
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
  return html.replace(/<p>\s*<p>/gi, '<p>').replace(/<\/p>\s*<\/p>/gi, '</p>');
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

          <AudioButton titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} />

          <div 
            style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.7, color: '#1a1a1a' }}
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
