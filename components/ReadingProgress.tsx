'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Barra de progreso de lectura con throttling via requestAnimationFrame.
 * Evita saturar el hilo principal (mejora INP en Core Web Vitals).
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return; // skip si hay frame pendiente
      rafRef.current = requestAnimationFrame(() => {
        const el = document.documentElement;
        const scrolled = el.scrollTop || document.body.scrollTop;
        const total = el.scrollHeight - el.clientHeight;
        setProgress(total > 0 ? (scrolled / total) * 100 : 0);
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        backgroundColor: '#e5e5e5',
      }}
    >
      <div
        style={{
          height: '100%',
          backgroundColor: '#991b1b',
          width: `${progress}%`,
          transition: 'width 0.15s ease-out',
        }}
      />
    </div>
  );
}
