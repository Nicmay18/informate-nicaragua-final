/**
 * Normalización y comparación editorial — capa "ya satisfecho".
 * =============================================================
 * Regla sistémica: antes de emitir una recomendación, MENI comprueba si lo
 * que recomienda YA está presente en el artículo. Compara semántica
 * superficial (forma normalizada), no literalidad:
 *   - mayúsculas/minúsculas
 *   - acentos y tildes
 *   - signos de puntuación y comillas
 *   - espacios redundantes
 *   - separadores decimales/de miles locales (64,4 % ≡ 64.4%)
 */

export function normalizeForComparison(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos
    .replace(/(\d),(\d)/g, '$1.$2') // decimal local: 64,4 -> 64.4
    .replace(/["'«»“”‘’]/g, '') // comillas
    .replace(/[^\p{L}\p{N}]+/gu, ' ') // puntuación -> espacio
    .replace(/\s+/g, ' ')
    .trim();
}

/** Solapamiento de tokens (Jaccard) sobre texto normalizado. */
function tokenOverlap(a: string, b: string): number {
  const sa = new Set(normalizeForComparison(a).split(' ').filter(Boolean));
  const sb = new Set(normalizeForComparison(b).split(' ').filter(Boolean));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / Math.max(sa.size, sb.size);
}

/**
 * ¿La propuesta es sustancialmente igual al título actual?
 * Cubre equivalencia exacta tras normalizar y coincidencias casi idénticas
 * (≥90% de tokens compartidos — p.ej. reordenamientos triviales).
 */
export function isSubstantiallySameTitle(proposal: string, current: string): boolean {
  if (!proposal || !current) return false;
  const pa = normalizeForComparison(proposal);
  const ca = normalizeForComparison(current);
  if (pa === ca) return true;
  // La propuesta cita el título completo dentro de una frase más larga.
  if (ca.length >= 20 && pa.includes(ca)) return true;
  if (pa.length >= 20 && ca.includes(pa)) return true;
  return tokenOverlap(proposal, current) >= 0.9;
}

/**
 * ¿La recomendación ya está satisfecha por el contenido del artículo?
 * Detecta recomendaciones que repiten el título vigente o que citan
 * textualmente contenido ya presente (≥25 chars normalizados).
 */
export function isAlreadySatisfied(recommendation: string, ctx: { titulo: string; textoPlano: string }): boolean {
  if (!recommendation) return false;
  if (isSubstantiallySameTitle(recommendation, ctx.titulo)) return true;
  const rn = normalizeForComparison(recommendation);
  const cn = normalizeForComparison(ctx.textoPlano || '');
  if (!cn) return false;
  // ¿El cuerpo sustantivo de la recomendación ya está en el texto?
  // Extraer el fragmento citado más largo (comillas o tras ":/:").
  const quoted = recommendation.match(/["'«»“”‘’]([^"'«»“”‘’]{15,})["'«»“”‘’]/);
  const candidate = quoted ? quoted[1] : rn;
  const normCandidate = normalizeForComparison(candidate);
  if (normCandidate.length >= 25 && cn.includes(normCandidate)) return true;
  return false;
}

/** Elimina recomendaciones duplicadas tras normalización, preservando el orden. */
export function dedupeRecommendations(recs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of recs) {
    const key = normalizeForComparison(r);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
