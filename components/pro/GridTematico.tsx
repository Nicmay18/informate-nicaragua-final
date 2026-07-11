"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { tiempoRelativo } from '@/lib/formateo';

interface GridTematicoProps {
  economia: Noticia[];
  tecnologia: Noticia[];
  deportes: Noticia[];
  cultura: Noticia[];
}

const SECCIONES = [
  { key: 'economia' as const, label: 'ECONOMÍA', color: '#059669', slug: 'economia' },
  { key: 'tecnologia' as const, label: 'TECNOLOGÍA', color: '#2563EB', slug: 'tecnologia' },
  { key: 'deportes' as const, label: 'DEPORTES', color: '#B45309', slug: 'deportes' },
  { key: 'cultura' as const, label: 'ESPECTÁCULOS', color: '#7C3AED', slug: 'espectaculos' },
];

function SeccionTematica({
  noticias,
  label,
  color,
  slug,
}: {
  noticias: Noticia[];
  label: string;
  color: string;
  slug: string;
}) {
  if (!noticias.length) return null;

  const [principal, ...resto] = noticias;

  return (
    <div className="tematico-seccion">
      <header className="section-header">
        <h2 className="section-title">
          <span style={{ color }}>{label}</span>
          <span className="section-title-line" style={{ backgroundColor: color }} />
        </h2>
      </header>

      <div className="tematico-grid">
        {/* Noticia principal con imagen */}
        <article className="tematico-principal">
          <Link href={`/noticias/${principal.slug}`} className="tematico-principal-link">
            <div className="tematico-img-wrap">
              <Image
                src={principal.imagen || '/logo.webp'}
                alt={principal.titulo}
                width={560}
                height={315}
                className="tematico-img"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              <span
                className="tematico-tag"
                style={{ backgroundColor: color }}
              >
                {label}
              </span>
            </div>
            <div className="tematico-principal-body">
              <h3 className="tematico-principal-title">{principal.titulo}</h3>
              {principal.resumen && (
                <p className="tematico-principal-excerpt">{principal.resumen}</p>
              )}
              <div className="tematico-meta">
                <Clock size={13} />
                <time>{tiempoRelativo(principal.fecha)}</time>
              </div>
            </div>
          </Link>
        </article>

        {/* Lista de titulares sin imagen */}
        <aside className="tematico-lista">
          {resto.slice(0, 4).map((noticia) => (
            <article key={noticia.id} className="tematico-item">
              <Link href={`/noticias/${noticia.slug}`} className="tematico-item-link">
                <span
                  className="tematico-bullet"
                  style={{ backgroundColor: color }}
                />
                <div className="tematico-item-content">
                  <h4 className="tematico-item-title">{noticia.titulo}</h4>
                  <time className="tematico-item-time">{tiempoRelativo(noticia.fecha)}</time>
                </div>
              </Link>
            </article>
          ))}

          <Link
            href={`/categoria/${slug}`}
            className="tematico-ver-mas"
            style={{ color }}
          >
            Ver más {label.toLowerCase()}
            <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default function GridTematico({ economia, tecnologia, deportes, cultura }: GridTematicoProps) {
  const secciones = SECCIONES.map(s => ({
    ...s,
    noticias: { economia, tecnologia, deportes, cultura }[s.key],
  })).filter(s => s.noticias.length > 0);

  if (!secciones.length) return null;

  return (
    <section className="grid-tematico section-wrap" aria-label="Secciones temáticas" data-reveal>
      <div className="section-container">
        <div className="tematico-wrapper">
          {secciones.map(s => (
            <SeccionTematica
              key={s.key}
              noticias={s.noticias}
              label={s.label}
              color={s.color}
              slug={s.slug}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
