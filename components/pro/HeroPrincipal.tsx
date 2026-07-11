"use client";

import { useState, useEffect, useCallback } from 'react';
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

  if (!current) return null;

  const readTime = tiempoLectura(current.contenido || current.resumen || '');
  const relTime = tiempoRelativo(current.fecha);
  const catColor = CATEGORY_COLORS[current.categoria] || '#B45309';

  return (
    <section
      className="hero-principal"
      aria-label="Noticia principal"
      data-reveal
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-inner">
        {/* Imagen de fondo con transición */}
        <div className="hero-bg">
          {heroNoticias.map((n, i) => (
            <div
              key={n.id}
              className={`hero-bg-slide ${i === active ? 'is-active' : ''}`}
              aria-hidden={i !== active}
            >
              <Image
                src={n.imagen || '/logo.webp'}
                alt={n.titulo}
                fill
                priority={i === 0}
                sizes="100vw"
                className="hero-bg-img"
              />
            </div>
          ))}
          <div className="hero-overlay" />
        </div>

        {/* Contenido principal */}
        <div className="hero-content-wrap">
          <div className="hero-content">
            {/* Tag categoría */}
            <span
              className="hero-category-tag"
              style={{ backgroundColor: catColor }}
            >
              {current.categoria?.toUpperCase()}
            </span>

            {/* Título */}
            <h1 className="hero-title">
              <Link href={`/noticias/${current.slug}`}>
                {current.titulo}
              </Link>
            </h1>

            {/* Resumen */}
            {current.resumen && (
              <p className="hero-lead">{current.resumen}</p>
            )}

            {/* Meta */}
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

            {/* CTA */}
            <Link
              href={`/noticias/${current.slug}`}
              className="hero-cta"
            >
              Leer completo
              <ArrowRight size={16} />
            </Link>

            {/* Indicadores de slide */}
            {total > 1 && (
              <div className="hero-indicators" role="tablist" aria-label="Noticias principales">
                <button
                  className="hero-nav hero-nav--prev"
                  onClick={prevSlide}
                  aria-label="Noticia anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                {heroNoticias.map((n, i) => (
                  <button
                    key={n.id}
                    className={`hero-dot ${i === active ? 'is-active' : ''}`}
                    onClick={() => setActive(i)}
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`Noticia ${i + 1}: ${n.titulo}`}
                  >
                    <span className="hero-dot-progress" />
                  </button>
                ))}
                <button
                  className="hero-nav hero-nav--next"
                  onClick={nextSlide}
                  aria-label="Siguiente noticia"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
