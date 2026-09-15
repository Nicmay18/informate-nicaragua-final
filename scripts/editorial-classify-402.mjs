/**
 * CLASIFICADOR EDITORIAL A/B/C/D — revisión de contenido real de los 402 artículos públicos.
 * SOLO LECTURA. Clasifica cada artículo según problemas editoriales concretos.
 * A = publicable sin reescritura (solo diseño) | B = necesita edición puntual
 * C = necesita reescritura editorial | D = no tocar (sensible / revisión humana)
 * Salida: scripts/editorial-classify-402-report.json
 */
import { writeFileSync } from 'node:fs';

const SITE = 'https://nicaraguainformate.com';
const CONCURRENCY = 8;
const FETCH_TIMEOUT = 20000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'NI-EditorialClassify/1.0' } });
    return { status: res.status, body: res.status === 200 ? await res.text() : '' };
  } catch (e) {
    return { status: 0, body: '', error: String(e) };
  } finally { clearTimeout(t); }
}

const stripTags = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const wc = (t) => t.split(/\s+/).filter(Boolean).length;
const jaccard = (a, b) => {
  const A = new Set(norm(a).split(' ').filter(w => w.length > 3));
  const B = new Set(norm(b).split(' ').filter(w => w.length > 3));
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
};

const AI_PHRASES = [
  /en este contexto/gi, /cabe destacar/gi, /es importante señalar/gi,
  /es importante destacar/gi, /cabe mencionar/gi, /en conclusi[oó]n/gi,
  /en resumen/gi, /sin duda alguna/gi, /vale la pena destacar/gi,
  /es fundamental (destacar|señalar|mencionar)/gi, /en definitiva/gi,
  /como se puede observar/gi, /no cabe duda/gi, /es preciso señalar/gi,
];
const CLOSER = /(se espera que|estaremos atentos|mantente informado|sigue leyendo|continúa leyendo|para más información|las autoridades (continúan|siguen|mantienen)|se mantiene la investigación|en las próximas (horas|semanas|días))/i;
const SENSITIVE = /fallec|muert|muri[oó]|murieron|mueren|deceso|occiso|pierden la vida|perdi[oó] la vida|perdieron la vida|homicidio|asesin|femicidio|suicid|violaci[oó]n|abuso (sexual|de menores)|menor de edad|cad[aá]ver|ejecutad|masacre|tragedia|v[ií]ctima mortal|accidente (fatal|mortal)|desaparecid|luto/i;
const CLICKBAIT = /(no vas a creer|te sorprenderá|increíble|impactante|esto es lo que|descubre|¡|!)/i;

console.log('Inventario desde sitemap ...');
const sm = await fetchText(`${SITE}/sitemap.xml`);
const urls = [...new Set([...sm.body.matchAll(/<loc>(https:\/\/nicaraguainformate\.com\/noticias\/[^<]+)<\/loc>/g)].map(m => m[1]))];
console.log(`Artículos: ${urls.length}`);

const results = [];
let done = 0;

async function classify(url) {
  const slug = url.split('/noticias/')[1];
  const { status, body, error } = await fetchText(url);
  const r = { slug, url, status, problems: [], clase: null, prioridad: null };
  if (error || status !== 200) { r.clase = 'D'; r.problems.push({ p: `HTTP_${status || 'FETCH_ERROR'}`, fix: 'verificar accesibilidad', pri: 'alta' }); return r; }

  // ── Extracción ──
  const title = (body.match(/<h1[^>]*itemProp="headline"[^>]*>([\s\S]*?)<\/h1>/i) || body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
  r.titulo = stripTags(title);
  const bodyIdx = body.indexOf('itemProp="articleBody"');
  // Bajada real = último itemProp="description" ANTES de articleBody (hay 3: footer, bajada, bio autor)
  let resumen = '';
  for (const m of body.matchAll(/itemProp="description"[^>]*>([\s\S]*?)<\/p>/gi)) {
    if (m.index < bodyIdx) resumen = stripTags(m[1]);
  }
  r.resumen = resumen;
  // Corte del cuerpo: newsletter, FAQ y "Lea también" quedan fuera del texto periodístico
  const cutMarkers = ['Recibe noticias', 'Preguntas frecuentes', 'Lea también', 'Suscribirme'];
  let endIdx = -1;
  for (const mk of cutMarkers) {
    const idx = body.indexOf(mk, bodyIdx);
    if (idx > bodyIdx && (endIdx === -1 || idx < endIdx)) endIdx = idx;
  }
  const bodyHtml = bodyIdx >= 0 ? body.slice(bodyIdx, endIdx > bodyIdx ? endIdx : bodyIdx + 80000) : '';
  const paras = [...bodyHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => stripTags(m[1])).filter(p => p.length > 30);
  const bodyText = paras.join(' ');
  r.palabras = wc(bodyText);
  const h2h3 = (bodyHtml.match(/<h[23][\s>]/gi) || []).length;
  const cat = (body.match(/itemProp="articleSection"[^>]*>([^<]*)</i) || [])[1] || '';
  r.categoria = cat;
  const capM = body.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
  const caption = capM ? stripTags(capM[1]) : '';
  r.captionGenerico = /foto:\s*nicaragua informate\s*\/\s*archivo/i.test(caption) && caption.length < 60;
  r.hasFaq = body.includes('Preguntas frecuentes');
  r.hasKeyPoints = body.includes('Puntos Clave');

  // ── Análisis editorial ──
  const P = (p, fix, pri) => r.problems.push({ p, fix, pri });

  // 1. Título
  if (r.titulo.length > 90) P('TITULO_LARGO', 'recortar a <90 chars manteniendo dato principal', 'media');
  if (CLICKBAIT.test(r.titulo)) P('TITULO_CLICKBAIT', 'reescribir titular informativo', 'alta');
  if (r.titulo.length < 25) P('TITULO_CORTO', 'titular demasiado vago, añadir dato concreto', 'media');

  // 2. Bajada vs entrada duplicada
  const entrada = paras[0] || '';
  if (r.resumen && entrada) {
    const sim = jaccard(r.resumen, entrada);
    if (sim > 0.55 || norm(entrada).includes(norm(r.resumen).slice(0, 60))) {
      P('BAJADA_DUPLICA_ENTRADA', 'la entrada repite la bajada; reescribir entrada con dato nuevo o eliminar redundancia', 'alta');
      r.resumenEntradaSim = Math.round(sim * 100);
    }
  }

  // 3. Repetición de oraciones dentro del cuerpo
  const sents = bodyText.split(/(?<=[.!?])\s+/).map(s => norm(s)).filter(s => wc(s) >= 7);
  const seen = new Map(); let dupSents = 0;
  for (const s of sents) { seen.set(s, (seen.get(s) || 0) + 1); }
  for (const [, n] of seen) if (n > 1) dupSents++;
  if (dupSents >= 3) P(`REPETICION_ORACIONES:${dupSents}`, 'eliminar oraciones duplicadas en el cuerpo', 'alta');
  else if (dupSents > 0) P(`REPETICION_ORACIONES:${dupSents}`, 'revisar oración repetida', 'media');

  // 4. Repetición resumen↔cuerpo (misma info en bajada y cierre)
  const lastPara = paras[paras.length - 1] || '';
  if (r.resumen && lastPara && jaccard(r.resumen, lastPara) > 0.6) {
    P('CIERRE_REPITE_BAJADA', 'el cierre repite la bajada; cerrar con dato de cierre o proyección real', 'media');
  }

  // 5. Párrafos
  const longParas = paras.filter(p => wc(p) > 140).length;
  const shortParas = paras.filter(p => wc(p) < 12).length;
  if (longParas > 0) P(`PARRAFO_LARGO:${longParas}`, 'dividir párrafos >140 palabras para lectura móvil', 'media');
  if (paras.length >= 5 && shortParas / paras.length > 0.6) P('PARRAFOS_FRAGMENTADOS', 'demasiados párrafos de una línea; unificar ideas', 'baja');
  if (paras.length <= 2 && r.palabras > 350) P('MURO_DE_TEXTO', 'pocos párrafos para la longitud; dividir', 'media');

  // 6. Subtítulos
  if (r.palabras > 600 && h2h3 === 0) P('SIN_SUBTITULOS', 'artículo largo sin subtítulos; añadir 2-3 H2 descriptivos', 'media');

  // 7. Cierre
  if (CLOSER.test(lastPara)) P('CIERRE_GENERICO', 'cierre de plantilla ("se espera que/estaremos atentos"); cerrar con hecho concreto', 'media');
  if (lastPara && wc(lastPara) < 10 && paras.length > 3) P('CIERRE_DEBIL', 'último párrafo demasiado corto; no cierra la nota', 'baja');

  // 8. AI smell
  let aiHits = 0;
  for (const re of AI_PHRASES) aiHits += (bodyText.match(re) || []).length;
  r.aiHits = aiHits;
  if (aiHits >= 3) P(`AI_SMELL:${aiHits}`, 'eliminar muletillas de relleno ("cabe destacar", "en este contexto")', 'alta');
  else if (aiHits > 0) P(`AI_SMELL_LEVE:${aiHits}`, 'revisar muletilla de relleno', 'baja');

  // 9. Utilidad / delgadez relativa
  if (r.palabras < 200) P('MUY_CORTO', 'nota <200 palabras; valorar ampliar con contexto o fusionar', 'media');

  // 10. Caption (solo presentación, no cuenta para B/C)
  // 11. Sensibilidad
  const sensM = (r.titulo + ' ' + bodyText.slice(0, 3000)).match(SENSITIVE);
  const sensitive = !!sensM;
  r.sensible = sensitive;
  if (sensM) r.sensibleTerm = sensM[0];

  // ── Clasificación ──
  const altas = r.problems.filter(p => p.pri === 'alta').length;
  const medias = r.problems.filter(p => p.pri === 'media').length;
  const totalP = r.problems.length;

  if (sensitive) {
    r.clase = 'D';
    r.prioridad = 'revisión humana';
  } else if (aiHits >= 3 || dupSents >= 3 || (totalP >= 4 && altas >= 1) || (r.palabras < 200 && totalP >= 2)) {
    r.clase = 'C';
    r.prioridad = 'alta';
  } else if (totalP > 0) {
    r.clase = 'B';
    r.prioridad = altas > 0 ? 'alta' : medias > 1 ? 'media' : 'baja';
  } else {
    r.clase = 'A';
    r.prioridad = '—';
  }
  return r;
}

for (let i = 0; i < urls.length; i += CONCURRENCY) {
  const res = await Promise.all(urls.slice(i, i + CONCURRENCY).map(classify));
  results.push(...res);
  done += res.length;
  if (done % 40 === 0 || done === urls.length) console.log(`   ${done}/${urls.length}`);
  await sleep(150);
}

const by = (c) => results.filter(r => r.clase === c);
const summary = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  A: by('A').length, B: by('B').length, C: by('C').length, D: by('D').length,
  problemFreq: {},
};
for (const r of results) for (const p of r.problems) {
  const k = p.p.split(':')[0];
  summary.problemFreq[k] = (summary.problemFreq[k] || 0) + 1;
}
writeFileSync(new URL('./editorial-classify-402-report.json', import.meta.url), JSON.stringify({ summary, results }, null, 2));

console.log('\n════════ CLASIFICACIÓN ════════');
console.log(`A (publicable, solo diseño): ${summary.A}`);
console.log(`B (necesita edición):        ${summary.B}`);
console.log(`C (necesita reescritura):    ${summary.C}`);
console.log(`D (no tocar / sensible):     ${summary.D}`);
console.log('\nFrecuencia de problemas:', JSON.stringify(summary.problemFreq, null, 1));
console.log('\nReporte: scripts/editorial-classify-402-report.json');
