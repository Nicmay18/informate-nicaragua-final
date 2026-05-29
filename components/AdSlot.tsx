'use client';

import { useEffect, useRef } from 'react';

interface AdSlotProps {
  slot?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  label?: string;
}

export default function AdSlot({
  slot = 'default-slot',
  width = 336,
  height = 280,
  className = '',
  style = {},
  format = 'auto',
  label = 'Publicidad',
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (adRef.current && typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
        }
      }
    } catch {
      // Silenciar errores si AdSense no carga
    }
  }, [slot]);

  return (
    <div
      className={`ad-slot ${className || ''}`}
      style={{
        position: 'relative',
        minHeight: format === 'horizontal' ? 90 : height,
        minWidth: 0,
        width: '100%',
        maxWidth: width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
      aria-hidden="true"
    >
      <span className="ad-label" style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>{label}</span>
      <ins
        ref={adRef as any}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          minHeight: format === 'horizontal' ? 90 : height,
        }}
        data-ad-client="ca-pub-4115203339551838"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
