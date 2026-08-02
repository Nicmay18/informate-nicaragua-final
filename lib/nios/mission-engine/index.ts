import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { runCategoryHealth } from '../category-health';
import { runSeoCleanup } from '../seo-cleanup';
import { runContentIntelligence } from '../content-intelligence';

export interface MissionV4 {
  id: string;
  objective: string;
  tasks: MissionTask[];
  totalImpact: number;
  completed: number;
}

export interface MissionTask {
  id: string;
  title: string;
  impact: string;
  difficulty: 'fácil' | 'media' | 'difícil';
  priority: 'critical' | 'high' | 'medium';
  done: boolean;
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function runMissionEngine(noticias: Noticia[], guides: EvergreenArticle[] = []): MissionV4 {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const { health } = runCategoryHealth(noticias);
  const seo = runSeoCleanup(noticias);
  const ci = runContentIntelligence(noticias, guides);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayByCat = (cat: string) => published.filter((n) => n.categoria === cat && toDate(n.fecha).getTime() >= todayStart.getTime()).length;

  const tasks: MissionTask[] = [];

  if (todayByCat('Nacionales') < 1) {
    tasks.push({ id: 'm4-nac', title: 'Publicar 1 Nacional', impact: '+20% tráfico portada', difficulty: 'media', priority: 'high', done: false });
  } else {
    tasks.push({ id: 'm4-nac', title: 'Publicar 1 Nacional', impact: '+20% tráfico portada', difficulty: 'media', priority: 'high', done: true });
  }

  if (todayByCat('Tecnología') < 1) {
    tasks.push({ id: 'm4-tec', title: 'Publicar 1 Tecnología', impact: '+SEO evergreen', difficulty: 'media', priority: 'medium', done: false });
  } else {
    tasks.push({ id: 'm4-tec', title: 'Publicar 1 Tecnología', impact: '+SEO evergreen', difficulty: 'media', priority: 'medium', done: true });
  }

  const weak = Object.entries(health).filter(([, h]) => h.level === 'bajo').sort((a, b) => a[1].count7 - b[1].count7)[0]?.[0];
  if (weak) {
    tasks.push({ id: 'm4-weak', title: `Fortalecer ${weak}`, impact: 'Equilibra portada', difficulty: 'media', priority: 'critical', done: false });
  }

  const metaPending = seo.counts['meta_vacia'] || 0;
  if (metaPending > 0) {
    tasks.push({ id: 'm4-meta', title: `Corregir ${Math.min(metaPending, 10)} meta descriptions`, impact: '+CTR búsqueda', difficulty: 'fácil', priority: 'critical', done: false });
  }

  if (ci.evergreenCandidates.length > 0) {
    tasks.push({ id: 'm4-guide', title: 'Crear 1 guía evergreen', impact: '+tráfico permanente', difficulty: 'difícil', priority: 'high', done: false });
  }

  const today = published.filter((n) => toDate(n.fecha).getTime() >= todayStart.getTime()).length;
  if (today >= 3) {
    tasks.push({ id: 'm4-dist', title: 'Distribuir 5 artículos', impact: '+alcance social', difficulty: 'fácil', priority: 'high', done: today >= 5 });
  }

  if (ci.updateCandidates.length > 0) {
    tasks.push({ id: 'm4-update', title: 'Actualizar 2 noticias maduras', impact: '+tráfico recuperado', difficulty: 'media', priority: 'medium', done: false });
  }

  const totalImpact = tasks.reduce((s, t) => s + (t.priority === 'critical' ? 3 : t.priority === 'high' ? 2 : 1), 0);
  const completed = tasks.filter((t) => t.done).length;

  return {
    id: 'mission-daily',
    objective: 'Aumentar tráfico orgánico y equilibrar portada',
    tasks,
    totalImpact,
    completed,
  };
}
