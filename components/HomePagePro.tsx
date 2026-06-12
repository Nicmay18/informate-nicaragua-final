'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Flame, Radio, BarChart3, CloudSun, Globe, FolderOpen, Mail, TrendingUp } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { getResponsiveImageUrl } from '@/lib/image-utils';
import dynamic from 'next/dynamic';

const RadioPlayer = dynamic(() => import('./RadioPlayer'), { ssr: false, loading: () => <div style={{ height: 80, background: '#f1f5f9', borderRadius: 8 }} /> });
const EconomicBar = dynamic(() => import('./EconomicBar'), { ssr: false, loading: () => <div style={{ height: 60, background: '#f1f5f9', borderRadius: 8 }} /> });
const WeatherWidget = dynamic(() => import('./WeatherWidget'), { ssr: false, loading: () => <div style={{ height: 120, background: '#f1f5f9', borderRadius: 8 }} /> });
const WorldClock = dynamic(() => import('./WorldClock'), { ssr: false, loading: () => <div style={{ height: 140, background: '#0f172a', borderRadius: 12 }} /> });

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
          {/* Duplicado para loop continuo fluido */}
          {list.map((n) => (
            <Link key={`${n.id}-dup`} href={`/noticias/${n.slug}`} className="ni-marquee-bar__item">
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

function Hero({ noticias }: { noticias: Noticia[] }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const items = noticias.slice(0, 5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const isPausedRef = useRef(false);

  const resetTimer = useCallback(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, []);

  const goToSlide = useCallback((i: number) => {
    setIdx(i);
    resetTimer();
  }, [resetTimer]);

  const nextSlide = useCallback(() => {
    setIdx(p => (p + 1) % items.length);
    resetTimer();
  }, [items.length, resetTimer]);

  useEffect(() => {
    if (items.length <= 1) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    resetTimer();

    const duration = 6000;
    const tick = 50;

    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      elapsedRef.current += tick;
      setProgress((elapsedRef.current / duration) * 100);
      if (elapsedRef.current >= duration) {
        setIdx(p => (p + 1) % items.length);
        resetTimer();
      }
    }, tick);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [items.length, idx]);

  return (
    <section className="ni-hero" aria-label="Noticias destacadas">
      <div className="ni-hero__track">
        {items.map((item, i) => (
          <article key={item.id} className={`ni-hero__slide${i === idx ? ' is-active' : ''}`}>
            <div className="ni-hero__media">
              {item.imagen ? (
                i === 0 ? (
                  // Primer slide = LCP: carga directo desde jsDelivr sin weserv.nl
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getResponsiveImageUrl(item.imagen)}
                    alt={item.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }}
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <Image
                    src={getResponsiveImageUrl(item.imagen, 400)}
                    alt={item.titulo}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'cover', objectPosition: 'center center' }}
                    loading="lazy"
                    crossOrigin="anonymous"
                    unoptimized={false}
                  />
                )
              ) : null}
            </div>
          </article>
        ))}
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
                {i === idx && <span className="ni-hero__ind-bar" style={{ width: `${progress}%` }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Card({ noticia }: { noticia: Noticia }) {
  const cat = catClass(noticia.categoria);
  return (
    <article className="ni-card">
      <div className="ni-card__thumb">
        {noticia.imagen ? (
          <Image src={getResponsiveImageUrl(noticia.imagen, 400)} alt={noticia.titulo} fill sizes="(max-width:900px) 100px, 220px" style={{ objectFit: 'cover' }} />
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
          <span className="ni-card__author">{noticia.autor || 'Nicaragua Informate'}</span>
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
        <Link href={`/categoria/${slug}`} className="ni-section__more">Más {slug} →</Link>
      </div>
      {noticias.length <= 2 ? (
        noticias.map(n => <Card key={n.id} noticia={n} />)
      ) : (
        <div className="ni-grid-2">
          {noticias.map(n => <Card key={n.id} noticia={n} />)}
        </div>
      )}
    </section>
  );
}

export default function HomePagePro({ noticias, masLeidas }: { noticias: Noticia[]; masLeidas: Noticia[] }) {
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
      {/* ETIQUETAS PRINCIPALES */}
      <div className="ni-top-tags">
        <span className="ni-top-tags__label"># Etiquetas principales</span>
        <div className="ni-top-tags__list">
          {TRENDS.map(t => (
            <Link key={t.label} href={t.href} className="ni-top-tag">{t.label}</Link>
          ))}
        </div>
      </div>

      {/* MARQUEE / TICKER */}
      <BreakingMarquee noticias={noticias} />

      {/* HERO */}
      <Hero noticias={heroNoticias} />

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
              {ultimas.map(n => <Card key={n.id} noticia={n} />)}
            </section>
          )}

          {CATEGORIES.map(c => (
            <Section key={c.slug} title={c.name} slug={c.slug} color={c.color} noticias={porCategoria[c.slug]} />
          ))}
        </div>

        {/* SIDEBAR */}
        <aside className="ni-sidebar">
          {/* TABBED WIDGET (Últimas, Populares, Tendencias) */}
          <TabbedSidebarWidget ultimas={masLeidas} populares={resto.slice(0, 5)} tendencias={resto.slice(5, 10)} />

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
