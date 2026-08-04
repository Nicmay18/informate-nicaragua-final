/**
 * NIOS CEO View — Transforma el Business Command Center en un sistema operativo CEO.
 * No crea motores. Solo lee y traduce lo que ya existe a decisiones de una sola pantalla.
 */

import { CATEGORIES } from '@/lib/types';
import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import type {
  BusinessCommandCenter,
  CeoBriefing,
  CeoCard,
  CeoChecklistItem,
  EditorJefeView,
  GoogleTrust,
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
  let level: MediaHealth['level'] = 'critico';
  if (score >= 90) level = 'excelente';
  else if (score >= 75) level = 'saludable';
  else if (score >= 60) level = 'observacion';
  else if (score >= 45) level = 'comprometido';
  else if (score >= 30) level = 'grave';

  const weakest = [...pillars].sort((a, b) => a.score - b.score)[0];
  const diagnostico = score >= 90
    ? `El medio opera en condiciones óptimas. Todos los pilares están en verde. El punto más bajo es ${weakest.label} (${weakest.score}/100), dentro de rango saludable.`
    : score >= 75
      ? `El medio está saludable. El pilar más débil es ${weakest.label} (${weakest.score}/100). No hay riesgos críticos, pero conviene reforzar ese eje.`
      : score >= 60
        ? `El medio está en observación. ${weakest.label} (${weakest.score}/100) es el cuello de botella. Si no se atiende, puede degradar la salud general.`
        : score >= 45
          ? `El medio está comprometido. ${weakest.label} (${weakest.score}/100) arrastra el sistema. Se requiere intervención directa en este eje.`
          : score >= 30
            ? `El medio está en estado grave. ${weakest.label} (${weakest.score}/100) está fallando. Sin corrección urgente, el medio no puede operar como empresa.`
            : `El medio está en estado crítico. Múltiples pilares fallan simultáneamente. Se requiere intervención inmediata.`;

  return { score, level, pillars, diagnostico };
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

const DAY_MS = 24 * 60 * 60 * 1000;

function publishedNoticias(noticias: Noticia[]): Noticia[] {
  return noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
}

function parsePubTime(n: Noticia): number {
  return new Date(n.fechaPublicacion || n.fecha).getTime() || 0;
}

function lastUpdateTime(n: Noticia): number {
  return new Date(n.fechaActualizacion || n.fechaPublicacion || n.fecha).getTime() || 0;
}

function findNoticiaForGuide(
  noticias: Noticia[],
  topic: string,
  category?: string,
): Noticia | undefined {
  const t = topic.toLowerCase();
  const matches = noticias.filter((n) => {
    const hay = `${n.titulo} ${n.resumen} ${n.keywords || ''} ${(n.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(t) || (category && n.categoria.toLowerCase() === category.toLowerCase());
  });
  matches.sort((a, b) => parsePubTime(b) - parsePubTime(a));
  return matches[0] || noticias[0];
}

export function buildEditorJefeView(
  cc: BusinessCommandCenter,
  noticias: Noticia[],
  guides: EvergreenArticle[],
  now: Date,
): EditorJefeView {
  const mediaHealth = buildMediaHealth(cc);
  const nowTs = now.getTime();

  // 1. Salud del medio
  const saludMap: Record<MediaHealth['level'], EditorJefeView['salud']['estado']> = {
    excelente: 'Excelente',
    saludable: 'Saludable',
    observacion: 'En observación',
    comprometido: 'Comprometido',
    grave: 'Grave',
    critico: 'Crítico',
  };
  const salud: EditorJefeView['salud'] = {
    estado: saludMap[mediaHealth.level],
    explicacion: mediaHealth.diagnostico,
  };

  // 2. Máximo cinco prioridades
  const cards = buildCeoCards(cc);
  const prioridades = cards.slice(0, 5).map((c) => ({
    label: c.headline,
    action: c.action,
    source: c.source,
    severity: c.severity,
  }));

  // 3. Qué NO publicar hoy
  const excedidas = cc.balance.categories.filter((c) => c.status === 'excedido').sort((a, b) => b.share - a.share);
  const noPublicar: EditorJefeView['noPublicar'] = (() => {
    const culpable = excedidas[0] || cc.balance.categories.sort((a, b) => b.share - a.share)[0];
    const alternativa = cc.balance.categories.find((c) => c.status === 'deficitario') || cc.balance.categories.sort((a, b) => a.share - b.share)[0];
    if (!culpable || !alternativa) {
      return {
        razon: 'Hoy no hay una categoría claramente saturada. Mantén la mezcla editorial equilibrada.',
        compensar: 'Sigue el plan de contenido del día.',
      };
    }
    return {
      razon: `Hoy ${culpable.category} representa ${Math.round(culpable.share)}% del archivo y del Home. No publiques otro ${culpable.category}; ya dominas el día.`,
      compensar: `Publica ${alternativa.category}. El medio necesita más ${alternativa.category} para no verse como un tabloide de ${culpable.category.toLowerCase()}.`,
    };
  })();

  // 4. Oportunidad perdida
  const oportunidadPerdida: EditorJefeView['oportunidadPerdida'] = (() => {
    const topCoveredGap = cc.hunter.items.find((i) => !i.covered && i.commercialValue === 'alto');
    const anyGap = topCoveredGap || cc.hunter.items.find((i) => !i.covered);
    const overCategory = excedidas[0];
    if (overCategory) {
      const p = publishedNoticias(noticias).filter((n) => n.categoria === overCategory.category);
      const guideExists = guides.some((g) => g.title.toLowerCase().includes(overCategory.category.toLowerCase()));
      if (p.length >= 3 && !guideExists) {
        return {
          titulo: `Has publicado ${p.length} notas de ${overCategory.category}, pero no existe la guía definitiva.`,
          explicacion: `La categoría con exceso hoy es la prueba de que hay interés sostenido. Sin embargo, nunca convertiste ese interés en un activo permanente.`,
          accion: `Crea una guía ancla sobre el tema más repetido en ${overCategory.category} y enlázala desde esas ${p.length} notas.`,
        };
      }
    }
    if (anyGap) {
      const p = publishedNoticias(noticias).filter((n) => {
        const hay = `${n.titulo} ${n.resumen} ${n.keywords || ''}`.toLowerCase();
        return hay.includes(anyGap.topic.toLowerCase());
      });
      return {
        titulo: `Has hablado de "${anyGap.topic}" ${p.length || 'varias'} veces y nunca existe la guía definitiva.`,
        explicacion: anyGap.rationale,
        accion: anyGap.action,
      };
    }
    return {
      titulo: 'No se detecta una oportunidad obvia hoy.',
      explicacion: 'El archivo cubre bien la demanda conocida. El siguiente paso es ampliar categorías deficitarias.',
      accion: 'Revisar la guía comercial del próximo trimestre.',
    };
  })();

  // 5. Veredicto de Google
  const googleProblemas = [
    ...cc.trust.googleSees.weaknesses,
    ...cc.home.violations,
    ...cc.balance.alerts,
  ].slice(0, 4);
  const googleFortalezas = cc.trust.googleSees.strengths.slice(0, 2);
  const googleMap: Record<GoogleTrust['level'], string> = {
    sólido: 've autoridad clara',
    'en construcción': 've un medio en construcción',
    frágil: 'no ve suficiente autoridad',
  };
  const googleVeredicto: EditorJefeView['googleVeredicto'] = {
    conclusion: `Google ${googleMap[cc.trust.level]}. ${cc.trust.googleSees.nextActions[0] || 'Mantener la disciplina actual.'}`,
    problemas: googleProblemas.length > 0 ? googleProblemas : ['No se detectan problemas críticos hoy.'],
    fortalezas: googleFortalezas.length > 0 ? googleFortalezas : ['El medio mantiene señales de autoridad.'],
  };

  // 6. Simulación de anunciantes
  const anuncianteBrands = ['Claro', 'Banco LAFISE', 'Universidad'];
  const anuncianteKeywords: Record<string, string[]> = {
    Claro: ['tecnología', 'telecom', 'móvil', 'internet', 'datos'],
    'Banco LAFISE': ['negocios', 'finanzas', 'economía', 'empresas', 'banca'],
    Universidad: ['educación', 'salud', 'empleo', 'universidad', 'formación'],
  };
  const simulaciones: EditorJefeView['anunciante']['simulaciones'] = anuncianteBrands.map((marca) => {
    const keywords = anuncianteKeywords[marca];
    const match = cc.revenue.opportunities.find((o) => keywords.some((k) => o.category.toLowerCase().includes(k))) || cc.revenue.opportunities[0];
    const fallbackCategory = cc.balance.categories.find((c) => c.status === 'deficitario')?.category || cc.balance.categories[0]?.category || 'Nacionales';
    const category = match?.category || fallbackCategory;
    const patrocinio = match?.nextStep || `Patrocinar la sección ${category}`;
    const explicacion = match?.rationale
      ? `Si hoy entrara ${marca}, pagaría por estar en ${category}: ${match.rationale}`
      : `Si hoy entrara ${marca}, pagaría por estar en ${category} porque es un espacio de marca con demanda sin vender.`;
    return { marca, categoria: category, patrocinio, explicacion };
  });

  // 7. Nota que merece convertirse en guía
  const noticiaAGuia: EditorJefeView['noticiaAGuia'] = (() => {
    const topGap = cc.hunter.items.find((i) => !i.covered && i.commercialValue === 'alto') || cc.hunter.items.find((i) => !i.covered);
    const n = topGap
      ? findNoticiaForGuide(publishedNoticias(noticias), topGap.topic, excedidas[0]?.category)
      : publishedNoticias(noticias)[0];
    if (!n) {
      return { titulo: 'No hay noticias publicadas', slug: '', explicacion: 'El archivo está vacío. Publica la primera pieza para empezar a construir guías.' };
    }
    return {
      titulo: n.titulo,
      slug: n.slug,
      explicacion: `Esta noticia de ${n.categoria} tiene el tema y la profundidad para convertirse en la guía permanente que el medio no tiene. Actualizarla a evergreen generaría autoridad sostenida.`,
    };
  })();

  // 8. Categoría abandonada
  const categoriaAbandonada: EditorJefeView['categoriaAbandonada'] = (() => {
    const allCategoryNames = CATEGORIES.map((c) => c.name);
    const stats = allCategoryNames.map((cat) => {
      const pub = publishedNoticias(noticias);
      const c7 = pub.filter((n) => n.categoria === cat && nowTs - parsePubTime(n) <= 7 * DAY_MS).length;
      const c30 = pub.filter((n) => n.categoria === cat && nowTs - parsePubTime(n) <= 30 * DAY_MS).length;
      const c90 = pub.filter((n) => n.categoria === cat && nowTs - parsePubTime(n) <= 90 * DAY_MS).length;
      return { categoria: cat, ultimos7: c7, ultimos30: c30, ultimos90: c90 };
    });
    const worst = stats.sort((a, b) => (a.ultimos7 - b.ultimos7) || (a.ultimos30 - b.ultimos30) || (a.ultimos90 - b.ultimos90))[0];
    return {
      ...worst,
      explicacion: worst.ultimos7 === 0
        ? `La categoría ${worst.categoria} no ha publicado nada en una semana. Acumula ${worst.ultimos30} en 30 días y ${worst.ultimos90} en 90. Está perdiendo relevancia.`
        : `${worst.categoria} es la categoría con menos ritmo: ${worst.ultimos7} en 7 días, ${worst.ultimos30} en 30 y ${worst.ultimos90} en 90.`,
    };
  })();

  // 9. Artículo a actualizar
  const actualizar: EditorJefeView['actualizar'] = (() => {
    const pub = publishedNoticias(noticias)
      .filter((n) => !n.noindex && nowTs - lastUpdateTime(n) > 30 * DAY_MS)
      .sort((a, b) => ((b.vistas ?? 0) - (a.vistas ?? 0)) || parsePubTime(b) - parsePubTime(a));
    const topGap = cc.hunter.items.find((i) => !i.covered);
    const relevant = topGap
      ? pub.find((n) => {
          const hay = `${n.titulo} ${n.resumen} ${n.keywords || ''}`.toLowerCase();
          return hay.includes(topGap.topic.toLowerCase());
        }) || pub[0]
      : pub[0];
    const n = relevant || publishedNoticias(noticias)[0];
    if (!n) {
      return { titulo: 'No hay noticias para actualizar', slug: '', explicacion: 'El archivo no tiene piezas publicadas.' };
    }
    const days = Math.max(0, Math.floor((nowTs - lastUpdateTime(n)) / DAY_MS));
    return {
      titulo: n.titulo,
      slug: n.slug,
      explicacion: `Sigue siendo relevante para ${n.categoria}. La última actualización fue hace ${days} días. Una versión fresca recuperaría tráfico de búsqueda.`,
    };
  })();

  // 10. Nota que merece portada
  const merecePortada: EditorJefeView['merecePortada'] = (() => {
    const plan = cc.distribution.plans[0];
    if (plan) {
      return {
        titulo: plan.title,
        slug: plan.slug,
        explicacion: `${plan.reason}. Tiene utilidad, interés y autoridad para ser la cara de hoy.`,
      };
    }
    const slot = cc.home.brandSlots.find((s) => s.onBrand);
    if (slot) {
      return {
        titulo: slot.title,
        slug: slot.slug,
        explicacion: `${slot.note}. Es la pieza que mejor representa la marca en portada.`,
      };
    }
    const n = publishedNoticias(noticias).filter((x) => x.categoria !== 'Sucesos')[0] || publishedNoticias(noticias)[0];
    if (!n) {
      return { titulo: 'No hay noticias para portada', slug: '', explicacion: 'El archivo está vacío.' };
    }
    return {
      titulo: n.titulo,
      slug: n.slug,
      explicacion: `Destacar esta noticia de ${n.categoria} equilibraría la portada y aprovecharía el interés actual.`,
    };
  })();

  const lectorNuevo: EditorJefeView['lectorNuevo'] = {
    primeraImpresion: cc.home.verdict,
    entenderia: cc.brandGuardian.googleEntenderia
      ? 'Un lector nuevo entendería que este es un medio nacional serio con cobertura diversa.'
      : `Un lector nuevo vería ${cc.home.dominantCategory ?? 'una categoría'} dominando la portada y no entendería qué tipo de medio es este.`,
  };

  const quePasaraSiNoHagoNada: string = (() => {
    const risks: string[] = [];
    if (cc.brandGuardian.pareceTabloide) risks.push('la portada seguirá comunicando nota roja y no periodismo nacional');
    if (cc.brandGuardian.excesoSucesos) risks.push('Sucesos seguirá erosionando la identidad editorial');
    if (cc.trust.score < 60) risks.push('Google no elevará el medio en búsqueda ni Discover');
    if (cc.business.score < 50) risks.push('el medio no generará ingresos');
    if (risks.length === 0) return 'Si no haces nada hoy, el medio se mantendrá estable. No hay riesgos críticos.';
    return `Si no haces nada hoy, ${risks.join(', ')}. El crecimiento se estancará.`;
  })();

  return {
    salud,
    prioridades,
    noPublicar,
    oportunidadPerdida,
    googleVeredicto,
    anunciante: { simulaciones },
    noticiaAGuia,
    categoriaAbandonada,
    actualizar,
    merecePortada,
    lectorNuevo,
    quePasaraSiNoHagoNada,
  };
}

export function buildCeoView(
  cc: BusinessCommandCenter,
  noticias: Noticia[],
  guides: EvergreenArticle[],
  now = new Date(),
  pendingCount = 0,
): NiosCeoView {
  const briefing = buildCeoBriefing(cc);
  const mediaHealth = buildMediaHealth(cc);
  const cards = buildCeoCards(cc);
  const checklist = buildCeoChecklist(cards);
  const editorJefe = buildEditorJefeView(cc, noticias, guides, now);

  const memoryMessage = pendingCount > 0
    ? `Hay ${pendingCount} tarea${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'} de días anteriores.`
    : 'Todas las tareas recientes están completadas.';

  return {
    briefing,
    mediaHealth,
    cards,
    checklist,
    memory: { pending: pendingCount, message: memoryMessage },
    editorJefe,
    brandGuardian: cc.brandGuardian,
    eeat: cc.eeat,
    businessIntel: cc.businessIntel,
  };
}
