'use client';

import Link from 'next/link';
import type { Noticia } from '@/lib/types';

interface BarraUltimaHoraProps {
  noticias: Noticia[];
}

export default function BarraUltimaHora({ noticias }: BarraUltimaHoraProps) {
  if (!noticias.length) return null;

  return (
    <div className="barra-ultima-hora" role="region" aria-label="Última hora">
      <span className="barra-uh-label">ÚLTIMA HORA</span>
      <div className="barra-uh-items">
        {noticias.map((n) => (
          <Link key={n.id} href={`/noticias/${n.slug}`} className="barra-uh-item">
            <span className="barra-uh-dot" aria-hidden="true" />
            <span className="barra-uh-title">{n.titulo}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
