/** READ-ONLY probe 2: corrected collection names + noticia field inspection */
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const sa = JSON.parse(fs.readFileSync('E:\\PROYECTO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-fa9b81a61a.json', 'utf8'));
  initializeApp({ credential: cert(sa) });
  const db = getFirestore();
  const report = {};

  async function probe(name, fn) {
    try { report[name] = await fn(); } catch (e) { report[name] = { error: String(e.message || e).slice(0, 200) }; }
  }

  await probe('depto_heartbeat', async () => {
    const snap = await db.collection('depto_heartbeat').get();
    return snap.docs.map(d => { const x = d.data(); return { component: x.component, status: x.status, lastRunAt: x.lastRunAt, nextExpectedAt: x.nextExpectedAt, note: x.note }; });
  });

  await probe('depto_jobs_completed', async () => {
    const c = await db.collection('depto_jobs').where('status', '==', 'completed').count().get();
    const f = await db.collection('depto_jobs').where('status', '==', 'failed').count().get();
    const recent = await db.collection('depto_jobs').orderBy('createdAt', 'desc').limit(10).get();
    return {
      completed: c.data().count, failed: f.data().count,
      recent10: recent.docs.map(d => { const x = d.data(); return { type: x.type, status: x.status, createdAt: x.createdAt, error: (x.error || '').slice(0, 80) }; }),
    };
  });

  await probe('depto_central', async () => {
    const latest = await db.doc('depto_central_latest/latest').get();
    const cnt = await db.collection('depto_central_daily').count().get();
    return { latestExists: latest.exists, latestRunAt: latest.exists ? latest.data().runAt : null, dailyDocs: cnt.data().count };
  });

  await probe('noticia_fields_sample', async () => {
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(3).get();
    return snap.docs.map(d => { const x = d.data(); return { slug: x.slug, keys: Object.keys(x).sort() }; });
  });

  // noticias with any meni-ish field
  await probe('noticias_meni_fields', async () => {
    for (const field of ['meni', 'meniResult', 'meniScore', 'auditoria', 'auditoriaMeni', 'diagnostico', 'evaluacion', 'meniVerdict', 'qualityScore']) {
      const c = await db.collection('noticias').where(field, '!=', null).count().get().catch(() => null);
      if (c && c.data().count > 0) return { field, count: c.data().count };
    }
    return 'none found';
  });

  await probe('google_learning_patterns', async () => {
    const c = await db.collection('nios_learning_patterns').count().get().catch(() => null);
    const c2 = await db.collection('learning_patterns').count().get().catch(() => null);
    return { nios_learning_patterns: c?.data().count, learning_patterns: c2?.data().count };
  });

  // discover: list top-level collections
  await probe('collections', async () => {
    const cols = await db.listCollections();
    return cols.map(c => c.id).sort();
  });

  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('.audit/firestore-probe2.json', JSON.stringify(report, null, 2));
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
