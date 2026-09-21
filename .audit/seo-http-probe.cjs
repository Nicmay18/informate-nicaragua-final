/**
 * READ-ONLY HTTP probe: verifica meta robots, canonical, X-Robots-Tag y status
 * en URLs reales de producción. No modifica nada.
 */
const fs = require('fs');

const UA = 'Mozilla/5.0 (compatible; SEOAudit/1.0)';

async function check(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual' });
    const out = { url, http: r.status };
    out.location = r.headers.get('location');
    out.xRobotsTag = r.headers.get('x-robots-tag');
    if (r.status === 200) {
      const h = await r.text();
      out.metaRobots = (h.match(/<meta name="robots" content="([^"]+)"/) || [])[1] || null;
      out.googlebot = (h.match(/<meta name="googlebot" content="([^"]+)"/) || [])[1] || null;
      out.canonical = (h.match(/rel="canonical" href="([^"]+)"/) || [])[1] || null;
      out.title = (h.match(/<title[^>]*>([^<]+)<\/title>/) || [])[1] || null;
      out.bytes = h.length;
    }
    return out;
  } catch (e) {
    return { url, error: String(e.message || e) };
  }
}

async function main() {
  const urls = fs.readFileSync('.audit/prod-sitemap-urls.txt', 'utf8').split(/\r?\n/).filter(Boolean);
  const noticias = urls.filter(u => u.includes('/noticias/'));

  const samples = [
    noticias[0], noticias[1], noticias[Math.floor(noticias.length / 2)],
    noticias[noticias.length - 2], noticias[noticias.length - 1],
    'https://nicaraguainformate.com/',
    'https://nicaraguainformate.com/noticias',
    'https://nicaraguainformate.com/noticias?page=2',
    'https://nicaraguainformate.com/buscar?q=test',
    'https://nicaraguainformate.com/noticias/slug-inexistente-xyz-999',
    'https://nicaraguainformate.com/panel',
    'https://nicaraguainformate.com/panel.html',
    'https://nicaraguainformate.com/admin',
    'https://nicaraguainformate.com/api/admin/estado',
    'https://nicaraguainformate.com/categoria/deportes',
    'https://nicaraguainformate.com/noticias/tragedia-en-ee-uu-joven-de-rio-san-juan-muere-en-accidente',
  ].filter(Boolean);

  const results = [];
  for (const u of samples) results.push(await check(u));

  // Muestra amplia de noticias para detectar noindex/errores en masa
  const step = Math.max(1, Math.floor(noticias.length / 40));
  const broad = [];
  for (let i = 0; i < noticias.length; i += step) broad.push(await check(noticias[i]));

  const resumen = {
    muestraNoticias: broad.length,
    porHttp: {},
    conNoindexMeta: broad.filter(b => b.metaRobots && /noindex/.test(b.metaRobots)).length,
    conXRobotsNoindex: broad.filter(b => b.xRobotsTag && /noindex/.test(b.xRobotsTag)).length,
    sinCanonical: broad.filter(b => b.http === 200 && !b.canonical).length,
    canonicalDistinto: broad.filter(b => b.http === 200 && b.canonical && b.canonical !== b.url).length,
  };
  for (const b of broad) resumen.porHttp[b.http || 'err'] = (resumen.porHttp[b.http || 'err'] || 0) + 1;

  const report = { samples: results, broad, resumen };
  fs.writeFileSync('.audit/seo-http-probe.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(resumen, null, 2));
  console.log('\n--- samples ---');
  for (const s of results) console.log(JSON.stringify(s));
  const bad = broad.filter(b => b.http !== 200 || (b.metaRobots || '').includes('noindex') || (b.xRobotsTag || '').includes('noindex'));
  console.log('\n--- noticias con problema (' + bad.length + ') ---');
  for (const b of bad) console.log(JSON.stringify({ url: b.url, http: b.http, meta: b.metaRobots, xrt: b.xRobotsTag, canon: b.canonical }));
}

main().catch(e => { console.error(e); process.exit(1); });
