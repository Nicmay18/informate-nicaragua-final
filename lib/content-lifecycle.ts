import type { Noticia } from '@/lib/types';

export type LifecycleStage = 'nuevo' | 'creciendo' | 'estable' | 'actualizar' | 'evergreen';

export interface LifecycleProfile {
  stage: LifecycleStage;
  reason: string;
  evergreenPotential: boolean;
  explainerPotential: boolean;
  updateRecommended: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

function ageInDays(noticia: Noticia): number {
  const date = new Date(noticia.fechaActualizacion || noticia.fechaPublicacion || noticia.fecha);
  if (Number.isNaN(date.getTime())) return 0;
  return (Date.now() - date.getTime()) / DAY;
}

export function classifyContentLifecycle(noticia: Noticia, viewsWindow7 = 0): LifecycleProfile {
  const age = ageInDays(noticia);
  const views = noticia.vistas ?? 0;
  const quality = noticia.scoreCalidad ?? 70;
  const evergreenKeywords = ['guía', 'cómo', 'pasos', 'requisitos', 'costo', 'salario', 'dólar', 'clima', 'calendario', 'pasaporte', 'apostilla', 'record policial'];

  // Calidad alta acelera la clasificación de estable/evergreen.
  const qualityBoost = quality >= 90 ? 0.25 : 0;
  const text = `${noticia.titulo} ${noticia.resumen} ${noticia.contenido || ''}`.toLowerCase();
  const isEvergreenTopic = evergreenKeywords.some((k) => text.includes(k));

  let stage: LifecycleStage = 'nuevo';
  let reason = '';

  if (age <= 1) {
    stage = 'nuevo';
    reason = 'Publicado en las últimas 24 horas.';
  } else if (age <= 7 && viewsWindow7 > 20) {
    stage = 'creciendo';
    reason = 'Tráfico creciente en la primera semana.';
  } else if (age <= 60 && views >= 100) {
    stage = 'estable';
    reason = 'Audiencia sostenida en el tiempo.';
  } else if (age > 180 && views < 30) {
    stage = 'actualizar';
    reason = 'Contenido antiguo con poco tráfico; conviene actualizarlo.';
  }

  if (isEvergreenTopic && views >= 80) {
    stage = 'evergreen';
    reason = 'Tema de consulta permanente con tráfico recurrente.';
  }

  const evergreenPotential = isEvergreenTopic || (views >= 150 * (1 - qualityBoost) && age > 30);
  const explainerPotential = text.includes('qué es') || text.includes('cómo') || text.includes('por qué') || text.includes('significa');
  const updateRecommended = stage === 'actualizar' || (age > 90 && !isEvergreenTopic);

  return { stage, reason, evergreenPotential, explainerPotential, updateRecommended };
}

export function findConversionOpportunities(noticias: Noticia[]): Array<{ noticia: Noticia; to: 'guia' | 'explicador' }> {
  return noticias
    .map((n) => ({ n, profile: classifyContentLifecycle(n) }))
    .filter(({ profile }) => profile.evergreenPotential || profile.explainerPotential)
    .map(({ n, profile }) => ({
      noticia: n,
      to: profile.evergreenPotential ? 'guia' : 'explicador',
    }));
}
