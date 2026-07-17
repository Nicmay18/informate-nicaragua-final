/**
 * EditorJefeEngine V4 — REGLA 1, 5, 13
 * ====================================
 * Motor único. Consume ArticleEvidence + NormalizedResults + EditorialProfile.
 * CERO ifs por categoría. Solo lee el perfil.
 * El motor no sabe si es Sucesos, Deportes o Clima.
 */

import type {
  ArticleEvidence,
  NormalizedResults,
  EditorialProfile,
  ResultadoEditorial,
  ScoreBreakdown,
  VeredictoEditorial,
  ConsistencyCheck,
} from './types';
import { generateExplainability } from './explainability';
import { validateVerdicto } from './consistency-engine';

export function evaluate(
  evidence: ArticleEvidence,
  profile: EditorialProfile,
  results: NormalizedResults,
  consistency: ConsistencyCheck,
): ResultadoEditorial {
  const texto = evidence.textoPlano;

  // ── 1. Evidencia: recorre las regex del perfil ──
  // Base de 40 + crédito proporcional para evitar scores demasiado bajos
  let evidenciaFound = 0;
  let evidenciaTotal = 0;
  for (const [, regex] of Object.entries(profile.requiredEvidence)) {
    evidenciaTotal++;
    if (regex.test(texto)) evidenciaFound++;
  }
  const evidenciaRatio = evidenciaTotal > 0 ? evidenciaFound / evidenciaTotal : 0;
  const evidenciaScore = 25 + evidenciaRatio * 75; // 25-100

  // ── 2. Fuente: verifica allowedSources ──
  const fuenteScore = profile.allowedSources.some(s =>
    new RegExp(s, 'i').test(texto)
  ) ? 100 : evidence.sources.numeroFuentes > 0 ? 50 : 20;

  // ── 3. Contexto: verifica patrones del perfil ──
  const contextoScore = profile.requiredContext.patrones.some(r => r.test(texto)) ? 100 : 35;

  // ── 4. Utilidad: verifica preguntas del perfil ──
  const utilidadScore = profile.requiredUtility.preguntas.some(p =>
    new RegExp(p, 'i').test(texto)
  ) ? 100 : 35;

  // ── 5. Originalidad: aporte propio del medio ──
  const originalidadScore = evidence.originality.tieneAportePropio ? 100 : evidence.originality.tieneReporteoPropio ? 70 : 25;

  // ── 6. Score ponderado con pesos del perfil ──
  const w = profile.scoreWeights;
  const scoreFinal = Math.round(
    evidenciaScore * (w.evidencia / 100) +
    fuenteScore * (w.fuente / 100) +
    contextoScore * (w.contexto / 100) +
    utilidadScore * (w.utilidad / 100) +
    originalidadScore * (w.originalidad / 100)
  );

  // ── 7. Decisión: umbrales del perfil ──
  const t = profile.editorialThreshold;
  let veredicto: VeredictoEditorial;
  if (scoreFinal >= t.cobertura_especial) veredicto = 'cobertura_especial';
  else if (scoreFinal >= t.portada) veredicto = 'portada';
  else if (scoreFinal >= t.publicar_destacado) veredicto = 'publicar_destacado';
  else if (scoreFinal >= t.publicar_estandar) veredicto = 'publicar_estandar';
  else if (scoreFinal >= t.publicar_breve) veredicto = 'publicar_breve';
  else veredicto = 'no_publicar';

  // ── 8. Consistency Engine: validar veredicto (REGLA 13) ──
  const violacionPost = validateVerdicto(results, scoreFinal, veredicto);
  const consistenciaFinal: ConsistencyCheck = {
    ok: consistency.ok && !violacionPost,
    violaciones: [...consistency.violaciones, ...(violacionPost ? [violacionPost] : [])],
  };

  if (violacionPost) {
    veredicto = 'EDITOR_INCONSISTENT';
  }

  // ── 9. Explainability detallada (REGLA 10) ──
  const explainability = generateExplainability(evidence, results, profile);

  // Asignar puntos perdidos a cada item de explainability
  const totalPenalizaciones = 100 - scoreFinal;
  const puntosPorItem = explainability.length > 0 ? Math.round(totalPenalizaciones / explainability.length) : 0;
  for (const item of explainability) {
    item.puntosPerdidos = puntosPorItem;
  }

  // ── 10. Sugerencias del perfil, filtrando prohibidas ──
  const sugerencias = [
    ...profile.sugerenciasBase.oportunidades,
    ...profile.sugerenciasBase.convertirReferencia,
  ].filter(s => !profile.forbiddenRecommendations.some(fr => s.toLowerCase().includes(fr.toLowerCase())));

  // ── 11. Score breakdown completo ──
  const scores: ScoreBreakdown = {
    seo: results.seo.score,
    eeat: results.eeat.score,
    forense: results.forense.score,
    adsense: results.adsense.score,
    discover: results.discover.score,
    valorEditorial: results.valorEditorial.score,
    evidencia: Math.round(evidenciaScore),
    fuente: fuenteScore,
    contexto: contextoScore,
    utilidad: utilidadScore,
    originalidad: originalidadScore,
    final: scoreFinal,
  };

  return {
    categoria: profile.categoria,
    perfilUsado: profile.categoria,
    scores,
    veredicto,
    explainability,
    sugerencias,
    consistencia: consistenciaFinal,
    evidence,
    results,
  };
}
