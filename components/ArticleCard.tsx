import Link from 'next/link';
import Image from 'next/image';
import { Article, CATEGORY_COLORS } from '@/lib/types';

interface ArticleCardProps {
  article: Article;
  hero?: boolean;
  index?: number;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-NI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ArticleCard({ article, hero = false, index = 0 }: ArticleCardProps) {
  const catColor = CATEGORY_COLORS[article.category] || '#8c1d18';
  const href = `/noticias/${article.slug}/`;

  if (hero) {
    return (
      <article className="news-card news-card--hero" data-category={article.category}>
        <Link href={href} className="news-card-link" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr' }}>
          <div className="news-card-image">
            <span
              className="news-card-category"
              style={{ backgroundColor: catColor }}
            >
              {article.category}
            </span>
            <Image
              src={article.image}
              alt={article.title}
              width={800}
              height={450}
              priority={index === 0}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="news-card-body">
            <h2 className="news-card-title">{article.title}</h2>
            <p className="news-card-excerpt">{article.excerpt}</p>
            <div className="news-card-meta">
              <span>{formatDate(article.date)}</span>
              <span><i className="far fa-clock" /> {article.readTime} min</span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="news-card" data-category={article.category}>
      <Link href={href} className="news-card-link">
        <div className="news-card-image">
          <span
            className="news-card-category"
            style={{ backgroundColor: catColor }}
          >
            {article.category}
          </span>
          <Image
            src={article.image}
            alt={article.title}
            width={640}
            height={400}
            loading={index < 6 ? 'eager' : 'lazy'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="news-card-body">
          <h2 className="news-card-title">{article.title}</h2>
          <p className="news-card-excerpt">{article.excerpt}</p>
          <div className="news-card-meta">
            <span>{formatDate(article.date)}</span>
            <span><i className="far fa-clock" /> {article.readTime} min</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
