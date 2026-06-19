'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Flame, Radio, BarChart3, CloudSun, Globe, FolderOpen, Mail, TrendingUp, BookOpen } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { getResponsiveImageUrl, getHeroImageUrl } from '@/lib/image-utils';
import { getAllEvergreen } from '@/lib/evergreen';
import dynamic from 'next/dynamic';

const RadioPlayer = dynamic(() => import('./RadioPlayer'), { ssr: false, loading: () => <div style={{ height: 80, background: '#f1f5f9', borderRadius: 8 }} /> });
const EconomicBar = dynamic(() => import('./EconomicBar'), { ssr: false, loading: () => <div style={{ height: 60, background: '#f1f5f9', borderRadius: 8 }} /> });
const WeatherWidget = dynamic(() => import('./WeatherWidget'), { ssr: false, loading: () => <div style={{ height: 120, background: '#f1f5f9', borderRadius: 8 }} /> });
const WorldClock = dynamic(() => import('./WorldClock'), { ssr: false, loading: () => <div style={{ height: 140, background: '#0f172a', borderRadius: 12 }} /> });

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

function catClass(cat?: string) {
  const slug = cat?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const map: Record<string, string> = { sucesos: 'sucesos', nacionales: 'nacionales', espectaculos: 'espectaculos', deportes: 'deportes', tecnologia: 'tecnologia', tecnologa: 'tecnologia', internacionales: 'internacionales' };
  return map[slug || ''] || 'nacionales';
}

function BreakingMarquee({ noticias }: { noticias: Noticia[] }) {
  const list = useMemo(() => noticias.slice(0, 6), [noticias]);
  if (list.length === 0) return null;
  return (
    <div className="ni-marquee-bar">
      <div className="ni-marquee-bar__badge">Última entrada</div>
      <div className="ni-marquee-bar__content">
        <div className="ni-marquee-bar__scroll">
          {list.map((n) => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="ni-marquee-bar__item">
              <span className="ni-marquee-bar__arrow">➔</span> {n.titulo}
            </Link>
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
                <Link href={`/noticias/${n.slug}`} className="ni-tab-item__title">{n.titulo}</Link>
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
          <Link href={`/noticias/${items[idx]?.slug}`}>{items[idx]?.titulo}</Link>
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

function Card({ noticia, index = 0 }: { noticia: Noticia; index?: number }) {
  const cat = catClass(noticia.categoria);
  return (
    <article className="ni-card" style={{ animationDelay: `${index * 60}ms` }} data-animate="fadeInUp">
      <div className="ni-card__thumb">
        {noticia.imagen ? (
          <Image
            src={getResponsiveImageUrl(noticia.imagen, 400)}
            alt={noticia.titulo}
            fill
            sizes="(max-width: 768px) 120px, 220px"
            style={{ objectFit: 'cover' }}
            loading={index < 4 ? 'eager' : 'lazy'}
          />
        ) : null}
      </div>
      <div className="ni-card__content">
        <span className={`ni-card__pill ni-card__pill--${cat}`}>{noticia.categoria || 'Noticia'}</span>
        <span className="ni-card__title">
          <Link href={`/noticias/${noticia.slug}`}>{noticia.titulo}</Link>
        </span>
        <p className="ni-card__excerpt">{noticia.resumen || noticia.titulo}</p>
        <div className="ni-card__meta">
          <time className="ni-card__time" dateTime={noticia.fecha} suppressHydrationWarning>{timeAgo(noticia.fecha)}</time>
          {noticia.fechaActualizacion && (
            <time className="ni-card__updated" dateTime={noticia.fechaActualizacion} suppressHydrationWarning style={{ color: '#991b1b', fontWeight: 500, fontSize: 12 }}>
              Actualizado {timeAgo(noticia.fechaActualizacion)}
            </time>
          )}
          <span className="ni-card__author">{noticia.autor || 'Nicaragua Informate'}</span>
        </div>
        <div className="ni-card__share" style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://nicaraguainformate.com/noticias/' + noticia.slug)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en Facebook" style={{ fontSize: 11, color: '#1877f2', textDecoration: 'none', padding: '6px 12px', minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Facebook</a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent('https://nicaraguainformate.com/noticias/' + noticia.slug)}&text=${encodeURIComponent(noticia.titulo)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en X" style={{ fontSize: 11, color: '#000', textDecoration: 'none', padding: '6px 12px', minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>X</a>
          <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(noticia.titulo + ' https://nicaraguainformate.com/noticias/' + noticia.slug)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en WhatsApp" style={{ fontSize: 11, color: '#25d366', textDecoration: 'none', padding: '6px 12px', minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>WhatsApp</a>
        </div>
      </div>
    </article>
  );
}

function Section({ title, slug, color, noticias }: { title: string; slug: string; color: string; noticias: Noticia[] }) {
  if (noticias.length === 0) return null;
  return (
    <section className="ni-section">
      <div className="ni-section__header">
        <h2 className={`ni-section__title ni-section__title--${color}`}>{title}</h2>
        <Link href={`/categoria/${slug}`} className="ni-section__more">Ver más noticias de {title} →</Link>
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
  // Carrusel: las 7 noticias más recientes (noticias ya viene ordenado por fecha desc)
  const heroNoticias = noticias.slice(0, 7);

  // IDs del carousel: ninguna otra sección puede mostrar estas noticias
  const heroIds = useMemo(() => new Set(heroNoticias.map(n => n.id)), [heroNoticias]);

  // Resto = todas las noticias menos las que ya están en el hero
  const resto = useMemo(
    () => noticias.filter(n => !heroIds.has(n.id)),
    [noticias, heroIds]
  );

  // "Últimas noticias" = los 8 más recientes tras el hero
  const ultimas = useMemo(() => resto.slice(0, 8), [resto]);

  // Categorías usan TODAS las noticias (incluyendo hero y ultimas) para no quedar vacías
  const porCategoria = useMemo(() => {
    const map: Record<string, Noticia[]> = {};
    CATEGORIES.forEach(c => { map[c.slug] = []; });
    noticias.forEach(n => {
      const slug = n.categoria?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
      if (slug && map[slug]) map[slug].push(n);
    });
    CATEGORIES.forEach(c => { map[c.slug] = map[c.slug].slice(0, 4); });
    return map;
  }, [noticias]);


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
            <Link key={t.label} href={t.href} className="ni-top-tag" rel="nofollow">{t.label}</Link>
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
            <Link href="/guia" className="ni-section__more">Ver todas →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {getAllEvergreen().slice(0, 4).map((guia) => (
              <Link
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
              </Link>
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
                <Link href="/noticias" className="ni-section__more">Ver todas →</Link>
              </div>
              {ultimas.map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
            </section>
          )}

          {CATEGORIES.map(c => (
            <Section key={c.slug} title={c.name} slug={c.slug} color={c.color} noticias={porCategoria[c.slug]} />
          ))}
        </div>

        {/* SIDEBAR */}
        <aside className="ni-sidebar">
          {/* TABBED WIDGET (Más leídas all-time, Populares 7d, Tendencias recientes) */}
          <TabbedSidebarWidget ultimas={masLeidas} populares={populares.length > 0 ? populares : resto.slice(0, 5)} tendencias={resto.slice(5, 10)} />

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

          {/* Publicidad */}
          <div className="ni-sidebar__widget ni-ad">
            <span className="ni-ad__label">Publicidad</span>
            <div>Espacio disponible para tu marca</div>
          </div>
        </aside>
      </div>

    </div>
  );
}
