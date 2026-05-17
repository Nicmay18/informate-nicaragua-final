'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, TrendingUp, Flame, ChevronRight } from 'lucide-react';
import ProLayout from '@/components/ProLayout';
import type { Noticia } from '@/lib/types';

interface MobileHomeProps {
  noticias: Noticia[];
  masLeidas: Noticia[];
}

const CAT_MAP: Record<string, string> = {
  Sucesos: 'sucesos',
  Nacionales: 'nacionales',
  Deportes: 'deportes',
  Internacionales: 'internacionales',
  Espectaculos: 'espectaculos',
  Tecnologia: 'tecnologia',
};

const NAV_CATS = [
  { key: 'all', label: 'Todas' },
  { key: 'nacionales', label: 'Nacionales' },
  { key: 'sucesos', label: 'Sucesos' },
  { key: 'deportes', label: 'Deportes' },
  { key: 'internacionales', label: 'Internacionales' },
  { key: 'espectaculos', label: 'Espectáculos' },
  { key: 'tecnologia', label: 'Tecnología' },
];

function formatDateShort(fecha: string) {
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch { return fecha; }
}

function formatViews(n?: number) {
  if (!n) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function MobileHome({ noticias, masLeidas }: MobileHomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCat, setActiveCat] = useState('all');

  const heroNews = noticias.slice(0, 5);
  const filteredNews = activeCat === 'all' ? noticias.slice(1) : noticias.filter(n => CAT_MAP[n.categoria] === activeCat);

  useEffect(() => {
    if (heroNews.length <= 1) return;
    const id = setInterval(() => setCurrentSlide(i => (i + 1) % heroNews.length), 6000);
    return () => clearInterval(id);
  }, [heroNews.length]);

  const tickerText = noticias[0]?.titulo || 'Nicaragua Informate — Noticias en tiempo real';

  return (
    <ProLayout tickerText={tickerText}>
      {/* === HERO SLIDER === */}
      {heroNews.length > 0 && (
        <div className="hero-slider">
          {heroNews.map((n, i) => (
            <div key={n.slug} className={`hero-slide${i === currentSlide ? ' active' : ''}`}>
              <Image
                src={n.imagen || '/logo.png'}
                alt={n.titulo}
                width={800}
                height={500}
                className="hero-slide__img"
                priority={i === 0}
              />
              <div className="hero-slide__overlay">
                <span className={`hero-slide__badge hero-slide__badge--${CAT_MAP[n.categoria] || 'nacionales'}`}>{n.categoria}</span>
                <Link href={`/noticias/${n.slug}`}>
                  <h2 className="hero-slide__title">{n.titulo}</h2>
                </Link>
                <div className="hero-slide__meta">
                  <span><Clock size={12} /> {formatDateShort(n.fecha)}</span>
                  <span><Eye size={12} /> {formatViews(n.views)}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="hero-dots">
            {heroNews.map((_, i) => (
              <button key={i} className={`hero-dot${i === currentSlide ? ' active' : ''}`} onClick={() => setCurrentSlide(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>
      )}

      {/* === NAV CATEGORIES === */}
      <div className="nav-categories">
        {NAV_CATS.map(cat => (
          <button
            key={cat.key}
            className={`nav-cat${activeCat === cat.key ? ' active' : ''}`}
            onClick={() => setActiveCat(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* === NEWS GRID === */}
      <section className="section">
        <div className="section__header">
          <h2 className="section__title"><TrendingUp size={18} /> Últimas Noticias</h2>
          <Link href="/noticias" className="section__link">Ver todas <ChevronRight size={14} /></Link>
        </div>
        <div className="news-grid">
          {filteredNews.map(n => (
            <article key={n.slug} className="news-card">
              <Link href={`/noticias/${n.slug}`} className="news-card__img-wrapper">
                <Image
                  src={n.imagen || '/logo.png'}
                  alt={n.titulo}
                  width={400}
                  height={250}
                  className="news-card__img"
                />
                <span className={`news-card__badge news-card__badge--${CAT_MAP[n.categoria] || 'nacionales'}`}>{n.categoria}</span>
              </Link>
              <div className="news-card__content">
                <Link href={`/noticias/${n.slug}`}>
                  <h3 className="news-card__title">{n.titulo}</h3>
                </Link>
                <p className="news-card__excerpt">{n.resumen}</p>
                <div className="news-card__meta">
                  <span><Clock size={12} /> {formatDateShort(n.fecha)}</span>
                  <span><Eye size={12} /> {formatViews(n.views)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === INDICADORES ECONÓMICOS === */}
      <section className="section" style={{ paddingTop: 0 }}>
        <EcoCompact />
      </section>

      {/* === MÁS LEÍDAS === */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section__header">
          <h2 className="section__title"><Flame size={18} /> Más Leídas</h2>
        </div>
        <div className="trending-list">
          {masLeidas.slice(0, 5).map((n, i) => (
            <Link href={`/noticias/${n.slug}`} key={n.slug} className="trending-item">
              <span className={`trending-item__num${i < 3 ? ' trending-item__num--top' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
              <span className="trending-item__title">{n.titulo}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* === NEWSLETTER === */}
      <section className="section" style={{ paddingTop: 0 }}>
        <Newsletter />
      </section>
    </ProLayout>
  );
}

function EcoCompact() {
  return (
    <div className="eco-compact">
      <div className="eco-compact__header">
        <div className="eco-compact__title"><TrendingUp size={14} /> Indicadores</div>
        <span className="eco-compact__source">Banco Central</span>
      </div>
      <div className="eco-compact__rates">
        <div className="eco-rate">
          <div className="eco-rate__label">USD/NIO</div>
          <div className="eco-rate__value">36.62</div>
          <div className="eco-rate__change eco-rate__change--same">0.00</div>
        </div>
        <div className="eco-rate">
          <div className="eco-rate__label">EUR/NIO</div>
          <div className="eco-rate__value">39.85</div>
          <div className="eco-rate__change eco-rate__change--up">+0.15</div>
        </div>
      </div>
      <div className="eco-compact__fuels">
        <div className="eco-fuel"><span className="eco-fuel__label">Gasolina Súper</span><span className="eco-fuel__value">C$ 52.12</span></div>
        <div className="eco-fuel"><span className="eco-fuel__label">Gasolina Regular</span><span className="eco-fuel__value">C$ 49.85</span></div>
        <div className="eco-fuel"><span className="eco-fuel__label">Diésel</span><span className="eco-fuel__value">C$ 45.33</span></div>
      </div>
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };
  return (
    <div className="newsletter">
      <h3 className="newsletter__title">Newsletter</h3>
      <p className="newsletter__desc">Recibe las noticias más importantes cada mañana.</p>
      <form className="newsletter__form" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="tu@email.com"
          className="newsletter__input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="newsletter__btn">{submitted ? '¡Listo!' : 'Suscribir'}</button>
      </form>
    </div>
  );
}
