import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAdminDb } from './lib/firebase-admin';
import { runMeniAsync } from './lib/meni';
import type { NoticiaInput } from './lib/meni/types';

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
  const db = getAdminDb();

  // Últimas 100 noticias publicadas para validación de consistencia a escala
  const snap = await db
    .collection('noticias')
    .orderBy('fecha', 'desc')
    .limit(100)
    .get();

  const docs = snap.docs.filter(d => {
    const data = d.data();
    if (data.estado === 'borrador') return false;
    if (data.publicado === false) return false;
    return true;
  });

  const resultados: any[] = [];

  console.log(`Últimas ${docs.length} noticias publicadas analizadas con MENI\n`);
  console.log('='.repeat(80));

  for (const doc of docs) {
    const data = doc.data();
    const fechaDate = await safeDate(data.fecha);

    const input: NoticiaInput = {
      titulo: data.titulo || '',
      contenido: data.contenido || '',
      resumen: data.resumen || '',
      categoria: data.categoria || 'Actualidad',
      autor: data.autor || '',
      fecha: fechaDate ? fechaDate.toISOString() : '',
      slug: data.slug || doc.id,
      keywords: data.keywords || '',
      imagen: data.imagen || '',
    };

    console.log(`\nTITULAR: ${input.titulo}`);
    console.log(`SLUG:    ${input.slug}`);
    console.log(`FECHA:   ${fechaDate ? fechaDate.toLocaleString('es-NI', { timeZone: 'America/Managua' }) : 'N/A'}`);

    try {
      const r = await runMeniAsync(input, { db });
      const blockers = r.blockingIssues ?? [];

      console.log(`SCORE:      ${r.scoreFinal ?? 'SIN SCORE'}`);
      console.log(`VEREDICTO:  ${r.estadoFinal} (aprobado=${r.aprobado}, calificación=${r.calificacion})`);
      console.log(`CATEGORÍA:  ${r.categoria} [${r.classificationStatus}] prioridad=${r.prioridad} riesgo=${r.riesgo}`);
      console.log(`AUTO-CORRECCIONES: ${r.autoCorrections?.length ?? 0}`);
      if (blockers.length) {
        console.log(`ISSUES BLOQUEANTES:`);
        blockers.forEach(i => console.log(`  - [${i.severidad}] ${i.categoria}: ${i.mensaje}`));
      }
      const topRecs = (r.recomendaciones ?? []).slice(0, 3);
      topRecs.forEach(rec => console.log(`  REC: ${rec.mensaje ?? JSON.stringify(rec)}`));

      // Invariantes de consistencia del motor editorial
      const problemas: string[] = [];
      if (r.scoreFinal === null || r.score_status === 'INVALID') {
        problemas.push(`EVALUACION INVALIDA: scoreFinal=${r.scoreFinal} source=${r.invalidScoreSource ?? 'desconocida'}`);
      }
      if (r.aprobado && r.estadoFinal !== 'APROBADO') {
        problemas.push(`INCONSISTENCIA: aprobado=true con estadoFinal=${r.estadoFinal}`);
      }
      if (r.aprobado && blockers.length > 0) {
        problemas.push(`INCONSISTENCIA: aprobado con ${blockers.length} issues bloqueantes`);
      }
      if (r.estadoFinal === 'EVALUATION_ERROR') {
        problemas.push('EVALUATION_ERROR declarado por el motor');
      }
      if (r.autoCorrections?.length && !r.autoCorrected) {
        problemas.push('INCONSISTENCIA: correcciones reportadas sin autoCorrected=true');
      }

      if (problemas.length) {
        console.log(`PROBLEMAS DETECTADOS:`);
        problemas.forEach(p => console.log(`  ⚠ ${p}`));
      } else {
        console.log('SIN INCONSISTENCIAS DETECTADAS EN ESTA PRUEBA.');
      }

      resultados.push({
        titulo: input.titulo,
        slug: input.slug,
        fecha: fechaDate ? fechaDate.toISOString() : null,
        scoreFinal: r.scoreFinal,
        estadoFinal: r.estadoFinal,
        aprobado: r.aprobado,
        calificacion: r.calificacion,
        categoria: r.categoria,
        classificationStatus: r.classificationStatus,
        prioridad: r.prioridad,
        riesgo: r.riesgo,
        autoCorrections: r.autoCorrections?.length ?? 0,
        blockingIssues: blockers.map(i => ({ severidad: i.severidad, categoria: i.categoria, mensaje: i.mensaje })),
        problemas,
      });
    } catch (err: any) {
      console.log(`ERROR analizando: ${err instanceof Error ? err.message : String(err)}`);
      resultados.push({
        titulo: input.titulo,
        slug: input.slug,
        fecha: fechaDate ? fechaDate.toISOString() : null,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    console.log('\n' + '='.repeat(80));
  }

  // Guardar resultados limpios para revisión
  const fs = await import('fs/promises');
  await fs.writeFile('probar-jefe-ia-resultados.json', JSON.stringify(resultados, null, 2), 'utf-8');

  const problemasTotales = resultados.reduce((sum, r) => sum + (r.problemas?.length || 0), 0);
  const notasConProblemas = resultados.filter(r => (r.problemas?.length || 0) > 0).length;

  if (problemasTotales > 0) {
    console.error(`\n❌ PRUEBA FALLIDA: ${problemasTotales} problemas detectados en ${notasConProblemas} de ${resultados.length} notas.`);
    console.error(`Revisa probar-jefe-ia-resultados.json para los detalles.`);
    process.exit(1);
  }

  console.log(`\n✅ PRUEBA APROBADA: ${resultados.length} notas sin inconsistencias.`);
  console.log(`Resultados guardados en probar-jefe-ia-resultados.json (${resultados.length} notas).`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
