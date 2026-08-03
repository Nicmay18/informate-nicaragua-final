import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import type {
  BusinessHealth,
  BusinessPillar,
  EditorialBalance,
  GoogleTrust,
  RevenueEngine,
} from './types';

const DAY = 24 * 60 * 60 * 1000;

function toTime(v: unknown): number {
  if (v instanceof Date) return isNaN(v.getTime()) ? Date.now() : v.getTime();
  if (typeof v === 'string' && v.trim()) {
    const t = new Date(v).getTime();
    return isNaN(t) ? Date.now() : t;
  }
  return Date.now();
}

/**
 * Responde una sola pregunta: ¿qué tan empresa editorial es Nicaragua
 * Informate hoy? Consolida contenido, audiencia, Google, ingresos y marca.
 */
export function buildBusinessHealth(
  noticias: Noticia[],
  guides: EvergreenArticle[],
  balance: EditorialBalance,
  trust: GoogleTrust,
  revenue: RevenueEngine,
  now = Date.now()
): BusinessHealth {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const total = published.length;

  const last30 = published.filter((n) => toTime(n.fecha) > now - 30 * DAY);
  const views30 = last30.reduce((s, n) => s + (n.vistas || 0), 0);
  const avgViews = last30.length ? Math.round(views30 / last30.length) : 0;

  const cadence = Math.min(100, Math.round((last30.length / 60) * 100));
  const depth = total ? Math.round((published.filter((n) => (n.palabras || 0) >= 400).length / total) * 100) : 0;
  const contentScore = Math.round(cadence * 0.5 + depth * 0.3 + Math.min(100, guides.length * 6) * 0.2);

  const audienceScore = Math.min(100, Math.round(avgViews * 1.2));

  const revenueScore = Math.min(
    100,
    Math.round(revenue.commercialShare * 2 + (revenue.opportunities.filter((o) => o.effort === 'bajo').length * 8))
  );

  const brandScore = Math.round(balance.identityScore * 0.6 + Math.min(100, guides.length * 7) * 0.4);

  const pillars: BusinessPillar[] = [
    {
      id: 'content',
      label: 'Contenido',
      score: contentScore,
      weight: 1.2,
      reading: `${last30.length} publicaciones en 30 días · ${guides.length} guías permanentes.`,
    },
    {
      id: 'audience',
      label: 'Audiencia',
      score: audienceScore,
      weight: 1,
      reading: `${views30} vistas en 30 días · promedio de ${avgViews} por nota.`,
    },
    {
      id: 'google',
      label: 'Google',
      score: trust.score,
      weight: 1.3,
      reading: `Trust Score ${trust.score}/100 — confianza ${trust.level}.`,
    },
    {
      id: 'revenue',
      label: 'Ingresos potenciales',
      score: revenueScore,
      weight: 1.1,
      reading: `${revenue.commercialShare}% del archivo es inventario comercial.`,
    },
    {
      id: 'brand',
      label: 'Marca',
      score: brandScore,
      weight: 1,
      reading: `Identidad editorial ${balance.identityScore}/100${balance.dominant ? ` · dominada por ${balance.dominant}` : ''}.`,
    },
  ];

  const weightSum = pillars.reduce((s, p) => s + p.weight, 0);
  const score = Math.round(pillars.reduce((s, p) => s + p.score * p.weight, 0) / weightSum);

  let stage: BusinessHealth['stage'];
  let verdict: string;
  let nextMilestone: string;

  const weakest = [...pillars].sort((a, b) => a.score - b.score)[0];

  if (score >= 75) {
    stage = 'empresa editorial';
    verdict = 'Nicaragua Informate opera como una empresa editorial: produce, es reconocida y tiene inventario vendible.';
    nextMilestone = 'Formalizar tarifario y cerrar el primer patrocinio anual.';
  } else if (score >= 55) {
    stage = 'medio consolidado';
    verdict = 'El medio es consistente y confiable, pero todavía no convierte audiencia en ingresos.';
    nextMilestone = `Elevar "${weakest.label}" por encima de 60 para desbloquear la etapa de empresa.`;
  } else if (score >= 35) {
    stage = 'medio en crecimiento';
    verdict = 'Hay producción constante, pero la marca y el negocio aún no están construidos.';
    nextMilestone = `Priorizar "${weakest.label}": es el cuello de botella del negocio.`;
  } else {
    stage = 'proyecto';
    verdict = 'Nicaragua Informate todavía funciona como proyecto de publicación, no como empresa.';
    nextMilestone = `Estabilizar "${weakest.label}" antes de invertir en cualquier otra área.`;
  }

  return { score, stage, pillars, verdict, nextMilestone };
}
