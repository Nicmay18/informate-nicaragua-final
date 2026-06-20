import Link from 'next/link';
import Image from 'next/image';
import { Flame, Radio, Mail, TrendingUp, BookOpen } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { getResponsiveImageUrl } from '@/lib/image-utils';
import type { ComponentProps } from 'react';
import {
  TRENDS,
  CATEGORIES,
  CAT_LOOKUP,
  catClass,
  timeAgo,
  EVERGREEN_GUIDES,
} from '@/lib/homepage-utils';
import HeroCarousel from './HeroCarousel';
import TabbedSidebarWidget from './TabbedSidebar';
import RadioPlayer from './RadioPlayer';

const NoPrefetchLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} prefetch={false} />
);

function BreakingMarquee({ noticias }: { noticias: Noticia[] }) {
  const list = noticias.slice(0, 6);
  if (list.length === 0) return null;
  return (
    <div className="ni-marquee-bar">
      <div className="ni-marquee-bar__badge">Última entrada</div>
      <div className="ni-marquee-bar__content">
        <div className="ni-marquee-bar__scroll">
          {list.map((n) => (
            <NoPrefetchLink key={n.id} href={`/noticias/${n.slug}`} className="ni-marquee-bar__item">
              <span className="ni-marquee-bar__arrow">➔</span> {n.titulo}
            </NoPrefetchLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ noticia, index = 0 }: { noticia: Noticia; index?: number }) {
  const cat = catClass(noticia.categoria);
  return (
    <article
      className="ni-card"
      style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid #e2e8f0',
        alignItems: 'start',
        overflow: 'hidden',
        animationDelay: `${index * 60}ms`,
      }}
      data-animate="fadeInUp"
    >
      <div
        className="ni-card__thumb"
        style={{
          position: 'relative',
          width: 100,
          height: 70,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#e2e8f0',
        }}
      >
        {noticia.imagen ? (
          <Image
            src={getResponsiveImageUrl(noticia.imagen, 400)}
            alt={noticia.titulo}
            fill
            sizes="(max-width: 768px) 100px, (max-width: 1024px) 220px, 33vw"
            style={{ objectFit: 'cover' }}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ) : null}
      </div>
      <div className="ni-card__content" style={{ width: '100%', padding: 0, minWidth: 0, overflow: 'hidden' }}>
        <span className={`ni-card__pill ni-card__pill--${cat}`} style={{ fontSize: '0.6rem', marginBottom: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>{noticia.categoria || 'Noticia'}</span>
        <span className="ni-card__title" style={{ fontFamily: "'Merriweather', serif", fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.25, color: '#0f172a', marginBottom: 3, display: 'block' }}>
          <NoPrefetchLink href={`/noticias/${noticia.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{noticia.titulo}</NoPrefetchLink>
        </span>
        <p className="ni-card__excerpt" style={{ fontSize: '0.8rem', lineHeight: 1.4, marginBottom: 4, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{noticia.resumen || noticia.titulo}</p>
        <div className="ni-card__meta" style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: 0 }}>
          <time dateTime={noticia.fecha} suppressHydrationWarning>{timeAgo(noticia.fecha)}</time>
          {noticia.fechaActualizacion && (
            <time dateTime={noticia.fechaActualizacion} suppressHydrationWarning style={{ color: '#991b1b', fontWeight: 500, fontSize: 12 }}>
              Actualizado {timeAgo(noticia.fechaActualizacion)}
            </time>
          )}
          <span>{noticia.autor || 'Nicaragua Informate'}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://nicaraguainformate.com/noticias/' + noticia.slug)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en Facebook" style={{ fontSize: 11, color: '#1877f2', textDecoration: 'none', padding: '6px 12px', minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Facebook</a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent('https://nicaraguainformate.com/noticias/' + noticia.slug)}&text=${encodeURIComponent(noticia.titulo)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en X" style={{ fontSize: 11, color: '#000', textDecoration: 'none', padding: '6px 12px', minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>X</a>
          <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(noticia.titulo + ' https://nicaraguainformate.com/noticias/' + noticia.slug)}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="Compartir en WhatsApp" style={{ fontSize: 11, color: '#128C7E', textDecoration: 'none', padding: '6px 12px', minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>WhatsApp</a>
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
        <NoPrefetchLink href={`/categoria/${slug}`} className="ni-section__more">Ver más noticias de {title} →</NoPrefetchLink>
      </div>
      {noticias.length <= 2 ? (
        noticias.map((n, i) => <Card key={n.id} noticia={n} index={i} />)
      ) : (
        <div className="ni-grid-2">
          {noticias.map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
        </div>
      )}
    </section>
  );
}

export default function HomePagePro({ noticias, masLeidas, populares = [], isNoticiasPage = false }: { noticias: Noticia[]; masLeidas: Noticia[]; populares?: Noticia[]; isNoticiasPage?: boolean }) {
  const heroNoticias = noticias.slice(0, 7);
  const heroIds = new Set(heroNoticias.map(n => n.id));
  const resto = noticias.filter(n => !heroIds.has(n.id));
  const ultimas = resto.slice(0, 12);

  const porCategoria: Record<string, Noticia[]> = {};
  CATEGORIES.forEach(c => { porCategoria[c.slug] = []; });
  for (const n of noticias) {
    const slug = CAT_LOOKUP[n.categoria?.toLowerCase() || ''];
    if (slug && porCategoria[slug]) porCategoria[slug].push(n);
  }
  CATEGORIES.forEach(c => { porCategoria[c.slug] = porCategoria[c.slug].slice(0, 6); });


  return (
    <div>
      {isNoticiasPage ? (
        <h1 className="ni-page-title">Todas las Noticias de Nicaragua</h1>
      ) : (
        <h1 className="ni-page-title">Noticias de Nicaragua — Sucesos Nacionales y Actualidad</h1>
      )}
      {/* ETIQUETAS PRINCIPALES */}
      <div className="ni-top-tags">
        <span className="ni-top-tags__label"># Etiquetas principales</span>
        <div className="ni-top-tags__list">
          {TRENDS.map(t => (
            <NoPrefetchLink key={t.label} href={t.href} className="ni-top-tag" rel="nofollow">{t.label}</NoPrefetchLink>
          ))}
        </div>
      </div>

      {/* MARQUEE / TICKER */}
      <BreakingMarquee noticias={noticias} />

      {/* HERO */}
      <HeroCarousel noticias={heroNoticias} />

      {/* GUÍAS Y RECURSOS EVERGREEN */}
      {!isNoticiasPage && (
        <section className="ni-section" style={{ marginTop: 24 }}>
          <div className="ni-section__header">
            <h2 className="ni-section__title" style={{ color: '#7c3aed' }}><BookOpen size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Guías útiles</h2>
            <NoPrefetchLink href="/guia" className="ni-section__more">Ver todas →</NoPrefetchLink>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {EVERGREEN_GUIDES.map((guia) => (
              <NoPrefetchLink
                key={guia.slug}
                href={`/guia/${guia.slug}`}
                style={{
                  display: 'block',
                  padding: '16px',
                  background: 'var(--card-bg, #fff)',
                  borderRadius: 10,
                  border: '1px solid var(--border, #e5e7eb)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>{guia.category}</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '6px 0 4px', lineHeight: 1.4 }}>{guia.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{guia.description.slice(0, 90)}…</p>
              </NoPrefetchLink>
            ))}
          </div>
        </section>
      )}

      {/* MAIN */}
      <div className="ni-main">
        <div className="ni-content">
          {/* Últimas */}
          {ultimas.length > 0 && (
            <section className="ni-section">
              <div className="ni-section__header">
                <h2 className="ni-section__title ni-section__title--sucesos">Últimas noticias</h2>
                <NoPrefetchLink href="/noticias" className="ni-section__more">Ver todas →</NoPrefetchLink>
              </div>
              {ultimas.map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
            </section>
          )}

          {/* MÁS LEÍDAS — sección prominente en el contenido principal */}
          {masLeidas.length > 0 && (
            <section className="ni-section">
              <div className="ni-section__header">
                <h2 className="ni-section__title ni-section__title--sucesos"><TrendingUp size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Más leídos</h2>
                <NoPrefetchLink href="/noticias" className="ni-section__more">Ver todas →</NoPrefetchLink>
              </div>
              <div className="ni-grid-2">
                {masLeidas.slice(0, 4).map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
              </div>
            </section>
          )}

          {CATEGORIES.slice(0, 3).map(c => (
            <Section key={c.slug} title={c.name} slug={c.slug} color={c.color} noticias={porCategoria[c.slug]} />
          ))}

          {/* DESTACADOS — rompe monotonía entre categorías */}
          {populares.length > 0 && (
            <section className="ni-section">
              <div className="ni-section__header">
                <h2 className="ni-section__title ni-section__title--sucesos"><Flame size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Destacados</h2>
                <NoPrefetchLink href="/noticias" className="ni-section__more">Ver todas →</NoPrefetchLink>
              </div>
              <div className="ni-grid-2">
                {populares.slice(0, 4).map((n, i) => <Card key={n.id} noticia={n} index={i} />)}
              </div>
            </section>
          )}

          {CATEGORIES.slice(3).map(c => (
            <Section key={c.slug} title={c.name} slug={c.slug} color={c.color} noticias={porCategoria[c.slug]} />
          ))}
        </div>

        {/* SIDEBAR */}
        <aside className="ni-sidebar">
          {/* TABBED WIDGET (Más leídas all-time, Populares 7d, Tendencias recientes) */}
          <TabbedSidebarWidget ultimas={masLeidas} populares={populares.length > 0 ? populares : resto.slice(0, 5)} tendencias={resto.slice(5, 10)} />

          {/* Radio en vivo */}
          <div className="ni-sidebar__widget ni-widget-compact">
            <h3 className="ni-widget-compact__title"><Radio size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Radio en Vivo</h3>
            <RadioPlayer />
          </div>

          {/* Newsletter — solo elemento clave en sidebar */}
          <div className="ni-sidebar__widget ni-newsletter">
            <h3 className="ni-sidebar__title"><Mail size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Newsletter</h3>
            <p>Recibe las noticias más importantes de Nicaragua cada mañana.</p>
            <label htmlFor="newsletter-email" className="sr-only">Correo electrónico</label>
            <input id="newsletter-email" type="email" placeholder="tucorreo@gmail.com" aria-label="Tu correo electrónico para el newsletter" />
            <button type="submit" aria-label="Suscribirse al newsletter">Suscribirme gratis</button>
          </div>
        </aside>
      </div>

    </div>
  );
}
