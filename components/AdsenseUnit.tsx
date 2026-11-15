'use client';

import { useEffect, useRef, useState } from 'react';
import { loadAdsenseScript } from '@/lib/adsense/loader';

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
  minHeight?: number;
}

export default function AdsenseUnit({
  slot,
  format = 'auto',
  layout = '',
  style,
  className,
  responsive = true,
  minHeight = 250,
}: AdsenseUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || pushed.current || !insRef.current || !containerRef.current) return;

    (async () => {
      await loadAdsenseScript();
      // Esperar al siguiente frame para asegurar que el <ins> está en el DOM
      requestAnimationFrame(() => {
        if (!insRef.current || !insRef.current.parentElement) return;
        try {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          pushed.current = true;
        } catch {
          // AdSense no cargado aun — silenciar error
        }
      });
    })();
  }, [visible]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'block',
        textAlign: 'center',
        overflow: 'hidden',
        minHeight,
        maxHeight: 600,
        backgroundColor: visible ? 'transparent' : '#f8fafc',
        borderRadius: 8,
        ...style,
      }}
      role="complementary"
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
