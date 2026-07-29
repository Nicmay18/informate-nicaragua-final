"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Noticia } from '@/lib/types';
import { tiempoLectura } from '@/lib/formateo';
import { getResponsiveImageUrl, getHeroImageUrl } from '@/lib/image-utils';
import { FALLBACK_IMAGE } from '@/lib/types';
import { RelativeTime, FullRelativeTime } from '@/components/ClientTime';
import dynamic from 'next/dynamic';

interface HomePageProProps {
  noticias: Noticia[];
  masLeidas?: Noticia[];
  populares?: Noticia[];
  isNoticiasPage?: boolean;
}

function distribuirNoticias(noticias: Noticia[]) {
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

  const disponibles = () => noticias.filter(n => !usados.has(n.id));
  const porCategoria = (cat: string) => disponibles().filter(n => n.categoria === cat);
  const conImagen = (lista: Noticia[]) => lista.filter(n => n.imagen && n.imagen !== '/logo.webp' && n.imagen !== '/logo.png');

  // Portada: una nacional, un suceso, una internacional y variedad
  const portadaMeta: Noticia[] = [];
  const portadaCategorias = ['Nacionales', 'Sucesos', 'Internacionales', 'Deportes', 'Tecnología', 'Espectáculos'];
  for (const cat of portadaCategorias) {
    if (portadaMeta.length >= 5) break;
    const elegida = conImagen(porCategoria(cat)).find(n => !usados.has(n.id));
    if (elegida) { portadaMeta.push(elegida); usados.add(elegida.id); }
  }
  // Completar si faltan
  while (portadaMeta.length < 5) {
    const siguiente = conImagen(disponibles()).find(n => !usados.has(n.id));
    if (!siguiente) break;
    portadaMeta.push(siguiente);
    usados.add(siguiente.id);
  }

  const heroNoticias = portadaMeta.slice(0, 1);
  const enPortada = portadaMeta.slice(1, 5);

  const breaking = take(disponibles().filter(n => n.categoria !== 'Sucesos').slice(0, 3), 3);
  if (breaking.length < 3) breaking.push(...take(disponibles(), 3 - breaking.length));

  const seccion = (cat: string, min = 1) => {
    const items = take(porCategoria(cat), 3);
    return items.length >= min ? items : [];
  };

  const recientes = disponibles().slice(0, 3);

  return {
    heroNoticias,
    enPortada,
    breaking,
    recientes,
    nacionales: seccion('Nacionales'),
    sucesos: seccion('Sucesos'),
    deportes: seccion('Deportes'),
    internacionales: seccion('Internacionales'),
    tecnologia: seccion('Tecnología'),
    espectaculos: seccion('Espectáculos'),
    excluidos: new Set(usados),
  };
}

export default function HomePagePro({ noticias, masLeidas = [], populares = [], isNoticiasPage: _isNoticiasPage }: HomePageProProps) {
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
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--rd-serif)', fontSize: 22, color: 'var(--rd-ink)' }}>No hay noticias disponibles</h2>
          <p style={{ color: 'var(--rd-muted)', marginTop: 8 }}>Estamos preparando nuevo contenido. Vuelve pronto.</p>
          <Link href="/noticias" style={{ color: 'var(--rd-accent)', fontWeight: 600 }}>Ver archivo de noticias →</Link>
        </div>
      </div>
    );
  }

  const hero = dist.heroNoticias[0];
  const heroImg = hero ? getHeroImageUrl(hero.imagen, 800) : FALLBACK_IMAGE;

  return (
    <div className="rd-home">
      {/* Breaking bar */}
      {dist.breaking.length > 0 && (
        <div className="rd-breaking">
          <div className="rd-breaking__inner">
            <span className="rd-breaking-tag"><span className="rd-dot" />Última hora</span>
            <div className="rd-breaking-list">
              {dist.breaking.map((n) => (
                <Link key={n.id} href={`/noticias/${n.slug}`}>{n.titulo}</Link>
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
                  sizes="(max-width: 880px) 100vw, 65vw"
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
            {dist.recientes.length > 0 && <SectionGrid titulo="Últimas noticias" slug="noticias" noticias={dist.recientes} reverse={false} />}
            {dist.nacionales.length >= 1 && <SectionGrid titulo="Nacionales" slug="nacionales" noticias={dist.nacionales} reverse={false} />}
            {dist.internacionales.length >= 3 && <SectionGrid titulo="Internacionales" slug="internacionales" noticias={dist.internacionales} reverse={false} />}
            {dist.deportes.length >= 3 && <SectionGrid titulo="Deportes" slug="deportes" noticias={dist.deportes} reverse={false} />}
            {dist.espectaculos.length >= 3 && <SectionGrid titulo="Espectáculos" slug="espectaculos" noticias={dist.espectaculos} reverse={false} />}
            {dist.tecnologia.length >= 3 && <SectionGrid titulo="Tecnología" slug="tecnologia" noticias={dist.tecnologia} reverse={false} />}
            {dist.sucesos.length >= 3 && <SectionGrid titulo="Sucesos" slug="sucesos" noticias={dist.sucesos} reverse={true} />}
          </div>

          <aside className="rd-rail">
            <SidebarRedesign masLeidas={masLeidas.length ? masLeidas : populares} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionGrid({ titulo, slug, noticias, reverse }: { titulo: string; slug: string; noticias: Noticia[]; reverse: boolean }) {
  const [principal, ...secundarias] = noticias.slice(0, 3);
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

const RadioPlayer = dynamic(() => import('@/components/RadioPlayer'), { ssr: false });
const EconomicBar = dynamic(() => import('@/components/EconomicBar'), { ssr: false });
const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), { ssr: false });
const WorldClock = dynamic(() => import('@/components/WorldClock'), { ssr: false });
const GuiaUtilWidget = dynamic(() => import('@/components/pro/GuiaUtilWidget'), { ssr: false });

function SidebarRedesign({ masLeidas }: { masLeidas: Noticia[] }) {
  const lecturas = masLeidas.slice(0, 5);

  return (
    <>
      {/* Radio en vivo */}
      <div className="rd-panel" style={{ overflow: 'hidden' }}>
        <div className="rd-panel-head">Radio en Vivo</div>
        <div style={{ padding: '0 0 16px' }}>
          <RadioPlayer />
        </div>
      </div>

      {/* Indicadores económicos */}
      <div className="rd-panel" style={{ overflow: 'hidden', background: '#0f172a' }}>
        <div className="rd-panel-head" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>Indicadores económicos</div>
        <EconomicBar />
      </div>

      {/* Clima */}
      <div className="rd-panel" style={{ overflow: 'hidden', background: '#0f172a' }}>
        <div className="rd-panel-head" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>Clima Nicaragua</div>
        <WeatherWidget />
      </div>

      {/* Reloj mundial */}
      <div className="rd-panel" style={{ overflow: 'hidden', background: '#0f172a' }}>
        <div className="rd-panel-head" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>Reloj mundial</div>
        <WorldClock />
      </div>

      {lecturas.length > 0 && (
        <div className="rd-panel">
          <div className="rd-panel-head">Más leídas</div>
          <ol style={{ listStyle: 'none', margin: 0, padding: '6px 16px 10px' }}>
            {lecturas.map((n, i) => (
              <li key={n.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < lecturas.length - 1 ? '1px solid var(--rd-line)' : 'none', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--rd-serif)', fontWeight: 700, fontSize: 19, color: 'var(--rd-accent)', flex: 'none', width: 20 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4 style={{ fontFamily: 'var(--rd-serif)', fontSize: 14.5, lineHeight: 1.35, fontWeight: 600, margin: 0 }}>
                  <Link href={`/noticias/${n.slug}`}>{n.titulo}</Link>
                </h4>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Guías útiles */}
      <div className="rd-panel" style={{ overflow: 'hidden' }}>
        <div className="rd-panel-head">Guías útiles</div>
        <div style={{ padding: '0 16px 14px' }}>
          <GuiaUtilWidget />
        </div>
      </div>

      <div style={{ background: 'var(--rd-accent-soft)', border: '1px solid #B9DAD6', borderRadius: 'var(--rd-radius)', padding: 20 }}>
        <h3 style={{ fontFamily: 'var(--rd-serif)', fontSize: 17, margin: '0 0 6px' }}>Boletín matutino</h3>
        <p style={{ fontSize: 13, color: '#0B3D3A', margin: '0 0 14px', lineHeight: 1.45 }}>
          Recibe las noticias más importantes de Nicaragua cada mañana, directo a tu correo.
        </p>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            placeholder="nombre@correo.com"
            aria-label="Correo electrónico"
            style={{ flex: 1, minWidth: 0, border: '1px solid #A9CFCB', borderRadius: 'var(--rd-radius)', padding: '9px 10px', fontFamily: 'var(--rd-sans)', fontSize: 13, background: '#fff' }}
          />
          <button type="submit" style={{ background: 'var(--rd-ink)', color: '#fff', border: 'none', borderRadius: 'var(--rd-radius)', padding: '9px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Suscribirme
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <a href="https://www.facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ width: 36, height: 36, border: '1px solid var(--rd-line)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rd-ink)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.36 4.25 14.33 4.25c-2.15 0 -3.62 1.31-3.62 3.72v2.53H8.25v3H10.71V21h2.79z" /></svg>
        </a>
        <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" style={{ width: 36, height: 36, border: '1px solid var(--rd-line)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rd-ink)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 00-7.75 13.6L3 21l4.55-1.2A9 9 0 1012 3z" /></svg>
        </a>
        <a href="https://t.me/fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" aria-label="Telegram" style={{ width: 36, height: 36, border: '1px solid var(--rd-line)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rd-ink)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 4.5L3.6 11.4c-1.1.44-1.1 1.06-.2 1.33l4.6 1.44 1.77 5.4c.22.6.4.83.8.83.35 0 .5-.16.7-.35l1.9-1.85 4 2.94c.7.4 1.22.2 1.4-.65l2.5-11.9c.28-1.1-.4-1.6-1.17-1.15z" /></svg>
        </a>
      </div>
    </>
  );
}
