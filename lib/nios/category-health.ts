import type { Noticia } from '@/lib/types';

export interface CategoryHealth {
  count7: number;
  count30: number;
  views7: number;
  views30: number;
  level: 'alto' | 'medio' | 'bajo';
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

const REFERENCE_CATEGORIES = [
  'Nacionales',
  'Sucesos',
  'Internacionales',
  'Tecnología',
  'Deportes',
  'Espectáculos',
];

export function runCategoryHealth(
  noticias: Noticia[],
  now = new Date()
): { health: Record<string, CategoryHealth>; toStrengthen: string[] } {
  const ms7 = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const ms30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const health: Record<string, CategoryHealth> = {};

  for (const cat of REFERENCE_CATEGORIES) {
    health[cat] = { count7: 0, count30: 0, views7: 0, views30: 0, level: 'bajo' };
  }

  for (const n of noticias) {
    if (n.estado === 'borrador' || n.estado === 'archivado') continue;
    const d = toDate(n.fecha);
    const t = d.getTime();
    const cat = n.categoria;
    if (!health[cat]) {
      health[cat] = { count7: 0, count30: 0, views7: 0, views30: 0, level: 'bajo' };
    }
    if (t >= ms30) {
      health[cat].count30++;
      health[cat].views30 += n.vistas || 0;
    }
    if (t >= ms7) {
      health[cat].count7++;
      health[cat].views7 += n.vistas || 0;
    }
  }

  const toStrengthen: string[] = [];

  for (const [cat, data] of Object.entries(health)) {
    if (data.count7 >= 3 || data.views7 >= 30) {
      data.level = 'alto';
    } else if (data.count7 >= 1 || data.count30 >= 4) {
      data.level = 'medio';
    } else {
      data.level = 'bajo';
      toStrengthen.push(cat);
    }
  }

  return { health, toStrengthen };
}
