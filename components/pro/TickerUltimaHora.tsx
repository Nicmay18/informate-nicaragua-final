"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Noticia } from '@/lib/types';

interface TickerProps {
  noticias: Noticia[];
}

export default function TickerUltimaHora({ noticias }: TickerProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (noticias.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % noticias.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [noticias.length]);

  if (!noticias.length) return null;

  return (
    <div className="ticker-bar" role="marquee" aria-label="Última hora" data-reveal>
      <span className="ticker-label">ÚLTIMA HORA</span>
      <div className="ticker-content">
        {noticias.map((n, i) => (
          <Link
            key={n.id}
            href={`/noticias/${n.slug}`}
            className={`ticker-item ${i === current ? 'ticker-item--active' : ''}`}
            aria-hidden={i !== current}
            tabIndex={i === current ? 0 : -1}
          >
            {n.titulo}
          </Link>
        ))}
      </div>
      <div className="ticker-dots">
        {noticias.map((_, i) => (
          <button
            key={i}
            className={`ticker-dot ${i === current ? 'ticker-dot--active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Noticia ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
