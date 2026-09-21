/** READ-ONLY probe 2: Googlebot UA, archivadas, redirects chains, taxonomías. */
const GB = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

async function check(url, ua = GB, maxRedirects = 0) {
  const chain = [];
  let cur = url;
  for (let i = 0; i <= 5; i++) {
    try {
      const r = await fetch(cur, { headers: { 'User-Agent': ua }, redirect: 'manual' });
      chain.push({ url: cur, http: r.status, loc: r.headers.get('location'), xrt: r.headers.get('x-robots-tag') });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
        cur = new URL(r.headers.get('location'), cur).toString();
        continue;
      }
      if (r.status === 200) {
        const h = await r.text();
        chain[chain.length - 1].metaRobots = (h.match(/<meta name="robots" content="([^"]+)"/) || [])[1] || null;
        chain[chain.length - 1].canonical = (h.match(/rel="canonical" href="([^"]+)"/) || [])[1] || null;
        chain[chain.length - 1].bytes = h.length;
      }
      break;
    } catch (e) {
      chain.push({ url: cur, error: String(e.message || e).slice(0, 120) });
      break;
    }
  }
  return chain;
}

async function main() {
  const tests = {
    googlebot_noticia: 'https://nicaraguainformate.com/noticias/pomares-2026-ocho-equipos-sudaran-la-camiseta-por-el-titulo',
    googlebot_home: 'https://nicaraguainformate.com/',
    archivada: 'https://nicaraguainformate.com/noticias/campeonato-de-1-4-de-milla-adrenalina-y-tecnica-en-managua',
    archivada2: 'https://nicaraguainformate.com/noticias/puerto-corinto-lidera-llegada-de-11-buques-a-nicaragua',
    old_noticia_html: 'https://nicaraguainformate.com/noticia.html?slug=pomares-2026-ocho-equipos-sudaran-la-camiseta-por-el-titulo',
    www_redirect: 'https://www.nicaraguainformate.com/noticias/pomares-2026-ocho-equipos-sudaran-la-camiseta-por-el-titulo',
    http_redirect: 'http://nicaraguainformate.com/noticias',
    old_cat: 'https://nicaraguainformate.com/deportes',
    cat_param: 'https://nicaraguainformate.com/?cat=deportes',
    noticias_cat_param: 'https://nicaraguainformate.com/noticias?cat=deportes',
    guia_sample: 'https://nicaraguainformate.com/guia',
    tema_sample: 'https://nicaraguainformate.com/tema',
    autor_sin_articulos: 'https://nicaraguainformate.com/autor/inexistente-xyz',
    api_bloqueada: 'https://nicaraguainformate.com/api/audio',
    api_admin: 'https://nicaraguainformate.com/api/admin/estado',
    news_sitemap: 'https://nicaraguainformate.com/news-sitemap.xml',
    noticias_pagina_lejos: 'https://nicaraguainformate.com/noticias?page=99',
    noticia_param_slug: 'https://nicaraguainformate.com/noticias/x?slug=pomares-2026-ocho-equipos-sudaran-la-camiseta-por-el-titulo',
  };

  const out = {};
  for (const [k, u] of Object.entries(tests)) {
    out[k] = await check(u);
  }

  // news-sitemap: contar URLs
  try {
    const r = await fetch('https://nicaraguainformate.com/news-sitemap.xml');
    const t = await r.text();
    out._newsSitemap = { http: r.status, urls: (t.match(/<loc>/g) || []).length, head: t.slice(0, 400) };
  } catch (e) { out._newsSitemap = { error: String(e.message) }; }

  require('fs').writeFileSync('.audit/seo-http-probe2.json', JSON.stringify(out, null, 2));
  for (const [k, chain] of Object.entries(out)) {
    if (k === '_newsSitemap') { console.log(k, JSON.stringify(chain)); continue; }
    console.log(`\n${k}:`);
    for (const c of chain) console.log('  ', JSON.stringify(c));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
