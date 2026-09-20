/** READ-ONLY probe 3: MENI persistence + remaining collections */
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

  await probe('noticias_con_meni', async () => {
    const withScore = await db.collection('noticias').where('scoreMeni', '>', 0).count().get().catch(() => null);
    const withCalif = await db.collection('noticias').where('calificacionMeni', '!=', null).count().get().catch(() => null);
    const aprob = await db.collection('noticias').where('aprobadoMeni', '==', true).count().get().catch(() => null);
    const versions = {};
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(60).get();
    const scores = [];
    for (const d of snap.docs) {
      const x = d.data();
      const v = String(x.meniVersion || 'none'); versions[v] = (versions[v] || 0) + 1;
      if (typeof x.scoreMeni === 'number') scores.push({ slug: x.slug, score: x.scoreMeni, calif: x.calificacionMeni, aprobado: x.aprobadoMeni, ts: x.evaluationTimestamp, ver: x.meniVersion });
    }
    return { conScoreMeni: withScore?.data().count, conCalificacion: withCalif?.data().count, aprobados: aprob?.data().count, meniVersionDist60: versions, sample: scores.slice(0, 8) };
  });

  for (const col of ['meni_daily_score', 'meni_learning_feedback', 'meni_predictions', 'google_learning_patterns', 'article_lifecycles', 'traffic_daily', 'analytics_traffic', 'seguimiento_cases', 'seguimiento_updates', 'distribuciones_pendientes', 'reportes_crecimiento', 'ia_cost_counters', 'kb_entities', 'views', 'estadisticas']) {
    await probe('col_' + col, async () => {
      const cnt = await db.collection(col).count().get();
      let last = null;
      for (const f of ['createdAt', 'timestamp', 'date', 'fecha', 'updatedAt', 'runAt']) {
        try { const s = await db.collection(col).orderBy(f, 'desc').limit(1).get(); if (!s.empty) { last = { field: f, value: s.docs[0].data()[f] }; break; } } catch {}
      }
      return { total: cnt.data().count, last };
    });
  }

  await probe('nios_actions_detail', async () => {
    const snap = await db.collection('nios_actions').orderBy('createdAt', 'desc').limit(10).get().catch(() => null);
    const byStatus = {};
    for (const st of ['PENDING', 'APPROVED', 'EXECUTED', 'REJECTED', 'FAILED']) {
      const c = await db.collection('nios_actions').where('status', '==', st).count().get().catch(() => null);
      if (c) byStatus[st] = c.data().count;
    }
    return { byStatus, recent: snap ? snap.docs.map(d => { const x = d.data(); return { status: x.status, type: x.type || x.actionType, title: (x.title || x.action || '').slice(0, 70), createdAt: x.createdAt }; }) : null };
  });

  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('.audit/firestore-probe3.json', JSON.stringify(report, null, 2));
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
