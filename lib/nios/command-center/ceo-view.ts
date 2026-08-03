/**
 * NIOS CEO View — Transforma el Business Command Center en un sistema operativo CEO.
 * No crea motores. Solo lee y traduce lo que ya existe a decisiones de una sola pantalla.
 */

import type {
  BusinessCommandCenter,
  CeoBriefing,
  CeoCard,
  CeoChecklistItem,
  MediaHealth,
  NiosCeoView,
} from './types';

const HEALTH_WEIGHTS: Record<string, number> = {
  google: 0.30,
  editorial: 0.25,
  authority: 0.15,
  home: 0.10,
  seo: 0.10,
  distribution: 0.05,
  business: 0.05,
};

function statusColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 55) return 'yellow';
  return 'red';
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildMediaHealth(cc: BusinessCommandCenter): MediaHealth {
  const google = clampScore(cc.trust.score);
  const editorial = clampScore(cc.balance.identityScore);
  const authority = clampScore(cc.authority.score);
  const home = clampScore(cc.home.score);
  const seo = clampScore((cc.trust.pillars.find((p) => p.id === 'experience')?.score || 0));
  const distribution = clampScore(cc.distribution.pending > 0 ? 80 : 50);
  const business = clampScore(cc.business.score);

  const pillars = [
    { id: 'google', label: 'Google', score: google, weight: HEALTH_WEIGHTS.google, status: statusColor(google) },
    { id: 'editorial', label: 'Contenido', score: editorial, weight: HEALTH_WEIGHTS.editorial, status: statusColor(editorial) },
    { id: 'authority', label: 'Autoridad', score: authority, weight: HEALTH_WEIGHTS.authority, status: statusColor(authority) },
    { id: 'home', label: 'Home', score: home, weight: HEALTH_WEIGHTS.home, status: statusColor(home) },
    { id: 'seo', label: 'SEO', score: seo, weight: HEALTH_WEIGHTS.seo, status: statusColor(seo) },
    { id: 'distribution', label: 'Distribución', score: distribution, weight: HEALTH_WEIGHTS.distribution, status: statusColor(distribution) },
    { id: 'business', label: 'Negocio', score: business, weight: HEALTH_WEIGHTS.business, status: statusColor(business) },
  ];

  const score = clampScore(pillars.reduce((s, p) => s + p.score * p.weight, 0));
  let level: MediaHealth['level'] = 'deficiente';
  if (score >= 85) level = 'excelente';
  else if (score >= 70) level = 'buena';
  else if (score >= 55) level = 'regular';

  return { score, level, pillars };
}

export function buildCeoBriefing(cc: BusinessCommandCenter): CeoBriefing {
  const health = buildMediaHealth(cc);
  const state = health.score >= 80
    ? 'en excelente estado'
    : health.score >= 60
      ? 'en condición estable'
      : 'con riesgos que requieren atención';

  const yesterday = [...cc.distribution.plans].sort(
    (a, b) => (cc.distribution.plans.indexOf(a) - cc.distribution.plans.indexOf(b))
  )[0];

  const biggestRisk = cc.home.violations[0]
    || cc.balance.alerts[0]
    || cc.business.nextMilestone
    || 'No se detectaron riesgos críticos hoy.';

  const bestUncovered = cc.hunter.items.find((i) => !i.covered && i.commercialValue === 'alto');
  const biggestOpportunity = bestUncovered
    ? `La guía sobre "${bestUncovered.topic}" responde demanda de búsqueda permanente sin cobertura.`
    : (cc.revenue.opportunities[0]?.nextStep
      || 'Fortalecer la autoridad editorial con más cobertura permanente.');

  const absolutePriority = cc.decisions[0]
    ? cc.decisions[0].headline
    : 'Mantener el ritmo de publicación.';

  return {
    greeting: 'Buenos días.',
    state: `El medio se encuentra ${state}.`,
    bestYesterday: yesterday?.title,
    biggestRisk,
    biggestOpportunity,
    absolutePriority,
  };
}

export function buildCeoCards(cc: BusinessCommandCenter): CeoCard[] {
  const cards: CeoCard[] = [];

  // 🔥 REPARAR
  const homeViolation = cc.home.violations[0];
  const brokenTrust = cc.trust.pillars.filter((p) => p.score < 50)[0];
  if (homeViolation) {
    cards.push({
      kind: 'reparar',
      headline: 'Corregir la portada',
      what: 'Reordenar la vitrina de marca para que los primeros slots representen la identidad editorial.',
      why: homeViolation,
      ifNot: 'Un lector nuevo percibirá al medio como un tabloide de sucesos y no volverá.',
      action: 'Abrir /admin/portada y reposicionar noticias de marca.',
      source: 'Home Quality Control',
      severity: cc.home.score < 55 ? 'critica' : 'alta',
    });
  } else if (brokenTrust) {
    cards.push({
      kind: 'reparar',
      headline: `Reparar ${brokenTrust.label}`,
      what: brokenTrust.nextAction,
      why: brokenTrust.weakness,
      ifNot: 'Google seguirá viendo al medio como una fuente débil y limitará descubrimiento.',
      action: brokenTrust.nextAction,
      source: 'Google Trust Score',
      severity: 'alta',
    });
  } else {
    cards.push({
      kind: 'reparar',
      headline: 'Sin errores críticos',
      what: 'No se detectaron fallas que frenen el crecimiento hoy.',
      why: 'La portada, el SEO y la autoridad están dentro de rangos aceptables.',
      ifNot: '—',
      action: 'Mantener la disciplina actual.',
      source: 'Command Center',
      severity: 'baja',
    });
  }

  // 📈 CRECER
  const deficit = cc.balance.categories.filter((c) => c.status === 'deficitario')[0];
  if (deficit) {
    cards.push({
      kind: 'crecer',
      headline: `Publicar ${deficit.category}`,
      what: `Programar una pieza de ${deficit.category} hoy.`,
      why: deficit.verdict,
      ifNot: 'La mezcla editorial seguirá desbalanceada y Google marcará el medio como no especializado.',
      action: `Usar MENI para redactar una nota de ${deficit.category}.`,
      source: 'Editorial Balance Engine',
      severity: 'alta',
    });
  } else {
    const slot = cc.warRoom.slots[0];
    cards.push({
      kind: 'crecer',
      headline: `Publicar ${slot.category}`,
      what: `${slot.format}: ${slot.brief}`,
      why: slot.reason,
      ifNot: 'Se perderá el día sin reforzar una categoría de marca.',
      action: slot.conditional || `Preparar pieza de ${slot.category}.`,
      source: 'Content War Room',
      severity: slot.priority,
    });
  }

  // 🚀 GOOGLE
  const weakestPillar = [...cc.trust.pillars].sort((a, b) => a.score * a.weight - b.score * b.weight)[0];
  const uncovered = cc.hunter.items.find((i) => !i.covered && i.commercialValue === 'alto');
  if (uncovered) {
    cards.push({
      kind: 'google',
      headline: `Crear guía "${uncovered.topic}"`,
      what: uncovered.action,
      why: uncovered.rationale,
      ifNot: 'La audiencia seguirá buscando en TN8 o Confidencial lo que este medio no responde.',
      action: `Crear guía evergreen sobre ${uncovered.topic}.`,
      source: 'Content Opportunity Hunter',
      severity: 'alta',
    });
  } else {
    cards.push({
      kind: 'google',
      headline: `Reforzar ${weakestPillar.label}`,
      what: weakestPillar.nextAction,
      why: weakestPillar.weakness,
      ifNot: 'El Trust Score estancará y las piezas actuales no ascenderán en búsqueda.',
      action: weakestPillar.nextAction,
      source: 'Google Trust Score',
      severity: weakestPillar.score < 60 ? 'alta' : 'media',
    });
  }

  // 💰 NEGOCIO
  const business = cc.revenue.opportunities[0];
  if (business) {
    cards.push({
      kind: 'negocio',
      headline: business.title,
      what: business.nextStep,
      why: business.rationale,
      ifNot: 'El medio seguirá sin activos comerciales sostenibles para patrocinio.',
      action: business.nextStep,
      source: 'Revenue Engine',
      severity: business.potential === 'alto' ? 'alta' : 'media',
    });
  } else {
    cards.push({
      kind: 'negocio',
      headline: 'Construir autoridad de categoría',
      what: 'Publicar 3 notas base y 1 guía ancla en una categoría comercial.',
      why: cc.business.verdict,
      ifNot: 'No habrá inventario suficiente para iniciar conversaciones comerciales.',
      action: cc.business.nextMilestone,
      source: 'Business Health',
      severity: cc.business.score < 50 ? 'alta' : 'media',
    });
  }

  // ⭐ MARCA
  const topPlan = cc.distribution.plans[0];
  if (topPlan) {
    cards.push({
      kind: 'marca',
      headline: `Distribuir "${topPlan.title}"`,
      what: 'Publicar copias adaptadas en Telegram, Facebook, WhatsApp y Newsletter.',
      why: topPlan.reason,
      ifNot: 'La noticia con mayor potencial de marca no alcanzará a la audiencia hoy.',
      action: 'Abrir Distribution Command y publicar los textos por canal.',
      source: 'Distribution Command',
      severity: topPlan.priority,
    });
  } else {
    cards.push({
      kind: 'marca',
      headline: 'Impulsar una noticia al Home',
      what: 'Seleccionar la mejor nota del día y colocarla en el primer slot.',
      why: 'La portada es el mensaje principal del medio para un lector nuevo.',
      ifNot: 'El tráfico de retorno seguirá dependiendo de canales externos.',
      action: 'Abrir /admin/portada y mover la mejor pieza al top.',
      source: 'Home Quality Control',
      severity: 'media',
    });
  }

  const severityOrder: Record<CeoCard['severity'], number> = { critica: 0, alta: 1, media: 2, baja: 3 };
  return cards.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function buildCeoChecklist(cards: CeoCard[]): CeoChecklistItem[] {
  return cards.map((c) => ({
    id: `ceo-${c.kind}-${c.headline}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80),
    label: c.headline,
    source: c.source,
    completed: false,
  }));
}

export function buildCeoView(
  cc: BusinessCommandCenter,
  pendingCount = 0,
): NiosCeoView {
  const briefing = buildCeoBriefing(cc);
  const mediaHealth = buildMediaHealth(cc);
  const cards = buildCeoCards(cc);
  const checklist = buildCeoChecklist(cards);

  const memoryMessage = pendingCount > 0
    ? `Hay ${pendingCount} tarea${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'} de días anteriores.`
    : 'Todas las tareas recientes están completadas.';

  return {
    briefing,
    mediaHealth,
    cards,
    checklist,
    memory: { pending: pendingCount, message: memoryMessage },
  };
}
