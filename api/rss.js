export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  try {
    const PROJECT = 'informate-instant-nicaragua';
    // No orderBy to avoid index requirement; fetch latest 20 docs
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/noticias?pageSize=20`;

    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Firestore ${r.status}: ${text.substring(0, 200)}`);
    }
    const data = await r.json();

    const BASE = 'https://nicaraguainformate.com';
    const docs = data.documents || [];

    // Sort by fecha descending in memory
    docs.sort((a, b) => {
      const ta = a.fields?.fecha?.timestampValue || a.fields?.fecha?.stringValue || '';
      const tb = b.fields?.fecha?.timestampValue || b.fields?.fecha?.stringValue || '';
      return new Date(tb) - new Date(ta);
    });

    const items = docs.map(doc => {
      const f = doc.fields || {};
      const id = doc.name.split('/').pop();
      const slug = f.slug?.stringValue;
      const titulo = esc(f.titulo?.stringValue || 'Sin título');
      const resumen = esc((f.resumen?.stringValue || f.contenido?.stringValue || '').substring(0, 300));
      const categoria = esc(f.categoria?.stringValue || 'General');
      const imagen = f.imagen?.stringValue || '';
      const ts = f.fecha?.timestampValue || f.fecha?.stringValue;
      const fecha = ts ? new Date(ts) : new Date();
      const link = slug ? `${BASE}/noticia/${slug}` : `${BASE}/noticia.html?id=${id}`;
      const img = imagen && !imagen.startsWith('data:') && !imagen.includes('fbcdn')
        ? `<enclosure url="${esc(imagen)}" type="image/jpeg"/>`
        : '';

      return `    <item>
      <title>${titulo}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${resumen}</description>
      <category>${categoria}</category>
      <pubDate>${fecha.toUTCString()}</pubDate>
      ${img}
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nicaragua Informate</title>
    <link>${BASE}</link>
    <description>Noticias de Nicaragua al instante</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/api/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    res.status(200).send(xml);

  } catch (e) {
    // Return valid RSS even on error so IFTTT doesn't get a non-XML response
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Nicaragua Informate</title>
    <link>https://nicaraguainformate.com</link>
    <description>Error: ${esc(e.message)}</description>
  </channel>
</rss>`);
  }
};

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
