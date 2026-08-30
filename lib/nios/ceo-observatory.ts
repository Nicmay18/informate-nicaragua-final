/**
 * NIOS CEO Observatory
 * =====================
 * Recolecta señales de negocio de los cerebros existentes y las traduce
 * a entradas de decisión para el CEO Loop.
 *
 * No crea motores. Conecta los que ya existen.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { getAllEvergreen } from '@/lib/evergreen';
import { buildCommandCenter, type BusinessCommandCenter } from '@/lib/nios/command-center';
import { runBusinessBrain } from '@/lib/nios/business-brain';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { loadNoticiasFromFirestore } from '@/lib/nios/intelligence/data-merger';
import { logger } from '@/lib/logger';
import type { ArticleFusion, GSCSnapshot, GA4Snapshot } from '@/lib/nios/intelligence/types';
import type { CeoDecisionInput } from './ceo-action-registry';

function formatNumber(n: number | undefined | null): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  return n.toLocaleString('es-NI');
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export interface CeoObservatoryResult {
  inputs: CeoDecisionInput[];
  commandCenter: BusinessCommandCenter | null;
  snapshotDate: string | null;
  articlesFused: ArticleFusion[];
  gsc: GSCSnapshot | null;
  ga4: GA4Snapshot | null;
  trafficArticles: number;
  totalViews24h: number;
  errors: string[];
}

async function loadBusinessCommandCenter(db: Firestore): Promise<{ cc: BusinessCommandCenter | null; noticiasCount: number; errors: string[] }> {
  const errors: string[] = [];
  try {
    const noticias = await loadNoticiasFromFirestore(db, 500);
    const guides = getAllEvergreen();
    const cc = buildCommandCenter(noticias, guides, errors);
    return { cc, noticiasCount: noticias.length, errors };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[ceo-observatory] loadBusinessCommandCenter failed:', err);
    return { cc: null, noticiasCount: 0, errors: [message] };
  }
}

export async function observeCeoInputs(db: Firestore): Promise<CeoObservatoryResult> {
  const inputs: CeoDecisionInput[] = [];
  const errors: string[] = [];

  const [ccResult, latestSnapshot] = await Promise.all([
    loadBusinessCommandCenter(db).catch((err) => {
      logger.error('[ceo-observatory] loadBusinessCommandCenter:', err);
      return { cc: null as BusinessCommandCenter | null, noticiasCount: 0, errors: [String(err)] };
    }),
    getLatestSnapshot(db).catch((err) => {
      logger.error('[ceo-observatory] getLatestSnapshot:', err);
      return null;
    }),
  ]);

  const { cc } = ccResult;
  if (ccResult.errors.length) errors.push(...ccResult.errors);

  let businessBrain = null;
  if (cc) {
    try {
      const n = (await loadNoticiasFromFirestore(db, 500)).filter((x) => x.estado !== 'borrador' && x.estado !== 'archivado');
      const g = getAllEvergreen();
      businessBrain = runBusinessBrain(n, g);
    } catch (err) {
      logger.error('[ceo-observatory] business brain:', err);
      errors.push(String(err));
    }
  }

  const gsc = latestSnapshot?.gsc ?? null;
  const ga4 = latestSnapshot?.ga4 ?? null;
  const articlesFused = latestSnapshot?.articlesFused ?? [];
  const snapshotDate = latestSnapshot?.date ?? null;

  // ── 1. Observaciones de salud del sistema (GSC/GA4) ──
  if (!gsc || gsc.status !== 'REAL') {
    inputs.push({
      id: `obs-gsc-${todayKey()}`,
      domain: 'system',
      priority: 'P0',
      evidence: [`GSC status: ${gsc?.status ?? 'NO_DATA'}`, `Error: ${gsc?.errorMessage ?? 'sin credenciales o sin datos'}`],
      reason: 'No hay datos reales de Google Search Console.',
      expectedImpact: 'El CEO no puede tomar decisiones SEO basadas en GSC.',
      suggestedActionId: 'block-gsc-missing',
      risk: 0.9,
    });
  }

  if (!ga4 || ga4.status !== 'REAL') {
    inputs.push({
      id: `obs-ga4-${todayKey()}`,
      domain: 'system',
      priority: 'P0',
      evidence: [`GA4 status: ${ga4?.status ?? 'NO_DATA'}`, `Property: ${process.env.NIOS_GA4_PROPERTY_ID || 'NOT_CONFIGURED'}`],
      reason: 'No hay datos reales de Google Analytics 4.',
      expectedImpact: 'El CEO no puede medir tráfico real por fuente.',
      suggestedActionId: 'block-ga4-missing',
      risk: 0.9,
    });
  }

  // ── 2. Oportunidades de CTR/título en GSC (con evidencia real) ──
  if (gsc?.status === 'REAL' && articlesFused.length > 0) {
    const candidates = articlesFused
      .filter((a) =>
        typeof a.gscImpressions === 'number' && a.gscImpressions >= 1000 &&
        typeof a.gscCtr === 'number' && a.gscCtr < 0.02 &&
        typeof a.gscPosition === 'number' && a.gscPosition <= 10,
      )
      .sort((a, b) => b.gscImpressions - a.gscImpressions)
      .slice(0, 3);

    for (const a of candidates) {
      inputs.push({
        id: `obs-ctr-${a.slug}-${todayKey()}`,
        domain: 'seo',
        priority: 'P1',
        evidence: [
          `Slug: ${a.slug}`,
          `Impresiones: ${formatNumber(a.gscImpressions)}`,
          `CTR: ${(a.gscCtr * 100).toFixed(2)}%`,
          `Posición: ${a.gscPosition}`,
        ],
        reason: `El artículo aparece en búsqueda pero el titular/snippet no convierte.`,
        expectedImpact: 'Mejorar CTR puede incrementar clics sin nuevas posiciones.',
        suggestedActionId: 'queue-title-experiment',
        risk: 0.4,
        metadata: { slug: a.slug, impressions: a.gscImpressions, ctr: a.gscCtr, position: a.gscPosition },
      });
    }
  }

  // ── 3. Distribución (top plan) ──
  if (cc && cc.distribution.plans[0]) {
    const p = cc.distribution.plans[0];
    inputs.push({
      id: `obs-dist-${p.slug}-${todayKey()}`,
      domain: 'distribution',
      priority: p.priority === 'critica' ? 'P0' : p.priority === 'alta' ? 'P1' : 'P2',
      evidence: [`Título: ${p.title}`, `Categoría: ${p.category}`, `Prioridad: ${p.priority}`],
      reason: p.reason,
      expectedImpact: 'Aumentar alcance de la pieza con mayor retorno hoy.',
      suggestedActionId: 'queue-distribution-copy',
      risk: 0.5,
      metadata: { slug: p.slug, title: p.title, channel: p.copies.map((c) => c.channel) },
    });
  }

  // ── 4. Contenido deficitario ──
  if (cc) {
    const deficit = cc.balance.categories.find((c) => c.status === 'deficitario');
    if (deficit) {
      inputs.push({
        id: `obs-deficit-${deficit.category}-${todayKey()}`,
        domain: 'content',
        priority: 'P1',
        evidence: [
          `Categoría: ${deficit.category}`,
          `Share real: ${deficit.share}%`,
          `Objetivo: ${deficit.target}%`,
          `Desviación: ${deficit.deviation}`,
        ],
        reason: `La categoría ${deficit.category} está por debajo del objetivo editorial.`,
        expectedImpact: 'Recuperar equilibrio editorial fortalece la identidad de marca para Google.',
        suggestedActionId: 'queue-editorial-plan',
        risk: 0.4,
        metadata: { category: deficit.category, target: deficit.target, share: deficit.share },
      });
    }
  }

  // ── 5. Oportunidad no cubierta de alto valor ──
  if (cc) {
    const high = cc.hunter.items.find((i) => !i.covered && i.commercialValue === 'alto');
    if (high) {
      const match = articlesFused.find((a) => a.titulo.toLowerCase().includes(high.topic.toLowerCase()));
      inputs.push({
        id: `obs-opp-${high.topic}-${todayKey()}`,
        domain: 'growth',
        priority: 'P1',
        evidence: [`Tema: ${high.topic}`, `Intento: ${high.intent}`, `Demanda: ${high.demand}`],
        reason: high.rationale,
        expectedImpact: 'Cubrir una demanda de búsqueda permanente sin competencia propia.',
        suggestedActionId: 'queue-evergreen-guide',
        risk: 0.4,
        metadata: { topic: high.topic, intent: high.intent, format: high.format, sourceSlug: match?.slug },
      });
    }
  }

  // ── 6. Calidad de portada ──
  if (cc && cc.home.violations.length > 0) {
    const hero = cc.distribution.plans[0]?.slug || articlesFused[0]?.slug || '';
    inputs.push({
      id: `obs-home-${todayKey()}`,
      domain: 'content',
      priority: cc.home.score < 55 ? 'P0' : 'P1',
      evidence: [`Home score: ${cc.home.score}`, `Violación: ${cc.home.violations[0]}`, `Categoría dominante: ${cc.home.dominantCategory ?? 'ninguna'}`],
      reason: 'La portada no comunica correctamente la identidad editorial.',
      expectedImpact: 'Mejorar primera impresión de lector nuevo y señal de marca para Google.',
      suggestedActionId: 'queue-hero-article',
      risk: 0.6,
      metadata: { suggestedSlug: hero, violation: cc.home.violations[0] },
    });
  }

  // ── 7. Patrones de tráfico real (breakout) ──
  const trafficPerformance = latestSnapshot?.trafficPerformance ?? null;
  const trafficArticles = trafficPerformance?.topArticles?.length ?? 0;
  const totalViews24h = trafficPerformance?.topArticles?.reduce((s, a) => s + (a.views ?? 0), 0) ?? 0;
  if (trafficPerformance && trafficPerformance.topArticles.length > 0) {
    const views = trafficPerformance.topArticles.map((a) => a.views).filter((v) => typeof v === 'number');
    const mean = avg(views);
    const std = Math.sqrt(avg(views.map((v) => (v - mean) ** 2)));
    const threshold = mean + 2 * std;

    const breakouts = trafficPerformance.topArticles.filter((a) => a.views >= threshold).slice(0, 3);
    for (const b of breakouts) {
      inputs.push({
        id: `obs-breakout-${b.slug}-${todayKey()}`,
        domain: 'traffic',
        priority: 'P2',
        evidence: [
          `Slug: ${b.slug}`,
          `Views 24h: ${formatNumber(b.views)}`,
          `Promedio: ${formatNumber(mean)}`,
          `Umbral 2σ: ${formatNumber(threshold)}`,
        ],
        reason: `Este artículo supera significativamente el promedio de tráfico.`,
        expectedImpact: 'Investigar el patrón para replicarlo en próximas piezas.',
        suggestedActionId: 'no-action-insufficient-evidence',
        risk: 0.1,
        metadata: { slug: b.slug, views24h: b.views, mean, threshold },
      });
    }
  }

  // ── 8. Señales de Business Brain ──
  if (businessBrain) {
    const top = businessBrain[0];
    if (top && top.potential === 'alto') {
      inputs.push({
        id: `obs-business-${top.name}-${todayKey()}`,
        domain: 'monetization',
        priority: 'P2',
        evidence: [`Señal: ${top.name}`, `Tipo: ${top.type}`, `Potencial: ${top.potential}`, `Razón: ${top.reason}`],
        reason: top.reason,
        expectedImpact: 'Alinea contenido con oportunidades comerciales concretas.',
        suggestedActionId: 'queue-evergreen-guide',
        risk: 0.4,
        metadata: { signal: top.name, type: top.type, actions: top.actions },
      });
    }
  }

  // ── 9. Todo saludable ──
  if (inputs.length === 0) {
    inputs.push({
      id: `obs-healthy-${todayKey()}`,
      domain: 'system',
      priority: 'P3',
      evidence: ['Todas las fuentes activas están saludables.', 'No se detectaron oportunidades accionables.'],
      reason: 'No hay problemas ni oportunidades que requieran acción automática.',
      expectedImpact: 'Continuar monitoreo.',
      suggestedActionId: 'no-action-healthy',
      risk: 0,
    });
  }

  return {
    inputs,
    commandCenter: cc,
    snapshotDate,
    articlesFused,
    gsc,
    ga4,
    trafficArticles,
    totalViews24h,
    errors,
  };
}
