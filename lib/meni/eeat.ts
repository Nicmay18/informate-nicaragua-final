import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniEEAT } from './types';

export function analyzeEEAT(result: EvaluacionEditorial): MeniEEAT {
  const eeat = result.evidence.eeat;
  const score = result.eeat.score ?? 0;

  const advertencias: string[] = [];
  if (!eeat.autorVisible) advertencias.push('No se detecta autor identificado.');
  if (!eeat.tieneAtribuciones) advertencias.push('Faltan atribuciones claras.');
  if (eeat.tieneAtribucionesFalsas) advertencias.push('Posibles atribuciones no verificadas.');
  if (!eeat.tieneCitasEstructuradas) advertencias.push('No hay citas estructuradas.');

  return {
    score: Math.round(score),
    autor: eeat.autor || 'Redacción Nicaragua Informate',
    citasEstructuradas: !!eeat.tieneCitasEstructuradas,
    fuentesDetectadas: eeat.fuentesDetectadas?.slice(0, 10) ?? [],
    advertencias,
  };
}
