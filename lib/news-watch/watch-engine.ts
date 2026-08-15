/**
 * News Watch — Motor de monitoreo
 * ===============================
 * Monitorea noticias publicadas.
 * Detecta nueva información.
 * No sobrescribe inmediatamente.
 * Conserva URL, slug, datePublished.
 * Actualiza dateModified.
 */

import { runResearch } from '@/lib/research';
import type { ResearchResult } from '@/lib/research/types';
import type { Firestore } from 'firebase-admin/firestore';
import type { WatchResult, UpdateDetected, WatchFrequency, ArticleLifecycle, TimelineEntry } from './types';

const WATCH_MODEL_VERSION = 'news-watch-v1.0';

export const FREQUENCY_INTERVALS: Record<WatchFrequency, number> = {
  BREAKING: 10,
  DEVELOPING: 45,
  NORMAL: 360,
  EVERGREEN: 1440,
};

/**
 * Determina la frecuencia de watch según el tier editorial y antigüedad.
 */
export function determineFrequency(article: { editorialTier?: string; fecha: string }): WatchFrequency {
  const ageHours = (Date.now() - new Date(article.fecha).getTime()) / 3600000;
  if (ageHours < 6) return 'BREAKING';
  if (ageHours < 48) return 'DEVELOPING';
  if (ageHours < 168) return 'NORMAL';
  return 'EVERGREEN';
}

/**
 * Ejecuta un ciclo de watch sobre un artículo publicado.
 */
export async function runWatchCycle(
  article: {
    id: string;
    titulo: string;
    contenido: string;
    resumen?: string;
    categoria?: string;
    fecha: string;
    perfil?: string;
  },
  options?: { db?: Firestore }
): Promise<WatchResult> {
  const checkedAt = new Date().toISOString();
  const frequency = determineFrequency(article);

  const research = await runResearch(
    {
      titulo: article.titulo,
      resumen: article.resumen,
      contenido: article.contenido,
      categoria: article.categoria,
      existingArticle: {
        id: article.id,
        titulo: article.titulo,
        contenido: article.contenido,
        fecha: article.fecha,
      },
    },
    { db: options?.db }
  );

  const updates = extractUpdates(article, research);
  const hasUpdates = updates.length > 0;

  const intervalMinutes = FREQUENCY_INTERVALS[frequency];
  const nextCheckAt = new Date(Date.now() + intervalMinutes * 60000).toISOString();

  return {
    articleId: article.id,
    checkedAt,
    hasUpdates,
    updates,
    nextCheckAt,
    frequency,
    watchStatus: hasUpdates ? 'active' : 'active',
  };
}

/**
 * Extrae actualizaciones del resultado de research comparando con el artículo original.
 */
function extractUpdates(
  article: { titulo: string; contenido: string },
  research: ResearchResult
): UpdateDetected[] {
  const updates: UpdateDetected[] = [];
  const now = new Date().toISOString();

  for (const fact of research.factsFound) {
    if (fact.status === 'OUTDATED') {
      updates.push({
        articleId: '',
        detectedAt: now,
        source: fact.sources[0]?.name || 'Desconocida',
        sourceLevel: mapLevel(fact.sources[0]?.level),
        previousFact: extractRelevantSnippet(article.contenido, fact.claim),
        newFact: fact.claim,
        importance: 'MEDIUM',
        confidence: fact.confidence,
        recommendedAction: 'EDITOR_REVIEW_REQUIRED',
        reason: 'Información marcada como desactualizada por la investigación',
      });
    }
  }

  if (research.hasNewInformation && research.newInformationSummary) {
    updates.push({
      articleId: '',
      detectedAt: now,
      source: 'Research Agent',
      sourceLevel: 'MEDIA',
      previousFact: '(no estaba en el artículo original)',
      newFact: research.newInformationSummary,
      importance: research.changesOriginalFocus ? 'HIGH' : 'MEDIUM',
      confidence: 0.7,
      recommendedAction: research.changesOriginalFocus ? 'EDITOR_REVIEW_REQUIRED' : 'SAFE_AUTO_UPDATE',
      reason: research.changesOriginalFocus
        ? 'La nueva información cambia el enfoque de la noticia'
        : 'Información complementaria que no altera el enfoque',
    });
  }

  for (const conflict of research.conflictsFound) {
    updates.push({
      articleId: '',
      detectedAt: now,
      source: `${conflict.versionA.source.name} vs ${conflict.versionB.source.name}`,
      sourceLevel: 'MEDIA',
      previousFact: conflict.versionA.claim,
      newFact: conflict.versionB.claim,
      importance: 'HIGH',
      confidence: 0.5,
      recommendedAction: 'BLOCKED_BY_CONFLICT',
      reason: `Conflicto detectado: ${conflict.recommendation}`,
    });
  }

  return updates;
}

function mapLevel(level?: string): 'PRIMARY' | 'MEDIA' | 'SECONDARY' | 'SOCIAL' {
  if (level === 'PRIMARY') return 'PRIMARY';
  if (level === 'MEDIA') return 'MEDIA';
  if (level === 'SECONDARY') return 'SECONDARY';
  return 'SOCIAL';
}

function extractRelevantSnippet(contenido: string, claim: string): string {
  const plain = contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = claim.split(' ').filter(w => w.length > 4).slice(0, 3);
  for (const word of words) {
    const idx = plain.toLowerCase().indexOf(word.toLowerCase());
    if (idx >= 0) {
      return plain.substring(Math.max(0, idx - 20), Math.min(plain.length, idx + 100));
    }
  }
  return plain.substring(0, 100);
}

/**
 * Aplica una actualización segura al artículo.
 * Conserva URL, slug, datePublished.
 * Actualiza dateModified.
 */
export function applySafeUpdate(
  article: { slug: string; fecha: string; fechaActualizacion?: string },
  update: UpdateDetected
): { dateModified: string; updateNote: string; slugPreserved: string } {
  const dateModified = new Date().toISOString();
  const updateNote = `[ACTUALIZACIÓN ${dateModified}] ${update.newFact} (Fuente: ${update.source})`;
  return {
    dateModified,
    updateNote,
    slugPreserved: article.slug,
  };
}

/**
 * Persiste el lifecycle del artículo en Firestore.
 */
export async function persistWatchResult(
  db: Firestore,
  articleId: string,
  result: WatchResult
): Promise<void> {
  const lifecycleRef = db.collection('article_lifecycles').doc(articleId);
  const existing = await lifecycleRef.get();

  const timelineEntry: TimelineEntry = {
    timestamp: result.checkedAt,
    fact: result.hasUpdates ? `Actualizaciones detectadas: ${result.updates.length}` : 'Sin cambios detectados',
    source: WATCH_MODEL_VERSION,
    sourceLevel: 'PRIMARY',
  };

  if (existing.exists) {
    const data = existing.data() as ArticleLifecycle;
    await lifecycleRef.update({
      timeline: [...(data.timeline || []), timelineEntry].slice(-50),
      dateModified: result.checkedAt,
      watchConfig: { frequency: result.frequency, intervalMinutes: FREQUENCY_INTERVALS[result.frequency], maxChecks: 100, enabled: true },
      state: result.hasUpdates ? 'ACTUALIZACION' : 'MONITOREO',
    });
  } else {
    const lifecycle: ArticleLifecycle = {
      articleId,
      state: 'MONITOREO',
      timeline: [timelineEntry],
      datePublished: result.checkedAt,
      dateModified: result.checkedAt,
      updateCount: result.hasUpdates ? result.updates.length : 0,
      watchConfig: { frequency: result.frequency, intervalMinutes: FREQUENCY_INTERVALS[result.frequency], maxChecks: 100, enabled: true },
    };
    await lifecycleRef.set(lifecycle);
  }
}
