import type { Noticia } from '@/lib/types';
import { runCategoryHealth } from '../category-health';
import { runSeoCleanup } from '../seo-cleanup';
import { runContentIntelligence } from '../content-intelligence';

export interface MissionItem {
  id: string;
  area: 'publicación' | 'actualización' | 'corrección' | 'creación' | 'distribución';
  title: string;
  target: string;
  current: number;
  goal: number;
  unit: string;
  priority: 'critical' | 'high' | 'medium';
  action: string;
}

export interface MissionCenter {
  headline: string;
  missions: MissionItem[];
  completed: number;
  total: number;
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function runMissionCenter(noticias: Noticia[]): MissionCenter {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const today = published.filter((n) => toDate(n.fecha).getTime() >= todayStart.getTime());
  const todayByCategory = (cat: string) => today.filter((n) => n.categoria === cat).length;

  const { health } = runCategoryHealth(noticias);
  const weak = Object.entries(health)
    .filter(([, h]) => h.level === 'bajo')
    .sort((a, b) => a[1].count7 - b[1].count7)[0]?.[0] || '';

  const seo = runSeoCleanup(noticias);
  const ci = runContentIntelligence(noticias);

  const missions: MissionItem[] = [
    { id: 'm-nacional', area: 'publicación', title: 'Publicar Nacional', target: 'Nacionales', current: todayByCategory('Nacionales'), goal: 1, unit: 'nota', priority: 'high', action: 'Publicar 1 noticia nacional.' },
    { id: 'm-tecnologia', area: 'publicación', title: 'Publicar Tecnología', target: 'Tecnología', current: todayByCategory('Tecnología'), goal: 1, unit: 'nota', priority: 'medium', action: 'Publicar 1 noticia de tecnología.' },
    { id: 'm-internacional', area: 'publicación', title: 'Publicar Internacional', target: 'Internacionales', current: todayByCategory('Internacionales'), goal: 1, unit: 'nota', priority: 'medium', action: 'Publicar 1 noticia internacional.' },
    { id: 'm-actualizar', area: 'actualización', title: 'Actualizar noticias', target: 'Contenido maduro', current: Math.min(ci.updateCandidates.length, 2), goal: 2, unit: 'notas', priority: 'high', action: 'Actualizar 2 noticias con tráfico acumulado.' },
    { id: 'm-metas', area: 'corrección', title: 'Corregir meta descriptions', target: 'SEO', current: seo.counts['meta_vacia'] || 0, goal: 5, unit: 'metas', priority: 'critical', action: 'Completar meta descriptions pendientes.' },
    { id: 'm-guia', area: 'creación', title: 'Crear guía', target: 'Evergreen', current: ci.evergreenCandidates.length > 0 ? 0 : 1, goal: 1, unit: 'guía', priority: 'high', action: 'Convertir una noticia con potencial evergreen.' },
    { id: 'm-distribuir', area: 'distribución', title: 'Distribuir artículos', target: 'Redes', current: today.length, goal: 3, unit: 'artículos', priority: 'high', action: 'Distribuir 3 artículos del día.' },
  ];

  if (weak) {
    missions.unshift({
      id: 'm-fortalecer',
      area: 'publicación',
      title: 'Fortalecer categoría débil',
      target: weak,
      current: health[weak].count7,
      goal: 2,
      unit: 'notas',
      priority: 'critical',
      action: `Publicar 2 notas en ${weak}.`,
    });
  }

  const completed = missions.filter((m) => m.current >= m.goal).length;
  const total = missions.length;

  return {
    headline: `Objetivo del día: completar ${total} misiones editoriales.`,
    missions,
    completed,
    total,
  };
}
