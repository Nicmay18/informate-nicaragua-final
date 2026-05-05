'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { CATEGORY_COLORS } from '@/lib/types';

interface Noticia {
  id: string;
  slug: string;
  titulo: string;
  resumen?: string;
  categoria: string;
  imagen: string;
  fecha?: unknown;
}

const FALLBACKS: Record<string, string> = {
  Sucesos: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=85',
  Nacionales: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=85',
  Deportes: 'https://images.unsplash.com/photo-1461896836934-f66c71d1ef65?w=1200&q=85',
  Internacionales: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=1200&q=85',
  'Espectáculos': 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=1200&q=85',
};

export default function HeroCarousel({ noticias }: { noticias: Noticia[] }) {
  const slides = noticias.slice(0, 6);
  const [current,  setCurrent]  = useState(0);
  const [fading,   setFading]   = useState(false);
  const [paused,   setPaused]   = useState(false);
  const touchX = useRef<number | null>(null);

  const goTo = useCallback((idx: number) => {
    if (fading) return;
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 300);
  }, [fading]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [goTo, current, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [goTo, current, slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(next, 5500);
    return () => clearTimeout(t);
  }, [current, paused, next, slides.length]);

  if (!slides.length) return null;

  const n   = slides[current];
  const col = CATEGORY_COLORS[n.categoria] || '#8c1d18';
  const img = n.imagen || FALLBACKS[n.categoria] || FALLBACKS['Nacionales'];

  const CTRL: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.25)',
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
    color: '#fff', cursor: 'pointer', fontSize: 15, display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'all 0.2s',
  };

  return (
    <section
      style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0f172a' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -48) next(); else if (dx > 48) prev();
        touchX.current = null;
      }}
      aria-label="Noticias destacadas"
    >
      {/* Slide image */}
      <Link href={`/noticias/${n.slug}`} style={{ display: 'block', position: 'relative', aspectRatio: '21/9', textDecoration: 'none' }}>
        <img
          src={img} alt={n.titulo}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.08) 100%)' }} />

        {/* Content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 24px 64px' }}>
          <span style={{ background: col, color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', padding: '4px 12px', borderRadius: 4, display: 'inline-block', marginBottom: 12 }}>
            {n.categoria}
          </span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(18px,2.8vw,32px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 8px', letterSpacing: '-0.3px', textShadow: '0 2px 20px rgba(0,0,0,0.7)', maxWidth: 780 }}>
            {n.titulo}
          </h2>
          {n.resumen && (
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {n.resumen}
            </p>
          )}
        </div>
      </Link>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={e => { e.preventDefault(); prev(); }} style={{ ...CTRL, left: 14 }} aria-label="Anterior"><i className="fas fa-chevron-left" /></button>
          <button onClick={e => { e.preventDefault(); next(); }} style={{ ...CTRL, right: 14 }} aria-label="Siguiente"><i className="fas fa-chevron-right" /></button>
        </>
      )}

      {/* Dots + counter */}
      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 10 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
            style={{ width: i === current ? 22 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, background: i === current ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s ease' }} />
        ))}
      </div>

      {/* Progress bar */}
      {!paused && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.12)' }}>
          <div key={current} style={{ height: '100%', background: 'rgba(255,255,255,0.5)', animation: 'hero-progress 5.5s linear forwards' }} />
        </div>
      )}
      <style>{`@keyframes hero-progress { from { width:0% } to { width:100% } }`}</style>
    </section>
  );
}

