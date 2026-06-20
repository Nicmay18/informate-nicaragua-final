'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { ComponentProps } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Noticia } from '@/lib/types';
import { getHeroImageUrl, getResponsiveImageUrl } from '@/lib/image-utils';
import { catClass, timeAgo } from '@/lib/homepage-utils';

const NoPrefetchLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} prefetch={false} />
);

const SLIDE_DURATION = 5000;

export default function HeroCarousel({ noticias }: { noticias: Noticia[] }) {
  const [idx, setIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const items = useMemo(() => noticias.slice(0, 5), [noticias]);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = useCallback((i: number) => {
    setIdx(i);
  }, []);

  const nextSlide = useCallback(() => {
    setIdx(p => (p + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setIdx(p => (p + 1) % items.length);
      }
    }, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, isPaused]);

  return (
    <section
      className="ni-hero"
      aria-label="Noticias destacadas"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].screenX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].screenX;
        const threshold = 50;
        if (diff > threshold) {
          nextSlide();
        } else if (diff < -threshold) {
          goToSlide((idx - 1 + items.length) % items.length);
        }
        touchStartX.current = null;
      }}
    >
      <div className="ni-hero__track">
        {items.map((item, i) => {
          const isActive = i === idx;
          const isNext = i === (idx + 1) % items.length;
          const isPrev = i === (idx - 1 + items.length) % items.length;
          const shouldRender = isActive || isNext || isPrev;
          return (
            <article key={item.id} className={`ni-hero__slide${isActive ? ' is-active' : ''}`}>
              <div className="ni-hero__media">
                {item.imagen ? (
                  i === 0 ? (
                    <img
                      src={getHeroImageUrl(item.imagen)}
                      srcSet={`${getHeroImageUrl(item.imagen, 400)} 400w, ${getHeroImageUrl(item.imagen, 800)} 800w`}
                      sizes="(max-width: 768px) 100vw, 580px"
                      alt={item.titulo}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }}
                      fetchPriority="high"
                      loading="eager"
                      decoding="async"
                      crossOrigin="anonymous"
                    />
                  ) : shouldRender ? (
                    <Image
                      src={getResponsiveImageUrl(item.imagen, 400)}
                      alt={item.titulo}
                      fill
                      sizes="(max-width: 768px) 100vw, 580px"
                      style={{ objectFit: 'cover', objectPosition: 'center center' }}
                      loading="lazy"
                      crossOrigin="anonymous"
                      unoptimized={false}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#e2e8f0' }} aria-hidden="true" />
                  )
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="ni-hero__info">
        <span className={`ni-hero__badge ni-hero__badge--${catClass(items[idx]?.categoria)}`}>{items[idx]?.categoria || 'Noticia'}</span>
        <span className="ni-hero__title">
          <NoPrefetchLink href={`/noticias/${items[idx]?.slug}`}>{items[idx]?.titulo}</NoPrefetchLink>
        </span>
        <p className="ni-hero__lead">{items[idx]?.resumen || items[idx]?.titulo}</p>
        <div className="ni-hero__meta">
          <time dateTime={items[idx]?.fecha} suppressHydrationWarning>{timeAgo(items[idx]?.fecha || '')}</time>
          <span>•</span>
          <span>{items[idx]?.autor || 'Nicaragua Informate'}</span>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button className="ni-hero__arrow ni-hero__arrow--prev" onClick={() => goToSlide((idx - 1 + items.length) % items.length)} aria-label="Anterior">‹</button>
          <button className="ni-hero__arrow ni-hero__arrow--next" onClick={() => nextSlide()} aria-label="Siguiente">›</button>
          <div className="ni-hero__indicators">
            {items.map((item, i) => (
              <button key={i} className={`ni-hero__ind${i === idx ? ' is-active' : ''}`} onClick={() => goToSlide(i)} aria-label={`Noticia ${i + 1}`}>
                <span className="ni-hero__ind-label">{item.categoria}</span>
                {i === idx && (
                  <span className="ni-hero__ind-bar">
                    <span className="ni-hero__ind-bar__fill" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
