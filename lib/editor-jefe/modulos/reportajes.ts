import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoPlano,
  detectoresValorAgregado,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

function detectarMultiplesFuentes(n: NoticiaInput): boolean {
  const atribuciones = (textoPlano(n).match(/\b([Ss]eg[úu]n|[Dd]e acuerdo con|[Ii]ndic[óo]|[Dd]eclar[óo]|[Pp]recis[óo]|[Cc]onfirm[óo]|[Dd]ijo|[Mm]encion[óo]|[Ss]eñal[óo]|[Ee]xplic[óo]|[Rr]eport[óo]|[Aa]segur[óo]|[Dd]etall[óo])\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
  return atribuciones >= 2;
}

function detectarDocumentacion(n: NoticiaInput): boolean {
  return /\b(documento|documentaci[oó]n|informe|parte|acta|resoluci[oó]n|decreto|comunicado|oficio|expediente|registro|dato oficial|estudio|encuesta)\b/i.test(textoPlano(n));
}

function sugerenciasReportajes(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const cronologia = detectoresValorAgregado.cronologia(n);
  const antecedentes = detectoresValorAgregado.antecedentes(n);
  const contexto = detectoresValorAgregado.contexto(n);
  const multiplesFuentes = detectarMultiplesFuentes(n);
  const comparacion = detectoresValorAgregado.comparacion(n);
  const documentacion = detectarDocumentacion(n);

  const oportunidades = [];

  if (!cronologia) {
    oportunidades.push(fabricarSugerencia(
      'Construir una cronología clara de los hechos con fechas y momentos verificables.',
      'Estructura narrativa.',
      '30-60 min',
      'Media',
      'Da coherencia al reportaje.'
    ));
  }

  if (!contexto) {
    oportunidades.push(fabricarSugerencia(
      'Situar el reportaje con contexto suficiente para que el lector comprenda por qué importa el tema.',
      'Trasfondo.',
      '20-40 min',
      'Media',
      'Evita lectura aislada.'
    ));
  }

  if (!antecedentes) {
    oportunidades.push(fabricarSugerencia(
      'Incluir antecedentes o casos similares que justifiquen la profundidad del reportaje.',
      'Profundidad.',
      '30-60 min',
      'Media',
      'Amplía relevancia.'
    ));
  }

  if (!multiplesFuentes) {
    oportunidades.push(fabricarSugerencia(
      'Asegurar más de dos fuentes identificadas (voces, documentos o testimonios) para sostener el reportaje.',
      'Autoridad.',
      '1-2 días',
      'Alta',
      'Robustez periodística.'
    ));
  }

  if (!comparacion) {
    oportunidades.push(fabricarSugerencia(
      'Comparar con datos oficiales, tendencias o situaciones anteriores para enriquecer el análisis.',
      'Contexto comparativo.',
      '20-40 min',
      'Media',
      'Mayor alcance.'
    ));
  }

  if (!documentacion) {
    oportunidades.push(fabricarSugerencia(
      'Fundamentar con documentación, registros o datos públicos verificables.',
      'Evidencia.',
      '20-40 min',
      'Media',
      'Reduce riesgo de desmentido.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Ampliar con entrevistas complementarias y datos oficiales adicionales.',
        'Profundidad.',
        '2-3 días',
        'Alta',
        'Autoridad.'
      ),
      fabricarSugerencia(
        'Crear línea de tiempo interactiva o visualización del tema.',
        'Evergreen.',
        '1-2 días',
        'Media',
        'Consulta recurrente.'
      ),
      fabricarSugerencia(
        'Actualizar cuando surjan nuevos datos o posiciones oficiales.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Mantiene vigencia.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'Reportaje documental con archivo y múltiples voces del ecosistema afectado.',
        'Referencia.',
        '3-5 días',
        'Alta',
        'Autoridad editorial.'
      ),
    ],
  };
}

function calcularUtilidadReportajes(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 50;
  if (detectoresValorAgregado.cronologia(n)) puntos += 15;
  if (detectoresValorAgregado.contexto(n)) puntos += 10;
  if (detectoresValorAgregado.antecedentes(n)) puntos += 10;
  if (detectarMultiplesFuentes(n)) puntos += 15;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaReportajes(n: NoticiaInput, ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (!detectoresValorAgregado.cronologia(n)) faltantes.push('faltó cronología');
  if (!detectoresValorAgregado.contexto(n)) faltantes.push('faltó contexto');
  if (!detectoresValorAgregado.antecedentes(n)) faltantes.push('faltó antecedentes');
  if (!detectarMultiplesFuentes(n) && ev.dosFuentes < 60) faltantes.push('faltó más de dos fuentes');
  if (!detectarDocumentacion(n) && ev.documentoOficial < 60) faltantes.push('faltó documentación');
  return faltantes;
}

export function evaluarReportajes(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasReportajes(n, ev);
  const utilidad = calcularUtilidadReportajes(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);

  return {
    vertical: 'Reportajes',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones: consistenciaReportajes(n, ev) },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 60 ? 60 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0
      ? diferenciador.elementosDetectados
      : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'],
  };
}
