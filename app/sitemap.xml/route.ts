import { adminDb } from '@/lib/firebase-admin';

export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(d: Date) {
  return d.toISOString();
}

export async function GET() {
  const baseUrl = 'https://nicaraguainformate.com';

  const now = new Date();

  const categories = ['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'];
  const staticUrls = [
    { loc: `${baseUrl}/`, priority: 1.0, changefreq: 'daily' },
    { loc: `${baseUrl}/noticias`, priority: 0.9, changefreq: 'daily' },
    { loc: `${baseUrl}/nosotros`, priority: 0.6, changefreq: 'monthly' },
    { loc: `${baseUrl}/contacto`, priority: 0.6, changefreq: 'monthly' },
    { loc: `${baseUrl}/politica-editorial`, priority: 0.5, changefreq: 'monthly' },
    { loc: `${baseUrl}/cookies`, priority: 0.4, changefreq: 'yearly' },
    { loc: `${baseUrl}/privacidad`, priority: 0.3, changefreq: 'yearly' },
    { loc: `${baseUrl}/terminos`, priority: 0.3, changefreq: 'yearly' },
    { loc: `${baseUrl}/correcciones`, priority: 0.4, changefreq: 'monthly' },
    ...categories.map(cat => ({
      loc: `${baseUrl}/noticias?cat=${encodeURIComponent(cat)}`,
      priority: 0.8,
      changefreq: 'daily',
    })),
  ];

  type ArticleDoc = {
    slug?: string;
    fecha?: any;
    fechaActualizacion?: any;
    destacada?: boolean;
    vistas?: number;
  };

  let articleUrls: { loc: string; lastmod: Date; priority: number; changefreq: string }[] = [];

  try {
    const snapshot = await adminDb
      .collection('noticias')
      .select('slug', 'fecha', 'fechaActualizacion', 'destacada', 'vistas')
      .orderBy('fecha', 'desc')
      .limit(1000)
      .get();

    articleUrls = snapshot.docs
      .map((doc) => doc.data() as ArticleDoc)
      .filter((d) => Boolean(d.slug))
      .map((d) => {
        const date: Date = d.fechaActualizacion?.toDate
          ? d.fechaActualizacion.toDate()
          : d.fecha?.toDate
            ? d.fecha.toDate()
            : d.fecha
              ? new Date(d.fecha)
              : now;

        const vistas = typeof d.vistas === 'number' ? d.vistas : 0;

        // Priorización simple y estable:
        // - destacada => 0.9
        // - con muchas vistas => 0.85
        // - normal => 0.8
        // - muy vieja ( > 180 días ) => 0.6
        const ageDays = Math.max(0, (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        let priority = 0.8;
        if (d.destacada) priority = 0.9;
        else if (vistas >= 5000) priority = 0.85;
        else if (ageDays > 180) priority = 0.6;

        return {
          loc: `${baseUrl}/noticias/${d.slug}`,
          lastmod: date,
          priority,
          changefreq: 'weekly',
        };
      });
  } catch {
    // If Firebase is unavailable, return only static URLs.
  }

  const urlsXml = [
    ...staticUrls.map((u) => {
      return `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${toIsoDate(now)}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`;
    }),
    ...articleUrls.map((u) => {
      const pubDate = toIsoDate(u.lastmod).split('T')[0];
      return `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${toIsoDate(u.lastmod)}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(2)}</priority>\n    <news:news>\n      <news:publication>\n        <news:name>Nicaragua Informate</news:name>\n        <news:language>es</news:language>\n      </news:publication>\n      <news:publication_date>${pubDate}</news:publication_date>\n      <news:title>${escapeXml(u.loc.split('/').pop()?.replace(/-/g, ' ') || 'Noticia')}</news:title>\n    </news:news>\n  </url>`;
    }),
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urlsXml}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
