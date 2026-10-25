// repair-dedup-e.mjs — deduplicación de los 3 artículos E (párrafo-plantilla x42)
// Regla: conservar la PRIMERA aparición de cada <p> exactamente idéntico y
// eliminar únicamente copias posteriores byte-idénticas. El conjunto de
// párrafos únicos (por texto) no puede cambiar: verificado antes y después.
// SIMULACIÓN por defecto. --apply bajo autorización expresa.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) });
const db = getFirestore();

const SLUGS = [
  'investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields',
  'tres-ataques-de-pitbull-en-nicaragua-dejan-tres-lesionados',
  'dos-fallecidos-en-accidentes-ocurridos-en-matagalpa-y-wiwili',
];

const sha = s => createHash('sha256').update(String(s)).digest('hex');
const shaDoc = d => sha([d.titulo, d.resumen, d.contenido].join(''));
const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const P_RE = /<p>.*?<\/p>/gs;

// Dedup: conserva primera copia exacta de cada <p>; lo demás intacto.
function dedup(html) {
  const seen = new Set();
  let eliminados = 0;
  const out = html.replace(P_RE, p => {
    const key = strip(p);
    if (seen.has(key)) { eliminados++; return ''; }
    seen.add(key);
    return p;
  });
  return { out, eliminados };
}

const corpus = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const bySlug = new Map(corpus.map(d => [d.slug, d.id]));

console.log(`\n=== DEDUP ARTÍCULOS E ${APPLY ? '(APLICAR)' : '(SIMULACIÓN)'} ===\n`);
const resultados = [];
for (const slug of SLUGS) {
  const id = bySlug.get(slug);
  const snap = await db.collection('noticias').doc(id).get();
  const d = snap.data();
  const base = { id, slug, shaAntes: shaDoc(d), contenidoOriginal: d.contenido, reparacionForense: d.reparacionForense || null };
  if (d.reparacionForense?.dedupE?.aplicado) { resultados.push({ ...base, estado: 'OMITIDO', razon: 'ya procesado (idempotente)' }); continue; }

  const antes = String(d.contenido);
  const uniqAntes = new Set((antes.match(P_RE) || []).map(strip));
  const { out, eliminados } = dedup(antes);
  const uniqDespues = new Set((out.match(P_RE) || []).map(strip));

  // Verificación de cero pérdida: mismo conjunto de párrafos únicos
  if (uniqAntes.size !== uniqDespues.size || [...uniqAntes].some(u => !uniqDespues.has(u))) {
    resultados.push({ ...base, estado: 'ABORTADO', razon: 'dedup alteraría contenido único' });
    continue;
  }

  base.antes = { chars: antes.length, parrafos: (antes.match(P_RE) || []).length, unicos: uniqAntes.size };
  base.despues = { chars: out.length, parrafos: (out.match(P_RE) || []).length, unicos: uniqDespues.size };
  base.eliminados = eliminados;

  if (eliminados === 0) { resultados.push({ ...base, estado: 'SIN_DUPLICADOS' }); continue; }
  if (APPLY) {
    await snap.ref.update({
      contenido: out,
      'reparacionForense.dedupE': { aplicado: true, fecha: new Date().toISOString(), regla: 'dedup-parrafo-plantilla-x42', parrafosEliminados: eliminados },
      requiresReevaluation: true,
    });
    const post = (await snap.ref.get()).data();
    base.shaDespues = shaDoc(post);
    base.estado = post.contenido === out ? 'APLICADO+VERIFICADO' : 'ERROR-POSTLECTURA';
  } else {
    base.estado = 'APLICABLE';
    base.shaDespues = shaDoc({ ...d, contenido: out });
  }
  resultados.push(base);
}

const resumen = {};
for (const r of resultados) resumen[r.estado] = (resumen[r.estado] || 0) + 1;
console.log(JSON.stringify(resumen));
for (const r of resultados) {
  console.log(`${r.estado.padEnd(20)} ${r.slug}${r.eliminados != null ? ` | ${r.antes.parrafos}→${r.despues.parrafos} párrafos (${r.eliminados} eliminados, ${r.antes.unicos} únicos intactos)` : ` — ${r.razon || ''}`}`);
}
mkdirSync('.audit', { recursive: true });
writeFileSync(APPLY ? '.audit/repair-dedup-e-backup.json' : '.audit/repair-dedup-e-simulacion.json',
  JSON.stringify({ fecha: new Date().toISOString(), aplicar: APPLY, resumen, resultados }, null, 2));
console.log(`\nLog: .audit/repair-dedup-e-${APPLY ? 'backup' : 'simulacion'}.json`);
process.exit(0);
