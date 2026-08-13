/**
 * Guarda el artículo 1HmobwfngxeXoUofqosD que ahora aprueba MENI tras el bug fix.
 * Actualiza estado a publicado + campos MENI canónicos.
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { mapMeniScoreToNivel } from '@/lib/editorial/guardar-con-meni';
import { extractPuntosClave, extractFuente, getAutorFoto } from '@/lib/eeat-helpers';

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

const ID = '1HmobwfngxeXoUofqosD';

async function main() {
  console.log(`=== Guardando ${ID} (aprobado tras bug fix) ===`);
  const snap = await db.collection('noticias').doc(ID).get();
  if (!snap.exists) { console.log('No existe'); process.exit(1); }
  const d = snap.data()!;
  const contenido = sanitizeArticleHtml(typeof d.contenido === 'string' ? d.contenido : String(d.contenido || ''));

  const input: NoticiaInput = {
    id: ID,
    titulo: d.titulo || '',
    contenido,
    resumen: d.resumen || '',
    categoria: d.categoria || 'General',
    autor: d.autor || '',
    fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : new Date().toISOString(),
    imagen: d.imagen || undefined,
    slug: d.slug || ID,
  };

  const meni = await runMeniAsync(input, { db, skipEditorBrain: true });
  console.log(`Score: ${meni.scoreFinal} | Aprobado: ${meni.aprobado}`);

  if (!meni.aprobado) {
    console.log('No aprobó — no se guarda');
    process.exit(0);
  }

  const finalContenido = meni.articulo?.contenido || contenido;
  const palabras = finalContenido.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const { fuente, fuentesComplementarias } = extractFuente(finalContenido, d.resumen || '');
  const puntosClave = extractPuntosClave(finalContenido, 4);
  const autorFoto = getAutorFoto(d.autor || '');

  await db.collection('noticias').doc(ID).update({
    scoreMeni: meni.scoreFinal,
    aprobadoMeni: meni.aprobado,
    calificacionMeni: meni.calificacion,
    nivel: mapMeniScoreToNivel(meni.scoreFinal, meni.aprobado),
    nivelScore: meni.scoreFinal,
    nivelFecha: new Date().toISOString(),
    diagnosticoMeni: meni.diagnostico,
    editorialTier: meni.editorialTier,
    editorialReason: meni.editorialReason,
    recomendacionesMeni: meni.recomendaciones.map((r: any) => `${r.area}: ${r.mensaje}`),
    palabras,
    puntosClave,
    fuente: fuente || 'Redacción Nicaragua Informate',
    fuentesComplementarias,
    autorFoto,
    estado: 'publicado',
    publicado: true,
    cambiosRealizados: admin.firestore.FieldValue.arrayUnion({
      fase: 'PHASE16B_BUGFIX',
      fecha: new Date().toISOString(),
      accion: 'REEVAL_POST_BUGFIX',
      descripcion: 'Re-evaluación tras bug fix del detector de contradicciones (regex case-sensitive)',
      scoreMeniBefore: 92,
      scoreMeniAfter: meni.scoreFinal,
      aprobadoMeniBefore: false,
      aprobadoMeniAfter: true,
      actor: 'forensic-phase16b-script',
    }),
  });

  console.log('✓ Guardado y publicado');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
