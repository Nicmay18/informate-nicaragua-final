import { adminDb } from '@/lib/firebase-admin';
import { unstable_cache } from 'next/cache';

export const revalidate = 86400;

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Strip script/style tags and sanitize for RSS CDATA */
function sanitizeForRss(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFeedArticlesRaw() {
  const snapshot = await adminDb
    .collection('noticias')
    .orderBy('fecha', 'desc')
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const d = doc.data();
    let fecha = '';
    try {
      fecha = d.fecha?.toDate ? d.fecha.toDate().toUTCString() : new Date(d.fecha).toUTCString();
    } catch { fecha = new Date().toUTCString(); }
    const imgRaw = (d.imagen || '') as string;
    const imgUrl = imgRaw.startsWith('http') ? imgRaw : imgRaw ? `https://nicaraguainformate.com${imgRaw}` : '';
    return {
      title: d.titulo as string,
      slug: d.slug as string,
      description: (d.resumen || d.titulo) as string,
      contenido: (d.contenido || '') as string,
      pubDate: fecha,
      category: (d.categoria || 'General') as string,
      imagen: imgUrl,
      autor: (d.autor || 'Redacción Nicaragua Informate') as string,
    };
  });
}

const cachedFetchFeed = unstable_cache(fetchFeedArticlesRaw, ['feed-xml'], {
  revalidate: 86400,
  tags: ['feed-xml'],
});

export async function GET() {
  const baseUrl = 'https://nicaraguainformate.com';

  let articles: Awaited<ReturnType<typeof fetchFeedArticlesRaw>> = [];
  try {
    articles = await cachedFetchFeed();
  } catch {
    /* Returns empty feed if Firebase is unavailable */
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Nicaragua Informate</title>
    <link>${baseUrl}</link>
    <description>Periodismo de Precisión. Noticias de Nicaragua en tiempo real.</description>
    <language>es-ni</language>
    <copyright>Copyright ${new Date().getFullYear()} Nicaragua Informate</copyright>
    <managingEditor>contacto@nicaraguainformate.com (Redacción Nicaragua Informate)</managingEditor>
    <webMaster>contacto@nicaraguainformate.com (Redacción Nicaragua Informate)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/icon-192x192.webp</url>
      <title>Nicaragua Informate</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
      <description>Nicaragua Informate — Noticias de Nicaragua en tiempo real</description>
    </image>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles.map((a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${baseUrl}/noticias/${a.slug}</link>
      <guid isPermaLink="true">${baseUrl}/noticias/${a.slug}</guid>
      <pubDate>${a.pubDate}</pubDate>
      <category><![CDATA[${a.category}]]></category>
      <dc:creator><![CDATA[${a.autor}]]></dc:creator>
      <description><![CDATA[${a.description}]]></description>
      <content:encoded><![CDATA[${sanitizeForRss(a.contenido)}]]></content:encoded>
      ${a.imagen ? `<enclosure url="${escapeXml(a.imagen)}" type="image/webp" length="0"/>
      <media:content url="${escapeXml(a.imagen)}" medium="image"/>` : ''}
    </item>`).join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
