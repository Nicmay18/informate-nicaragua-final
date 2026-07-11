"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import { tiempoRelativo } from '@/lib/formateo';

interface EditorsPickProps {
  noticias: Noticia[];
}

export default function EditorsPick({ noticias }: EditorsPickProps) {
  if (!noticias.length) return null;

  return (
    <section className="editors-pick section-wrap" aria-label="Lo destacado" data-reveal>
      <div className="section-container">
        <header className="section-header">
          <h2 className="section-title">
            <span>LO DESTACADO</span>
            <span className="section-title-line" style={{ backgroundColor: '#DC2626' }} />
          </h2>
        </header>

        <div className="editors-grid">
          {noticias.map((noticia) => {
            const catColor = CATEGORY_COLORS[noticia.categoria] || '#B45309';
            return (
              <article key={noticia.id} className="editors-card">
                <Link href={`/noticias/${noticia.slug}`} className="editors-card-link">
                  <div className="editors-card-img-wrap">
                    <Image
                      src={noticia.imagen || '/logo.webp'}
                      alt={noticia.titulo}
                      width={480}
                      height={270}
                      className="editors-card-img"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <span
                      className="editors-card-tag"
                      style={{ backgroundColor: catColor }}
                    >
                      {noticia.categoria}
                    </span>
                  </div>
                  <div className="editors-card-body">
                    <h3 className="editors-card-title">{noticia.titulo}</h3>
                    {noticia.resumen && (
                      <p className="editors-card-excerpt">{noticia.resumen}</p>
                    )}
                    <div className="editors-card-meta">
                      <Clock size={13} />
                      <time>{tiempoRelativo(noticia.fecha)}</time>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
