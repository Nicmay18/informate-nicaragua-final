/**
 * Editorial Difference Engine
 * ===========================
 * Calcula la diferencia entre lo que haría la competencia
 * y lo que hará Nicaragua Informate.
 *
 * Si la diferencia es menor del 30% → BLOCK.
 */

import type { EditorialBrainInput, EditorialDifferenceDecision, CompetitionDecision } from './types';
import { runCompetitionEngine } from './competition-engine';

function calcularPorcentajeDiferencia(enfoqueNI: string, enfoquesCompetencia: string[]): number {
  const palabrasNI = new Set(enfoqueNI.toLowerCase().split(/\W+/).filter(w => w.length > 4));
  const todasCompetencia = new Set<string>();
  for (const e of enfoquesCompetencia) {
    for (const w of e.toLowerCase().split(/\W+/).filter(w => w.length > 4)) {
      todasCompetencia.add(w);
    }
  }
  let diferenciales = 0;
  for (const w of palabrasNI) {
    if (!todasCompetencia.has(w)) diferenciales++;
  }
  const total = Math.max(palabrasNI.size, 1);
  return Math.round((diferenciales / total) * 100);
}

function detectarElementosDiferenciales(enfoqueNI: string, enfoquesCompetencia: string[]): string[] {
  const elementos: string[] = [];
  const ni = enfoqueNI.toLowerCase();
  const comp = enfoquesCompetencia.join(' ').toLowerCase();

  if (ni.includes('explicar') && !comp.includes('explicar')) elementos.push('Explicación del hecho, no solo reporte');
  if (ni.includes('prevención') && !comp.includes('prevención')) elementos.push('Guía de prevención');
  if (ni.includes('cómo afecta') && !comp.includes('cómo afecta')) elementos.push('Análisis de impacto en el lector');
  if (ni.includes('contexto') && !comp.includes('contexto')) elementos.push('Contexto que otros no incluyen');
  if (ni.includes('sin morbo') && !comp.includes('sin morbo')) elementos.push('Tratamiento sin morbo ni sensacionalismo');
  if (ni.includes('sin alineación') && !comp.includes('sin alineación')) elementos.push('Sin alineación política');
  if (ni.includes('bolsillo') && !comp.includes('bolsillo')) elementos.push('Impacto económico para el ciudadano');
  if (ni.includes('enfoque local') && !comp.includes('enfoque local')) elementos.push('Enfoque local para la zona afectada');

  if (elementos.length === 0) elementos.push('Enfoque explicativo general');
  return elementos;
}

export function runEditorialDifferenceEngine(
  input: EditorialBrainInput,
  competition?: CompetitionDecision,
): EditorialDifferenceDecision {
  const comp = competition ?? runCompetitionEngine(input);

  const enfoqueCompetencia = `${comp.enfoqueTN8} ${comp.enfoqueCanal4} ${comp.enfoqueLaPrensa}`;
  const enfoqueNI = comp.enfoqueNicaraguaInformate;

  const porcentajeDiferencia = calcularPorcentajeDiferencia(enfoqueNI, [comp.enfoqueTN8, comp.enfoqueCanal4, comp.enfoqueLaPrensa]);
  const elementosDiferenciales = detectarElementosDiferenciales(enfoqueNI, [comp.enfoqueTN8, comp.enfoqueCanal4, comp.enfoqueLaPrensa]);

  const bloquear = porcentajeDiferencia < 30;
  const motivoBloqueo = bloquear
    ? `Diferencia con la competencia es solo ${porcentajeDiferencia}%. Mínimo requerido: 30%. Riesgo de que la nota parezca igual a TN8, Canal 4 o La Prensa.`
    : null;

  let score = porcentajeDiferencia;
  if (elementosDiferenciales.length >= 3) score = Math.min(score + 10, 100);
  if (bloquear) score = Math.min(score, 29);

  return { enfoqueCompetencia, enfoqueNI, porcentajeDiferencia, elementosDiferenciales, bloquear, motivoBloqueo, score };
}
