import { getNews } from '@/lib/data';
import { unstable_cache } from 'next/cache';
import { normalizeEditorialTitle } from '@/lib/formateo';
import { isToxicSlug } from '@/lib/seo-toxic';
import { safeDate } from '@/app/sitemap';
import { shouldIndexArticle } from '@/lib/editorial/canonical';
import { logger } from '@/lib/logger';

const SITE_URL = 'https://nicaraguainformate.com';

// Google News Sitemap: solo noticias de las últimas 48 horas
// Requisitos: https://support.google.com/news/publisher-center/answer/74245
export const revalidate = 1800; // Regenerar cada 30 min — noticias frescas

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchNewsSitemapRaw() {
  const cutoffMs = Date.now() - 48 * 60 * 60 * 1000; // 48 horas — Google News sitemap spec
  const articles = await getNews(100);
  return articles
    .filter((a) => {
      const d = safeDate(a.fecha);
      return !isNaN(d.getTime()) && d.getTime() >= cutoffMs && !isToxicSlug(a.slug) && shouldIndexArticle(a);
    })
    .map((a) => ({
      slug: a.slug,
      titulo: a.titulo,
      fecha: a.fecha,
      categoria: a.categoria,
    }));
}

const cachedFetchNewsSitemap = unstable_cache(fetchNewsSitemapRaw, ['news-sitemap'], {
  revalidate: 86400,
  tags: ['news-sitemap'],
});

export async function GET() {
  try {
    const articles = await cachedFetchNewsSitemap();

    // Google News Sitemap XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articles.map((article) => {
  const articleDate = safeDate(article.fecha);
  // ISO 8601 con timezone para Google News
  const publicationDate = !isNaN(articleDate.getTime())
    ? articleDate.toLocaleString('sv-SE', { timeZone: 'America/Managua' }).replace(' ', 'T') + '-06:00'
    : new Date().toISOString();
  const publicationName = 'Nicaragua Informate';
  const publicationLanguage = 'es';
  
  return `  <url>
    <loc>${SITE_URL}/noticias/${encodeURI(article.slug)}</loc>
    <lastmod>${publicationDate}</lastmod>
    <news:news>
      <news:publication>
        <news:name>${publicationName}</news:name>
        <news:language>${publicationLanguage}</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title>${escapeXml(normalizeEditorialTitle(article.titulo))}</news:title>
      <news:access>Public</news:access>
      <news:keywords>${escapeXml(article.categoria)}</news:keywords>
    </news:news>
  </url>`;
}).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    logger.error('[News Sitemap] Error:', error);
    
    // Fallback: sitemap vacío si hay error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;
    
    return new Response(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
