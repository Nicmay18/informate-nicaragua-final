/**
 * FASE 16-B — Re-evaluación MENI de los 39 rechazados después del bug fix.
 * NO escribe a Firestore. Solo re-evalúa y reporta.
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';

try {
  const e = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(e)) {
    for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
      const l2 = l.replace(/\r$/, '');
      const m = l2.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }
  }
} catch {}

const sa = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
};
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  console.log('=== FASE 16-B: RE-EVALUACIÓN POST BUG FIX ===\n');

  // Leer los 39 IDs del log de P0
  const phase18Log = JSON.parse(fs.readFileSync('FORENSIC_PHASE18_EXECUTION.json', 'utf8'));
  const ids = phase18Log.bloquearIds;
  console.log(`Re-evaluando ${ids.length} artículos...\n`);

  const resultados = [];
  let aprobados = 0, rechazados = 0, errores = 0;
  let mejoraron = 0, empeoraron = 0, iguales = 0;

  for (const id of ids) {
    try {
      const snap = await db.collection('noticias').doc(id).get();
      if (!snap.exists) { errores++; continue; }
      const d = snap.data()!;
      const contenido = sanitizeArticleHtml(typeof d.contenido === 'string' ? d.contenido : String(d.contenido || ''));
      const scoreBefore = d.scoreMeni ?? null;
      const aprobadoBefore = d.aprobadoMeni ?? null;

      const input: NoticiaInput = {
        id,
        titulo: d.titulo || '',
        contenido,
        resumen: d.resumen || '',
        categoria: d.categoria || 'General',
        autor: d.autor || '',
        fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : new Date().toISOString(),
        imagen: d.imagen || undefined,
        slug: d.slug || id,
      };

      const meni = await runMeniAsync(input, { db, skipEditorBrain: true });
      const scoreAfter = meni.scoreFinal;
      const aprobadoAfter = meni.aprobado;

      if (aprobadoAfter) aprobados++; else rechazados++;
      if (scoreAfter !== null && scoreBefore !== null) {
        if (scoreAfter > scoreBefore) mejoraron++;
        else if (scoreAfter < scoreBefore) empeoraron++;
        else iguales++;
      }

      const blockingCodes = (meni.blockingIssues || []).map((b: any) => b.code);
      const resultado = {
        id,
        titulo: (d.titulo || '').slice(0, 70),
        scoreBefore, scoreAfter,
        aprobadoBefore, aprobadoAfter,
        blockingCodes,
        calificacion: meni.calificacion,
        editorialTier: meni.editorialTier,
      };
      resultados.push(resultado);
      console.log(`  ${id} | ${scoreBefore} → ${scoreAfter} | ${aprobadoAfter ? '✓ APROBADO' : 'rechazado'} | ${blockingCodes.join(',') || '-'} | ${resultado.titulo}`);
    } catch (e: any) {
      errores++;
      console.error(`  ERROR ${id}: ${e.message?.slice(0, 100)}`);
    }
  }

  console.log(`\n=== RESUMEN RE-EVALUACIÓN ===`);
  console.log(`Aprobados: ${aprobados}/${ids.length}`);
  console.log(`Rechazados: ${rechazados}/${ids.length}`);
  console.log(`Mejoraron: ${mejoraron}`);
  console.log(`Empeoraron: ${empeoraron}`);
  console.log(`Iguales: ${iguales}`);
  console.log(`Errores: ${errores}`);

  // Agrupar por causa de rechazo
  const rechazadosList = resultados.filter(r => !r.aprobadoAfter);
  const causas: Record<string, number> = {};
  for (const r of rechazadosList) {
    for (const code of r.blockingCodes) {
      causas[code] = (causas[code] || 0) + 1;
    }
  }
  console.log('\nCausas de rechazo:');
  for (const [code, count] of Object.entries(causas).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${code}: ${count}`);
  }

  fs.writeFileSync('FORENSIC_PHASE16B_REEVAL.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    total: ids.length,
    aprobados, rechazados, errores,
    mejoraron, empeoraron, iguales,
    causas,
    resultados,
  }, null, 2));
  console.log('\n✓ FORENSIC_PHASE16B_REEVAL.json');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
