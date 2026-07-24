'use client';

import Link from 'next/link';
import type { Noticia } from '@/lib/types';
import { AUTHORS } from '@/lib/authors';

interface SeccionOpinionProps {
  noticias: Noticia[];
}

export default function SeccionOpinion({ noticias }: SeccionOpinionProps) {
  if (noticias.length === 0) return null;

  const items = noticias.slice(0, 3);

  return (
    <section className="seccion-categoria seccion-opinion" aria-label="Opinión y Editorial" data-reveal>
      <header className="section-header" style={{ borderBottomColor: '#0f172a' }}>
        <h2 className="section-title">
          <span>OPINIÓN</span>
          <span className="section-title-line" style={{ backgroundColor: '#0f172a' }} />
        </h2>
      </header>

      <div className="opinion-grid">
        {items.map((n) => {
          const autorData = Object.values(AUTHORS).find(a => a.name === n.autor?.trim());
          const photo = autorData?.photo || n.autorFoto;
          const initials = (n.autor || 'R').trim().charAt(0).toUpperCase();

          return (
            <article key={n.id} className="opinion-card">
              <Link href={`/noticias/${n.slug}`} className="opinion-card__link">
                <div className="opinion-card__author">
                  {photo ? (
                    <img
                      src={photo}
                      alt={n.autor || 'Autor'}
                      width={56}
                      height={56}
                      loading="lazy"
                      className="opinion-card__photo"
                    />
                  ) : (
                    <span className="opinion-card__initials">{initials}</span>
                  )}
                  <div className="opinion-card__author-info">
                    <span className="opinion-card__name">{n.autor || 'Redacción'}</span>
                    <span className="opinion-card__role">{autorData?.role || 'Columnista'}</span>
                  </div>
                </div>
                <span className="opinion-card__badge">OPINIÓN</span>
                <h3 className="opinion-card__title">{n.titulo}</h3>
                {n.resumen && <p className="opinion-card__excerpt">{n.resumen}</p>}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
