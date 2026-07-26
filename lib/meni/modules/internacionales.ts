import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniRecomendacion } from '../types';

export const nombre = 'Internacionales';

export function recomendaciones(result: EvaluacionEditorial): MeniRecomendacion[] {
  const recs: MeniRecomendacion[] = [];
  if (!result.evidence.context.contextoHistorico) {
    recs.push({ area: 'Internacionales', severidad: 'media', mensaje: 'Explique el impacto o relevancia para Nicaragua.' });
  }
  if (result.evidence.evidence.densidadVerificable < 0.4) {
    recs.push({ area: 'Internacionales', severidad: 'media', mensaje: 'Cite fuentes internacionales reconocidas.' });
  }
  return recs;
}

export function angulo(): string {
  return 'Conectar el evento internacional con la realidad nicaragüense de forma clara.';
}
