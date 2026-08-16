/**
 * NIOS v2: Content Lifecycle & Substance Evaluator
 *
 * Mandate Rules:
 * - NO blind RED / YELLOW / GREEN semaphores.
 * - word_count < 400 is NOT a thin content verdict.
 * - Distinguish: SHORT_USEFUL, THIN_CANDIDATE, THIN_CONFIRMED, EDITORIALLY_COMPLETE.
 * - Track post-publication lifecycle stages (1h, 24h, 7d, 14d, 30d).
 */

import type { Noticia } from '@/lib/contracts';

export type ContentSubstanceClassification =
  | 'EDITORIALLY_COMPLETE'
  | 'SHORT_USEFUL'
  | 'THIN_CANDIDATE'
  | 'THIN_CONFIRMED';

export type LifecycleStage =
  | 'CREATED'
  | 'PUBLISHED'
  | 'OBSERVED'
  | 'LEARNING'
  | 'GROWING'
  | 'STABLE'
  | 'UPDATE_REQUIRED'
  | 'DECLINING'
  | 'ARCHIVE_CANDIDATE';

export interface LifecycleInsight {
  articleId: string;
  slug: string;
  title: string;
  category: string;
  ageHours: number;
  stage: LifecycleStage;
  substance: ContentSubstanceClassification;
  wordCount: number;
  hasAuthor: boolean;
  hasSource: boolean;
  observation: string;
  evidence: {
    publishedAt: string;
    wordCount: number;
    scoreMeni: number | null;
    gscImpressions: number | null;
    ga4Users: number | null;
  };
  recommendation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'MONITOR';
  action: string;
}

export function cleanWordCount(text = ''): number {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean ? clean.split(/\s+/).length : 0;
}

export function evaluateContentSubstance(article: Partial<Noticia>): {
  classification: ContentSubstanceClassification;
  reason: string;
  wordCount: number;
} {
  const wc = cleanWordCount(article.contenido || '');
  const hasSources = !!(article.fuente || (article.fuentesComplementarias && article.fuentesComplementarias.length > 0));
  const hasStructure = !!(article.puntosClave && article.puntosClave.length > 0) || (article.contenido?.includes('<h2>') ?? false);

  if (wc < 150 && (!hasSources || !hasStructure)) {
    return {
      classification: 'THIN_CONFIRMED',
      reason: `Texto muy breve (${wc} palabras) sin fuentes ni estructura verificada.`,
      wordCount: wc,
    };
  }

  if (wc < 250) {
    return {
      classification: 'THIN_CANDIDATE',
      reason: `Texto corto (${wc} palabras). Requiere verificar si responde las preguntas esenciales del lector.`,
      wordCount: wc,
    };
  }

  if (wc < 450) {
    return {
      classification: 'SHORT_USEFUL',
      reason: `Nota concisa y ágil (${wc} palabras). Editorialmente completa para su formato si contiene datos clave.`,
      wordCount: wc,
    };
  }

  return {
    classification: 'EDITORIALLY_COMPLETE',
    reason: `Artículo con extensión sólida (${wc} palabras) y profundidad informativa.`,
    wordCount: wc,
  };
}

export function determineLifecycleStage(
  publishedAtIso?: string,
  metrics: { gscImpressions?: number | null; ga4Users?: number | null; hasUpdateSignal?: boolean } = {}
): { stage: LifecycleStage; ageHours: number } {
  if (!publishedAtIso) {
    return { stage: 'CREATED', ageHours: 0 };
  }

  const pubDate = new Date(publishedAtIso);
  const now = Date.now();
  const ageMs = Math.max(0, now - pubDate.getTime());
  const ageHours = Math.round((ageMs / (1000 * 60 * 60)) * 10) / 10;
  const ageDays = ageHours / 24;

  if (metrics.hasUpdateSignal) {
    return { stage: 'UPDATE_REQUIRED', ageHours };
  }

  if (ageHours <= 24) {
    return { stage: 'OBSERVED', ageHours };
  }

  if (ageDays <= 7) {
    return { stage: 'LEARNING', ageHours };
  }

  if (ageDays <= 30) {
    const imps = metrics.gscImpressions ?? 0;
    if (imps > 50) return { stage: 'GROWING', ageHours };
    return { stage: 'STABLE', ageHours };
  }

  const users = metrics.ga4Users ?? 0;
  const imps = metrics.gscImpressions ?? 0;
  if (ageDays > 60 && users === 0 && imps === 0) {
    return { stage: 'ARCHIVE_CANDIDATE', ageHours };
  }

  return { stage: 'STABLE', ageHours };
}

export function generateLifecycleInsight(
  article: Partial<Noticia> & { id: string },
  metrics: { gscImpressions?: number | null; ga4Users?: number | null; hasUpdateSignal?: boolean } = {}
): LifecycleInsight {
  const substance = evaluateContentSubstance(article);
  const { stage, ageHours } = determineLifecycleStage(article.fecha || article.fechaPublicacion, metrics);
  const hasAuthor = !!article.autor;
  const hasSource = !!(article.fuente || article.fuentesComplementarias?.length);

  let recommendation = 'Mantener en observación natural.';
  let priority: LifecycleInsight['priority'] = 'MONITOR';
  let action = 'NO_ACTION';

  if (substance.classification === 'THIN_CONFIRMED') {
    recommendation = 'Investigar si la nota necesita enriquecimiento con contexto periodístico o archivo.';
    priority = 'HIGH';
    action = 'ENRICH_OR_ARCHIVE';
  } else if (stage === 'UPDATE_REQUIRED') {
    recommendation = 'Se detectó nueva información sobre el tema. Evaluar actualización editorial.';
    priority = 'HIGH';
    action = 'UPDATE_ARTICLE';
  } else if (stage === 'GROWING' && (metrics.gscImpressions || 0) > 100) {
    recommendation = 'El artículo gana tracción en Google. Enlazar desde notas afines y portada.';
    priority = 'MEDIUM';
    action = 'BOOST_INTERNAL_LINKS';
  }

  return {
    articleId: article.id,
    slug: article.slug || article.id,
    title: article.titulo || '',
    category: article.categoria || 'General',
    ageHours,
    stage,
    substance: substance.classification,
    wordCount: substance.wordCount,
    hasAuthor,
    hasSource,
    observation: `${stage} (${ageHours}h) — ${substance.classification}`,
    evidence: {
      publishedAt: article.fecha || article.fechaPublicacion || '',
      wordCount: substance.wordCount,
      scoreMeni: article.scoreMeni ?? null,
      gscImpressions: metrics.gscImpressions ?? null,
      ga4Users: metrics.ga4Users ?? null,
    },
    recommendation,
    priority,
    action,
  };
}
