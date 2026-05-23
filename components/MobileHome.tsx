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

const TRENDS = [
  { label: 'Elecciones 2026', rank: 1, href: '/buscar?q=elecciones' },
  { label: 'Economía Nicaragua', rank: 2, href: '/categoria/economia' },
  { label: 'Sucesos de hoy', rank: 3, href: '/categoria/sucesos' },
  { label: 'Dólar / Córdoba', rank: 4, href: '/buscar?q=dolar' },
  { label: 'Tecnología', rank: 5, href: '/categoria/tecnologia' },
  { label: 'Deportes', rank: 6, href: '/categoria/deportes' },
  { label: 'Internacionales', rank: 7, href: '/categoria/internacionales' },
  { label: 'Clima', rank: 8, href: '/buscar?q=clima' },
];

const CATEGORIES = [
  { name: 'Nacionales', slug: 'nacionales' },
  { name: 'Sucesos', slug: 'sucesos' },
  { name: 'Internacionales', slug: 'internacionales' },
  { name: 'Economía', slug: 'economia' },
  { name: 'Deportes', slug: 'deportes' },
  { name: 'Tecnología', slug: 'tecnologia' },
  { name: 'Política', slug: 'politica' },
  { name: 'Cultura', slug: 'cultura' },
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
      <article className="hero-card" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Carousel slides */}
        <div className="hero-slides" style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
          {items.map((n, i) => (
            <div
              key={n.id}
              style={{
                position: 'absolute', inset: 0,
                opacity: i === idx ? 1 : 0,
                transition: 'opacity 0.7s ease',
                zIndex: i === idx ? 1 : 0,
              }}
            >
              {n.imagen ? (
                <Image
                  src={n.imagen}
                  alt={n.titulo}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="hero-img"
                  priority={i === 0}
                  style={{ objectFit: 'cover' }}
                />
              ) : null}
            </div>
          ))}
          {/* Badge del slide activo */}
          <span className="hero-badge">{noticia.categoria || 'Noticia'}</span>
        </div>

        {/* Content flotante abajo */}
        <div className="hero-content">
          <div className="hero-meta">
            <time dateTime={noticia.fecha}>{timeAgo(noticia.fecha)}</time>
            <span className="dot" />
            <span>{noticia.autor || 'Nicaragua Informate'}</span>
          </div>
          <h1 className="hero-title">{noticia.titulo}</h1>
          <p className="hero-excerpt">{noticia.resumen || noticia.titulo}</p>
          <Link href={`/noticias/${noticia.slug}`} className="btn-primary-hero">
            Leer más
          </Link>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ir a noticia ${i + 1}`}
                style={{
                  width: i === idx ? 20 : 8, height: 8, borderRadius: 4,
                  background: i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Flechas (solo desktop) */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => setIdx(p => (p - 1 + items.length) % items.length)}
              style={{
                position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'rgba(0,0,0,0.4)', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10,
              }}
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setIdx(p => (p + 1) % items.length)}
              style={{
                position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'rgba(0,0,0,0.4)', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10,
              }}
              aria-label="Siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </article>
    </section>
  );
}

function NewsCard({ noticia }: { noticia: Noticia }) {
  return (
    <article className="news-card">
      <Link href={`/noticias/${noticia.slug}`} className="news-card-link">
        <div className="news-image">
          {noticia.imagen ? (
            <Image
              src={noticia.imagen}
              alt={noticia.titulo}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : null}
          <span className="news-category">{noticia.categoria || 'Noticia'}</span>
        </div>
        <div className="news-body">
          <time className="news-date" dateTime={noticia.fecha} suppressHydrationWarning>{timeAgo(noticia.fecha)}</time>
          <h2 className="news-title">{noticia.titulo}</h2>
          {noticia.resumen ? (
            <p className="news-excerpt">{noticia.resumen}</p>
          ) : null}
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
              <Link href="/noticias" className="section-link">Ver todas</Link>
            </div>
            <div className="news-grid">
              {general.map(n => <NewsCard key={n.id} noticia={n} />)}
            </div>
          </section>

          {/* Nacionales */}
          {nacionales.length > 0 && (
            <section>
              <div className="section-header">
                <h2 className="section-title">Nacionales</h2>
                <Link href="/categoria/nacionales" className="section-link">Ver todas</Link>
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
                <Link href="/categoria/sucesos" className="section-link">Ver todas</Link>
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
                <Link href="/categoria/internacionales" className="section-link">Ver todas</Link>
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
                <Link href="/categoria/tecnologia" className="section-link">Ver todas</Link>
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
                <Link href="/categoria/deportes" className="section-link">Ver todas</Link>
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
