/**
 * NIOS Business Command Center
 *
 * Capa de dirección ejecutiva sobre los motores existentes.
 * Solo lee; no modifica MENI, EOS, NIOS, Home Ranking ni Daily Editor.
 */

import { getNews } from '@/lib/data';
import { getAllEvergreen } from '@/lib/evergreen';
import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { logger } from '@/lib/logger';

import { buildEditorialBalance } from './editorial-balance';
import { buildGoogleTrust } from './google-trust';
import { buildRevenueEngine } from './revenue-engine';
import { buildContentWarRoom } from './war-room';
import { buildHomeQuality } from './home-quality';
import { buildDistributionCommand } from './distribution-command';
import { buildOpportunityHunter } from './opportunity-hunter';
import { buildBusinessHealth } from './business-health';
import { buildCeoDecisions } from './ceo-decisions';
import { buildCeoView } from './ceo-view';
import { buildAuthorityHealth } from './authority-health';
import { syncRecommendations, getCeoMemory } from '@/lib/nios/ceo-memory';
import type { BusinessCommandCenter } from './types';

export * from './types';
export { buildEditorialBalance } from './editorial-balance';
export { buildGoogleTrust } from './google-trust';
export { buildRevenueEngine } from './revenue-engine';
export { buildContentWarRoom } from './war-room';
export { buildHomeQuality } from './home-quality';
export { buildDistributionCommand } from './distribution-command';
export { buildOpportunityHunter } from './opportunity-hunter';
export { buildBusinessHealth } from './business-health';
export { buildAuthorityHealth } from './authority-health';
export { buildCeoDecisions } from './ceo-decisions';

/**
 * Construye el centro de mando a partir de datos ya cargados.
 * Función pura: sin I/O, testeable de forma determinista.
 */
export function buildCommandCenter(
  noticias: Noticia[],
  guides: EvergreenArticle[],
  errors: string[] = [],
  now = new Date(),
  pendingCount = 0,
): BusinessCommandCenter {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');

  const balance = buildEditorialBalance(noticias);
  const trust = buildGoogleTrust(noticias, guides, now.getTime());
  const revenue = buildRevenueEngine(noticias, guides);
  const home = buildHomeQuality(noticias);
  const distribution = buildDistributionCommand(noticias, now.getTime());
  const hunter = buildOpportunityHunter(noticias, guides);
  const warRoom = buildContentWarRoom(noticias, balance, now);
  const authority = buildAuthorityHealth(noticias);
  const business = buildBusinessHealth(noticias, guides, balance, trust, revenue, now.getTime());

  const decisions = buildCeoDecisions({ balance, trust, revenue, home, distribution, hunter, business });
  const ceo = buildCeoView({
    generatedAt: now.toISOString(),
    date: now.toLocaleDateString('es-NI', { dateStyle: 'long' }),
    status: errors.length ? 'partial' : 'ok',
    analyzed: published.length,
    decisions,
    balance,
    trust,
    revenue,
    warRoom,
    home,
    distribution,
    hunter,
    authority,
    business,
  }, pendingCount);

  return {
    generatedAt: now.toISOString(),
    date: now.toLocaleDateString('es-NI', { dateStyle: 'long' }),
    status: errors.length ? 'partial' : 'ok',
    analyzed: published.length,
    decisions,
    balance,
    trust,
    revenue,
    warRoom,
    home,
    distribution,
    hunter,
    authority,
    business,
    ceo,
    errors: errors.length ? errors : undefined,
  };
}

/** Carga los datos y construye el centro de mando. */
export async function getCommandCenter(): Promise<BusinessCommandCenter> {
  const errors: string[] = [];
  let noticias: Noticia[] = [];
  let guides: EvergreenArticle[] = [];

  try {
    noticias = await getNews(500);
  } catch (err) {
    logger.error('[command-center] Error cargando noticias:', err);
    errors.push('No se pudieron cargar las noticias de Firestore.');
  }

  try {
    guides = getAllEvergreen();
  } catch (err) {
    logger.error('[command-center] Error cargando guías:', err);
    errors.push('No se pudieron cargar las guías evergreen.');
  }

  const cc = buildCommandCenter(noticias, guides, errors);

  // CEO Mode: persistir recomendaciones activas y leer memoria operativa.
  try {
    const recommendations = cc.ceo?.cards.map((c) => ({
      id: `ceo-${c.kind}-${c.headline}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80),
      action: c.action,
      source: c.source,
    })) ?? [];
    await syncRecommendations(recommendations);
    const memory = await getCeoMemory();
    const pendingCount = memory.pending.length;
    return buildCommandCenter(noticias, guides, errors, new Date(), pendingCount);
  } catch (err) {
    logger.error('[command-center] Error sincronizando CEO memory:', err);
    return cc;
  }
}
