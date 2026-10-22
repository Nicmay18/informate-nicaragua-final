// Reparación del eufemismo "afectado" (autopsia forense, 29 artículos aprobados).
// Uso: node scripts/repair-afectado.mjs          → dry-run (propuesta, no escribe)
//      node scripts/repair-afectado.mjs --apply  → aplica cambios HIGH-confidence a Firestore
// Log completo antes/después en .audit/repair-afectado-log.json (reversible).
import { readFileSync, writeFileSync } from 'node:fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');

// ── corpus local (fuente de propuestas) ──
const corpus = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const autopsy = JSON.parse(readFileSync('FORENSIC_ARTICLE_AUTOPSY.json', 'utf8'));
const SLUGS = autopsy.fichas
  .filter((f) => f.señales.some((s) => s.c.includes('EUFEMISMO') || s.c === 'TITULO_CONTRADICE_CUERPO' || s.c === 'TEXTO_INCOHERENTE'))
  .map((f) => f.slug);

const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const normT = (s) => s.toLowerCase();
const DEATH_LOCAL = /muerte|fallec|deceso|occiso|cuerpo|autopsia|medicina legal|cad[aá]ver|sin vida|perdi[oó] la vida|v[ií]ctima mortal|fatal|murieron|murio|muerte/i;
const INJURY_LOCAL = /herid|lesion|hospitaliz|recuper|sobreviv|atendid|estable|grave de salud/i;

// Elección de término por slug (la URL es la fuente de verdad del hecho)
function verbPasado(slug, pl) {
  if (/pierden-la-vida/.test(slug)) return pl ? 'perdieron la vida' : 'perdió la vida';
  if (/ahog/.test(slug)) return pl ? 'murieron ahogadas' : 'murió ahogada';
  if (/fallec/.test(slug)) return pl ? 'fallecieron' : 'falleció';
  return pl ? 'murieron' : 'murió';
}
function verbPresente(slug, pl) {
  if (/pierden-la-vida/.test(slug)) return pl ? 'pierden la vida' : 'pierde la vida';
  if (/ahog/.test(slug)) return pl ? 'mueren ahogadas' : 'muere ahogada';
  if (/fallec/.test(slug)) return pl ? 'fallecen' : 'fallece';
  return pl ? 'mueren' : 'muere';
}
function nounMuertos(slug, fem) {
  if (/fallec/.test(slug)) return fem ? 'fallecidas' : 'fallecidos';
  return fem ? 'muertas' : 'muertos';
}
const slugIsInjuryOnly = (slug) => /herid|lesion/.test(slug) && !/muer|fallec|muert|ahog|deceso|occiso|vida/i.test(slug);

// Reglas sobre texto (titulo/resumen) y HTML (contenido). Cada regla: {id, conf, apply(text, slug)}
const RESULT_AFECT = /(result(?:ó|aron|aba|aban)?|qued(?:ó|aron)|fue|fueron|hallad[oa]s?|encontrad[oa]s?|reportad[oa]s?|registrad[oa]s?|suman|ascienden?)\s+((?:gravemente|levemente|seriamente)\s+)?afectad([oa])(s)?\b/gi;

function repairText(text, slug, field, changes) {
  let out = text;
  const push = (rule, antes, despues, conf) => changes.push({ field, rule, conf, antes: antes.slice(0, 160), despues: despues.slice(0, 160) });

  // R1 — doble eufemismo en la misma cifra: "164 afectados y 971 afectados"
  out = out.replace(/(\d[\d.,]*)\s*afectados?\s+y\s+([\d.,]+(?:\s*mil)?)\s*afectados?\b/gi, (m, n1, n2) => {
    const rep = `${n1} fallecidos y ${n2} heridos`;
    push('DOBLE_AFECTADOS', m, rep, 'HIGH');
    return rep;
  });

  // R2 — gramática rota: "el/del persona gravemente afectada"
  out = out.replace(/\b(el|del)\s+persona\s+(?:gravemente\s+)?afectada\b/gi, (m, art) => {
    const rep = `${art} fallecimiento`;
    push('PERSONA_AFECTADA_ROTO', m, rep, 'HIGH');
    return rep;
  });

  // R3 — "hallado afectad*": persona encontrada muerta
  out = out.replace(/\b(hallad|encontrad)([oa])s?\s+afectad[oa]s?\b/gi, (m, v, g) => {
    const rep = `${v}${g} sin vida`;
    push('HALLADO_AFECTADO', m, rep, 'HIGH');
    return rep;
  });

  // R4 — "cifra/número de afectados" con contexto de muerte
  out = out.replace(/\b(cifra|número|total|saldo|conteo) de afectados\b/gi, (m, w) => {
    const rep = `${w} de fallecidos`;
    push('CIFRA_AFECTADOS', m, rep, 'HIGH');
    return rep;
  });

  // R5 — "causas (exactas )?de la afectación" en doc de muerte
  out = out.replace(/\bcausas\s+(exactas\s+)?de\s+(la|del)\s+afectación\b/gi, (m, ex, art) => {
    const rep = `causas ${ex || ''}de ${art === 'del' ? 'l' : art} muerte`.replace('de l muerte', 'la muerte');
    push('CAUSAS_AFECTACION', m, rep, 'HIGH');
    return rep;
  });

  // R6 — verbos + "afectad*": decisión por contexto local (±150 chars).
  // Solo HIGH se aplica al texto; REVIEW se propone pero queda intacto.
  out = out.replace(RESULT_AFECT, (m, verb, intens, g, pl, offset) => {
    const win = text.slice(Math.max(0, offset - 150), offset + m.length + 150);
    const pl2 = !!pl || /aron|fueron|suman|ascienden/i.test(verb);
    if (INJURY_LOCAL.test(win) && !DEATH_LOCAL.test(win)) {
      const rep = `${verb} ${intens || ''}herid${g === 'a' ? 'a' : 'o'}${pl2 ? 's' : ''}`;
      push('VERBO_AFECTADO→HERIDO', m, rep, 'REVIEW');
      return m;
    }
    if (DEATH_LOCAL.test(win) || !INJURY_LOCAL.test(win)) {
      const conf = DEATH_LOCAL.test(win) ? 'HIGH' : 'REVIEW';
      const rep = slugIsInjuryOnly(slug)
        ? `${verb} ${intens || ''}herid${g === 'a' ? 'a' : 'o'}${pl2 ? 's' : ''}`
        : verbPasado(slug, pl2);
      push('VERBO_AFECTADO→MUERTE', m, rep, conf);
      return conf === 'HIGH' ? rep : m;
    }
    push('VERBO_AFECTADO_AMBIGUO', m, m, 'REVIEW');
    return m;
  });

  // R7 — "afectación/afectaciones" como sustantivo de muerte/lesión (review)
  out = out.replace(/\b(la|las|de la|de las|una|causa[s]? de la)\s+afectaci[oó]n\b/gi, (m, art) => {
    const win = text.slice(Math.max(0, out.indexOf(m) - 150));
    push('AFECTACION_SUSTANTIVO', m, m, 'REVIEW');
    return m; // no se toca automáticamente
  });

  return out;
}

function repairTitle(title, slug, changes) {
  let t = title;
  const push = (rule, antes, despues) => changes.push({ field: 'titulo', rule, conf: 'HIGH', antes: antes.slice(0, 160), despues: despues.slice(0, 160) });
  const fem = /(mujer|doctora|esteliana|estudianta|adolescente|víctima|persona|afectada|fallecida|muerta)/i.test(t) ? 'f' : 'm';
  // "resulta(n) (gravemente )?afectad*"
  t = t.replace(/\bresulta(n)?\s+(gravemente\s+)?afectad[oa]s?\b/gi, (m, pl) => {
    const rep = verbPresente(slug, !!pl || /s\b/i.test(m));
    push('TIT_VERBO', m, rep);
    return rep;
  });
  // "resultó/resultaron (gravemente )?afectad*"
  t = t.replace(/\bresult(ó|aron)\s+(gravemente\s+)?afectad[oa]s?\b/gi, (m, p) => {
    const rep = verbPasado(slug, p === 'aron' || /s\b/i.test(m));
    push('TIT_VERBO_PASADO', m, rep);
    return rep;
  });
  // "afectad*" suelto → muertos/fallecidos
  t = t.replace(/\bafectad([oa])s?\b/gi, (m, g) => {
    const rep = nounMuertos(slug, g === 'a' || fem === 'f');
    push('TIT_NOMBRE', m, rep);
    return rep;
  });
  // "por afectación" en título de nota de muerte → "por fallecimiento"
  t = t.replace(/\bpor afectaci[oó]n\b/gi, (m) => {
    const rep = /fallec|muer|muert|ahog|vida/i.test(slug) ? 'por fallecimiento' : m;
    if (rep !== m) push('TIT_AFECTACION', m, rep);
    return rep;
  });
  return t;
}

const results = [];
for (const slug of SLUGS) {
  const d = corpus.find((x) => x.slug === slug);
  if (!d) { results.push({ slug, error: 'no en corpus' }); continue; }
  const changes = [];
  const newTitulo = repairTitle(String(d.titulo || ''), slug, changes);
  const newResumen = repairText(String(d.resumen || ''), slug, 'resumen', changes);
  // El bloque "También te puede interesar" incrusta titulares de OTRAS
  // noticias — repararlo aquí desincroniza con el título real de cada nota.
  // Se separa, se repara solo el cuerpo propio y se re-anexa intacto.
  const relMarker = /también te puede interesar/i;
  const rawContenido = String(d.contenido || '');
  const relIdx = rawContenido.search(relMarker);
  const cuerpoPropio = relIdx >= 0 ? rawContenido.slice(0, relIdx) : rawContenido;
  const bloqueRelacionadas = relIdx >= 0 ? rawContenido.slice(relIdx) : '';
  const newContenido = repairText(cuerpoPropio, slug, 'contenido', changes) + bloqueRelacionadas;
  const review = changes.filter((c) => c.conf === 'REVIEW').length;
  const high = changes.length - review;
  results.push({
    id: d.id, slug, tituloAntes: d.titulo, tituloDespues: newTitulo,
    totalCambios: changes.length, high, review, cambios: changes,
    fields: { titulo: newTitulo !== d.titulo ? newTitulo : null, resumen: newResumen !== d.resumen ? newResumen : null, contenido: newContenido !== d.contenido ? newContenido : null },
  });
}

const totHigh = results.reduce((a, r) => a + (r.high || 0), 0);
const totRev = results.reduce((a, r) => a + (r.review || 0), 0);
console.log(`Artículos: ${results.length} | cambios HIGH: ${totHigh} | REVIEW (no aplicados): ${totRev}`);

if (!APPLY) {
  writeFileSync('.audit/repair-afectado-propuesta.json', JSON.stringify(results, null, 1));
  console.log('Propuesta en .audit/repair-afectado-propuesta.json');
  for (const r of results) console.log(`${r.slug} | ${r.high}HIGH/${r.review}REV | "${r.tituloAntes?.slice(0, 55)}" → "${r.tituloDespues?.slice(0, 55)}"`);
  process.exit(0);
}

// ── APPLY ──
const envText = (() => { try { return readFileSync('.env.local', 'utf8'); } catch { return readFileSync('.env.vercel-prod', 'utf8'); } })();
const env = Object.fromEntries(envText.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!b64) { console.error('Falta FIREBASE_SERVICE_ACCOUNT_BASE64'); process.exit(1); }
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))) });
const db = getFirestore();
const log = [];
for (const r of results) {
  if (r.error || (!r.fields.titulo && !r.fields.resumen && !r.fields.contenido)) continue;
  const hasHigh = r.cambios.some((c) => c.conf === 'HIGH');
  if (!hasHigh) {
    log.push({ slug: r.slug, id: r.id, estado: 'SOLO-REVIEW: sin cambios aplicados — todos requieren verificación humana', cambios: r.cambios });
    continue;
  }
  const update = {};
  if (r.fields.titulo) update.titulo = r.fields.titulo;
  if (r.fields.resumen) update.resumen = r.fields.resumen;
  if (r.fields.contenido) update.contenido = r.fields.contenido;
  update.requiresReevaluation = true;
  update.reparacionForense = { fecha: new Date().toISOString(), regla: 'eufemismo-afectado-autopsia', cambiosAplicados: r.high, pendientesRevision: r.review };
  await db.collection('noticias').doc(r.id).update(update);
  log.push({ slug: r.slug, id: r.id, estado: 'APLICADO', cambios: r.cambios });
  console.log(`aplicado: ${r.slug} (${r.high} HIGH, ${r.review} pendientes)`);
}
const pendientes = results.filter((r) => r.review > 0).map((r) => ({ slug: r.slug, pendientes: r.cambios.filter((c) => c.conf === 'REVIEW') }));
writeFileSync('.audit/repair-afectado-log.json', JSON.stringify(log, null, 1));
writeFileSync('.audit/repair-afectado-pendientes.json', JSON.stringify(pendientes, null, 1));
console.log(`Aplicados ${log.filter((l) => l.estado === 'APLICADO').length} artículos. Log: .audit/repair-afectado-log.json | Pendientes REVIEW: .audit/repair-afectado-pendientes.json`);
process.exit(0);
