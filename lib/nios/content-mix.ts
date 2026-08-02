import type { Noticia } from '@/lib/types';

export interface ContentMixDay {
  day: string;
  items: string[];
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const TARGET_CATEGORIES = [
  'Nacionales',
  'Sucesos',
  'Internacionales',
  'Deportes',
  'Tecnología',
  'Espectáculos',
];

export function getContentMixRecommendation(
  noticias: Noticia[],
  weekStart: Date = new Date()
): { mix: ContentMixDay[]; rationale: string[] } {
  const last30 = noticias.filter((n) => {
    if (!n.fecha || n.estado === 'borrador' || n.estado === 'archivado') return false;
    const d = new Date(n.fecha).getTime();
    const cutoff = weekStart.getTime() - 30 * 24 * 60 * 60 * 1000;
    return d >= cutoff;
  });

  const counts: Record<string, number> = {};
  for (const n of last30) {
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
  }

  const sorted = [...TARGET_CATEGORIES].sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
  const low = sorted.slice(0, 3);
  const high = sorted.slice(-2);

  const mix: ContentMixDay[] = [];
  for (let i = 0; i < 7; i++) {
    const day = DAYS[i];
    const must = low[i % low.length];
    const balance = high[i % high.length];
    const third = i % 3 === 2 ? 'Guía útil' : 'Sucesos / Internacional';
    mix.push({ day, items: [must, balance, third] });
  }

  const rationale: string[] = [
    `Categorías más débiles: ${low.join(', ')}. Se priorizan en el plan.`,
    `Categorías con cobertura estable: ${high.join(', ')}. Se mantienen pero no se saturan.`,
    'Se reserva una guía útil por semana para alimentar el Centro Útil.',
    'Se mantiene Sucesos con límite para no dominar la portada.',
  ];

  return { mix, rationale };
}
