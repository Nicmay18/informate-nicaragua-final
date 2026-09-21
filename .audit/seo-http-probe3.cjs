/** READ-ONLY probe 3: UAs de Google, thin pages, redirects restantes. */
async function head(url, ua) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': ua }, redirect: 'manual' });
    return { http: r.status, loc: r.headers.get('location'), xrt: r.headers.get('x-robots-tag') };
  } catch (e) { return { error: String(e.message || e).slice(0, 120) }; }
}
async function body(url) {
  const r = await fetch(url, { redirect: 'manual' });
  const t = await r.text();
  const noResults = /no hay|sin resultados|no se encontr|0 noticias/i.test(t);
  return { http: r.status, bytes: t.length, metaRobots: (t.match(/<meta name="robots" content="([^"]+)"/) || [])[1] || null, sinContenido: noResults };
}

async function main() {
  const UAS = {
    Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    AdsBot: 'Mozilla/5.0 (compatible; AdsBot-Google; +http://www.google.com/adsbot.html)',
    InspectionTool: 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)',
    GooglebotNews: 'Mozilla/5.0 (compatible; Googlebot-News; +http://www.google.com/bot.html)',
    AhrefsBot: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
  };
  const target = 'https://nicaraguainformate.com/noticias/pomares-2026-ocho-equipos-sudaran-la-camiseta-por-el-titulo';
  const out = {};
  for (const [name, ua] of Object.entries(UAS)) {
    out['ua_' + name] = { url: target, ...(await head(target, ua)) };
  }

  out.page99 = { url: 'https://nicaraguainformate.com/noticias?page=99', ...(await body('https://nicaraguainformate.com/noticias?page=99')) };
  out.page2 = { url: 'https://nicaraguainformate.com/noticias?page=2', ...(await body('https://nicaraguainformate.com/noticias?page=2')) };
  out.categoria_vacia = { url: 'https://nicaraguainformate.com/categoria/inexistente-xyz', ...(await body('https://nicaraguainformate.com/categoria/inexistente-xyz')) };
  out.guia_slug = { url: 'https://nicaraguainformate.com/guia/inexistente-xyz', ...(await body('https://nicaraguainformate.com/guia/inexistente-xyz')) };
  out.entidad = { url: 'https://nicaraguainformate.com/entidad/inexistente-xyz', ...(await body('https://nicaraguainformate.com/entidad/inexistente-xyz')) };
  out.tema_slug = { url: 'https://nicaraguainformate.com/tema/inexistente-xyz', ...(await body('https://nicaraguainformate.com/tema/inexistente-xyz')) };
  out.manifest = { url: 'https://nicaraguainformate.com/manifest.json', ...(await head('https://nicaraguainformate.com/manifest.json', UAS.Googlebot)) };
  out.favicon = { url: 'https://nicaraguainformate.com/favicon.ico', ...(await head('https://nicaraguainformate.com/favicon.ico', UAS.Googlebot)) };

  require('fs').writeFileSync('.audit/seo-http-probe3.json', JSON.stringify(out, null, 2));
  for (const [k, v] of Object.entries(out)) console.log(k, JSON.stringify(v));
}
main().catch(e => { console.error(e); process.exit(1); });
