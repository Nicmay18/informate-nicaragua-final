'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { getResponsiveImageUrl } from '@/lib/image-utils';

interface SeccionCategoriaProps {
  titulo: string;
  slug: string;
  color: string;
  noticias: Noticia[];
}

function tiempoRelativo(fecha?: string): string {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export default function SeccionCategoria({
  titulo,
  slug,
  color,
  noticias,
}: SeccionCategoriaProps) {
  if (noticias.length < 3) return null;

  const [principal, ...secundarias] = noticias.slice(0, 3);

  return (
    <section className="seccion-categoria" aria-label={titulo} data-reveal>
      <header className="section-header" style={{ borderBottomColor: color }}>
        <h2 className="section-title">
          <span>{titulo.toUpperCase()}</span>
          <span className="section-title-line" style={{ backgroundColor: color }} />
        </h2>
        <Link href={`/categoria/${slug}`} className="section-more" style={{ color }}>
          Ver más {titulo} <ArrowRight size={14} />
        </Link>
      </header>

      <div className="categoria-portal">
        <article className="categoria-destacada">
          <Link href={`/noticias/${principal.slug}`} className="categoria-destacada-link">
            <div className="categoria-destacada-thumb">
              {principal.imagen ? (
                <Image
                  src={getResponsiveImageUrl(principal.imagen, 700)}
                  alt={principal.titulo}
                  fill
                  sizes="(max-width: 720px) 100vw, 60vw"
                  style={{ objectFit: 'cover' }}
                  unoptimized={principal.imagen.endsWith('.gif')}
                />
              ) : null}
              <span className="categoria-tag" style={{ backgroundColor: color }}>
                {titulo.toUpperCase()}
              </span>
            </div>
            <div className="categoria-destacada-body">
              <h3 className="categoria-destacada-title">{principal.titulo}</h3>
              {principal.resumen && <p className="categoria-destacada-resumen">{principal.resumen}</p>}
              <span className="categoria-destacada-meta">
                <Clock size={13} /> {tiempoRelativo(principal.fecha)}
              </span>
            </div>
          </Link>
        </article>

        <div className="categoria-secundarias">
          {secundarias.slice(0, 2).map((n) => (
            <article key={n.id} className="categoria-secundaria">
              <Link href={`/noticias/${n.slug}`} className="categoria-secundaria-link">
                {n.imagen ? (
                  <div className="categoria-secundaria-thumb">
                    <Image
                      src={getResponsiveImageUrl(n.imagen, 220)}
                      alt={n.titulo}
                      fill
                      sizes="(max-width: 720px) 100vw, 40vw"
                      style={{ objectFit: 'cover' }}
                      unoptimized={n.imagen.endsWith('.gif')}
                    />
                    <span className="categoria-tag" style={{ backgroundColor: color }}>
                      {titulo.toUpperCase()}
                    </span>
                  </div>
                ) : null}
                <div className="categoria-secundaria-body">
                  <h4 className="categoria-secundaria-title">{n.titulo}</h4>
                  <span className="categoria-secundaria-meta">
                    <Clock size={13} /> {tiempoRelativo(n.fecha)}
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
