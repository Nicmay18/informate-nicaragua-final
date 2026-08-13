/**
 * Diagnóstico profundo de por qué MENI rechaza artículos con score alto.
 * Toma 3 casos representativos (92, 88, 74) y descompone el resultado de MENI
 * para identificar la causa exacta del rechazo.
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

const CASOS = [
  { id: '1HmobwfngxeXoUofqosD', label: 'score 92, rechazado' },
  { id: 'ic2YGP8NQAc6r3VMvy9K', label: 'score 88, rechazado' },
  { id: 'Ilzcy77tyF8oFNPytokN', label: 'score 74, rechazado' },
];

async function main() {
  for (const caso of CASOS) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`CASO: ${caso.id} — ${caso.label}`);
    console.log('='.repeat(80));

    const snap = await db.collection('noticias').doc(caso.id).get();
    if (!snap.exists) { console.log('No existe'); continue; }
    const d = snap.data()!;
    const contenido = sanitizeArticleHtml(typeof d.contenido === 'string' ? d.contenido : String(d.contenido || ''));

    const input: NoticiaInput = {
      id: caso.id,
      titulo: d.titulo || '',
      contenido,
      resumen: d.resumen || '',
      categoria: d.categoria || 'General',
      autor: d.autor || '',
      fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : new Date().toISOString(),
      imagen: d.imagen || undefined,
      slug: d.slug || caso.id,
    };

    const meni = await runMeniAsync(input, { db, skipEditorBrain: true });

    console.log('scoreFinal:', meni.scoreFinal);
    console.log('aprobado:', meni.aprobado);
    console.log('calificacion:', meni.calificacion);
    console.log('editorialTier:', meni.editorialTier);
    console.log('editorialReason:', meni.editorialReason);
    console.log('diagnostico:', meni.diagnostico);
    console.log('\nblockingIssues:', JSON.stringify(meni.blockingIssues, null, 2));
    console.log('\nwarnings:', JSON.stringify(meni.warnings, null, 2));
    console.log('\nrecomendaciones:');
    for (const r of meni.recomendaciones) {
      console.log(`  [${r.area}] ${r.mensaje}`);
    }
    console.log('\neditorialDecision (si está expuesto):');
    const anyMeni = meni as any;
    if (anyMeni.editorialDecision) {
      console.log('  bloquear:', anyMeni.editorialDecision.bloquear);
      console.log('  motivoBloqueo:', anyMeni.editorialDecision.motivoBloqueo);
      console.log('  recomendacionEditorial:', anyMeni.editorialDecision.recomendacionEditorial);
      console.log('  score:', anyMeni.editorialDecision.score);
    }
    if (anyMeni.qualityGate) {
      console.log('\nqualityGate:');
      console.log('  bloqueado:', anyMeni.qualityGate.bloqueado);
      console.log('  issues:', JSON.stringify(anyMeni.qualityGate.issues?.map((i:any)=>({severidad:i.severidad,tipo:i.tipo,mensaje:i.mensaje})), null, 2));
      console.log('  explanationIndex:', JSON.stringify(anyMeni.qualityGate.explanationIndex, null, 2));
    }
    if (anyMeni.editorialDna) {
      console.log('\neditorialDna:');
      console.log('  bloquear:', anyMeni.editorialDna.bloquear);
      console.log('  motivoBloqueo:', anyMeni.editorialDna.motivoBloqueo);
      console.log('  adnNI:', anyMeni.editorialDna.adnNI);
      console.log('  selloNI:', JSON.stringify(anyMeni.editorialDna.selloNI, null, 2));
    }
    if (anyMeni.duplicado) {
      console.log('\nduplicado:', JSON.stringify(anyMeni.duplicado, null, 2));
    }
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
