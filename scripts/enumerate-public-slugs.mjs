// Enumera TODOS los slugs públicos via /noticias?page=N (solo lectura)
// y los compara contra el sitemap para hallar artículos públicos fuera del sitemap.
const SITE = 'https://nicaraguainformate.com';

async function get(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'NI-Audit/1.0' } });
  return r.status === 200 ? await r.text() : '';
}

// 1. Slugs del sitemap
const sm = await get(`${SITE}/sitemap.xml`);
const sitemapSlugs = new Set([...sm.matchAll(/<loc>https:\/\/nicaraguainformate\.com\/noticias\/([^<]+)<\/loc>/g)].map(m => m[1]));
console.log('Sitemap slugs:', sitemapSlugs.size);

// 2. Crawl /noticias?page=N hasta que no haya enlaces nuevos
const publicSlugs = new Set();
let page = 1, emptyStreak = 0;
while (page <= 60 && emptyStreak < 2) {
  const html = await get(`${SITE}/noticias?page=${page}`);
  const found = [...html.matchAll(/href="\/noticias\/([a-z0-9-]+)"/g)].map(m => m[1]);
  const before = publicSlugs.size;
  found.forEach(s => publicSlugs.add(s));
  console.log(`page ${page}: ${found.length} links, ${publicSlugs.size - before} nuevos (total ${publicSlugs.size})`);
  if (publicSlugs.size === before) emptyStreak++; else emptyStreak = 0;
  page++;
  await new Promise(r => setTimeout(r, 200));
}

// 3. Diff
const missing = [...publicSlugs].filter(s => !sitemapSlugs.has(s));
const inSitemapNotPublic = [...sitemapSlugs].filter(s => !publicSlugs.has(s));
console.log('\nPúblicos totales (via /noticias):', publicSlugs.size);
console.log('Públicos NO en sitemap:', missing.length);
missing.forEach(s => console.log('  -', s));
console.log('En sitemap no vistos en /noticias (paginación):', inSitemapNotPublic.length);
