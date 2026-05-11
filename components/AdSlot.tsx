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
  const [mounted, setMounted] = useState(false);
  const insRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || pushed.current || !insRef.current) return;
    try {
      const w = window as any;
      if (w.adsbygoogle) {
        w.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch {
      // AdSense no cargado — ignorar
    }
  }, [mounted]);

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
        background: '#f5f5f7',
        border: '1px solid #e8e8ec',
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      {mounted && (
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', width, height }}
          data-ad-client="ca-pub-4115203339551838"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      )}
      <span style={{ position: 'absolute', fontSize: 10, color: '#b0b0b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, pointerEvents: 'none', userSelect: 'none' }}>
        Publicidad
      </span>
    </div>
  );
}
