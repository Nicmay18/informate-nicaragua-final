import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniRecomendacion } from '../types';

export const nombre = 'Tecnología';

export function recomendaciones(result: EvaluacionEditorial): MeniRecomendacion[] {
  const recs: MeniRecomendacion[] = [];
  if (result.evidence.utility.preguntasRespondidas.length < 2) {
    recs.push({ area: 'Tecnología', severidad: 'media', mensaje: 'Explique qué es, cómo funciona y por qué importa al lector.' });
  }
  if (!result.evidence.context.contextoInstitucional) {
    recs.push({ area: 'Tecnología', severidad: 'baja', mensaje: 'Mencione disponibilidad o fuente oficial si aplica.' });
  }
  return recs;
}

export function angulo(): string {
  return 'Explicar la tecnología en términos accesibles y con utilidad práctica.';
}
