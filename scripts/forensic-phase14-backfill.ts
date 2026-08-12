/**
 * FASE 14 — Backfill controlado de MENI sobre 281 artículos.
 * Ejecuta MENI real, persiste resultados en Firestore.
 * Genera FORENSIC_281_BACKFILL_LOG.json con trazabilidad completa.
 *
 * USO:
 *   npx tsx scripts/forensic-phase14-backfill.ts --dry-run   (no escribe)
 *   npx tsx scripts/forensic-phase14-backfill.ts --execute   (escribe en Firestore)
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { mapMeniScoreToNivel } from '@/lib/editorial/guardar-con-meni';
import { extractPuntosClave, extractFuente, getAutorFoto } from '@/lib/eeat-helpers';
import { stripHtml } from '@/lib/meni/utils/helpers';

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

const DRY_RUN = process.argv.includes('--dry-run');
const EXECUTE = process.argv.includes('--execute');

if (!DRY_RUN && !EXECUTE) {
  console.error('Especificar --dry-run o --execute');
  process.exit(1);
}

// Load service account
let sa: any;
const saPath = 'g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
try {
  sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
} catch {
  let pk = process.env.FIREBASE_PRIVATE_KEY;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
  } else if (pk) {
    sa = { projectId: process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua', clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk };
  } else { console.error('FALTA KEY'); process.exit(1); }
}
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  console.log(`\n=== FASE 14: BACKFILL CONTROLADO (${DRY_RUN ? 'DRY RUN' : 'EXECUTE'}) ===\n`);
  const snap = await db.collection('noticias').get();
  console.log('Total artículos:', snap.size);

  const log: any[] = [];
  let processed = 0;
  let approved = 0;
  let rejected = 0;
  let errors = 0;
  let written = 0;

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
      const newApproved = meni.aprobado;

      // Build update data (same as guardarConMeni but for both approved/rejected)
      const finalContenido = sanitized;
      const palabras = stripHtml(finalContenido).split(/\s+/).filter(Boolean).length;
      const { fuente, fuentesComplementarias } = extractFuente(finalContenido, d.resumen || '');
      const puntosClave = extractPuntosClave(finalContenido, 4);
      const autorFoto = getAutorFoto(d.autor || '');

      const updateData: Record<string, unknown> = {
        scoreMeni: newScore,
        aprobadoMeni: newApproved,
        calificacionMeni: meni.calificacion,
        nivel: mapMeniScoreToNivel(newScore, newApproved),
        nivelScore: newScore,
        nivelFecha: new Date().toISOString(),
        diagnosticoMeni: meni.diagnostico,
        editorialTier: (meni as any).editorialTier || null,
        editorialReason: (meni as any).editorialReason || null,
        recomendacionesMeni: (meni as any).recomendaciones?.map((r: any) => `${r.area}: ${r.mensaje}`) || [],
        palabras,
        puntosClave,
        fuente: fuente || 'Redacción Nicaragua Informate',
        fuentesComplementarias,
        autorFoto,
        contenido: sanitized, // Ensure sanitized content is stored
      };

      if (newApproved) approved++;
      else rejected++;

      if (EXECUTE) {
        await db.collection('noticias').doc(id).update(updateData);
        written++;
      }

      const diff = oldScore !== null && newScore !== null ? newScore - oldScore : null;
      log.push({
        id,
        slug: d.slug || id,
        titulo: d.titulo || '',
        oldScore,
        newScore,
        diff,
        oldApproved,
        newApproved,
        calificacion: meni.calificacion,
        editorialTier: (meni as any).editorialTier || null,
        blockingIssues: meni.blockingIssues?.map((b: any) => ({ code: b.code, title: b.title })) || [],
        written: EXECUTE,
        timestamp: new Date().toISOString(),
      });

      processed++;
      if (processed % 10 === 0) {
        console.log(`  Procesados ${processed}/${snap.size}... (approved=${approved} rejected=${rejected} written=${written})`);
      }
    } catch (err: any) {
      errors++;
      console.error(`  ERROR en ${id}: ${err.message?.slice(0, 100)}`);
      log.push({ id, error: err.message?.slice(0, 200), written: false });
    }
  }

  const logPath = path.join(process.cwd(), 'FORENSIC_281_BACKFILL_LOG.json');
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf8');
  console.log(`\nLog: ${logPath} (${log.length} registros)`);

  console.log('\n--- RESUMEN BACKFILL ---');
  console.log('Modo:', DRY_RUN ? 'DRY RUN (no escrito)' : 'EXECUTE (escrito)');
  console.log('Total procesados:', processed);
  console.log('Aprobados:', approved);
  console.log('Rechazados:', rejected);
  console.log('Errores:', errors);
  console.log('Escritos a Firestore:', written);

  // Score distribution
  const sc = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0 };
  for (const r of log) {
    if (r.newScore === null || r.newScore === undefined) continue;
    if (r.newScore < 50) sc['0-49']++;
    else if (r.newScore < 70) sc['50-69']++;
    else if (r.newScore < 90) sc['70-89']++;
    else sc['90-100']++;
  }
  console.log('Distribución final:', JSON.stringify(sc));

  // Blocking issues summary
  const blocked = log.filter(r => r.blockingIssues?.length > 0);
  if (blocked.length > 0) {
    console.log('\n--- ARTÍCULOS CON BLOCKING ISSUES ---');
    for (const b of blocked) {
      const issues = b.blockingIssues.map((i: any) => i.code).join(', ');
      console.log(`  ${b.id} | score=${b.newScore} | "${b.titulo?.slice(0, 50)}" | issues: ${issues}`);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
