import { analizarNoticia, type NoticiaInput } from '../lib/analizador-noticias';

const noticia: NoticiaInput = {
  titulo: 'Cuatro accidentes de tránsito en Managua dejan varios heridos',
  contenido: `
    <p>En horas de la mañana de este viernes se registraron cuatro accidentes de tránsito en distintos puntos de Managua, dejando al menos seis personas heridas, según reportes preliminares de testigos en el lugar.</p>
    <h2>Hechos principales</h2>
    <p>Los incidentes ocurrieron en la carretera Norte, la Rotonda Rubén Darío, el Mercado Oriental y la Pista de la Resistencia. En todos los casos se vio involucrado exceso de velocidad y conducir distraído, según versiones de conductores.</p>
    <h2>Contexto</h2>
    <p>Estos accidentes se suman a una estadística preocupante: en los últimos tres meses se han reportado más de 150 incidentes viales con heridos en la capital, según datos de la Policía Nacional de Tránsito. La cifra representa un aumento del 12% respecto al mismo período del año anterior.</p>
    <h2>Reacciones</h2>
    <p>Un comerciante del Mercado Oriental indicó que la falta de señalización contribuye a los choques. Nicaragua Informate pudo constatar en el lugar que varias señales están caídas o deterioradas.</p>
  `,
  resumen: 'Cuatro accidentes de tránsito en Managua dejan varios heridos este viernes.',
  categoria: 'Sucesos',
  autor: 'Redacción NI',
  fecha: new Date().toISOString(),
  slug: 'cuatro-accidentes-managua',
  imagenDestacada: 'https://example.com/imagen.jpg',
};

async function main() {
  const resultado = await analizarNoticia(noticia);
  console.log('Nivel:', resultado.nivel);
  console.log('Puntuación general:', resultado.puntuacion);
  console.log('Tipo artículo:', resultado.reporteVPR?.tipoArticulo);
  console.log('Categoría editorial:', resultado.reporteVPR?.tipoNota);
  console.log('--- REPORTE EDITOR JEFE IA ---');
  console.log(JSON.stringify(resultado.reporteVPR, null, 2));

  // Validación del reporte Forense V1.0
  if (!resultado.reporteForenseV1) {
    throw new Error('reporteForenseV1 no está presente en el resultado');
  }
  const forense = resultado.reporteForenseV1;
  console.log('--- REPORTE FORENSE V1.0 ---');
  console.log(JSON.stringify(forense, null, 2));

  console.log('Versión forense:', forense.version === '1.0' ? 'OK' : 'FALLÓ');
  console.log('Rol auditoría:', forense.rol === 'auditoria' ? 'OK' : 'FALLÓ');
  console.log('Triage items:', forense.fase1_triage.items.length === 9 ? 'OK' : 'FALLÓ');
  console.log('Cadena de custodia parrafos:', forense.fase4_cadenaCustodia.parrafos.length > 0 ? 'OK' : 'FALLÓ');
  console.log('EEAT checks:', forense.fase9_resonanciaEEAT.checks.length === 9 ? 'OK' : 'FALLÓ');
  console.log('Observaciones (array):', Array.isArray(forense.observaciones) ? 'OK' : 'FALLÓ');
  console.log('Advertencias (array):', Array.isArray(forense.advertencias) ? 'OK' : 'FALLÓ');
  console.log('Hallazgos (array):', Array.isArray(forense.hallazgos) ? 'OK' : 'FALLÓ');

  if (forense.version !== '1.0') throw new Error('Versión Forense V1 inválida');
  if (forense.rol !== 'auditoria') throw new Error('El reporte forense debe ser rol de auditoría');
  if (forense.fase1_triage.items.length !== 9) throw new Error('Fase 1 no tiene 9 preguntas');

  // Validación mínima de estructura V7
  if (resultado.reporteVPR) {
    const r = resultado.reporteVPR;
    const sugerencias = [
      ...r.oportunidadesEditoriales,
      ...r.comoConvertirReferencia,
      ...r.nivel10_oportunidades,
    ];
    const validas = sugerencias.every(s =>
      typeof s.texto === 'string' &&
      typeof s.impacto === 'string' &&
      typeof s.tiempo === 'string' &&
      ['Baja', 'Media', 'Alta'].includes(s.dificultad) &&
      typeof s.beneficio === 'string'
    );
    console.log('Sugerencias V7 estructuradas:', validas ? 'OK' : 'FALLÓ');
    if (!validas) {
      throw new Error('Algunas sugerencias no cumplen el formato SugerenciaV7');
    }

    const veredictosValidos = [
      '★ Reemplazable',
      '★★ Necesita desarrollo',
      '★★★ Publicable',
      '★★★★ Competitiva',
      '★★★★☆ Muy competitiva',
      '★★★★★ Nota de referencia',
    ];
    console.log('Veredicto V7:', veredictosValidos.includes(r.veredicto) ? 'OK' : 'FALLÓ');
    console.log('Razón referencia SI/NO:', ['Sí', 'No'].includes(r.razonReferenciaSiNo) ? 'OK' : 'FALLÓ');
    console.log('Retorno editorial:', ['ALTO', 'MEDIO', 'BAJO'].includes(r.retornoEditorial) ? 'OK' : 'FALLÓ');
    console.log('Decisión portada:', ['No publicar', 'Publicar breve', 'Publicar estándar', 'Portada', 'Cobertura especial'].includes(r.decisionPortada) ? 'OK' : 'FALLÓ');
    console.log('Descubre probabilidad:', ['ALTA', 'MEDIA', 'BAJA'].includes(r.descubreProbabilidad) ? 'OK' : 'FALLÓ');
    console.log('Categoría Facebook:', ['Servicio', 'Utilidad', 'Impacto', 'Identificación', 'Debate', 'Orgullo local', 'Sorpresa', 'Ninguna'].includes(r.categoriaFacebook) ? 'OK' : 'FALLÓ');
    console.log('Riesgo legal:', ['Bajo', 'Medio', 'Alto'].includes(r.riesgoLegal.nivel) ? 'OK' : 'FALLÓ');
    console.log('Firma director:', typeof r.firmaDirector === 'string' && r.firmaDirector.length > 10 ? 'OK' : 'FALLÓ');
    console.log('Producción Nicaragua Informate:', Array.isArray(r.produccionNicaraguaInformate) ? 'OK' : 'FALLÓ');

    if (!veredictosValidos.includes(r.veredicto)) throw new Error('Veredicto no pertenece a la escala V7');
    if (!['Sí', 'No'].includes(r.razonReferenciaSiNo)) throw new Error('razonReferenciaSiNo inválido');
    if (!['ALTO', 'MEDIO', 'BAJO'].includes(r.retornoEditorial)) throw new Error('retornoEditorial inválido');
    if (!['No publicar', 'Publicar breve', 'Publicar estándar', 'Portada', 'Cobertura especial'].includes(r.decisionPortada)) throw new Error('decisionPortada inválida');
    if (!['ALTA', 'MEDIA', 'BAJA'].includes(r.descubreProbabilidad)) throw new Error('descubreProbabilidad inválida');
    if (!['Servicio', 'Utilidad', 'Impacto', 'Identificación', 'Debate', 'Orgullo local', 'Sorpresa', 'Ninguna'].includes(r.categoriaFacebook)) throw new Error('categoriaFacebook inválida');
    if (!['Bajo', 'Medio', 'Alto'].includes(r.riesgoLegal.nivel)) throw new Error('riesgoLegal.nivel inválido');
    if (typeof r.firmaDirector !== 'string' || r.firmaDirector.length < 10) throw new Error('firmaDirector inválida');
  }
}

main().catch(console.error);
