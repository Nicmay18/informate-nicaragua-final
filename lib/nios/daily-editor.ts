import { getNews } from '@/lib/data';
import { getAllEvergreen } from '@/lib/evergreen';
import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { runCategoryHealth, type CategoryHealth } from './category-health';
import { runOpportunityRadar, type NiosOpportunity } from './opportunity-radar';
import { runSeoCleanup, type SeoCleanupReport } from './seo-cleanup';
import { getContentMixRecommendation, type ContentMixDay } from './content-mix';
import { runBusinessSignals, type BusinessSignal } from './business-signals';
import { buildExecutiveDashboard, type ExecutiveDashboard } from './executive-report';
import { buildV3Report, type NiosV3Report } from './v3-report';
import { buildV4Report, type NiosV4Report } from './v4-report';
import { logger } from '@/lib/logger';

export interface DailyEditorReport {
  generatedAt: string;
  date: string;
  status: 'ok' | 'partial';
  publishedCount: number;
  dominantCategory: string;
  distribution: Record<string, number>;
  categoryHealth: Record<string, CategoryHealth>;
  categoriesToStrengthen: string[];
  recommendations: string[];
  opportunities: NiosOpportunity[];
  seo: SeoCleanupReport;
  weeklyMix: ContentMixDay[];
  mixRationale: string[];
  businessSignals: BusinessSignal[];
  executive: ExecutiveDashboard;
  v3: NiosV3Report;
  v4: NiosV4Report;
  errors?: string[];
}

export async function getDailyEditorReport(
  newsInput?: Noticia[],
  guidesInput?: EvergreenArticle[]
): Promise<DailyEditorReport> {
  const errors: string[] = [];

  let noticias: Noticia[] = newsInput || [];
  let guides: EvergreenArticle[] = guidesInput || [];

  if (!newsInput) {
    try {
      noticias = await getNews(500);
    } catch (err) {
      logger.error('[daily-editor] Error cargando noticias:', err);
      errors.push('No se pudieron cargar las noticias de Firestore.');
    }
  }

  if (!guidesInput) {
    try {
      guides = getAllEvergreen();
    } catch (err) {
      logger.error('[daily-editor] Error cargando guías:', err);
      errors.push('No se pudieron cargar las guías evergreen.');
    }
  }

  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const distribution: Record<string, number> = {};
  for (const n of published) {
    distribution[n.categoria] = (distribution[n.categoria] || 0) + 1;
  }

  const dominantCategory = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin datos';

  const { health, toStrengthen } = runCategoryHealth(noticias);
  const opportunities = runOpportunityRadar(noticias, guides);
  const seo = runSeoCleanup(noticias);
  const { mix, rationale } = getContentMixRecommendation(noticias);
  const businessSignals = runBusinessSignals(noticias, guides);

  const recommendations: string[] = [];
  if (toStrengthen.length > 0) {
    recommendations.push(`Fortalecer categorías: ${toStrengthen.join(', ')}.`);
  }
  if (opportunities.length > 0) {
    recommendations.push(`Aprovechar oportunidad: ${opportunities[0].topic}.`);
  }
  if (seo.total > 0) {
    recommendations.push(`Revisar ${seo.total} problemas SEO pendientes.`);
  }
  if (businessSignals.length > 0) {
    recommendations.push(`Explorar señal comercial: ${businessSignals[0].category}.`);
  }

  const now = new Date();

  const executive = buildExecutiveDashboard(
    noticias,
    guides,
    health,
    opportunities,
    seo,
    businessSignals,
    errors
  );

  const v3 = buildV3Report(noticias, guides, errors);
  const v4 = buildV4Report(noticias, guides, errors);

  return {
    generatedAt: now.toISOString(),
    date: now.toLocaleDateString('es-NI', { dateStyle: 'long' }),
    status: errors.length ? 'partial' : 'ok',
    publishedCount: published.length,
    dominantCategory,
    distribution,
    categoryHealth: health,
    categoriesToStrengthen: toStrengthen,
    recommendations,
    opportunities,
    seo,
    weeklyMix: mix,
    mixRationale: rationale,
    businessSignals,
    executive,
    v3,
    v4,
    errors: errors.length ? errors : undefined,
  };
}
