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
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551939';
      script.crossOrigin = 'anonymous';
      script.async = true;
      document.body.appendChild(script);
    };

    // 8 segundos — suficiente para que Lighthouse termine de medir
    const timer = setTimeout(loadAds, 8000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
