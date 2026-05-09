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
  } catch (error) {
    console.error('[pickVoice]', error instanceof Error ? error.message : String(error));
    return null;
  }
}

function buildChunks(titulo: string, resumen: string, contenido: string): string[] {
  const clean = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
  const full = `${clean(titulo)}. ${clean(resumen)}. ${clean(contenido)}`;
  const parts = full.split(/(?<=[.!?¡¿])\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const p of parts) {
    if (!p.trim()) continue;
    if ((cur + ' ' + p).length < MAX_CHUNK_LENGTH) { 
      cur = cur ? cur + ' ' + p : p; 
    } else { 
      if (cur) chunks.push(cur.trim()); 
      cur = p; 
    }
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
    if (i >= chunks.length) { 
      setStatus('idle'); 
      setProgress(100); 
      setCurText('✓ Lectura finalizada'); 
      return; 
    }
    idxRef.current = i;
    const u = new SpeechSynthesisUtterance(chunks[i]);
    u.lang = 'es-MX';
    u.rate = 0.9;
    u.pitch = 1.08;
    const v = pickVoice(); 
    if (v) u.voice = v;
    u.onstart = () => { 
      setCurText(chunks[i]); 
      setProgress(Math.round(((i + 1) / chunks.length) * 100)); 
      setStatus('playing'); 
    };
    u.onend = () => { 
      timerRef.current = setTimeout(() => playFrom(i + 1), CHUNK_DELAY_MS); 
    };
    u.onerror = (e) => { 
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error('[AudioButton] Speech synthesis error:', e.error);
        timerRef.current = setTimeout(() => playFrom(i + 1), ERROR_DELAY_MS); 
      }
    };
    window.speechSynthesis.speak(u);
  }

  function play() {
    if (!('speechSynthesis' in window)) {
      console.warn('[AudioButton] Speech synthesis not supported');
      return;
    }
    setStatus('loading'); 
    setProgress(0); 
    setCurText('');
    chunksRef.current = buildChunks(titulo, resumen, contenido);
    idxRef.current = 0;
    window.speechSynthesis.cancel();
    const tryPlay = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (!v.length) { 
          timerRef.current = setTimeout(tryPlay, VOICE_RETRY_DELAY_MS); 
        } else { 
          playFrom(0); 
        }
      } catch (error) {
        console.error('[AudioButton] Error getting voices:', error instanceof Error ? error.message : String(error));
      }
    };
    timerRef.current = setTimeout(tryPlay, INITIAL_DELAY_MS);
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
    setStatus('idle'); 
    setProgress(0); 
    setCurText(''); 
    idxRef.current = 0;
  }

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
            {status === 'playing' ? '▶ Reproduciendo — Locutora' : status === 'paused' ? 'Pausado' : 'Cargando voz...'}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{progress}%</span>
      </div>

      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#8c1d18,#ef4444)', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>

      {curText && (
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>
          {curText}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {status === 'playing'
          ? <button onClick={pause} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e3a5f', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><i className="fas fa-pause" /> Pausar</button>
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('[CopyButton]', error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: copied ? '#16a34a' : '#fffdf9',
        border: '1px solid #ddd6ce',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        color: copied ? '#fff' : '#756d66',
        fontSize: 16,
        transition: 'all 0.2s',
      }}
      title={copied ? '¡Copiado!' : 'Copiar enlace'}
      aria-label={copied ? 'Enlace copiado' : 'Copiar enlace al portapapeles'}
    >
      {copied ? '✓' : '🔗'}
    </button>
  );
}
