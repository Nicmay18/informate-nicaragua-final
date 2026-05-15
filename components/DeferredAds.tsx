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
    };

    const timer = setTimeout(loadAds, 8000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
