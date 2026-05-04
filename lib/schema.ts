import type { WithContext, Article, NewsMediaOrganization } from 'schema-dts';

interface ArticleData {
  titulo: string;
  resumen?: string;
  imagen?: string;
  fecha?: { toDate?: () => Date } | string | number;
  fechaActualizacion?: { toDate?: () => Date } | string | number;
  autor?: string;
  categoria?: string;
  contenido?: string;
}

function toISOString(value: ArticleData['fecha']): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return new Date(value as string | number).toISOString();
}

export function buildNewsArticleJsonLd(article: ArticleData, url: string): WithContext<Article> {
  const fechaISO = toISOString(article.fecha);
  const fechaModISO = article.fechaActualizacion
    ? toISOString(article.fechaActualizacion)
    : fechaISO;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo,
    description: article.resumen || article.titulo,
    image: article.imagen || 'https://nicaraguainformate.com/logo.png',
    datePublished: fechaISO,
    dateModified: fechaModISO,
    author: {
      '@type': 'Person',
      name: article.autor || 'Keyling Rivera M.',
      url: 'https://nicaraguainformate.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nicaraguainformate.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: article.categoria || 'General',
    wordCount: (article.contenido || '').split(/\s+/).length,
  };
}

export function buildOrganizationJsonLd(): WithContext<NewsMediaOrganization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Nicaragua Informate',
    url: 'https://nicaraguainformate.com',
    logo: 'https://nicaraguainformate.com/logo.png',
    sameAs: [
      'https://facebook.com/profile.php?id=61578261125687',
      'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
      'https://t.me/+fHHjncJqMQM3NjZh',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Editorial',
      email: 'keylingrivera20@gmail.com',
    },
  };
}
