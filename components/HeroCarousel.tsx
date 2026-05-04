'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article, CATEGORY_COLORS } from '@/lib/types';

interface HeroCarouselProps {
  articles: Article[];
}

export default function HeroCarousel({ articles }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const slides = articles.slice(0, 5);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (!slides.length) return null;

  return (
    <section className="hero" aria-label="Noticias destacadas">
      <div className="hero-carrusel-container">
        <div
          className="carrusel-slides"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((article, i) => {
            const catColor = CATEGORY_COLORS[article.category] || '#8c1d18';
            return (
              <Link
                key={article.id}
                href={`/noticias/${article.slug}/`}
                className="carrusel-slide"
                aria-label={article.title}
                tabIndex={i === current ? 0 : -1}
              >
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  style={{ objectFit: 'cover' }}
                />
                <div className="carrusel-overlay">
                  <span className="hero-category" style={{ backgroundColor: catColor }}>
                    {article.category}
                  </span>
                  <h2>{article.title}</h2>
                  {article.excerpt && <p>{article.excerpt}</p>}
                </div>
              </Link>
            );
          })}
        </div>

        {slides.length > 1 && (
          <>
            <button className="carrusel-control prev" onClick={prev} aria-label="Noticia anterior">
              <i className="fas fa-chevron-left" aria-hidden="true" />
            </button>
            <button className="carrusel-control next" onClick={next} aria-label="Noticia siguiente">
              <i className="fas fa-chevron-right" aria-hidden="true" />
            </button>
            <div className="carrusel-indicadores" role="tablist">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`carrusel-dot${i === current ? ' active' : ''}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Ir a noticia ${i + 1}`}
                  aria-selected={i === current}
                  role="tab"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
