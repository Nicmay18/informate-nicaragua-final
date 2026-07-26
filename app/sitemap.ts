import { MetadataRoute } from 'next';
import { getNews } from '@/lib/data';
import { isToxicSlug } from '@/lib/seo-toxic';
import { getAllAuthors } from '@/lib/authors';
import { getAllEvergreen } from '@/lib/evergreen';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';

export const revalidate = 3600;

const baseUrl = 'https://nicaraguainformate.com';

const cachedGetNews = unstable_cache(
  async () => getNews(500),
  ['sitemap-news'],
  { revalidate: 86400, tags: ['sitemap-news'] }
);

function safeDate(value: unknown): Date {
  if (!value) return new Date();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    try {
      const d = (value as any).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : new Date();
    } catch { return new Date(); }
  }
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
  const staticUrls: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/noticias`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/categoria/sucesos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/nacionales`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/deportes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/internacionales`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/tecnologia`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/espectaculos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/guia`, lastModified: new Date('2026-06-25'), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/nosotros`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contacto`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/publicidad`, lastModified: new Date('2026-05-28'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terminos`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/politica-editorial`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/cookies`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/correcciones`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/mapa-del-sitio`, lastModified: new Date('2026-05-28'), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const authors = getAllAuthors();
  const authorUrls: MetadataRoute.Sitemap = authors.map((author) => ({
    url: `${baseUrl}/autor/${author.slug}`,
    lastModified: new Date('2026-05-24'),
    changeFrequency: 'monthly',
    priority: 0.3,
  }));

  const evergreen = getAllEvergreen();
  const evergreenUrls: MetadataRoute.Sitemap = evergreen.map((article) => ({
    url: `${baseUrl}/guia/${article.slug}`,
    lastModified: safeDate(article.updatedDate),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  try {
    const articles = await cachedGetNews();

    const cleanArticles = articles.filter(article => {
      if (isToxicSlug(article.slug)) return false;
      if (article.noindex === true) return false;
      return true;
    });

    const articleUrls: MetadataRoute.Sitemap = cleanArticles.map((article) => {
      const publishedAt = safeDate(article.fecha);
      const lastMod = safeDate(article.fechaActualizacion || article.fecha);
      const now = new Date();
      const daysSincePublished = Math.floor(
        (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      let priority = 0.5;
      if (daysSincePublished < 3) priority = 0.8;
      else if (daysSincePublished < 7) priority = 0.7;
      else if (daysSincePublished < 30) priority = 0.6;

      const changeFrequency = daysSincePublished < 7 ? 'daily' : 'weekly';

      return {
        url: `${baseUrl}/noticias/${article.slug}`,
        lastModified: lastMod,
        changeFrequency,
        priority,
      };
    });

    return [...staticUrls, ...authorUrls, ...evergreenUrls, ...articleUrls];
  } catch (error) {
    logger.error('[Sitemap] Error fetching articles:', error);
    return [...staticUrls, ...authorUrls, ...evergreenUrls];
  }
}
