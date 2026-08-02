import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { calculateEditorialScore } from '../editorial-score';
import { runDailyAutomation } from '../daily-automation';
import { runMissionEngine } from '../mission-engine';
import { runWatcher } from '../watcher';
import { buildEntityBrain } from '../entity-brain';
import { runContentRecycler } from '../content-recycler';

export interface MorningReport {
  title: string;
  date: string;
  score: number;
  status: string;
  yesterday: { published: number; totalViews: number; bestCategory: string };
  problem: string;
  actions: string[];
}

export function runMorningReport(noticias: Noticia[], guides: EvergreenArticle[] = []): MorningReport {
  const score = calculateEditorialScore(noticias, guides);
  const daily = runDailyAutomation(noticias, guides);
  const mission = runMissionEngine(noticias, guides);
  const alerts = runWatcher(noticias);
  const brain = buildEntityBrain(noticias, guides);
  const recycler = runContentRecycler(noticias, guides);

  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const viewsByCat: Record<string, number> = {};
  for (const n of published) {
    viewsByCat[n.categoria] = (viewsByCat[n.categoria] || 0) + (n.vistas || 0);
  }
  const bestCategory = Object.entries(viewsByCat).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin datos';

  const critical = alerts.filter((a) => a.priority === 'critical');
  const problem = critical[0]?.reason || mission.tasks.find((t) => t.priority === 'critical' && !t.done)?.title || 'Sin problemas críticos.';

  const actions = [
    daily.today.publish[0] || '',
    daily.today.update[0] || '',
    daily.today.distribute[0] || '',
    recycler[0]?.target || '',
    brain[0]?.opportunities[0] || '',
    ...mission.tasks.filter((t) => !t.done).slice(0, 2).map((t) => t.title),
  ].filter(Boolean);

  let status = 'Saludable';
  if (score.total < 60) status = 'Crítico';
  else if (score.total < 80) status = 'Estable con observaciones';

  return {
    title: 'BUENOS DÍAS NICARAGUA INFORMATE',
    date: new Date().toLocaleDateString('es-NI', { dateStyle: 'long' }),
    score: score.total,
    status,
    yesterday: {
      published: daily.yesterday.published,
      totalViews: daily.yesterday.totalViews,
      bestCategory,
    },
    problem,
    actions,
  };
}
