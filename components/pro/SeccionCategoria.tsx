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
  layout?: 'split' | 'grid';
}

export default function SeccionCategoria({
  titulo,
  slug,
  color,
  principal,
  secundarias,
  layout = 'split',
}: SeccionCategoriaProps) {
  if (!principal && secundarias.length === 0) return null;

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

      {layout === 'split' && principal ? (
        <div className="categoria-split">
          <article className="categoria-principal">
            <Link href={`/noticias/${principal.slug}`} className="categoria-principal-link">
              <div className="categoria-principal-thumb">
                {principal.imagen ? (
                  <Image
                    src={getResponsiveImageUrl(principal.imagen, 600)}
                    alt={principal.titulo}
                    fill
                    sizes="(max-width: 720px) 100vw, 55vw"
                    style={{ objectFit: 'cover' }}
                    unoptimized={principal.imagen.endsWith('.gif')}
                  />
                ) : null}
              </div>
              <h3 className="categoria-principal-title">{principal.titulo}</h3>
              <p className="categoria-principal-resumen">{principal.resumen}</p>
            </Link>
          </article>

          <div className="categoria-secundarias">
            {secundarias.map((n) => (
              <article key={n.id} className="categoria-item">
                <Link href={`/noticias/${n.slug}`} className="categoria-item-link">
                  {n.imagen ? (
                    <div className="categoria-item-thumb">
                      <Image
                        src={getResponsiveImageUrl(n.imagen, 120)}
                        alt={n.titulo}
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover' }}
                        unoptimized={n.imagen.endsWith('.gif')}
                      />
                    </div>
                  ) : null}
                  <h4 className="categoria-item-title">{n.titulo}</h4>
                </Link>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="categoria-grid-2">
          {[principal, ...secundarias].filter(Boolean).map((n) => (
            <article key={n!.id} className="categoria-card">
              <Link href={`/noticias/${n!.slug}`} className="categoria-card-link">
                <div className="categoria-card-thumb">
                  {n!.imagen ? (
                    <Image
                      src={getResponsiveImageUrl(n!.imagen, 400)}
                      alt={n!.titulo}
                      fill
                      sizes="(max-width: 720px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                      unoptimized={n!.imagen.endsWith('.gif')}
                    />
                  ) : null}
                </div>
                <h4 className="categoria-card-title">{n!.titulo}</h4>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
