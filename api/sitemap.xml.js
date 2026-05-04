export default async function handler(req, res) {
  const BASE = 'https://nicaraguainformate.com';
  const PROJECT = 'informate-instant-nicaragua';
  const today = new Date().toISOString().split('T')[0];

  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/noticias?pageSize=100&orderBy=fecha+desc`
    );
    const data = await r.json();
    const docs = data.documents || [];

    const urls = docs.map(d => {
      const id = d.name.split('/').pop();
      const ts = d.fields?.fecha?.timestampValue;
      const slug = d.fields?.slug?.stringValue;
      const fecha = ts ? new Date(ts).toISOString().split('T')[0] : today;
      return `  <url>
    <loc>${slug ? `${BASE}/noticia/${slug}` : `${BASE}/noticia.html?id=${id}`}</loc>
    <lastmod>${fecha}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE}/nosotros.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE}/contacto.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${BASE}/politica-editorial.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${BASE}/privacidad.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE}/terminos.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE}/cookies.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
${urls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    res.status(200).send(sitemap);

  } catch (e) {
    res.status(500).send('Error generando sitemap: ' + e.message);
  }
};
