import type { WithContext, Article, NewsMediaOrganization } from 'schema-dts';

/**
 * Constantes de configuración para JSON-LD
 */
const SITE_URL = 'https://nicaraguainformate.com';
const SITE_LOGO = `${SITE_URL}/logo.png`;
const SITE_NAME = 'Nicaragua Informate';
const DEFAULT_AUTHOR = 'Keyling Rivera M.';
const DEFAULT_CATEGORY = 'General';
const FOUNDING_DATE = '2025-01-01';
const CONTACT_EMAIL = 'redaccion@nicaraguainformate.com';

/**
 * Datos de un artículo para generar JSON-LD
 */
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

/**
 * Convierte un valor de fecha a ISO string de forma segura
 * @param value Valor de fecha
 * @returns ISO string
 */
function toISOString(value: ArticleData['fecha']): string {
  if (!value) return new Date().toISOString();
  
  try {
    if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }
    
    const date = new Date(value as string | number);
    if (isNaN(date.getTime())) {
      console.warn('[toISOString] Invalid date, using current time');
      return new Date().toISOString();
    }
    
    return date.toISOString();
  } catch (error) {
    console.error('[toISOString]', error instanceof Error ? error.message : String(error));
    return new Date().toISOString();
  }
}

/**
 * Calcula el conteo de palabras de un texto
 * @param text Texto a contar
 * @returns Número de palabras
 */
function calculateWordCount(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Construye el JSON-LD para un artículo de noticias
 * @param article Datos del artículo
 * @param url URL del artículo
 * @returns JSON-LD del artículo
 */
export function buildNewsArticleJsonLd(article: ArticleData, url: string): WithContext<Article> {
  if (!article.titulo) {
    throw new Error('Article title is required');
  }

  const fechaISO = toISOString(article.fecha);
  const fechaModISO = article.fechaActualizacion
    ? toISOString(article.fechaActualizacion)
    : fechaISO;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo,
    description: article.resumen || article.titulo,
    image: article.imagen || SITE_LOGO,
    datePublished: fechaISO,
    dateModified: fechaModISO,
    author: {
      '@type': 'Person',
      name: article.autor || DEFAULT_AUTHOR,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: SITE_LOGO,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: article.categoria || DEFAULT_CATEGORY,
    wordCount: calculateWordCount(article.contenido || ''),
  };
}

/**
 * Construye el JSON-LD para la organización
 * @returns JSON-LD de la organización
 */
export function buildOrganizationJsonLd(): WithContext<NewsMediaOrganization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    alternateName: 'NicaraguaInformate.com',
    url: SITE_URL,
    logo: SITE_LOGO,
    foundingDate: FOUNDING_DATE,
    description: 'Medio digital de noticias de Nicaragua. Periodismo de precisión con cobertura en sucesos, nacionales, deportes, internacionales y espectáculos.',
    sameAs: [
      'https://facebook.com/profile.php?id=61578261125687',
      'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
      'https://t.me/+fHHjncJqMQM3NjZh',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Estelí',
      addressRegion: 'Estelí',
      addressCountry: 'NI',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Editorial',
      email: CONTACT_EMAIL,
      availableLanguage: 'es',
    },
    publishingPrinciples: `${SITE_URL}/politica-editorial`,
  };
}

/**
 * Construye el JSON-LD para el sitio web
 * @returns JSON-Ld del sitio web
 */
export function buildWebSiteJsonLd(): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/noticias?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
