/** READ-ONLY forensic dump: preserva estado de las colas antes de Fase 0 */
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const sa = JSON.parse(fs.readFileSync('E:\\PROYECTO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-fa9b81a61a.json', 'utf8'));
  initializeApp({ credential: cert(sa) });
  const db = getFirestore();
  const report = { capturedAt: new Date().toISOString() };

  // nios_actions: dump completo + clasificación preliminar
  const actionsSnap = await db.collection('nios_actions').get();
  const actions = actionsSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
  const byKey = {};
  for (const a of actions) {
    const key = a.opportunityId || a.title || a.type || 'unknown';
    byKey[key] = (byKey[key] || 0) + 1;
  }
  report.nios_actions = {
    total: actions.length,
    byStatus: actions.reduce((m, a) => { m[a.status || '?'] = (m[a.status || '?'] || 0) + 1; return m; }, {}),
    byKey,
    sample: actions.slice(0, 10),
    oldest: actions.map(a => a.createdAt).sort()[0],
    newest: actions.map(a => a.createdAt).sort().slice(-1)[0],
  };

  // nios_memory pending tasks: dump completo
  const tasksSnap = await db.collection('nios_memory').where('status', '==', 'pending').get();
  report.nios_memory_pending = tasksSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
  const loopSnap = await db.collection('nios_memory').where('kind', '==', 'ceo_loop').get();
  report.ceo_loop_last = loopSnap.docs.map(d => d.data()).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))[0];

  // depto_jobs: dump completo de pending/retry
  const jobsSnap = await db.collection('depto_jobs').get();
  report.depto_jobs = jobsSnap.docs.map(d => ({ docId: d.id, ...d.data() }));

  // depto_incidents
  const incSnap = await db.collection('depto_incidents').get();
  report.depto_incidents = incSnap.docs.map(d => ({ docId: d.id, ...d.data() }));

  fs.writeFileSync('.audit/FORENSIC-FASE0-BEFORE.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    nios_actions_total: report.nios_actions.total,
    nios_actions_byStatus: report.nios_actions.byStatus,
    duplicates: Object.entries(byKey).filter(([, c]) => c > 1).length,
    memory_pending: report.nios_memory_pending.length,
    depto_jobs: report.depto_jobs.length,
    incidents: report.depto_incidents.length,
  }, null, 2));
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
