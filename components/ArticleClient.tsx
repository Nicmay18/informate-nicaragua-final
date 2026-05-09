'use client';

import { useState, useRef, useEffect } from 'react';

const FEMALE_NAMES = ['paulina','sabina','luciana','camila','mónica','paloma','helena','teresa','rosa','marisol','valeria','daniela','sofia','andrea','silvia','laura','claudia','natalia'];
const LATAM_LOCALES = ['es-MX','es-419','es-US','es-CL','es-CO','es-AR','es-PE'];
const MAX_CHUNK_LENGTH = 220;
const CHUNK_DELAY_MS = 60;
const ERROR_DELAY_MS = 80;
const VOICE_RETRY_DELAY_MS = 200;
const INITIAL_DELAY_MS = 100;
const BAR_HEIGHTS = [4,7,11,9,5,10,7,13,6,9,5,8] as const;

function pickVoice(): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const v1 = voices.find(v => LATAM_LOCALES.includes(v.lang) && FEMALE_NAMES.some(n => v.name.toLowerCase().includes(n)));
    if (v1) return v1;
    const v2 = voices.find(v => LATAM_LOCALES.includes(v.lang));
    if (v2) return v2;
    const v3 = voices.find(v => v.lang.startsWith('es') && FEMALE_NAMES.some(n => v.name.toLowerCase().includes(n)));
    if (v3) return v3;
    return voices.find(v => v.lang.startsWith('es')) || null;
  } catch { return null; }
}

function buildChunks(titulo: string, resumen: string, contenido: string): string[] {
  const clean = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
  const full = `${clean(titulo)}. ${clean(resumen)}. ${clean(contenido)}`;
  const parts = full.split(/(?<=[.!?¡¿])\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const p of parts) {
    if (!p.trim()) continue;
    if ((cur + ' ' + p).length < MAX_CHUNK_LENGTH) { cur = cur ? cur + ' ' + p : p; }
    else { if (cur) chunks.push(cur.trim()); cur = p; }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused';

export function AudioButton({ titulo, resumen, contenido }: { titulo: string; resumen: string; contenido: string }) {
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [curText, setCurText] = useState('');
  const chunksRef = useRef<string[]>([]);
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
  }, []);

  function playFrom(i: number) {
    const chunks = chunksRef.current;
    if (i >= chunks.length) { setStatus('idle'); setProgress(100); setCurText('✓ Lectura finalizada'); return; }
    idxRef.current = i;
    const u = new SpeechSynthesisUtterance(chunks[i]);
    u.lang = 'es-MX'; u.rate = 0.9; u.pitch = 1.08;
    const v = pickVoice(); if (v) u.voice = v;
    u.onstart = () => { setCurText(chunks[i]); setProgress(Math.round(((i + 1) / chunks.length) * 100)); setStatus('playing'); };
    u.onend = () => { timerRef.current = setTimeout(() => playFrom(i + 1), CHUNK_DELAY_MS); };
    u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') { timerRef.current = setTimeout(() => playFrom(i + 1), ERROR_DELAY_MS); } };
    window.speechSynthesis.speak(u);
  }

  function play() {
    if (!('speechSynthesis' in window)) return;
    setStatus('loading'); setProgress(0); setCurText('');
    chunksRef.current = buildChunks(titulo, resumen, contenido);
    idxRef.current = 0; window.speechSynthesis.cancel();
    const tryPlay = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) { timerRef.current = setTimeout(tryPlay, VOICE_RETRY_DELAY_MS); }
      else { playFrom(0); }
    };
    timerRef.current = setTimeout(tryPlay, INITIAL_DELAY_MS);
  }

  function pause() { if (timerRef.current) clearTimeout(timerRef.current); window.speechSynthesis.cancel(); setStatus('paused'); }
  function resume() { playFrom(idxRef.current); }
  function stop() { if (timerRef.current) clearTimeout(timerRef.current); window.speechSynthesis.cancel(); setStatus('idle'); setProgress(0); setCurText(''); idxRef.current = 0; }

  if (status === 'idle') return (
    <button onClick={play} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 24, boxShadow: '0 4px 16px rgba(140,29,24,0.3)', transition: 'all 0.2s' }}>
      <i className="fas fa-circle-play" style={{ fontSize: 18 }} /> Escuchar noticia completa
    </button>
  );

  return (
    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '16px 18px', marginBottom: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {status === 'playing' && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18 }}>
              {BAR_HEIGHTS.map((h, i) => (
                <span key={i} style={{ display: 'inline-block', width: 3, height: h, background: '#e53e3e', borderRadius: 1.5, animation: `wvbar ${0.5 + (i % 3) * 0.15}s ease-in-out ${i * 0.05}s infinite alternate` }} />
              ))}
            </div>
          )}
          {status === 'paused' && <i className="fas fa-pause-circle" style={{ color: '#fbbf24', fontSize: 18 }} />}
          {status === 'loading' && <i className="fas fa-circle-notch fa-spin" style={{ color: '#64748b', fontSize: 18 }} />}
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: status === 'playing' ? '#f87171' : '#64748b' }}>
            {status === 'playing' ? '▶ Reproduciendo' : status === 'paused' ? 'Pausado' : 'Cargando voz...'}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{progress}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#8c1d18,#ef4444)', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
      {curText && <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>{curText}</p>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {status === 'playing'
          ? <button onClick={pause} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e3a5f', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><i className="fas fa-pause" /> Pausar</button>
          : <button onClick={status === 'loading' ? undefined : resume} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#8c1d18', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><i className="fas fa-play" /> {status === 'paused' ? 'Reanudar' : 'Iniciar'}</button>
        }
        <button onClick={stop} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><i className="fas fa-stop" /> Detener</button>
      </div>
      <style>{`@keyframes wvbar { from { transform: scaleY(0.4) } to { transform: scaleY(1.6) } }`}</style>
    </div>
  );
}

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <button onClick={handleCopy} style={{ width: 44, height: 44, borderRadius: '50%', background: copied ? '#16a34a' : '#fffdf9', border: '1px solid #ddd6ce', display: 'grid', placeItems: 'center', cursor: 'pointer', color: copied ? '#fff' : '#756d66', fontSize: 16, transition: 'all 0.2s' }} title={copied ? '¡Copiado!' : 'Copiar enlace'}>
      {copied ? '✓' : '🔗'}
    </button>
  );
}

export function ShareChip({ href, label, bg }: { href: string; label: string; bg: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={(e) => { const el = e.currentTarget; el.style.backgroundColor = bg; el.style.color = 'white'; el.style.borderColor = bg; }}
      onMouseLeave={(e) => { const el = e.currentTarget; el.style.backgroundColor = '#fffdf9'; el.style.color = '#756d66'; el.style.borderColor = '#ddd6ce'; }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid #ddd6ce', background: '#fffdf9', color: '#756d66', transition: 'all 0.2s' }}>
      {label}
    </a>
  );
}

export function ShareSticky({ href, icon, color }: { href: string; icon: string; color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ width: 44, height: 44, borderRadius: '50%', background: color, display: 'grid', placeItems: 'center', textDecoration: 'none', color: '#fff', fontSize: 16, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
      <i className={`fab fa-${icon}`} />
    </a>
  );
}

export function SocialFooter({ href, icon }: { href: string; icon: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, textDecoration: 'none', transition: 'all 0.3s', border: '1px solid rgba(255,255,255,0.08)' }}>
      <i className={`fab fa-${icon}`} />
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
  destacada?: boolean;
  vistas?: number;
  palabras?: number;
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

function countWords(text: string): number { 
  return text?.trim()?.split(/\s+/).filter(w => w.length > 0).length || 0; 
}

function cleanNestedTags(html: string): string {
  if (!html) return '';
  let c = html.replace(/<p>\s*<p>/gi, '<p>').replace(/<\/p>\s*<\/p>/gi, '</p>');
  c = c.replace(/<b>\s*<b>/gi, '<b>').replace(/<\/b>\s*<\/b>/gi, '</b>');
  c = c.replace(/<strong>\s*<strong>/gi, '<strong>').replace(/<\/strong>\s*<\/strong>/gi, '</strong>');
  c = c.replace(/<i>\s*<i>/gi, '<i>').replace(/<\/i>\s*<\/i>/gi, '</i>');
  c = c.replace(/<em>\s*<em>/gi, '<em>').replace(/<\/em>\s*<\/em>/gi, '</em>');
  return c;
}

export default function ArticleClient({ noticia }: { noticia: NoticiaProps }) {
  if (!noticia) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Noticia no encontrada</div>;
  }

  const slug = noticia.slug || '';
  const url = `https://nicaraguainformate.com/noticias/${slug}`;
  const wordCount = countWords(noticia.contenido || '');
  const readTime = Math.ceil(wordCount / 200);
  const fechaStr = fmtDate(noticia.fecha);
  const autor = noticia.autor || 'Keyling Rivera M.';
  const autorInitial = autor.charAt(0).toUpperCase();
  const imgUrl = noticia.imagen || '/logo.png';

  const jsonLd = {
    '@context': 'https://schema.org', 
    '@type': 'NewsArticle',
    headline: noticia.titulo, 
    description: noticia.resumen || noticia.titulo,
    image: noticia.imagen || 'https://nicaraguainformate.com/logo.png',
    datePublished: noticia.fecha || new Date().toISOString(),
    author: { '@type': 'Person', name: autor },
    publisher: { 
      '@type': 'Organization', 
      name: 'Nicaragua Informate', 
      logo: { '@type': 'ImageObject', url: 'https://nicaraguainformate.com/logo.png' } 
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <main className="w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <article style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
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
              {autorInitial}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#121212' }}>{autor}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{readTime} min de lectura</div>
            </div>
          </div>

          {noticia.imagen && (
            <img 
              src={imgUrl} 
              alt={noticia.titulo}
              style={{ width: '100%', borderRadius: 8, marginBottom: 24, display: 'block' }} 
            />
          )}

          <AudioButton titulo={noticia.titulo} resumen={noticia.resumen || ''} contenido={noticia.contenido || ''} />

          <div 
            className="article-body" 
            style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.7, color: '#1a1a1a' }}
            dangerouslySetInnerHTML={{ __html: cleanNestedTags(noticia.contenido || '') }} 
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
              marginBottom: 12, 
              letterSpacing: '0.05em' 
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
