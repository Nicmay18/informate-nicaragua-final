'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Menu, X, Play, Pause, Radio, Moon, Sun,
  Calendar, ChevronRight, Flame, TrendingUp, Trophy,
  Minus, ArrowUp, Clock, Eye,
  Flag, AlertTriangle, Globe, Film, Laptop, Mail,
  CheckCircle, AlertCircle
} from 'lucide-react';
import type { Noticia } from '@/lib/types';

interface MobileHomeProps {
  noticias: Noticia[];
  masLeidas: Noticia[];
}

const CAT_CLASS: Record<string, string> = {
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

const ICONS: Record<string, React.ReactNode> = {
  Nacionales: <Flag size={18} />,
  Sucesos: <AlertTriangle size={18} />,
  Deportes: <Trophy size={18} />,
  Internacionales: <Globe size={18} />,
  Espectaculos: <Film size={18} />,
  Tecnologia: <Laptop size={18} />,
};

function formatViews(n?: number) {
  if (!n) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDateShort(fecha: string) {
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch { return fecha; }
}

export default function MobileHome({ noticias, masLeidas }: MobileHomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [activeCat, setActiveCat] = useState('all');
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([]);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [dateStr, setDateStr] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const heroNews = noticias.slice(0, 5);
  const gridNews = noticias.slice(1);
  const trending = masLeidas.slice(0, 5);

  /* Fecha actual */
  useEffect(() => {
    const hoy = new Date();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    setDateStr(`${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`);
  }, []);

  /* Slider auto-rotate */
  useEffect(() => {
    if (heroNews.length <= 1) return;
    const id = setInterval(() => setCurrentSlide(i => (i + 1) % heroNews.length), 6000);
    return () => clearInterval(id);
  }, [heroNews.length]);

  /* Ticker rotate */
  useEffect(() => {
    if (noticias.length <= 1) return;
    const id = setInterval(() => setTickerIdx(i => (i + 1) % noticias.length), 8000);
    return () => clearInterval(id);
  }, [noticias.length]);

  /* Click outside search */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const goToSlide = (n: number) => setCurrentSlide(n);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try { localStorage.setItem('ni_theme', next ? 'dark' : 'light'); } catch {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ni_theme');
      if (saved === 'dark') { setDark(true); document.documentElement.setAttribute('data-theme', 'dark'); }
    } catch {}
  }, []);

  const tickerText = noticias[tickerIdx]?.titulo || '';

  return (
    <div className="mobile-pro">
      {/* ============ TOASTS ============ */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.type === 'success' ? <CheckCircle size={18} color="#059669" /> : <AlertCircle size={18} color="#DC2626" />}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* ============ HEADER SUPERIOR ============ */}
      <div className="header-bar">
        <div className="header-bar__left">
          <span className="header-bar__date">
            <Calendar size={12} style={{ opacity: 0.7 }} />
            <span>{dateStr}</span>
          </span>
          <div className="clima-widget" onClick={() => addToast('Managua: 32°C, Soleado. Humedad 65%. Viento 15 km/h', 'success')}>
            <span className="clima-widget__icon clima-widget__icon--sunny">☀️</span>
            <div>
              <div className="clima-widget__temp">32°C</div>
              <div className="clima-widget__city">Managua</div>
            </div>
          </div>
        </div>
        <div className="header-bar__right">
          <span className="header-bar__edition">Edición Nicaragua</span>
          <div className="header-bar__social">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="X">𝕏</a>
            <a href="#" aria-label="Instagram">📷</a>
          </div>
        </div>
      </div>

      {/* ============ HEADER PRINCIPAL ============ */}
      <header className="header-pro">
        <div className="header-pro__main">
          <Link href="/" className="header-pro__logo">
            <div className="header-pro__mark">NI</div>
            <div className="header-pro__text">Nicaragua<span>Informate</span></div>
          </Link>
          <div className="header-pro__actions">
            <div className="search-wrapper" ref={searchRef}>
              <input
                type="text"
                className={`search-input${searchOpen ? ' active' : ''}`}
                placeholder="Buscar noticias..."
                autoFocus={searchOpen}
              />
              <button className="header-pro__btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
            </div>
            <button className="header-pro__btn" onClick={() => setMenuOpen(true)} aria-label="Menú">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ============ TICKER ============ */}
      <div className="ticker-pro">
        <span className="ticker-pro__label">Última Hora</span>
        <span className="ticker-pro__text">{tickerText}</span>
      </div>

      {/* ============ NAVEGACIÓN CATEGORÍAS ============ */}
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

      {/* ============ HERO SLIDER ============ */}
      {heroNews.length > 0 && (
        <section className="hero-slider">
          {heroNews.map((n, i) => (
            <article
              key={n.id}
              className={`hero-slide${i === currentSlide ? ' active' : ''}`}
              data-category={CAT_CLASS[n.categoria] || 'nacionales'}
            >
              <Image
                src={n.imagen}
                alt={n.titulo}
                className="hero-slide__img"
                width={800}
                height={500}
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 70vw"
              />
              <div className="hero-slide__overlay">
                <span className={`hero-slide__badge hero-slide__badge--${CAT_CLASS[n.categoria] || 'nacionales'}`}>
                  {n.categoria}
                </span>
                <h2 className="hero-slide__title">{n.titulo}</h2>
                <div className="hero-slide__meta">
                  <span><Clock size={12} /> {formatDateShort(n.fecha)}</span>
                  {n.vistas ? <span><Eye size={12} /> {formatViews(n.vistas)} lecturas</span> : null}
                </div>
              </div>
            </article>
          ))}
          <div className="hero-dots">
            {heroNews.map((_, i) => (
              <span
                key={i}
                className={`hero-dot${i === currentSlide ? ' active' : ''}`}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ============ NOTICIAS ============ */}
      <section className="section-pro">
        <div className="section-pro__header">
          <h2 className="section-pro__title"><Flame size={18} color="var(--c-primary)" /> Noticias Destacadas</h2>
          <Link href="#" className="section-pro__link">Ver todas <ChevronRight size={12} /></Link>
        </div>
        <div className="news-grid">
          {gridNews.filter(n => activeCat === 'all' || CAT_CLASS[n.categoria] === activeCat).map(n => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="news-card">
              <div className="news-card__img-wrapper">
                <Image
                  src={n.imagen}
                  alt={n.titulo}
                  className="news-card__img"
                  width={600}
                  height={375}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <span className={`news-card__badge news-card__badge--${CAT_CLASS[n.categoria] || 'nacionales'}`}>
                  {n.categoria}
                </span>
              </div>
              <div className="news-card__content">
                <h3 className="news-card__title">{n.titulo}</h3>
                <p className="news-card__excerpt">{n.resumen}</p>
                <div className="news-card__meta">
                  <span><Clock size={12} /> {formatDateShort(n.fecha)}</span>
                  {n.vistas ? <span><Eye size={12} /> {formatViews(n.vistas)}</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ INDICADORES ECONÓMICOS COMPACTO PROFESIONAL ============ */}
      <section className="section-pro" style={{ paddingTop: 0 }}>
        <div className="eco-compact">
          <div className="eco-compact__header">
            <span className="eco-compact__title"><TrendingUp size={14} color="var(--c-primary)" /> Indicadores</span>
            <span className="eco-compact__source">BCN / INC</span>
          </div>
          <div className="eco-compact__rates">
            <div className="eco-rate">
              <div className="eco-rate__label">Dólar BCN</div>
              <div className="eco-rate__value">C$36.62</div>
              <div className="eco-rate__change eco-rate__change--same"><Minus size={10} /> 0.00%</div>
            </div>
            <div className="eco-rate">
              <div className="eco-rate__label">Euro</div>
              <div className="eco-rate__value">C$43.11</div>
              <div className="eco-rate__change eco-rate__change--up"><ArrowUp size={10} /> 1.25%</div>
            </div>
          </div>
          <div className="eco-compact__fuels">
            <div className="eco-fuel-row">
              <span className="eco-fuel-row__label">Gasolina Regular</span>
              <span className="eco-fuel-row__value">C$47.80–48.00</span>
            </div>
            <div className="eco-fuel-row">
              <span className="eco-fuel-row__label">Gasolina Súper</span>
              <span className="eco-fuel-row__value">C$49.00</span>
            </div>
            <div className="eco-fuel-row">
              <span className="eco-fuel-row__label">Diesel</span>
              <span className="eco-fuel-row__value">C$43.21–43.40</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MÁS LEÍDAS ============ */}
      <section className="section-pro">
        <div className="section-pro__header">
          <h2 className="section-pro__title"><Trophy size={18} color="var(--c-primary)" /> Más Leídas</h2>
        </div>
        <div className="trending-list">
          {trending.map((n, i) => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="trending-item">
              <span className={`trending-item__num${i < 2 ? ' trending-item__num--top' : ''}`}>{i + 1}</span>
              <span className="trending-item__title">{n.titulo}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="section-pro" style={{ paddingTop: 0 }}>
        <div className="newsletter-pro">
          <h3 className="newsletter-pro__title">Recibe las noticias en tu correo</h3>
          <p className="newsletter-pro__desc">Mantente informado con lo más importante de Nicaragua cada mañana.</p>
          <form className="newsletter-pro__form" onSubmit={e => { e.preventDefault(); addToast('¡Suscripción exitosa!', 'success'); }}>
            <input type="email" className="newsletter-pro__input" placeholder="tu@email.com" required />
            <button type="submit" className="newsletter-pro__btn">Suscribir</button>
          </form>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer-pro">
        <div className="footer-pro__grid">
          <div>
            <h4 className="footer-pro__col-title">Secciones</h4>
            <Link href="/nacionales" className="footer-pro__link">Nacionales</Link>
            <Link href="/sucesos" className="footer-pro__link">Sucesos</Link>
            <Link href="/deportes" className="footer-pro__link">Deportes</Link>
            <Link href="/internacionales" className="footer-pro__link">Internacionales</Link>
            <Link href="/espectaculos" className="footer-pro__link">Espectáculos</Link>
            <Link href="/tecnologia" className="footer-pro__link">Tecnología</Link>
          </div>
          <div>
            <h4 className="footer-pro__col-title">Legal</h4>
            <Link href="#" className="footer-pro__link">Términos de uso</Link>
            <Link href="#" className="footer-pro__link">Privacidad</Link>
            <Link href="#" className="footer-pro__link">Cookies</Link>
            <Link href="#" className="footer-pro__link">Contacto</Link>
          </div>
        </div>
        <div className="footer-pro__bottom">
          <div className="footer-pro__logo">Nicaragua<span style={{ fontWeight: 400, color: 'var(--c-text-muted)' }}>Informate</span></div>
          <p className="footer-pro__copy">© 2026 Nicaragua Informate. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ============ RADIO FAB ============ */}
      <div className="radio-fab" style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 200 }}>
        <div className={`radio-panel${radioOpen ? ' active' : ''}`}>
          <div className="radio-panel__header">
            <span className="radio-panel__title">
              <span className="radio-panel__live"></span>
              En vivo
            </span>
            <button className="radio-panel__close" onClick={() => setRadioOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="radio-panel__station">La Buenisima 93.1 FM</div>
          <div className="radio-panel__controls">
            <button className="radio-panel__play" onClick={() => { setRadioPlaying(!radioPlaying); addToast(radioPlaying ? 'Radio pausada' : 'Reproduciendo La Buenisima 93.1 FM', 'success'); }}>
              {radioPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <input type="range" className="radio-panel__vol" min={0} max={100} defaultValue={70} />
          </div>
        </div>
        <button className="radio-fab__btn" onClick={() => setRadioOpen(!radioOpen)} aria-label="Radio">
          <span className="radio-fab__live"></span>
          <Radio size={20} />
        </button>
      </div>

      {/* ============ MENÚ HAMBURGUESA ============ */}
      <div className={`menu-overlay${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen(false)}></div>
      <nav className={`menu-panel${menuOpen ? ' active' : ''}`}>
        <div className="menu-header">
          <div className="menu-header__logo">Nicaragua Informate</div>
          <p className="menu-header__tagline">Noticias de Nicaragua al instante</p>
        </div>
        <div className="menu-section">
          <h4 className="menu-section__title">Secciones</h4>
          {NAV_CATS.filter(c => c.key !== 'all').map(cat => (
            <Link key={cat.key} href={`/${cat.key}`} className="menu-link" onClick={() => setMenuOpen(false)}>
              {ICONS[cat.label] || <Globe size={18} />}
              {cat.label}
            </Link>
          ))}
        </div>
        <div className="menu-section">
          <h4 className="menu-section__title">Servicios</h4>
          <Link href="#" className="menu-link"><TrendingUp size={18} /> Indicadores Económicos</Link>
          <Link href="#" className="menu-link"><Radio size={18} /> Radio en Vivo</Link>
          <Link href="#" className="menu-link"><Mail size={18} /> Newsletter</Link>
        </div>
        <div className="menu-footer">
          <div className="menu-theme">
            <span className="menu-theme__label">{dark ? <Sun size={16} /> : <Moon size={16} />} Modo oscuro</span>
            <div className={`toggle${dark ? ' active' : ''}`} onClick={toggleTheme}>
              <div className="toggle__knob"></div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
