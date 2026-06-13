'use client';
import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ni_theme');
      const theme = (saved === 'light' || saved === 'dark') ? saved : 'light';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (_e) {
      // ignore
    }
  }, []);
  return null;
}
