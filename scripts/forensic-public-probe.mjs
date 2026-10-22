// Read-only HTTP audit: no browser JavaScript, mutations or analytics events.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const base = 'https://nicaraguainformate.com';
const corpus = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const output = 'reports/forensic-production.json';
const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)=["']([^"']*)["']/g)].map(m => [m[1].toLowerCase(), m[2]]));
const sitemapResponse = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(30000) });
const sitemap = await sitemapResponse.text();
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
const paths = new Set([
  '/', '/robots.txt', '/sitemap.xml', '/news-sitemap.xml', '/publicidad', '/panel.html',
  '/panel', '/login', '/api/telemetry/ads', '/api/admin/auspiciadores', '/api/admin/comercial',
  '/categoria/sucesos?page=2', '/categoria/sucesos?page=9999', '/entidad?page=9999',
  '/entidad?page=abc', '/noticias?page=9999', '/guia', '/autores',
  ...corpus.filter(d => d.estado === 'publicado').map(d => `/noticias/${d.slug}`),
  ...sitemapUrls.filter(u => u.startsWith(base)).map(u => u.slice(base.length)),
]);
const records = [];
const pending = [...paths];
async function probe(path) {
  const started = Date.now();
  try {
    const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(45000) });
    const html = await res.text();
    const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(m => attrs(m[0]));
    const meta = name => tags.find(t => (t.name || t.property || '').toLowerCase() === name)?.content || null;
    const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m => m[1]);
    const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const schemas = scripts.map(m => { try { return JSON.parse(m[1]); } catch { return { parseError: true }; } });
    const visible = strip(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ''));
    return {
      path, checkedAt: new Date().toISOString(), status: res.status, finalUrl: res.url,
      durationMs: Date.now() - started, bytes: Buffer.byteLength(html),
      sha256: createHash('sha256').update(html).digest('hex'),
      title: strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
      h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => strip(m[1])),
      canonical: tags.find(t => t.rel === 'canonical')?.href || null,
      description: meta('description'), robots: meta('robots'), googlebot: meta('googlebot'),
      headers: Object.fromEntries(['x-robots-tag', 'content-security-policy', 'x-frame-options', 'x-content-type-options', 'cache-control', 'cf-cache-status', 'x-vercel-cache'].map(k => [k, res.headers.get(k)])),
      schemaTypes: schemas.map(s => s['@type']), schemaErrors: schemas.filter(s => s.parseError).length,
      articleSchema: schemas.find(s => s['@type'] === 'NewsArticle') || null,
      visibleCitationMarkers: /contentReference|oaicite:\d/i.test(visible),
      internalArticleLinks: [...new Set(links.filter(l => l.startsWith('/noticias/') || l.startsWith(`${base}/noticias/`)))],
      sponsorPanel: path === '/panel.html' ? /api\/admin\/auspiciadores|sponsorForm/.test(html) : undefined,
      unsupportedAudienceCopy: path === '/publicidad' ? /27,985|4[.,]3 millones|17[.,]000/.test(visible) : undefined,
    };
  } catch (error) {
    return { path, checkedAt: new Date().toISOString(), error: String(error), durationMs: Date.now() - started };
  }
}
function save() {
  writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), method: 'GET only; 3 workers; no browser events; duration includes body download, not CWV/TTFB', sitemapStatus: sitemapResponse.status, sitemapUrls, totalRequested: paths.size, completed: records.length, records }, null, 2));
}
await Promise.all(Array.from({ length: 3 }, async () => {
  while (pending.length) {
    const path = pending.shift();
    records.push(await probe(path));
    if (records.length % 50 === 0) { save(); console.log(`HTTP ${records.length}/${paths.size}`); }
  }
}));
save();
console.log(JSON.stringify({ checked: records.length, errors: records.filter(r => r.error).length, status: records.reduce((a, r) => ({ ...a, [r.status || 'error']: (a[r.status || 'error'] || 0) + 1 }), {}) }));
