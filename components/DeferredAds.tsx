'use client';

import { useEffect, useRef } from 'react';

export default function DeferredAds() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;

    const loadAds = () => {
      if (loaded.current) return;
      loaded.current = true;

      const existing = document.querySelector('script[src*="adsbygoogle.js"]');
      if (existing) return;

      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551939';
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

    // Estrategia: carga tras 5s de inactividad del hilo principal
    let idleId: ReturnType<typeof setTimeout> | number;
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(loadAds, { timeout: 5000 });
    } else {
      idleId = setTimeout(loadAds, 5000);
    }

    // Fallback: si el usuario scrollea, carga 1s después de dejar de scrollear
    let scrollTimer: ReturnType<typeof setTimeout>;
    const scrollHandler = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(loadAds, 1000);
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId as number);
      } else {
        clearTimeout(idleId as number);
      }
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  return null;
}
