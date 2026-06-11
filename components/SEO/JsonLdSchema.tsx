/**
 * JsonLdSchema.tsx — Nicaragua Informate
 * Componente Server para inyección segura de JSON-LD estructurado
 * Pilar 2: SEO Semántico (NewsArticle + BreadcrumbList + Organization)
 *
 * Uso:
 *   import JsonLdSchema from '@/components/SEO/JsonLdSchema';
 *   <JsonLdSchema article={noticia} url={canonicalUrl} readingTime={3} />
 */

import type { Noticia } from '@/lib/types';

// ─── Helpers de sanitización robusta ───

/** Convierte URLs relativas en absolutas para Google Rich Snippets */
function toAbsoluteUrl(url?: string): string {
  const BASE = 'https://nicaraguainformate.com';
  if (!url) return `${BASE}/logo.webp`;
  if (url.startsWith('http')) return url;
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Evita Invalid Date en JSON-LD; siempre retorna ISO string válida */
function safeIsoDate(value?: string | Date): string {
  if (!value) return new Date().toISOString();
  const d = typeof value === 'string' ? new Date(value) : value;
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ─── Interfaces ───

interface JsonLdSchemaProps {
  article: Noticia;
  url: string;
  readingTime?: number;
}

// ─── Componente ───

export default function JsonLdSchema({ article, url, readingTime: _readingTime = 1 }: JsonLdSchemaProps) {
  const BASE = 'https://nicaraguainformate.com';

  // Keywords del artículo
  const keywords = [article.categoria, 'Nicaragua', 'noticias', 'actualidad'];
  if (article.tags && Array.isArray(article.tags)) {
    keywords.push(...article.tags.slice(0, 5));
  }

  // Word-count real y tiempo de lectura (220 ppm = promedio lectura web español)
  function calculateReadingAndWordCount(text: string = '') {
    const words = text.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return { wordCount: words, readingTime: `PT${minutes}M` };
  }
  const { wordCount, readingTime } = calculateReadingAndWordCount(article.contenido);

  const authorName = article.autor || 'Redacción Nicaragua Informate';
  const isKeyling = authorName === 'Keyling Elieth Rivera Muñoz';

  // ─── 1. NewsArticle ───
  const newsArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo,
    description: article.resumen,
    image: [
      {
        '@type': 'ImageObject',
        url: toAbsoluteUrl(article.imagen),
        width: 1200,
        height: 630,
        caption: `Imagen de ${article.categoria}: ${article.titulo} — Nicaragua Informate`,
      },
      {
        '@type': 'ImageObject',
        url: article.imagen
          ? toAbsoluteUrl(article.imagen).replace(/\.[a-z]+$/, '-square.webp')
          : `${BASE}/logo.webp`,
        width: 512,
        height: 512,
        caption: `Logo: ${article.titulo} — Nicaragua Informate`,
      },
    ],
    datePublished: safeIsoDate(article.fecha),
    dateModified: safeIsoDate(article.fechaActualizacion || article.fecha),
    author: {
      '@type': 'Person',
      name: authorName,
      jobTitle: isKeyling ? 'Directora Editorial y Cofundadora' : 'Periodista',
      url: isKeyling ? `${BASE}/autor/keyling-rivera` : `${BASE}/nosotros`,
      worksFor: { '@id': `${BASE}/#organization` },
    },
    editor: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      '@id': `${BASE}/#organization`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE}/logo.webp`,
        width: 512,
        height: 512,
      },
      '@id': `${BASE}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: article.categoria,
    inLanguage: 'es-NI',
    wordCount,
    readingTime,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-headline', '.article-body'],
    },
    keywords: keywords.join(', '),
  };

  // ─── 2. BreadcrumbList ───
  const catSlug = article.categoria
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: BASE,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.categoria,
        item: `${BASE}/categoria/${catSlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.titulo,
        item: url,
      },
    ],
  };

  // ─── 3. Organization (EEAT: enlaces a políticas editoriales visibles) ───
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE}/#organization`,
    name: 'Nicaragua Informate',
    url: BASE,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE}/logo.webp`,
      width: 512,
      height: 512,
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61578261125687',
    ],
    // Políticas editoriales como señal de autoridad y confiabilidad (EEAT)
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Políticas Transparentes',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'WebPage',
            name: 'Política Editorial',
            url: `${BASE}/politica-editorial`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'WebPage',
            name: 'Correcciones',
            url: `${BASE}/correcciones`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'WebPage',
            name: 'Privacidad',
            url: `${BASE}/privacidad`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'WebPage',
            name: 'Términos de Servicio',
            url: `${BASE}/terminos`,
          },
        },
      ],
    },
    knowsAbout: ['Noticias de Nicaragua', 'Periodismo', 'Actualidad Centroamericana'],
  };

  const schemas = [newsArticle, breadcrumbList, organization];

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
