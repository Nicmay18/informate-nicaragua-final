import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniForense } from './types';

export function analyzeForensic(result: EvaluacionEditorial): MeniForense {
  const forense = result.evidence.forense;
  const score = result.forense.score ?? 0;

  let nivel: MeniForense['nivel'] = 'VERDE';
  if (forense.nivelRiesgo === 'Crítico' || forense.nivelRiesgo === 'Alto') nivel = 'ROJO';
  else if (forense.nivelRiesgo === 'Medio') nivel = 'AMARILLO';

  return {
    score: Math.round(score),
    nivel,
    adjetivosEmocionales: forense.adjetivosEmocionales?.slice(0, 10) ?? [],
    riesgosLegales: forense.riesgosLegales?.slice(0, 6) ?? [],
  };
}
