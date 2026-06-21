'use client';

import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import Link from 'next/link';

// Componente Link con prefetch desactivado para no competir con LCP
const NoPrefetchLink = (props: React.ComponentProps<typeof Link>) => (
  <Link {...props} prefetch={false} />
);
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Flame, Radio, Mail, TrendingUp, BookOpen, BarChart3, CloudSun, Globe, FolderOpen } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { getResponsiveImageUrl, getHeroImageUrl } from '@/lib/image-utils';
import { getAllEvergreen } from '@/lib/evergreen';
import dynamic from 'next/dynamic';

const RadioPlayer = dynamic(() => import('./RadioPlayer'), { ssr: false, loading: () => <div style={{ height: 80, background: '#f1f5f9', borderRadius: 8 }} /> });
const EconomicBar = dynamic(() => import('./EconomicBar'), { ssr: false, loading: () => <div style={{ height: 120, background: '#f1f5f9', borderRadius: 8 }} /> });
const WeatherWidget = dynamic(() => import('./WeatherWidget'), { ssr: false, loading: () => <div style={{ height: 140, background: '#f1f5f9', borderRadius: 8 }} /> });
const WorldClock = dynamic(() => import('./WorldClock'), { ssr: false, loading: () => <div style={{ height: 140, background: '#f1f5f9', borderRadius: 8 }} /> });

// ============================================================================
// UTILIDADES DE RENDIMIENTO Y ACCESIBILIDAD
// ============================================================================

function timeAgo(dateInput: unknown): string {
  const dateStr = typeof dateInput === 'string' ? dateInput : '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return '';
  }
}

const TRENDS = [
  { label: 'Elecciones 2026', href: '/buscar?q=elecciones' },
  { label: 'Dólar / Córdoba', href: '/buscar?q=dolar' },
  { label: 'Liga Primera', href: '/buscar?q=liga+primera' },
  { label: 'Bluefields', href: '/buscar?q=bluefields' },
  { label: 'Costa Caribe', href: '/buscar?q=costa+caribe' },
];

const CATEGORIES = [
  { name: 'Sucesos', slug: 'sucesos', color: 'sucesos' },
  { name: 'Nacionales', slug: 'nacionales', color: 'nacionales' },
  { name: 'Espectáculos', slug: 'espectaculos', color: 'espectaculos' },
  { name: 'Deportes', slug: 'deportes', color: 'deportes' },
  { name: 'Tecnología', slug: 'tecnologia', color: 'tecnologia' },
  { name: 'Internacionales', slug: 'internacionales', color: 'internacionales' },
];

// Precalcular lookup de categoría → slug (evita normalize en cada render)
const CAT_LOOKUP: Record<string, string> = {};
CATEGORIES.forEach(c => {
  CAT_LOOKUP[c.slug] = c.slug;
  CAT_LOOKUP[c.name.toLowerCase()] = c.slug;
  CAT_LOOKUP[c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] = c.slug;
});

function catClass(cat?: string) {
  const key = cat?.toLowerCase() || '';
  return CAT_LOOKUP[key] || CAT_LOOKUP[key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || 'nacionales';
}

// Precalcular evergreen (array estático, no cambia en runtime)
const EVERGREEN_GUIDES = getAllEvergreen().slice(0, 4);

function BreakingMarquee({ noticias }: { noticias: Noticia[] }) {
  const list = useMemo(() => noticias.slice(0, 6), [noticias]);
  if (list.length === 0) return null;
  return (
    <div className="ni-marquee-bar">
      <div className="ni-marquee-bar__badge">Última hora</div>
      <div className="ni-marquee-bar__content">
        <div className="ni-marquee-bar__scroll">
          {list.map((n) => (
            <NoPrefetchLink key={n.id} href={`/noticias/${n.slug}`} className="ni-marquee-bar__item">
              <span className="ni-marquee-bar__arrow">➔</span> {n.titulo}
            </NoPrefetchLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabbedSidebarWidget({ ultimas, populares, tendencias }: { ultimas: Noticia[]; populares: Noticia[]; tendencias: Noticia[] }) {
  const [activeTab, setActiveTab] = useState<'ultimas' | 'populares' | 'tendencias'>('ultimas');

  const list = useMemo(() => {
    if (activeTab === 'ultimas') return ultimas.slice(0, 5);
    if (activeTab === 'populares') return populares.slice(0, 5);
    return tendencias.slice(0, 5);
  }, [activeTab, ultimas, populares, tendencias]);

  return (
    <div className="ni-sidebar__widget ni-tab-widget">
      <div className="ni-tab-widget__header">
        <button className={`ni-tab-widget__btn ${activeTab === 'ultimas' ? 'is-active' : ''}`} onClick={() => setActiveTab('ultimas')}>
          <TrendingUp size={12} style={{ marginRight: 4 }} /> Más leídas
        </button>
        <button className={`ni-tab-widget__btn ${activeTab === 'populares' ? 'is-active' : ''}`} onClick={() => setActiveTab('populares')}>
          <Flame size={12} style={{ marginRight: 4 }} /> Populares
        </button>
        <button className={`ni-tab-widget__btn ${activeTab === 'tendencias' ? 'is-active' : ''}`} onClick={() => setActiveTab('tendencias')}>
          <TrendingUp size={12} style={{ marginRight: 4 }} /> Tendencias
        </button>
      </div>
      <div className="ni-tab-widget__body">
        <ul className="ni-tab-list">
          {list.map((n) => (
            <li key={n.id} className="ni-tab-item">
              <div className="ni-tab-item__img">
                {n.imagen ? (
                  <Image src={getResponsiveImageUrl(n.imagen, 100)} alt={n.titulo} width={64} height={64} style={{ objectFit: 'cover' }} unoptimized={n.imagen.endsWith('.gif')} />
                ) : (
                  <div className="ni-tab-item__fallback">🇳🇮</div>
                )}
              </div>
              <div className="ni-tab-item__content">
                <span className={`ni-tab-item__pill ni-tab-item__pill--${catClass(n.categoria)}`}>{n.categoria}</span>
                <NoPrefetchLink href={`/noticias/${n.slug}`} className="ni-tab-item__title">{n.titulo}</NoPrefetchLink>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SLIDE_DURATION = 5000; // 5 segundos por slide

function Hero({ noticias }: { noticias: Noticia[] }) {
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

  // Auto-advance simple y confiable con setInterval
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
                    // Primer slide = LCP: carga directo sin intermediarios
                    /* eslint-disable-next-line @next/next/no-img-element */
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

const Card = memo(function Card({ noticia, index = 0 }: { noticia: Noticia; index?: number }) {
  const cat = catClass(noticia.categoria);
  return (
    <article
      className="ni-card"
      style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid #e2e8f0',
        alignItems: 'start',
        overflow: 'hidden',
        animationDelay: `${index * 60}ms`,
      }}
      data-animate="fadeInUp"
    >
      <div
        className="ni-card__thumb"
        style={{
          position: 'relative',
          width: 100,
          height: 70,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#e2e8f0',
        }}
      >
        {noticia.imagen ? (
          <Image
            src={getResponsiveImageUrl(noticia.imagen, 400)}
            alt={noticia.titulo}
            fill
            sizes="(max-width: 768px) 100px, (max-width: 1024px) 220px, 33vw"
            style={{ objectFit: 'cover' }}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ) : null}
      </div>
      <div className="ni-card__content" style={{ width: '100%', padding: 0, minWidth: 0, overflow: 'hidden' }}>
        <span className={`ni-card__pill ni-card__pill--${cat}`} style={{ fontSize: '0.6rem', marginBottom: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>{noticia.categoria || 'Noticia'}</span>
        <span className="ni-card__title" style={{ fontFamily: "'Merriweather', serif", fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.25, color: '#0f172a', marginBottom: 3, display: 'block' }}>
          <NoPrefetchLink href={`/noticias/${noticia.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{noticia.titulo}</NoPrefetchLink>
        </span>
        <p className="ni-card__excerpt" style={{ fontSize: '0.8rem', lineHeight: 1.4, marginBottom: 4, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{noticia.resumen || noticia.titulo}</p>
        <div className="ni-card__meta" style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: 0 }}>
          <time dateTime={noticia.fecha} suppressHydrationWarning>{timeAgo(noticia.fecha)}</time>
          {noticia.fechaActualizacion && (
            <time dateTime={noticia.fechaActualizacion} suppressHydrationWarning style={{ color: '#991b1b', fontWeight: 500, fontSize: 12 }}>
              Actualizado {timeAgo(noticia.fechaActualizacion)}
            </time>
          )}
          <span>{noticia.autor || 'Nicaragua Informate'}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginRight: 2 }}>Compartir</span>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://nicaraguainformate.com/noticias/' + noticia.slug)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en Facebook" className="ni-share-btn" style={{ '--sh': '#1877f2' } as React.CSSProperties}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
          </a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent('https://nicaraguainformate.com/noticias/' + noticia.slug)}&text=${encodeURIComponent(noticia.titulo)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en X" className="ni-share-btn" style={{ '--sh': '#000000' } as React.CSSProperties}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(noticia.titulo + ' https://nicaraguainformate.com/noticias/' + noticia.slug)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en WhatsApp" className="ni-share-btn" style={{ '--sh': '#25D366' } as React.CSSProperties}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.738-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.074-.148-.668-1.611-.916-2.206-.241-.579-.486-.5-.668-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          </a>
        </div>
      </div>
    </article>
  );
});

function useInView(ref: React.RefObject<HTMLElement | null>, options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const el = ref.current;
    if (el && typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      }, { rootMargin: '200px', threshold: 0, ...options });
      observer.observe(el);
      cleanup = () => observer.disconnect();
    } else {
      setIsInView(true);
    }
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current, options?.rootMargin, options?.threshold]);
  return isInView;
}

function LazySection({ title, slug, color, noticias }: { title: string; slug: string; color: string; noticias: Noticia[] }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref);
  if (noticias.length === 0) return null;
  if (!isInView) {
    return (
      <section ref={ref} className="ni-section" style={{ minHeight: 200 }} aria-hidden="true">
        <div className="ni-section__header">
          <h2 className={`ni-section__title ni-section__title--${color}`}>{title}</h2>
        </div>
        <div style={{ height: 120, background: '#f1f5f9', borderRadius: 8 }} />
      </section>
    );
  }
  return (
    <section ref={ref} className="ni-section">
      <div className="ni-section__header">
        <h2 className={`ni-section__title ni-section__title--${color}`}>{title}</h2>
        <NoPrefetchLink href={`/categoria/${slug}`} className="ni-section__more">Ver más noticias de {title} →</NoPrefetchLink>
      </div>
      {noticias.length <= 2 ? (
        noticias.map((n, i) => <Card key={n.id} noticia={n} index={i} />)
      ) : (
        <div className="ni-grid-2">
          {noticias.map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
        </div>
      )}
    </section>
  );
}

function Section({ title, slug, color, noticias }: { title: string; slug: string; color: string; noticias: Noticia[] }) {
  if (noticias.length === 0) return null;
  return (
    <section className="ni-section">
      <div className="ni-section__header">
        <h2 className={`ni-section__title ni-section__title--${color}`}>{title}</h2>
        <NoPrefetchLink href={`/categoria/${slug}`} className="ni-section__more">Ver más noticias de {title} →</NoPrefetchLink>
      </div>
      {noticias.length <= 2 ? (
        noticias.map((n, i) => <Card key={n.id} noticia={n} index={i} />)
      ) : (
        <div className="ni-grid-2">
          {noticias.map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
        </div>
      )}
    </section>
  );
}

export default function HomePagePro({ noticias, masLeidas, populares = [], isNoticiasPage = false }: { noticias: Noticia[]; masLeidas: Noticia[]; populares?: Noticia[]; isNoticiasPage?: boolean }) {
  // Carrusel: las 7 noticias más recientes
  const heroNoticias = useMemo(() => noticias.slice(0, 7), [noticias]);

  // IDs del carousel
  const heroIds = useMemo(() => new Set(heroNoticias.map(n => n.id)), [heroNoticias]);

  // IDs de masLeidas para evitar duplicación con populares
  const masLeidasIds = useMemo(() => new Set(masLeidas.map(n => n.id)), [masLeidas]);

  // Resto = todas las noticias menos las del hero
  const resto = useMemo(
    () => noticias.filter(n => !heroIds.has(n.id)),
    [noticias, heroIds]
  );

  // Populares filtrados: excluir noticias que ya están en Más leídos
  const popularesFiltrados = useMemo(
    () => populares.filter(n => !masLeidasIds.has(n.id)),
    [populares, masLeidasIds]
  );

  // Últimas 12 noticias
  const ultimas = useMemo(() => resto.slice(0, 12), [resto]);

  // Categorías — usar RESTO (noticias fuera del carrusel) para evitar duplicación
  const porCategoria = useMemo(() => {
    const map: Record<string, Noticia[]> = {};
    CATEGORIES.forEach(c => { map[c.slug] = []; });
    for (const n of resto) {
      const slug = CAT_LOOKUP[n.categoria?.toLowerCase() || ''];
      if (slug && map[slug]) map[slug].push(n);
    }
    CATEGORIES.forEach(c => { map[c.slug] = map[c.slug].slice(0, 6); });
    return map;
  }, [resto]);


  return (
    <div>
      {isNoticiasPage ? (
        <h1 className="ni-page-title">Todas las Noticias de Nicaragua</h1>
      ) : (
        <h1 className="ni-page-title">Noticias de Nicaragua — Sucesos Nacionales y Actualidad</h1>
      )}
      {/* ETIQUETAS PRINCIPALES */}
      <div className="ni-top-tags">
        <span className="ni-top-tags__label"># Etiquetas principales</span>
        <div className="ni-top-tags__list">
          {TRENDS.map(t => (
            <NoPrefetchLink key={t.label} href={t.href} className="ni-top-tag" rel="nofollow">{t.label}</NoPrefetchLink>
          ))}
        </div>
      </div>

      {/* MARQUEE / TICKER */}
      <BreakingMarquee noticias={noticias} />

      {/* HERO */}
      <Hero noticias={heroNoticias} />

      {/* GUÍAS Y RECURSOS EVERGREEN */}
      {!isNoticiasPage && (
        <section className="ni-section" style={{ marginTop: 24 }}>
          <div className="ni-section__header">
            <h2 className="ni-section__title" style={{ color: '#7c3aed' }}><BookOpen size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Guías útiles</h2>
            <NoPrefetchLink href="/guia" className="ni-section__more">Ver todas →</NoPrefetchLink>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {EVERGREEN_GUIDES.map((guia) => (
              <NoPrefetchLink
                key={guia.slug}
                href={`/guia/${guia.slug}`}
                style={{
                  display: 'block',
                  padding: '16px',
                  background: 'var(--card-bg, #fff)',
                  borderRadius: 10,
                  border: '1px solid var(--border, #e5e7eb)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>{guia.category}</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '6px 0 4px', lineHeight: 1.4 }}>{guia.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{guia.description.slice(0, 90)}…</p>
              </NoPrefetchLink>
            ))}
          </div>
        </section>
      )}

      {/* MAIN */}
      <div className="ni-main">
        <div className="ni-content">
          {/* Últimas */}
          {ultimas.length > 0 && (
            <section className="ni-section">
              <div className="ni-section__header">
                <h2 className="ni-section__title ni-section__title--sucesos">Últimas noticias</h2>
                <NoPrefetchLink href="/noticias" className="ni-section__more">Ver todas →</NoPrefetchLink>
              </div>
              {ultimas.map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
            </section>
          )}

          {/* MÁS LEÍDAS — sección prominente en el contenido principal */}
          {masLeidas.length > 0 && (
            <section className="ni-section">
              <div className="ni-section__header">
                <h2 className="ni-section__title ni-section__title--sucesos"><TrendingUp size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Más leídos</h2>
                <NoPrefetchLink href="/noticias" className="ni-section__more">Ver todas →</NoPrefetchLink>
              </div>
              <div className="ni-grid-2">
                {masLeidas.slice(0, 4).map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
              </div>
            </section>
          )}

          {CATEGORIES.slice(0, 3).map(c => (
            <Section key={c.slug} title={c.name} slug={c.slug} color={c.color} noticias={porCategoria[c.slug]} />
          ))}

          {/* DESTACADOS — rompe monotonía entre categorías */}
          {popularesFiltrados.length > 0 && (
            <section className="ni-section">
              <div className="ni-section__header">
                <h2 className="ni-section__title ni-section__title--sucesos"><Flame size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Destacados</h2>
                <NoPrefetchLink href="/noticias" className="ni-section__more">Ver todas →</NoPrefetchLink>
              </div>
              <div className="ni-grid-2">
                {popularesFiltrados.slice(0, 4).map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
              </div>
            </section>
          )}

          {CATEGORIES.slice(3).map(c => (
            <LazySection key={c.slug} title={c.name} slug={c.slug} color={c.color} noticias={porCategoria[c.slug]} />
          ))}
        </div>

        {/* SIDEBAR */}
        <aside className="ni-sidebar">
          {/* TABBED WIDGET (Más leídas all-time, Populares 7d, Tendencias recientes) */}
          <TabbedSidebarWidget ultimas={masLeidas} populares={popularesFiltrados.length > 0 ? popularesFiltrados : resto.slice(0, 5)} tendencias={resto.slice(5, 10)} />

          {/* Radio en vivo */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title"><Radio size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Radio en Vivo</h3>
            <RadioPlayer />
          </div>

          {/* Indicadores económicos */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title"><BarChart3 size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Indicadores</h3>
            <EconomicBar />
          </div>

          {/* Clima */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title"><CloudSun size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Clima Nicaragua</h3>
            <WeatherWidget />
          </div>

          {/* Reloj mundial */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title"><Globe size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Reloj Mundial</h3>
            <WorldClock />
          </div>

          {/* Categorías */}
          <div className="ni-sidebar__widget">
            <h3 className="ni-sidebar__title"><FolderOpen size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Categorías</h3>
            <ul className="ni-cat-list">
              {CATEGORIES.map(c => (
                <li key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="ni-sidebar__widget ni-newsletter">
            <h3 className="ni-sidebar__title"><Mail size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Newsletter</h3>
            <p>Recibe las noticias más importantes de Nicaragua cada mañana.</p>
            <label htmlFor="newsletter-email" className="sr-only">Correo electrónico</label>
            <input id="newsletter-email" type="email" placeholder="tucorreo@gmail.com" aria-label="Tu correo electrónico para el newsletter" />
            <button type="submit" aria-label="Suscribirse al newsletter">Suscribirme gratis</button>
          </div>
        </aside>
      </div>

    </div>
  );
}
