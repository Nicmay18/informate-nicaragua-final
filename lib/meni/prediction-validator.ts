/**
 * Validador de predicciones MENI — cierra el ciclo predicción → realidad.
 *
 * Ciclo: MENI predice (guardar-directo escribe meni_predictions con real* en
 * null) → pasa ventana de observación → este validador mide lo que realmente
 * ocurrió → compara → registra resultado.
 *
 * Regla de honestidad: un campo `real*` solo se escribe con datos medidos.
 * Si no existe fuente real, el campo queda null y el estado por campo es
 * INSUFFICIENT_DATA. Nunca se rellena artificialmente.
 *
 * Fuentes reales disponibles hoy:
 *   - realPublicar: noticias/{id}.publicado + estado (medible)
 *   - realPortada:  noticias/{id}.destacada (medible, clase binaria)
 *   - realFacebook: NO existe métrica de engagement FB → INSUFFICIENT_DATA
 *   - realDiscover: GSC no recolecta searchAppearance=DISCOVER → INSUFFICIENT_DATA
 */
import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

const COLLECTION = 'meni_predictions';
const NOTICIAS = 'noticias';

export type FieldValidation = 'VALIDATED' | 'MISMATCH' | 'INSUFFICIENT_DATA' | 'PENDING_VALIDATION';

export interface PredictionFieldResult {
  status: FieldValidation;
  predicted: unknown;
  real: unknown;
  correct: boolean | null;
  source: string | null;
}

export interface PredictionValidation {
  validatedAt: string;
  observationDays: number;
  publicar: PredictionFieldResult;
  portada: PredictionFieldResult;
  facebook: PredictionFieldResult;
  discover: PredictionFieldResult;
  summary: { validated: number; correct: number; mismatched: number; insufficient: number };
}

const PRED_PORTADA_POSITIVE = new Set(['Hero principal', 'Portada principal', 'Portada', 'Destacada']);

const insufficient = (predicted: unknown, reason: string): PredictionFieldResult => ({
  status: 'INSUFFICIENT_DATA',
  predicted,
  real: null,
  correct: null,
  source: `none: ${reason}`,
});

/**
 * Valida predicciones cuya ventana de observación ya cerró.
 * @param minAgeDays días mínimos desde la predicción antes de medir.
 * @param limit máximo de documentos por corrida (bounded: escala con el tiempo).
 */
export async function validateMeniPredictions(
  db: Firestore,
  { minAgeDays = 7, limit = 100 }: { minAgeDays?: number; limit?: number } = {},
): Promise<{ scanned: number; validated: number; stillPending: number; errors: number }> {
  const cutoff = new Date(Date.now() - minAgeDays * 86400000).toISOString();

  // Solo predicciones antiguas sin validación previa.
  const snap = await db
    .collection(COLLECTION)
    .where('fecha', '<=', cutoff)
    .limit(limit)
    .get();

  let validated = 0;
  let stillPending = 0;
  let errors = 0;

  for (const doc of snap.docs) {
    const p = doc.data();
    if (p.validation?.summary) continue; // ya validada
    try {
      const art = await db.collection(NOTICIAS).doc(p.articleId).get();
      if (!art.exists) {
        // El artículo ya no existe: no podemos medir nada. Marcar honestamente.
        await doc.ref.update({
          validation: {
            validatedAt: new Date().toISOString(),
            observationDays: minAgeDays,
            summary: { validated: 0, correct: 0, mismatched: 0, insufficient: 4 },
            note: 'article_deleted: el artículo ya no existe en noticias',
          },
        });
        validated++;
        continue;
      }

      const a = art.data()!;
      const publicado = a.publicado === true && a.estado === 'publicado' && a.archived !== true;
      const destacada = a.destacada === true;

      // ── predPublicar ('SI'|'NO'|boolean) vs estado real ──
      const predictedPublicar = p.predPublicar === true || p.predPublicar === 'SI';
      const publicarResult: PredictionFieldResult = {
        status: 'VALIDATED',
        predicted: p.predPublicar,
        real: publicado ? 'SI' : 'NO',
        correct: predictedPublicar === publicado,
        source: 'noticias.publicado+estado',
      };

      // ── predPortada (clase) vs destacada real ──
      const predEnPortada = PRED_PORTADA_POSITIVE.has(String(p.predPortada));
      const realPortada = destacada ? 'Destacada' : 'No va a portada';
      const portadaResult: PredictionFieldResult = {
        status: 'VALIDATED',
        predicted: p.predPortada,
        real: realPortada,
        correct: predEnPortada === destacada,
        source: 'noticias.destacada',
      };

      const validation: PredictionValidation = {
        validatedAt: new Date().toISOString(),
        observationDays: minAgeDays,
        publicar: publicarResult,
        portada: portadaResult,
        facebook: insufficient(p.predFacebook, 'sin métricas de engagement de Facebook'),
        discover: insufficient(p.predDiscover, 'GSC no recolecta searchAppearance=DISCOVER'),
        summary: { validated: 0, correct: 0, mismatched: 0, insufficient: 0 },
      };

      for (const r of [publicarResult, portadaResult, validation.facebook, validation.discover]) {
        if (r.status === 'INSUFFICIENT_DATA') validation.summary.insufficient++;
        else if (r.status === 'VALIDATED') {
          validation.summary.validated++;
          if (r.correct === true) validation.summary.correct++;
          else validation.summary.mismatched++;
        }
      }

      await doc.ref.update({
        validation,
        // Campos real* compatibles con el dashboard existente:
        realPublicar: publicado ? 'SI' : 'NO',
        realPortada,
        // realFacebook / realDiscover se quedan null intencionalmente.
      });
      validated++;
    } catch (err) {
      errors++;
      logger.warn('[prediction-validator] Error validando predicción', { id: doc.id, error: String(err) });
    }
  }

  stillPending = snap.size - validated;

  logger.info('[prediction-validator] Corrida completada', { scanned: snap.size, validated, stillPending, errors });
  return { scanned: snap.size, validated, stillPending, errors };
}
