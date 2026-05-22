// File: components/HeroSection.tsx
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Noticia } from '@/lib/types';

interface HeroSectionProps {
  noticia: Noticia;
}

export default function HeroSection({ noticia }: HeroSectionProps) {
  const timeAgo = formatDistanceToNow(new Date(noticia.fecha || Date.now()), {
    addSuffix: true,
    locale: es,
  });

  return (
    <section className="hero">
      {noticia.imagen && (
        <Image
          src={noticia.imagen}
          alt={noticia.titulo}
          fill
          priority
          className="hero-image"
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      )}

      <div className="hero-content">
        {noticia.categoria && (
          <span className="hero-category">{noticia.categoria}</span>
        )}

        <h1 className="hero-title">{noticia.titulo}</h1>

        <div className="hero-meta">
          {noticia.autor && <span>{noticia.autor}</span>}
          {noticia.autor && <span> • </span>}
          <span>{timeAgo}</span>
        </div>

        {noticia.resumen && (
          <p className="hero-description">{noticia.resumen}</p>
        )}

        <Link
          href={`/noticias/${noticia.slug}`}
          className="btn-cta"
        >
          Leer artículo
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}
