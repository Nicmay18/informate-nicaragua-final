import { getNews } from '@/lib/data';
import { unstable_cache } from 'next/cache';

const SITE_URL = 'https://nicaraguainformate.com';

// Google News Sitemap: solo noticias de las últimas 48 horas
// Requisitos: https://support.google.com/news/publisher-center/answer/74245
export const revalidate = 3600; // Regenerar cada hora

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchNewsSitemapRaw() {
  const cutoffMs = Date.now() - 48 * 60 * 60 * 1000;
  const articles = await getNews(100);
  return articles
    .filter((a) => {
      const d = new Date(a.fecha);
      return !isNaN(d.getTime()) && d.getTime() >= cutoffMs;
    })
    .map((a) => ({
      slug: a.slug,
      titulo: a.titulo,
      fecha: a.fecha,
      categoria: a.categoria,
    }));
}

const cachedFetchNewsSitemap = unstable_cache(fetchNewsSitemapRaw, ['news-sitemap'], {
  revalidate: 3600,
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
  const d = new Date(article.fecha as string);
  const publicationDate = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  const publicationName = 'Nicaragua Informate';
  const publicationLanguage = 'es';
  
  return `  <url>
    <loc>${SITE_URL}/noticias/${encodeURI(article.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${publicationName}</news:name>
        <news:language>${publicationLanguage}</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title>${escapeXml(article.titulo)}</news:title>
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
    console.error('[News Sitemap] Error:', error);
    
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
