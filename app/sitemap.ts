import { MetadataRoute } from 'next';
import { getNews } from '@/lib/data';
import { shouldIndexArticle } from '@/lib/editorial/canonical';
import { isToxicSlug } from '@/lib/seo-toxic';
import { getAllAuthors } from '@/lib/authors';
import { getAllEvergreen } from '@/lib/evergreen';
import { getAllTemaSlugs } from '@/lib/topics';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';

export const revalidate = 3600;

const baseUrl = 'https://nicaraguainformate.com';

const cachedGetNews = unstable_cache(
  async () => getNews(200),
  ['sitemap-news'],
  { revalidate: 3600, tags: ['sitemap-news'] }
);

const cachedGetEntitySlugs = unstable_cache(
  async () => {
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const db = getAdminDb();
      const snap = await db.collection('kb_entities').select('slug').limit(500).get();
      return snap.docs.map((d) => d.data().slug).filter(Boolean) as string[];
    } catch {
      return [];
    }
  },
  ['sitemap-entities'],
  { revalidate: 3600, tags: ['sitemap-entities'] }
);

export function safeDate(value: unknown): Date {
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
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/noticias`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/categoria/sucesos`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/nacionales`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/deportes`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/internacionales`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/tecnologia`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categoria/espectaculos`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/guia`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/entidad`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/nosotros`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contacto`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/publicidad`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacidad`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terminos`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/politica-editorial`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/cookies`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const authors = getAllAuthors();
  const authorUrls: MetadataRoute.Sitemap = authors.map((author) => ({
    url: `${baseUrl}/autor/${author.slug}`,
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

  const temaSlugs = getAllTemaSlugs();
  const temaUrls: MetadataRoute.Sitemap = temaSlugs.map((slug) => ({
    url: `${baseUrl}/tema/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const entitySlugs = await cachedGetEntitySlugs();
  const entityUrls: MetadataRoute.Sitemap = entitySlugs.map((slug) => ({
    url: `${baseUrl}/entidad/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.4,
  }));

  try {
    const articles = await cachedGetNews();

    const cleanArticles = articles.filter(article => {
      if (isToxicSlug(article.slug)) return false;
      if (!shouldIndexArticle(article)) return false;
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

    return [...staticUrls, ...authorUrls, ...evergreenUrls, ...temaUrls, ...entityUrls, ...articleUrls];
  } catch (error) {
    logger.error('[Sitemap] Error fetching articles:', error);
    return [...staticUrls, ...authorUrls, ...evergreenUrls, ...temaUrls, ...entityUrls];
  }
}
