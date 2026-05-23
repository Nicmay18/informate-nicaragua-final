'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import WeatherWidget from '@/components/WeatherWidget';
import IndicadoresWidget from '@/components/IndicadoresWidget';
import NewsletterSignup from '@/components/NewsletterSignup';
import type { Noticia } from '@/lib/types';

interface MobileHomeProps {
  noticias: Noticia[];
  masLeidas: Noticia[];
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDate(date: string) {
  try {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch { return date; }
}

function timeAgo(date: string) {
  try {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return 'Hace ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'Hace ' + Math.floor(diff / 3600) + ' horas';
    return formatDate(date);
  } catch { return date; }
}

export default function MobileHome({ noticias, masLeidas }: MobileHomeProps) {
  const hero = noticias[0];
  const nacionales = noticias.filter(n => n.categoria === 'Nacionales').slice(0, 2);
  const internacionales = noticias.filter(n => n.categoria === 'Internacionales').slice(0, 2);
  const tecnologia = noticias.filter(n => n.categoria === 'Tecnología').slice(0, 2);
  const sucesos = noticias.filter(n => n.categoria === 'Sucesos').slice(0, 2);
  const deportes = noticias.filter(n => n.categoria === 'Deportes').slice(0, 2);

  const categories = [
    { title: 'Nacionales', items: nacionales, slug: 'nacionales' },
    { title: 'Internacionales', items: internacionales, slug: 'internacionales' },
    { title: 'Tecnología', items: tecnologia, slug: 'tecnologia' },
    { title: 'Sucesos', items: sucesos, slug: 'sucesos' },
    { title: 'Deportes', items: deportes, slug: 'deportes' },
  ];

  return (
    <>
      {/* Hero simple */}
      {hero && (
        <section className="hero">
          <article className="hero-card">
            <div className="hero-image" style={{ minHeight: '320px' }}>
              {hero.imagen && hero.imagen !== '/logo.png' ? (
                <Image src={hero.imagen} alt={hero.titulo} fill sizes="100vw" style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)' }} />
              )}
              <span className="hero-badge">Destacada</span>
            </div>
            <div className="hero-content">
              <div className="hero-meta">
                <span>{hero.categoria || 'Noticias'}</span>
                <span className="dot"></span>
                <span>{formatDate(hero.fecha)}</span>
              </div>
              <h1 className="hero-title">{hero.titulo}</h1>
              {hero.resumen && <p className="hero-excerpt">{hero.resumen}</p>}
              <Link href={`/noticias/${hero.slug}`} className="btn-primary">
                Leer análisis completo <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        </section>
      )}

      {/* Tendencias */}
      {masLeidas.length > 0 && (
        <section className="trends-section">
          <div className="section-header" style={{ marginBottom: '14px' }}>
            <h2 className="section-title">Tendencias</h2>
          </div>
          <div className="trends-bar">
            {masLeidas.slice(0, 10).map((n, i) => (
              <Link href={`/noticias/${n.slug}`} key={n.slug} className="trend-chip">
                <span className="trend-rank">{i + 1}</span>
                {n.titulo.slice(0, 22)}…
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main layout */}
      <div className="main-layout">
        <main>
          {/* Secciones por categoría */}
          {categories.map((cat) => cat.items.length > 0 && (
            <div key={cat.slug}>
              <div className="section-header">
                <h2 className="section-title">{cat.title}</h2>
                <Link href={`/categoria/${cat.slug}`} className="section-link">Ver todas →</Link>
              </div>
              <div className="news-grid">
                {cat.items.map((n) => (
                  <Link href={`/noticias/${n.slug}`} key={n.id} className="news-card">
                    <div className="news-image">
                      {n.imagen && n.imagen !== '/logo.png' ? (
                        <Image src={n.imagen} alt={n.titulo} width={600} height={400} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,var(--primary) 0%,var(--primary-light) 100%)', color: 'var(--accent)', fontWeight: 700 }}>
                          {n.categoria}
                        </div>
                      )}
                      <span className="news-category">{n.categoria}</span>
                    </div>
                    <div className="news-body">
                      <div className="news-date">📅 {formatDate(n.fecha)}</div>
                      <h3 className="news-title">{n.titulo}</h3>
                      {n.resumen && <p className="news-excerpt">{n.resumen.slice(0, 100)}…</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </main>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-widget">
            <h3 className="widget-title">Indicadores Económicos</h3>
            <IndicadoresWidget />
          </div>

          <div className="sidebar-widget weather-widget">
            <h3 className="widget-title">Clima en Nicaragua</h3>
            <WeatherWidget />
          </div>

          {masLeidas.length > 0 && (
            <div className="sidebar-widget">
              <h3 className="widget-title">Lo más leído</h3>
              {masLeidas.slice(0, 5).map((n, i) => (
                <Link href={`/noticias/${n.slug}`} key={n.slug} className="trending-item">
                  <span className="trending-num">{i + 1}</span>
                  <div className="trending-content">
                    <h4>{n.titulo}</h4>
                    <span>{timeAgo(n.fecha)} • {n.categoria}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="sidebar-widget">
            <h3 className="widget-title">Newsletter</h3>
            <NewsletterSignup variant="sidebar" />
          </div>
        </aside>
      </div>
    </>
  );
}
