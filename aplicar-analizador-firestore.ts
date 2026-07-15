/**
 * Aplicar el analizador forense/editorial actualizado a todas las noticias de Firestore.
 *
 * Uso:
 *   npx tsx aplicar-analizador-firestore.ts           # dry-run: solo muestra
 *   npx tsx aplicar-analizador-firestore.ts --apply   # escribe en Firestore
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAdminDb } from './lib/firebase-admin';
import { analizarNoticia, type NoticiaInput } from './lib/analizador-noticias';
import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';

const APLICAR = process.argv.includes('--apply');
const LOTE = 500;
const BATCH_MAX = 25;

async function safeDate(value: unknown): Promise<Date | null> {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    try {
      const d = (value as any).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    } catch { return null; }
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    try {
      const sec = Number((value as any)._seconds);
      const ns = Number((value as any)._nanoseconds || 0);
      const d = new Date(sec * 1000 + ns / 1_000_000);
      return !isNaN(d.getTime()) ? d : null;
    } catch { return null; }
  }
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

async function toInput(data: FirebaseFirestore.DocumentData, id: string): Promise<NoticiaInput> {
  const fechaDate = await safeDate(data.fecha);
  return {
    titulo: (data.titulo || '').toString(),
    contenido: (data.contenido || '').toString(),
    resumen: (data.resumen || '').toString(),
    categoria: (data.categoria || 'General').toString(),
    autor: (data.autor || '').toString(),
    fecha: fechaDate ? fechaDate.toISOString() : new Date().toISOString(),
    slug: (data.slug || id).toString(),
    keywords: Array.isArray(data.keywords) ? data.keywords : (data.keywords || '').toString(),
    imagenDestacada: data.imagenDestacada || data.imagen || undefined,
  };
}

function esPlainObject(o: any): boolean {
  return o !== null && typeof o === 'object' && !Array.isArray(o) && Object.getPrototypeOf(o) === Object.prototype;
}

function sinUndefined<T>(obj: T): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(sinUndefined);
  if (!esPlainObject(obj)) return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) out[k] = sinUndefined(v);
  return out;
}

async function main() {
  const db = getAdminDb();
  let lastDoc: QueryDocumentSnapshot | undefined;
  let procesadas = 0;
  let actualizadas = 0;
  let fallidas = 0;
  let page = 0;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  APLICAR ANALIZADOR A TODAS LAS NOTICIAS`);
  console.log(`  MODO: ${APLICAR ? 'ESCRITURA' : 'DRY-RUN (solo lectura)'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  do {
    page++;
    let query = db.collection('noticias').orderBy('fecha', 'desc').limit(LOTE);
    if (lastDoc) query = query.startAfter(lastDoc);
    const snap = await query.get();
    if (snap.empty) break;

    let batch = db.batch();
    let enBatch = 0;

    for (const doc of snap.docs) {
      procesadas++;
      const data = doc.data();
      const input = await toInput(data, doc.id);

      try {
        const resultado = await analizarNoticia(input);

        if (APLICAR) {
          batch.update(doc.ref, {
            analisisEditorial: sinUndefined(resultado),
            puntuacion: resultado.puntuacion,
            nivel: resultado.nivel,
            aprobado: resultado.aprobado,
            tipoNotaForense: resultado.reporteForenseV1?.fase0_identificacion.tipoNota || null,
            tipoNotaEditorial: resultado.reporteVPR?.tipoNota || null,
            accionesRequeridas: resultado.accionesRequeridas || [],
            fechaAnalisis: FieldValue.serverTimestamp(),
          });
          enBatch++;

          if (enBatch >= BATCH_MAX) {
            await batch.commit();
            actualizadas += enBatch;
            console.log(`\n✅ Sub-lote confirmado: ${enBatch} documentos actualizados (total ${actualizadas}).\n`);
            enBatch = 0;
            batch = db.batch();
          }
        }

        console.log(`[${procesadas}] ${input.slug} → ${resultado.nivel} (${resultado.puntuacion}/100)`);
      } catch (err) {
        fallidas++;
        console.error(`[${procesadas}] ${input.slug} ERROR: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (APLICAR && enBatch > 0) {
      await batch.commit();
      actualizadas += enBatch;
      console.log(`\n✅ Lote ${page} confirmado: ${enBatch} documentos actualizados.\n`);
    }

    lastDoc = snap.docs[snap.docs.length - 1];
  } while (lastDoc);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Noticias procesadas: ${procesadas}`);
  console.log(`  Actualizadas:        ${actualizadas}`);
  console.log(`  Fallidas:            ${fallidas}`);
  console.log(`  Modo:                ${APLICAR ? 'ESCRITURA' : 'DRY-RUN (sin cambios)'}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
