// AUTOPSIA FORENSE — análisis automatizado del corpus publicado. SOLO LECTURA.
// Entrada: .audit/corpus.json → Salida: .audit/analysis.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const docs = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const arts = docs.filter((d) => d.estado === 'publicado');

const stripHtml = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const wc = (t) => t.split(/\s+/).filter(Boolean).length;
const jaccard = (a, b) => {
  const A = new Set(norm(a).split(' ').filter((w) => w.length > 3));
  const B = new Set(norm(b).split(' ').filter((w) => w.length > 3));
  if (!A.size || !B.size) return 0;
  let i = 0; for (const w of A) if (B.has(w)) i++;
  return i / (A.size + B.size - i);
};

const VAGUE_ATTR = [
  /según (los? )?expertos?/gi, /según analistas/gi, /analistas (señalan|consultados|coinciden|aseguran|indican)/gi,
  /especialistas (consideran|señalan|consultados|coinciden|aseguran|indican)/gi, /según especialistas/gi,
  /consultores? (indican|señalan|aseguran)/gi, /fuentes cercanas/gi, /fuentes (oficiales|confiables|conocedoras)(?! de)/gi,
  /autoridades competentes/gi, /(según|de acuerdo con|conforme a) (informes|reportes|estudios|investigaciones)(?! de | del | de la | los | las )/gi,
  /informaron las autoridades/gi, /según trascendió/gi, /se informó que/gi, /trascendió que/gi,
  /fuentes que pidieron (reserva|anonimato)/gi, /bajo condición de anonimato/gi, /versiones extraoficiales/gi,
  /según versiones(?! de | del | de la )/gi, /medios (locales|internacionales|nacionales) (informaron|reportaron|señalan)/gi,
];
const FILLER = [
  /en este contexto/gi, /cabe destacar/gi, /es importante señalar/gi, /es importante destacar/gi,
  /cabe mencionar/gi, /en conclusi[oó]n/gi, /en resumen/gi, /sin duda alguna/gi, /vale la pena destacar/gi,
  /es fundamental (destacar|señalar|mencionar)/gi, /en definitiva/gi, /como se puede observar/gi,
  /no cabe duda/gi, /es preciso señalar/gi, /no es un secreto que/gi, /a d[ií]a de hoy/gi,
  /en la era digital/gi, /en los últimos tiempos/gi,
];
const GENERIC_CLOSER = /(se espera que|estaremos atentos|mantente informado|sigue leyendo|para más información|las autoridades (continúan|siguen|mantienen)|se mantiene la investigación|en las próximas (horas|semanas|días)|la situación sigue en desarrollo|mantente al tanto)/i;
const CLICKBAIT = /(no vas a creer|te sorprenderá|increíble|impactante|esto es lo que|descubre|¡|!|impactó a todos|dejó a todos)/i;
const SENSITIVE = /fallec|muert|muri[oó]|murieron|deceso|occiso|homicidio|asesin|femicidio|suicid|violaci[oó]n|abuso sexual|cad[aá]ver|ejecutad|masacre|v[ií]ctima|desaparecid|accidente (fatal|mortal)/i;
const QUOTE_RE = /[“"«]([^”"»]{15,300})[”"»]/g;
const ATTR_VERBS = /(dijo|declaró|afirmó|señaló|indicó|expresó|manifestó|aseguró|comentó|explicó|añadió|agregó|reportó|informó|confirmó|anunció|publicó|detalló|precisó|apuntó|sostuvo|contó|relató|denunció|advirtió)/i;
const OFFICIAL_SOURCES = /(Policía Nacional|Ministerio de (Salud|Educación|Hacienda|Gobernación|Defensa|Trabajo)|MINSA|MINED|INETER|INIFOM|Corte Suprema de Justicia|Consejo Supremo Electoral|Banco Central|INIDE|ENACAL|INEA|SINAPRED|Bomberos Unidos|Cruz Roja|Ejército de Nicaragua|Fiscalía|Procuraduría|Asamblea Nacional|Alcaldía de|OPS|OMS|\bONU\b|UNESCO|UNICEF|PNUD|Banco Mundial|FMI|BID|\bEFE\b|Reuters|Associated Press|\bAP\b|\bAFP\b|Bloomberg|\bCNN\b|\bBBC\b|ESPN|CONCACAF|FIFA|FIBA|La Prensa|Confidencial|El Nuevo Diario|100% Noticias|Canal 8|Canal 10|Canal 4|VOS TV|Radio Corporación|MITRAB|INSS|DGII|INTA|\bMAG\b|MARENA|COPECO|CONAIP|DGME|MIGOB|INVUR|Vientos del Norte|Conmebol|NBA|MLB|UEFA|FEDEFUT|Real Estelí|Fenifut)/gi;
const ARTIFACTS = /(oaicite|contentReference|iphone duo|lorem ipsum|texto de ejemplo|\[Nombre|\[Fecha|\[Lugar)/i;
const MOJIBAKE = /Ã[€­±³©®¨ª´º¼½¾]|Â[°´ªº]|â€[œ™]|Ã±|Ã¼/g;
const NUM_CLAIM = /(\d[\d.,]*\s*(%|por ciento|millones|mil millones|personas|habitantes|fallecidos|heridos|casos|contagiados|vacunados|córdobas|dólares|toneladas|hectáreas|kilómetros))/g;
const ANALYST_NAME = /(el|la) (analista|experto|especialista|consultor|economista|politólogo|sociólogo|abogado)(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?/g;

function toDate(v) {
  if (!v) return null;
  if (typeof v === 'string') { const d = new Date(v); return isNaN(d) ? null : d; }
  if (v && v._seconds) return new Date(v._seconds * 1000);
  return null;
}
function paragraphs(html) {
  return [...String(html || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripHtml(m[1])).filter((p) => p.length > 25);
}

const records = [];
const paraIndex = new Map();
for (const [i, d] of arts.entries()) {
  const bodyText = stripHtml(d.contenido);
  const paras = paragraphs(d.contenido);
  const fecha = toDate(d.fecha) || toDate(d.publishedAt) || toDate(d.fechaActualizacion);
  const links = [...String(d.contenido || '').matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const externalLinks = links.filter((l) => /^https?:\/\//.test(l) && !l.includes('nicaraguainformate.com'));
  const internalLinks = links.filter((l) => l.startsWith('/') || l.includes('nicaraguainformate.com/noticias/'));
  const vague = [];
  for (const re of VAGUE_ATTR) { const m = bodyText.match(re); if (m) vague.push(...m.map((x) => x.slice(0, 60))); }
  const filler = [];
  for (const re of FILLER) { const m = bodyText.match(re); if (m) filler.push(...new Set(m)); }
  const quotes = [...bodyText.matchAll(QUOTE_RE)].map((m) => m[1]);
  const quotesNoAttr = quotes.filter((q) => {
    const idx = bodyText.indexOf(q);
    const w = bodyText.slice(Math.max(0, idx - 200), idx + q.length + 200);
    return !ATTR_VERBS.test(w);
  });
  const official = [...new Set((bodyText.match(OFFICIAL_SOURCES) || []).map((s) => s.toLowerCase()))];
  const numClaims = (bodyText.match(NUM_CLAIM) || []).length;
  const sents = bodyText.split(/(?<=[.!?])\s+/).map(norm).filter((s) => wc(s) >= 7);
  const sentCount = new Map();
  for (const s of sents) sentCount.set(s, (sentCount.get(s) || 0) + 1);
  const dupSents = [...sentCount.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0);
  const lastPara = paras[paras.length - 1] || '';
  const mojibake = (bodyText.match(MOJIBAKE) || []).length;
  const analysts = [...bodyText.matchAll(ANALYST_NAME)].map((m) => m[0]);
  for (const p of paras) {
    const np = norm(p);
    if (np.split(' ').length >= 8) {
      if (!paraIndex.has(np)) paraIndex.set(np, []);
      paraIndex.get(np).push(i);
    }
  }
  const fc = Array.isArray(d.fuentesComplementarias) ? d.fuentesComplementarias : [];
  const fcValid = fc.filter((f) => typeof f === 'string' && f.trim().length > 2);
  let sourceLevel = 'F0';
  const identifiable = official.length + (externalLinks.length > 0 ? 1 : 0) + fcValid.length;
  if (identifiable >= 2) sourceLevel = 'F4';
  else if (official.length >= 1 || externalLinks.length >= 1 || fcValid.length >= 1) sourceLevel = 'F3';
  if (sourceLevel === 'F0' && vague.length > 0) sourceLevel = 'F1';
  else if (sourceLevel === 'F3' && vague.length > 2) sourceLevel = 'F2';

  records.push({
    idx: i, id: d.id, slug: d.slug, titulo: d.titulo,
    url: `https://nicaraguainformate.com/noticias/${d.slug}`,
    fecha: fecha ? fecha.toISOString().slice(0, 10) : null,
    categoria: d.categoria, autor: d.autor, departamento: d.departamento,
    palabras: wc(bodyText), scoreMeni: d.scoreMeni ?? null, nivel: d.nivel ?? null,
    editorialTier: d.editorialTier ?? null, aiRiskScore: d.aiRiskScore ?? null,
    fuente: d.fuente || null, fuentesComp: fcValid, externalLinks: externalLinks.length,
    externalDomains: [...new Set(externalLinks.map((l) => { try { return new URL(l).hostname; } catch { return l; } }))],
    internalLinks: internalLinks.length, imagen: !!d.imagen, noindex: !!d.noindex,
    vagueAttr: vague, filler, fillerCount: filler.length,
    quotes: quotes.length, quotesNoAttr: quotesNoAttr.length,
    quotesNoAttrSample: quotesNoAttr.slice(0, 2), official, numClaims, dupSents,
    lastParaGeneric: GENERIC_CLOSER.test(lastPara), mojibake,
    artifact: ARTIFACTS.test(bodyText), analysts,
    resumen: stripHtml(d.resumen || ''), sensitive: SENSITIVE.test((d.titulo || '') + ' ' + bodyText.slice(0, 2000)),
    titleLen: (d.titulo || '').length, clickbait: CLICKBAIT.test(d.titulo || ''),
    paraCount: paras.length, sourceLevel, bodyText,
  });
}

const sharedParas = [];
for (const [np, idxs] of paraIndex) {
  const uniq = [...new Set(idxs)];
  if (uniq.length >= 2) sharedParas.push({ para: np.slice(0, 140), docs: uniq, count: uniq.length });
}
sharedParas.sort((a, b) => b.count - a.count);

const STOP = new Set('de la el en y a los del se las por un para con no una su al lo como mas pero sus le ya o este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mi antes algunos que unos yo otro otras otra tanto esa estos mucho quienes nada muchos cual sea poco ella estar haber estas estaba estamos algunas algo nosotros mis tu te ti tus ellas os mio mia tuyo tuya suyo suya nuestro nuestra esos esas estoy estan este sera seran fue eran era son es'.split(' '));
function simhash(text) {
  const words = norm(text).split(' ').filter((w) => w.length > 3 && !STOP.has(w));
  const v = new Float64Array(64);
  for (let i = 0; i + 2 < words.length; i++) {
    const h = createHash('md5').update(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]).digest();
    for (let b = 0; b < 8; b++) for (let bit = 0; bit < 8; bit++) v[b * 8 + bit] += (h[b] & (1 << bit)) ? 1 : -1;
  }
  let hash = 0n;
  for (let b = 0; b < 64; b++) if (v[b] > 0) hash |= (1n << BigInt(b));
  return hash;
}
const hamming = (a, b) => { let x = a ^ b, c = 0; while (x) { c += Number(x & 1n); x >>= 1n; } return c; };
const sims = records.map((r) => simhash(r.bodyText));
const bands = new Map();
sims.forEach((h, i) => {
  for (let b = 0; b < 4; b++) {
    const key = b + ':' + ((h >> BigInt(b * 16)) & 0xffffn).toString();
    if (!bands.has(key)) bands.set(key, []);
    bands.get(key).push(i);
  }
});
const pairSet = new Set();
for (const idxs of bands.values()) for (let a = 0; a < idxs.length; a++) for (let b = a + 1; b < idxs.length; b++) pairSet.add(idxs[a] + '|' + idxs[b]);
function shingles5(text) {
  const words = norm(text).split(' ').filter(Boolean);
  const s = new Set();
  for (let i = 0; i + 4 < words.length; i++) s.add(words.slice(i, i + 5).join(' '));
  return s;
}
const shingleCache = records.map((r) => shingles5(r.bodyText));
const nearDups = [];
for (const p of pairSet) {
  const [a, b] = p.split('|').map(Number);
  if (hamming(sims[a], sims[b]) > 8) continue;
  const A = shingleCache[a], B = shingleCache[b];
  let inter = 0; for (const s of A) if (B.has(s)) inter++;
  const jac = inter / (A.size + B.size - inter || 1);
  if (jac > 0.30) nearDups.push({ a, b, jaccard: +jac.toFixed(3), slugA: records[a].slug, slugB: records[b].slug });
}
nearDups.sort((x, y) => y.jaccard - x.jaccard);
const sameEvent = [];
for (let a = 0; a < records.length; a++) for (let b = a + 1; b < records.length; b++) {
  const t = jaccard(records[a].titulo || '', records[b].titulo || '');
  if (t > 0.55) sameEvent.push({ a, b, titleJac: +t.toFixed(3), slugA: records[a].slug, slugB: records[b].slug, tA: records[a].titulo, tB: records[b].titulo });
}
sameEvent.sort((x, y) => y.titleJac - x.titleJac);
for (const r of records) delete r.bodyText;
writeFileSync('.audit/analysis.json', JSON.stringify({ records, sharedParas, nearDups, sameEvent }, null, 1));

const dist = (arr, k) => { const o = {}; for (const x of arr) o[x[k]] = (o[x[k]] || 0) + 1; return o; };
console.log('Analizados:', records.length);
console.log('<200 palabras:', records.filter((r) => r.palabras < 200).length, '| <300:', records.filter((r) => r.palabras < 300).length);
console.log('Atribución vaga:', records.filter((r) => r.vagueAttr.length > 0).length, '| >=3:', records.filter((r) => r.vagueAttr.length >= 3).length);
console.log('Filler >=3 frases:', records.filter((r) => r.fillerCount >= 3).length);
console.log('Cierre genérico:', records.filter((r) => r.lastParaGeneric).length);
console.log('Citas sin atribución:', records.filter((r) => r.quotesNoAttr > 0).length);
console.log('Sin enlaces internos:', records.filter((r) => r.internalLinks === 0).length);
console.log('Sin imagen:', records.filter((r) => !r.imagen).length);
console.log('Mojibake:', records.filter((r) => r.mojibake > 0).length, '| Artefactos:', records.filter((r) => r.artifact).length);
console.log('Clickbait:', records.filter((r) => r.clickbait).length, '| Titulo>90:', records.filter((r) => r.titleLen > 90).length, '| <25:', records.filter((r) => r.titleLen < 25).length);
console.log('Oraciones repetidas internas:', records.filter((r) => r.dupSents > 0).length);
console.log('Near-dup >0.30:', nearDups.length, '| >0.60:', nearDups.filter((n) => n.jaccard > 0.6).length, '| >0.85:', nearDups.filter((n) => n.jaccard > 0.85).length);
console.log('Mismo-evento (titulo>0.55):', sameEvent.length);
console.log('Párrafos idénticos cross-doc:', sharedParas.length, '| en >=4 docs:', sharedParas.filter((p) => p.count >= 4).length);
console.log('noindex publicados:', records.filter((r) => r.noindex).length);
console.log('sourceLevels:', JSON.stringify(dist(records, 'sourceLevel')));
const sm = records.map((r) => r.scoreMeni ?? -1);
console.log('scoreMeni min/max:', Math.min(...sm), Math.max(...sm));
