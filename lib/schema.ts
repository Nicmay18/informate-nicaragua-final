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
  const base = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo,
    description: article.resumen,
    image: article.imagen,
    datePublished: article.fecha,
    author: { '@type': 'Person', name: article.autor || 'Keyling Rivera M.' },
    publisher: { '@type': 'NewsMediaOrganization', name: 'Nicaragua Informate', logo: { '@type': 'ImageObject', url: 'https://nicaraguainformate.com/logo.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  if (article.fechaActualizacion) {
    (base as any).dateModified = article.fechaActualizacion;
  }

  return base;
}

export function buildBreadcrumbJsonLd(category?: string) {
  const breadcrumbItems = [
    { name: 'Inicio', item: 'https://nicaraguainformate.com' },
    { name: 'Noticias', item: 'https://nicaraguainformate.com/noticias' },
  ];

  if (category && category !== 'General') {
    breadcrumbItems.push({
      name: category,
      item: `https://nicaraguainformate.com/noticias?cat=${encodeURIComponent(category)}`,
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
