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
              <Link
                key={n.slug}
                href={`/noticias/${n.slug}`}
                className={`hero-pro__slide${i === currentSlide ? ' active' : ''}`}
              >
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
                    <h2 className="hero-pro__title">{n.titulo}</h2>
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
                    </div>
                  </div>
                </div>
              </Link>
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
            {heroNews.map((_, i) => (
              <button
                key={i}
                className={`hero-pro__dot${i === currentSlide ? ' active' : ''}`}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Ir a noticia ${i + 1}`}
              />
            ))}
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

            {/* Lista horizontal unificada */}
            {filteredNews.slice(1).length > 0 && (
              <div className="news-list-compact">
                {filteredNews.slice(1).map(n => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="news-list-item">
                    <div className="news-list-item__img-wrap">
                      {n.imagen && n.imagen !== '/logo.png' ? (
                        <Image src={n.imagen} alt={n.titulo} width={120} height={90} className="news-list-item__img" />
                      ) : (
                        <NewsImagePlaceholder categoria={n.categoria} width={120} height={90} className="news-list-item__img" />
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

            {/* Escucha en vivo */}
            <RadioWidget />

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
   RADIO WIDGET
   ============================================================ */
const RADIO_STATIONS = [
  { name: 'La Buenísima', freq: '93.1 FM', color: '#ef4444' },
  { name: 'Viva FM', freq: '98.3 FM', color: '#10b981' },
  { name: 'Radio Futura', freq: '91.3 FM', color: '#8b5cf6' },
];
function RadioWidget() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f35 100%)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>EN VIVO — Radio Nicaragua</span>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        {RADIO_STATIONS.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 0',
            borderBottom: i < RADIO_STATIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: `0 0 6px ${s.color}80` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{s.freq}</div>
            </div>
          </div>
        ))}
        <div style={{
          marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          Usa el reproductor ▼ en la barra inferior para escuchar
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SÍGUENOS
   ============================================================ */
const MOBILE_SOCIALS = [
  { href: 'https://facebook.com/profile.php?id=61578261125687', label: 'Facebook', action: 'Seguir página', color: '#1877F2', sigla: 'f' },
  { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', label: 'WhatsApp', action: 'Unirse al canal', color: '#25D366', sigla: 'W' },
  { href: 'https://t.me/+fHHjncJqMQM3NjZh', label: 'Telegram', action: 'Unirse al grupo', color: '#0088cc', sigla: 'T' },
  { href: '/feed.xml', label: 'RSS', action: 'Suscribirse al feed', color: '#e8590c', sigla: '★' },
];
function Siguenos() {
  return (
    <div style={{
      background: 'var(--c-surface-elevated)',
      border: '1px solid var(--c-border-light)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '2px solid var(--c-primary)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-accent)', display: 'inline-block' }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Nuestras Redes</span>
      </div>
      {MOBILE_SOCIALS.map((s, i) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 16px',
            borderBottom: i < MOBILE_SOCIALS.length - 1 ? '1px solid var(--c-border-light)' : 'none',
            borderLeft: `3px solid ${s.color}`,
            background: 'transparent', textDecoration: 'none',
          }}
        >
          <span style={{ width: 30, height: 30, borderRadius: 6, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.sigla}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 1 }}>{s.action}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--c-text-muted)', flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
        </a>
      ))}
    </div>
  );
}

/* ============================================================
   APOYA NUESTRO PERIODISMO
   ============================================================ */
function ApoyaPeriodismo() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--c-primary) 0%, #0F2340 100%)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {/* Header bar */}
      <div style={{
        background: 'var(--c-accent)',
        padding: '6px 16px',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: '#fff',
      }}>
        Periodismo Independiente
      </div>
      <div style={{ padding: '20px 18px 22px' }}>
        <p style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1.3,
          marginBottom: 8,
          fontFamily: 'var(--font-merri, Georgia, serif)',
        }}>
          Apoya nuestra redacción
        </p>
        <p style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.6,
          marginBottom: 18,
        }}>
          Tu aporte nos permite mantener el periodismo verificado e independiente desde Managua.
        </p>
        <a
          href="https://www.paypal.com/paypalme/NicaraguaInformate"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#fff',
            color: '#003087',
            fontWeight: 800,
            fontSize: 13,
            padding: '10px 20px',
            borderRadius: 6,
            textDecoration: 'none',
            letterSpacing: '0.2px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#003087"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.828c-.666 0-1.226.49-1.33 1.146l-1.4 8.883a.64.64 0 0 0 .634.738h3.994c.524 0 .968-.382 1.051-.9l.437-2.766c.083-.518.527-.9 1.051-.9h.663c3.872 0 6.904-1.573 7.786-6.12.378-1.945.164-3.563-.492-4.876z"/></svg>
          Donar con PayPal
        </a>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>
          Seguro · Cifrado · Verificado
        </p>
      </div>
    </div>
  );
}
