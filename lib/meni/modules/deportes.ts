import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniRecomendacion } from '../types';

export const nombre = 'Deportes';

export function recomendaciones(result: EvaluacionEditorial): MeniRecomendacion[] {
  const recs: MeniRecomendacion[] = [];
  if (result.evidence.forense.adjetivosEmocionales.length > 2) {
    recs.push({ area: 'Deportes', severidad: 'media', mensaje: 'Evite exageraciones; destaque hechos y estadísticas.' });
  }
  if (!result.evidence.chronology.tieneCronologia) {
    recs.push({ area: 'Deportes', severidad: 'baja', mensaje: 'Incluya cronología del torneo o competencia.' });
  }
  return recs;
}

export function angulo(): string {
  return 'Contar la historia del deporte con datos, cronología y emoción contenida.';
}
