import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { runWatcher, type NiosAlert } from './watcher';
import { runDailyAutomation, type DailyBriefing } from './daily-automation';
import { runMissionEngine, type MissionV4 } from './mission-engine';
import { runDistributionAgent, type DistributionAgent } from './distribution-agent';
import { runContentRecycler, type RecycleSuggestion } from './content-recycler';
import { buildEntityBrain, type EntityBrain } from './entity-brain';
import { runLearningSystem, type LearningSystem } from './learning-system';
import { runBusinessBrain, type BusinessBrainSignal } from './business-brain';
import { runMorningReport, type MorningReport } from './morning-report';

export interface NiosV4Report {
  status: 'ok' | 'partial' | 'error';
  morning: MorningReport;
  watcher: NiosAlert[];
  briefing: DailyBriefing;
  mission: MissionV4;
  distribution: DistributionAgent;
  recycler: RecycleSuggestion[];
  entityBrain: EntityBrain[];
  learning: LearningSystem;
  businessBrain: BusinessBrainSignal[];
  errors?: string[];
}

export function buildV4Report(
  noticias: Noticia[],
  guides: EvergreenArticle[] = [],
  errors: string[] = []
): NiosV4Report {
  try {
    return {
      status: errors.length ? 'partial' : 'ok',
      morning: runMorningReport(noticias, guides),
      watcher: runWatcher(noticias),
      briefing: runDailyAutomation(noticias, guides),
      mission: runMissionEngine(noticias, guides),
      distribution: runDistributionAgent(noticias),
      recycler: runContentRecycler(noticias, guides),
      entityBrain: buildEntityBrain(noticias, guides),
      learning: runLearningSystem(noticias),
      businessBrain: runBusinessBrain(noticias, guides),
      errors: errors.length ? errors : undefined,
    };
  } catch (err) {
    return {
      status: 'error',
      morning: {
        title: 'BUENOS DÍAS NICARAGUA INFORMATE',
        date: new Date().toLocaleDateString('es-NI', { dateStyle: 'long' }),
        score: 0,
        status: 'No disponible',
        yesterday: { published: 0, totalViews: 0, bestCategory: 'No disponible' },
        problem: 'No disponible',
        actions: [],
      },
      watcher: [],
      briefing: {
        generatedAt: new Date().toISOString(),
        yesterday: { published: 0, topNews: [], growing: [], totalViews: 0 },
        today: { publish: [], update: [], distribute: [], opportunity: 'No disponible' },
      },
      mission: { id: 'mission-daily', objective: 'No disponible', tasks: [], totalImpact: 0, completed: 0 },
      distribution: { queue: [], pending: 0, sent: 0 },
      recycler: [],
      entityBrain: [],
      learning: { insights: [] },
      businessBrain: [],
      errors: [err instanceof Error ? err.message : String(err), ...(errors || [])],
    };
  }
}
