/**
 * FASE 2 — Ejecutar MENI real sobre los 281 artículos (DRY RUN).
 * Compara score histórico vs score actual.
 * NO modifica Firestore.
 * Genera FORENSIC_281_MENI_DRYRUN.json
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';

// Load .env.local
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

// Load service account
let sa: any;
const saPath = 'g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
try {
  sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
} catch {
  const pk = process.env.FIREBASE_PRIVATE_KEY;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
  } else if (pk) {
    sa = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: pk,
    };
  } else {
    console.error('FALTA KEY');
    process.exit(1);
  }
}
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function stripHtml(h: string): string {
  return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function cw(t: string): number {
  return t.split(/\s+/).filter(Boolean).length;
}

async function main() {
  console.log('\n=== FASE 2: MENI DRY RUN SOBRE 281 ARTÍCULOS ===\n');
  const snap = await db.collection('noticias').get();
  console.log('Total artículos:', snap.size);

  const results: any[] = [];
  let processed = 0;
  let errors = 0;
  let scoreSame = 0;
  let scoreDiff = 0;
  let scoreImproved = 0;
  let scoreDecreased = 0;
  let newApproved = 0;
  let lostApproval = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;

    try {
      const contenidoStr = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
      const sanitized = sanitizeArticleHtml(contenidoStr);

      const input: NoticiaInput = {
        id,
        titulo: d.titulo || '',
        contenido: sanitized,
        resumen: d.resumen || '',
        categoria: d.categoria || 'General',
        autor: d.autor || '',
        fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : new Date().toISOString(),
        imagen: d.imagen || undefined,
        slug: d.slug || id,
      };

      const meni = await runMeniAsync(input, { db, skipEditorBrain: true });

      const oldScore = d.scoreMeni ?? null;
      const newScore = meni.scoreFinal;
      const oldApproved = d.aprobadoMeni ?? null;
      const newApproved_ = meni.aprobado;

      const diff = oldScore !== null && newScore !== null ? newScore - oldScore : null;
      if (diff === null || Math.abs(diff) < 2) scoreSame++;
      else { scoreDiff++; if (diff > 0) scoreImproved++; else scoreDecreased++; }
      if (oldApproved === false && newApproved_ === true) newApproved++;
      if (oldApproved === true && newApproved_ === false) lostApproval++;

      results.push({
        id,
        slug: d.slug || id,
        titulo: d.titulo || '',
        categoria: d.categoria || 'General',
        palabrasReales: cw(stripHtml(contenidoStr)),
        oldScore,
        newScore,
        diff,
        oldApproved,
        newApproved: newApproved_,
        oldCalificacion: d.calificacionMeni ?? null,
        newCalificacion: meni.calificacion ?? null,
        oldEditorialTier: d.editorialTier ?? null,
        newEditorialTier: (meni as any).editorialTier ?? null,
        blockingIssues: meni.blockingIssues?.length || 0,
        warnings: meni.warnings?.length || 0,
        hadMeni: oldScore !== null,
      });

      processed++;
      if (processed % 10 === 0) {
        console.log(`  Procesados ${processed}/${snap.size}... (same=${scoreSame} diff=${scoreDiff} +${scoreImproved} -${scoreDecreased})`);
      }
    } catch (err: any) {
      errors++;
      console.error(`  ERROR en ${id}: ${err.message?.slice(0, 100)}`);
      results.push({
        id, slug: d.slug || id, titulo: d.titulo || '', error: err.message?.slice(0, 200),
        oldScore: d.scoreMeni ?? null, newScore: null, hadMeni: d.scoreMeni != null,
      });
    }
  }

  const outPath = path.join(process.cwd(), 'FORENSIC_281_MENI_DRYRUN.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('\nResultados:', outPath, '(' + results.length + ' registros)');

  console.log('\n--- RESUMEN MENI DRY RUN ---');
  console.log('Total procesados:', processed);
  console.log('Errores:', errors);
  console.log('Score igual (±2):', scoreSame);
  console.log('Score diferente:', scoreDiff, '(mejoró:', scoreImproved, '| empeoró:', scoreDecreased, ')');
  console.log('Nuevos aprobados:', newApproved);
  console.log('Perdieron aprobación:', lostApproval);

  // Score distribution new
  const sc = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0, 'null': 0, 'error': 0 };
  for (const r of results) {
    if (r.error) sc['error']++;
    else if (r.newScore === null) sc['null']++;
    else if (r.newScore < 50) sc['0-49']++;
    else if (r.newScore < 70) sc['50-69']++;
    else if (r.newScore < 90) sc['70-89']++;
    else sc['90-100']++;
  }
  console.log('Nueva distribución:', JSON.stringify(sc));

  // Top changes
  const withDiff = results.filter(r => r.diff !== null && Math.abs(r.diff) >= 5).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  if (withDiff.length > 0) {
    console.log('\n--- TOP CAMBIOS DE SCORE (|diff| >= 5) ---');
    for (const r of withDiff.slice(0, 15)) {
      console.log(`  ${r.id} | ${r.oldScore} → ${r.newScore} (${r.diff > 0 ? '+' : ''}${r.diff}) | "${r.titulo?.slice(0, 60)}"`);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
