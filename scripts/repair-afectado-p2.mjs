// Reparación fase 2 — SOLO casos CONFIRMADO_* de repair-afectado-decisiones.json.
// Default: SIMULACIÓN (nunca escribe). --apply escribe solo tras verificar:
//   1. El doc está en la whitelist de decisiones (articuloId).
//   2. sha256(titulo+resumen+contenido) coincide con el capturado en la auditoría
//      → si el doc cambió desde entonces, se omite y se marca DRIFT.
//   3. reparacionForense.fase2 no existe → protección contra doble ejecución.
// Uso: node scripts/repair-afectado-p2.mjs          → simulación + .audit/repair-afectado-p2-simulacion.json
//      node scripts/repair-afectado-p2.mjs --apply  → aplicar (bloqueado hasta aprobación del propietario)
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');

const decisiones = JSON.parse(readFileSync('repair-afectado-decisiones.json', 'utf8'));
const CONF = decisiones.fichas.filter((f) => f.clasificacion.startsWith('CONFIRMADO') && f.find && f.correccion);

// Parches complementarios CONFIRMADOS en el mismo documento (misma corrupción,
// evidencia explícita del cuerpo — revisados junto a la matriz de 47):
const EXTRA = {
  'tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada': [
    // Ronaldo Espinoza = 3ª víctima del titular (portero Walter Ferretti, Diriamba).
    ['resultó gravemente afectado Ronaldo Jossyel Espinoza López', 'falleció Ronaldo Jossyel Espinoza López'],
  ],
  'investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields': [
    // "afectadas punzocortantes" era "heridas punzocortantes" — el eufemismo también corrompió herida.
    ['afectadas punzocortantes', 'heridas punzocortantes'],
    // "la persona afectada" = Terry Hall Joseph, hallado sin vida.
    ['la persona afectada no se metia', 'el fallecido no se metía'],
    ['Familiares del afectado', 'Familiares del fallecido'],
  ],
  'naufragio-en-caribe-norte-deja-mujer-muerta-y-dos-ninos-desaparecidos': [
    // Las dos "afectadas" identificadas son las cuyos cuerpos fueron recuperados.
    ['Las personas afectadas fueron identificadas', 'Las fallecidas fueron identificadas'],
  ],
  'dos-fallecidos-en-accidentes-ocurridos-en-matagalpa-y-wiwili': [
    // "entrega del cuerpo a la madre" — la madre es del fallecido.
    ['la madre de la persona afectada', 'la madre del fallecido'],
  ],
  'nicaraguense-fallece-en-accidente-laboral-en-wisconsin': [
    // Corrupción adicional: "la resultó afectada" era "la fallecida" (deja 2 huérfanos, deceso confirmado).
    ['los parientes de la resultó afectada', 'los parientes de la fallecida'],
    ['la persona afectada era originaria', 'la fallecida era originaria'],
    ['La persona afectada se dedicaba', 'La fallecida se dedicaba'],
    ['situación familiar de la afectada', 'situación familiar de la fallecida'],
  ],
  'cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una': [
    // Los 4 casos están confirmados en el propio cuerpo (falleció/murió/deceso por nombre).
    ['Las familias de los cuatro afectados', 'Las familias de los cuatro fallecidos'],
    // Kevin Gómez falleció; "persona afectada de un accidente" era "víctima de".
    ['tras ser persona afectada de un accidente', 'tras ser víctima de un accidente'],
    // Repatriación con certificado de defunción = fallecidos.
    ['ciudadanos afectados en el exterior', 'fallecidos en el exterior'],
  ],
  'dos-hombres-mueren-por-descargas-electricas-en-managua': [
    // "la persona afectada" = el hombre que recibió "una descarga eléctrica mortal".
    ['la persona afectada se encontraba realizando labores', 'el fallecido se encontraba realizando labores'],
  ],
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const flexRe = (phrase) => new RegExp(
  phrase.split(/\s+/).map(escapeRe).join(`(?:\\s|<\\/?(?:strong|em|b|i|span)[^>]*>)+`), 'gi'
);
const sha = (o) => createHash('sha256').update(JSON.stringify(o)).digest('hex');

// Patches por doc (solo CONFIRMADO_* + extra confirmados del mismo artículo)
const byDoc = {};
for (const f of CONF) {
  (byDoc[f.articuloId] ||= { slug: f.slug, patches: [], ocurrencias: [] }).patches.push([f.find, f.correccion]);
  byDoc[f.articuloId].ocurrencias.push(f.n);
}
for (const [id, info] of Object.entries(byDoc)) for (const p of EXTRA[info.slug] || []) info.patches.push(p);

const envText = (() => { try { return readFileSync('.env.local', 'utf8'); } catch { return readFileSync('.env.vercel-prod', 'utf8'); } })();
const env = Object.fromEntries(envText.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))) });
const db = getFirestore();

const sim = [];
for (const [id, info] of Object.entries(byDoc)) {
  const snap = await db.collection('noticias').doc(id).get();
  if (!snap.exists) { sim.push({ slug: info.slug, estado: 'DOC_NO_EXISTE' }); continue; }
  const cur = snap.data();
  const entry = { slug: info.slug, id, ocurrenciasDecididas: info.ocurrencias, campos: [], estado: '' };

  // 1. fingerprint — el doc no debe haber cambiado desde la auditoría
  const now = sha({ t: cur.titulo, r: cur.resumen, c: cur.contenido });
  const expected = decisiones.fingerprints?.[id]?.sha256;
  if (expected && now !== expected) { entry.estado = 'DRIFT: cambió desde auditoría → omitido'; sim.push(entry); console.log('DRIFT', info.slug); continue; }

  // 2. doble ejecución
  if (cur.reparacionForense?.fase2) { entry.estado = 'YA-TIENE-FASE2 → omitido'; sim.push(entry); continue; }

  const update = {};
  let hits = 0;
  for (const field of ['titulo', 'resumen', 'contenido']) {
    let text = String(cur[field] || '');
    const before = text;
    for (const [find, replace] of info.patches) text = text.replace(flexRe(find), replace);
    if (text !== before) { update[field] = text; hits++; entry.campos.push(field); }
  }
  entry.estado = hits ? `SIMULADO-OK (${hits} campos)` : 'SIN-COINCIDENCIAS (posible ya-reparado)';
  sim.push(entry);
  if (hits) console.log(`${APPLY ? 'aplicar' : 'simular'}: ${info.slug} → ${entry.campos.join('+')} (${info.patches.length} parches)`);

  if (APPLY && hits) {
    update.requiresReevaluation = true;
    update['reparacionForense.fase2'] = { fecha: new Date().toISOString(), regla: 'afectado-revision-47-CONFIRMADOS', parches: info.patches.length, ocurrencias: info.ocurrencias };
    await db.collection('noticias').doc(id).update(update);
    entry.estado = 'APLICADO';
  }
}

const excluidas = decisiones.fichas.filter((f) => !f.clasificacion.startsWith('CONFIRMADO'));
const resumen = {
  fecha: new Date().toISOString(),
  modo: APPLY ? 'APPLY' : 'SIMULACION',
  docsConParches: Object.keys(byDoc).length,
  aplicables: sim.filter((s) => s.estado.startsWith('SIMULADO') || s.estado === 'APLICADO').length,
  drift: sim.filter((s) => s.estado.startsWith('DRIFT')).length,
  yaProcesados: sim.filter((s) => s.estado.startsWith('YA-')).length,
  excluidasDeAplicar: { AMBIGUO: excluidas.filter((f) => f.clasificacion === 'AMBIGUO').length, MANTENER: excluidas.filter((f) => f.clasificacion === 'MANTENER').length, SIN_EVIDENCIA: excluidas.filter((f) => f.clasificacion === 'SIN_EVIDENCIA').length },
  detalle: sim,
};
writeFileSync('.audit/repair-afectado-p2-simulacion.json', JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ ...resumen, detalle: undefined }, null, 1));
process.exit(0);
