// Reparación fase 2 — parches curados manualmente tras revisar las 47 ocurrencias REVIEW.
// Cada entrada es un par {find, replace} verificado contra el contexto del artículo.
// find tolera tags inline (</strong> etc.) entre palabras.
// Uso: node scripts/repair-afectado-p2.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');

// Decisión editorial por ocurrencia (revisada una a una contra el contexto):
const PATCHES = {
  'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte': [
    ['la afectación de Juan Antonio Morales Rocha', 'la muerte de Juan Antonio Morales Rocha'],
    // campesino atropellado: no se puede verificar si murió → NO se toca (pendiente humano)
  ],
  'cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una': [
    ['resultaron afectados durante la última semana', 'murieron durante la última semana'],
  ],
  'nicaraguense-fallece-en-accidente-laboral-en-wisconsin': [
    ['resultó afectado', 'falleció'],
  ],
  'dos-hombres-pierden-la-vida-en-incidentes-nocturnos-en-el-norte': [
    ['resultó gravemente afectado durante un incidente', 'perdió la vida durante un incidente'],
  ],
  'investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields': [
    ['afectadas punzocortantes', 'heridas punzocortantes'],
    ['la persona afectada no se metia', 'el fallecido no se metía'],
    ['Familiares del afectado', 'Familiares del fallecido'],
  ],
  'dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami': [
    ['resultaron afectados en hechos separados', 'fallecieron en hechos separados'],
  ],
  'tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada': [
    ['Kenneth Silva Roca resultó gravemente afectado', 'Kenneth Silva Roca falleció'],
    ['resultó afectado su hermano, Asdierick Roca', 'resultó herido su hermano, Asdierick Roca'],
    ['la afectación del peatón José Miguel Martínez', 'la muerte del peatón José Miguel Martínez'],
  ],
  'dos-hombres-mueren-por-descargas-electricas-en-managua': [
    ['resultaron afectados por descargas eléctricas', 'murieron por descargas eléctricas'],
  ],
  'accidente-laboral-deja-un-fallecido-y-un-lesionado-en-managua-y-estel': [
    // El titular propio del artículo confirma: un fallecido (Managua, trauma craneal) y un lesionado (Estelí, hospitalizado).
    ['Un hombre resultó gravemente afectado y otro resultó gravemente afectado', 'Un hombre murió y otro resultó lesionado'],
    ['resultó gravemente afectado en el lugar', 'murió en el lugar'],
  ],
  'dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua': [
    // Bonilla: "una descarga eléctrica que le provocó la muerte de forma inmediata" → murió.
    ['resultó gravemente afectado la tarde del viernes', 'murió la tarde del viernes'],
  ],
  'comerciante-fallece-tras-altercado-en-terminal-de-rosita': [
    // Falleció + "afectada provocada con arma blanca" era "herida".
    ['resultó gravemente afectado a consecuencia de una afectada provocada', 'falleció a consecuencia de una herida provocada'],
  ],
  'fin-de-semana-deja-ocho-fallecidos-en-accidentes-viales': [
    ['Ocho personas resultaron afectados', 'Ocho personas fallecieron'],
  ],
  'tres-motociclistas-mueren-en-accidentes-de-transito-en-nicaragua': [
    ['Tres personas resultaron afectados', 'Tres personas murieron'],
    ['también resultó gravemente afectado un motociclista', 'también murió un motociclista'],
  ],
  'naufragio-en-caribe-norte-deja-mujer-muerta-y-dos-ninos-desaparecidos': [
    // "Ambos cuerpos fueron recuperados por la Fuerza Naval" → murieron.
    ['Dos personas resultaron afectados y otras dos sobrevivieron', 'Dos personas murieron y otras dos sobrevivieron'],
    ['Las personas afectadas fueron identificadas', 'Las personas fallecidas fueron identificadas'],
  ],
  'doctora-nicaraguense-muere-en-ataque-armado-en-poptun-peten': [
    // Rosa Cohuoj era la acompañante — la médica (muerta) era otra persona → herida.
    ['quien resultó afectada durante el incidente', 'quien resultó herida durante el incidente'],
  ],
  'dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua': [
    ['Al menos dos personas resultaron afectados y varias', 'Al menos dos personas fallecieron y varias'],
    // menor de 12 años hospitalizado con traumatismos → herido.
    ['resultó gravemente afectado un menor de 12 años', 'resultó gravemente herido un menor de 12 años'],
  ],
  'lluvias-vientos-y-rayos-dejan-danos-y-dos-fallecidos': [
    ['dos trabajadores resultaron afectados tras ser alcanzados por rayos', 'dos trabajadores fallecieron tras ser alcanzados por rayos'],
    ['resultó gravemente afectado la mañana del 19 de junio', 'falleció la mañana del 19 de junio'],
  ],
  'estudiante-de-13-anos-muere-tras-golpe-en-escuela-de-diriomo': [
    // Primero fue herido, murió después en el centro de salud → "gravemente herido" es lo exacto.
    ['resultó gravemente afectado la mañana de este martes', 'resultó gravemente herido la mañana de este martes'],
  ],
  'nicaraguense-jose-salgado-muere-en-asalto-en-austin': [
    ['fue gravemente afectado la noche del lunes', 'murió la noche del lunes'],
  ],
  'nicaraguenses-mueren-en-hechos-violentos-registrados-en-costa-rica': [
    ['resultaron afectados esta semana en distintos hechos graves', 'murieron esta semana en distintos hechos graves'],
  ],
  'dos-fallecidos-en-accidentes-ocurridos-en-matagalpa-y-wiwili': [
    ['confirmó la afectación de José Rodolfo Moreno Palacios', 'confirmó la muerte de José Rodolfo Moreno Palacios'],
    ['la madre de la persona afectada', 'la madre del fallecido'],
  ],
  'esteliana-fallece-ahogada-en-playa-de-san-sebastian-espana': [
    ['La afectación de Yiran Guadalupe Rodríguez', 'La muerte de Yiran Guadalupe Rodríguez'],
  ],
  // SIN cambios deliberados:
  // panama-…-27-heridos: "viviendas, escuelas y centros de salud resultaron afectados" — edificios, uso CORRECTO.
  // mas-de-470-muertos…: "proyectos hidroeléctricos… resultaron afectados" — infraestructura, uso CORRECTO.
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const flexRe = (phrase) => new RegExp(
  phrase.split(/\s+/).map(escapeRe).join(`(?:\\s*(?:<\\/(?:strong|em|b|i|span)>\\s*)?|<(?:strong|em|b|i|span)[^>]*>\\s*|\\s+)`), 'gi'
);

const corpus = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const plan = [];
for (const [slug, patches] of Object.entries(PATCHES)) {
  const d = corpus.find((x) => x.slug === slug);
  if (!d) { plan.push({ slug, error: 'no encontrado en corpus' }); continue; }
  // El contenido en DB ya puede incluir parches de fase 1 — trabajamos sobre el estado FRESCO si existe, sino sobre el export.
  const updates = [];
  for (const field of ['titulo', 'resumen', 'contenido']) {
    let text = String(d[field] || '');
    for (const [find, replace] of patches) {
      const re = flexRe(find);
      const matches = text.match(re) || [];
      if (matches.length) {
        updates.push({ field, find, replace, ocurrencias: matches.length });
        text = text.replace(re, replace);
      }
    }
    if (updates.length) {
      // marcar último update con el texto resultante
    }
    d[`__new_${field}`] = text;
  }
  plan.push({ slug, id: d.id, cambios: updates, newFields: { titulo: d.__new_titulo, resumen: d.__new_resumen, contenido: d.__new_contenido } });
}

const total = plan.reduce((a, p) => a + (p.cambios || []).reduce((b, c) => b + c.ocurrencias, 0), 0);
console.log(`Parches: ${plan.filter((p) => (p.cambios || []).length).length} artículos | ${total} reemplazos`);
plan.forEach((p) => console.log(' ', p.slug, '→', (p.cambios || []).length, 'parches', p.error || ''));

if (!APPLY) {
  writeFileSync('.audit/repair-afectado-p2-propuesta.json', JSON.stringify(plan.map((p) => ({ slug: p.slug, cambios: p.cambios })), null, 1));
  process.exit(0);
}

const envText = (() => { try { return readFileSync('.env.local', 'utf8'); } catch { return readFileSync('.env.vercel-prod', 'utf8'); } })();
const env = Object.fromEntries(envText.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!b64) { console.error('Falta FIREBASE_SERVICE_ACCOUNT_BASE64'); process.exit(1); }
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))) });
const db = getFirestore();
const log = [];
for (const p of plan) {
  if (p.error || !(p.cambios || []).length) continue;
  // Estado fresco de DB (puede contener fase 1) — re-aplicar parches sobre el texto actual.
  const snap = await db.collection('noticias').doc(p.id).get();
  const cur = snap.data();
  const update = {};
  let n = 0;
  for (const field of ['titulo', 'resumen', 'contenido']) {
    let text = String(cur[field] || '');
    for (const [find, replace] of PATCHES[p.slug]) {
      text = text.replace(flexRe(find), replace);
    }
    if (text !== String(cur[field] || '')) { update[field] = text; n++; }
  }
  if (!n) { log.push({ slug: p.slug, estado: 'YA-REPARADO' }); continue; }
  update.requiresReevaluation = true;
  update['reparacionForense.fase2'] = { fecha: new Date().toISOString(), regla: 'afectado-revision-manual-47', parches: p.cambios.length };
  await db.collection('noticias').doc(p.id).update(update);
  log.push({ slug: p.slug, estado: 'APLICADO', campos: n, cambios: p.cambios });
  console.log('aplicado:', p.slug, `(${n} campos)`);
}
writeFileSync('.audit/repair-afectado-p2-log.json', JSON.stringify(log, null, 1));
console.log(`Aplicados ${log.filter((l) => l.estado === 'APLICADO').length}. Log: .audit/repair-afectado-p2-log.json`);
process.exit(0);
