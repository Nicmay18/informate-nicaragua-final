// Solo lectura: editorial_review_queue + meni_predictions + distribuciones_pendientes
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) }));
const toDate = (v) => v?.toDate?.() || (v ? new Date(v) : null);

console.log('=== editorial_review_queue (recientes)');
const q = await db.collection('editorial_review_queue').get();
const items = q.docs.map(d => ({ id: d.id, ...d.data() }))
  .sort((a, b) => (toDate(b.createdAt || b.at || b.timestamp)?.getTime() || 0) - (toDate(a.createdAt || a.at || a.timestamp)?.getTime() || 0));
const estados = {};
for (const x of items) { const k = `${x.status || x.estado || '?'}/${x.categoria || '?'}`; estados[k] = (estados[k] || 0) + 1; }
console.log('estado/categoria:', JSON.stringify(estados));
for (const x of items.slice(0, 12)) {
  console.log(`- ${x.id} | ${x.categoria} | ${x.status || x.estado} | ${x.score ?? x.scoreMeni} | ${toDate(x.createdAt || x.at || x.timestamp)?.toISOString()}`);
  console.log(`  keys: ${Object.keys(x).join(',').slice(0, 200)}`);
  console.log(`  reason: ${JSON.stringify(x.reason || x.motivo || x.decision || x.supervisorReason || '').slice(0, 300)}`);
}

console.log('\n=== meni_predictions (muestra)');
const p = await db.collection('meni_predictions').limit(3).get();
for (const d of p.docs) console.log(d.id, JSON.stringify(d.data()).slice(0, 400));

console.log('\n=== distribuciones_pendientes (muestra)');
const dp = await db.collection('distribuciones_pendientes').limit(5).get();
for (const d of dp.docs) console.log(d.id, JSON.stringify(d.data()).slice(0, 300));

console.log('\n=== deletion_audit');
const da = await db.collection('deletion_audit').limit(9).get();
for (const d of da.docs) console.log(d.id, JSON.stringify(d.data()).slice(0, 200));

// traffic_log: ¿cuántos expirados sin borrar?
const exp = await db.collection('traffic_log').where('expiresAt', '<', new Date()).limit(1).get();
console.log(`\ntraffic_log expirados sin borrar: ${exp.size > 0 ? 'SÍ (al menos 1; limpieza no alcanza)' : 'no detectados en muestra'}`);
