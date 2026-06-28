// =============================================================================
// AUDITORÍA FORENSE PROFUNDA — nicaraguainformate.com
// Ejecutar: bun auditar-forense-profunfo.mjs
// =============================================================================

const DOMINIO = 'nicaraguainformate.com';
const BASE_URL = `https://${DOMINIO}`;

console.log('🔬 AUDITORÍA FORENSE PROFUNDA');
console.log(`🌐 Objetivo: ${BASE_URL}`);
console.log('═'.repeat(70));

// ─── UTILIDADES ───
async function fetchUrl(url, opts = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-NI,es;q=0.9',
        ...opts.headers
      },
      ...opts
    });
    const body = await res.text();
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers),
      body,
      latency: Date.now() - start,
      size: body.length
    };
  } catch (e) {
    return { status: 0, error: e.message, latency: Date.now() - start, body: '' };
  }
}

function $(html, prop) {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
  return m ? m[1] : null;
}

function canonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m ? m[1] : null;
}

function tag(html, t) {
  const m = html.match(new RegExp(`<${t}[^>]*>([^<]+)</${t}>`, 'i'));
  return m ? m[1].trim() : null;
}

function schemas(html) {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { out.push(JSON.parse(m[1])); } catch {}
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECCIÓN A: ARQUITECTURA DE SITEMAPS
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📑 SECCIÓN A: Arquitectura de Sitemaps');

const sitemapUrls = [
  '/sitemap.xml',
  '/news-sitemap.xml',
  '/sitemap-index.xml',
  '/sitemap-0.xml',
  '/sitemap-static.xml',
  '/api/sitemap',
];

const sitemapResults = [];
for (const path of sitemapUrls) {
  const url = `${BASE_URL}${path}`;
  const r = await fetchUrl(url);
  const hasUrls = r.body && r.body.includes('<loc>');
  const urlCount = hasUrls ? [...r.body.matchAll(/<loc>/g)].length : 0;
  const hasNews = r.body && r.body.includes('/noticias/');
  const lastmod = r.body?.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || null;
  
  sitemapResults.push({
    path,
    status: r.status,
    latency: r.latency,
    size: r.size,
    urls: urlCount,
    hasNews,
    lastmod,
    error: r.error || null
  });

  const icon = r.status === 200 ? '✅' : r.status === 404 ? '❌' : '⚠️';
  console.log(`  ${icon} ${path} → HTTP ${r.status} | ${r.latency}ms | ${urlCount} URLs | Noticias: ${hasNews ? 'SÍ' : 'NO'}${lastmod ? ' | Último: ' + lastmod : ''}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// SECCIÓN B: SITEMAP PRINCIPAL — ANÁLISIS PROFUNDO
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📑 SECCIÓN B: Análisis profundo de sitemap.xml');

const mainSitemap = await fetchUrl(`${BASE_URL}/sitemap.xml`);
let mainSitemapUrls = [];
let noticiasEnSitemap = [];
let estaticasEnSitemap = [];

if (mainSitemap.status === 200 && mainSitemap.body) {
  mainSitemapUrls = [...mainSitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  noticiasEnSitemap = mainSitemapUrls.filter(u => u.includes('/noticias/') && !u.endsWith('/noticias'));
  estaticasEnSitemap = mainSitemapUrls.filter(u => !u.includes('/noticias/'));
  
  console.log(`  Total URLs: ${mainSitemapUrls.length}`);
  console.log(`  Páginas estáticas: ${estaticasEnSitemap.length}`);
  console.log(`  Noticias individuales: ${noticiasEnSitemap.length}`);
  console.log(`  Primeras 5 URLs:`);
  mainSitemapUrls.slice(0, 5).forEach(u => console.log(`    → ${u}`));
  
  if (noticiasEnSitemap.length === 0) {
    console.log(`  🔴 ALERTA: sitemap.xml NO contiene noticias individuales`);
  }
} else {
  console.log(`  ❌ No se pudo obtener sitemap.xml: ${mainSitemap.error || 'HTTP ' + mainSitemap.status}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// SECCIÓN C: NEWS-SITEMAX
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📑 SECCIÓN C: Análisis de news-sitemap.xml');

const newsSitemap = await fetchUrl(`${BASE_URL}/news-sitemap.xml`);
let newsUrls = [];
let newsLastmods = [];

if (newsSitemap.status === 200 && newsSitemap.body) {
  newsUrls = [...newsSitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  newsLastmods = [...newsSitemap.body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1]);
  
  console.log(`  Total noticias: ${newsUrls.length}`);
  console.log(`  Latencia: ${newsSitemap.latency}ms`);
  console.log(`  Tamaño: ${newsSitemap.size} bytes`);
  
  if (newsUrls.length > 0) {
    console.log(`  Última noticia: ${newsUrls[0]}`);
    console.log(`  Fecha última noticia: ${newsLastmods[0] || 'Sin <lastmod>'}`);
    console.log(`  Fecha más antigua: ${newsLastmods[newsLastmods.length - 1] || 'Sin <lastmod>'}`);
    
    // Verificar si las noticias son recientes (< 48h para Google News)
    const ahora = new Date();
    const noticiasRecientes = newsLastmods.filter(d => {
      const diff = (ahora - new Date(d)) / (1000 * 60 * 60);
      return diff < 48;
    });
    console.log(`  Noticias < 48h: ${noticiasRecientes.length} (ideal para Google News)`);
  } else {
    console.log(`  🔴 ALERTA: news-sitemap.xml existe pero está VACÍO`);
  }
} else {
  console.log(`  ❌ news-sitemap.xml no accesible: ${newsSitemap.error || 'HTTP ' + newsSitemap.status}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// SECCIÓN D: NOTICIA REAL — VALIDACIÓN FORENSE
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📰 SECCIÓN D: Validación forense de noticia real');

// Prioridad: news-sitemap → sitemap.xml → homepage → fallback
let noticiaUrl = null;
let fuente = '';

if (newsUrls.length > 0) {
  noticiaUrl = newsUrls[0];
  fuente = 'news-sitemap.xml';
} else if (noticiasEnSitemap.length > 0) {
  noticiaUrl = noticiasEnSitemap[0];
  fuente = 'sitemap.xml';
} else {
  // Buscar en homepage
  const hp = await fetchUrl(BASE_URL);
  const links = [...(hp.body || '').matchAll(/href="(\/noticias\/[a-zA-Z0-9-]+)"/g)]
    .map(m => `${BASE_URL}${m[1]}`)
    .filter((v, i, a) => a.indexOf(v) === i);
  if (links.length > 0) {
    noticiaUrl = links[0];
    fuente = 'homepage scraping';
  }
}

if (!noticiaUrl) {
  noticiaUrl = `${BASE_URL}/noticias/nicaraguenses-acumulan-c-291-mil-millones-en-depositos`;
  fuente = 'HARDCODED FALLBACK (puede estar muerta)';
}

console.log(`  Fuente: ${fuente}`);
console.log(`  URL: ${noticiaUrl}`);

const n = await fetchUrl(noticiaUrl);
const nHtml = n.body || '';
const nSchemas = schemas(nHtml);
const news = nSchemas.find(s => s['@type'] === 'NewsArticle');

console.log(`\n  ── Respuesta HTTP ──`);
console.log(`  Status: ${n.status} (${n.latency}ms)`);
console.log(`  Size: ${n.size} bytes`);

console.log(`\n  ── Meta Tags ──`);
console.log(`  Título: ${tag(nHtml, 'title')?.substring(0, 60) || '❌ NO DETECTADO'}...`);
console.log(`  H1: ${tag(nHtml, 'h1')?.substring(0, 60) || '❌ NO DETECTADO'}...`);
console.log(`  Meta desc: ${$(nHtml, 'description') ? '✅' : '❌'}`);
console.log(`  Canonical: ${canonical(nHtml) ? '✅ ' + canonical(nHtml) : '❌'}`);

console.log(`\n  ── Open Graph ──`);
console.log(`  og:title: ${$(nHtml, 'og:title') ? '✅' : '❌'}`);
console.log(`  og:description: ${$(nHtml, 'og:description') ? '✅' : '❌'}`);
console.log(`  og:image: ${$(nHtml, 'og:image') ? '✅' : '❌'}`);
console.log(`  og:image:width: ${$(nHtml, 'og:image:width') || '❌'}`);
console.log(`  og:image:height: ${$(nHtml, 'og:image:height') || '❌'}`);
console.log(`  og:type: ${$(nHtml, 'og:type') || '❌'}`);

console.log(`\n  ── Schema.org NewsArticle ──`);
console.log(`  Schema detectado: ${news ? '✅' : '❌'}`);
if (news) {
  console.log(`    @type: ${news['@type']}`);
  console.log(`    headline: ${news.headline ? '✅ ' + news.headline.substring(0, 50) : '❌'}`);
  console.log(`    description: ${news.description ? '✅' : '❌'}`);
  console.log(`    image: ${news.image ? (Array.isArray(news.image) ? `✅ [${news.image.length} imgs]` : '✅') : '❌'}`);
  console.log(`    datePublished: ${news.datePublished || '❌'}`);
  console.log(`    dateModified: ${news.dateModified || '❌'}`);
  console.log(`    author.name: ${news.author?.name || '❌'}`);
  console.log(`    author.@type: ${news.author?.['@type'] || '❌'}`);
  console.log(`    publisher.name: ${news.publisher?.name || '❌'}`);
  console.log(`    publisher.logo: ${news.publisher?.logo ? '✅' : '❌'}`);
  console.log(`    articleBody: ${news.articleBody ? '✅ (' + news.articleBody.length + ' chars)' : '❌'}`);
} else {
  // ¿Es soft 404?
  const esSoft404 = n.status === 200 && (
    nHtml.includes('No encontrada') ||
    nHtml.includes('no encontrada') ||
    nHtml.includes('404') ||
    tag(nHtml, 'title')?.includes('No encontrada')
  );
  if (esSoft404) {
    console.log(`  🔴 SOFT 404 DETECTADO: Status 200 pero contenido de error`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECCIÓN E: ROBOTS.TXT & SITEMAP REFERENCIA
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n🤖 SECCIÓN E: robots.txt');

const robots = await fetchUrl(`${BASE_URL}/robots.txt`);
const rBody = robots.body || '';

console.log(`  Status: ${robots.status}`);
console.log(`  Latencia: ${robots.latency}ms`);
console.log(`  Tiene Sitemap: ${rBody.includes('Sitemap:') ? '✅' : '❌'}`);
const sitemapRefs = [...rBody.matchAll(/Sitemap:\s*(.+)/gi)].map(m => m[1].trim());
sitemapRefs.forEach(ref => console.log(`    → ${ref}`));

// ═════════════════════════════════════════════════════════════════════════════
// SECCIÓN F: API INTERNA — cachedGetNews
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n⚡ SECCIÓN F: API Interna (cachedGetNews)');

const apiEndpoints = [
  '/api/news?limit=1',
  '/api/news?limit=5',
  '/api/sitemap-data',
];

for (const endpoint of apiEndpoints) {
  const r = await fetchUrl(`${BASE_URL}${endpoint}`);
  let data = null;
  try { data = JSON.parse(r.body); } catch {}
  
  console.log(`  ${endpoint} → HTTP ${r.status} | ${r.latency}ms`);
  if (data) {
    if (Array.isArray(data)) {
      console.log(`    Respuesta: Array[${data.length}]`);
      if (data.length > 0) {
        console.log(`    Primera noticia slug: ${data[0].slug || data[0].id || 'N/A'}`);
        console.log(`    Primera noticia título: ${(data[0].title || '').substring(0, 50)}...`);
      }
    } else {
      console.log(`    Respuesta: Objeto con keys: ${Object.keys(data).join(', ')}`);
    }
  } else if (r.body) {
    console.log(`    Respuesta: ${r.body.substring(0, 100)}...`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECCIÓN G: CACHE & HEADERS
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n💾 SECCIÓN G: Headers de caché (sitemap.xml)');

const cacheHeaders = mainSitemap.headers || {};
const relevant = ['cache-control', 'x-vercel-cache', 'cf-cache-status', 'age', 'etag'];
relevant.forEach(h => {
  if (cacheHeaders[h]) console.log(`  ${h}: ${cacheHeaders[h]}`);
});

// ═════════════════════════════════════════════════════════════════════════════
// SCORE FORENSE PROFUNDO
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(70));

const checks = {
  sitemapPrincipal: mainSitemap.status === 200,
  sitemapTieneNoticias: noticiasEnSitemap.length > 0 || newsUrls.length > 0,
  newsSitemapExiste: newsSitemap.status === 200,
  newsSitemapTieneUrls: newsUrls.length > 0,
  noticiaRealEncontrada: !!noticiaUrl && fuente !== 'HARDCODED FALLBACK (puede estar muerta)',
  noticiaStatus200: n.status === 200,
  noticiaNoEsSoft404: n.status === 200 && !nHtml.includes('No encontrada'),
  noticiaTieneH1: !!tag(nHtml, 'h1'),
  noticiaTieneCanonical: !!canonical(nHtml),
  noticiaTieneSchema: !!news,
  schemaTieneHeadline: !!news?.headline,
  schemaTieneImage: !!news?.image,
  schemaTieneFechas: !!news?.datePublished && !!news?.dateModified,
  schemaTieneAuthor: !!news?.author?.name,
  schemaTienePublisher: !!news?.publisher?.name,
  robotsTieneSitemap: rBody.includes('Sitemap:'),
};

const okCount = Object.values(checks).filter(Boolean).length;
const totalChecks = Object.keys(checks).length;
const pct = Math.round((okCount / totalChecks) * 100);

console.log(`🏆 SCORE FORENSE PROFUNDO: ${okCount}/${totalChecks} = ${pct}%`);

if (pct >= 90) console.log('🟢 EXCELENTE — Cumple Google News/AdSense/Discover');
else if (pct >= 75) console.log('🟡 BUENO — Ajustes menores');
else if (pct >= 60) console.log('🟠 REGULAR — Problemas de indexación');
else console.log('🔴 CRÍTICO — Arreglos urgentes');

console.log('\n📋 Checklist detallado:');
Object.entries(checks).forEach(([k, v]) => {
  console.log(`  ${v ? '✅' : '❌'} ${k}`);
});

// Guardar reporte
await Bun.write('reporte-forense-profunfo.json', JSON.stringify({
  fecha: new Date().toISOString(),
  dominio: DOMINIO,
  score: { actual: okCount, maximo: totalChecks, porcentaje: pct },
  sitemaps: sitemapResults,
  noticia: {
    url: noticiaUrl,
    fuente,
    status: n.status,
    latency: n.latency,
    schema: news,
    esSoft404: n.status === 200 && nHtml.includes('No encontrada')
  },
  checks
}, null, 2));

console.log('\n💾 Reporte guardado: reporte-forense-profunfo.json');