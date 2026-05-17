'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, TrendingUp, Flame, ChevronRight } from 'lucide-react';
import ProLayout from '@/components/ProLayout';
import { Noticia, CATEGORY_COLORS } from '@/lib/types';

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

function isNewArticle(fecha: string): boolean {
  try { return Date.now() - new Date(fecha).getTime() < 2 * 60 * 60 * 1000; }
  catch { return false; }
}

function NewsImagePlaceholder({ categoria, width, height, className }: { categoria: string; width?: number; height?: number; className?: string }) {
  const color = CATEGORY_COLORS[categoria] || '#8c1d18';
  return (
    <div
      className={className}
      style={{
        backgroundColor: color,
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        textAlign: 'center',
        minHeight: 70,
      }}
    >
      {categoria}
    </div>
  );
}

export default function MobileHome({ noticias, masLeidas }: MobileHomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCat, setActiveCat] = useState('all');
  const [readers, setReaders] = useState(0);

  useEffect(() => {
    setReaders(Math.floor(Math.random() * 900 + 150));
    const id = setInterval(() => setReaders(r => r + Math.floor(Math.random() * 5) - 2), 8000);
    return () => clearInterval(id);
  }, []);

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
      {/* === NAV CATEGORIES (antes del hero) === */}
      <nav className="nav-categories">
        {NAV_CATS.map(cat => (
          <button
            key={cat.key}
            className={`nav-cat${activeCat === cat.key ? ' active' : ''}`}
            onClick={() => setActiveCat(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* === HERO PRO CAROUSEL === */}
      {heroNews.length > 0 && (
        <section className="hero-pro">
          {/* Slides */}
          <div className="hero-pro__track">
            {heroNews.map((n, i) => (
              <article key={n.slug} className={`hero-pro__slide${i === currentSlide ? ' active' : ''}`}>
                {n.imagen && n.imagen !== '/logo.png' ? (
                  <Image
                    src={n.imagen}
                    alt={n.titulo}
                    fill
                    sizes="(max-width: 900px) calc(100vw - 32px), 70vw"
                    className="hero-pro__img"
                    priority={i === 0}
                  />
                ) : (
                  <div
                    className="hero-pro__img"
                    style={{
                      background: CATEGORY_COLORS[n.categoria] || '#8c1d18',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    {n.categoria}
                  </div>
                )}
                <div className="hero-pro__overlay">
                  <div className="hero-pro__content">
                    <span className={`hero-pro__badge news-badge--${CAT_MAP[n.categoria] || 'nacionales'}`}>
                      {n.categoria}
                    </span>
                    <Link href={`/noticias/${n.slug}`}>
                      <h2 className="hero-pro__title">{n.titulo}</h2>
                    </Link>
                    {n.resumen && (
                      <p className="hero-pro__excerpt">{n.resumen}</p>
                    )}
                    {i === currentSlide && readers > 0 && (
                      <div className="hero-readers">
                        <span className="hero-readers__dot" />
                        <span>{readers} personas leyendo ahora</span>
                      </div>
                    )}
                    <div className="hero-pro__footer">
                      <div className="hero-pro__meta">
                        <span><Clock size={11} /> {formatDateShort(n.fecha)}</span>
                        {n.vistas ? <span><Eye size={11} /> {formatViews(n.vistas)} lecturas</span> : null}
                      </div>
                      <Link href={`/noticias/${n.slug}`} className="hero-pro__cta">
                        Leer noticia →
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Flechas */}
          <button
            className="hero-pro__nav hero-pro__nav--prev"
            onClick={() => setCurrentSlide(i => (i - 1 + heroNews.length) % heroNews.length)}
            aria-label="Anterior"
          >‹</button>
          <button
            className="hero-pro__nav hero-pro__nav--next"
            onClick={() => setCurrentSlide(i => (i + 1) % heroNews.length)}
            aria-label="Siguiente"
          >›</button>

          {/* Indicadores */}
          <div className="hero-pro__indicators">
            <span className="hero-pro__counter">
              {String(currentSlide + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(heroNews.length).padStart(2, '0')}
            </span>
            <div className="hero-pro__bars">
              {heroNews.map((_, i) => (
                <button
                  key={i}
                  className={`hero-pro__bar${i === currentSlide ? ' active' : i < currentSlide ? ' done' : ''}`}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Ir a noticia ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === CONTENIDO PRINCIPAL === */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title"><TrendingUp size={18} /> Últimas Noticias</h2>
          <Link href="/noticias" className="section__link">Ver todas <ChevronRight size={14} /></Link>
        </div>

        <div className="editorial-grid">
          {/* ===== COLUMNA PRINCIPAL ===== */}
          <div className="editorial-main">

            {/* Card Destacada */}
            {filteredNews[0] && (
              <Link href={`/noticias/${filteredNews[0].slug}`} className="news-featured-card">
                {filteredNews[0].imagen && filteredNews[0].imagen !== '/logo.png' ? (
                  <Image
                    src={filteredNews[0].imagen}
                    alt={filteredNews[0].titulo}
                    width={800} height={450}
                    className="news-featured-card__img"
                    priority
                  />
                ) : (
                  <NewsImagePlaceholder categoria={filteredNews[0].categoria} className="news-featured-card__img" />
                )}
                <div className="news-featured-card__overlay">
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span className={`news-featured-card__badge news-badge--${CAT_MAP[filteredNews[0].categoria] || 'nacionales'}`}>
                      {filteredNews[0].categoria}
                    </span>
                    {isNewArticle(filteredNews[0].fecha) && <span className="badge-nuevo">NUEVO</span>}
                  </div>
                  <h3 className="news-featured-card__title">{filteredNews[0].titulo}</h3>
                  <div className="news-featured-card__meta">
                    <span><Clock size={11} /> {formatDateShort(filteredNews[0].fecha)}</span>
                    {filteredNews[0].vistas ? <span><Eye size={11} /> {formatViews(filteredNews[0].vistas)}</span> : null}
                  </div>
                </div>
              </Link>
            )}

            {/* Grid 2/3 columnas */}
            {filteredNews.slice(1, 4).length > 0 && (
              <div className="news-grid-2col">
                {filteredNews.slice(1, 4).map(n => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="news-card-sm">
                    <div className="news-card-sm__img-wrap">
                      {n.imagen && n.imagen !== '/logo.png' ? (
                        <Image src={n.imagen} alt={n.titulo} width={340} height={200} className="news-card-sm__img" />
                      ) : (
                        <NewsImagePlaceholder categoria={n.categoria} width={340} height={200} className="news-card-sm__img" />
                      )}
                      <span className={`news-card-sm__badge news-badge--${CAT_MAP[n.categoria] || 'nacionales'}`}>{n.categoria}</span>
                      {isNewArticle(n.fecha) && <span className="badge-nuevo badge-nuevo--card">NUEVO</span>}
                    </div>
                    <div className="news-card-sm__body">
                      <h3 className="news-card-sm__title">{n.titulo}</h3>
                      <div className="news-card-sm__meta"><Clock size={10} /> {formatDateShort(n.fecha)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Lista horizontal compacta */}
            {filteredNews.slice(4, 10).length > 0 && (
              <div className="section-cat-divider">
                <span>Más noticias</span>
              </div>
            )}
            {filteredNews.slice(4, 10).length > 0 && (
              <div className="news-list-compact">
                {filteredNews.slice(4, 10).map(n => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="news-list-item">
                    <div className="news-list-item__img-wrap">
                      {n.imagen && n.imagen !== '/logo.png' ? (
                        <Image src={n.imagen} alt={n.titulo} width={100} height={70} className="news-list-item__img" />
                      ) : (
                        <NewsImagePlaceholder categoria={n.categoria} width={100} height={70} className="news-list-item__img" />
                      )}
                    </div>
                    <div className="news-list-item__content">
                      <span className={`news-list-item__cat news-badge--${CAT_MAP[n.categoria] || 'nacionales'}`}>{n.categoria}</span>
                      <h3 className="news-list-item__title">{n.titulo}</h3>
                      <div className="news-list-item__meta">
                        <Clock size={10} /> {formatDateShort(n.fecha)}
                        {n.vistas ? <><Eye size={10} /> {formatViews(n.vistas)}</> : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ===== SIDEBAR ===== */}
          <aside className="editorial-sidebar">

            {/* Clima Widget */}
            <ClimaWidget />

            {/* Tendencias (Numbered) */}
            <div className="sidebar-widget">
              <div className="sidebar-widget__title">
                <span className="dot-live" /> Tendencias
              </div>
              <div className="sidebar-numbered-list">
                {noticias.slice(0, 6).map((n, i) => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="sidebar-numbered-item">
                    <span className="sidebar-num">{String(i + 1).padStart(2, '0')}</span>
                    <div className="sidebar-numbered-content">
                      <span className="sidebar-cat">{n.categoria}</span>
                      <span className="sidebar-title">{n.titulo}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Más Leídas (Numbered) */}
            <div className="sidebar-widget">
              <div className="sidebar-widget__title">
                <Flame size={14} color="#8c1d18" /> Más Leídas
              </div>
              <div className="sidebar-numbered-list">
                {masLeidas.slice(0, 3).map((n, i) => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="sidebar-numbered-item">
                    <span className="sidebar-num">{String(i + 1).padStart(2, '0')}</span>
                    <div className="sidebar-numbered-content">
                      <span className="sidebar-cat">{n.categoria}</span>
                      <span className="sidebar-title">{n.titulo}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Indicadores Económicos */}
            <div className="sidebar-widget">
              <div className="sidebar-widget__title"><TrendingUp size={14} /> Indicadores</div>
              <EcoCompact hideHeader />
            </div>

            {/* Newsletter */}
            <Newsletter />

            {/* Síguenos */}
            <Siguenos />

            {/* Apoya nuestro periodismo */}
            <ApoyaPeriodismo />

          </aside>
        </div>
      </div>
    </ProLayout>
  );
}

function EcoCompact({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <div className="eco-compact" style={hideHeader ? { border: 'none', borderRadius: 0 } : {}}>
      {!hideHeader && (
        <div className="eco-compact__header">
          <div className="eco-compact__title"><TrendingUp size={14} /> Indicadores</div>
          <span className="eco-compact__source">BCN/INC</span>
        </div>
      )}
      <div className="eco-compact__rates">
        <div className="eco-rate">
          <div className="eco-rate__label">Dólar BCN</div>
          <div className="eco-rate__value">C$36.62</div>
          <div className="eco-rate__change eco-rate__change--same">−0.00%</div>
        </div>
        <div className="eco-rate">
          <div className="eco-rate__label">Euro</div>
          <div className="eco-rate__value">C$43.11</div>
          <div className="eco-rate__change eco-rate__change--up">↑1.25%</div>
        </div>
      </div>
      <div className="eco-compact__fuels">
        <div className="eco-fuel"><span className="eco-fuel__label">Gasolina Regular</span><span className="eco-fuel__value">C$47.80–48.00</span></div>
        <div className="eco-fuel"><span className="eco-fuel__label">Gasolina Súper</span><span className="eco-fuel__value">C$49.00</span></div>
        <div className="eco-fuel"><span className="eco-fuel__label">Diesel</span><span className="eco-fuel__value">C$43.21–43.40</span></div>
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
        <button type="submit" className="newsletter__btn">{submitted ? '¡Listo!' : 'Suscribirse'}</button>
      </form>
    </div>
  );
}

/* ============================================================
   CLIMA WIDGET (sidebar)
   ============================================================ */
const CLIMA_DATA = [
  { ciudad: 'Managua',        temp: 27, icon: '☀️',  cond: 'Soleado',            hum: 68, viento: 15 },
  { ciudad: 'León',           temp: 29, icon: '☀️',  cond: 'Caluroso',           hum: 65, viento: 18 },
  { ciudad: 'Granada',        temp: 26, icon: '⛅',  cond: 'Nublado parcial',    hum: 72, viento: 12 },
  { ciudad: 'Rivas',          temp: 33, icon: '☀️',  cond: 'Muy soleado',        hum: 60, viento: 20 },
  { ciudad: 'Estelí',         temp: 28, icon: '☀️',  cond: 'Despejado',          hum: 55, viento: 10 },
  { ciudad: 'Bluefields',     temp: 26, icon: '🌦️', cond: 'Casi despejado',     hum: 91, viento: 20 },
  { ciudad: 'Nueva Segovia',  temp: 27, icon: '☀️',  cond: 'Despejado',          hum: 58, viento: 8  },
  { ciudad: 'Carazo',         temp: 31, icon: '⛅',  cond: 'Parcialmente nublado',hum: 70, viento: 16 },
];

function ClimaWidget() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % CLIMA_DATA.length), 5000);
    return () => clearInterval(id);
  }, []);
  const c = CLIMA_DATA[idx];
  return (
    <div className="clima-sidebar">
      <div className="clima-sidebar__header">
        <span className="clima-sidebar__label">🌡 CLIMA · {c.ciudad}</span>
        <span className="clima-sidebar__tag">En vivo</span>
      </div>
      <div className="clima-sidebar__main">
        <span className="clima-sidebar__icon">{c.icon}</span>
        <div>
          <div className="clima-sidebar__temp">{c.temp}°</div>
          <div className="clima-sidebar__cond">{c.cond}</div>
        </div>
      </div>
      <div className="clima-sidebar__stats">
        <div className="clima-sidebar__stat">
          <span className="clima-sidebar__stat-val">💧 {c.hum}</span>
          <span className="clima-sidebar__stat-label">HUMEDAD</span>
        </div>
        <div className="clima-sidebar__stat">
          <span className="clima-sidebar__stat-val">💨 {c.viento}</span>
          <span className="clima-sidebar__stat-label">VIENTO km/h</span>
        </div>
      </div>
      <div className="clima-sidebar__cities">
        {CLIMA_DATA.filter((_, i) => i !== idx).slice(0, 4).map(d => (
          <span key={d.ciudad} className="clima-sidebar__city-chip">
            {d.ciudad.split(' ')[0]} {d.temp}°
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SÍGUENOS
   ============================================================ */
function Siguenos() {
  return (
    <div className="sidebar-widget">
      <div className="sidebar-widget__title">📲 Síguenos</div>
      <div className="siguenos-grid">
        <a href="https://facebook.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" className="siguenos-item siguenos-item--fb">
          <span className="siguenos-item__icon">f</span>
          <div>
            <div className="siguenos-item__name">Facebook</div>
            <div className="siguenos-item__desc">Noticias diarias</div>
          </div>
        </a>
        <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" className="siguenos-item siguenos-item--wa">
          <span className="siguenos-item__icon">W</span>
          <div>
            <div className="siguenos-item__name">WhatsApp</div>
            <div className="siguenos-item__desc">Únete al canal</div>
          </div>
        </a>
        <a href="https://t.me/nicaraguainformate" target="_blank" rel="noopener noreferrer" className="siguenos-item siguenos-item--tg">
          <span className="siguenos-item__icon">✈</span>
          <div>
            <div className="siguenos-item__name">Telegram</div>
            <div className="siguenos-item__desc">Alertas al instante</div>
          </div>
        </a>
        <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="siguenos-item siguenos-item--rss">
          <span className="siguenos-item__icon">◉</span>
          <div>
            <div className="siguenos-item__name">RSS</div>
            <div className="siguenos-item__desc">Feed de noticias</div>
          </div>
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   APOYA NUESTRO PERIODISMO
   ============================================================ */
function ApoyaPeriodismo() {
  return (
    <div className="apoya-widget">
      <div className="apoya-widget__heart">❤️</div>
      <h3 className="apoya-widget__title">Apoya nuestro periodismo</h3>
      <p className="apoya-widget__desc">
        Tu contribución nos permite seguir informando con independencia y veracidad desde Managua.
      </p>
      <a href="https://www.paypal.com/paypalme/NicaraguaInformate" target="_blank" rel="noopener noreferrer" className="apoya-widget__btn">💙 Apoyar con PayPal</a>
    </div>
  );
}
