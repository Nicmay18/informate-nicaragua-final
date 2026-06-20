// File: components/NewsCard.tsx
import Link from 'next/link';

const NoPrefetchLink = (props: React.ComponentProps<typeof Link>) => (
  <Link {...props} prefetch={false} />
);
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Noticia } from '@/lib/types';

interface NewsCardProps {
  noticia: Noticia;
}

function safeTimeAgo(dateInput: unknown): string {
  const dateStr = typeof dateInput === 'string' ? dateInput : '';
  try {
    const d = new Date(dateStr || Date.now());
    if (isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return '';
  }
}

export default function NewsCard({ noticia }: NewsCardProps) {
  const timeAgo = safeTimeAgo(noticia.fecha);

  return (
    <NoPrefetchLink href={`/noticias/${noticia.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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

          <div className="news-card-meta" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'4px 12px', marginTop:'auto' }}>
            <time className="news-card-date" dateTime={noticia.fecha} suppressHydrationWarning style={{ fontSize:12, color:'var(--text-secondary,#6b7280)', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
              <span aria-hidden="true">📅</span>
              {timeAgo}
            </time>
            {noticia.fechaActualizacion && (
              <time className="news-card-updated" dateTime={noticia.fechaActualizacion} suppressHydrationWarning style={{ fontSize:12, color:'#991b1b', fontWeight: 500, whiteSpace:'nowrap' }}>
                Actualizado {safeTimeAgo(noticia.fechaActualizacion)}
              </time>
            )}
            {noticia.autor && (
              <span className="news-card-author" style={{ fontSize:12, color:'var(--text-secondary,#6b7280)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' }}>{noticia.autor}</span>
            )}
          </div>
        </div>
      </article>
    </NoPrefetchLink>
  );
}
