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

export function buildNewsArticleJsonLd(article: any, url: string) {
  const keywords = [article.categoria, 'Nicaragua', 'noticias', 'actualidad'];
  if (article.tags && Array.isArray(article.tags)) {
    keywords.push(...article.tags.slice(0, 5));
  }

  const base: any = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo,
    description: article.resumen,
    image: article.imagen,
    datePublished: article.fecha,
    dateModified: article.fechaActualizacion || article.fecha,
    author: {
      '@type': 'Person',
      name: article.autor || 'Juan Pérez',
      jobTitle: 'Periodista',
      url: 'https://nicaraguainformate.com/nosotros',
      worksFor: { '@id': 'https://nicaraguainformate.com/#organization' },
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-headline', '.article-body'],
    },
    publisher: {
      '@id': 'https://nicaraguainformate.com/#organization',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'es-NI',
    articleSection: article.categoria,
    keywords: keywords.join(', '),
  };

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
      item: `https://nicaraguainformate.com/noticias/${encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'))}`,
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
