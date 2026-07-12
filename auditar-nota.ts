/**
 * Modo Auditor — consulta una nota por slug y muestra:
 * 1. Auditoría de puntos perdidos y cómo recuperarlos.
 * 2. Debug editorial con las reglas que produjeron cada decisión.
 *
 * Uso:
 *   npx tsx auditar-nota.ts <slug>
 *   npx tsx auditar-nota.ts fiscalia-acusa-a-madre-y-padrastro-por-muerte-de-nino
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAdminDb } from './lib/firebase-admin';
import { analizarNoticia, type NoticiaInput } from './lib/analizador-noticias';
import { modoAuditor, formatearAuditoriaMarkdown, generarDebugEditorial, formatearDebugMarkdown } from './lib/editor-jefe/auditor';
import { calcularMatrizConfianza, generarBenchmark, formatearMatrizConfianza, formatearBenchmark, puntuacionAEstrellas } from './lib/editor-jefe/confianza';

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

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Uso: npx tsx auditar-nota.ts <slug>');
    process.exit(1);
  }

  const db = getAdminDb();
  const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();

  if (snap.empty) {
    console.error(`No se encontró nota con slug "${slug}".`);
    process.exit(1);
  }

  const doc = snap.docs[0];
  const data = doc.data();
  const fechaDate = await safeDate(data.fecha);

  const input: NoticiaInput = {
    titulo: data.titulo || '',
    contenido: data.contenido || '',
    resumen: data.resumen || '',
    categoria: data.categoria || 'Actualidad',
    autor: data.autor || '',
    fecha: fechaDate ? fechaDate.toISOString() : '',
    slug,
    keywords: data.keywords || '',
  };

  const r = await analizarNoticia(input);

  console.log(`# Auditoría Editorial`);
  console.log(`**Estrellas:** ${puntuacionAEstrellas(r.puntuacion)}`);
  console.log(`**Puntuación numérica:** ${r.puntuacion}/100`);
  console.log('');

  console.log(formatearAuditoriaMarkdown(modoAuditor(input, r)));
  console.log('\n---\n');
  console.log(formatearDebugMarkdown(generarDebugEditorial(input, r)));
  console.log('\n---\n');
  console.log(formatearMatrizConfianza(calcularMatrizConfianza(input, r), input.titulo));
  console.log('\n---\n');
  console.log(formatearBenchmark(generarBenchmark(input, r)));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
