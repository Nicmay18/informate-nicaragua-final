import type { Noticia } from '@/lib/types';

export type DataProvenance = 'REAL_DATA' | 'DERIVED_DATA' | 'HEURISTIC' | 'NO_DATA' | 'INSUFFICIENT_DATA' | 'ACCESS_BLOCKED';

export interface AudienceSegment {
  label: string;
  noticias: Noticia[];
  reason: string;
  confidence: 'HEURISTIC' | 'INSUFFICIENT_DATA' | 'NO_DATA';
  evidence: string[];
  limitations: string[];
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
  const insufficient: Noticia[] = [];

  const thresholds = {
    viralViews: 200,
    viralAge: 7,
    buildViews: 50,
    recommendQuality: 80,
    recommendAge: 60,
    reviewViews: 20,
    reviewAge: 30,
  };

  for (const n of noticias) {
    const age = daysSince(n.fechaActualizacion || n.fechaPublicacion || n.fecha);
    const hasViews = typeof n.vistas === 'number';
    const hasQuality = typeof n.scoreMeni === 'number';

    if (!hasViews || Number.isNaN(age)) {
      insufficient.push(n);
      continue;
    }

    const views = n.vistas as number;
    const quality = n.scoreMeni;
    const evergreenish = /cómo|qué es|guía|pasos|requisitos|costo|salario|dólar|calendario|clima/i.test(
      `${n.titulo} ${n.resumen}`
    );

    if (views > thresholds.viralViews && age <= thresholds.viralAge) {
      viral.push(n);
    } else if (views >= thresholds.buildViews && (evergreenish || (hasQuality && (quality as number) >= 90))) {
      build.push(n);
    } else if (hasQuality && (quality as number) >= thresholds.recommendQuality && age <= thresholds.recommendAge) {
      recommend.push(n);
    } else if (views < thresholds.reviewViews && age > thresholds.reviewAge) {
      review.push(n);
    }
  }

  const limitation = 'Segmentación basada en umbrales editoriales (vistas, edad, scoreMeni, palabras clave evergreen). No es aprendizaje histórico.';

  return [
    {
      label: 'Contenido que construye audiencia',
      noticias: build.slice(0, 10),
      reason: `Temas recurrentes o evergreen con ≥${thresholds.buildViews} vistas.`,
      confidence: 'HEURISTIC',
      evidence: [`N=${build.length} artículos con ≥${thresholds.buildViews} vistas.`],
      limitations: [limitation],
    },
    {
      label: 'Contenido viral',
      noticias: viral.slice(0, 10),
      reason: `Pico reciente (>${thresholds.viralViews} vistas en ≤${thresholds.viralAge} días).`,
      confidence: 'HEURISTIC',
      evidence: [`N=${viral.length} artículos con pico reciente.`],
      limitations: [limitation],
    },
    {
      label: 'Contenido recomendado',
      noticias: recommend.slice(0, 10),
      reason: `Noticias con scoreMeni ≥${thresholds.recommendQuality} y ≤${thresholds.recommendAge} días.`,
      confidence: 'HEURISTIC',
      evidence: [`N=${recommend.length} artículos con calidad y reciente.`],
      limitations: [limitation],
    },
    {
      label: 'Contenido a revisar',
      noticias: review.slice(0, 10),
      reason: `<${thresholds.reviewViews} vistas y >${thresholds.reviewAge} días.`,
      confidence: 'HEURISTIC',
      evidence: [`N=${review.length} artículos con poco tráfico y antiguos.`],
      limitations: [limitation],
    },
    {
      label: 'Datos insuficientes',
      noticias: insufficient.slice(0, 10),
      reason: 'Faltan vistas, scoreMeni o fecha para evaluar.',
      confidence: 'INSUFFICIENT_DATA',
      evidence: [`N=${insufficient.length} artículos sin datos completos.`],
      limitations: ['No se pueden generar segmentos sin vistas o fecha.'],
    },
  ];
}

export interface CategoryHabit {
  count: number;
  withViews: number;
  missingViews: number;
  avgViews: number;
  dataStatus: DataProvenance;
}

export function categoryHabitMetrics(noticias: Noticia[]): Record<string, CategoryHabit> {
  const map: Record<string, number[]> = {};
  const missing: Record<string, number> = {};

  for (const n of noticias) {
    map[n.categoria] = map[n.categoria] || [];
    missing[n.categoria] = missing[n.categoria] || 0;
    if (typeof n.vistas === 'number') {
      map[n.categoria].push(n.vistas);
    } else {
      missing[n.categoria] += 1;
    }
  }

  const result: Record<string, CategoryHabit> = {};
  Object.entries(map).forEach(([c, views]) => {
    const missingViews = missing[c] || 0;
    const withViews = views.length;
    const avg = withViews > 0 ? Math.round(views.reduce((a, b) => a + b, 0) / withViews) : 0;
    result[c] = {
      count: withViews + missingViews,
      withViews,
      missingViews,
      avgViews: avg,
      dataStatus: withViews > 0 ? 'DERIVED_DATA' : 'NO_DATA',
    };
  });
  return result;
}
