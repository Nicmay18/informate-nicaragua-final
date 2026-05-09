export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Nicaragua Informate',
    url: 'https://nicaraguainformate.com',
    logo: 'https://nicaraguainformate.com/logo.png',
    sameAs: [
      'https://facebook.com/profile.php?id=61578261125687',
      'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
    ],
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

export function buildNewsArticleJsonLd(article: any, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo,
    description: article.resumen,
    image: article.imagen,
    datePublished: article.fecha,
    author: { '@type': 'Organization', name: article.autor || 'Nicaragua Informate' },
    publisher: { '@type': 'NewsMediaOrganization', name: 'Nicaragua Informate', logo: { '@type': 'ImageObject', url: 'https://nicaraguainformate.com/logo.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}
