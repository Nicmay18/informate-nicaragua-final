import { getSitemapNews } from '@/lib/data';
import { normalizeEditorialTitle } from '@/lib/formateo';
import { parseFechaReal } from '@/app/sitemap';
import { logger } from '@/lib/logger';
import { isRenderableArticle, shouldIndexArticle } from '@/lib/editorial/canonical';
import { isToxicSlug } from '@/lib/seo-toxic';

const SITE_URL = 'https://nicaraguainformate.com';

// Google News Sitemap: solo noticias de las últimas 48 horas
// Requisitos: https://support.google.com/news/publisher-center/answer/74245
export const dynamic = 'force-dynamic';

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchNewsSitemapRaw() {
  const now = Date.now();
  const cutoffMs = now - 48 * 60 * 60 * 1000;
  const articles = await getSitemapNews();
  return articles
    .filter((a) => {
      const d = parseFechaReal(a.fecha);
      return isRenderableArticle(a) && shouldIndexArticle(a) && !isToxicSlug(a.slug)
        && d !== null && d.getTime() >= cutoffMs && d.getTime() <= now;
    })
    .map((a) => ({
      slug: a.slug,
      titulo: a.titulo,
      fecha: a.fecha,
      categoria: a.categoria,
    }));
}

export async function GET() {
  try {
    // La capa de datos conserva su caché. Evaluar la ventana de 48h en cada
    // petición evita mantener artículos vencidos en una segunda caché.
    const articles = await fetchNewsSitemapRaw();

    // Google News Sitemap XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articles.map((article) => {
  const articleDate = parseFechaReal(article.fecha);
  // ISO 8601 con timezone para Google News
  // fecha ya validada en el filtro — sin isNaN ni fabricar now()
  if (!articleDate) return '';
  const publicationDate = articleDate.toLocaleString('sv-SE', { timeZone: 'America/Managua' }).replace(' ', 'T') + '-06:00';
  const publicationName = 'Nicaragua Informate';
  const publicationLanguage = 'es';
  
  return `  <url>
    <loc>${SITE_URL}/noticias/${escapeXml(encodeURIComponent(article.slug))}</loc>
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
        'Cache-Control': 'public, max-age=0, s-maxage=1800',
        'CDN-Cache-Control': 'public, s-maxage=1800',
      },
    });
  } catch {
    logger.error('[News Sitemap] Data unavailable');

    // Un fallo de datos NO es "cero noticias": devolver un urlset vacío con
    // 200 le decía a Google "no hay nada nuevo" y ocultaba el incidente.
    // 503 + Retry-After es la señal correcta: error transitorio, reintentar.
    // Además cualquier monitor externo (uptime check sobre esta URL) alerta.
    return new Response('News sitemap temporarily unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store',
        'Retry-After': '300',
      },
    });
  }
}
