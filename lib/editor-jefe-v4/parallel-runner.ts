/**
 * Parallel Runner V4 — REGLA 14
 * ==============================
 * Ejecuta V3 (sistema actual) y V4 en paralelo para comparación.
 * No elimina V3 hasta que V4 demuestre consistencia y estabilidad.
 */

import type { NoticiaInput, ResultadoAnalisis } from '../analizador-noticias';
import type { ResultadoEditorial } from './types';
import { pipelineV4 } from './pipeline';

export interface ParallelResult {
  v3: ResultadoAnalisis | null;
  v4: ResultadoEditorial;
  comparacion: ComparacionV3V4;
}

export interface ComparacionV3V4 {
  scoreV3: number | null;
  scoreV4: number;
  diferenciaScore: number | null;
  veredictoV3: string | null;
  veredictoV4: string;
  coinciden: boolean;
  observaciones: string[];
}

/**
 * Ejecuta V4 y compara con el resultado V3 ya calculado.
 * V3 es async, por lo que el endpoint lo ejecuta por separado.
 */
export function runParallel(
  noticia: NoticiaInput,
  v3?: ResultadoAnalisis | null,
): ParallelResult {
  // Ejecutar V4 (síncrono)
  const v4 = pipelineV4(noticia);

  // Comparar
  const scoreV3 = v3?.puntuacion ?? null;
  const scoreV4 = v4.scores.final;
  const veredictoV3 = v3?.nivel ?? null;
  const veredictoV4 = v4.veredicto;

  const observaciones: string[] = [];

  if (scoreV3 !== null) {
    const diff = Math.abs(scoreV3 - scoreV4);
    if (diff > 20) {
      observaciones.push(`Diferencia de score significativa: V3=${scoreV3}, V4=${scoreV4} (diff=${diff})`);
    }
    if (diff <= 10) {
      observaciones.push(`Scores cercanos: V3=${scoreV3}, V4=${scoreV4}`);
    }
  }

  if (veredictoV3 && veredictoV4 !== 'EDITOR_INCONSISTENT') {
    if (veredictoV3 === (veredictoV4 as string)) {
      observaciones.push('Veredictos coinciden');
    } else {
      observaciones.push(`Veredictos difieren: V3=${veredictoV3}, V4=${veredictoV4}`);
    }
  }

  if (v4.consistencia.ok) {
    observaciones.push('V4: Consistency Engine OK');
  } else {
    observaciones.push(`V4: Consistency Engine detectó ${v4.consistencia.violaciones.length} violaciones`);
  }

  const comparacion: ComparacionV3V4 = {
    scoreV3,
    scoreV4,
    diferenciaScore: scoreV3 !== null ? scoreV4 - scoreV3 : null,
    veredictoV3,
    veredictoV4,
    coinciden: scoreV3 !== null && Math.abs(scoreV3 - scoreV4) <= 15 && veredictoV3 === (veredictoV4 as string),
    observaciones,
  };

  return { v3: v3 ?? null, v4, comparacion };
}
