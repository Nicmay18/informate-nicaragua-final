/**
 * FASE 9 — Re-evaluar MENI de los 5 artículos con título modificado.
 * Regla: si se modifica titulo, se debe re-evaluar MENI.
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { mapMeniScoreToNivel } from '@/lib/editorial/guardar-con-meni';

try { const e = path.join(process.cwd(), '.env.local'); if (fs.existsSync(e)) { for (const l of fs.readFileSync(e, 'utf8').split('\n')) { const l2 = l.replace(/\r$/, ''); const m = l2.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'); } } } catch {}

const fixes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_PHASE7_FIXES.json'), 'utf8'));
const idsToReeval = fixes.map((f: any) => f.id);

let sa: any;
const saPath = 'g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
try { sa = JSON.parse(fs.readFileSync(saPath, 'utf8')); } catch {
  let pk = process.env.FIREBASE_PRIVATE_KEY;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) { sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')); }
  else if (pk) { sa = { projectId: process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua', clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }; }
  else { console.error('FALTA KEY'); process.exit(1); }
}
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  console.log('\n=== FASE 9: RE-EVALUACIÓN MENI DE ARTÍCULOS MODIFICADOS ===\n');
  console.log('Artículos a re-evaluar:', idsToReeval.length);

  for (const id of idsToReeval) {
    const doc = await db.collection('noticias').doc(id).get();
    const d = doc.data()!;
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
    const oldScore = d.scoreMeni;
    const newScore = meni.scoreFinal;

    const updateData: Record<string, unknown> = {
      scoreMeni: newScore,
      aprobadoMeni: meni.aprobado,
      calificacionMeni: meni.calificacion,
      nivel: mapMeniScoreToNivel(newScore, meni.aprobado),
      nivelScore: newScore,
      nivelFecha: new Date().toISOString(),
      diagnosticoMeni: meni.diagnostico,
      editorialTier: (meni as any).editorialTier || null,
      contenido: sanitized,
    };

    await db.collection('noticias').doc(id).update(updateData);

    const fix = fixes.find((f: any) => f.id === id);
    console.log(`  ${id} | titulo fix: "${fix.valorAnterior}" → "${fix.valorNuevo}"`);
    console.log(`    MENI: ${oldScore} → ${newScore} | aprobado: ${meni.aprobado} | calif: ${meni.calificacion}`);
  }

  console.log('\nRe-evaluación completa.');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
