// P0-7 — Sonda de SOLO LECTURA para auditar traffic_log / traffic_daily.
// No escribe, no borra, no modifica nada. Uso:
//   npx tsx scripts/p0-7-traffic-daily-probe.mjs
import { readFileSync, writeFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- cargar .env.local manualmente (sin dependencias) ---
const env = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*?)\r?$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}

let credential;
if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  credential = cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')));
} else if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
  credential = cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
} else {
  console.error('FALTAN CREDENCIALES en .env.local (FIREBASE_SERVICE_ACCOUNT_BASE64 o el trío FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY).');
  process.exit(2);
}
initializeApp({ credential });
const db = getFirestore();

const out = { generatedAt: new Date().toISOString(), errors: [] };
const safe = async (name, fn) => {
  try { return await fn(); }
  catch (e) { out.errors.push({ name, error: e.message }); return { __error: e.message }; }
};

// 1) traffic_daily: listDocuments (incluye padres "faltantes" con subcolección)
const dayRefs = await safe('traffic_daily.listDocuments', () => db.collection('traffic_daily').listDocuments());
const dayIds = Array.isArray(dayRefs) ? dayRefs.map(d => d.id).sort() : [];

// 2) traffic_daily: collection.get() — demuestra si los padres tienen campos
const flatGet = await safe('traffic_daily.get', () => db.collection('traffic_daily').get());
out.trafficDaily = {
  parentIdsViaListDocuments: dayIds,
  parentCount: dayIds.length,
  flatGetDocCount: flatGet.size ?? null,
  flatGetSample: flatGet.docs?.slice(0, 3).map(d => ({ id: d.id, exists: d.exists, keys: Object.keys(d.data()) })) ?? null,
};

// 3) Para cada fecha: subcolección articles — conteo, vistas, muestra
out.trafficDaily.perDay = [];
for (const date of dayIds.slice(-40)) {
  const r = await safe(`articles.${date}`, async () => {
    const s = await db.collection('traffic_daily').doc(date).collection('articles').get();
    let views = 0;
    const sample = [];
    for (const doc of s.docs) {
      const d = doc.data();
      views += typeof d.views === 'number' ? d.views : 0;
      if (sample.length < 2) sample.push({ id: doc.id, ...d });
    }
    return { date, articles: s.size, totalViews: views, sample };
  });
  out.trafficDaily.perDay.push(r);
}

// 4) traffic_log: recencia y distribución por día UTC
out.trafficLog = await safe('traffic_log.recent', async () => {
  const latest = await db.collection('traffic_log').orderBy('timestamp', 'desc').limit(1000).get();
  const docs = latest.docs.map(d => ({ id: d.id, ...d.data() }));
  const byUtcDay = {};
  const fields = new Set();
  let newest = null, oldest = null;
  for (const d of docs) {
    Object.keys(d).forEach(k => fields.add(k));
    const ts = d.timestamp?.toDate ? d.timestamp.toDate() : (d.timestamp ? new Date(d.timestamp) : null);
    if (!ts) continue;
    const day = ts.toISOString().slice(0, 10);
    byUtcDay[day] = (byUtcDay[day] || 0) + 1;
    if (!newest || ts > newest) newest = ts;
    if (!oldest || ts < oldest) oldest = ts;
  }
  return {
    sampleSize: docs.length,
    newest: newest?.toISOString() ?? null,
    oldestInSample: oldest?.toISOString() ?? null,
    byUtcDay: Object.fromEntries(Object.entries(byUtcDay).sort()),
    fieldNames: [...fields].sort(),
    sources: docs.reduce((acc, d) => { const s = d.source || '?'; acc[s] = (acc[s] || 0) + 1; return acc; }, {}),
    sample: docs.slice(0, 2).map(d => ({ slug: d.slug, source: d.source, timestamp: d.timestamp?.toDate?.()?.toISOString?.() ?? String(d.timestamp), hasExpiresAt: 'expiresAt' in d })),
  };
});

// 5) Cobertura: días con traffic_log pero sin traffic_daily
const logDays = new Set(Object.keys(out.trafficLog?.byUtcDay ?? {}));
const dailyDays = new Set(dayIds);
out.coverage = {
  daysWithLogButNoDaily: [...logDays].filter(d => !dailyDays.has(d)).sort(),
  daysWithDailyButNoRecentLog: [...dailyDays].filter(d => !logDays.has(d)).sort(),
};

writeFileSync('scripts/p0-7-traffic-daily-probe-output.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(0);
