'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { getResponsiveImageUrl } from '@/lib/image-utils';

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

interface SeccionDestacadosProps {
  noticias: Noticia[];
}

const CAT_COLORS: Record<string, string> = {
  nacionales: '#2563EB',
  internacionales: '#059669',
  deportes: '#D97706',
  sucesos: '#DC2626',
  espectaculos: '#7C3AED',
  tecnologia: '#0891B2',
  economia: '#0F172A',
};

export default function SeccionDestacados({ noticias }: SeccionDestacadosProps) {
  if (!noticias.length) return null;

  const catClass = (cat?: string) => {
    const slug = (cat || 'noticias').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (slug.includes('suceso')) return 'sucesos';
    if (slug.includes('nacional')) return 'nacionales';
    if (slug.includes('internacional')) return 'internacionales';
    if (slug.includes('deporte')) return 'deportes';
    if (slug.includes('espectaculo')) return 'espectaculos';
    if (slug.includes('tecnologia')) return 'tecnologia';
    return 'nacionales';
  };

  return (
    <section className="seccion-destacados" aria-label="Lo destacado" data-reveal>
      <header className="section-header">
        <h2 className="section-title">
          <span>LO DESTACADO</span>
          <span className="section-title-line" style={{ backgroundColor: '#DC2626' }} />
        </h2>
      </header>

      <div className="destacados-grid">
        {noticias.slice(0, 4).map((n) => {
          const cat = catClass(n.categoria);
          return (
            <article key={n.id} className="destacado-card">
              <Link href={`/noticias/${n.slug}`} className="destacado-link">
                <div className="destacado-thumb">
                  {n.imagen ? (
                    <Image
                      src={getResponsiveImageUrl(n.imagen, 400)}
                      alt={n.titulo}
                      fill
                      sizes="(max-width: 720px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                      unoptimized={n.imagen.endsWith('.gif')}
                    />
                  ) : null}
                  <span className="destacado-pill" style={{ backgroundColor: CAT_COLORS[cat] || '#0F172A' }}>
                    {n.categoria || 'Noticia'}
                  </span>
                </div>
                <div className="destacado-body">
                  <h3 className="destacado-title">{n.titulo}</h3>
                  {n.resumen && <p className="destacado-extract">{n.resumen}</p>}
                  <span className="destacado-meta">
                    <Clock size={13} /> {tiempoRelativo(n.fecha)}
                  </span>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
