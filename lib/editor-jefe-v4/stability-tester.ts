/**
 * Stability Tester V4 — FASE 6
 * ==============================
 * El mismo artículo analizado N veces debe producir:
 * misma categoría, mismo score, mismo veredicto, mismas recomendaciones.
 * No se aceptan resultados variables.
 */

import type { NoticiaInput } from '../analizador-noticias';
import { pipelineV4 } from './pipeline';
import type { ResultadoEditorial } from './types';

export interface StabilityResult {
  ejecuciones: number;
  categoriaEstable: boolean;
  scoreEstable: boolean;
  veredictoEstable: boolean;
  sugerenciasEstables: boolean;
  categorias: string[];
  scores: number[];
  veredictos: string[];
  sugerenciasSets: string[][];
  variacionScore: number;
  resultado: boolean;
}

export function testStability(
  noticia: NoticiaInput,
  ejecuciones = 20,
): StabilityResult {
  const resultados: ResultadoEditorial[] = [];

  for (let i = 0; i < ejecuciones; i++) {
    resultados.push(pipelineV4(noticia));
  }

  const categorias = resultados.map(r => r.categoria);
  const scores = resultados.map(r => r.scores.final);
  const veredictos = resultados.map(r => r.veredicto);
  const sugerenciasSets = resultados.map(r => [...r.sugerencias].sort());

  const categoriaEstable = new Set(categorias).size === 1;
  const scoreEstable = new Set(scores).size === 1;
  const veredictoEstable = new Set(veredictos).size === 1;

  const primerSet = JSON.stringify(sugerenciasSets[0]);
  const sugerenciasEstables = sugerenciasSets.every(s => JSON.stringify(s) === primerSet);

  const scoreMin = Math.min(...scores);
  const scoreMax = Math.max(...scores);
  const variacionScore = scoreMax - scoreMin;

  return {
    ejecuciones,
    categoriaEstable,
    scoreEstable,
    veredictoEstable,
    sugerenciasEstables,
    categorias,
    scores,
    veredictos,
    sugerenciasSets,
    variacionScore,
    resultado: categoriaEstable && scoreEstable && veredictoEstable && sugerenciasEstables,
  };
}
