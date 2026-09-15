/**
 * FINAL CLOSEOUT AUDIT — audita TODOS los artículos publicados contra producción.
 * Uso: node scripts/final-closeout-audit.mjs
 * Salida: reporte JSON en scripts/final-closeout-report.json + resumen en consola.
 */
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SITE = 'https://nicaraguainformate.com';
const CONCURRENCY = 8;
const FETCH_TIMEOUT = 20000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'NI-CloseoutAudit/1.0' } });
    return { status: res.status, body: res.status === 200 ? await res.text() : '' };
  } catch (e) {
    return { status: 0, body: '', error: String(e) };
  } finally {
    clearTimeout(t);
  }
}

const stripTags = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;
const hash = (s) => createHash('md5').update(s).digest('hex').slice(0, 12);

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

// ─── 1. Inventario desde sitemap ────────────────────────────────────────────
console.log('1/4 Obteniendo inventario desde sitemap.xml ...');
const sitemap = await fetchText(`${SITE}/sitemap.xml`);
const articleUrls = [...sitemap.body.matchAll(/<loc>(https:\/\/nicaraguainformate\.com\/noticias\/[^<]+)<\/loc>/g)].map((m) => m[1]);
const uniqueUrls = [...new Set(articleUrls)];
console.log(`   Artículos en sitemap: ${uniqueUrls.length}`);

// ─── 2. Homepage: orden y frescura ──────────────────────────────────────────
console.log('2/4 Auditando homepage ...');
const home = await fetchText(`${SITE}/`);
const homeLinks = [...home.body.matchAll(/href="\/noticias\/([a-z0-9-]+)"/g)].map((m) => m[1]);
const homeSlugsOrdered = [...new Set(homeLinks)];
console.log(`   Links de artículos en homepage: ${homeSlugsOrdered.length}`);

// ─── 3. Auditoría artículo por artículo ─────────────────────────────────────
console.log('3/4 Auditando artículos (esto tarda unos minutos) ...');
const results = [];
let done = 0;

async function auditArticle(url) {
  const slug = url.split('/noticias/')[1];
  const { status, body, error } = await fetchText(url);
  const r = { url, slug, status, issues: [], flags: [] };
  if (error) { r.issues.push(`FETCH_ERROR:${error.slice(0, 80)}`); r.grade = 'ROJO'; return r; }
  if (status !== 200) { r.issues.push(`HTTP_${status}`); r.grade = 'ROJO'; return r; }

  // Marcadores IA / basura técnica
  if (/oaicite|contentReference/i.test(body)) r.issues.push('AI_MARKER_VISIBLE');
  const visibleText = stripTags(body);
  if (/lorem ipsum|texto de ejemplo|placeholder|TODO:|FIXME/i.test(visibleText.slice(0, 5000))) r.flags.push('PLACEHOLDER_TEXT');
  // Solo texto visible: los payloads RSC de Next.js contienen "undefined" legítimamente
  if (/\[object Object\]|null<\/|NaN</.test(visibleText)) r.flags.push('TECH_GARBAGE');

  // SEO básico
  r.title = extract(body, /<title>([^<]*)<\/title>/i) || '';
  r.metaDesc = extract(body, /<meta name="description" content="([^"]*)"/i) || '';
  r.canonical = extract(body, /<link rel="canonical" href="([^"]*)"/i) || '';
  r.hasJsonLd = /application\/ld\+json/.test(body);
  r.robotsMeta = extract(body, /<meta name="robots" content="([^"]*)"/i) || '';
  if (!r.title) r.issues.push('NO_TITLE');
  if (!r.metaDesc) r.issues.push('NO_META_DESC');
  if (!r.canonical) r.issues.push('NO_CANONICAL');
  if (!r.hasJsonLd) r.issues.push('NO_JSONLD');
  if (/noindex/i.test(r.robotsMeta)) r.flags.push('NOINDEX_BUT_IN_SITEMAP');

  // Fecha de publicación desde JSON-LD
  const datePub = extract(body, /"datePublished"\s*:\s*"([^"]+)"/);
  r.datePublished = datePub || null;

  // Imagen principal + alt + caption
  const articleRegion = extract(body, /<article[\s\S]*?<\/article>/i) || body;
  const imgs = [...articleRegion.matchAll(/<img[^>]*>/gi)].map((m) => m[0]);
  r.imgCount = imgs.length;
  r.imgsNoAlt = imgs.filter((t) => !/alt="[^"]*"/i.test(t) || /alt=""/i.test(t)).length;
  r.hasCaption = /<figcaption|class="[^"]*(caption|pie-foto|pieFoto)[^"]*"/i.test(articleRegion);
  if (r.imgCount === 0) r.flags.push('NO_IMAGE');
  if (r.imgsNoAlt > 0) r.issues.push(`IMG_NO_ALT:${r.imgsNoAlt}`);

  // Conteo de palabras del cuerpo (región article o heurística)
  const bodyText = stripTags(articleRegion);
  r.words = wordCount(bodyText);
  if (r.words < 150) r.issues.push(`THIN:${r.words}w`);
  else if (r.words < 300) r.flags.push(`SHORT:${r.words}w`);

  // Señales objetivas de texto plantilla (frases genéricas repetidas)
  const generic = (bodyText.match(/en conclusión|es importante destacar|cabe mencionar que|en resumen,|sin duda alguna/gi) || []).length;
  if (generic >= 3) r.flags.push(`GENERIC_PHRASES:${generic}`);

  r.titleHash = hash((r.title || '').toLowerCase());
  r.bodyHash = hash(bodyText.slice(0, 3000).toLowerCase());

  // Clasificación
  if (r.issues.some((i) => /AI_MARKER|HTTP_|THIN:|FETCH/.test(i))) r.grade = 'ROJO';
  else if (r.issues.length > 0 || r.flags.some((f) => /NO_IMAGE|NOINDEX|PLACEHOLDER|TECH/.test(f))) r.grade = 'AMARILLO';
  else r.grade = 'VERDE';
  return r;
}

for (let i = 0; i < uniqueUrls.length; i += CONCURRENCY) {
  const batch = uniqueUrls.slice(i, i + CONCURRENCY);
  const res = await Promise.all(batch.map(auditArticle));
  results.push(...res);
  done += res.length;
  if (done % 40 === 0 || done === uniqueUrls.length) console.log(`   ${done}/${uniqueUrls.length}`);
  await sleep(150);
}

// ─── 4. Duplicados + homepage freshness + reporte ───────────────────────────
console.log('4/4 Detectando duplicados y generando reporte ...');
const byTitle = new Map();
const byBody = new Map();
for (const r of results) {
  if (r.titleHash) {
    if (byTitle.has(r.titleHash)) { r.issues.push('DUP_TITLE'); r.grade = 'ROJO'; }
    else byTitle.set(r.titleHash, r.slug);
  }
  if (r.bodyHash) {
    if (byBody.has(r.bodyHash)) { r.issues.push('DUP_BODY'); r.grade = 'ROJO'; }
    else byBody.set(r.bodyHash, r.slug);
  }
}

// Homepage: verificar que los primeros artículos sean recientes
const homeArticleData = results.filter((r) => homeSlugsOrdered.includes(r.slug));
const homeOrdered = homeSlugsOrdered.map((s) => results.find((r) => r.slug === s)).filter(Boolean);
const now = Date.now();
const homeFreshness = homeOrdered.slice(0, 10).map((r) => ({
  slug: r.slug,
  datePublished: r.datePublished,
  ageHours: r.datePublished ? Math.round((now - new Date(r.datePublished).getTime()) / 36e5) : null,
}));
const staleOnHome = homeFreshness.filter((a) => a.ageHours !== null && a.ageHours > 168);

const summary = {
  generatedAt: new Date().toISOString(),
  totalInSitemap: uniqueUrls.length,
  audited: results.length,
  verde: results.filter((r) => r.grade === 'VERDE').length,
  amarillo: results.filter((r) => r.grade === 'AMARILLO').length,
  rojo: results.filter((r) => r.grade === 'ROJO').length,
  httpErrors: results.filter((r) => r.status !== 200).map((r) => `${r.slug}:${r.status}`),
  aiMarkers: results.filter((r) => r.issues.includes('AI_MARKER_VISIBLE')).map((r) => r.slug),
  thin: results.filter((r) => r.issues.some((i) => i.startsWith('THIN'))).map((r) => `${r.slug} (${r.words}w)`),
  noAlt: results.filter((r) => r.imgsNoAlt > 0).map((r) => `${r.slug} (${r.imgsNoAlt})`),
  noImage: results.filter((r) => r.flags.includes('NO_IMAGE')).map((r) => r.slug),
  noindexInSitemap: results.filter((r) => r.flags.includes('NOINDEX_BUT_IN_SITEMAP')).map((r) => r.slug),
  dupTitles: results.filter((r) => r.issues.includes('DUP_TITLE')).map((r) => r.slug),
  dupBodies: results.filter((r) => r.issues.includes('DUP_BODY')).map((r) => r.slug),
  homepage: { linksFound: homeSlugsOrdered.length, top10: homeFreshness, staleOnHome: staleOnHome.map((a) => `${a.slug} (${a.ageHours}h)`) },
};

writeFileSync(new URL('./final-closeout-report.json', import.meta.url), JSON.stringify({ summary, results }, null, 2));

console.log('\n════════ RESUMEN ════════');
console.log(`Total sitemap: ${summary.totalInSitemap} | Auditados: ${summary.audited}`);
console.log(`VERDE: ${summary.verde} | AMARILLO: ${summary.amarillo} | ROJO: ${summary.rojo}`);
console.log(`HTTP errors: ${summary.httpErrors.length}`, summary.httpErrors.slice(0, 10));
console.log(`AI markers: ${summary.aiMarkers.length}`, summary.aiMarkers.slice(0, 10));
console.log(`Thin (<150w): ${summary.thin.length}`);
console.log(`Sin alt: ${summary.noAlt.length} | Sin imagen: ${summary.noImage.length}`);
console.log(`Noindex en sitemap: ${summary.noindexInSitemap.length}`);
console.log(`Dup título: ${summary.dupTitles.length} | Dup cuerpo: ${summary.dupBodies.length}`);
console.log(`Homepage stale (>168h en top10): ${summary.homepage.staleOnHome.length}`, summary.homepage.staleOnHome);
console.log('Reporte: scripts/final-closeout-report.json');
