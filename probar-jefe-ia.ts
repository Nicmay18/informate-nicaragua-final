import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAdminDb } from './lib/firebase-admin';
import { analizarNoticia, type NoticiaInput } from './lib/analizador-noticias';

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

  console.log(`Últimas ${docs.length} noticias publicadas analizadas\n`);
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
    };

    console.log(`\nTITULAR: ${input.titulo}`);
    console.log(`SLUG:    ${input.slug}`);
    console.log(`FECHA:   ${fechaDate ? fechaDate.toLocaleString('es-NI', { timeZone: 'America/Managua' }) : 'N/A'}`);

    try {
      const r = await analizarNoticia(input);
      const vpr = r.reporteVPR;

      if (!vpr) {
        console.log('SIN REPORTE VPR (el analizador no generó el campo reporteVPR).');
        console.log('Estructura del resultado:', Object.keys(r));
        continue;
      }

      console.log(`PUNTUACIÓN: ${vpr.puntuacion}/${vpr.puntuacionMaxima}`);
      console.log(`VEREDICTO:  ${vpr.veredicto}`);
      console.log(`DECISIÓN:   ${vpr.decisionPortada}`);
      console.log(`EXPLICACIÓN PORTADA: ${vpr.explicacionPortada}`);
      console.log(`TIPO:       ${vpr.tipoArticulo} (${vpr.tipoNota})`);
      console.log(`RAZÓN PARA REFERENCIA: ${vpr.razonReferenciaSiNo} — ${vpr.razonamientoReferencia}`);
      console.log(`EVIDENCIA:  ${vpr.nivelEvidencia.map(e => `${e.criterio}: ${e.detectado} (${e.puntaje}/${e.maximo})`).join(' | ')}`);
      console.log(`OPORTUNIDADES EDITORIALES:`);
      vpr.oportunidadesEditoriales.forEach((s, i) => console.log(`  ${i + 1}. ${s.texto}`));
      console.log(`CÓMO CONVERTIR EN REFERENCIA:`);
      vpr.comoConvertirReferencia.forEach((s, i) => console.log(`  ${i + 1}. ${s.texto}`));
      if (vpr.auditoriaInterna?.observaciones?.length) {
        console.log(`OBSERVACIONES AUDITORÍA:`);
        vpr.auditoriaInterna.observaciones.forEach(o => console.log(`  - ${o}`));
      }
      if (vpr.auditoriaInterna?.ajustesRealizados?.length) {
        console.log(`AJUSTES REALIZADOS:`);
        vpr.auditoriaInterna.ajustesRealizados.forEach(a => console.log(`  - ${a}`));
      }

      // Verificar posibles alucinaciones críticas
      const problemas: string[] = [];
      if (vpr.puntuacion >= 85 && !vpr.nivelEvidencia.some(e => e.detectado === 'Sí' && e.puntaje > 0)) {
        problemas.push('ALUCINACIÓN: puntaje alto sin evidencia detectada');
      }
      if (vpr.veredicto === '★★★★★ Nota de referencia' && vpr.puntuacion < 90) {
        problemas.push('INCONSISTENCIA: Nota de referencia con puntuación < 90');
      }
      if (vpr.decisionPortada === 'Cobertura especial' && vpr.puntuacion < 95) {
        problemas.push('INCONSISTENCIA: Cobertura especial con puntuación < 95');
      }
      const sugerenciasProhibidas = /\b(entrevistar|entrevista\s+(?:a|con)|solicitar\s+(?:expediente|copia|ficha)|consultar\s+(?:hospital|medicina\s+legal|fiscal|policia|bomberos)|esperar\s+version\s+policial|en\s+el\s+lugar|presencial)\b/i;
      const sugerenciasSospechosas = [
        ...vpr.oportunidadesEditoriales,
        ...vpr.comoConvertirReferencia,
        ...vpr.nivel10_oportunidades,
      ].filter(s => sugerenciasProhibidas.test(s.texto.toLowerCase()));
      if (sugerenciasSospechosas.length) {
        problemas.push(`SUGERENCIA NO REALIZABLE: ${sugerenciasSospechosas[0].texto}`);
      }

      // Verificar observaciones internas del motor editorial V2
      if (vpr.auditoriaInterna?.observaciones?.some((o: string) => o.includes('CONTRADICCIÓN'))) {
        problemas.push('CONTRADICCIÓN INTERNA: el motor editorial V2 detectó una inconsistencia.');
      }

      if (problemas.length) {
        console.log(`PROBLEMAS DETECTADOS:`);
        problemas.forEach(p => console.log(`  ⚠ ${p}`));
      } else {
        console.log('SIN ALUCINACIONES CRÍTICAS DETECTADAS EN ESTA PRUEBA.');
      }

      resultados.push({
        titulo: input.titulo,
        slug: input.slug,
        fecha: fechaDate ? fechaDate.toISOString() : null,
        puntuacion: vpr.puntuacion,
        veredicto: vpr.veredicto,
        decisionPortada: vpr.decisionPortada,
        explicacionPortada: vpr.explicacionPortada,
        tipoArticulo: vpr.tipoArticulo,
        tipoNota: vpr.tipoNota,
        razonReferenciaSiNo: vpr.razonReferenciaSiNo,
        razonamientoReferencia: vpr.razonamientoReferencia,
        nivelEvidencia: vpr.nivelEvidencia,
        oportunidadesEditoriales: vpr.oportunidadesEditoriales.map(s => s.texto),
        comoConvertirReferencia: vpr.comoConvertirReferencia.map(s => s.texto),
        nivel10_oportunidades: vpr.nivel10_oportunidades.map(s => s.texto),
        observacionesAuditoria: vpr.auditoriaInterna?.observaciones || [],
        ajustesRealizados: vpr.auditoriaInterna?.ajustesRealizados || [],
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

  console.log(`\n✅ PRUEBA APROBADA: ${resultados.length} notas sin contradicciones.`);
  console.log(`Resultados guardados en probar-jefe-ia-resultados.json (${resultados.length} notas).`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
