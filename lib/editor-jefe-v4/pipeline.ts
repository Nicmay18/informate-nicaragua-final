/**
 * Pipeline V4 — REGLA 2
 * =====================
 * Orquestador secuencial. No se permiten rutas paralelas.
 *
 * Artículo → Extractor → ArticleEvidence →
 * SEO → EEAT → FORENSE → ADSENSE → DISCOVER → VALOR EDITORIAL →
 * Normalizador → Consistency Engine →
 * CategoryDetector → ProfileLoader → EditorJefeEngine →
 * Veredicto
 */

import type { NoticiaInput } from '../analizador-noticias';
import type { ResultadoEditorial } from './types';
import { extract } from './extractor';
import { normalize } from './normalizador';
import { check as consistencyCheck } from './consistency-engine';
import { loadProfile } from './profile-loader';
import { evaluate as engineEvaluate } from './engine';

export function pipelineV4(noticia: NoticiaInput): ResultadoEditorial {
  // 1. Extractor: única lectura del artículo
  const evidence = extract(noticia);

  // 2. Módulos de evaluación (leen ArticleEvidence, NO el artículo)
  // Se ejecutan secuencialmente dentro del normalizador
  const results = normalize(evidence);

  // 3. Consistency Engine: verifica coherencia antes del Editor Jefe
  const consistency = consistencyCheck(results);

  // 4. CategoryDetector + ProfileLoader
  const profile = loadProfile(evidence.category);

  // 5. EditorJefeEngine: consume evidence + results + profile
  const resultado = engineEvaluate(evidence, profile, results, consistency);

  return resultado;
}
