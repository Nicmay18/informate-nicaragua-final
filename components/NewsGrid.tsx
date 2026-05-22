// File: components/NewsGrid.tsx
import Link from 'next/link';
import NewsCard from './NewsCard';
import type { Noticia } from '@/lib/types';

interface NewsGridProps {
  title: string;
  noticias: Noticia[];
  viewAllLink?: string;
}

export default function NewsGrid({
  title,
  noticias,
  viewAllLink,
}: NewsGridProps) {
  return (
    <section className="news-grid-section">
      <div className="news-grid-header">
        <h2 className="news-grid-title">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="news-grid-link">
            Ver más <span>→</span>
          </Link>
        )}
      </div>

      <div className="news-grid">
        {noticias.length > 0 ? (
          noticias.map((noticia) => (
            <NewsCard key={noticia.id} noticia={noticia} />
          ))
        ) : (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: 'var(--spacing-xl)' }}>
            No hay noticias disponibles en este momento.
          </p>
        )}
      </div>
    </section>
  );
}
