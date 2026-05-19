'use client';

import { useState } from 'react';
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
  const [activeCat, setActiveCat] = useState('all');

  // Deduplicate: hero uses noticias[0], list excludes it
  const hero = noticias[0] || null;
  const listNews = activeCat === 'all'
    ? noticias.slice(1)
    : noticias.filter(n => CAT_MAP[n.categoria] === activeCat);

  const tickerText = hero?.titulo || 'Nicaragua Informate — Noticias en tiempo real';

  return (
    <ProLayout tickerText={tickerText}>
      {/* === NAV CATEGORIES === */}
      <nav className="nav-categories" aria-label="Categorías de noticias">
        {NAV_CATS.map(cat => (
          <button
            key={cat.key}
            className={`nav-cat${activeCat === cat.key ? ' active' : ''}`}
            onClick={() => setActiveCat(cat.key)}
            aria-pressed={activeCat === cat.key}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* === HERO: SINGLE FEATURED CARD === */}
      {hero && (
        <section className="hero-pro" aria-label="Noticia destacada">
          <Link href={`/noticias/${hero.slug}`} className="hero-pro__track" style={{ display: 'block' }}>
            {hero.imagen && hero.imagen !== '/logo.png' ? (
              <Image
                src={hero.imagen}
                alt={hero.titulo}
                fill
                sizes="100vw"
                className="hero-pro__img"
                priority
                fetchPriority="high"
              />
            ) : (
              <div
                className="hero-pro__img"
                style={{
                  position: 'absolute', inset: 0,
                  background: CATEGORY_COLORS[hero.categoria] || '#8c1d18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase',
                }}
              >
                {hero.categoria}
              </div>
            )}
            <div className="hero-pro__overlay">
              <div className="hero-pro__content">
                <span className={`hero-pro__badge news-badge--${CAT_MAP[hero.categoria] || 'nacionales'}`}>
                  {hero.categoria}
                </span>
                <h2 className="hero-pro__title">{hero.titulo}</h2>
                {hero.resumen && <p className="hero-pro__excerpt">{hero.resumen}</p>}
                <div className="hero-pro__footer">
                  <div className="hero-pro__meta">
                    <span><Clock size={11} /> {formatDateShort(hero.fecha)}</span>
                    {hero.vistas ? <span><Eye size={11} /> {formatViews(hero.vistas)} lecturas</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </Link>
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

            {/* Lista de noticias */}
            {listNews.length > 0 ? (
              <div className="news-list-compact">
                {listNews.map(n => (
                  <Link href={`/noticias/${n.slug}`} key={n.slug} className="news-list-item">
                    <div className="news-list-item__img-wrap">
                      {n.imagen && n.imagen !== '/logo.png' ? (
                        <Image src={n.imagen} alt={n.titulo} width={120} height={90} className="news-list-item__img" loading="lazy" />
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
            ) : (
              <div className="news-list-empty">
                <p>No hay noticias en esta categoría.</p>
              </div>
            )}
          </div>

          {/* ===== SIDEBAR ===== */}
          <aside className="editorial-sidebar">

            {/* Más Leídas (datos reales) */}
            {masLeidas.length > 0 && (
              <div className="sidebar-widget">
                <div className="sidebar-widget__title">
                  <Flame size={14} color="var(--c-accent)" /> Más Leídas
                </div>
                <div className="sidebar-numbered-list">
                  {masLeidas.slice(0, 5).map((n, i) => (
                    <Link href={`/noticias/${n.slug}`} key={n.slug} className="sidebar-numbered-item">
                      <span className="sidebar-num">{i + 1}</span>
                      <div className="sidebar-numbered-content">
                        <span className="sidebar-cat">{n.categoria}</span>
                        <span className="sidebar-title">{n.titulo}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Indicadores Económicos */}
            <div className="sidebar-widget">
              <div className="sidebar-widget__title"><TrendingUp size={14} /> Indicadores</div>
              <EcoCompact hideHeader />
            </div>

            {/* Newsletter */}
            <Newsletter />

            {/* Síguenos */}
            <Siguenos />

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
  const [savedEmails, setSavedEmails] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ni_newsletter') || '[]'); } catch { return []; }
  });
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    const updated = [...savedEmails, email];
    setSavedEmails(updated);
    try { localStorage.setItem('ni_newsletter', JSON.stringify(updated)); } catch {}
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 4000);
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

