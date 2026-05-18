import { adminDb } from '@/lib/firebase-admin';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = 'https://nicaraguainformate.com';

  let articles: { title: string; slug: string; description: string; pubDate: string; category: string; imagen?: string }[] = [];
  try {
    const snapshot = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(50)
      .get();

    articles = snapshot.docs.map((doc) => {
      const d = doc.data();
      const fecha = d.fecha?.toDate ? d.fecha.toDate().toUTCString() : new Date(d.fecha).toUTCString();
      return {
        title: d.titulo as string,
        slug: d.slug as string,
        description: (d.resumen || d.titulo) as string,
        pubDate: fecha,
        category: (d.categoria || 'General') as string,
        imagen: (d.imagen || '') as string,
      };
    });
  } catch {
    /* Returns empty feed if Firebase is unavailable */
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Nicaragua Informate</title>
    <link>${baseUrl}</link>
    <description>Periodismo de Precisión. Noticias de Nicaragua en tiempo real.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles.map((a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${baseUrl}/noticias/${a.slug}</link>
      <guid isPermaLink="true">${baseUrl}/noticias/${a.slug}</guid>
      <pubDate>${a.pubDate}</pubDate>
      <category>${a.category}</category>
      <description><![CDATA[${a.description}]]></description>
      ${a.imagen ? `<enclosure url="${a.imagen.startsWith('http') ? a.imagen : baseUrl + a.imagen}" type="image/webp" />` : ''}
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
