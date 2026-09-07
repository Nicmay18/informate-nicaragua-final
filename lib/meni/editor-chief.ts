import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniValorEditorial, NoticiaInput } from './types';
import type { MeniContentProfile } from './profile-detector';
import { detectAportePropioGastronomia } from './forensic';

export function buildValorEditorial(
  result: EvaluacionEditorial,
  input?: NoticiaInput,
  perfil?: MeniContentProfile,
): MeniValorEditorial {
  const baseAporte = !!result.evidence.originality.tieneAportePropio;
  const baseItems = result.evidence.originality.aportePropioItems.slice(0, 6);

  let aportePropio = baseAporte;
  let items = baseItems;

  if (perfil === 'gastronomia' && input) {
    const gastronomia = detectAportePropioGastronomia(input);
    if (gastronomia.tiene) {
      aportePropio = true;
      items = [...new Set([...baseItems, ...gastronomia.items])].slice(0, 6);
    }
  }

  return {
    aportePropio,
    items,
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
