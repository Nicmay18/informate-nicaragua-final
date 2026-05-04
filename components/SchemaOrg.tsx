import { Article } from '@/lib/types';

interface ArticleJsonLdProps {
  article: Article;
}

export function ArticleJsonLd({ article }: ArticleJsonLdProps) {
  const wordCount = article.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || article.title,
    image: article.image,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      '@type': 'Person',
      name: article.author,
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
      '@id': `https://nicaraguainformate.com/noticias/${article.slug}/`,
    },
    articleSection: article.category,
    wordCount,
    inLanguage: 'es',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebSiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nicaragua Informate',
    url: 'https://nicaraguainformate.com',
    description: 'Periodismo de Precisión. Noticias de Nicaragua al instante.',
    publisher: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nicaraguainformate.com/logo.png',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://nicaraguainformate.com/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
