import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniAdSense } from './types';

export function analyzeAdSense(result: EvaluacionEditorial): MeniAdSense {
  const adsense = result.evidence.adsense;
  const score = result.adsense.score ?? 0;

  const advertencias: string[] = [];
  if (adsense.palabrasSensibles?.length) advertencias.push(`Palabras sensibles: ${adsense.palabrasSensibles.slice(0, 5).join(', ')}`);
  if (adsense.tieneClickbait) advertencias.push('Posible clickbait detectado.');

  return {
    score: Math.round(score),
    seguro: result.riesgo.seguro,
    advertencias,
  };
}
