// File: hooks/useScrollProgress.ts
'use client';

import { useEffect, useState } from 'react';

export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = document.documentElement.scrollTop;
      const scrollPercent = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0;
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollProgress;
}
