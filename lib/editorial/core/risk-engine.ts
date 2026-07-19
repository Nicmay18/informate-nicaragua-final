import type { ArticleEvidence, ModuleScore, AdsenseResult } from './types';
import { ScoreTracer } from './score-tracer';

export interface RiskResult {
  forense: ModuleScore;
  adsense: AdsenseResult;
}

export function evaluateRisk(evidence: ArticleEvidence): RiskResult {
  const signals: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  const tracer = new ScoreTracer('FORENSE');
  tracer.start(100, 'Score base del módulo FORENSE (riesgo editorial)');

  const adjetivos = evidence.forense.adjetivosEmocionales.length;
  if (adjetivos > 3) {
    warnings.push(`${adjetivos} adjetivos emocionales detectados`);
    tracer.sub(Math.min(15, adjetivos * 2), warnings[warnings.length - 1], 'ADJETIVOS_EMOCIONALES');
    recommendations.push('Reemplazar adjetivos emocionales por datos concretos');
  } else {
    signals.push('Lenguaje neutral sin exceso de adjetivos');
  }

  const transiciones = evidence.forense.transicionesIA.length;
  if (transiciones > 2) {
    warnings.push(`${transiciones} transiciones típicas de IA detectadas`);
    tracer.sub(Math.min(12, transiciones * 2), warnings[warnings.length - 1], 'TRANSICIONES_IA');
    recommendations.push('Reescribir frases con conectores típicos de IA');
  } else {
    signals.push('Sin transiciones típicas de IA');
  }

  if (evidence.forense.tieneRedundancia) {
    warnings.push('Redundancia detectada entre párrafos');
    tracer.sub(5, warnings[warnings.length - 1], 'REDUNDANCIA');
    recommendations.push('Eliminar repeticiones de información');
  }

  for (const riesgo of evidence.forense.riesgosLegales) {
    warnings.push(`Riesgo legal detectado: ${riesgo}`);
    tracer.sub(5, warnings[warnings.length - 1], `RIESGO_LEGAL:${riesgo}`);
    recommendations.push(`Revisar la mención a "${riesgo}" con contexto justificado`);
  }

  for (const tipo of evidence.forense.tiposContaminacion) {
    warnings.push(`Posible contaminación informativa: ${tipo}`);
    tracer.sub(8, warnings[warnings.length - 1], `CONTAMINACION:${tipo}`);
    recommendations.push(`Verificar la fuente de la información sobre ${tipo}`);
  }

  if (evidence.forense.nivelRiesgo === 'Crítico') {
    errors.push('Nivel de riesgo editorial crítico');
    tracer.sub(20, errors[errors.length - 1], 'NIVEL_RIESGO_CRITICO');
    recommendations.push('Revisar la noticia con el departamento legal antes de publicar');
  } else if (evidence.forense.nivelRiesgo === 'Alto') {
    warnings.push('Nivel de riesgo editorial alto');
    tracer.sub(10, warnings[warnings.length - 1], 'NIVEL_RIESGO_ALTO');
    recommendations.push('Verificar que el contexto justifique el riesgo editorial');
  } else {
    signals.push(`Nivel de riesgo ${evidence.forense.nivelRiesgo}`);
  }

  const score = Math.max(0, Math.min(100, tracer.getScore()));

  const seguro =
    evidence.adsense.palabrasSensibles.length === 0 &&
    score >= 70 &&
    evidence.forense.nivelRiesgo !== 'Crítico';

  const adsenseResult: AdsenseResult = {
    seguro,
    palabrasSensibles: evidence.adsense.palabrasSensibles,
    motivo: seguro
      ? undefined
      : evidence.adsense.palabrasSensibles.length > 0
        ? 'Contiene palabras sensibles para AdSense'
        : 'Riesgo editorial alto bloquea monetización',
  };

  const forense: ModuleScore = {
    modulo: 'FORENSE',
    score,
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors,
    evidence: {
      nivelRiesgo: evidence.forense.nivelRiesgo,
      adjetivos,
      transicionesIA: transiciones,
      riesgosLegales: evidence.forense.riesgosLegales.length,
      tiposContaminacion: evidence.forense.tiposContaminacion.length,
    },
    recommendations,
  };

  return { forense, adsense: adsenseResult };
}
