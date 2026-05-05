'use client';
import { useState, useRef, useEffect } from 'react';

/* ─── Voice selection: prefer female Latin-American Spanish ─── */
const FEMALE_NAMES = ['paulina','sabina','luciana','camila','mónica','paloma','helena','teresa','rosa','marisol','valeria','daniela','sofia','andrea','silvia','laura','claudia','natalia'];

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const LATAM = ['es-MX','es-419','es-US','es-CL','es-CO','es-AR','es-PE'];
  // 1. Named female + Latin American
  const v1 = voices.find(v => LATAM.includes(v.lang) && FEMALE_NAMES.some(n => v.name.toLowerCase().includes(n)));
  if (v1) return v1;
  // 2. Any Latin American Spanish
  const v2 = voices.find(v => LATAM.includes(v.lang));
  if (v2) return v2;
  // 3. Named female in any Spanish
  const v3 = voices.find(v => v.lang.startsWith('es') && FEMALE_NAMES.some(n => v.name.toLowerCase().includes(n)));
  if (v3) return v3;
  // 4. Any Spanish
  return voices.find(v => v.lang.startsWith('es')) || null;
}

/* ─── Split full text into ~200-char sentence chunks ─── */
function buildChunks(titulo: string, resumen: string, contenido: string): string[] {
  const clean = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
  const full = `${clean(titulo)}. ${clean(resumen)}. ${clean(contenido)}`;
  const parts = full.split(/(?<=[.!?¡¿])\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const p of parts) {
    if (!p.trim()) continue;
    if ((cur + ' ' + p).length < 220) { cur = cur ? cur + ' ' + p : p; }
    else { if (cur) chunks.push(cur.trim()); cur = p; }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

export function AudioButton({ titulo, resumen, contenido }: { titulo: string; resumen: string; contenido: string }) {
  const [status, setStatus] = useState<'idle'|'loading'|'playing'|'paused'>('idle');
  const [progress, setProgress] = useState(0);
  const [curText, setCurText] = useState('');
  const chunksRef  = useRef<string[]>([]);
  const idxRef     = useRef(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
  }, []);

  function playFrom(i: number) {
    const chunks = chunksRef.current;
    if (i >= chunks.length) { setStatus('idle'); setProgress(100); setCurText('✓ Lectura finalizada'); return; }
    idxRef.current = i;
    const u = new SpeechSynthesisUtterance(chunks[i]);
    u.lang  = 'es-MX';
    u.rate  = 0.9;
    u.pitch = 1.08;
    const v = pickVoice(); if (v) u.voice = v;
    u.onstart = () => { setCurText(chunks[i]); setProgress(Math.round(((i + 1) / chunks.length) * 100)); setStatus('playing'); };
    u.onend   = () => { timerRef.current = setTimeout(() => playFrom(i + 1), 60); };
    u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') timerRef.current = setTimeout(() => playFrom(i + 1), 80); };
    window.speechSynthesis.speak(u);
  }

  function play() {
    if (!('speechSynthesis' in window)) return;
    setStatus('loading'); setProgress(0); setCurText('');
    chunksRef.current = buildChunks(titulo, resumen, contenido);
    idxRef.current = 0;
    window.speechSynthesis.cancel();
    const tryPlay = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) { timerRef.current = setTimeout(tryPlay, 200); } else { playFrom(0); }
    };
    timerRef.current = setTimeout(tryPlay, 100);
  }

  function pause() {
    if (timerRef.current) clearTimeout(timerRef.current);
    window.speechSynthesis.cancel();
    setStatus('paused');
  }

  function resume() { playFrom(idxRef.current); }

  function stop() {
    if (timerRef.current) clearTimeout(timerRef.current);
    window.speechSynthesis.cancel();
    setStatus('idle'); setProgress(0); setCurText(''); idxRef.current = 0;
  }

  /* ── Idle button ── */
  if (status === 'idle') return (
    <button onClick={play} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 24, boxShadow: '0 4px 16px rgba(140,29,24,0.3)', transition: 'all 0.2s' }}>
      <i className="fas fa-circle-play" style={{ fontSize: 18 }} /> Escuchar noticia completa
    </button>
  );

  /* ── Active player ── */
  const BAR_H = [4,7,11,9,5,10,7,13,6,9,5,8];
  return (
    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '16px 18px', marginBottom: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', color: '#fff' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {status === 'playing' && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18 }}>
              {BAR_H.map((h, i) => (
                <span key={i} style={{ display: 'inline-block', width: 3, height: h, background: '#e53e3e', borderRadius: 1.5, animation: `wvbar ${0.5 + (i % 3) * 0.15}s ease-in-out ${i * 0.05}s infinite alternate` }} />
              ))}
            </div>
          )}
          {status === 'paused'  && <i className="fas fa-pause-circle" style={{ color: '#fbbf24', fontSize: 18 }} />}
          {status === 'loading' && <i className="fas fa-circle-notch fa-spin" style={{ color: '#64748b', fontSize: 18 }} />}
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: status === 'playing' ? '#f87171' : '#64748b' }}>
            {status === 'playing' ? '▶ Reproduciendo — Locutora' : status === 'paused' ? 'Pausado' : 'Cargando voz...'}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{progress}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#8c1d18,#ef4444)', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>

      {/* Current sentence */}
      {curText && (
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>
          {curText}
        </p>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {status === 'playing'
          ? <button onClick={pause}  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e3a5f', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><i className="fas fa-pause" /> Pausar</button>
          : <button onClick={status === 'loading' ? undefined : resume} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#8c1d18', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><i className="fas fa-play" /> {status === 'paused' ? 'Reanudar' : 'Iniciar'}</button>
        }
        <button onClick={stop} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><i className="fas fa-stop" /> Detener</button>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fas fa-microphone-lines" /> Voz femenina · es-MX</span>
      </div>

      <style>{`@keyframes wvbar { from { transform: scaleY(0.4) } to { transform: scaleY(1.6) } }`}</style>
    </div>
  );
}

export function CopyButton({ url }: { url: string }) {
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(url)}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: '#fffdf9',
        border: '1px solid #ddd6ce',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        color: '#756d66',
        fontSize: 16,
      }}
      title="Copiar enlace"
    >
      🔗
    </button>
  );
}

export function ShareChip({ href, label, bg }: { href: string; label: string; bg: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = bg;
        el.style.color = 'white';
        el.style.borderColor = bg;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = '#fffdf9';
        el.style.color = '#756d66';
        el.style.borderColor = '#ddd6ce';
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        border: '1px solid #ddd6ce',
        background: '#fffdf9',
        color: '#756d66',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </a>
  );
}

export function ShareSticky({ href, icon, color }: { href: string; icon: string; color: string }) {
  const isSolid = icon === 'link';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = color;
        el.style.color = '#fff';
        el.style.transform = 'scale(1.1)';
        el.style.boxShadow = `0 4px 12px ${color}55`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = color;
        el.style.color = '#fff';
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      }}
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: color,
        display: 'grid',
        placeItems: 'center',
        textDecoration: 'none',
        color: '#fff',
        fontSize: 16,
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <i className={`${isSolid ? 'fas' : 'fab'} fa-${icon}`} />
    </a>
  );
}

export function SocialFooter({ href, icon }: { href: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = '#fffdf9';
        el.style.background = 'rgba(255,255,255,0.08)';
        el.style.borderColor = '#5b5b5f';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = '#756d66';
        el.style.background = 'transparent';
        el.style.borderColor = 'transparent';
        el.style.transform = 'translateY(0)';
      }}
      style={{
        color: '#756d66',
        fontSize: 18,
        transition: 'all 0.2s',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '1px solid transparent',
        textDecoration: 'none',
      }}
    >
      <i className={`fab fa-${icon}`} />
    </a>
  );
}
