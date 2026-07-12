'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { getResponsiveImageUrl } from '@/lib/image-utils';

interface SeccionCategoriaProps {
  titulo: string;
  slug: string;
  color: string;
  principal: Noticia | null;
  secundarias: Noticia[];
}

export default function SeccionCategoria({
  titulo,
  slug,
  color,
  principal,
  secundarias,
}: SeccionCategoriaProps) {
  if (!principal && secundarias.length === 0) return null;

  const todas = [principal, ...secundarias].filter((n): n is Noticia => Boolean(n));
  const destacada = todas[0];
  const resto = todas.slice(1, 3);

  if (!destacada) return null;

  return (
    <section className="seccion-categoria" aria-label={titulo} data-reveal>
      <header className="section-header" style={{ borderBottomColor: color }}>
        <h2 className="section-title">
          <span>{titulo.toUpperCase()}</span>
          <span className="section-title-line" style={{ backgroundColor: color }} />
        </h2>
        <Link href={`/categoria/${slug}`} className="section-more" style={{ color }}>
          Ver más {slug} <ArrowRight size={14} />
        </Link>
      </header>

      <div className="categoria-portal">
        <article className="categoria-destacada">
          <Link href={`/noticias/${destacada.slug}`} className="categoria-destacada-link">
            <div className="categoria-destacada-thumb">
              {destacada.imagen ? (
                <Image
                  src={getResponsiveImageUrl(destacada.imagen, 700)}
                  alt={destacada.titulo}
                  fill
                  sizes="(max-width: 720px) 100vw, 55vw"
                  style={{ objectFit: 'cover' }}
                  unoptimized={destacada.imagen.endsWith('.gif')}
                />
              ) : null}
            </div>
            <div className="categoria-destacada-body">
              <h3 className="categoria-destacada-title">{destacada.titulo}</h3>
              <p className="categoria-destacada-resumen">{destacada.resumen}</p>
            </div>
          </Link>
        </article>

        {resto.length > 0 && (
          <div className="categoria-secundarias">
            {resto.map((n) => (
              <article key={n.id} className="categoria-secundaria">
                <Link href={`/noticias/${n.slug}`} className="categoria-secundaria-link">
                  {n.imagen ? (
                    <div className="categoria-secundaria-thumb">
                      <Image
                        src={getResponsiveImageUrl(n.imagen, 220)}
                        alt={n.titulo}
                        fill
                        sizes="(max-width: 720px) 100vw, 25vw"
                        style={{ objectFit: 'cover' }}
                        unoptimized={n.imagen.endsWith('.gif')}
                      />
                    </div>
                  ) : null}
                  <h4 className="categoria-secundaria-title">{n.titulo}</h4>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
