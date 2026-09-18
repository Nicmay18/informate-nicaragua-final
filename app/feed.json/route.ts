/**
 * JSON Feed 1.1 — Nicaragua Informate
 * Optimizado para agregadores: Microsoft Start, Flipboard, NewsBreak, Squid
 * Spec: https://jsonfeed.org/version/1.1
 */

import { unstable_cache } from 'next/cache';
import { fetchFeedArticles } from '@/lib/feed-articles';

export const revalidate = 86400;

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toAbsoluteUrl(url?: string): string {
  if (!url) return 'https://nicaraguainformate.com/logo.webp';
  if (url.startsWith('http')) return url;
  return `https://nicaraguainformate.com${url.startsWith('/') ? '' : '/'}${url}`;
}

const cachedFetchFeedJson = unstable_cache(
  async () => {
    const articles = await fetchFeedArticles(50);
    return articles.map((a) => {
      const dateIso = new Date(a.pubDate).toISOString();
      const imgUrl = toAbsoluteUrl(a.imagen);
      return {
        id: a.slug,
        url: `https://nicaraguainformate.com/noticias/${a.slug}`,
        title: a.title,
        content_text: stripHtml(a.contenido || a.description || ''),
        content_html: a.contenido || '',
        summary: a.description || '',
        image: imgUrl,
        date_published: dateIso,
        date_modified: dateIso,
        authors: [{ name: a.autor }],
        tags: [a.category],
        language: 'es-NI',
      };
    });
  },
  ['feed-json'],
  { revalidate: 86400 }
);

export async function GET() {
  const baseUrl = 'https://nicaraguainformate.com';

  let items: any[] = [];
  try {
    items = await cachedFetchFeedJson();
  } catch {
    /* empty feed if Firebase unavailable */
  }

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Nicaragua Informate',
    home_page_url: baseUrl,
    feed_url: `${baseUrl}/feed.json`,
    description: 'Noticias de Nicaragua en tiempo real. Periodismo verificado desde Managua.',
    icon: `${baseUrl}/icon-192x192.webp`,
    favicon: `${baseUrl}/favicon.ico`,
    language: 'es-NI',
    authors: [{ name: 'Nicaragua Informate', url: `${baseUrl}/nosotros` }],
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
