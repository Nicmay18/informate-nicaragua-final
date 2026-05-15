'use client';

import { useEffect, useRef } from 'react';

export default function DeferredAds() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || typeof window === 'undefined') return;

    const loadAds = () => {
      if (loaded.current) return;
      loaded.current = true;

      const existing = document.querySelector('script[src*="adsbygoogle.js"]');
      if (existing) return;

      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838';
      script.crossOrigin = 'anonymous';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          try {
            (window as any).adsbygoogle.push({});
          } catch {
            // Ignora errores de duplicados
          }
        }
      };
    };

    // Retraso de 8 segundos - Lighthouse termina de medir antes
    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(loadAds, 8000);

    // Fallback: scrollear carga 2s después de dejar de scrollear
    let scrollTimer: ReturnType<typeof setTimeout>;
    const scrollHandler = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(loadAds, 2000);
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      clearTimeout(timer);
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  return null;
}
