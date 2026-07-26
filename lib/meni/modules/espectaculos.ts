import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniRecomendacion } from '../types';

export const nombre = 'Espectáculos';

export function recomendaciones(result: EvaluacionEditorial): MeniRecomendacion[] {
  const recs: MeniRecomendacion[] = [];
  if (result.evidence.eeat.tieneAtribucionesFalsas) {
    recs.push({ area: 'Espectáculos', severidad: 'alta', mensaje: 'Descarte rumores; verifique datos con fuente primaria.' });
  }
  if (!result.evidence.context.contextoHistorico) {
    recs.push({ area: 'Espectáculos', severidad: 'baja', mensaje: 'Contextualice relevancia del evento.' });
  }
  return recs;
}

export function angulo(): string {
  return 'Informar del entretenimiento sin rumores ni invasión innecesaria a la privacidad.';
}
