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
  // ── 1-5. Reutilizar scores ya normalizados de los módulos ──
  // El Editor Jefe no recalcula criterios; los pesos del perfil se aplican
  // sobre las evaluaciones objetivas de Forense, EEAT, Discover, SEO y Valor Editorial.
  const evidenciaScore = results.forense.score;
  const fuenteScore = results.eeat.score;
  const contextoScore = results.discover.score;
  const utilidadScore = results.seo.score;
  const originalidadScore = results.valorEditorial.score;

  // ── 6. Score ponderado con pesos del perfil ──
  const w = profile.scoreWeights;
  let scoreFinal = Math.round(
    evidenciaScore * (w.evidencia / 100) +
    fuenteScore * (w.fuente / 100) +
    contextoScore * (w.contexto / 100) +
    utilidadScore * (w.utilidad / 100) +
    originalidadScore * (w.originalidad / 100)
  );

  // ── 6.1 Calibración V4.1: Respetar evidencia de módulos ──
  // Si los módulos objetivos coinciden en que la nota es sólida,
  // el Editor Jefe no puede degradarla sin justificación objetiva.
  const modulosObjetivos = [
    results.seo.score,
    results.eeat.score,
    results.forense.score,
    results.valorEditorial.score,
  ];
  const modulosPerfectos = modulosObjetivos.filter(s => s >= 100).length;
  const modulosAltos = modulosObjetivos.filter(s => s >= 85).length;

  if (modulosPerfectos >= 4) {
    // Todos los módulos objetivos dan 100: piso de 80
    scoreFinal = Math.max(scoreFinal, 80);
  } else if (modulosAltos >= 4) {
    // Todos los módulos objetivos dan 85+: piso de 70
    scoreFinal = Math.max(scoreFinal, 70);
  }

  // ── 6.2 Bonificación por utilidad pública / prevención / servicio ──
  if (evidence.utility.tieneServicio || evidence.utility.tieneRecomendaciones) {
    const bonificacion = evidence.utility.tieneServicio ? 6 : 3;
    scoreFinal = Math.min(100, scoreFinal + bonificacion);
  }

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
