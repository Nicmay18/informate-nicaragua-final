/** Clasificación forense de nios_actions + nios_memory tasks (pre-Fase 0) */
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.audit/FORENSIC-FASE0-BEFORE.json', 'utf8'));

const now = Date.now();
const DAY = 864e5;

// ── nios_actions ──
// El dump 'sample' solo tiene 10; reclasificamos con los datos disponibles.
// Para clasificación completa necesitamos todos los docs → releer de Firestore.
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const sa = JSON.parse(fs.readFileSync('E:\\PROYECTO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-fa9b81a61a.json', 'utf8'));
  initializeApp({ credential: cert(sa) });
  const db = getFirestore();

  const snap = await db.collection('nios_actions').get();
  const actions = snap.docs.map(d => ({ docId: d.id, ...d.data() }));

  // Agrupar por kind+target para detectar duplicados
  const byTarget = new Map();
  for (const a of actions) {
    const k = `${a.kind}:${a.target}`;
    if (!byTarget.has(k)) byTarget.set(k, []);
    byTarget.get(k).push(a);
  }

  const classified = { expired: [], superseded: [], pending_valid: [], failed: [], running_stale: [], other: [] };
  for (const a of actions) {
    const age = now - Date.parse(a.createdAt || a.proposedAt || '');
    const key = `${a.kind}:${a.target}`;
    const group = byTarget.get(key).sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
    const isNewest = group[0].docId === a.docId;

    if (a.status === 'FAILED') classified.failed.push({ id: a.docId, kind: a.kind, target: a.target, error: a.error });
    else if (a.status === 'RUNNING') classified.running_stale.push({ id: a.docId, kind: a.kind, target: a.target, since: a.executedAt || a.createdAt, ageDays: Math.round(age / DAY) });
    else if (a.status === 'PENDING' && !isNewest) classified.superseded.push({ id: a.docId, kind: a.kind, target: a.target, createdAt: a.createdAt });
    else if (a.status === 'PENDING' && age > 7 * DAY) classified.expired.push({ id: a.docId, kind: a.kind, target: a.target, createdAt: a.createdAt, ageDays: Math.round(age / DAY) });
    else if (a.status === 'PENDING') classified.pending_valid.push({ id: a.docId, kind: a.kind, target: a.target, createdAt: a.createdAt });
    else classified.other.push({ id: a.docId, status: a.status, kind: a.kind, target: a.target });
  }

  // ── nios_memory tasks ──
  const tSnap = await db.collection('nios_memory').where('status', '==', 'pending').get();
  const tasks = tSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
  const taskClass = { expired_30d: [], pending_recent: [], not_tasks: [] };
  for (const t of tasks) {
    const isTask = t.kind === undefined && typeof t.action === 'string';
    if (!isTask) { taskClass.not_tasks.push({ id: t.docId, kind: t.kind }); continue; }
    const age = now - Date.parse(t.createdAt || '');
    if (age > 30 * DAY) taskClass.expired_30d.push({ id: t.docId, action: t.action, source: t.source, createdAt: t.createdAt });
    else taskClass.pending_recent.push({ id: t.docId, action: t.action, source: t.source, createdAt: t.createdAt });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    nios_actions: {
      total: actions.length,
      expired: classified.expired.length,
      superseded: classified.superseded.length,
      pending_valid: classified.pending_valid.length,
      failed: classified.failed.length,
      running_stale: classified.running_stale.length,
      other: classified.other.length,
      detail: classified,
    },
    nios_memory_tasks: {
      total_pending: tasks.length,
      expired_30d: taskClass.expired_30d.length,
      pending_recent: taskClass.pending_recent.length,
      not_tasks: taskClass.not_tasks.length,
      detail: taskClass,
    },
  };
  fs.writeFileSync('.audit/CLASIFICACION-FASE0.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    actions: { total: report.nios_actions.total, expired: classified.expired.length, superseded: classified.superseded.length, pending_valid: classified.pending_valid.length, failed: classified.failed.length, running_stale: classified.running_stale.length },
    tasks: { total: report.nios_memory_tasks.total_pending, expired_30d: taskClass.expired_30d.length, pending_recent: taskClass.pending_recent.length, not_tasks: taskClass.not_tasks.length },
  }, null, 2));
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
