'use client';

import { useEffect } from 'react';

export function ThemeInit() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ni_theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch {}
  }, []);

  return null;
}
