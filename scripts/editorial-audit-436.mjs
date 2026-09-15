/**
 * EDITORIAL AUDIT 436 — auditoría editorial/UX de TODOS los artículos en producción.
 * SOLO LECTURA. No escribe en Firestore ni en producción.
 * Uso: node scripts/editorial-audit-436.mjs
 * Salida: scripts/editorial-audit-436-report.json + resumen en consola.
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
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'NI-EditorialAudit/1.0' } });
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
const extract = (html, re) => { const m = html.match(re); return m ? m[1] : null; };

// Patrones de mojibake UTF-8→Latin1 típicos en español
const MOJIBAKE = /Ã[€­±³©®¨ª´º¼½¾]|Â[°´ªº]|â€[œ™]|Ã±|Ã¼/g;
// Frases de "AI smell" en español periodístico
const AI_PHRASES = [
  /en este contexto/gi, /cabe destacar/gi, /es importante señalar/gi,
  /es importante destacar/gi, /cabe mencionar/gi, /en conclusi[oó]n/gi,
  /en resumen/gi, /sin duda alguna/gi, /vale la pena destacar/gi,
  /es fundamental (destacar|señalar|mencionar)/gi, /en definitiva/gi,
  /como se puede observar/gi, /no cabe duda/gi, /es preciso señalar/gi,
  /en el [uú]ltimo tiempo/gi,
];
const GENERIC_CLOSERS = /(se espera que|estaremos atentos|mantente informado|sigue leyendo|continúa leyendo|para más información)/gi;

console.log('1/5 Inventario desde sitemap.xml ...');
const sitemap = await fetchText(`${SITE}/sitemap.xml`);
const articleUrls = [...new Set([...sitemap.body.matchAll(/<loc>(https:\/\/nicaraguainformate\.com\/noticias\/[^<]+)<\/loc>/g)].map((m) => m[1]))];
console.log(`   Artículos en sitemap: ${articleUrls.length}`);

console.log('2/5 Auditando homepage y listados ...');
const home = await fetchText(`${SITE}/`);
const homeLinks = [...new Set([...home.body.matchAll(/href="\/noticias\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
const homeMojibake = (home.body.match(MOJIBAKE) || []).length;
const homeH1 = (home.body.match(/<h1[\s>]/gi) || []).length;
const homeH2 = (home.body.match(/<h2[\s>]/gi) || []).length;
const noticiasList = await fetchText(`${SITE}/noticias`);
const noticiasListLinks = [...new Set([...noticiasList.body.matchAll(/href="\/noticias\/([a-z0-9-]+)"/g)].map((m) => m[1]))];

console.log('3/5 Auditando artículos (varios minutos) ...');
const results = [];
let done = 0;

async function auditArticle(url) {
  const slug = url.split('/noticias/')[1];
  const { status, body, error } = await fetchText(url);
  const r = { url, slug, status, issues: [], flags: [], editorial: {} };
  if (error) { r.issues.push(`FETCH_ERROR`); r.grade = 'ROJO'; return r; }
  if (status !== 200) { r.issues.push(`HTTP_${status}`); r.grade = 'ROJO'; return r; }

  // Greedy hasta el ÚLTIMO </article> para no cortar en articles anidados
  const articleRegion = extract(body, /<article[\s\S]*<\/article>/i) || body;
  const visibleText = stripTags(articleRegion);
  const fullText = stripTags(body);

  // ── Codificación / basura técnica ──
  const mojibakeHits = (visibleText.match(MOJIBAKE) || []).length;
  if (mojibakeHits > 0) { r.issues.push(`MOJIBAKE:${mojibakeHits}`); r.editorial.mojibake = mojibakeHits; }
  if (/oaicite|contentReference/i.test(visibleText)) r.issues.push('AI_MARKER_VISIBLE');
  if (/iphone duo/i.test(visibleText)) r.issues.push('IPHONE_DUO_REF');
  if (/lorem ipsum|texto de ejemplo/i.test(visibleText.slice(0, 5000))) r.flags.push('PLACEHOLDER_TEXT');

  // ── SEO ──
  r.title = extract(body, /<title>([^<]*)<\/title>/i) || '';
  r.metaDesc = extract(body, /<meta name="description" content="([^"]*)"/i) || '';
  r.canonical = extract(body, /<link rel="canonical" href="([^"]*)"/i) || '';
  r.hasJsonLd = /application\/ld\+json/.test(body);
  r.robotsMeta = extract(body, /<meta name="robots" content="([^"]*)"/i) || '';
  if (!r.title) r.issues.push('NO_TITLE');
  if (!r.metaDesc) r.issues.push('NO_META_DESC');
  if (r.metaDesc && r.metaDesc.length < 70) r.flags.push(`SHORT_META:${r.metaDesc.length}`);
  if (!r.canonical) r.issues.push('NO_CANONICAL');
  if (!r.hasJsonLd) r.issues.push('NO_JSONLD');
  if (/noindex/i.test(r.robotsMeta)) r.flags.push('NOINDEX_BUT_IN_SITEMAP');
  r.datePublished = extract(body, /"datePublished"\s*:\s*"([^"]+)"/) || null;
  r.dateModified = extract(body, /"dateModified"\s*:\s*"([^"]+)"/) || null;

  // ── Imagen / caption ──
  const imgs = [...articleRegion.matchAll(/<img[^>]*>/gi)].map((m) => m[0]);
  r.imgCount = imgs.length;
  r.imgsNoAlt = imgs.filter((t) => !/alt="[^"]+"/i.test(t) || /alt=""/i.test(t)).length;
  const figcaption = extract(articleRegion, /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
  const captionText = figcaption ? stripTags(figcaption) : null;
  r.editorial.caption = captionText;
  r.editorial.captionType = !figcaption ? 'none'
    : /foto:\s*nicaragua informate\s*\/\s*archivo/i.test(captionText) && captionText.length < 60 ? 'generic'
    : 'real';
  if (r.imgCount === 0) r.flags.push('NO_IMAGE');
  if (r.imgsNoAlt > 0) r.issues.push(`IMG_NO_ALT:${r.imgsNoAlt}`);

  // ── Estructura editorial ──
  const h2s = (articleRegion.match(/<h2[\s>]/gi) || []).length;
  const h3s = (articleRegion.match(/<h3[\s>]/gi) || []).length;
  r.editorial.subtitles = h2s + h3s;
  const paragraphs = [...articleRegion.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1])).filter((p) => p.length > 40);
  r.editorial.paragraphs = paragraphs.length;
  r.editorial.longestParaWords = paragraphs.reduce((mx, p) => Math.max(mx, wordCount(p)), 0);
  if (r.editorial.longestParaWords > 140) r.flags.push(`LONG_PARA:${r.editorial.longestParaWords}w`);
  if (paragraphs.length >= 4 && r.editorial.subtitles === 0 && wordCount(visibleText) > 600) r.flags.push('NO_SUBTITLES_LONG');

  // ── Bloques editoriales (buscar en body completo: hay <article> anidados) ──
  r.editorial.hasKeyPoints = /Puntos Clave/i.test(body);
  r.editorial.inlineRelatedLinks = (body.match(/ni-related__item/g) || []).length;
  const leaIdx = body.indexOf('Lea también');
  const leaTambien = leaIdx >= 0 ? body.slice(leaIdx, leaIdx + 60000) : '';
  r.editorial.endRelatedCards = leaTambien ? (leaTambien.match(/href="\/noticias\//g) || []).length : 0;
  r.editorial.totalRelatedLinks = r.editorial.inlineRelatedLinks + r.editorial.endRelatedCards;
  if (r.editorial.totalRelatedLinks > 5) r.flags.push(`RELATED_OVERLOAD:${r.editorial.totalRelatedLinks}`);
  if (r.editorial.totalRelatedLinks === 0) r.flags.push('NO_RELATED_LINKS');

  // ── FAQ ──
  const faqIdx = body.indexOf('Preguntas frecuentes');
  r.editorial.hasFaq = faqIdx >= 0;
  if (r.editorial.hasFaq) {
    const faqText = stripTags(body.slice(faqIdx, faqIdx + 20000));
    const resumenTxt = extract(body, /itemProp="description"[^>]*>([\s\S]*?)<\/p>/i);
    const resumenPlain = resumenTxt ? stripTags(resumenTxt).slice(0, 80) : '';
    r.editorial.faqRepeatsResumen = resumenPlain.length > 30 && faqText.includes(resumenPlain.slice(0, 60));
    if (r.editorial.faqRepeatsResumen) r.flags.push('FAQ_REPEATS_RESUMEN');
    r.editorial.faqCount = (body.slice(faqIdx, faqIdx + 20000).match(/<summary/g) || []).length;
  }
  r.editorial.hasPullQuote = /pull-quote|pullquote|blockquote/i.test(body);
  r.editorial.adUnits = (body.match(/adsbygoogle/g) || []).length;

  // ── Fuentes / autor ──
  r.editorial.hasFuentes = />Fuentes<|Fuente principal/i.test(articleRegion);
  r.editorial.hasAuthor = /rel="author"|Redacción Nicaragua Informate/i.test(articleRegion);

  // ── AI smell ──
  let aiHits = 0;
  const aiFound = [];
  for (const re of AI_PHRASES) {
    const n = (visibleText.match(re) || []).length;
    if (n > 0) { aiHits += n; aiFound.push(`${re.source}:${n}`); }
  }
  const closers = (visibleText.match(GENERIC_CLOSERS) || []).length;
  r.editorial.aiPhraseHits = aiHits;
  r.editorial.genericClosers = closers;
  if (aiHits >= 3) r.flags.push(`AI_SMELL:${aiHits}`);
  else if (aiHits > 0) r.editorial.aiPhrases = aiFound;

  // ── Enlaces en cuerpo ──
  const bodyDiv = extract(articleRegion, /itemProp="articleBody"[^>]*>([\s\S]*?)<\/div>/i) || '';
  r.editorial.bodyInternalLinks = (bodyDiv.match(/href="\/noticias\//g) || []).length;
  r.editorial.bodyExternalLinks = (bodyDiv.match(/href="https?:\/\/(?!nicaraguainformate)/g) || []).length;

  // ── Longitud ──
  r.words = wordCount(visibleText);
  if (r.words < 150) r.issues.push(`THIN:${r.words}w`);
  else if (r.words < 300) r.flags.push(`SHORT:${r.words}w`);

  r.titleHash = hash((r.title || '').toLowerCase());
  r.bodyHash = hash(visibleText.slice(0, 3000).toLowerCase());

  if (r.issues.some((i) => /AI_MARKER|HTTP_|THIN:|FETCH|MOJIBAKE|IPHONE_DUO/.test(i))) r.grade = 'ROJO';
  else if (r.issues.length > 0 || r.flags.some((f) => /NO_IMAGE|NOINDEX|PLACEHOLDER|FAQ_REPEATS|RELATED_OVERLOAD/.test(f))) r.grade = 'AMARILLO';
  else r.grade = 'VERDE';
  return r;
}

for (let i = 0; i < articleUrls.length; i += CONCURRENCY) {
  const res = await Promise.all(articleUrls.slice(i, i + CONCURRENCY).map(auditArticle));
  results.push(...res);
  done += res.length;
  if (done % 40 === 0 || done === articleUrls.length) console.log(`   ${done}/${articleUrls.length}`);
  await sleep(150);
}

console.log('4/5 Duplicados + freshness ...');
const byTitle = new Map(); const byBody = new Map();
for (const r of results) {
  if (r.titleHash) { if (byTitle.has(r.titleHash)) { r.issues.push('DUP_TITLE'); r.grade = 'ROJO'; } else byTitle.set(r.titleHash, r.slug); }
  if (r.bodyHash) { if (byBody.has(r.bodyHash)) { r.issues.push('DUP_BODY'); r.grade = 'ROJO'; } else byBody.set(r.bodyHash, r.slug); }
}
const now = Date.now();
const homeOrdered = homeLinks.map((s) => results.find((r) => r.slug === s)).filter(Boolean);
const homeFreshness = homeOrdered.slice(0, 12).map((r) => ({ slug: r.slug, datePublished: r.datePublished, ageHours: r.datePublished ? Math.round((now - new Date(r.datePublished).getTime()) / 36e5) : null }));
const staleOnHome = homeFreshness.filter((a) => a.ageHours !== null && a.ageHours > 168);

console.log('5/5 Generando reporte ...');
const count = (fn) => results.filter(fn).length;
const list = (fn, map) => results.filter(fn).map(map || ((r) => r.slug));

const summary = {
  generatedAt: new Date().toISOString(),
  totalInSitemap: articleUrls.length,
  audited: results.length,
  grades: { verde: count((r) => r.grade === 'VERDE'), amarillo: count((r) => r.grade === 'AMARILLO'), rojo: count((r) => r.grade === 'ROJO') },
  httpErrors: list((r) => r.status !== 200, (r) => `${r.slug}:${r.status}`),
  mojibake: list((r) => r.editorial.mojibake > 0, (r) => `${r.slug}(${r.editorial.mojibake})`),
  aiMarkers: list((r) => r.issues.includes('AI_MARKER_VISIBLE')),
  iphoneDuo: list((r) => r.issues.includes('IPHONE_DUO_REF')),
  captions: {
    none: count((r) => r.editorial.captionType === 'none'),
    generic: count((r) => r.editorial.captionType === 'generic'),
    real: count((r) => r.editorial.captionType === 'real'),
    realExamples: list((r) => r.editorial.captionType === 'real', (r) => `${r.slug} → ${(r.editorial.caption || '').slice(0, 90)}`).slice(0, 15),
  },
  images: { noImage: count((r) => r.flags.includes('NO_IMAGE')), noAlt: list((r) => r.imgsNoAlt > 0, (r) => `${r.slug}(${r.imgsNoAlt})`) },
  faq: { present: count((r) => r.editorial.hasFaq), repeatsResumen: list((r) => r.editorial.faqRepeatsResumen), avgQuestions: Math.round(results.reduce((a, r) => a + (r.editorial.faqCount || 0), 0) / Math.max(count((r) => r.editorial.hasFaq), 1) * 10) / 10 },
  keyPoints: { present: count((r) => r.editorial.hasKeyPoints) },
  pullQuote: { present: count((r) => r.editorial.hasPullQuote) },
  adUnits: { avg: Math.round(results.reduce((a, r) => a + (r.editorial.adUnits || 0), 0) / Math.max(results.length, 1) * 10) / 10 },
  related: {
    inlineBlockLinks: count((r) => r.editorial.inlineRelatedLinks > 0),
    none: list((r) => r.editorial.totalRelatedLinks === 0),
    overload: list((r) => r.editorial.totalRelatedLinks > 5, (r) => `${r.slug}(${r.editorial.totalRelatedLinks})`),
    avgTotal: Math.round(results.reduce((a, r) => a + (r.editorial.totalRelatedLinks || 0), 0) / Math.max(results.length, 1) * 10) / 10,
  },
  aiSmell: { flagged3plus: list((r) => r.flags.some((f) => f.startsWith('AI_SMELL')), (r) => `${r.slug}(${r.editorial.aiPhraseHits})`), genericClosers: count((r) => r.editorial.genericClosers > 0) },
  structure: { noSubtitlesLong: list((r) => r.flags.includes('NO_SUBTITLES_LONG')), longPara: list((r) => r.flags.some((f) => f.startsWith('LONG_PARA')), (r) => `${r.slug}(${r.editorial.longestParaWords}w)`) },
  fuentes: { present: count((r) => r.editorial.hasFuentes), absent: count((r) => !r.editorial.hasFuentes) },
  seo: { noTitle: count((r) => r.issues.includes('NO_TITLE')), noMeta: count((r) => r.issues.includes('NO_META_DESC')), shortMeta: count((r) => r.flags.some((f) => f.startsWith('SHORT_META'))), noCanonical: count((r) => r.issues.includes('NO_CANONICAL')), noJsonLd: count((r) => r.issues.includes('NO_JSONLD')), noindexInSitemap: list((r) => r.flags.includes('NOINDEX_BUT_IN_SITEMAP')) },
  thin: list((r) => r.issues.some((i) => i.startsWith('THIN')), (r) => `${r.slug}(${r.words}w)`),
  short: count((r) => r.flags.some((f) => f.startsWith('SHORT'))),
  dupTitles: list((r) => r.issues.includes('DUP_TITLE')),
  dupBodies: list((r) => r.issues.includes('DUP_BODY')),
  homepage: { linksFound: homeLinks.length, h1: homeH1, h2: homeH2, mojibake: homeMojibake, top12: homeFreshness, staleOnHome: staleOnHome.map((a) => `${a.slug}(${a.ageHours}h)`) },
  noticiasList: { status: noticiasList.status, linksFound: noticiasListLinks.length },
};

writeFileSync(new URL('./editorial-audit-436-report.json', import.meta.url), JSON.stringify({ summary, results }, null, 2));

console.log('\n════════ RESUMEN EJECUTIVO ════════');
console.log(`Auditados: ${summary.audited}/${summary.totalInSitemap} | VERDE ${summary.grades.verde} | AMARILLO ${summary.grades.amarillo} | ROJO ${summary.grades.rojo}`);
console.log(`HTTP errors: ${summary.httpErrors.length} | Mojibake: ${summary.mojibake.length} | AI markers: ${summary.aiMarkers.length} | iPhoneDuo: ${summary.iphoneDuo.length}`);
console.log(`Captions → none:${summary.captions.none} generic:${summary.captions.generic} real:${summary.captions.real}`);
console.log(`Imágenes → sin imagen:${summary.images.noImage} sin alt:${summary.images.noAlt.length}`);
console.log(`FAQ → presentes:${summary.faq.present} repitenResumen:${summary.faq.repeatsResumen.length} avgQ:${summary.faq.avgQuestions}`);
console.log(`KeyPoints presentes: ${summary.keyPoints.present} | PullQuote: ${summary.pullQuote.present} | ads avg: ${summary.adUnits.avg}`);
console.log(`Relacionados → inline:${summary.related.inlineBlockLinks} ninguno:${summary.related.none.length} overload>5:${summary.related.overload.length} avg:${summary.related.avgTotal}`);
console.log(`AI smell ≥3: ${summary.aiSmell.flagged3plus.length} | closers genéricos: ${summary.aiSmell.genericClosers}`);
console.log(`Sin subtítulos (largos): ${summary.structure.noSubtitlesLong.length} | párrafos largos: ${summary.structure.longPara.length}`);
console.log(`Fuentes → presentes:${summary.fuentes.present} ausentes:${summary.fuentes.absent}`);
console.log(`SEO → noTitle:${summary.seo.noTitle} noMeta:${summary.seo.noMeta} shortMeta:${summary.seo.shortMeta} noCanon:${summary.seo.noCanonical} noJsonLd:${summary.seo.noJsonLd} noindex:${summary.seo.noindexInSitemap.length}`);
console.log(`Thin<150w: ${summary.thin.length} | Short<300w: ${summary.short} | dupTitle:${summary.dupTitles.length} dupBody:${summary.dupBodies.length}`);
console.log(`Homepage → links:${summary.homepage.linksFound} h1:${summary.homepage.h1} stale>168h:${summary.homepage.staleOnHome.length}`);
console.log('Reporte: scripts/editorial-audit-436-report.json');
