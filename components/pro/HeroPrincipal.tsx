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

  if (total === 0) return null;

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
          className={'hero-slide ' + (i === active ? 'active' : '')}
          aria-hidden={i !== active}
        >
          <div className="hero-card">
            <div className="hero-media">
              <Image
                src={n.imagen || '/logo.webp'}
                alt={n.titulo}
                fill
                priority={i === 0}
                sizes="(max-width: 900px) 100vw, 55vw"
                className="hero-media-img"
                style={{ objectFit: 'cover' }}
              />
              {i === active && total > 1 && (
                <>
                  <div className="hero-dots" role="tablist" aria-label="Noticias principales">
                    {heroNoticias.map((n2, j) => (
                      <button
                        key={n2.id}
                        className={'hero-dot ' + (j === active ? 'active' : '')}
                        onClick={() => setActive(j)}
                        role="tab"
                        aria-selected={j === active}
                        aria-label={'Noticia ' + (j + 1) + ': ' + n2.titulo}
                      />
                    ))}
                  </div>
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
            </div>

            <div className="hero-body">
              <span
                className="hero-tag"
                style={{ backgroundColor: CATEGORY_COLORS[n.categoria] || '#B45309' }}
              >
                {n.categoria?.toUpperCase()}
              </span>

              <h1 className="hero-title">
                <Link href={'/noticias/' + n.slug}>{n.titulo}</Link>
              </h1>

              {n.resumen && <p className="hero-excerpt">{n.resumen}</p>}

              <div className="hero-meta">
                {n.autor && (
                  <span className="hero-meta-item">
                    <User size={14} />
                    {n.autor.split(' ').slice(0, 2).join(' ')}
                  </span>
                )}
                <span className="hero-meta-item">
                  <Clock size={14} />
                  {tiempoRelativo(n.fecha)}
                </span>
                <span className="hero-meta-item">
                  <BookOpen size={14} />
                  {tiempoLectura(n.contenido || n.resumen || '')} min de lectura
                </span>
              </div>

              <Link href={'/noticias/' + n.slug} className="hero-btn">
                Leer completo
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
