/**
 * READ-ONLY Firestore probe: evidencia de qué sistemas escriben realmente
 * y cuándo fue su última ejecución. No escribe nada.
 */
const fs = require('fs');
const path = require('path');

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
for (const line of envFile.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const saPath = 'E:\\PROYECTO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-fa9b81a61a.json';
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  initializeApp({ credential: cert(sa) });
  const db = getFirestore();

  const report = {};

  async function probe(name, fn) {
    try { report[name] = await fn(); }
    catch (e) { report[name] = { error: String(e.message || e).slice(0, 200) }; }
  }

  // 1. nios_daily_snapshots: count + last 5 dates + content summary
  await probe('nios_daily_snapshots', async () => {
    const snap = await db.collection('nios_daily_snapshots').orderBy('date', 'desc').limit(5).get();
    const docs = snap.docs.map(d => {
      const x = d.data();
      return {
        date: x.date, collectedAt: x.collectedAt, articlesCount: x.articlesCount,
        gscStatus: x.gsc?.status, gscImpressions: x.gsc?.totalImpressions, gscClicks: x.gsc?.totalClicks,
        ga4Status: x.ga4?.status, ga4Users: x.ga4?.totalUsers, ga4Sessions: x.ga4?.totalSessions,
        recos: x.recommendations?.length, version: x.version, hasArticlesFused: !!x.articlesFused,
      };
    });
    // count total
    const cnt = await db.collection('nios_daily_snapshots').count().get();
    return { total: cnt.data().count, last5: docs };
  });

  // 2. nios_memory: ceo_loop records + pending tasks
  await probe('nios_memory', async () => {
    const loops = await db.collection('nios_memory').where('kind', '==', 'ceo_loop').get();
    const sorted = loops.docs.map(d => d.data()).sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
    const last = sorted[0];
    const pending = await db.collection('nios_memory').where('status', '==', 'pending').get();
    return {
      ceoLoopCount: loops.size,
      lastLoop: last ? {
        timestamp: last.timestamp, trigger: last.trigger, mode: last.mode,
        status: last.status, autonomyScore: last.autonomyScore,
        observations: last.observations?.length, decisions: last.decisions?.length,
        repaired: last.repaired?.length, pendingHuman: last.pendingHuman,
        summary: String(last.summary || '').slice(0, 300),
      } : null,
      last5Timestamps: sorted.slice(0, 5).map(x => x.timestamp),
      pendingTasks: pending.size,
      pendingSample: pending.docs.slice(0, 5).map(d => { const x = d.data(); return { id: x.id, action: x.action, createdAt: x.createdAt }; }),
    };
  });

  // 3. depto_heartbeats: last run per component
  await probe('depto_heartbeats', async () => {
    const snap = await db.collection('depto_heartbeats').get();
    return snap.docs.map(d => { const x = d.data(); return { component: x.component, lastRunAt: x.lastRunAt, status: x.status, durationMs: x.durationMs }; });
  });

  // 4. supervisor_cycles
  await probe('supervisor_cycles', async () => {
    const snap = await db.collection('supervisor_cycles').orderBy('runAt', 'desc').limit(3).get();
    const cnt = await db.collection('supervisor_cycles').count().get();
    return { total: cnt.data().count, last: snap.docs.map(d => { const x = d.data(); return { runAt: x.runAt, checked: x.watch?.checked, updates: x.watch?.updatesDetected, conflicts: x.watch?.conflicts, health: x.health }; }) };
  });

  // 5. resumenes_diarios
  await probe('resumenes_diarios', async () => {
    const snap = await db.collection('resumenes_diarios').orderBy('fecha', 'desc').limit(5).get();
    return snap.docs.map(d => { const x = d.data(); return { fecha: x.fecha, enviadoEn: x.enviadoEn, cantidad: x.cantidad }; });
  });

  // 6. nios_telemetry
  await probe('nios_telemetry', async () => {
    const snap = await db.collection('nios_telemetry').orderBy('date', 'desc').limit(3).get();
    return snap.docs.map(d => { const x = d.data(); return { date: x.date, modules: x.modules?.length, errors: x.modules?.filter(m => m.status === 'error').map(m => m.module) }; });
  });

  // 7. nios_alerts
  await probe('nios_alerts', async () => {
    const cnt = await db.collection('nios_alerts').count().get();
    const snap = await db.collection('nios_alerts').orderBy('createdAt', 'desc').limit(3).get().catch(() => null);
    return { total: cnt.data().count, last: snap ? snap.docs.map(d => { const x = d.data(); return { createdAt: x.createdAt, type: x.type, severity: x.severity, title: x.title }; }) : null };
  });

  // 8. depto_jobs queue
  await probe('depto_jobs', async () => {
    const cnt = await db.collection('depto_jobs').count().get();
    const byStatus = {};
    for (const st of ['pending', 'running', 'done', 'retry', 'dead']) {
      const c = await db.collection('depto_jobs').where('status', '==', st).count().get().catch(() => null);
      if (c) byStatus[st] = c.data().count;
    }
    const recent = await db.collection('depto_jobs').orderBy('createdAt', 'desc').limit(5).get().catch(() => null);
    return { total: cnt.data().count, byStatus, recent: recent ? recent.docs.map(d => { const x = d.data(); return { type: x.type, status: x.status, createdAt: x.createdAt }; }) : null };
  });

  // 9. departamento daily reports
  await probe('departamento_daily', async () => {
    const doc = await db.doc('departamento_daily/latest').get().catch(() => null);
    return doc && doc.exists ? { keys: Object.keys(doc.data()).slice(0, 15), runAt: doc.data().runAt } : 'missing';
  });

  // 10. nios_growth_opportunities
  await probe('nios_growth_opportunities', async () => {
    const cnt = await db.collection('nios_growth_opportunities').count().get();
    const snap = await db.collection('nios_growth_opportunities').orderBy('createdAt', 'desc').limit(3).get().catch(() => null);
    return { total: cnt.data().count, last: snap ? snap.docs.map(d => { const x = d.data(); return { createdAt: x.createdAt, title: x.title?.slice?.(0, 60), status: x.status }; }) : null };
  });

  // 11. meni_learning / feedback collections
  for (const col of ['meni_learning', 'meni_feedback', 'meni_diagnosis', 'meni_ratings', 'nios_cache_invalidations', 'nios_actions', 'depto_incidents', 'depto_learning', 'nios_traffic', 'traffic_log', 'distribuciones', 'editorial_queue', 'nios_google_learning']) {
    await probe('col_' + col, async () => {
      const cnt = await db.collection(col).count().get();
      let last = null;
      for (const field of ['createdAt', 'timestamp', 'runAt', 'fecha', 'updatedAt']) {
        try {
          const s = await db.collection(col).orderBy(field, 'desc').limit(1).get();
          if (!s.empty) { last = s.docs[0].data()[field]; break; }
        } catch {}
      }
      return { total: cnt.data().count, lastActivity: last };
    });
  }

  // 12. noticias: count + count with meni data
  await probe('noticias', async () => {
    const cnt = await db.collection('noticias').count().get();
    const pub = await db.collection('noticias').where('estado', '==', 'publicado').count().get().catch(() => null);
    const withMeni = await db.collection('noticias').where('meniScore', '>', 0).count().get().catch(() => null);
    const recent = await db.collection('noticias').orderBy('fecha', 'desc').limit(3).get().catch(() => null);
    return {
      total: cnt.data().count,
      publicadas: pub ? pub.data().count : 'n/a',
      conMeniScore: withMeni ? withMeni.data().count : 'n/a',
      recent: recent ? recent.docs.map(d => { const x = d.data(); return { slug: x.slug, fecha: x.fecha?.toDate?.()?.toISOString?.() ?? x.fecha, estado: x.estado, meniScore: x.meniScore }; }) : null,
    };
  });

  console.log(JSON.stringify(report, null, 2));
  fs.writeFileSync('.audit/firestore-probe.json', JSON.stringify(report, null, 2));
}

main().catch(e => { console.error('PROBE FAILED:', e.message); process.exit(1); });
