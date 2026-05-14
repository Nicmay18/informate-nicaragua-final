'use client';

import { useEffect, useRef } from 'react';

export default function DeferredAds() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || typeof window === 'undefined') return;

    const loadAds = () => {
      if (loaded.current) return;
      loaded.current = true;

      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551939';
      script.crossOrigin = 'anonymous';
      script.async = true;
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadAds, 6000);

    let scrollTimer: ReturnType<typeof setTimeout>;
    const scrollHandler = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(loadAds, 2000);
    };

    const scrollListenerTimer = setTimeout(() => {
      window.addEventListener('scroll', scrollHandler, { passive: true, once: true });
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(scrollListenerTimer);
      clearTimeout(scrollTimer);
    };
  }, []);

  return null;
}
