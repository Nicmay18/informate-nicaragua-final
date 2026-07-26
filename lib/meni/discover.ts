import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniDiscover } from './types';

export function analyzeDiscover(result: EvaluacionEditorial): MeniDiscover {
  const discover = result.evidence.discover;
  const score = result.discover.score ?? 0;

  return {
    score: Math.round(score),
    imagenDestacada: !!discover.tieneImagen,
    clickbait: !!discover.tituloClickbait,
    fechaActualizada: !!discover.tieneFechaActualizacion,
  };
}
