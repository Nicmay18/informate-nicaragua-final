// File: components/NewsCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Noticia } from '@/lib/types';

interface NewsCardProps {
  noticia: Noticia;
}

export default function NewsCard({ noticia }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(noticia.fecha || Date.now()), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Link href={`/noticias/${noticia.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className="news-card">
        <div className="news-card-image">
          {noticia.imagen ? (
            <Image
              src={noticia.imagen}
              alt={noticia.titulo}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
            }}>
              Sin imagen
            </div>
          )}
          {noticia.categoria && (
            <span className="news-card-category">{noticia.categoria}</span>
          )}
        </div>

        <div className="news-card-content">
          <h3 className="news-card-title">{noticia.titulo}</h3>

          {noticia.resumen && (
            <p className="news-card-excerpt">{noticia.resumen}</p>
          )}

          <div className="news-card-meta">
            <time className="news-card-date" dateTime={noticia.fecha} suppressHydrationWarning>
              <span>📅</span>
              {timeAgo}
            </time>
            {noticia.autor && (
              <span className="news-card-author">{noticia.autor}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
