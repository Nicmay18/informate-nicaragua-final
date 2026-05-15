'use client';

import { useEffect, useRef, useState } from 'react';

interface AdSlotProps {
  slot: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
}

export default function AdSlot({
  slot,
  width = 336,
  height = 280,
  className = '',
  style = {},
  format = 'auto',
}: AdSlotProps) {
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const insRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Solo renderizar el slot cuando adsbygoogle esté disponible
    const check = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        setReady(true);
        clearInterval(check);
      }
    }, 2000);
    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    if (!ready || pushed.current || !insRef.current) return;
    try {
      const w = window as any;
      if (w.adsbygoogle) {
        w.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch {
      // AdSense no cargado — ignorar
    }
    const t = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <div
      ref={insRef}
      className={className}
      style={{
        position: 'relative',
        minHeight: height,
        minWidth: width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: loaded ? 'transparent' : '#f5f5f7',
        border: loaded ? 'none' : '1px solid #e8e8ec',
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      {ready && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: height }}
          data-ad-client="ca-pub-4115203339551939"
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(/^\d+$/.test(slot) ? { 'data-ad-slot': slot } : {})}
        />
      )}
      {!ready && (
        <span style={{ position: 'absolute', fontSize: 10, color: '#b0b0b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, pointerEvents: 'none', userSelect: 'none' }}>
          Publicidad
        </span>
      )}
    </div>
  );
}
