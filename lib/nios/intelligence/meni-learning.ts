/**
 * NIOS Intelligence Platform — FASE 3.6: Aprendizaje MENI
 * =========================================================
 * Compara el MENI al momento de publicación contra el resultado real
 * a 30 días, usando datos de GSC y GA4.
 *
 * Detecta:
 * - Reglas MENI acertadas (score alto → Google valora)
 * - Reglas MENI equivocadas (score alto → Google ignora, o viceversa)
 *
 * Guarda en Firestore: meni_learning_feedback
 *
 * NO modifica pesos automáticamente.
 * Solo genera aprendizaje.
 *
 * Si no hay 30 días de datos: "Datos insuficientes para aprendizaje histórico"
 */

import type { Firestore } from 'firebase-admin/firestore';
import type {
  ArticleFusion,
  MeniLearningEntry,
  MeniLearningFeedback,
  NIOSEvidence,
} from './types';
import { getHistoricalDataDays } from './store';
import { logger } from '@/lib/logger';

const COLLECTION = 'meni_learning_feedback';

function makeEvidence(
  source: NIOSEvidence['source'],
  api: string,
  metric: string,
  value: string | number,
  comparison?: string,
): NIOSEvidence {
  return {
    source,
    api,
    dateRange: 'Últimos 30 días',
    metric,
    value,
    comparison,
    collectedAt: new Date().toISOString(),
  };
}

function daysSince(dateStr: string): number {
  return Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Clasifica el veredicto de MENI para un artículo.
 */
function classifyMeniVerdict(article: ArticleFusion, days: number): {
  verdict: MeniLearningEntry['verdict'];
  conclusion: string;
} {
  const { scoreMeni, gscImpressions, gscClicks, gscCtr, gscPosition } = article;
  const sm = scoreMeni ?? null;

  // Necesita al menos 30 días para evaluar
  if (days < 30) {
    return {
      verdict: 'datos_insuficientes',
      conclusion: `Solo ${days} días desde publicación. Se necesitan 30 días para evaluar el resultado real.`,
    };
  }

  // MENI acertada: score alto + Google muestra tráfico
  if (sm !== null && sm >= 80 && gscImpressions >= 500 && (gscClicks > 0 || gscCtr > 1)) {
    return {
      verdict: 'meni_acertada',
      conclusion: `MENI ${sm} → Google ${gscImpressions} impresiones, ${gscClicks} clics, posición ${gscPosition.toFixed(1)}. MENI evaluó correctamente el valor del contenido.`,
    };
  }

  // MENI posible sobreestimación: score alto + GSC sin datos
  if (sm !== null && sm >= 85 && gscImpressions < 10) {
    return {
      verdict: 'meni_sobreestima_hipotesis',
      conclusion: `MENI ${sm} pero GSC solo ${gscImpressions} impresiones en ${days} días. HIPÓTESIS: MENI podría sobreestimar, o el contenido podría no estar indexado, no tener demanda, o ser muy reciente. Se requiere verificación manual.`,
    };
  }

  // MENI subestima: score bajo/medio + Google valora
  if (sm !== null && sm < 75 && gscImpressions >= 1000) {
    return {
      verdict: 'meni_subestima',
      conclusion: `MENI ${sm} pero Google ${gscImpressions} impresiones y ${gscClicks} clics. MENI subestima este contenido. El modelo debe aprender de este caso.`,
    };
  }

  // Datos insuficientes
  if (gscImpressions === 0) {
    return {
      verdict: 'datos_insuficientes',
      conclusion: `MENI ${sm ?? 'N/D'}, 0 impresiones en ${days} días. No hay suficiente evidencia de Google para evaluar.`,
    };
  }

  return {
    verdict: 'datos_insuficientes',
    conclusion: `MENI ${sm ?? 'N/D'}, Google ${gscImpressions} impresiones. No hay suficiente evidencia para determinar la calibración.`,
  };
}

/**
 * Agrupa veredictos por regla MENI (dimensiones).
 */
function aggregateRules(entries: MeniLearningEntry[]): {
  rulesCorrect: { rule: string; count: number; examples: string[] }[];
  rulesIncorrect: { rule: string; count: number; examples: string[] }[];
} {
  const correctByRule = new Map<string, { count: number; examples: string[] }>();
  const incorrectByRule = new Map<string, { count: number; examples: string[] }>();

  for (const entry of entries) {
    if (entry.verdict === 'meni_acertada') {
      // Reglas que MENI evaluó correctamente
      const rules = ['contenido_util', 'profundidad', 'originalidad', 'eeat', 'seo'];
      for (const rule of rules) {
        const curr = correctByRule.get(rule) || { count: 0, examples: [] };
        curr.count += 1;
        if (curr.examples.length < 3) curr.examples.push(entry.titulo);
        correctByRule.set(rule, curr);
      }
    }

    if (entry.verdict === 'meni_sobreestima') {
      const rules = ['contenido_util', 'profundidad', 'originalidad', 'eeat', 'seo'];
      for (const rule of rules) {
        const curr = incorrectByRule.get(rule) || { count: 0, examples: [] };
        curr.count += 1;
        if (curr.examples.length < 3) curr.examples.push(entry.titulo);
        incorrectByRule.set(rule, curr);
      }
    }
  }

  const rulesCorrect = Array.from(correctByRule.entries())
    .map(([rule, data]) => ({ rule, count: data.count, examples: data.examples }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const rulesIncorrect = Array.from(incorrectByRule.entries())
    .map(([rule, data]) => ({ rule, count: data.count, examples: data.examples }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  return { rulesCorrect, rulesIncorrect };
}

/**
 * Genera el feedback de aprendizaje MENI.
 * Requiere 30 días de datos históricos.
 */
export async function generateMeniLearningFeedback(
  db: Firestore,
  articles: ArticleFusion[],
): Promise<MeniLearningFeedback> {
  const now = new Date().toISOString();

  if (articles.length === 0) {
    return {
      generatedAt: now,
      hasHistoricalData: false,
      totalEntries: 0,
      entries: [],
      rulesCorrect: [],
      rulesIncorrect: [],
      summary: 'Datos insuficientes para aprendizaje histórico.',
    };
  }

  // Verificar que hay al menos 30 días de snapshots
  const historicalDays = await getHistoricalDataDays(db);
  if (historicalDays < 30) {
    return {
      generatedAt: now,
      hasHistoricalData: false,
      totalEntries: 0,
      entries: [],
      rulesCorrect: [],
      rulesIncorrect: [],
      summary: `Datos insuficientes para aprendizaje histórico. Solo ${historicalDays} días de snapshots. Se necesitan 30 días mínimo.`,
    };
  }

  const entries: MeniLearningEntry[] = [];

  for (const article of articles) {
    const days = daysSince(article.fechaPublicacion);

    // Solo evaluar artículos con al menos 30 días
    if (days < 30) continue;

    const { verdict, conclusion } = classifyMeniVerdict(article, days);

    const evidence: NIOSEvidence[] = [
      makeEvidence('MENI', 'scoreMeni', `Score MENI al publicar`, article.scoreMeni ?? 'N/D'),
      makeEvidence('Google Search Console', 'searchanalytics.query', `Impresiones 30d`, article.gscImpressions),
      makeEvidence('Google Search Console', 'searchanalytics.query', `Clics 30d`, article.gscClicks),
      makeEvidence('Google Search Console', 'searchanalytics.query', `CTR 30d`, `${article.gscCtr}%`),
      makeEvidence('Google Search Console', 'searchanalytics.query', `Posición 30d`, article.gscPosition.toFixed(1)),
    ];

    if (article.hasGa4Data) {
      evidence.push(
        makeEvidence('Google Analytics 4', 'data_api', `Usuarios 30d`, article.ga4Users),
        makeEvidence('Google Analytics 4', 'data_api', `Engagement 30d`, `${article.ga4AvgEngagementTimeSec}s`),
      );
    }

    entries.push({
      slug: article.slug,
      titulo: article.titulo,
      categoria: article.categoria,
      meniScoreAtPublish: article.scoreMeni,
      meniScoreCurrent: article.scoreMeni,
      gscImpressions30d: article.gscImpressions,
      gscClicks30d: article.gscClicks,
      gscCtr30d: article.gscCtr,
      gscPosition30d: article.gscPosition,
      ga4Users30d: article.ga4Users,
      ga4AvgEngagementTimeSec30d: article.ga4AvgEngagementTimeSec,
      daysSincePublish: days,
      verdict,
      conclusion,
      evidence,
    });
  }

  const { rulesCorrect, rulesIncorrect } = aggregateRules(entries);

  const acertadas = entries.filter(e => e.verdict === 'meni_acertada').length;
  const sobreestima = entries.filter(e => e.verdict === 'meni_sobreestima').length;
  const subestima = entries.filter(e => e.verdict === 'meni_subestima').length;
  const insuficientes = entries.filter(e => e.verdict === 'datos_insuficientes').length;

  const summary =
    entries.length > 0
      ? `Aprendizaje MENI: ${entries.length} artículos evaluados a 30+ días. ${acertadas} acertadas, ${sobreestima} sobreestima, ${subestima} subestima, ${insuficientes} datos insuficientes. ${rulesCorrect.length} reglas acertadas, ${rulesIncorrect.length} reglas a revisar.`
      : 'No hay artículos con 30+ días para evaluar el aprendizaje MENI.';

  // Guardar en Firestore
  try {
    const docRef = db.collection(COLLECTION).doc(new Date().toISOString().split('T')[0]);
    await docRef.set({
      generatedAt: now,
      totalEntries: entries.length,
      acertadas,
      sobreestima,
      subestima,
      insuficientes,
      rulesCorrect,
      rulesIncorrect,
      summary,
    }, { merge: true });
    logger.info(`[meni-learning] Saved feedback with ${entries.length} entries`);
  } catch (err) {
    logger.error('[meni-learning] Failed to save feedback:', err);
  }

  return {
    generatedAt: now,
    hasHistoricalData: true,
    totalEntries: entries.length,
    entries,
    rulesCorrect,
    rulesIncorrect,
    summary,
  };
}
