/**
 * NIOS Intelligence Platform — FASE 2.3: Google Feedback Loop
 * ==========================================================
 * Compara MENI vs Google y genera patrones de aprendizaje.
 * Guarda resultados en Firestore bajo la colección `google_learning_patterns`.
 *
 * Ejemplos:
 * - MENI 95 + Google 500 impresiones + CTR 3% → MENI correcto
 * - MENI 95 + Google 0 impresiones → Google no encuentra valor
 * - MENI 60 + Google 20,000 impresiones → MENI debe aprender
 */

import type { Firestore } from 'firebase-admin/firestore';
import type {
  ArticleFusion,
  GSCSnapshot,
  GoogleLearningPattern,
} from './types';
import { logger } from '@/lib/logger';

const COLLECTION = 'google_learning_patterns';

/**
 * Determina el patrón de aprendizaje para un artículo.
 */
function classifyLearningPattern(article: ArticleFusion): {
  pattern: GoogleLearningPattern['pattern'];
  confidence: GoogleLearningPattern['confidence'];
  conclusion: string;
} {
  const scoreMeni = article.scoreMeni;
  const impressions = article.gscImpressions;
  const clicks = article.gscClicks;

  // MENI correcto: score alto + Google muestra tráfico
  if (scoreMeni >= 85 && impressions >= 500 && (clicks > 0 || article.gscCtr > 1)) {
    return {
      pattern: 'meni_correct',
      confidence: impressions >= 1000 ? 'high' : 'medium',
      conclusion: `MENI otorga ${scoreMeni} puntos y Google Search Console registra ${impressions} impresiones con CTR ${article.gscCtr}%. MENI está correctamente calibrado para este contenido.`,
    };
  }

  // MENI sobreestima: score alto + Google ignora
  if (scoreMeni >= 90 && impressions === 0) {
    return {
      pattern: 'meni_overestimates',
      confidence: 'high',
      conclusion: `MENI otorga ${scoreMeni} puntos, pero Google Search Console registra 0 impresiones. Google no encuentra valor suficiente en esta nota. MENI está sobreestimando.`,
    };
  }

  if (scoreMeni >= 85 && impressions < 10) {
    return {
      pattern: 'meni_overestimates',
      confidence: 'medium',
      conclusion: `MENI otorga ${scoreMeni} puntos, pero Google Search Console solo registra ${impressions} impresiones. MENI probablemente sobreestima.`,
    };
  }

  // MENI subestima: score bajo/medio + Google valora
  if (scoreMeni < 80 && impressions >= 1000) {
    return {
      pattern: 'meni_underestimates',
      confidence: impressions >= 5000 ? 'high' : 'medium',
      conclusion: `MENI otorga ${scoreMeni} puntos, pero Google Search Console registra ${impressions} impresiones y ${clicks} clics. El modelo MENI debe aprender de este caso.`,
    };
  }

  // Datos insuficientes
  return {
    pattern: 'insufficient_data',
    confidence: impressions === 0 ? 'low' : 'medium',
    conclusion: `MENI: ${scoreMeni}, Google: ${impressions} impresiones. No hay suficiente evidencia para determinar la calibración.`,
  };
}

/**
 * Genera patrones de aprendizaje para todos los artículos.
 */
export function generateLearningPatterns(
  articles: ArticleFusion[],
  gsc: GSCSnapshot | null,
): GoogleLearningPattern[] {
  const now = new Date().toISOString();
  const dateRange = gsc?.dateRange
    ? `${gsc.dateRange.start} a ${gsc.dateRange.end}`
    : 'Sin datos';

  if (!gsc) return [];

  return articles.map(article => {
    const classification = classifyLearningPattern(article);

    return {
      id: `${article.slug}-${gsc.date}`,
      slug: article.slug,
      titulo: article.titulo,
      categoria: article.categoria,
      scoreMeni: article.scoreMeni,
      gscImpressions: article.gscImpressions,
      gscClicks: article.gscClicks,
      gscCtr: article.gscCtr,
      gscPosition: article.gscPosition,
      pattern: classification.pattern,
      confidence: classification.confidence,
      conclusion: classification.conclusion,
      generatedAt: now,
      dateRange,
    };
  });
}

/**
 * Persiste patrones de aprendizaje en Firestore.
 */
export async function saveLearningPatterns(
  db: Firestore,
  patterns: GoogleLearningPattern[],
): Promise<void> {
  if (patterns.length === 0) return;

  const batch = db.batch();

  for (const pattern of patterns) {
    const ref = db.collection(COLLECTION).doc(pattern.id);
    batch.set(ref, pattern, { merge: true });
  }

  await batch.commit();
  logger.info(`[google-feedback] Saved ${patterns.length} learning patterns to Firestore`);
}

/**
 * Obtiene patrones históricos de aprendizaje.
 */
export async function getLearningPatterns(
  db: Firestore,
  pattern?: GoogleLearningPattern['pattern'],
  limit = 100,
): Promise<GoogleLearningPattern[]> {
  let query = db.collection(COLLECTION).orderBy('generatedAt', 'desc').limit(limit);
  if (pattern) {
    query = query.where('pattern', '==', pattern);
  }

  const snap = await query.get();
  return snap.docs.map(d => d.data() as unknown as GoogleLearningPattern);
}

/**
 * Genera resumen agregado de patrones de aprendizaje.
 */
export function summarizeLearningPatterns(patterns: GoogleLearningPattern[]): {
  total: number;
  meniCorrect: number;
  meniOverestimates: number;
  meniUnderestimates: number;
  insufficient: number;
} {
  return {
    total: patterns.length,
    meniCorrect: patterns.filter(p => p.pattern === 'meni_correct').length,
    meniOverestimates: patterns.filter(p => p.pattern === 'meni_overestimates').length,
    meniUnderestimates: patterns.filter(p => p.pattern === 'meni_underestimates').length,
    insufficient: patterns.filter(p => p.pattern === 'insufficient_data').length,
  };
}
