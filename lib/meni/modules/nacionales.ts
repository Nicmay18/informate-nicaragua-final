import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniRecomendacion } from '../types';

export const nombre = 'Nacionales';

export function recomendaciones(result: EvaluacionEditorial): MeniRecomendacion[] {
  const recs: MeniRecomendacion[] = [];
  if (result.evidence.utility.preguntasRespondidas.length < 2) {
    recs.push({ area: 'Nacionales', severidad: 'media', mensaje: 'Explique el impacto directo para el ciudadano nicaragüense.' });
  }
  if (!result.evidence.context.contextoInstitucional) {
    recs.push({ area: 'Nacionales', severidad: 'baja', mensaje: 'Incluya posición o contexto de la institución involucrada.' });
  }
  return recs;
}

export function angulo(): string {
  return 'Servir al ciudadano: qué cambia, a quién afecta y qué puede hacer el lector.';
}
