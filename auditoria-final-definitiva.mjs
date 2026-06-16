// =============================================================================
// AUDITORÍA FORENSE DEFINITIVA — nicaraguainformate.com
// Objetivo: Verificar listo para monetización AdSense + Google News 2026
// Ejecutar: node auditoria-final-definitiva.mjs
// =============================================================================

import fs from 'fs';

const DOMINIO = 'nicaraguainformate.com';
const BASE_URL = `https://${DOMINIO}`;
const START_TIME = Date.now();

console.log('🔬 AUDITORÍA FORENSE DEFINITIVA 2026');
console.log(`🌐 Objetivo: ${BASE_URL}`);
console.log('═'.repeat(75));

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
      size: body.length,
      ok: res.ok
    };
  } catch (e) {
    return { status: 0, error: e.message, latency: Date.now() - start, body: '', ok: false };
  }
}

function $(html, prop) {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
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

// Patrones de detección de IA
const IA_PATTERNS = [
  /en conclusión|en resumen|para concluir|finalmente/i,
  /es importante destacar que|vale la pena mencionar que/i,
  /según fuentes confiables|según expertos en la materia/i,
  /en el contexto actual|en la actualidad/i,
  /no obstante|sin embargo|por otro lado|por ende/i,
  /la información proporcionada/i,
  /se recomienda|es fundamental|es crucial|es esencial/i,
  /\b(además|asimismo|igualmente|del mismo modo)\b.{0,30}\b(además|asimismo|igualmente)\b/i,
];

function detectarRastrosIA(texto) {
  const hallazgos = [];
  for (const pattern of IA_PATTERNS) {
    const matches = texto.match(pattern);
    if (matches) hallazgos.push(matches[0]);
  }
  return { tieneRastros: hallazgos.length > 2, hallazgos: [...new Set(hallazgos)] };
}

// ─── SECCIÓN 1: ESTRUCTURA DEL SITIO ───
console.log('\n🏗️ SECCIÓN 1: Estructura y Páginas Críticas');

const paginasCriticas = [
  { path: '/', nombre: 'Homepage', required: true },
  { path: '/nosotros', nombre: 'Nosotros', required: true },
  { path: '/contacto', nombre: 'Contacto', required: true },
  { path: '/terminos', nombre: 'Términos', required: true },
  { path: '/privacidad', nombre: 'Privacidad', required: true },
  { path: '/cookies', nombre: 'Cookies', required: true },
  { path: '/correcciones', nombre: 'Correcciones', required: true },
  { path: '/politica-editorial', nombre: 'Política Editorial', required: true },
  { path: '/publicidad', nombre: 'Publicidad', required: false },
  { path: '/mapa-del-sitio', nombre: 'Mapa del Sitio', required: false },
  { path: '/noticias', nombre: 'Listado Noticias', required: true },
  { path: '/categoria', nombre: 'Categorías', required: true },
];

const estructura = [];
for (const p of paginasCriticas) {
  const r = await fetchUrl(`${BASE_URL}${p.path}`);
  const ok = r.status === 200;
  const hasContent = r.body && r.body.length > 1000;
  const hasTitle = !!tag(r.body, 'title');
  const hasMetaDesc = !!$(r.body, 'description');
  const hasH1 = !!tag(r.body, 'h1');

  estructura.push({
    ...p,
    status: r.status,
    latency: r.latency,
    hasContent,
    hasTitle,
    hasMetaDesc,
    hasH1,
    ok: ok && hasContent && hasTitle && hasMetaDesc
  });

  const icon = ok && hasContent ? '✅' : p.required ? '🔴' : '⚠️';
  console.log(`  ${icon} ${p.nombre}: HTTP ${r.status} | ${r.latency}ms | Contenido: ${hasContent ? 'Sí' : 'No'} | Título: ${hasTitle ? 'Sí' : 'No'} | Meta: ${hasMetaDesc ? 'Sí' : 'No'} | H1: ${hasH1 ? 'Sí' : 'No'}`);
}

const estructuraOK = estructura.filter(e => e.ok).length;
const estructuraTotal = estructura.filter(e => e.required).length;

// ─── SECCIÓN 2: NOTICIA DE PRUEBA FORENSE ───
console.log('\n📰 SECCIÓN 2: Noticia Forense — 6 Niveles de Validación');

// Obtener noticia real del news-sitemap
const newsSitemap = await fetchUrl(`${BASE_URL}/news-sitemap.xml`);
let noticiaUrl = null;
if (newsSitemap.ok && newsSitemap.body) {
  const urls = [...newsSitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  noticiaUrl = urls[0];
}

if (!noticiaUrl) {
  const sitemap = await fetchUrl(`${BASE_URL}/sitemap.xml`);
  const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  noticiaUrl = urls.find(u => u.includes('/noticias/') && !u.endsWith('/noticias'));
}

console.log(`  URL de prueba: ${noticiaUrl}`);

const n = await fetchUrl(noticiaUrl);
const nHtml = n.body || '';
const nSchemas = schemas(nHtml);
const news = nSchemas.find(s => s['@type'] === 'NewsArticle');

// 2.1 Validación ORO (8 checks)
const palabras = nHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
const lead = tag(nHtml, 'h1') || '';
const leadWords = lead.split(' ').length;
const h2Count = [...nHtml.matchAll(/<h2[^>]*>/gi)].length;
const strongCount = [...nHtml.matchAll(/<strong[^>]*>/gi)].length;
const citas = [...nHtml.matchAll(/(según|informó|confirmó|declaró|dijo|afirmó|indicó|precisó|señaló)/gi)].length;
const tituloChars = (tag(nHtml, 'title') || '').replace(' | Nicaragua Informate', '').length;
const metaDesc = $(nHtml, 'description') || '';
const metaDescChars = metaDesc.length;
const hasImage = !!$(nHtml, 'og:image');

const oroChecks = {
  extension: palabras >= 500,
  lead: leadWords >= 35,
  subtitulos: h2Count >= 1,
  negritas: strongCount >= 1,
  citas: citas >= 1,
  tituloSEO: tituloChars >= 50 && tituloChars <= 70,
  metaDesc: metaDescChars >= 150 && metaDescChars <= 170,
  imagen: hasImage,
};

console.log('\n  🥇 NIVEL ORO (Calidad Editorial)');
Object.entries(oroChecks).forEach(([k, v]) => {
  const label = {
    extension: 'Extensión ≥500 palabras',
    lead: 'Lead ≥35 palabras',
    subtitulos: 'Subtítulos (h2) ≥1',
    negritas: 'Negritas / datos clave',
    citas: 'Citas o atribución',
    tituloSEO: 'Título SEO 50-70 chars',
    metaDesc: 'Meta 150-170 chars',
    imagen: 'Imagen destacada',
  }[k];
  console.log(`    ${v ? '✅' : '❌'} ${label}: ${k === 'extension' ? palabras + ' pal' : k === 'lead' ? leadWords + ' pal' : k === 'subtitulos' ? h2Count : k === 'negritas' ? strongCount : k === 'citas' ? citas : k === 'tituloSEO' ? tituloChars + ' ch' : k === 'metaDesc' ? metaDescChars + ' ch' : hasImage ? 'Sí' : 'No'}`);
});

// 2.2 AdSense
const contenidoTexto = nHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const thinContent = palabras < 300;
const clickbait = /(shock|impactante|increíble|no vas a creer|te sorprenderá|omg|wow)/i.test(nHtml);
const valorOriginal = citas >= 2 || strongCount >= 3;

const adsenseChecks = {
  thinContent: !thinContent,
  clickbait: !clickbait,
  valorOriginal,
  revisionEditorial: h2Count >= 3 && citas >= 1,
};

console.log('\n  💰 ADSENSE (Monetización)');
Object.entries(adsenseChecks).forEach(([k, v]) => {
  const label = {
    thinContent: 'Thin content',
    clickbait: 'Clickbait',
    valorOriginal: 'Valor añadido original',
    revisionEditorial: 'Revisión editorial',
  }[k];
  console.log(`    ${v ? '✅' : '❌'} ${label}`);
});

// 2.3 Discover
const discoverChecks = {
  imagen: hasImage,
  titulo: tituloChars >= 40 && tituloChars <= 70 && !clickbait,
  frescura: !!news?.datePublished && new Date() - new Date(news.datePublished) < 7 * 24 * 60 * 60 * 1000,
};

console.log('\n  📱 DISCOVER (Feed Móvil)');
Object.entries(discoverChecks).forEach(([k, v]) => {
  const label = {
    imagen: 'Imagen destacada',
    titulo: 'Título Discover-friendly',
    frescura: 'Señal de frescura',
  }[k];
  console.log(`    ${v ? '✅' : '❌'} ${label}`);
});

// 2.4 Google News
const newsChecks = {
  schema: !!news,
  autor: !!news?.author?.name,
  fechas: !!news?.datePublished && !!news?.dateModified,
  categoria: !!news?.articleSection || nHtml.includes('itemProp="articleSection"'),
};

console.log('\n  📰 GOOGLE NEWS');
Object.entries(newsChecks).forEach(([k, v]) => {
  const label = {
    schema: 'Schema NewsArticle',
    autor: 'Autor verificado',
    fechas: 'Fechas visibles',
    categoria: 'Categoría News',
  }[k];
  console.log(`    ${v ? '✅' : '❌'} ${label}`);
});

// 2.5 SEO Técnico
const seoChecks = {
  titulo: tituloChars >= 55 && tituloChars <= 60,
  meta: metaDescChars >= 150 && metaDescChars <= 170,
  slug: noticiaUrl && noticiaUrl.includes('-') && !noticiaUrl.includes('?'),
  canonical: nHtml.includes('rel="canonical"'),
  keywords: $(nHtml, 'keywords') || nHtml.includes('article:section'),
};

console.log('\n  🔍 SEO TÉCNICO');
Object.entries(seoChecks).forEach(([k, v]) => {
  const label = {
    titulo: 'Título 55-60 chars',
    meta: 'Meta description 150-170',
    slug: 'Slug SEO',
    canonical: 'Canonical',
    keywords: 'Keywords LSI',
  }[k];
  console.log(`    ${v ? '✅' : '❌'} ${label}`);
});

// 2.6 E-E-A-T
const eeatChecks = {
  autor: !!news?.author?.name,
  bio: nHtml.includes('/autor/') || nHtml.includes('itemProp="author"'),
  fuentes: citas >= 2,
  about: estructura.find(e => e.path === '/nosotros')?.ok || false,
  contacto: estructura.find(e => e.path === '/contacto')?.ok || false,
};

console.log('\n  👤 E-E-A-T (Experiencia, Pericia, Autoridad, Confianza)');
Object.entries(eeatChecks).forEach(([k, v]) => {
  const label = {
    autor: 'Autor con nombre real',
    bio: 'Autor con bio/perfil',
    fuentes: 'Fuentes verificables',
    about: 'Página Quiénes Somos',
    contacto: 'Página Contacto',
  }[k];
  console.log(`    ${v ? '✅' : '❌'} ${label}`);
});

// ─── SECCIÓN 3: DETECCIÓN DE RASTROS DE IA ───
console.log('\n🤖 SECCIÓN 3: Detección de Rastros de IA');

const iaDetection = detectarRastrosIA(contenidoTexto);
console.log(`  Análisis de ${palabras} palabras de contenido`);
console.log(`  Patrones detectados: ${iaDetection.hallazgos.length}`);
if (iaDetection.hallazgos.length > 0) {
  iaDetection.hallazgos.slice(0, 5).forEach(h => console.log(`    ⚠️  "${h}"`));
}
console.log(`  Veredicto: ${iaDetection.tieneRastros ? '🔴 RASTROS DE IA DETECTADOS — Revisar manualmente' : '🟢 SIN RASTROS SIGNIFICATIVOS — Originalidad probable'}`);

// ─── SECCIÓN 4: VELOCIDAD Y PERFORMANCE ───
console.log('\n⚡ SECCIÓN 4: Velocidad y Performance');

const speedTests = [
  { url: BASE_URL, nombre: 'Homepage' },
  { url: noticiaUrl || BASE_URL, nombre: 'Noticia' },
  { url: `${BASE_URL}/categoria/sucesos`, nombre: 'Categoría' },
];

const speedResults = [];
for (const test of speedTests) {
  const r = await fetchUrl(test.url);
  const ttfb = r.latency;
  const sizeKB = Math.round(r.size / 1024);
  const isFast = ttfb < 1000 && sizeKB < 1000;

  speedResults.push({ ...test, ttfb, sizeKB, isFast });
  console.log(`  ${isFast ? '✅' : '⚠️'} ${test.nombre}: ${ttfb}ms | ${sizeKB}KB | ${isFast ? 'Rápido' : 'Lento'}`);
}

// ─── SECCIÓN 5: SEGURIDAD Y CABECERAS ───
console.log('\n🔒 SECCIÓN 5: Seguridad y Cabeceras HTTP');

const sec = await fetchUrl(BASE_URL);
const h = sec.headers || {};
const securityChecks = {
  https: BASE_URL.startsWith('https'),
  hsts: !!h['strict-transport-security'],
  xframe: !!h['x-frame-options'],
  xcontent: !!h['x-content-type-options'],
  csp: !!h['content-security-policy'],
  referrer: !!h['referrer-policy'],
};

Object.entries(securityChecks).forEach(([k, v]) => {
  const label = {
    https: 'HTTPS activo',
    hsts: 'HSTS',
    xframe: 'X-Frame-Options',
    xcontent: 'X-Content-Type-Options',
    csp: 'Content-Security-Policy',
    referrer: 'Referrer-Policy',
  }[k];
  console.log(`  ${v ? '✅' : '⚠️'} ${label}`);
});

// ─── SECCIÓN 6: RESPONSIVE / MÓVIL ───
console.log('\n📱 SECCIÓN 6: Compatibilidad Móvil');

const mobileChecks = {
  viewport: nHtml.includes('viewport'),
  amp: nHtml.includes('amphtml') || nHtml.includes('⚡'),
  touchTargets: nHtml.includes('min-height: 44px') || nHtml.includes('min-width: 44px'),
  fontSize: !nHtml.includes('font-size: 10px') && !nHtml.includes('font-size:9px'),
};

Object.entries(mobileChecks).forEach(([k, v]) => {
  const label = {
    viewport: 'Viewport meta tag',
    amp: 'AMP (opcional)',
    touchTargets: 'Touch targets ≥44px',
    fontSize: 'Font size legible',
  }[k];
  console.log(`  ${v ? '✅' : '⚠️'} ${label}`);
});

// ─── SECCIÓN 7: SITEMAPS Y ROBOTS ───
console.log('\n🗺️ SECCIÓN 7: Sitemaps y Indexación');

const robots = await fetchUrl(`${BASE_URL}/robots.txt`);
const robotsChecks = {
  existe: robots.status === 200,
  sitemap: robots.body?.includes('Sitemap:'),
  newsSitemap: robots.body?.includes('news-sitemap'),
  allow: !robots.body?.includes('Disallow: /noticias'),
};

const sitemapMain = await fetchUrl(`${BASE_URL}/sitemap.xml`);
const sitemapNews = await fetchUrl(`${BASE_URL}/news-sitemap.xml`);

const sitemapChecks = {
  main: sitemapMain.status === 200,
  news: sitemapNews.status === 200,
  newsUrls: sitemapNews.body ? [...sitemapNews.body.matchAll(/<loc>/g)].length : 0,
};

console.log(`  robots.txt: ${robotsChecks.existe ? '✅' : '❌'}`);
console.log(`  Sitemap referenciado: ${robotsChecks.sitemap ? '✅' : '❌'}`);
console.log(`  News-sitemap referenciado: ${robotsChecks.newsSitemap ? '✅' : '❌'}`);
console.log(`  /sitemap.xml: ${sitemapChecks.main ? '✅' : '❌'}`);
console.log(`  /news-sitemap.xml: ${sitemapChecks.news ? '✅' : '❌'} (${sitemapChecks.newsUrls} noticias)`);

// ─── SECCIÓN 8: CÓDIGO MUERTO (ANÁLISIS ESTÁTICO) ───
console.log('\n🧹 SECCIÓN 8: Análisis de Código Muerto (Frontend)');

const jsFiles = [...nHtml.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/gi)].map(m => m[1]);
const cssFiles = [...nHtml.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/gi)].map(m => m[1]);

console.log(`  Scripts cargados: ${jsFiles.length}`);
console.log(`  CSS cargados: ${cssFiles.length}`);

// Detectar scripts potencialmente muertos
const unusedPatterns = [
  'analytics.js', 'tracker.js', 'old-', 'legacy-', 'deprecated',
  'fb-sdk', 'twitter-widgets', 'disqus', 'commento'
];

const sospechosos = jsFiles.filter(js => unusedPatterns.some(p => js.includes(p)));
if (sospechosos.length > 0) {
  console.log(`  ⚠️  Scripts potencialmente obsoletos:`);
  sospechosos.forEach(s => console.log(`     → ${s}`));
} else {
  console.log(`  ✅ No se detectaron scripts obsoletos obvios`);
}

// ─── SCORE FINAL ───
console.log('\n' + '═'.repeat(75));

const allChecks = {
  // Oro
  extension: oroChecks.extension,
  lead: oroChecks.lead,
  subtitulos: oroChecks.subtitulos,
  negritas: oroChecks.negritas,
  citas: oroChecks.citas,
  tituloSEO: oroChecks.tituloSEO,
  metaDesc: oroChecks.metaDesc,
  imagen: oroChecks.imagen,

  // AdSense
  thinContent: adsenseChecks.thinContent,
  clickbait: adsenseChecks.clickbait,
  valorOriginal: adsenseChecks.valorOriginal,
  revisionEditorial: adsenseChecks.revisionEditorial,

  // Discover
  discoverImagen: discoverChecks.imagen,
  discoverTitulo: discoverChecks.titulo,
  discoverFrescura: discoverChecks.frescura,

  // News
  newsSchema: newsChecks.schema,
  newsAutor: newsChecks.autor,
  newsFechas: newsChecks.fechas,
  newsCategoria: newsChecks.categoria,

  // SEO
  seoTitulo: seoChecks.titulo,
  seoMeta: seoChecks.meta,
  seoSlug: seoChecks.slug,
  seoCanonical: seoChecks.canonical,
  seoKeywords: seoChecks.keywords,

  // EEAT
  eeatAutor: eeatChecks.autor,
  eeatBio: eeatChecks.bio,
  eeatFuentes: eeatChecks.fuentes,
  eeatAbout: eeatChecks.about,
  eeatContacto: eeatChecks.contacto,

  // General
  estructura: estructuraOK >= estructuraTotal - 1,
  velocidad: speedResults.every(s => s.isFast),
  mobile: mobileChecks.viewport,
  viewport: mobileChecks.viewport,
  sitemaps: sitemapChecks.main && sitemapChecks.news,
  newsSitemap: sitemapChecks.news,
  iaClean: !iaDetection.tieneRastros,
};

const totalChecks = Object.keys(allChecks).length;
const passedChecks = Object.values(allChecks).filter(Boolean).length;
const scoreFinal = Math.round((passedChecks / totalChecks) * 100);

console.log(`🏆 SCORE FINAL: ${passedChecks}/${totalChecks} = ${scoreFinal}%`);

// Veredicto por plataforma
const plataformas = [
  { nombre: 'Google AdSense', checks: ['thinContent', 'clickbait', 'valorOriginal', 'revisionEditorial', 'estructura', 'eeatAbout', 'eeatContacto'], min: 90 },
  { nombre: 'Google News', checks: ['newsSchema', 'newsAutor', 'newsFechas', 'newsCategoria', 'sitemaps', 'newsSitemap'], min: 85 },
  { nombre: 'Google Discover', checks: ['discoverImagen', 'discoverTitulo', 'discoverFrescura', 'mobile', 'viewport'], min: 80 },
  { nombre: 'SEO General', checks: ['tituloSEO', 'metaDesc', 'seoSlug', 'seoCanonical', 'seoKeywords', 'velocidad'], min: 85 },
];

console.log('\n📋 VEREDICTO POR PLATAFORMA:');
plataformas.forEach(p => {
  const pChecks = p.checks.map(c => allChecks[c]).filter(Boolean).length;
  const pTotal = p.checks.length;
  const pScore = Math.round((pChecks / pTotal) * 100);
  const ready = pScore >= p.min;
  console.log(`  ${ready ? '🟢' : '🔴'} ${p.nombre}: ${pScore}% ${ready ? '(LISTO)' : '(FALTA)'}`);
});

// Veredicto global
console.log('\n' + '═'.repeat(75));
if (scoreFinal >= 90) {
  console.log('🟢 EXCELENTE — Listo para solicitar AdSense y Google News');
  console.log('   Acción recomendada: Ir a https://www.google.com/adsense/start');
  console.log('   Luego: https://publishercenter.google.com');
} else if (scoreFinal >= 75) {
  console.log('🟡 BUENO — Corregir items en rojo antes de solicitar');
} else {
  console.log('🔴 REGULAR — Arreglos necesarios antes de monetizar');
}

const tiempoTotal = ((Date.now() - START_TIME) / 1000).toFixed(1);
console.log(`\n⏱️  Tiempo de auditoría: ${tiempoTotal}s`);

// Guardar reporte
fs.writeFileSync('auditoria-final-definitiva.json', JSON.stringify({
  fecha: new Date().toISOString(),
  dominio: DOMINIO,
  score: { actual: passedChecks, total: totalChecks, porcentaje: scoreFinal },
  urlPrueba: noticiaUrl,
  noticia: {
    palabras,
    leadWords,
    h2Count,
    strongCount,
    citas,
    tituloChars,
    metaDescChars,
    ia: iaDetection,
  },
  estructura,
  velocidad: speedResults,
  seguridad: securityChecks,
  mobile: mobileChecks,
  sitemaps: { robotsChecks, sitemapChecks },
  veredicto: plataformas,
  listoParaAdSense: scoreFinal >= 90,
}, null, 2));

console.log('\n💾 Reporte guardado: auditoria-final-definitiva.json');
