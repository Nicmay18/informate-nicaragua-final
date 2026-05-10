'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/**
 * Constantes de configuración para el ticker
 */
const TICKER_DURATION_MS = 6000;
const TICKER_UPDATE_INTERVAL_MS = 100;
const BUTTON_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.12)', 
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff', 
  cursor: 'pointer', 
  width: 28, 
  height: 28, 
  borderRadius: 6,
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontSize: 11,
  transition: 'background 0.15s', 
  flexShrink: 0,
};

/**
 * Interfaz para item de noticia
 */
interface BreakingNewsItem {
  id: string;
  slug: string;
  titulo: string;
}

/**
 * Props para BreakingTicker
 */
interface BreakingTickerProps {
  noticias: BreakingNewsItem[];
}

/**
 * Componente de ticker de noticias urgentes
 * @param props Props del componente
 * @returns Ticker de noticias
 */
export default function BreakingTicker({ noticias }: BreakingTickerProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setProgress(0);
  }, []);

  const goNext = useCallback(() => goTo((current + 1) % noticias.length), [goTo, current, noticias.length]);
  const goPrev = useCallback(() => goTo((current - 1 + noticias.length) % noticias.length), [goTo, current, noticias.length]);

  useEffect(() => {
    if (paused || noticias.length <= 1) return;
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { 
          goNext(); 
          return 0; 
        }
        return p + (100 / (TICKER_DURATION_MS / TICKER_UPDATE_INTERVAL_MS));
      });
    }, TICKER_UPDATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, goNext, noticias.length]);

  if (noticias.length === 0) return null;

  return (
    <div
      style={{ background: 'linear-gradient(90deg,#8c1d18,#c41e3a)', color: '#fff', position: 'relative' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.15)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'rgba(255,255,255,0.65)', transition: 'width 0.1s linear' }} />
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, height: 34 }}>
        {/* Badge */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          <i className="fas fa-bolt" style={{ fontSize: 9 }} /> Última Hora
        </div>

        {/* Current headline */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/noticias/${noticias[current].slug}`}
            style={{ color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {noticias[current].titulo}
          </Link>
        </div>

        {/* Controls */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setPaused(p => !p)} style={BUTTON_STYLE} title={paused ? 'Reanudar' : 'Pausar'}>
            <i className={`fas fa-${paused ? 'play' : 'pause'}`} />
          </button>
          <button onClick={goPrev} style={BUTTON_STYLE}><i className="fas fa-chevron-left" /></button>
          <span style={{ fontSize: 11, minWidth: 38, textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontWeight: 700, flexShrink: 0 }}>
            {current + 1}/{noticias.length}
          </span>
          <button onClick={goNext} style={BUTTON_STYLE}><i className="fas fa-chevron-right" /></button>
        </div>
      </div>
    </div>
  );
}
