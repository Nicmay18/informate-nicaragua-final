import { MetadataRoute } from 'next';
import { getNews } from '@/lib/data';
import { isToxicSlug } from '@/lib/seo-toxic';
import { getAllAuthors } from '@/lib/authors';
import { getAllEvergreen } from '@/lib/evergreen';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';

const baseUrl = 'https://nicaraguainformate.com';

const cachedGetNews = unstable_cache(
  async () => getNews(500),
  ['sitemap-news'],
  { revalidate: 86400 }
);

// Sanitiza fechas para evitar RangeError: Invalid time value en build
// Maneja strings, Date nativos, Firestore Timestamp objects y raw {_seconds,_nanoseconds}
function safeDate(value: unknown): Date {
  if (!value) return new Date();
  // Firestore Timestamp instance (admin SDK) — tiene toDate()
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    try {
      const d = (value as any).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : new Date();
    } catch { return new Date(); }
  }
  // Raw Firestore Timestamp object {_seconds, _nanoseconds}
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    try {
      const sec = Number((value as any)._seconds);
      const ns = Number((value as any)._nanoseconds || 0);
      const d = new Date(sec * 1000 + ns / 1_000_000);
      return !isNaN(d.getTime()) ? d : new Date();
    } catch { return new Date(); }
  }
  const d = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // URLs estáticas del sitio
  const staticUrls: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Listado general de noticias
    {
      url: `${baseUrl}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // CATEGORÍAS (rutas limpias /categoria/[slug])
    {
      url: `${baseUrl}/categoria/sucesos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/nacionales`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/deportes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/internacionales`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/tecnologia`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/espectaculos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Listado de categorías
    {
      url: `${baseUrl}/categoria`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Guías evergreen (listado)
    {
      url: `${baseUrl}/guia`,
      lastModified: new Date('2026-06-25'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Páginas legales y de información
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/publicidad`,
      lastModified: new Date('2026-05-28'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/politica-editorial`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/correcciones`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/mapa-del-sitio`,
      lastModified: new Date('2026-05-28'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // URLs de autores
  const authors = getAllAuthors();
  const authorUrls: MetadataRoute.Sitemap = authors.map((author) => ({
    url: `${baseUrl}/autor/${author.slug}`,
    lastModified: new Date('2026-05-24'),
    changeFrequency: 'monthly',
    priority: 0.3,
  }));

  // URLs de evergreen (guías)
  const evergreen = getAllEvergreen();
  const evergreenUrls: MetadataRoute.Sitemap = evergreen.map((article) => ({
    url: `${baseUrl}/guia/${article.slug}`,
    lastModified: safeDate(article.updatedDate),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // ARTÍCULOS DINÁMICOS desde Firebase
  try {
    const articles = await cachedGetNews(); // Cacheado: revalida cada 1h

    // Excluir artículos con slugs tóxicos, noindex, o thin content (<150 palabras)
    const cleanArticles = articles.filter(article => {
      if (isToxicSlug(article.slug)) return false;
      if (article.noindex === true) return false;
      // Thin content: contar palabras del contenido si no tiene campo palabras
      const wordCount = article.palabras ?? (article.contenido ? article.contenido.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length : 0);
      if (wordCount < 150) return false; // No indexar thin content
      return true;
    });

    const articleUrls: MetadataRoute.Sitemap = cleanArticles.map((article) => {
      const publishedAt = safeDate(article.fecha);
      const now = new Date();
      const daysSincePublished = Math.floor(
        (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Priority basada en antigüedad REAL
      let priority = 0.5;
      if (daysSincePublished < 3) priority = 0.8;
      else if (daysSincePublished < 7) priority = 0.7;
      else if (daysSincePublished < 30) priority = 0.6;

      // changeFrequency basada en antigüedad
      const changeFrequency = daysSincePublished < 7 ? 'daily' : 'weekly';

      return {
        url: `${baseUrl}/noticias/${article.slug}`,
        lastModified: publishedAt,
        changeFrequency,
        priority,
      };
    });

    return [...staticUrls, ...authorUrls, ...evergreenUrls, ...articleUrls];
  } catch (error) {
    logger.error('[Sitemap] Error fetching articles:', error);
    // Fallback: URLs estáticas + autores + evergreen si Firebase falla
    return [...staticUrls, ...authorUrls, ...evergreenUrls];
  }
}
