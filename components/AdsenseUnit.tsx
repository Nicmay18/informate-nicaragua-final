'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
    adsbygoogleLoaded?: boolean;
  }
}

let globalScriptLoaded = false;

function loadAdsenseScript(): Promise<void> {
  return new Promise((resolve) => {
    if (globalScriptLoaded || typeof window === 'undefined') {
      resolve();
      return;
    }
    if (window.adsbygoogleLoaded) {
      globalScriptLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.onload = () => {
      globalScriptLoaded = true;
      window.adsbygoogleLoaded = true;
      resolve();
    };
    script.onerror = () => resolve(); // no bloquear si falla
    document.head.appendChild(script);
  });
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
    if (!visible || pushed.current) return;

    (async () => {
      await loadAdsenseScript();
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushed.current = true;
      } catch {
        // AdSense no cargado aun — silenciar error
      }
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
        minHeight: 250,
        maxHeight: 600,
        backgroundColor: visible ? 'transparent' : '#f8fafc',
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
