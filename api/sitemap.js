export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const BASE = 'https://nicaraguainformate.com';
  const now = new Date().toISOString();

  // Páginas estáticas
  const paginas = [
    { loc: BASE, priority: '1.0', changefreq: 'hourly' },
    { loc: `${BASE}/nosotros.html`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${BASE}/contacto.html`, priority: '0.4', changefreq: 'monthly' },
    { loc: `${BASE}/politica-editorial.html`, priority: '0.4', changefreq: 'monthly' },
    { loc: `${BASE}/privacidad.html`, priority: '0.3', changefreq: 'monthly' },
    { loc: `${BASE}/terminos.html`, priority: '0.3', changefreq: 'monthly' },
    { loc: `${BASE}/cookies.html`, priority: '0.3', changefreq: 'monthly' },
  ];

  let noticiaUrls = [];

  try {
    // Obtener noticias de Firestore via REST API
    const PROJECT = 'informate-instant-nicaragua';
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/noticias?pageSize=100`;
    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();
      const docs = data.documents || [];
      noticiaUrls = docs.map(doc => {
        const id = doc.name.split('/').pop();
        const slug = doc.fields?.slug?.stringValue;
        const ts = doc.fields?.fecha?.timestampValue || doc.fields?.fecha?.stringValue;
        const lastmod = ts ? new Date(ts).toISOString() : now;
        return {
          loc: slug ? `${BASE}/noticia/${slug}` : `${BASE}/noticia.html?id=${id}`,
          lastmod,
          priority: '0.8',
          changefreq: 'weekly'
        };
      });
    }
  } catch(e) {}

  const allUrls = [...paginas, ...noticiaUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || now}</lastmod>
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.5'}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.status(200).send(xml);
}
