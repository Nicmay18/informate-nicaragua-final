'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_COLORS, FALLBACK_IMAGE, type Noticia } from '@/lib/types';
import { formatDateShortES } from '@/lib/formateo';
import { cleanImageUrl, getResponsiveImageUrl } from '@/lib/image-utils';
import HeroLcpImage from '@/components/HeroLcpImage';

function HeroImage({ src, alt, style, priority }: { src: string; alt: string; style?: React.CSSProperties; priority?: boolean }) {
  const validSrc = src?.trim();
  const isValid = validSrc && (validSrc.startsWith('http') || validSrc.startsWith('/') || validSrc.startsWith('data:'));
  const currentSrc = isValid ? getResponsiveImageUrl(validSrc, 200, 150) : FALLBACK_IMAGE;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={currentSrc}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

const MAX_SLIDES = 4;
const FADE_DURATION_MS = 300;
const AUTOPLAY_DELAY_MS = 4000;
const SWIPE_THRESHOLD_PX = 48;

interface HeroCarouselProps {
  noticias: Noticia[];
}

export default function HeroCarousel({ noticias }: HeroCarouselProps) {
  const slides = noticias.slice(0, MAX_SLIDES);
  const sideCards = noticias.slice(1, 3);
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const goTo = useCallback((idx: number) => {
    if (fading) return;
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, FADE_DURATION_MS);
  }, [fading]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [goTo, current, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [goTo, current, slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(next, AUTOPLAY_DELAY_MS);
    return () => clearTimeout(t);
  }, [current, paused, next, slides.length]);

  if (!slides.length) return null;

  const n = slides[current];
  const col = CATEGORY_COLORS[n.categoria] || '#8c1d18';
  const img = cleanImageUrl(n.imagen || FALLBACK_IMAGE);

  return (
    <div className="ni-hero">
      {/* Hero Main - Full-width móvil, 60% desktop */}
      <section
        className="ni-hero-main"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx < -SWIPE_THRESHOLD_PX) next(); else if (dx > SWIPE_THRESHOLD_PX) prev();
          touchX.current = null;
        }}
        aria-label="Noticias destacadas"
      >
        <Link href={`/noticias/${n.slug}`} className="ni-hero-link">
          <HeroLcpImage
            src={img}
            alt={n.titulo}
            width={800}
            height={450}
            priority={current === 0}
            style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease' }}
          />
          <div className="ni-hero-overlay" />

          <div className="ni-hero-content">
            <span className="ni-hero-cat" style={{ background: col }}>
              {n.categoria}
            </span>
            <h2 className="ni-hero-title">{n.titulo}</h2>
            <div className="ni-hero-meta">
              <span>{formatDateShortES(n.fecha)}</span>
            </div>
          </div>
        </Link>

        {slides.length > 1 && (
          <>
            <button onClick={e => { e.preventDefault(); prev(); }} className="ni-hero-btn ni-hero-btn--prev" aria-label="Anterior">
              <ChevronLeft size={20} />
            </button>
            <button onClick={e => { e.preventDefault(); next(); }} className="ni-hero-btn ni-hero-btn--next" aria-label="Siguiente">
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div className="ni-hero-dots">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} className={`ni-hero-dot${i === current ? ' active' : ''}`}>
              <span />
            </button>
          ))}
        </div>

        {!paused && (
          <div className="ni-hero-progress">
            <div key={current} style={{ height: '100%', background: 'rgba(255,255,255,0.5)', transformOrigin: 'left', animation: 'hero-progress 5.5s linear forwards' }} />
          </div>
        )}
      </section>

      {/* Side Cards - Solo escritorio */}
      {sideCards.length > 0 && (
        <aside className="ni-hero-side">
          {sideCards.map(card => (
            <Link key={card.id} href={`/noticias/${card.slug}`} className="ni-hero-card">
              <div className="ni-hero-card-img">
                <HeroImage src={cleanImageUrl(card.imagen || FALLBACK_IMAGE)} alt={card.titulo} priority={false} />
              </div>
              <div className="ni-hero-card-body">
                <span className="ni-hero-card-cat" style={{ color: CATEGORY_COLORS[card.categoria] || '#DC2626' }}>
                  {card.categoria}
                </span>
                <h3 className="ni-hero-card-title">{card.titulo}</h3>
              </div>
            </Link>
          ))}
        </aside>
      )}
    </div>
  );
}
