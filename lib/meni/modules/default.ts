import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniRecomendacion } from '../types';

export const nombre = 'General';

export function recomendaciones(result: EvaluacionEditorial): MeniRecomendacion[] {
  const recs: MeniRecomendacion[] = [];
  if (!result.evidence.evidence.esNotaVerificable) {
    recs.push({ area: 'General', severidad: 'media', mensaje: 'Refuerce la noticia con datos verificables y contexto.' });
  }
  return recs;
}

export function angulo(): string {
  return 'Contar el hecho con claridad, contexto y valor para el lector.';
}
