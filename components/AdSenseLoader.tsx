'use client';

import { useEffect } from 'react';

const ADSENSE_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838';

export default function AdSenseLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Evitar cargar duplicado
    if (document.querySelector(`script[src="${ADSENSE_URL}"]`)) return;

    const script = document.createElement('script');
    script.src = ADSENSE_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, []);

  return null;
}
