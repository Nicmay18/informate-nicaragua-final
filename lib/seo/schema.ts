/**
 * Enhanced JSON-LD Schema for SEO — Nicaragua Informate
 * Extends base schema.ts with complete NewsArticle, VideoObject, Speakable, and Organization
 */

import type { Noticia } from '../types';

export function buildNewsArticleJsonLdEnhanced(
  article: Noticia,
  url: string,
  readingTime = 1
): Record<string, unknown> {
  const keywords = [article.categoria, 'Nicaragua', 'noticias', 'actualidad'];
  if (article.tags && Array.isArray(article.tags)) {
    keywords.push(...article.tags.slice(0, 5));
  }

  const wordCount = article.contenido
    ? article.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter((w: string) => w.length > 0).length
    : 0;

  const authorName = article.autor || 'Redacción Nicaragua Informate';
  const isKeyling = authorName === 'Keyling Elieth Rivera Muñoz';

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo,
    description: article.resumen,
    image: [
      {
        '@type': 'ImageObject',
        url: article.imagen || 'https://nicaraguainformate.com/logo-ni.png',
        width: 1200,
        height: 630,
        caption: `Imagen de ${article.categoria}: ${article.titulo} — Nicaragua Informate`,
      },
      {
        '@type': 'ImageObject',
        url: article.imagen ? article.imagen.replace(/\.[a-z]+$/, '-square.webp') : 'https://nicaraguainformate.com/icon-512x512.png',
        width: 512,
        height: 512,
        caption: `Logo: ${article.titulo} — Nicaragua Informate`,
      },
    ],
    datePublished: article.fecha,
    dateModified: article.fechaActualizacion || article.fecha,
    author: {
      '@type': 'Person',
      name: authorName,
      jobTitle: isKeyling ? 'Directora Editorial y Cofundadora' : 'Periodista',
      url: isKeyling
        ? 'https://nicaraguainformate.com/autor/keyling-rivera'
        : 'https://nicaraguainformate.com/nosotros',
      worksFor: { '@id': 'https://nicaraguainformate.com/#organization' },
    },
    editor: {
      '@type': 'Person',
      name: 'Keyling Elieth Rivera Muñoz',
      jobTitle: 'Directora Editorial',
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-headline', '.article-body'],
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://nicaraguainformate.com/#website',
      name: 'Nicaragua Informate',
      publisher: {
        '@type': 'Organization',
        '@id': 'https://nicaraguainformate.com/#organization',
      },
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://nicaraguainformate.com/#organization',
      name: 'Nicaragua Informate',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nicaraguainformate.com/logo-ni.png',
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    inLanguage: 'es-NI',
    articleSection: article.categoria,
    keywords: keywords.join(', '),
    wordCount,
    timeRequired: `PT${readingTime}M`,
    isAccessibleForFree: true,
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
    },
  };
}

/**
 * Build Organization schema with complete info
 */
export function buildOrganizationJsonLdEnhanced(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': 'https://nicaraguainformate.com/#organization',
    name: 'Nicaragua Informate',
    alternateName: ['NicInformate', 'nicaraguainformate.com'],
    description: 'Medio digital nicaragüense de noticias verificadas fundado en 2024. Cobertura de actualidad nacional e internacional desde Managua.',
    url: 'https://nicaraguainformate.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://nicaraguainformate.com/logo-ni.png',
      width: 512,
      height: 512,
    },
    image: {
      '@type': 'ImageObject',
      url: 'https://nicaraguainformate.com/logo-ni.png',
      width: 1200,
      height: 630,
    },
    foundingDate: '2024',
    foundingLocation: {
      '@type': 'Place',
      name: 'Managua, Nicaragua',
    },
    founder: [
      {
        '@type': 'Person',
        name: 'Maycol Josué Nicaragua Rivas',
        jobTitle: 'Director Técnico y Cofundador',
        url: 'https://nicaraguainformate.com/nosotros',
      },
      {
        '@type': 'Person',
        name: 'José Luis López Ramírez',
        jobTitle: 'Director de Operaciones y Cofundador',
        url: 'https://nicaraguainformate.com/nosotros',
      },
      {
        '@type': 'Person',
        name: 'Keyling Elieth Rivera Muñoz',
        jobTitle: 'Directora Editorial y Cofundadora',
        url: 'https://nicaraguainformate.com/autor/keyling-rivera',
      },
    ],
    employee: [
      {
        '@type': 'Person',
        name: 'Keyling Elieth Rivera Muñoz',
        jobTitle: 'Directora Editorial',
        url: 'https://nicaraguainformate.com/autor/keyling-rivera',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'editorial',
      email: 'contacto@nicaraguainformate.com',
      url: 'https://nicaraguainformate.com/contacto',
      availableLanguage: 'Spanish',
    },
    sameAs: [
      'https://facebook.com/profile.php?id=61578261125687',
      'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
      'https://t.me/+fHHjncJqMQM3NjZh',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Managua, Medicina Legal, 3 cuadras al oeste, 1 c al lago',
      addressLocality: 'Managua',
      addressRegion: 'Managua',
      postalCode: '11001',
      addressCountry: 'NI',
    },
    areaServed: { '@type': 'Country', name: 'Nicaragua' },
    inLanguage: 'es-NI',
    knowsAbout: ['Noticias Nicaragua', 'Actualidad Nacional', 'Sucesos', 'Deportes Nicaragua', 'Tecnología'],
    ethicsPolicy: 'https://nicaraguainformate.com/politica-editorial',
    masthead: 'https://nicaraguainformate.com/nosotros',
    correctionsPolicy: 'https://nicaraguainformate.com/correcciones',
    actionableFeedbackPolicy: 'https://nicaraguainformate.com/contacto',
    ownershipFundingInfo: 'https://nicaraguainformate.com/nosotros',
    verificationFactCheckingPolicy: 'https://nicaraguainformate.com/politica-editorial',
    privacyPolicy: 'https://nicaraguainformate.com/privacidad',
  };
}

/**
 * Build WebSite schema with SearchAction (Sitelinks Searchbox)
 */
export function buildWebSiteJsonLdEnhanced(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nicaragua Informate',
    url: 'https://nicaraguainformate.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://nicaraguainformate.com/buscar?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Build BreadcrumbList schema
 */
export function buildBreadcrumbJsonLdEnhanced(
  category?: string,
  slug?: string,
  articleTitle?: string
): Record<string, unknown> {
  const baseUrl = 'https://nicaraguainformate.com';
  const items: { name: string; item: string }[] = [
    { name: 'Inicio', item: baseUrl },
    { name: 'Noticias', item: `${baseUrl}/noticias` },
  ];

  if (category && category !== 'Actualidad') {
    const catSlug = category
      .toLowerCase()
      .replace(/ó/g, 'o')
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ú/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]/g, '');
    items.push({
      name: category,
      item: `${baseUrl}/categoria/${catSlug}`,
    });
  }

  if (slug && articleTitle) {
    items.push({
      name: articleTitle,
      item: `${baseUrl}/noticias/${slug}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: {
        '@type': 'WebPage',
        '@id': item.item,
        name: item.name,
        url: item.item,
      },
    })),
  };
}
