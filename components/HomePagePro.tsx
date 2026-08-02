"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { tiempoLectura } from '@/lib/formateo';
import { getResponsiveImageUrl, getHeroImageUrl } from '@/lib/image-utils';
import { FALLBACK_IMAGE } from '@/lib/types';
import { RelativeTime, FullRelativeTime } from '@/components/ClientTime';
import SidebarRedesign from '@/components/pro/SidebarRedesign';

interface HomePageProProps {
  noticias: Noticia[];
  masLeidas?: Noticia[];
  populares?: Noticia[];
  contenidoUtil?: EvergreenArticle[];
  isNoticiasPage?: boolean;
}

function distribuirNoticias(noticias: Noticia[]) {
  // Las noticias ya llegan rankeadas por Home Ranking Engine (freshness + MENI + tendencia).
  const sorted = noticias;
  const usados = new Set<string>();

  const take = (lista: Noticia[], n: number) => {
    const resultado: Noticia[] = [];
    for (const item of lista) {
      if (resultado.length >= n) break;
      if (!usados.has(item.id)) {
        usados.add(item.id);
        resultado.push(item);
      }
    }
    return resultado;
  };

  const heroNoticias = sorted[0] ? [sorted[0]] : [];
  if (sorted[0]) usados.add(sorted[0].id);

  const enPortada = take(sorted.slice(1), 4);

  // Última hora: las 5 noticias más recientes en orden cronológico
  const breaking = [...noticias]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);

  const seccion = (cat: string, limit: number, min = 1) => {
    const items = take(
      sorted.filter(n => n.categoria === cat && !usados.has(n.id)),
      limit
    );
    return items.length >= min ? items : [];
  };

  const recientes = take(sorted.slice(1), 3);

  return {
    heroNoticias,
    enPortada,
    breaking,
    recientes,
    nacionales: seccion('Nacionales', 6),
    sucesos: seccion('Sucesos', 3),
    deportes: seccion('Deportes', 4),
    internacionales: seccion('Internacionales', 3),
    tecnologia: seccion('Tecnología', 2),
    espectaculos: seccion('Espectáculos', 2),
    excluidos: new Set(usados),
  };
}

export default function HomePagePro({ noticias, masLeidas = [], populares = [], contenidoUtil = [], isNoticiasPage: _isNoticiasPage }: HomePageProProps) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!nodes.length) return;
    nodes.forEach(node => node.classList.add('is-visible'));
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const dist = useMemo(() => distribuirNoticias(noticias), [noticias]);

  if (noticias.length === 0) {
    return (
      <div className="rd-home">
        <div className="rd-home__container">
          <div className="rd-content-grid">
            <div className="rd-main-col" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <h1 style={{ fontFamily: 'var(--rd-serif)', fontSize: 26, color: 'var(--rd-ink)', marginBottom: 12 }}>No hay noticias disponibles</h1>
              <p style={{ color: 'var(--rd-muted)', marginBottom: 24 }}>Estamos preparando nuevo contenido. Vuelve pronto.</p>
              <Link href="/noticias" style={{ color: 'var(--rd-accent)', fontWeight: 600 }}>Ver archivo de noticias →</Link>
            </div>
            <aside className="rd-rail">
              <SidebarRedesign masLeidas={[]} />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  const hero = dist.heroNoticias[0];
  const heroImg = hero ? getHeroImageUrl(hero.imagen, 1200) : FALLBACK_IMAGE;

  return (
    <div className="rd-home">
      {/* Breaking bar */}
      {dist.breaking.length > 0 && (
        <div className="rd-breaking" role="marquee" aria-label="Última hora">
          <div className="rd-breaking__inner">
            <span className="rd-breaking-tag"><span className="rd-dot" />Última hora</span>
            <div className="rd-breaking-list">
              {[...dist.breaking, ...dist.breaking, ...dist.breaking].map((n, idx) => (
                <Link key={`${n.id}-${idx}`} href={`/noticias/${n.slug}`} className="rd-breaking-item">
                  <span className="rd-breaking-dot" aria-hidden="true" />
                  <span className="rd-breaking-title">{n.titulo}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Horizon divider */}
      <div className="rd-horizon" aria-hidden="true">
        <svg viewBox="0 0 1180 22" preserveAspectRatio="none">
          <polyline points="0,22 90,22 150,4 190,17 260,22 340,22 400,9 445,22 540,22 610,2 655,20 720,22 810,22 865,7 905,22 980,22 1040,11 1080,22 1180,22"
            fill="none" stroke="#0E6E6A" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="150" cy="4" r="1.6" fill="#0E6E6A" />
          <circle cx="610" cy="2" r="1.6" fill="#0E6E6A" />
          <circle cx="865" cy="7" r="1.6" fill="#0E6E6A" />
        </svg>
      </div>

      <div className="rd-home__container">
        {/* HERO */}
        {hero && (
          <section className="rd-hero">
            <article className="rd-lead">
              <span className="rd-eyebrow">{hero.categoria}</span>
              <div className="rd-lead-photo">
                <Image
                  src={heroImg}
                  alt={hero.titulo}
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  style={{ objectFit: 'cover' }}
                />
                {hero.pieFoto && <span className="rd-photo-credit">{hero.pieFoto}</span>}
              </div>
              <h1>
                <Link href={`/noticias/${hero.slug}`}>{hero.titulo}</Link>
              </h1>
              {hero.resumen && <p className="rd-dek">{hero.resumen}</p>}
              <div className="rd-byline">
                {hero.autor && <span>{hero.autor.split(' ').slice(0, 2).join(' ')}</span>}
                {hero.autor && <span className="rd-sep" />}
                <FullRelativeTime date={hero.fecha} />
                <span className="rd-sep" />
                <span>{tiempoLectura(hero.contenido || hero.resumen || '')} min de lectura</span>
              </div>
            </article>

            <aside className="rd-en-portada">
              <div className="rd-rail-title">En portada</div>
              {dist.enPortada.map((n) => (
                <div key={n.id} className="rd-portada-item">
                  <span className={`rd-eyebrow ${n.categoria === 'Sucesos' ? 'is-sucesos' : ''} ${n.categoria === 'Deportes' ? 'is-deportes' : ''}`}>
                    {n.categoria}
                  </span>
                  <h3><Link href={`/noticias/${n.slug}`}>{n.titulo}</Link></h3>
                  <RelativeTime date={n.fecha} />
                </div>
              ))}
            </aside>
          </section>
        )}

        {/* CONTENT GRID */}
        <div className="rd-content-grid">
          <div className="rd-main-col">
            {(masLeidas.length ? masLeidas : populares).length > 0 && (
              <SectionGrid titulo="📌 Lo más leído" slug="noticias" noticias={(masLeidas.length ? masLeidas : populares).slice(0, 3)} reverse={false} />
            )}
            {dist.recientes.length > 0 && <SectionGrid titulo="Últimas noticias" slug="noticias" noticias={dist.recientes} reverse={false} />}
            {dist.nacionales.length >= 1 && <SectionGrid titulo="Nacionales" slug="nacionales" noticias={dist.nacionales} reverse={false} />}
            {dist.internacionales.length >= 1 && <SectionGrid titulo="Internacionales" slug="internacionales" noticias={dist.internacionales} reverse={false} />}
            {dist.deportes.length >= 1 && <SectionGrid titulo="Deportes" slug="deportes" noticias={dist.deportes} reverse={false} />}
            {dist.espectaculos.length >= 1 && <SectionGrid titulo="Espectáculos" slug="espectaculos" noticias={dist.espectaculos} reverse={false} />}
            {dist.tecnologia.length >= 1 && <SectionGrid titulo="Tecnología" slug="tecnologia" noticias={dist.tecnologia} reverse={false} />}
            {dist.sucesos.length >= 1 && <SectionGrid titulo="Sucesos" slug="sucesos" noticias={dist.sucesos} reverse={true} />}
            {contenidoUtil.length > 0 && <SectionGuia titulo="📚 Contenido útil" guias={contenidoUtil} />}
          </div>

          <aside className="rd-rail">
            <SidebarRedesign masLeidas={masLeidas.length ? masLeidas : populares} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionGuia({ titulo, guias }: { titulo: string; guias: EvergreenArticle[] }) {
  return (
    <section className="rd-section" data-reveal>
      <div className="rd-section-head">
        <h2>{titulo}</h2>
        <Link href="/guia">Ver más →</Link>
      </div>
      <div
        className="rd-story-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
      >
        {guias.map((g) => (
          <article key={g.slug} className="rd-portada-item" style={{ padding: 20 }}>
            <span className="rd-eyebrow">{g.category}</span>
            <h3>
              <Link href={`/guia/${g.slug}`}>{g.title}</Link>
            </h3>
            <p style={{ color: 'var(--rd-muted)', fontSize: '0.95rem', marginTop: 8 }}>{g.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionGrid({ titulo, slug, noticias, reverse }: { titulo: string; slug: string; noticias: Noticia[]; reverse: boolean }) {
  const [principal, ...secundarias] = noticias;
  const principalImg = getResponsiveImageUrl(principal.imagen, 700);

  return (
    <section className="rd-section" data-reveal>
      <div className="rd-section-head">
        <h2>{titulo}</h2>
        <Link href={`/categoria/${slug}`}>Ver más →</Link>
      </div>
      <div className={`rd-story-grid ${reverse ? 'is-reverse' : ''}`}>
        <article className="rd-story-primary">
          <Link href={`/noticias/${principal.slug}`} className="rd-photo" style={{ display: 'block' }}>
            <Image
              src={principalImg}
              alt={principal.titulo}
              fill
              sizes="(max-width: 880px) 100vw, 60vw"
              style={{ objectFit: 'cover' }}
            />
          </Link>
          <h3><Link href={`/noticias/${principal.slug}`}>{principal.titulo}</Link></h3>
          {principal.resumen && <p>{principal.resumen}</p>}
          <div className="rd-byline"><RelativeTime date={principal.fecha} /></div>
        </article>
        <div className="rd-story-secondary">
          {secundarias.slice(0, 2).map((n) => (
            <article key={n.id} className="rd-item">
              <Link href={`/noticias/${n.slug}`} className="rd-thumb" style={{ display: 'block' }}>
                <Image
                  src={getResponsiveImageUrl(n.imagen, 220)}
                  alt={n.titulo}
                  fill
                  sizes="84px"
                  style={{ objectFit: 'cover' }}
                />
              </Link>
              <div>
                <h4><Link href={`/noticias/${n.slug}`}>{n.titulo}</Link></h4>
                <RelativeTime date={n.fecha} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

