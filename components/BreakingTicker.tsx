'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

const DURATION_MS = 12000;

interface BreakingNewsItem { id: string; slug: string; titulo: string; }
interface BreakingTickerProps { noticias: BreakingNewsItem[]; }

export default function BreakingTicker({ noticias }: BreakingTickerProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const animRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goNext = useCallback(() => {
    setCurrent(prev => (prev + 1) % noticias.length);
  }, [noticias.length]);

  const goPrev = useCallback(() => {
    setCurrent(prev => (prev - 1 + noticias.length) % noticias.length);
  }, [noticias.length]);

  useEffect(() => {
    if (paused || noticias.length <= 1) return;
    timerRef.current = setTimeout(goNext, DURATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, goNext, noticias.length]);

  if (noticias.length === 0) return null;

  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    cursor: 'pointer',
    width: 40,
    height: 40,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    transition: 'background 0.15s',
    flexShrink: 0,
    padding: 0,
  };

  return (
    <div
      style={{ background: '#1a1a2e', color: '#fff', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* CSS progress bar — zero JS repaints */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
        <div
          ref={animRef}
          key={current + (paused ? '-paused' : '')}
          style={{
            height: '100%',
            width: paused ? `${timerRef.current ? 0 : 100}%` : '100%',
            background: 'rgba(255,255,255,0.65)',
            animation: paused ? 'none' : `ticker-progress ${DURATION_MS}ms linear forwards`,
          }}
        />
      </div>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, height: 34 }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 9 }}>&#9889;</span> Última Hora
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/noticias/${noticias[current].slug}`}
            style={{ color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {noticias[current].titulo}
          </Link>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setPaused(p => !p)} style={btnStyle} title={paused ? 'Reanudar' : 'Pausar'} aria-label={paused ? 'Reanudar' : 'Pausar'}>
            {paused ? <Play size={12} fill="#fff" /> : <Pause size={12} fill="#fff" />}
          </button>
          <button onClick={goPrev} style={btnStyle} aria-label="Noticia anterior"><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 11, minWidth: 38, textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontWeight: 700, flexShrink: 0 }}>
            {current + 1}/{noticias.length}
          </span>
          <button onClick={goNext} style={btnStyle} aria-label="Noticia siguiente"><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
