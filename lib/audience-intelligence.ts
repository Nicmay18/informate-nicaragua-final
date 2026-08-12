import type { Noticia } from '@/lib/types';

export interface AudienceSegment {
  label: 'Contenido que construye audiencia' | 'Contenido viral' | 'Contenido recomendado' | 'Contenido a revisar';
  noticias: Noticia[];
  reason: string;
}

function daysSince(dateString: string): number {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 0;
  return (Date.now() - d.getTime()) / (24 * 60 * 60 * 1000);
}

export function analyzeAudience(noticias: Noticia[]): AudienceSegment[] {
  const build: Noticia[] = [];
  const viral: Noticia[] = [];
  const recommend: Noticia[] = [];
  const review: Noticia[] = [];

  for (const n of noticias) {
    const age = daysSince(n.fechaActualizacion || n.fechaPublicacion || n.fecha);
    const views = n.vistas ?? 0;
    const quality = n.scoreMeni ?? 70;
    const evergreenish = /cómo|qué es|guía|pasos|requisitos|costo|salario|dólar|calendario|clima/i.test(
      `${n.titulo} ${n.resumen}`
    );

    if (views > 200 && age <= 7) {
      viral.push(n);
    } else if ((evergreenish || quality >= 90) && views >= 50) {
      build.push(n);
    } else if (quality >= 80 && age <= 60) {
      recommend.push(n);
    } else if (views < 20 && age > 30) {
      review.push(n);
    }
  }

  return [
    {
      label: 'Contenido que construye audiencia',
      noticias: build.slice(0, 10),
      reason: 'Temas recurrentes o de alta calidad que fidelizan lectores.',
    },
    {
      label: 'Contenido viral',
      noticias: viral.slice(0, 10),
      reason: 'Noticias con pico de tráfico reciente.',
    },
    {
      label: 'Contenido recomendado',
      noticias: recommend.slice(0, 10),
      reason: 'Noticias sólidas que merecen mayor visibilidad.',
    },
    {
      label: 'Contenido a revisar',
      noticias: review.slice(0, 10),
      reason: 'Poco tráfico y antiguo; posible actualización o cierre.',
    },
  ];
}

export function categoryHabitMetrics(noticias: Noticia[]): Record<string, { count: number; avgViews: number }> {
  const map: Record<string, number[]> = {};
  for (const n of noticias) {
    map[n.categoria] = map[n.categoria] || [];
    map[n.categoria].push(n.vistas ?? 0);
  }
  const result: Record<string, { count: number; avgViews: number }> = {};
  Object.entries(map).forEach(([c, views]) => {
    result[c] = { count: views.length, avgViews: Math.round(views.reduce((a, b) => a + b, 0) / views.length) };
  });
  return result;
}
