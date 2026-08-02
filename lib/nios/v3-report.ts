import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { buildKnowledgeGraph, type KnowledgeGraph } from './knowledge-graph';
import { runContentIntelligence, type ContentIntelligence } from './content-intelligence';
import { buildEditorialMemory, type EditorialMemory } from './editorial-memory';
import { buildEditorialTimeline, type EditorialTimeline } from './editorial-timeline';
import { runSmartLinks, type LinkSuggestion } from './smart-links';
import { runMissionCenter, type MissionCenter } from './mission-center';
import { calculateEditorialScore, type EditorialScore } from './editorial-score';
import { runBusinessV3, type BusinessIntelligenceV3 } from './business';
import { runCopilot, type CopilotRecommendation } from './copilot';

export interface NiosV3Report {
  status: 'ok' | 'partial' | 'error';
  knowledgeGraph: KnowledgeGraph;
  contentIntelligence: ContentIntelligence;
  editorialMemory: EditorialMemory;
  editorialTimeline: EditorialTimeline;
  smartLinks: LinkSuggestion[];
  missionCenter: MissionCenter;
  editorialScore: EditorialScore;
  business: BusinessIntelligenceV3;
  copilot: CopilotRecommendation[];
  errors?: string[];
}

export function buildV3Report(
  noticias: Noticia[],
  guides: EvergreenArticle[] = [],
  errors: string[] = []
): NiosV3Report {
  try {
    const knowledgeGraph = buildKnowledgeGraph(noticias, guides);
    const contentIntelligence = runContentIntelligence(noticias, guides);
    const editorialMemory = buildEditorialMemory(noticias, guides);
    const editorialTimeline = buildEditorialTimeline(noticias);
    const smartLinks = runSmartLinks(noticias, guides);
    const missionCenter = runMissionCenter(noticias);
    const editorialScore = calculateEditorialScore(noticias, guides);
    const business = runBusinessV3(noticias, guides);
    const copilot = runCopilot(noticias, guides);

    return {
      status: errors.length ? 'partial' : 'ok',
      knowledgeGraph,
      contentIntelligence,
      editorialMemory,
      editorialTimeline,
      smartLinks,
      missionCenter,
      editorialScore,
      business,
      copilot,
      errors: errors.length ? errors : undefined,
    };
  } catch (err) {
    return {
      status: 'error',
      knowledgeGraph: { entities: [], entityMap: {} },
      contentIntelligence: {
        duplicateGroups: [],
        cannibalization: [],
        abandoned: [],
        evergreenCandidates: [],
        updateCandidates: [],
        withoutInternalLinks: [],
        lowContext: [],
        tooShort: [],
        tooLong: [],
        lowViews: [],
        growing: [],
        viral: [],
        historical: [],
        featuredCandidates: [],
      },
      editorialMemory: { memories: [], orphanNews: [] },
      editorialTimeline: { timelines: [], entityCount: 0, yearRange: { min: 0, max: 0 } },
      smartLinks: [],
      missionCenter: { headline: 'No disponible', missions: [], completed: 0, total: 0 },
      editorialScore: { total: 0, components: [], verdict: 'No disponible' },
      business: {
        profitableCategories: [],
        valuableGuides: [],
        commercialTopics: [],
        recurrentThemes: [],
        affiliateCandidates: [],
        sponsorCandidates: [],
        downloadableCandidates: [],
        premiumCandidates: [],
        newsletterCandidates: [],
        topAuthors: [],
      },
      copilot: [],
      errors: [err instanceof Error ? err.message : String(err), ...(errors || [])],
    };
  }
}
