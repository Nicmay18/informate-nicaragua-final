import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Noticia, CATEGORY_COLORS, FALLBACK_IMAGE } from '@/lib/types';
import { formatDateES } from '@/lib/formateo';

/**
 * Props para ArticleCard
 */
interface ArticleCardProps {
  article: Noticia;
  hero?: boolean;
  index?: number;
}

/**
 * Componente de tarjeta de artículo
 * @param props Props del componente
 * @returns Tarjeta de artículo
 */
export default function ArticleCard({ article, hero = false, index = 0 }: ArticleCardProps) {
  if (!article || !article.slug || !article.titulo) {
    return null;
  }

  const catColor = CATEGORY_COLORS[article.categoria] || '#8c1d18';
  const href = `/noticias/${article.slug}/`;
  const imageUrl = article.imagen || FALLBACK_IMAGE;
  const readTime = article.palabras ? Math.ceil(article.palabras / 200) : 3;

  if (hero) {
    return (
      <article className="news-card news-card--hero" data-category={article.categoria}>
        <Link href={href} className="news-card-link" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr' }}>
          <div className="news-card-image">
            <span
              className="news-card-category"
              style={{ backgroundColor: catColor }}
            >
              {article.categoria}
            </span>
            <Image
              src={imageUrl}
              alt={article.titulo}
              width={800}
              height={450}
              priority={index === 0}
              loading={index === 0 ? undefined : 'lazy'}
              quality={index === 0 ? 90 : 75}
              sizes="(max-width: 1024px) 100vw, 55vw"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="news-card-body">
            <h2 className="news-card-title">{article.titulo}</h2>
            <p className="news-card-excerpt">{article.resumen}</p>
            <div className="news-card-meta">
              <span>{formatDateES(article.fecha)}</span>
              <span><Clock size={12} /> {readTime} min</span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="news-card" data-category={article.categoria}>
      <Link href={href} className="news-card-link">
        <div className="news-card-image">
          <span
            className="news-card-category"
            style={{ backgroundColor: catColor }}
          >
            {article.categoria}
          </span>
          <Image
            src={imageUrl}
            alt={article.titulo}
            width={640}
            height={400}
            priority={index < 6}
            loading={index < 6 ? undefined : 'lazy'}
            quality={index < 6 ? 85 : 75}
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="news-card-body">
          <h2 className="news-card-title">{article.titulo}</h2>
          <p className="news-card-excerpt">{article.resumen}</p>
          <div className="news-card-meta">
            <span>{formatDateES(article.fecha)}</span>
            <span><Clock size={12} /> {readTime} min</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
