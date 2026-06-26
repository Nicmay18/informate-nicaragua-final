/**
 * JSON Feed 1.1 — Nicaragua Informate
 * Optimizado para agregadores: Microsoft Start, Flipboard, NewsBreak, Squid
 * Spec: https://jsonfeed.org/version/1.1
 */

import { adminDb } from '@/lib/firebase-admin';

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

export async function GET() {
  const baseUrl = 'https://nicaraguainformate.com';

  let items: any[] = [];
  try {
    const snapshot = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(50)
      .get();

    items = snapshot.docs.map((doc) => {
        const d = doc.data();
        let dateIso = '';
        try {
          dateIso = d.fecha?.toDate ? d.fecha.toDate().toISOString() : new Date(d.fecha).toISOString();
        } catch { dateIso = new Date().toISOString(); }

        const imgUrl = toAbsoluteUrl(d.imagen as string);

        return {
          id: d.slug as string,
          url: `${baseUrl}/noticias/${d.slug}`,
          title: d.titulo as string,
          content_text: stripHtml(d.contenido || d.resumen || ''),
          content_html: d.contenido || '',
          summary: d.resumen || '',
          image: imgUrl,
          date_published: dateIso,
          date_modified: dateIso,
          authors: [{ name: d.autor || 'Redacción Nicaragua Informate' }],
          tags: [d.categoria || 'General'],
          language: 'es-NI',
        };
      });
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
