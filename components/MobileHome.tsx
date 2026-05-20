"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, Flame, ChevronRight, TrendingUp } from 'lucide-react';
import ProLayout from '@/components/ProLayout';
import HeroCarousel from '@/components/HeroCarousel';
import WeatherWidget from '@/components/WeatherWidget';
import IndicadoresWidget from '@/components/IndicadoresWidget';
import NewsletterSignup from '@/components/NewsletterSignup';
import { tiempoLectura } from '@/lib/formateo';
import type { Noticia } from '@/lib/types';

interface MobileHomeProps {
  noticias: Noticia[];
  masLeidas: Noticia[];
}

const SECTION_CONFIG = [
  { label: 'Nacionales', key: 'Nacionales', slug: '/categoria/nacionales' },
  { label: 'Sucesos', key: 'Sucesos', slug: '/categoria/sucesos' },
  { label: 'Internacionales', key: 'Internacionales', slug: '/categoria/internacionales' },
  { label: 'Deportes', key: 'Deportes', slug: '/categoria/deportes' },
];

const LATEST_LIMIT = 6;

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
}

function readTime(resumen?: string, contenido?: string) {
  return `${Math.max(1, tiempoLectura(contenido || resumen || ''))} min`;
}

function PlaceholderBadge({ label }: { label: string }) {
  return (
    <div className="card-image-placeholder">
      <Newspaper size={28} />
      <span>{label}</span>
    </div>
  );
}

function CardImage({ src, alt, category }: { src?: string | null; alt: string; category: string }) {
  if (!src || src === '/logo.png') {
    return <PlaceholderBadge label={category} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="card-image"
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 320px"
    />
  );
}

function NewsCard({ noticia, highlight = false }: { noticia: Noticia; highlight?: boolean }) {
  return (
    <article className={`news-card${highlight ? ' news-card--highlight' : ''}`}>
      <Link href={`/noticias/${noticia.slug}`} className="card-link">
        <div className="card-image-wrapper">
          <CardImage src={noticia.imagen} alt={noticia.titulo} category={noticia.categoria} />
          <span className="card-category">{noticia.categoria}</span>
        </div>
        <div className="card-body">
          <h3 className="card-title">{noticia.titulo}</h3>
          <div className="card-meta">
            <time dateTime={noticia.fecha}>{formatDate(noticia.fecha)}</time>
            <span className="read-time">{readTime(noticia.resumen, noticia.contenido)}</span>
          </div>
          {noticia.resumen && <p className="card-excerpt">{noticia.resumen}</p>}
        </div>
      </Link>
    </article>
  );
}

function AdSlot({ label = 'Publicidad', variant = 'leaderboard' }: { label?: string; variant?: 'leaderboard' | 'inline' }) {
  return (
    <div className={`ad-slot ad-slot--${variant}`} aria-label={label} role="presentation">
      <span>{label}</span>
      <small>970x250 / Responsive</small>
    </div>
  );
}

export default function MobileHome({ noticias, masLeidas }: MobileHomeProps) {
  const hero = noticias[0];
  const latest = noticias.slice(1, LATEST_LIMIT + 1);
  const tickerText = hero?.titulo || 'Nicaragua Informate — Noticias de Nicaragua en tiempo real';

  return (
    <ProLayout tickerText={tickerText}>
      <div className="home-wrapper">
        <div className="home-content">
          {noticias.length > 0 && (
            <section className="home-hero">
              <HeroCarousel noticias={noticias.slice(0, 5)} />
            </section>
          )}

          <AdSlot />

          <section className="home-section">
            <header className="section-header">
              <div className="section-accent" />
              <div>
                <p className="section-eyebrow">Última hora</p>
                <h2>Últimas Noticias</h2>
              </div>
              <Link href="/noticias" className="section-link">Ver todas <ChevronRight size={16} /></Link>
            </header>
            <div className="news-grid">
              {latest.map((n) => <NewsCard key={n.slug} noticia={n} />)}
            </div>
          </section>

          <AdSlot variant="inline" />

          {SECTION_CONFIG.map((section) => {
            const items = noticias.filter((n) => n.categoria === section.key).slice(0, 3);
            if (items.length === 0) return null;
            return (
              <section key={section.key} className="home-section">
                <header className="section-header">
                  <div className="section-accent" />
                  <div>
                    <p className="section-eyebrow">Curado por la redacción</p>
                    <h2>{section.label}</h2>
                  </div>
                  <Link href={section.slug} className="section-link">Ver más <ChevronRight size={16} /></Link>
                </header>
                <div className="news-row">
                  {items.map((item) => (
                    <NewsCard key={item.slug} noticia={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="home-sidebar">
          <div className="widget">
            <NewsletterSignup variant="sidebar" />
          </div>
          <div className="widget">
            <div className="widget__title">Clima en Nicaragua</div>
            <WeatherWidget />
          </div>
          {noticias.length > 1 && (
            <div className="widget">
              <div className="widget__title"><TrendingUp size={16} /> Tendencias</div>
              <ol className="widget-list widget-list--compact">
                {noticias.slice(1, 6).map((n, idx) => (
                  <li key={n.slug}>
                    <Link href={`/noticias/${n.slug}`}>
                      <span className="widget-list__index">{idx + 1}</span>
                      <div>
                        <p className="widget-list__title">{n.titulo}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {masLeidas.length > 0 && (
            <div className="widget">
              <div className="widget__title"><Flame size={16} color="#dc2626" /> Más leídas</div>
              <ol className="widget-list">
                {masLeidas.slice(0, 5).map((n, idx) => (
                  <li key={n.slug}>
                    <Link href={`/noticias/${n.slug}`}>
                      {n.imagen && n.imagen !== '/logo.png' ? (
                        <img src={n.imagen} alt="" width={48} height={48} style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <span className="widget-list__index">{idx + 1}</span>
                      )}
                      <div>
                        <p className="widget-list__title">{n.titulo}</p>
                        <span className="widget-list__meta">{formatDate(n.fecha)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="widget">
            <div className="widget__title"><TrendingUp size={16} /> Indicadores Económicos</div>
            <IndicadoresWidget />
          </div>
        </aside>
      </div>
    </ProLayout>
  );
}
