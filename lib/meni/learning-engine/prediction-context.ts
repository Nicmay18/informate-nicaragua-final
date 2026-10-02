/**
 * Contexto de Predicciones — MENI Learning 4.0 (FASE 6)
 * =====================================================
 * Hace consumibles las `meni_predictions` que el validador ya midió contra
 * realidad. Solo entran predicciones con `validation.summary` — es decir,
 * comparadas contra datos reales (publicado/destacada). Las no validadas
 * NUNCA alteran una decisión editorial.
 *
 * El resultado es contexto explicable ("en N predicciones validadas, MENI
 * acertó X% en portada"), no un ajuste de score.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import type { PrediccionContexto } from '@/lib/meni/editorial-brain/types';

const COLLECTION = 'meni_predictions';
const MAX_SCAN = 200;
const MAX_EJEMPLOS = 5;

let cache: { data: PrediccionContexto; loadedAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Agrega accuracy de predicciones ya validadas por prediction-validator.
 * Devuelve null si no hay predicciones validadas suficientes (<3): con tan
 * poca evidencia la tasa sería ruido, no conocimiento.
 */
export async function loadPredictionContext(db: Firestore): Promise<PrediccionContexto | null> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  try {
    // Solo documentos con validación medida (el validador escribe `validation`).
    // Se acota el scan: las validadas son un subconjunto creciente pero acotado.
    const snap = await db.collection(COLLECTION).orderBy('fecha', 'desc').limit(MAX_SCAN).get();
    let totalValidadas = 0;
    let aciertos = 0;
    const ejemplos: PrediccionContexto['ejemplos'] = [];

    for (const doc of snap.docs) {
      const p = doc.data();
      const summary = p.validation?.summary;
      if (!summary || typeof summary.validated !== 'number' || summary.validated === 0) continue;
      totalValidadas++;
      const correctosDoc = typeof summary.correct === 'number' ? summary.correct : 0;
      const mismatched = typeof summary.mismatched === 'number' ? summary.mismatched : 0;
      if (mismatched === 0 && correctosDoc > 0) aciertos++;

      if (ejemplos.length < MAX_EJEMPLOS) {
        for (const campo of ['publicar', 'portada'] as const) {
          const r = p.validation?.[campo];
          if (r?.status === 'VALIDATED') {
            ejemplos.push({
              articleId: String(p.articleId || ''),
              campo,
              predicho: r.predicted,
              real: r.real,
              correcto: r.correct === true,
            });
          }
        }
      }
    }

    if (totalValidadas < 3) {
      cache = { data: { totalValidadas, aciertos, tasa: 0, ejemplos }, loadedAt: Date.now() };
      return null; // evidencia insuficiente — honestamente no se expone
    }

    const data: PrediccionContexto = {
      totalValidadas,
      aciertos,
      tasa: Math.round((aciertos / totalValidadas) * 100) / 100,
      ejemplos: ejemplos.slice(0, MAX_EJEMPLOS),
    };
    cache = { data, loadedAt: Date.now() };
    return data;
  } catch (err) {
    logger.warn('[prediction-context] Error cargando contexto (no bloqueante):', err);
    return null;
  }
}

export function invalidatePredictionContextCache(): void {
  cache = null;
}
