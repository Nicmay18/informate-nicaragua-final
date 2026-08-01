import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniEEAT } from './types';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function computeEeatScore(result: EvaluacionEditorial): number {
  const eeat = result.evidence.eeat;
  const sources = result.evidence.sources;
  const valor = result.evidence.valorEditorial;
  const risk = result.evidence.risk;

  let score = 40;

  // Señales positivas
  if (eeat.autorVisible) score += 15;
  if (eeat.autor && eeat.autor.length > 2 && eeat.autor !== 'Redacción Nicaragua Informate') score += 5;
  if (eeat.tieneAtribuciones) score += 15;
  if (eeat.tieneCitasEstructuradas) score += 15;

  const fuentes = sources?.numeroFuentes ?? 0;
  if (fuentes >= 1) score += 5;
  if (fuentes >= 2) score += 10;
  if (sources?.dosFuentesIndependientes) score += 5;
  if (sources?.documentoOficial) score += 5;

  // Señales negativas
  if (eeat.tieneAtribucionesFalsas) score -= 30;
  if (valor?.tieneFuentesAnonimas) score -= 15;
  if (valor?.tieneAtribucionVaga) score -= 10;
  if (fuentes === 0) score -= 15;
  if (risk?.atribucionesFalsas) score -= 10;

  return clamp(score);
}

export function analyzeEEAT(result: EvaluacionEditorial): MeniEEAT {
  const eeat = result.evidence.eeat;

  const advertencias: string[] = [];
  if (!eeat.autorVisible) advertencias.push('No se detecta autor identificado.');
  if (!eeat.tieneAtribuciones) advertencias.push('Faltan atribuciones claras.');
  if (eeat.tieneAtribucionesFalsas) advertencias.push('Posibles atribuciones no verificadas.');
  if (!eeat.tieneCitasEstructuradas) advertencias.push('No hay citas estructuradas.');

  return {
    score: Math.round(computeEeatScore(result)),
    autor: eeat.autor || 'Redacción Nicaragua Informate',
    citasEstructuradas: !!eeat.tieneCitasEstructuradas,
    fuentesDetectadas: eeat.fuentesDetectadas?.slice(0, 10) ?? [],
    advertencias,
  };
}
