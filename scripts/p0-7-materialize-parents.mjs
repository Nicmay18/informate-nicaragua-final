// P0-7 — Backfill NO destructivo: materializa los docs padre traffic_daily/{date}
// que quedaron "fantasma" (tienen subcolección articles pero el doc no existe).
//
// Qué hace y qué NO hace:
//  - Para cada ID de traffic_daily (via listDocuments, que incluye fantasmas):
//      · lee el doc padre; si NO existe → set({updatedAt}, merge) — SOLO eso.
//      · si YA existe → no toca nada.
//  - NO lee ni modifica traffic_log.
//  - NO recalcula ni suma vistas (re-agregar desde traffic_log duplicaría
//    conteos: traffic_log es el mismo origen del dual-write).
//  - Idempotente: ejecutarlo N veces produce el mismo estado.
//
// Requiere credenciales Firebase Admin en env:
//   FIREBASE_SERVICE_ACCOUNT_BASE64  ó  FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
// Uso:
//   node scripts/p0-7-materialize-parents.mjs            (escribe marcadores)
//   node scripts/p0-7-materialize-parents.mjs --dry-run  (solo reporta)
import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DRY_RUN = process.argv.includes('--dry-run');

// Cargar .env.local si existe (sin dependencias externas)
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
} catch { /* .env.local ausente: usar env del proceso */ }

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  credential = cert(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')));
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  credential = cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
} else {
  console.error('FALTAN CREDENCIALES: definir FIREBASE_SERVICE_ACCOUNT_BASE64 o el trío FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY.');
  process.exit(2);
}

if (getApps().length === 0) initializeApp({ credential });
const db = getFirestore();

const dayRefs = await db.collection('traffic_daily').listDocuments();
const dayIds = dayRefs.map((r) => r.id).sort();
console.log(`traffic_daily: ${dayIds.length} IDs (incluye padres fantasma). dry-run=${DRY_RUN}`);

const report = { scanned: dayIds.length, materialized: [], alreadyReal: [], skippedNoArticles: [], errors: [] };
const now = new Date().toISOString();

for (const day of dayIds) {
  try {
    const dayRef = db.collection('traffic_daily').doc(day);
    const snap = await dayRef.get();
    if (snap.exists) {
      report.alreadyReal.push(day);
      continue;
    }
    // Seguridad: solo materializar si la subcolección tiene docs reales.
    const articles = await dayRef.collection('articles').limit(1).get();
    if (articles.empty) {
      report.skippedNoArticles.push(day);
      continue;
    }
    if (!DRY_RUN) {
      await dayRef.set({ updatedAt: now }, { merge: true });
    }
    report.materialized.push(day);
  } catch (err) {
    report.errors.push({ day, error: err instanceof Error ? err.message : String(err) });
  }
}

console.log(JSON.stringify({
  scanned: report.scanned,
  materialized: report.materialized.length,
  materializedDays: report.materialized,
  alreadyReal: report.alreadyReal.length,
  skippedNoArticles: report.skippedNoArticles,
  errors: report.errors,
}, null, 2));
process.exit(report.errors.length ? 1 : 0);
