import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniRecomendacion } from '../types';

export const nombre = 'Sucesos';

export function recomendaciones(result: EvaluacionEditorial): MeniRecomendacion[] {
  const recs: MeniRecomendacion[] = [];
  if (result.evidence.forense.adjetivosEmocionales.length > 0) {
    recs.push({ area: 'Sucesos', severidad: 'alta', mensaje: 'Evite explotar el dolor o detalles sensibles de víctimas.' });
  }
  if (!result.evidence.evidence.esNotaVerificable) {
    recs.push({ area: 'Sucesos', severidad: 'alta', mensaje: 'Incluya fuente oficial o autoridad que confirme el hecho.' });
  }
  return recs;
}

export function angulo(): string {
  return 'Informar con precisión y respeto, priorizando la seguridad de menores y víctimas.';
}
