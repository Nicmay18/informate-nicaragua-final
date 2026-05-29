'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import dynamic from 'next/dynamic';

const RadioPlayer = dynamic(() => import('./RadioPlayer'), { ssr: false, loading: () => <div style={{ height: 80, background: '#f1f5f9', borderRadius: 8 }} /> });
const EconomicBar = dynamic(() => import('./EconomicBar'), { ssr: false, loading: () => <div style={{ height: 60, background: '#f1f5f9', borderRadius: 8 }} /> });
const WeatherWidget = dynamic(() => import('./WeatherWidget'), { ssr: false, loading: () => <div style={{ height: 120, background: '#f1f5f9', borderRadius: 8 }} /> });
const WorldClock = dynamic(() => import('./WorldClock'), { ssr: false, loading: () => <div style={{ height: 100, background: '#f1f5f9', borderRadius: 8 }} /> });

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
  } catch {
    return dateStr;
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

function Hero({ noticias }: { noticias: Noticia[] }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const items = noticias.slice(0, 5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const isPausedRef = useRef(false);

  const nextSlide = useCallback(() => {
    setIdx(p => (p + 1) % items.length);
    elapsedRef.current = 0;
    setProgress(0);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;

    // Limpiar timer anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    elapsedRef.current = 0;
    setProgress(0);

    const duration = 6000;
    const tick = 50;

    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      elapsedRef.current += tick;
      setProgress((elapsedRef.current / duration) * 100);
      if (elapsedRef.current >= duration) {
        nextSlide();
      }
    }, tick);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [items.length, nextSlide]);

  return (
    <section className="ni-hero" aria-label="Noticias destacadas">
      <div className="ni-hero__track">
        {items.map((item, i) => (
          <article key={item.id} className={`ni-hero__slide${i === idx ? ' is-active' : ''}`}>
            <div className="ni-hero__media">
              {item.imagen ? (
                <Image src={item.imagen} alt={item.titulo} fill sizes="(max-width:768px) 100vw, 65vw" style={{ objectFit: 'cover', objectPosition: 'center center' }} priority={i === 0} fetchPriority="high" />
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
          <button className="ni-hero__arrow ni-hero__arrow--prev" onClick={() => { setIdx(p => (p - 1 + items.length) % items.length); setProgress(0); }} aria-label="Anterior">‹</button>
          <button className="ni-hero__arrow ni-hero__arrow--next" onClick={() => { setIdx(p => (p + 1) % items.length); setProgress(0); }} aria-label="Siguiente">›</button>
          <div className="ni-hero__indicators">
            {items.map((item, i) => (
              <button key={i} className={`ni-hero__ind${i === idx ? ' is-active' : ''}`} onClick={() => { setIdx(i); setProgress(0); }} aria-label={`Noticia ${i + 1}`}>
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
          <Image src={noticia.imagen} alt={noticia.titulo} fill sizes="(max-width:900px) 100px, 220px" style={{ objectFit: 'cover' }} quality={75} />
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerDateIso, setHeaderDateIso] = useState('');
  const [headerDateHuman, setHeaderDateHuman] = useState('');

  useEffect(() => {
    const now = new Date();
    setHeaderDateIso(now.toISOString());
    setHeaderDateHuman(now.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);
  // Carrusel: primero noticias destacadas, luego las más recientes para completar
  const destacadas = noticias.filter(n => n.destacada).slice(0, 5);
  const restoParaHero = noticias.filter(n => !n.destacada).slice(0, 5 - destacadas.length);
  const heroNoticias = destacadas.length > 0 ? [...destacadas, ...restoParaHero] : noticias.slice(0, 5);

  // IDs del carousel: ninguna otra sección puede mostrar estas noticias
  const heroIds = useMemo(() => new Set(heroNoticias.map(n => n.id)), [heroNoticias]);

  // Resto excluye hero explícitamente
  const resto = useMemo(
    () => noticias.slice(5).filter(n => !heroIds.has(n.id)),
    [noticias, heroIds]
  );

  // "Últimas noticias" = los 6 más recientes tras el hero (siempre noticias del día)
  const ultimas = useMemo(() => resto.slice(0, 6), [resto]);
  const ultimasIds = useMemo(() => new Set(ultimas.map(n => n.id)), [ultimas]);

  // Categorías usan solo artículos que NO están en hero NI en últimas
  const paraCategoria = useMemo(
    () => resto.filter(n => !ultimasIds.has(n.id)),
    [resto, ultimasIds]
  );

  const porCategoria = useMemo(() => {
    const map: Record<string, Noticia[]> = {};
    CATEGORIES.forEach(c => { map[c.slug] = []; });
    paraCategoria.forEach(n => {
      const slug = n.categoria?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
      if (slug && map[slug]) map[slug].push(n);
    });
    CATEGORIES.forEach(c => { map[c.slug] = map[c.slug].slice(0, 4); });
    return map;
  }, [paraCategoria]);

  const trending = masLeidas.length >= 5
    ? masLeidas.filter(n => !heroIds.has(n.id)).slice(0, 5)
    : resto.slice(0, 5);

  return (
    <div>
      {/* HEADER */}
      <header className="ni-header">
        <div className="ni-header__top">
          <Link href="/" className="ni-logo" aria-label="Nicaragua Informate — Ir a la portada">
            <Image src="/logo-ni.png" alt="Nicaragua Informate" width={42} height={42} className="ni-logo__img" priority />
            <div className="ni-logo__text">
              <strong>Nicaragua Informate</strong>
              <span className="ni-logo__tagline">Infórmate al Instante</span>
            </div>
          </Link>

          <time className="ni-header__date" dateTime={headerDateIso} suppressHydrationWarning>
            {headerDateHuman}
          </time>

          <div className="ni-header__actions">
            <Link href="/buscar" className="ni-search-btn" aria-label="Buscar noticias"><Search size={18} /></Link>
            <button className="ni-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú" aria-expanded={menuOpen}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        <nav className="ni-header__nav" aria-label="Navegación principal">
          <ul className="ni-nav">
            <li><Link href="/">Inicio</Link></li>
            {CATEGORIES.map(c => (
              <li key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="ni-mobile-menu" role="dialog" aria-modal="true">
          <div className="ni-mobile-menu__overlay" onClick={() => setMenuOpen(false)} />
          <nav className="ni-mobile-menu__content">
            <button className="ni-mobile-menu__close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">✕</button>
            <ul className="ni-mobile-menu__nav">
              <li><Link href="/" onClick={() => setMenuOpen(false)}>Inicio</Link></li>
              {CATEGORIES.map(c => (
                <li key={c.slug}><Link href={`/categoria/${c.slug}`} onClick={() => setMenuOpen(false)}>{c.name}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* H1 SEO oculto visualmente, visible para crawlers */}
      <h1 className="sr-only">Noticias de Nicaragua en tiempo real — Nicaragua Informate</h1>

      {/* Párrafo introductorio para reforzar keywords del H1 */}
      <p className="sr-only">
        Nicaragua Informate es tu portal de noticias de Nicaragua en tiempo real.
        Cobertura actualizada de sucesos, nacionales, deportes, tecnología, espectáculos e internacionales.
        Periodismo verificado desde Managua con las últimas noticias del día.
      </p>

      {/* HERO */}
      <Hero noticias={heroNoticias} />

      {/* CHIPS */}
      <div className="ni-chips">
        <span className="ni-chips__label">Tendencias:</span>
        {TRENDS.map(t => (
          <Link key={t.label} href={t.href} className="ni-chip">{t.label}</Link>
        ))}
      </div>

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
          {/* Destacados esta semana */}
          <div className="ni-sidebar__widget">
            <h3 className="ni-sidebar__title">🔥 Destacados esta semana</h3>
            <ol className="ni-trending">
              {trending.map((n, i) => (
                <li key={n.id}>
                  <span className="ni-trending__num">{i + 1}</span>
                  <div>
                    <Link href={`/noticias/${n.slug}`} className="ni-trending__text">{n.titulo}</Link>
                    <time className="ni-trending__time" dateTime={n.fecha} suppressHydrationWarning>{timeAgo(n.fecha)}</time>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Radio en vivo */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title">📻 Radio en Vivo</h3>
            <RadioPlayer />
          </div>

          {/* Indicadores económicos */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title">📊 Indicadores</h3>
            <EconomicBar />
          </div>

          {/* Clima */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title">🌤️ Clima Nicaragua</h3>
            <WeatherWidget />
          </div>

          {/* Reloj mundial */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title">🌍 Reloj Mundial</h3>
            <WorldClock />
          </div>

          {/* Categorías */}
          <div className="ni-sidebar__widget">
            <h3 className="ni-sidebar__title">📂 Categorías</h3>
            <ul className="ni-cat-list">
              {CATEGORIES.map(c => (
                <li key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="ni-sidebar__widget ni-newsletter">
            <h3 className="ni-sidebar__title">📧 Newsletter</h3>
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

      {/* FOOTER */}
      <footer className="ni-footer">
        <div className="ni-footer__inner">
          <div>
            <div className="ni-footer__brand">
              <Image src="/logo-ni.png" alt="Nicaragua Informate" width={40} height={40} className="ni-footer__logo" />
              <span>Nicaragua Informate</span>
            </div>
            <p className="ni-footer__desc">Portal de noticias de Nicaragua con cobertura nacional e internacional. Infórmate al Instante desde Managua.</p>
            <div className="ni-footer__social">
              <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
              <a href="https://twitter.com/nicinformate" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
              <a href="https://instagram.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
              <a href="https://youtube.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
            </div>
          </div>

          <div>
            <h4 className="ni-footer__col-title">Secciones</h4>
            <ul className="ni-footer__links">
              {CATEGORIES.map(c => (
                <li key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="ni-footer__col-title">Nosotros</h4>
            <ul className="ni-footer__links">
              <li><Link href="/nosotros">Quiénes somos</Link></li>
              <li><Link href="/contacto">Contacto</Link></li>
              <li><Link href="/politica-editorial">Política Editorial</Link></li>
              <li><Link href="/publicidad">Publicidad</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="ni-footer__col-title">Legal</h4>
            <ul className="ni-footer__links">
              <li><Link href="/privacidad">Política de privacidad</Link></li>
              <li><Link href="/terminos">Términos y condiciones</Link></li>
              <li><Link href="/cookies">Política de cookies</Link></li>
              <li><Link href="/mapa-del-sitio">Mapa del sitio</Link></li>
            </ul>
          </div>
        </div>

        <div className="ni-footer__bottom">
          <span>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.</span>
          <span>Managua, Nicaragua • Periodismo verificado</span>
        </div>
      </footer>
    </div>
  );
}
