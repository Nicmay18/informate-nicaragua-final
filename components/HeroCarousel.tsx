'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_COLORS, FALLBACK_IMAGE, type Noticia } from '@/lib/types';
import { formatDateShortES } from '@/lib/formateo';
import { cleanImageUrl } from '@/lib/image-utils';

const MAX_SLIDES = 4;
const FADE_DURATION_MS = 300;
const AUTOPLAY_DELAY_MS = 5500;
const SWIPE_THRESHOLD_PX = 48;

const CONTROL_BUTTON_STYLE: React.CSSProperties = {
  position: 'absolute', 
  top: '50%', 
  transform: 'translateY(-50%)',
  width: 48, 
  height: 48, 
  borderRadius: '50%', 
  border: '2px solid rgba(255,255,255,0.4)',
  background: 'rgba(0,0,0,0.65)', 
  backdropFilter: 'blur(8px)', 
  WebkitBackdropFilter: 'blur(8px)',
  color: '#fff', 
  cursor: 'pointer', 
  fontSize: 17, 
  display: 'flex', 
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  alignItems: 'center', 
  justifyContent: 'center', 
  zIndex: 10, 
  transition: 'all 0.2s',
};

interface HeroCarouselProps {
  noticias: Noticia[];
}

export default function HeroCarousel({ noticias }: HeroCarouselProps) {
  const slides = noticias.slice(0, MAX_SLIDES);
  const sideCards = noticias.slice(1, 4);
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
    <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
      {/* Hero Main - 2/3 */}
      <section
        style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#0f172a', aspectRatio: '21/9', maxHeight: 480 }}
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
        <Link href={`/noticias/${n.slug}`} style={{ display: 'block', position: 'relative', width: '100%', height: '100%', textDecoration: 'none' }}>
          <Image
            src={img}
            alt={n.titulo}
            fill
            priority={current === 0}
            loading={current === 0 ? undefined : 'lazy'}
            quality={75}
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover object-[center_30%] transition-opacity duration-300"
            style={{ opacity: fading ? 0 : 1 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }} />

          <div className="hero-carousel-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <span style={{ display: 'inline-block', background: col, color: '#fff', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
              {n.categoria}
            </span>
            <h2 className="hero-carousel-title" style={{ fontFamily: 'var(--font-merri)', fontWeight: 900, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.7)' }}>
              {n.titulo}
            </h2>
            <div style={{ display: 'flex', gap: 16, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>
              <span>{formatDateShortES(n.fecha)}</span>
            </div>
          </div>
        </Link>

        {slides.length > 1 && (
          <>
            <button onClick={e => { e.preventDefault(); prev(); }} style={{ ...CONTROL_BUTTON_STYLE, left: 14 }} aria-label="Anterior"><ChevronLeft size={20} /></button>
            <button onClick={e => { e.preventDefault(); next(); }} style={{ ...CONTROL_BUTTON_STYLE, right: 14 }} aria-label="Siguiente"><ChevronRight size={20} /></button>
          </>
        )}

        <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 10 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
              style={{ width: i === current ? 22 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, background: i === current ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s ease' }} />
          ))}
        </div>

        {!paused && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.12)' }}>
            <div key={current} style={{ height: '100%', background: 'rgba(255,255,255,0.5)', animation: 'hero-progress 5.5s linear forwards' }} />
          </div>
        )}
        <style>{`@keyframes hero-progress { from { width:0% } to { width:100% } }`}</style>
      </section>

      {/* Side Cards - 1/3 */}
      {sideCards.length > 0 && (
        <aside className="hero-side" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sideCards.map((card) => (
            <Link key={card.id} href={`/noticias/${card.slug}`} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 14, padding: 14, background: '#faf9f7', borderRadius: 8, border: '1px solid #f0f0f4', transition: 'all 0.2s', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#faf9f7'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <Image
                src={cleanImageUrl(card.imagen || FALLBACK_IMAGE)}
                alt={card.titulo}
                width={100}
                height={75}
                loading="lazy"
                quality={75}
                sizes="100px"
                className="object-cover rounded"
                style={{ borderRadius: 4 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: CATEGORY_COLORS[card.categoria] || '#c41e3a', marginBottom: 6 }}>
                  {card.categoria}
                </span>
                <h4 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: '#1a1a2e', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                  {card.titulo}
                </h4>
              </div>
            </Link>
          ))}
        </aside>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-side { display: none !important; }
        }
      `}</style>
    </div>
  );
}
