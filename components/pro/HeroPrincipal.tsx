"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, BookOpen, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import { tiempoRelativo, tiempoLectura } from '@/lib/formateo';

interface HeroPrincipalProps {
  heroNoticias: Noticia[];
}

const INTERVAL_MS = 6000;

export default function HeroPrincipal({ heroNoticias }: HeroPrincipalProps) {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = heroNoticias.length;
  const current = total > 0 ? heroNoticias[active] : null;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setActive((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setActive((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1 || isPaused) return undefined;
    const timer = setInterval(nextSlide, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  if (!current) return null;

  const readTime = tiempoLectura(current.contenido || current.resumen || '');
  const relTime = tiempoRelativo(current.fecha);
  const catColor = CATEGORY_COLORS[current.categoria] || '#B45309';

  return (
    <section
      className="hero-carousel"
      aria-label="Noticia principal"
      data-reveal
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {heroNoticias.map((n, i) => (
        <div
          key={n.id}
          className={`hero-slide ${i === active ? 'active' : ''}`}
          aria-hidden={i !== active}
        >
          <div className="hero-image-wrapper">
            <Image
              src={n.imagen || '/logo.webp'}
              alt={n.titulo}
              fill
              priority={i === 0}
              sizes="100vw"
              className="hero-bg"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="hero-overlay" />

          <div className="hero-content">
            <span
              className="hero-tag"
              style={{ backgroundColor: catColor }}
            >
              {current.categoria?.toUpperCase()}
            </span>

            <h1 className="hero-title">
              <Link href={`/noticias/${current.slug}`}>{current.titulo}</Link>
            </h1>

            {current.resumen && <p className="hero-excerpt">{current.resumen}</p>}

            <div className="hero-meta">
              {current.autor && (
                <span className="hero-meta-item">
                  <User size={14} />
                  {current.autor.split(' ').slice(0, 2).join(' ')}
                </span>
              )}
              <span className="hero-meta-item">
                <Clock size={14} />
                {relTime}
              </span>
              <span className="hero-meta-item">
                <BookOpen size={14} />
                {readTime} min de lectura
              </span>
            </div>

            <Link
              href={`/noticias/${current.slug}`}
              className="hero-btn"
            >
              Leer completo
              <ArrowRight size={16} />
            </Link>

            {total > 1 && (
              <div className="hero-dots" role="tablist" aria-label="Noticias principales">
                {heroNoticias.map((n2, j) => (
                  <button
                    key={n2.id}
                    className={`hero-dot ${j === active ? 'active' : ''}`}
                    onClick={() => setActive(j)}
                    role="tab"
                    aria-selected={j === active}
                    aria-label={`Noticia ${j + 1}: ${n2.titulo}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {total > 1 && (
        <>
          <button
            className="hero-nav hero-prev"
            onClick={prevSlide}
            aria-label="Noticia anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="hero-nav hero-next"
            onClick={nextSlide}
            aria-label="Siguiente noticia"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </section>
  );
}
