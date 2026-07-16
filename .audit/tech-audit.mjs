import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';

const routes = [
  '/', '/noticias', '/categoria/sucesos', '/categoria/nacionales', '/categoria/internacionales',
  '/categoria/tecnologia', '/categoria/economia', '/categoria/deportes', '/categoria/espectaculos',
  '/guia', '/guia/apostillar-documentos-nicaragua-2026', '/autor/keyling-rivera', '/autor/maycol-nicaragua',
  '/autor/jose-lopez', '/busqueda', '/politica-editorial', '/contacto', '/publicidad', '/privacidad',
  '/terminos', '/cookies', '/correcciones', '/nosotros', '/feed.xml', '/sitemap.xml', '/news-sitemap.xml',
  '/ads.txt', '/app-ads.txt', '/robots.txt',
  // not found tests
  '/noticias/xyz-no-existe-abc12345', '/categoria/xyz-no-existe', '/guia/xyz-no-existe', '/autor/xyz-no-existe',
  '/tag/xyz-no-existe',
];

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1] || m[0] : null;
}

function extractAll(html, re) {
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(m[1] || m[0]);
  }
  return out;
}

async function auditRoute(path) {
  const url = BASE + path;
  const res = await fetch(url, { redirect: 'manual' });
  const body = await res.text();
  const report = {
    url,
    status: res.status,
    finalUrl: url,
    contentType: res.headers.get('content-type'),
    contentEncoding: res.headers.get('content-encoding'),
    cacheControl: res.headers.get('cache-control'),
    etag: res.headers.get('etag'),
    poweredBy: res.headers.get('x-powered-by'),
    canonical: extract(body, /<link rel="canonical" href="([^"]+)"/i),
    title: extract(body, /<title>([\s\S]*?)<\/title>/i)?.replace(/\s+/g, ' ').trim().substring(0, 120),
    description: extract(body, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i),
    robotsMeta: extract(body, /<meta[^>]+name="robots"[^>]+content="([^"]+)"/i),
    ogTitle: extract(body, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i),
    ogUrl: extract(body, /<meta[^>]+property="og:url"[^>]+content="([^"]+)"/i),
    twitterTitle: extract(body, /<meta[^>]+name="twitter:title"[^>]+content="([^"]+)"/i),
    jsonLdTypes: extractAll(body, /<script type="application\/ld\+json">[\s\S]*?"@type":\s*"([^"]+)"/gi),
    breadcrumb: extractAll(body, /<nav[^>]*aria-label="Miga de pan"[\s\S]*?<\/nav>/gi).length > 0,
    authorRel: extractAll(body, /<a[^>]+rel="author"/gi).length,
    hasLoadingLazy: /loading\s*=\s*"lazy"/i.test(body),
    hasAdSense: /adsbygoogle|googlesyndication|ca-pub-4115203339551838/i.test(body),
    error: null,
  };
  if (res.status >= 300 && res.status < 400) {
    report.location = res.headers.get('location');
  }
  return report;
}

async function main() {
  const results = [];
  for (const path of routes) {
    try {
      results.push(await auditRoute(path));
    } catch (e) {
      results.push({ url: BASE + path, status: 'ERR', error: e.message });
    }
  }
  writeFileSync(join(__dirname, 'tech-audit.json'), JSON.stringify(results, null, 2));
  console.log('Tech audit saved, routes:', results.length);
}

main();
