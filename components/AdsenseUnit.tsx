'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdsenseUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'autorelaxed';
  layout?: 'in-article' | '';
  style?: React.CSSProperties;
  className?: string;
}

export default function AdsenseUnit({
  slot,
  format = 'auto',
  layout = '',
  style,
  className,
}: AdsenseUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch {
      // AdSense not loaded yet — auto-ads script handles it
    }
  }, []);

  return (
    <div
      className={className}
      style={{ display: 'block', textAlign: 'center', overflow: 'hidden', ...style }}
      aria-label="Publicidad"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-4115203339551838"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
}
