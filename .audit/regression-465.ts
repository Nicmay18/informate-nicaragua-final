/**
 * Regresión real sobre las notas de producción: ejecuta runMeni sobre cada nota
 * de Firestore y reporta la distribución de score/aprobación. READ-ONLY.
 *
 * Uso:
 *   npx tsx .audit/regression-465.ts antes   → .audit/regression-antes.json
 *   npx tsx .audit/regression-465.ts despues → .audit/regression-despues.json
 *   npx tsx .audit/regression-465.ts diff    → compara ambos
 *
 * Nota: no escribe en Firestore ni altera umbrales. Mide el motor tal como está.
 */
import * as fs from 'fs';
import { readFileSync } from 'node:fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const modo = process.argv[2] || 'antes';

if (modo === 'diff') {
  const a = JSON.parse(fs.readFileSync('.audit/regression-antes.json', 'utf8'));
  const b = JSON.parse(fs.readFileSync('.audit/regression-despues.json', 'utf8'));
  const byId = new Map<string, { score: number; aprobado: boolean }>(
    a.notas.map((n: { id: string; score: number; aprobado: boolean }) => [n.id, n]),
  );
  let subieron = 0, bajaron = 0, igual = 0, cambioAprob = 0;
  const deltas: number[] = [];
  const nuevasAprobadas: string[] = [];
  const nuevasRechazadas: string[] = [];
  for (const n of b.notas as { id: string; score: number; aprobado: boolean; titulo: string }[]) {
    const prev = byId.get(n.id);
    if (!prev) continue;
    const d = n.score - prev.score;
    deltas.push(d);
    if (d > 0) subieron++; else if (d < 0) bajaron++; else igual++;
    if (prev.aprobado !== n.aprobado) {
      cambioAprob++;
      (n.aprobado ? nuevasAprobadas : nuevasRechazadas).push(`${n.score} (era ${prev.score}) — ${n.titulo}`);
    }
  }
  const sum = deltas.reduce((x, y) => x + y, 0);
  console.log(JSON.stringify({
    comparadas: deltas.length,
    subieron, bajaron, sinCambio: igual,
    deltaPromedio: deltas.length ? Number((sum / deltas.length).toFixed(2)) : 0,
    deltaMax: deltas.length ? Math.max(...deltas) : 0,
    deltaMin: deltas.length ? Math.min(...deltas) : 0,
    cambiosDeAprobacion: cambioAprob,
    nuevasAprobadas: nuevasAprobadas.slice(0, 20),
    nuevasRechazadas: nuevasRechazadas.slice(0, 20),
    resumenAntes: a.resumen,
    resumenDespues: b.resumen,
  }, null, 2));
  process.exit(0);
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v as string;

const credential = env.FIREBASE_SERVICE_ACCOUNT_BASE64
  ? cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')))
  : cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') });
if (!getApps().length) initializeApp({ credential });
const db = getFirestore();

type Nota = { id: string; titulo: string; categoria: string; score: number; aprobado: boolean; recomendacion: string; palabras: number; dudas: number };

async function main() {
const { runMeni } = await import('@/lib/meni/core');

const snap = await db.collection('noticias').get();
const notas: Nota[] = [];
let errores = 0;
let i = 0;
for (const doc of snap.docs) {
  const x = doc.data();
  i++;
  if (i % 50 === 0) process.stderr.write(`  ${i}/${snap.size}\n`);
  try {
    const r = await runMeni({
      id: doc.id,
      titulo: String(x.titulo || ''),
      resumen: String(x.resumen || ''),
      contenido: String(x.contenido || ''),
      categoria: String(x.categoria || 'Nacionales'),
      autor: String(x.autor || 'Redacción'),
      fecha: typeof x.fecha === 'string' ? x.fecha : new Date().toISOString(),
      slug: String(x.slug || doc.id),
    });
    const brain = (r as unknown as { editorialDecision?: { storyCompleteness?: { dudasPendientes?: string[] } } }).editorialDecision;
    notas.push({
      id: doc.id,
      titulo: String(x.titulo || '').slice(0, 70),
      categoria: String(x.categoria || ''),
      score: r.scoreFinal ?? 0,
      aprobado: r.aprobado === true,
      recomendacion: String((r as unknown as { recomendacion?: string }).recomendacion || ''),
      palabras: String(x.contenido || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
      dudas: brain?.storyCompleteness?.dudasPendientes?.length ?? 0,
    });
  } catch (e) {
    errores++;
    process.stderr.write(`  ERROR ${doc.id}: ${(e as Error).message?.slice(0, 120)}\n`);
  }
}

const aprobadas = notas.filter((n) => n.aprobado);
const dist: Record<string, number> = {};
for (const n of notas) {
  const b = n.score >= 90 ? '90-100' : n.score >= 80 ? '80-89' : n.score >= 70 ? '70-79' : n.score >= 60 ? '60-69' : '<60';
  dist[b] = (dist[b] || 0) + 1;
}
const conDudas = notas.filter((n) => n.dudas > 0);
const resumen = {
  evaluadas: notas.length,
  errores,
  aprobadas: aprobadas.length,
  tasaAprobacion: notas.length ? Number(((aprobadas.length / notas.length) * 100).toFixed(1)) : 0,
  scorePromedio: notas.length ? Number((notas.reduce((a, n) => a + n.score, 0) / notas.length).toFixed(1)) : 0,
  distribucion: dist,
  notasConDudasPendientes: conDudas.length,
  scorePromedioConDudas: conDudas.length ? Number((conDudas.reduce((a, n) => a + n.score, 0) / conDudas.length).toFixed(1)) : 0,
  scorePromedioSinDudas: notas.length - conDudas.length
    ? Number((notas.filter((n) => n.dudas === 0).reduce((a, n) => a + n.score, 0) / (notas.length - conDudas.length)).toFixed(1))
    : 0,
};
fs.writeFileSync(`.audit/regression-${modo}.json`, JSON.stringify({ modo, generatedAt: new Date().toISOString(), resumen, notas }, null, 2));
console.log(JSON.stringify(resumen, null, 2));
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
