import type { EvaluacionEditorial } from '@/lib/editorial';
import type { MeniRiesgoEditorial } from './types';

export function analyzeRisk(result: EvaluacionEditorial): MeniRiesgoEditorial {
  const risk = result.evidence.risk;
  const forense = result.evidence.forense;

  const advertencias: string[] = [
    ...(forense.adjetivosEmocionales?.slice(0, 3) ?? []),
    ...(forense.riesgosLegales?.slice(0, 3) ?? []),
    ...(result.evidence.adsense.palabrasSensibles?.slice(0, 3) ?? []),
  ];

  let nivel: MeniRiesgoEditorial['nivel'] = 'VERDE';
  if (risk.nivel === 'Crítico' || forense.nivelRiesgo === 'Crítico') nivel = 'ROJO';
  else if (risk.nivel === 'Alto' || forense.nivelRiesgo === 'Alto' || risk.nivel === 'Medio') nivel = 'AMARILLO';

  const motivo = nivel === 'ROJO'
    ? 'Alto riesgo editorial: contenido sensible, legal o emocional excesivo.'
    : nivel === 'AMARILLO'
    ? 'Riesgo moderado: revisar atribuciones y lenguaje.'
    : 'Riesgo bajo: contenido verificable y seguro.';

  return { nivel, motivo, advertencias: [...new Set(advertencias)].filter(Boolean) };
}
