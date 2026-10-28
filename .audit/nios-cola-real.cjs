/** READ-ONLY: cola real con campos correctos (scheduledFor = ISO string). */
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const sa = JSON.parse(fs.readFileSync('E:\\PROYECTO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-7cae084d30.json', 'utf8'));
  initializeApp({ credential: cert(sa) });
  const db = getFirestore();
  const report = { at: new Date().toISOString() };
  const now = new Date().toISOString();

  report.counts = {};
  for (const status of ['pending', 'retry', 'running', 'completed', 'dead-letter']) {
    report.counts[status] = (await db.collection('depto_jobs').where('status', '==', status).count().get()).data().count;
  }

  // distribución por tipo entre los pending
  const pend = await db.collection('depto_jobs').where('status', 'in', ['pending', 'retry']).get();
  // Reusar la lectura: no depende de un índice compuesto status+scheduledFor.
  report.pendientesVencidos = pend.docs.filter(d => String(d.data().scheduledFor || '') < now).length;
  report.pendientesNoVencidos = pend.size - report.pendientesVencidos;
  report.articlePipeline = pend.docs.filter(d => d.data().type === 'article-pipeline').map(d => {
    const x = d.data();
    const createdAt = x.payload?.createdAt;
    const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt?.toDate?.();
    return { jobId: d.id, articleId: x.payload?.articleId, scheduledFor: x.scheduledFor,
      dateType: typeof createdAt, sourceDate: date && !isNaN(date.getTime()) ? date.toISOString() : null,
      needsReview: !date || isNaN(date.getTime()) || Date.now() - date.getTime() >= 86400000 || date.getTime() > Date.now() };
  });
  const tipos = {}; const prios = {}; const sources = {}; let masAntiguo = null, masNuevo = null;
  for (const d of pend.docs) {
    const x = d.data();
    tipos[x.type] = (tipos[x.type] || 0) + 1;
    prios[x.priority] = (prios[x.priority] || 0) + 1;
    sources[x.source] = (sources[x.source] || 0) + 1;
    const s = String(x.scheduledFor || '');
    if (!masAntiguo || s < masAntiguo) masAntiguo = s;
    if (!masNuevo || s > masNuevo) masNuevo = s;
  }
  report.pendientesPorTipo = tipos; report.porPrioridad = prios; report.porFuente = sources;
  report.masAntiguo = masAntiguo; report.masNuevo = masNuevo;

  // heartbeats
  const hb = await db.collection('depto_heartbeat').limit(30).get();
  report.heartbeats = hb.docs.map(d => ({ id: d.id, ...d.data() }));

  // incidentes
  const inc = await db.collection('depto_incidents').get().catch(() => null);
  if (inc) {
    const est = {}; const dedup = {};
    for (const d of inc.docs) {
      const x = d.data();
      const st = String(x.status || x.estado || '?'); est[st] = (est[st] || 0) + 1;
      const k = String(x.dedupKey || x.title || x.type || '').slice(0, 70); if (k) dedup[k] = (dedup[k] || 0) + 1;
    }
    report.incidentes = { total: inc.size, porEstado: est, duplicados: Object.entries(dedup).filter(([, n]) => n > 1).slice(0, 15) };
  }

  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('.audit/nios-cola-real.json', JSON.stringify(report, null, 2));
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
