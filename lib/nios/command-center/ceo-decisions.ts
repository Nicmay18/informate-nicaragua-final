import type {
  BusinessHealth,
  CeoDecision,
  DistributionCommand,
  EditorialBalance,
  GoogleTrust,
  HomeQuality,
  OpportunityHunter,
  RevenueEngine,
} from './types';

interface DecisionInput {
  balance: EditorialBalance;
  trust: GoogleTrust;
  revenue: RevenueEngine;
  home: HomeQuality;
  distribution: DistributionCommand;
  hunter: OpportunityHunter;
  business: BusinessHealth;
}

/**
 * Reduce todo el diagnóstico del sistema a un máximo de 5 decisiones:
 * exactamente una por eje. Si un eje no tiene nada urgente, se omite.
 */
export function buildCeoDecisions(input: DecisionInput): CeoDecision[] {
  const { balance, trust, revenue, home, distribution, hunter, business } = input;
  const decisions: CeoDecision[] = [];

  /* 🔥 Acción inmediata — la nota que hay que mover hoy */
  const topPlan = distribution.plans[0];
  if (topPlan) {
    decisions.push({
      id: 'ceo-immediate',
      kind: 'inmediata',
      icon: '🔥',
      headline: `Promocionar "${topPlan.title}"`,
      detail: `Distribuir en los 5 canales con textos adaptados. ${topPlan.category} es la pieza con mayor retorno hoy.`,
      why: topPlan.reason,
      action: 'Abrir Distribution Command y publicar los textos por canal',
      href: `/noticias/${topPlan.slug}`,
      severity: 'critica',
      source: 'Distribution Command',
    });
  }

  /* 📈 Crecimiento — la categoría que sostiene el crecimiento */
  const deficit = balance.categories
    .filter((c) => c.status === 'deficitario')
    .sort((a, b) => a.deviation - b.deviation)[0];
  if (deficit) {
    decisions.push({
      id: 'ceo-growth',
      kind: 'crecimiento',
      icon: '📈',
      headline: `Crear contenido de ${deficit.category}`,
      detail: `Está en ${deficit.share}% cuando el plan editorial exige ${deficit.target}%. Es la brecha más grande del mes.`,
      why: deficit.verdict,
      action: `Programar 2 piezas de ${deficit.category} esta semana`,
      severity: 'alta',
      source: 'Editorial Balance Engine',
    });
  } else {
    const weakestTrust = [...trust.pillars].sort((a, b) => a.score - b.score)[0];
    decisions.push({
      id: 'ceo-growth',
      kind: 'crecimiento',
      icon: '📈',
      headline: `Reforzar ${weakestTrust.label.toLowerCase()}`,
      detail: weakestTrust.weakness,
      why: `Es el pilar más débil del Trust Score (${weakestTrust.score}/100).`,
      action: weakestTrust.nextAction,
      severity: 'media',
      source: 'Google Trust Score',
    });
  }

  /* 💰 Negocio — la oportunidad comercial más lista para vender */
  const bestRevenue = revenue.opportunities.find((o) => o.effort === 'bajo') || revenue.opportunities[0];
  if (bestRevenue) {
    decisions.push({
      id: 'ceo-business',
      kind: 'negocio',
      icon: '💰',
      headline: bestRevenue.title,
      detail: `${bestRevenue.rationale} Anunciantes naturales: ${bestRevenue.advertisers.slice(0, 3).join(', ')}.`,
      why: `Preparación comercial ${bestRevenue.readiness}/100 con esfuerzo ${bestRevenue.effort}.`,
      action: bestRevenue.nextStep,
      severity: bestRevenue.potential === 'alto' ? 'alta' : 'media',
      source: 'Revenue Engine',
    });
  }

  /* 🔎 Google — el problema de confianza que más pesa */
  const uncoveredHigh = hunter.items.find((i) => !i.covered && i.commercialValue === 'alto');
  if (trust.score < 70 && trust.googleSees.nextActions.length > 0) {
    const weakest = [...trust.pillars].sort((a, b) => a.score * a.weight - b.score * b.weight)[0];
    decisions.push({
      id: 'ceo-google',
      kind: 'google',
      icon: '🔎',
      headline: `Corregir ${weakest.label.toLowerCase()} ante Google`,
      detail: weakest.weakness,
      why: `Trust Score global ${trust.score}/100 (${trust.level}). Este pilar es el que más arrastra.`,
      action: weakest.nextAction,
      severity: trust.score < 50 ? 'critica' : 'alta',
      source: 'Google Trust Score',
    });
  } else if (uncoveredHigh) {
    decisions.push({
      id: 'ceo-google',
      kind: 'google',
      icon: '🔎',
      headline: `Cubrir "${uncoveredHigh.topic}"`,
      detail: uncoveredHigh.rationale,
      why: 'Demanda de búsqueda permanente sin cobertura y con valor comercial alto.',
      action: uncoveredHigh.action,
      severity: 'alta',
      source: 'Content Opportunity Hunter',
    });
  }

  /* ⚠️ Riesgo — lo que está erosionando la marca */
  const excess = balance.categories
    .filter((c) => c.status === 'excedido')
    .sort((a, b) => b.deviation - a.deviation)[0];
  if (excess) {
    decisions.push({
      id: 'ceo-risk',
      kind: 'riesgo',
      icon: '⚠️',
      headline: `Evitar saturación de ${excess.category}`,
      detail:
        excess.category === 'Sucesos'
          ? `Sucesos genera tráfico pero domina demasiado la identidad editorial: ${excess.share}% del volumen.`
          : `${excess.category} ocupa ${excess.share}% del volumen frente a un objetivo de ${excess.target}%.`,
      why: `Identidad editorial en ${balance.identityScore}/100. ${home.verdict}`,
      action: `Congelar publicaciones de ${excess.category} hasta recuperar el equilibrio`,
      severity: 'alta',
      source: 'Editorial Balance Engine',
    });
  } else if (home.violations.length > 0) {
    decisions.push({
      id: 'ceo-risk',
      kind: 'riesgo',
      icon: '⚠️',
      headline: 'Corregir la portada',
      detail: home.violations[0],
      why: `Home Quality ${home.score}/100. ${home.verdict}`,
      action: 'Reordenar la vitrina de marca en las primeras 6 posiciones',
      severity: home.score < 55 ? 'alta' : 'media',
      source: 'Home Quality Control',
    });
  } else if (business.score < 50) {
    decisions.push({
      id: 'ceo-risk',
      kind: 'riesgo',
      icon: '⚠️',
      headline: 'El negocio no despega',
      detail: business.verdict,
      why: `Business Health ${business.score}/100 — etapa "${business.stage}".`,
      action: business.nextMilestone,
      severity: 'alta',
      source: 'Business Health',
    });
  }

  const order: Record<CeoDecision['severity'], number> = { critica: 0, alta: 1, media: 2, baja: 3 };
  return decisions.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
}
