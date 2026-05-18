export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': 'https://nicaraguainformate.com/#organization',
    name: 'Nicaragua Informate',
    alternateName: 'NicInformate',
    url: 'https://nicaraguainformate.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://nicaraguainformate.com/logo.png',
      width: 512,
      height: 512,
    },
    sameAs: [
      'https://facebook.com/profile.php?id=61578261125687',
      'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
      'https://t.me/+fHHjncJqMQM3NjZh',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Managua',
      addressCountry: 'NI',
    },
    areaServed: { '@type': 'Country', name: 'Nicaragua' },
    inLanguage: 'es-NI',
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nicaragua Informate',
    url: 'https://nicaraguainformate.com',
  };
}

import { Noticia } from './types';

export function buildNewsArticleJsonLd(article: Noticia, url: string, readingTime = 1) {
  const keywords = [article.categoria, 'Nicaragua', 'noticias', 'actualidad'];
  if (article.tags && Array.isArray(article.tags)) {
    keywords.push(...article.tags.slice(0, 5));
  }

  const wordCount = article.contenido
    ? article.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter((w: string) => w.length > 0).length
    : 0;

  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo,
    description: article.resumen,
    image: article.imagen,
    datePublished: article.fecha,
    dateModified: article.fechaActualizacion || article.fecha,
    author: {
      '@type': 'Person',
      name: article.autor || 'Redacción Nicaragua Informate',
      jobTitle: 'Periodista',
      url: 'https://nicaraguainformate.com/autor/keyling-rivera',
      worksFor: { '@id': 'https://nicaraguainformate.com/#organization' },
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-headline', '.article-body'],
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nicaraguainformate.com/logo.png',
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'es-NI',
    articleSection: article.categoria,
    keywords: keywords.join(', '),
    wordCount,
    timeRequired: `PT${readingTime}M`,
  };

  return base;
}

const CATEGORY_SLUG_MAP: Record<string, string> = {
  'sucesos': 'Sucesos',
  'nacionales': 'Nacionales',
  'deportes': 'Deportes',
  'internacionales': 'Internacionales',
  'tecnologia': 'Tecnología',
  'espectaculos': 'Espectáculos',
};

const SLUG_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_MAP).map(([k, v]) => [v, k])
);

export function buildBreadcrumbJsonLd(category?: string) {
  const baseUrl = 'https://nicaraguainformate.com';
  const breadcrumbItems = [
    { name: 'Inicio', item: baseUrl },
    { name: 'Noticias', item: `${baseUrl}/noticias` },
  ];

  if (category && category !== 'Actualidad') {
    const slug = SLUG_TO_CATEGORY[category] || category.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    breadcrumbItems.push({
      name: category,
      item: `${baseUrl}/${slug}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}
