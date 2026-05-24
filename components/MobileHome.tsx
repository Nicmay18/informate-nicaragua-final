'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import WeatherWidget from './WeatherWidget';
import IndicadoresWidget from './IndicadoresWidget';
import NewsletterSignup from './NewsletterSignup';

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
  } catch {
    return dateStr;
  }
}

/* CHIPS / TENDENCIAS: Tags temáticos nicaragüenses actuales
   REGLA DE ORO: Si una palabra está en el menú como categoría,
   NO puede aparecer repetida aquí. Las chips son TEMAS, no categorías. */
const TRENDS = [
  { label: 'Elecciones 2026', rank: 1, href: '/buscar?q=elecciones' },
  { label: 'Dólar / Córdoba', rank: 2, href: '/buscar?q=dolar' },
  { label: 'Liga Primera', rank: 3, href: '/buscar?q=liga+primera' },
  { label: 'Bluefields', rank: 4, href: '/buscar?q=bluefields' },
  { label: 'Costa Caribe', rank: 5, href: '/buscar?q=costa+caribe' },
  { label: 'Clima', rank: 6, href: '/buscar?q=clima' },
  { label: 'Volcán', rank: 7, href: '/buscar?q=volcan' },
  { label: 'Migración', rank: 8, href: '/buscar?q=migracion' },
];

const CATEGORIES = [
  { name: 'Sucesos', slug: 'sucesos' },
  { name: 'Nacionales', slug: 'nacionales' },
  { name: 'Espectáculos', slug: 'espectaculos' },
  { name: 'Deportes', slug: 'deportes' },
  { name: 'Tecnología', slug: 'tecnologia' },
  { name: 'Internacionales', slug: 'internacionales' },
];

function HeroCarousel({ noticias }: { noticias: Noticia[] }) {
  const [idx, setIdx] = useState(0);
  const items = noticias.slice(0, 5);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx(p => (p + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  const noticia = items[idx];
  if (!noticia) return null;

  return (
    <section className="hero" aria-label="Noticias destacadas">
      <article className="hero-editorial">
        {/* Imagen cinematográfica full-bleed */}
        <div className="hero-editorial-media">
          {items.map((n, i) => (
            <div
              key={n.id}
              className="hero-editorial-slide"
              style={{ opacity: i === idx ? 1 : 0 }}
            >
              {n.imagen ? (
                <Image
                  src={n.imagen}
                  alt={n.titulo}
                  fill
                  sizes="100vw"
                  className="hero-editorial-img"
                  priority={i === 0}
                  style={{ objectFit: 'cover' }}
                />
              ) : null}
            </div>
          ))}

          {/* Overlay gradiente editorial */}
          <div className="hero-editorial-overlay" />

          {/* Categoría flotante */}
          <span className="hero-editorial-category">{noticia.categoria || 'Noticia'}</span>

          {/* Flechas editoriales */}
          {items.length > 1 && (
            <>
              <button
                className="hero-editorial-arrow hero-editorial-arrow--prev"
                onClick={() => setIdx(p => (p - 1 + items.length) % items.length)}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="hero-editorial-arrow hero-editorial-arrow--next"
                onClick={() => setIdx(p => (p + 1) % items.length)}
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Contenido editorial abajo */}
        <div className="hero-editorial-content">
          <div className="hero-editorial-meta">
            <time dateTime={noticia.fecha}>{timeAgo(noticia.fecha)}</time>
            <span className="hero-editorial-dot" />
            <span>{noticia.autor || 'Nicaragua Informate'}</span>
          </div>
          <h1 className="hero-editorial-title">{noticia.titulo}</h1>
          <p className="hero-editorial-lead">{noticia.resumen || noticia.titulo}</p>
          <div className="hero-editorial-actions">
            <Link href={`/noticias/${noticia.slug}`} className="hero-editorial-cta">
              Leer artículo completo
            </Link>
            <div className="hero-editorial-dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Noticia ${i + 1}`}
                  className={i === idx ? 'active' : ''}
                />
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function NewsCard({ noticia, featured }: { noticia: Noticia; featured?: boolean }) {
  return (
    <article className={`news-card${featured ? ' featured' : ''}`}>
      <Link href={`/noticias/${noticia.slug}`} className="news-card-link">
        <div className="news-image">
          {noticia.imagen ? (
            <Image
              src={noticia.imagen}
              alt={noticia.titulo}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
          ) : null}
          <span className="news-category">{noticia.categoria || 'Noticia'}</span>
        </div>
        <div className="news-body">
          <div>
            <h2 className="news-title">{noticia.titulo}</h2>
            {noticia.resumen ? (
              <p className="news-excerpt">{noticia.resumen}</p>
            ) : null}
          </div>
          <time className="news-date" dateTime={noticia.fecha} suppressHydrationWarning>{timeAgo(noticia.fecha)}</time>
        </div>
      </Link>
    </article>
  );
}

function TrendingItem({ noticia, index }: { noticia: Noticia; index: number }) {
  return (
    <article className="trending-item">
      <Link href={`/noticias/${noticia.slug}`} className="trending-link">
        <span className="trending-num">{index + 1}</span>
        <div className="trending-content">
          <h4>{noticia.titulo}</h4>
          <time dateTime={noticia.fecha} suppressHydrationWarning>{timeAgo(noticia.fecha)}</time>
        </div>
      </Link>
    </article>
  );
}

export default function MobileHome({
  noticias,
  masLeidas,
}: {
  noticias: Noticia[];
  masLeidas: Noticia[];
}) {
  const heroNoticias = noticias.slice(0, 5);
  const resto = noticias.slice(5);

  const nacionales = useMemo(() => resto.filter(n => n.categoria?.toLowerCase() === 'nacionales').slice(0, 4), [resto]);
  const sucesos = useMemo(() => resto.filter(n => n.categoria?.toLowerCase() === 'sucesos').slice(0, 4), [resto]);
  const internacionales = useMemo(() => resto.filter(n => n.categoria?.toLowerCase() === 'internacionales').slice(0, 4), [resto]);
  const tecnologia = useMemo(() => resto.filter(n => n.categoria?.toLowerCase() === 'tecnologia').slice(0, 4), [resto]);
  const deportes = useMemo(() => resto.filter(n => n.categoria?.toLowerCase() === 'deportes').slice(0, 4), [resto]);

  const general = useMemo(() => {
    const used = new Set<string>();
    nacionales.forEach(n => used.add(n.id));
    sucesos.forEach(n => used.add(n.id));
    internacionales.forEach(n => used.add(n.id));
    tecnologia.forEach(n => used.add(n.id));
    deportes.forEach(n => used.add(n.id));
    return resto.filter(n => !used.has(n.id)).slice(0, 4);
  }, [resto, nacionales, sucesos, internacionales, tecnologia, deportes]);

  const trending = masLeidas.length >= 5 ? masLeidas.slice(0, 5) : resto.slice(0, 5);

  return (
    <>
      <HeroCarousel noticias={heroNoticias} />

      {/* Trends */}
      <section className="trends-section">
        <div className="trends-bar">
          {TRENDS.map(t => (
            <Link key={t.rank} href={t.href} className="trend-chip">
              <span className="trend-rank">{t.rank}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="main-layout">
        <main>
          {/* Últimas noticias */}
          <section>
            <div className="section-header">
              <h2 className="section-title">Últimas noticias</h2>
              <Link href="/noticias" className="section-link">Ver todas las noticias</Link>
            </div>
            <div className="news-grid">
              {general.map((n, i) => <NewsCard key={n.id} noticia={n} featured={i < 3} />)}
            </div>
          </section>

          {/* Nacionales */}
          {nacionales.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Nacionales</h2>
                <Link href="/categoria/nacionales" className="section-link">Más noticias nacionales</Link>
              </div>
              <div className="news-grid">
                {nacionales.map(n => <NewsCard key={n.id} noticia={n} />)}
              </div>
            </section>
          )}

          {/* Banner mobile */}
          <div className="ad-banner" style={{ marginBottom: 44 }}>
            <h4>Publicidad</h4>
            <p>Espacio disponible para tu marca</p>
            <a href="mailto:info@nicaraguainformate.com" className="ad-btn">Anunciarse</a>
          </div>

          {/* Sucesos */}
          {sucesos.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Sucesos</h2>
                <Link href="/categoria/sucesos" className="section-link">Más sucesos</Link>
              </div>
              <div className="news-grid">
                {sucesos.map(n => <NewsCard key={n.id} noticia={n} />)}
              </div>
            </section>
          )}

          {/* Internacionales */}
          {internacionales.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Internacionales</h2>
                <Link href="/categoria/internacionales" className="section-link">Más internacionales</Link>
              </div>
              <div className="news-grid">
                {internacionales.map(n => <NewsCard key={n.id} noticia={n} />)}
              </div>
            </section>
          )}

          {/* Tecnología */}
          {tecnologia.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Tecnología</h2>
                <Link href="/categoria/tecnologia" className="section-link">Más tecnología</Link>
              </div>
              <div className="news-grid">
                {tecnologia.map(n => <NewsCard key={n.id} noticia={n} />)}
              </div>
            </section>
          )}

          {/* Deportes */}
          {deportes.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Deportes</h2>
                <Link href="/categoria/deportes" className="section-link">Más deportes</Link>
              </div>
              <div className="news-grid">
                {deportes.map(n => <NewsCard key={n.id} noticia={n} />)}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="ad-sidebar">
            <h4>Publicidad</h4>
            <p>Espacio disponible</p>
            <a href="mailto:info@nicaraguainformate.com" className="ad-btn">Contactar</a>
          </div>

          <IndicadoresWidget />

          <WeatherWidget />

          <div className="sidebar-widget">
            <h3 className="widget-title">Lo más leído</h3>
            {trending.map((n, i) => (
              <TrendingItem key={n.id} noticia={n} index={i} />
            ))}
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Categorías</h3>
            <div className="categories-cloud">
              {CATEGORIES.map(c => (
                <Link key={c.slug} href={`/categoria/${c.slug}`} className="cat-tag">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Newsletter</h3>
            <NewsletterSignup />
          </div>
        </aside>
      </div>
    </>
  );
}
