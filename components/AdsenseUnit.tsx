'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdsenseUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'autorelaxed' | 'vertical' | 'horizontal';
  layout?: 'in-article' | '';
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

export default function AdsenseUnit({
  slot,
  format = 'auto',
  layout = '',
  style,
  className,
  responsive = true,
}: AdsenseUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (typeof window !== 'undefined' && Array.isArray(window.adsbygoogle)) {
        window.adsbygoogle.push({});
        pushed.current = true;
      } else if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch {
      // AdSense no cargado aun — silenciar error
    }
  }, []);

  return (
    <div
      className={className}
      style={{
        display: 'block',
        textAlign: 'center',
        overflow: 'hidden',
        minHeight: 250,
        maxHeight: 600,
        backgroundColor: 'transparent',
        borderRadius: 8,
        ...style,
      }}
      aria-label="Publicidad"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxHeight: 600 }}
        data-ad-client="ca-pub-4115203339551838"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        {...(responsive ? { 'data-full-width-responsive': 'true' } : {})}
      />
    </div>
  );
}
