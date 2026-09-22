// READ-ONLY. Censo en caliente NIOS+MENI: notas, colas, ciclos de aprendizaje.
// Uso: node .audit/audit-nios-meni.mjs > .audit/audit-nios-meni.json
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);
let credential;
if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  credential = cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')));
} else {
  credential = cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  });
}
const db = getFirestore(initializeApp({ credential }));

const toMs = (v) => {
  if (v == null) return null;
  if (v instanceof Timestamp) return v.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v._seconds) return v._seconds * 1000;
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? null : t;
};
const daysAgo = (ms) => (ms == null ? null : Math.round((Date.now() - ms) / 86400000));

const out = { generatedAt: new Date().toISOString() };
const safe = async (name, fn) => {
  try { out[name] = await fn(); } catch (e) { out[name] = { ERROR: String(e.message || e).slice(0, 300) }; }
};

// ─── 1. NOTICIAS: censo editorial real ───
await safe('noticias', async () => {
  const snap = await db.collection('noticias').get();
  const r = {
    total: snap.size, publicadas: 0, borradores: 0, archivadas: 0,
    conScoreMeni: 0, sinScoreMeni: 0, aprobadoMeni: 0,
    conCategoria: 0, sinCategoria: 0, conRecomendaciones: 0,
    conDiagnostico: 0, conPreguntas: 0, reevaluadas: 0, editadasPostPublicacion: 0,
    scoreDist: {}, categorias: {}, porVersionMeni: {},
    palabrasBuckets: { '<200': 0, '200-400': 0, '400-700': 0, '700-1200': 0, '>1200': 0 },
    sinImagen: 0, sinAutor: 0, sinResumen: 0, noindex: 0,
  };
  const scoresPorCategoria = {};
  for (const d of snap.docs) {
    const x = d.data();
    const esPublica = x.publicado === true && x.estado === 'publicado' && x.archived !== true;
    if (esPublica) r.publicadas++;
    else if (x.archived === true || x.estado === 'archivado') r.archivadas++;
    else r.borradores++;

    const score = x.scoreMeni ?? x.meniScore ?? x.scoreFinal ?? null;
    if (typeof score === 'number') {
      r.conScoreMeni++;
      const bucket = score >= 90 ? '90-100' : score >= 80 ? '80-89' : score >= 70 ? '70-79' : score >= 60 ? '60-69' : '<60';
      r.scoreDist[bucket] = (r.scoreDist[bucket] || 0) + 1;
      const cat = x.categoria || 'SIN';
      (scoresPorCategoria[cat] ||= []).push(score);
    } else r.sinScoreMeni++;

    if (x.aprobadoMeni === true) r.aprobadoMeni++;
    if (x.categoria) { r.conCategoria++; r.categorias[x.categoria] = (r.categorias[x.categoria] || 0) + 1; } else r.sinCategoria++;
    if (Array.isArray(x.recomendaciones) && x.recomendaciones.length) r.conRecomendaciones++;
    if (x.diagnosticoMeni || x.diagnostico) r.conDiagnostico++;
    if (Array.isArray(x.preguntasLector) && x.preguntasLector.length) r.conPreguntas++;
    if (x.meniVersion) r.porVersionMeni[x.meniVersion] = (r.porVersionMeni[x.meniVersion] || 0) + 1;
    if (x.reevaluaciones || x.reevaluadoEn) r.reevaluadas++;

    const pub = toMs(x.publishedAt || x.fechaPublicacion || x.fecha);
    const mod = toMs(x.dateModified || x.fechaActualizacion);
    if (pub && mod && mod - pub > 120000) r.editadasPostPublicacion++;

    const pal = x.palabras || (x.contenido ? String(x.contenido).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length : 0);
    const b = pal < 200 ? '<200' : pal < 400 ? '200-400' : pal < 700 ? '400-700' : pal < 1200 ? '700-1200' : '>1200';
    r.palabrasBuckets[b]++;
    if (!x.imagen && !x.imagenDestacada) r.sinImagen++;
    if (!x.autor) r.sinAutor++;
    if (!x.resumen) r.sinResumen++;
    if (x.noindex === true) r.noindex++;
  }
  r.scorePromedioPorCategoria = Object.fromEntries(
    Object.entries(scoresPorCategoria).map(([k, v]) => [k, { n: v.length, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }])
  );
  return r;
});

// ─── 2. COLAS Y COLECCIONES NIOS: tamaño + último write ───
const colecciones = [
  'nios_actions', 'nios_memory', 'nios_growth_opportunities', 'nios_traffic',
  'nios_distribution_queue', 'nios_seo_experiments', 'nios_alerts', 'nios_telemetry',
  'nios_daily_snapshots', 'nios_cache_invalidations', 'nios_audit_trail',
  'depto_jobs', 'depto_incidents', 'depto_heartbeat', 'supervisor_cycles', 'supervisor_updates',
  'meni_diagnosis', 'meni_predictions', 'meni_daily_score', 'meni_learning_feedback',
  'meni_ratings', 'meni_quality_history', 'google_learning_patterns',
  'editor_corrections', 'editor_patterns', 'learning_cycles', 'learning_config',
  'article_lifecycles', 'kb_entities', 'kb_timeline', 'ceo_decisions', 'resumenes_diarios',
];
await safe('colecciones', async () => {
  const res = {};
  for (const name of colecciones) {
    try {
      const cnt = await db.collection(name).count().get();
      const total = cnt.data().count;
      let last = null;
      if (total > 0) {
        for (const campo of ['createdAt', 'timestamp', 'date', 'updatedAt', 'fecha']) {
          try {
            const s = await db.collection(name).orderBy(campo, 'desc').limit(1).get();
            if (!s.empty) { last = { campo, valor: toMs(s.docs[0].data()[campo]), diasAtras: daysAgo(toMs(s.docs[0].data()[campo])) }; break; }
          } catch { /* campo no indexado */ }
        }
      }
      res[name] = { docs: total, ultimoWrite: last };
    } catch (e) { res[name] = { ERROR: String(e.message || e).slice(0, 120) }; }
  }
  return res;
});

// ─── 3. nios_actions: estados y ciclo real ───
await safe('nios_actions_detalle', async () => {
  const snap = await db.collection('nios_actions').get();
  const porEstado = {}, porKind = {}, esquema = { A_niosAction: 0, B_growthAction: 0 };
  let conMeasureAt = 0, medidas = 0, vencidasSinMedir = 0;
  for (const d of snap.docs) {
    const x = d.data();
    porEstado[x.status || 'SIN'] = (porEstado[x.status || 'SIN'] || 0) + 1;
    porKind[x.kind || 'SIN'] = (porKind[x.kind || 'SIN'] || 0) + 1;
    if (x.title || x.evidence || x.proposal) esquema.A_niosAction++; else esquema.B_growthAction++;
    if (x.measureAt) {
      conMeasureAt++;
      if (x.result || x.measuredAt || x.learning) medidas++;
      else if (toMs(x.measureAt) < Date.now()) vencidasSinMedir++;
    }
  }
  return { total: snap.size, porEstado, porKind, esquema, conMeasureAt, medidas, vencidasSinMedir };
});

// ─── 4. nios_memory: kinds ───
await safe('nios_memory_kinds', async () => {
  const snap = await db.collection('nios_memory').get();
  const porKind = {};
  let ceoLoops = 0, verified = 0, sinEvidencia = 0;
  for (const d of snap.docs) {
    const x = d.data();
    porKind[x.kind || 'SIN_KIND'] = (porKind[x.kind || 'SIN_KIND'] || 0) + 1;
    if (x.kind === 'ceo_loop') {
      ceoLoops++;
      if (x.autonomyReport === 'VERIFIED' || x.autonomy?.report === 'VERIFIED') {
        verified++;
        if (!x.autonomyEvidence && !x.autonomy?.evidence) sinEvidencia++;
      }
    }
  }
  return { total: snap.size, porKind, ceoLoops, verified, verifiedSinEvidencia: sinEvidencia };
});

// ─── 5. depto_jobs: estados, tipos, atascados ───
await safe('depto_jobs_detalle', async () => {
  const snap = await db.collection('depto_jobs').get();
  const porEstado = {}, porTipo = {}, skipped = {};
  let atascados = 0;
  for (const d of snap.docs) {
    const x = d.data();
    porEstado[x.status || 'SIN'] = (porEstado[x.status || 'SIN'] || 0) + 1;
    porTipo[x.type || 'SIN'] = (porTipo[x.type || 'SIN'] || 0) + 1;
    if (x.result?.skipped || x.skipped) skipped[x.type || 'SIN'] = (skipped[x.type || 'SIN'] || 0) + 1;
    if (x.status === 'running' && toMs(x.startedAt || x.updatedAt) < Date.now() - 3600000) atascados++;
  }
  return { total: snap.size, porEstado, porTipo, completadosComoSkipped: skipped, runningAtascados: atascados };
});

// ─── 6. meni_predictions: ¿se validan? ───
await safe('meni_predictions_ciclo', async () => {
  const snap = await db.collection('meni_predictions').get();
  let conReal = 0, sinReal = 0;
  for (const d of snap.docs) {
    const x = d.data();
    if (x.realFacebook != null || x.realDiscover != null || x.realPortada != null) conReal++; else sinReal++;
  }
  return { total: snap.size, conMetricaReal: conReal, nuncaValidadas: sinReal };
});

// ─── 7. alertas ───
await safe('nios_alerts_detalle', async () => {
  const snap = await db.collection('nios_alerts').get();
  let resueltas = 0, abiertas = 0;
  const porTipo = {};
  for (const d of snap.docs) {
    const x = d.data();
    if (x.resolved === true) resueltas++; else abiertas++;
    porTipo[x.type || x.kind || 'SIN'] = (porTipo[x.type || x.kind || 'SIN'] || 0) + 1;
  }
  return { total: snap.size, resueltas, abiertas, porTipo };
});

console.log(JSON.stringify(out, null, 2));
