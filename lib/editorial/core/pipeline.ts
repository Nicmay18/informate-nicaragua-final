import type { NoticiaInput, EvaluacionEditorial } from './types';
import { extract } from '../extractor';
import { loadProfile } from './profile-loader';
import { scoreCalidad } from './scorer';
import { evaluateRisk } from './risk-engine';
import { decide } from './decision-engine';
import { buildExplainability } from './explainability';
import { verifyIntegrity } from './integrity-engine';

export function evaluate(noticia: NoticiaInput): EvaluacionEditorial {
  // 1. Extracción única
  const evidence = extract(noticia);

  // 2. Cargar perfil declarativo
  const profile = loadProfile(evidence.category);

  // 3. Calidad editorial (ponderado)
  const calidad = scoreCalidad(evidence, profile);

  // 4. Riesgo editorial (Forense + Adsense)
  const riesgo = evaluateRisk(evidence);

  // 5. Decisión con gates
  const decision = decide(calidad, profile, riesgo.adsense.seguro);

  // 6. Explainability exacta por módulo
  const allModules = [calidad.seo, calidad.eeat, calidad.discover, calidad.adsense, calidad.valorEditorial, riesgo.forense];
  const explainability = buildExplainability(allModules);

  // 7. Sugerencias consolidadas
  const sugerencias = allModules.flatMap(m => m.recommendations.concat(m.warnings));

  const result: EvaluacionEditorial = {
    evidence,
    seo: calidad.seo,
    eeat: calidad.eeat,
    discover: calidad.discover,
    adsense: calidad.adsense,
    valorEditorial: calidad.valorEditorial,
    forense: riesgo.forense,
    calidad: decision.calidad,
    riesgo: {
      score: riesgo.forense.score,
      seguro: riesgo.adsense.seguro,
      advertencias: riesgo.forense.warnings.concat(riesgo.adsense.seguro ? [] : [riesgo.adsense.motivo ?? 'Adsense no seguro']),
    },
    scoreFinal: decision.scoreFinal,
    veredicto: decision.veredicto,
    explainability,
    sugerencias,
  };

  // 8. Verificación matemática de invariantes
  verifyIntegrity(result);

  return result;
}
