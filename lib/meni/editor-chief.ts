import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniValorEditorial } from './types';

export function buildValorEditorial(result: EvaluacionEditorial): MeniValorEditorial {
  return {
    aportePropio: !!result.evidence.originality.tieneAportePropio,
    items: result.evidence.originality.aportePropioItems.slice(0, 6),
    utilidad: result.evidence.utility.preguntasRespondidas.slice(0, 6),
    preguntasAbiertas: result.evidence.utility.oportunidades.slice(0, 6),
  };
}

export function buildDiagnostico(result: EvaluacionEditorial): string {
  const v = result.veredicto.replace(/_/g, ' ').toUpperCase();
  const c = result.evidence.category || 'General';
  const riesgo = result.evidence.forense.nivelRiesgo;
  return `MENI detectó categoría ${c} con veredicto ${v}. Riesgo forense ${riesgo}. Score final ${result.scoreFinal}/100.`;
}
