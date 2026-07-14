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

export function evaluarPorVertical(
  n: NoticiaInput,
  v2: ResultadoEditorJefeV2
): EvaluacionVertical {
  const vertical = detectarVertical(n);

  switch (vertical) {
    case 'Sucesos':
      return evaluarSucesos(n, v2);
    case 'Nacionales':
      return evaluarNacionales(n, v2);
    case 'Internacionales':
      return evaluarInternacionales(n, v2);
    case 'Deportes':
      return evaluarDeportes(n, v2);
    case 'Espectáculos':
      return evaluarEspectaculos(n, v2);
    case 'Tecnología':
      return evaluarTecnologia(n, v2);
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

