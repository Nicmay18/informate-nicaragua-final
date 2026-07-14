import type { NoticiaInput } from '../../analizador-noticias';
import type { ResultadoEditorJefeV2 } from '../engine';
import { detectarVertical } from '../perfiles';
import type { EvaluacionVertical } from './base';
import { evaluarSucesos } from './sucesos';
import { evaluarNacionales } from './nacionales';
import { evaluarInternacionales } from './internacionales';
import { evaluarDeportes } from './deportes';
import { evaluarEspectaculos } from './espectaculos';
import { evaluarTecnologia } from './tecnologia';
import { evaluarEconomia } from './economia';
import { evaluarOpinion } from './opinion';
import { evaluarReportajes } from './reportajes';
import { evaluarGuias } from './guias';

export function evaluarPorVertical(
  n: NoticiaInput,
  v2: ResultadoEditorJefeV2
): EvaluacionVertical {
  if (v2.fase2_tipoNota.tipo === 'Reportaje') {
    return evaluarReportajes(n, v2);
  }

  const vertical = detectarVertical(n);

  switch (vertical) {
    case 'Sucesos':
      return evaluarSucesos(n, v2);
    case 'Nacionales':
    case 'Política':
      return evaluarNacionales(n, v2);
    case 'Internacionales':
      return evaluarInternacionales(n, v2);
    case 'Deportes':
      return evaluarDeportes(n, v2);
    case 'Espectáculos':
      return evaluarEspectaculos(n, v2);
    case 'Tecnología':
      return evaluarTecnologia(n, v2);
    case 'Economía':
      return evaluarEconomia(n, v2);
    case 'Opinión':
      return evaluarOpinion(n, v2);
    case 'Servicio':
      return evaluarGuias(n, v2);
    case 'Reportajes':
      return evaluarReportajes(n, v2);
    default:
      return evaluarGenerico(n, v2, vertical);
  }
}

function evaluarGenerico(
  _n: NoticiaInput,
  v2: ResultadoEditorJefeV2,
  vertical: EvaluacionVertical['vertical']
): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  return {
    vertical,
    sugerencias: v2.fase5_sugerencias,
    utilidad: ev.utilidad,
    originalidad: ev.originalidad,
    consistencia: v2.fase6_consistencia,
    diferenciadorNI: { elementosDetectados: [], puntuacion: 0, resumen: 'Sin evaluación específica para esta vertical.' },
    prioridadEditorial: v2.fase3_decision.accion === 'portada' ? 'Principal' : 'Secundaria',
    valorAgregado: ['Sin aporte propio detectado'],
  };
}

