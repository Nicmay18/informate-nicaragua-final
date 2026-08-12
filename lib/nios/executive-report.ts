import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import type { CategoryHealth } from './category-health';
import type { NiosOpportunity } from './opportunity-radar';
import type { SeoCleanupReport } from './seo-cleanup';
import type { BusinessSignal } from './business-signals';
import { hasWeakMetaDescription, hasWeakKeywords } from '@/lib/seo/effective';

export interface Kpi {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  delta: string;
  icon: string;
  color: string;
}

export interface Priority {
  id: string;
  stars: number;
  label: string;
  title: string;
  target: string;
  impact: string;
  action: string;
  href?: string;
}

export interface RadarSignal {
  label: string;
  status: 'green' | 'yellow' | 'red' | 'gray';
  value: string;
}

export interface ArticleAudit {
  id: string;
  slug: string;
  title: string;
  categoria: string;
  status: 'excellent' | 'good' | 'needs' | 'critical';
  missing: string[];
  reason: string;
}

export interface OpportunityCard {
  id: string;
  topic: string;
  type: 'guía' | 'noticia' | 'categoría';
  demand: number;
  competition: number;
  seoGain: number;
  timeHours: number;
  action: string;
}

export interface CategoryMapItem {
  name: string;
  noticias: number;
  views: number;
  avgViews: number;
  growth: 'up' | 'down' | 'flat';
  level: 'alto' | 'medio' | 'bajo';
  bar: number;
}

export interface BusinessAsset {
  type: 'categoría' | 'guía' | 'tema' | 'noticia' | 'actualización';
  name: string;
  metric: string;
  insight: string;
}

export interface DistributionChannel {
  name: string;
  icon: string;
  published: number;
  pending: number;
  scheduled: number;
  status: 'ok' | 'warning' | 'critical';
}

export interface CeoSummary {
  headline: string;
  healthScore: number;
  actions: string[];
  projectedTraffic: string;
}

export interface ExecutiveDashboard {
  status: 'ok' | 'partial';
  kpis: Kpi[];
  scores: {
    health: number;
    googleReadiness: number;
    revenue: number;
    eeats: number;
    discover: number;
  };
  priorities: Priority[];
  radar: RadarSignal[];
  newsroom: {
    publishedToday: number;
    scheduled: number;
    unreviewed: number;
    withoutImage: number;
    withoutMeta: number;
    withoutKeyword: number;
    withoutDistribution: number;
    withoutSocial: number;
    articles: ArticleAudit[];
  };
  opportunities: OpportunityCard[];
  categoryMap: CategoryMapItem[];
  audit: ArticleAudit[];
  business: BusinessAsset[];
  distribution: DistributionChannel[];
  ceo: CeoSummary;
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

function startOfDay(d: Date): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function scoreColor(n: number): string {
  if (n >= 80) return '#16a34a';
  if (n >= 60) return '#ca8a04';
  return '#dc2626';
}

export function buildExecutiveDashboard(
  noticias: Noticia[],
  guides: EvergreenArticle[],
  categoryHealth: Record<string, CategoryHealth>,
  opportunities: NiosOpportunity[],
  seo: SeoCleanupReport,
  businessSignals: BusinessSignal[],
  errors: string[]
): ExecutiveDashboard {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const ms24 = now.getTime() - 24 * 60 * 60 * 1000;
  const ms7 = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const ms14 = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const ms30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const drafts = noticias.filter((n) => n.estado === 'borrador' || n.estado === 'archivado');

  const publishedToday = published.filter((n) => toDate(n.fecha).getTime() >= today).length;
  const totalViews = published.reduce((sum, n) => sum + (n.vistas || 0), 0);
  const avgViews = published.length ? Math.round(totalViews / published.length) : 0;

  const last7 = published.filter((n) => toDate(n.fecha).getTime() >= ms7).length;
  const prev7 = published.filter((n) => {
    const t = toDate(n.fecha).getTime();
    return t >= ms14 && t < ms7;
  }).length;
  const last7Views = published
    .filter((n) => toDate(n.fecha).getTime() >= ms7)
    .reduce((sum, n) => sum + (n.vistas || 0), 0);

  const growing = last7 > prev7;
  const dying = last7 < prev7;

  const categoryViews: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const authorViews: Record<string, number> = {};
  const keywordCounts: Record<string, number> = {};

  for (const n of published) {
    categoryViews[n.categoria] = (categoryViews[n.categoria] || 0) + (n.vistas || 0);
    categoryCounts[n.categoria] = (categoryCounts[n.categoria] || 0) + 1;
    if (n.autor) authorViews[n.autor] = (authorViews[n.autor] || 0) + (n.vistas || 0);

    const text = `${n.titulo} ${n.resumen}`.toLowerCase();
    for (const kw of ['pasaporte', 'apostilla', 'récord policial', 'turismo', 'dólar', 'salario', 'migración', 'licencia', 'visa', 'café', 'beisbol', 'fútbol']) {
      if (text.includes(kw)) keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    }
  }

  const dominantCategory = Object.entries(categoryViews).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin datos';
  const profitableCategory = Object.entries(categoryViews).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin datos';
  const topAuthor = Object.entries(authorViews).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin datos';

  const evergreenCandidates = published.filter((n) => {
    const text = `${n.titulo} ${n.resumen}`.toLowerCase();
    return (
      text.includes('cómo') ||
      text.includes('requisitos') ||
      text.includes('pasos') ||
      text.includes('costo') ||
      text.includes('pasaporte') ||
      text.includes('apostilla') ||
      text.includes('dólar') ||
      text.includes('salario') ||
      text.includes('turismo')
    );
  });

  const guidesPublished = guides.length;
  const guidesPending = Math.max(0, evergreenCandidates.length - guides.length);

  const withoutImage = published.filter((n) => !n.imagen || n.imagen.includes('logo') || n.imagen === '/logo.webp').length;
  const withoutMeta = published.filter(hasWeakMetaDescription).length;
  const withoutKeyword = published.filter(hasWeakKeywords).length;
  // Scores
  const lowHealth = Object.values(categoryHealth).filter((h) => h.level === 'bajo').length;
  const mediumHealth = Object.values(categoryHealth).filter((h) => h.level === 'medio').length;
  const healthScore = Math.max(0, Math.min(100, 100 - lowHealth * 15 - mediumHealth * 5));

  const googleReadiness = Math.max(
    0,
    Math.min(
      100,
      100 -
        (seo.counts['titulo_largo'] || 0) * 1.5 -
        (seo.counts['meta_vacia'] || 0) * 3 -
        (seo.counts['meta_larga'] || 0) * 0.5 -
        (seo.counts['sin_autor'] || 0) * 2 -
        (seo.counts['sin_imagen'] || 0) * 3 -
        (seo.counts['sin_alt'] || 0) * 0.5
    )
  );

  const withAutor = published.filter((n) => n.autor?.trim()).length;
  const withScore = published.filter((n) => typeof n.scoreMeni === 'number' && n.scoreMeni >= 70).length;
  const withKeyPoints = published.filter((n) => Array.isArray(n.puntosClave) && n.puntosClave.length > 0).length;
  const total = published.length || 1;
  const eeatsScore = Math.round(((withAutor + withScore + withKeyPoints) / (total * 3)) * 100);

  const withImage = published.filter((n) => n.imagen && !n.imagen.includes('logo')).length;
  const recentWithViews = published.filter((n) => toDate(n.fecha).getTime() >= ms30 && (n.vistas || 0) > 10).length;
  const discoverScore = Math.round(((withImage / total) * 50) + ((recentWithViews / total) * 50));

  const revenueScore = Math.max(0, Math.min(100, 50 + businessSignals.length * 8 + (profitableCategory ? 15 : 0)));

  const scores = {
    health: healthScore,
    googleReadiness,
    revenue: revenueScore,
    eeats: eeatsScore,
    discover: discoverScore,
  };

  const kpis: Kpi[] = [
    { id: 'published', label: 'Noticias publicadas', value: String(published.length), trend: growing ? 'up' : dying ? 'down' : 'flat', delta: `${last7} esta semana`, icon: 'Newspaper', color: '#0ea5e9' },
    { id: 'today', label: 'Noticias hoy', value: String(publishedToday), trend: publishedToday > 0 ? 'up' : 'flat', delta: 'hoy', icon: 'Clock', color: '#16a34a' },
    { id: 'views24', label: 'Vistas recientes', value: formatNumber(last7Views), trend: last7 > prev7 ? 'up' : last7 < prev7 ? 'down' : 'flat', delta: 'últimos 7 días', icon: 'Eye', color: '#7c3aed' },
    { id: 'avg', label: 'Promedio por noticia', value: String(avgViews), trend: 'flat', delta: 'vistas/noticia', icon: 'BarChart3', color: '#ca8a04' },
    { id: 'ctr', label: 'CTR promedio', value: '—', trend: 'flat', delta: 'Sin datos de clics', icon: 'MousePointer', color: '#64748b' },
    { id: 'readTime', label: 'Tiempo promedio lectura', value: '—', trend: 'flat', delta: 'Sin datos de duración', icon: 'Hourglass', color: '#64748b' },
    { id: 'growing', label: 'Noticias creciendo', value: String(last7), trend: last7 > prev7 ? 'up' : 'flat', delta: `${prev7} hace 7 días`, icon: 'TrendingUp', color: '#16a34a' },
    { id: 'dying', label: 'Noticias muriendo', value: String(published.length - recentWithViews), trend: recentWithViews < total ? 'down' : 'flat', delta: 'sin vistas recientes', icon: 'TrendingDown', color: '#dc2626' },
    { id: 'dominant', label: 'Categoría dominante', value: dominantCategory, trend: 'flat', delta: `${categoryCounts[dominantCategory] || 0} noticias`, icon: 'Flag', color: '#1d4ed8' },
    { id: 'profitable', label: 'Categoría más rentable', value: profitableCategory, trend: 'flat', delta: `${formatNumber(categoryViews[profitableCategory] || 0)} vistas`, icon: 'DollarSign', color: '#16a34a' },
    { id: 'author', label: 'Autor con mejor rendimiento', value: topAuthor, trend: 'flat', delta: `${formatNumber(authorViews[topAuthor] || 0)} vistas`, icon: 'User', color: '#0ea5e9' },
    { id: 'guides', label: 'Guías publicadas', value: String(guidesPublished), trend: growing ? 'up' : 'flat', delta: `${guidesPending} pendientes`, icon: 'BookOpen', color: '#7c3aed' },
    { id: 'guidesPending', label: 'Guías pendientes', value: String(guidesPending), trend: guidesPending > 0 ? 'up' : 'flat', delta: 'noticias con potencial', icon: 'BookMarked', color: '#ca8a04' },
    { id: 'metaPending', label: 'Meta descriptions pendientes', value: String(withoutMeta), trend: withoutMeta > 0 ? 'down' : 'flat', delta: 'por corregir', icon: 'FileText', color: '#dc2626' },
    { id: 'kwPending', label: 'Keywords pendientes', value: String(withoutKeyword), trend: withoutKeyword > 0 ? 'down' : 'flat', delta: 'por asignar', icon: 'Tag', color: '#dc2626' },
    { id: 'health', label: 'Health Score', value: `${healthScore}`, trend: healthScore >= 80 ? 'up' : 'down', delta: 'de 100', icon: 'Activity', color: scoreColor(healthScore) },
    { id: 'google', label: 'Google Readiness', value: `${googleReadiness}`, trend: googleReadiness >= 80 ? 'up' : 'down', delta: 'de 100', icon: 'Search', color: scoreColor(googleReadiness) },
    { id: 'revenue', label: 'Revenue Score', value: `${revenueScore}`, trend: revenueScore >= 60 ? 'up' : 'down', delta: 'de 100', icon: 'DollarSign', color: scoreColor(revenueScore) },
    { id: 'eeats', label: 'EEAT Score', value: `${eeatsScore}`, trend: eeatsScore >= 80 ? 'up' : 'down', delta: 'de 100', icon: 'Award', color: scoreColor(eeatsScore) },
    { id: 'discover', label: 'Discover Score', value: `${discoverScore}`, trend: discoverScore >= 60 ? 'up' : 'down', delta: 'de 100', icon: 'Zap', color: scoreColor(discoverScore) },
  ];

  const priorities: Priority[] = [];

  // 1. Fix meta
  const firstMissingMeta = published.find(hasWeakMetaDescription);
  if (firstMissingMeta && withoutMeta > 0) {
    priorities.push({
      id: 'p-meta',
      stars: 5,
      label: 'URGENTE',
      title: 'Corregir meta description',
      target: firstMissingMeta.titulo.slice(0, 55),
      impact: `Afecta ${withoutMeta} noticia${withoutMeta === 1 ? '' : 's'} con meta fuera del rango 80-160 caracteres. Evita pérdida de CTR en búsquedas.`,
      action: 'Revisar ahora',
      href: `/admin/news/${firstMissingMeta.id}`,
    });
  }

  // 2. Distribute national
  const nationalToShare = published
    .filter((n) => n.categoria === 'Nacionales' && toDate(n.fecha).getTime() >= ms24)
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))[0];
  if (nationalToShare) {
    priorities.push({
      id: 'p-dist',
      stars: 5,
      label: 'URGENTE',
      title: 'Distribuir noticia nacional',
      target: nationalToShare.titulo.slice(0, 55),
      impact: `+${formatNumber(nationalToShare.vistas || 0)} lectores potenciales si se amplifica en redes.`,
      action: 'Distribuir',
      href: `/noticias/${nationalToShare.slug}`,
    });
  }

  // 3. Create guide
  const guideOpp = opportunities.find((o) => o.type === 'guía') || opportunities[0];
  if (guideOpp) {
    priorities.push({
      id: 'p-guide',
      stars: 4,
      label: 'ALTA',
      title: 'Crear guía',
      target: guideOpp.topic.slice(0, 55),
      impact: 'Alta demanda Google. Posiciona tráfico permanente.',
      action: 'Crear guía',
    });
  }

  // 4. Strengthen weak category
  const weak = Object.entries(categoryHealth)
    .filter(([, h]) => h.level === 'bajo')
    .sort((a, b) => a[1].count7 - b[1].count7)[0]?.[0];
  if (weak) {
    priorities.push({
      id: 'p-cat',
      stars: 4,
      label: 'ALTA',
      title: 'Fortalecer categoría',
      target: weak,
      impact: `Solo ${categoryHealth[weak].count7} noticia${categoryHealth[weak].count7 === 1 ? '' : 's'} en 7 días. Equilibra portada.`,
      action: 'Planificar nota',
    });
  }

  // 5. Update old high-traffic article
  const toUpdate = published
    .filter((n) => toDate(n.fecha).getTime() < ms30 && (n.vistas || 0) >= 20)
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))[0];
  if (toUpdate) {
    priorities.push({
      id: 'p-update',
      stars: 3,
      label: 'MEDIA',
      title: 'Actualizar contenido',
      target: toUpdate.titulo.slice(0, 55),
      impact: `${formatNumber(toUpdate.vistas || 0)} vistas acumuladas. Actualizar recupera tráfico.`,
      action: 'Actualizar',
      href: `/admin/news/${toUpdate.id}`,
    });
  }

  const radar: RadarSignal[] = [
    { label: 'Google Discover', status: discoverScore >= 70 ? 'green' : discoverScore >= 40 ? 'yellow' : 'red', value: `${discoverScore}/100` },
    { label: 'Google News', status: 'green', value: 'Sitemap activo' },
    { label: 'Search Console', status: 'gray', value: 'Sin conexión' },
    { label: 'SEO Core', status: seo.total < 5 ? 'green' : seo.total < 25 ? 'yellow' : 'red', value: `${seo.total} issues` },
    { label: 'EEAT', status: eeatsScore >= 80 ? 'green' : eeatsScore >= 60 ? 'yellow' : 'red', value: `${eeatsScore}/100` },
    { label: 'Schema', status: withKeyPoints >= total * 0.5 ? 'green' : 'yellow', value: `${withKeyPoints} con puntos clave` },
    { label: 'Indexación', status: 'green', value: 'Sitemap generado' },
    { label: 'Imágenes', status: withoutImage === 0 ? 'green' : withoutImage < 10 ? 'yellow' : 'red', value: `${withoutImage} sin imagen` },
    { label: 'Core Web Vitals', status: 'gray', value: 'Sin datos' },
  ];

  function auditArticle(n: Noticia): ArticleAudit {
    const missing: string[] = [];
    if (hasWeakMetaDescription(n)) missing.push('meta');
    if (hasWeakKeywords(n)) missing.push('keywords');
    if (!n.autor?.trim()) missing.push('autor');
    if (!n.imagen || n.imagen.includes('logo')) missing.push('imagen');
    if (n.titulo.length > 60) missing.push('título largo');

    let status: ArticleAudit['status'] = 'excellent';
    let reason = 'Cumple todos los criterios editoriales.';
    const score = n.scoreMeni;
    if (missing.includes('imagen') || missing.includes('autor') || n.titulo.length > 80 || (typeof score === 'number' && score < 60)) {
      status = 'critical';
      reason = 'Faltan elementos esenciales: imagen, autor o título muy largo.';
    } else if (missing.length >= 2 || (typeof score === 'number' && score < 75)) {
      status = 'needs';
      reason = `Falta: ${missing.join(', ')}.`;
    } else if (missing.length === 1 || (typeof score === 'number' && score < 85)) {
      status = 'good';
      reason = missing.length ? `Falta: ${missing.join(', ')}.` : 'Cumple la mayoría.';
    }

    return {
      id: n.id,
      slug: n.slug,
      title: n.titulo,
      categoria: n.categoria,
      status,
      missing,
      reason,
    };
  }

  const audited = published.slice(0, 50).map(auditArticle);
  const unreviewed = drafts.length;

  const newsroom = {
    publishedToday,
    scheduled: drafts.length,
    unreviewed,
    withoutImage,
    withoutMeta,
    withoutKeyword,
    withoutDistribution: publishedToday,
    withoutSocial: publishedToday,
    articles: audited,
  };

  const categoryMap: CategoryMapItem[] = Object.entries(categoryHealth)
    .map(([name, h]) => {
      const views = h.views7 || 0;
      const noticias = h.count7 || 0;
      const avgViews = noticias ? Math.round(views / noticias) : 0;
      const prev = h.views30 - h.views7;
      const growth: CategoryMapItem['growth'] = h.views7 > prev ? 'up' : h.views7 < prev ? 'down' : 'flat';
      return { name, noticias, views, avgViews, growth, level: h.level, bar: 0 };
    })
    .sort((a, b) => b.views - a.views);

  const maxViews = Math.max(1, ...categoryMap.map((c) => c.views));
  for (const c of categoryMap) {
    c.bar = Math.round((c.views / maxViews) * 100);
  }

  const opportunityCards: OpportunityCard[] = opportunities.slice(0, 5).map((o, i) => {
    const text = o.topic.toLowerCase();
    const demand = Math.min(5, 2 + (o.priority === 'high' ? 2 : 1) + (text.includes('pasaporte') || text.includes('apostilla') || text.includes('dólar') ? 1 : 0));
    const competition = o.type === 'guía' ? 2 : o.type === 'categoría' ? 3 : 4;
    const seoGain = o.type === 'guía' ? 5 : o.type === 'categoría' ? 4 : 3;
    const timeHours = o.type === 'guía' ? 2 : o.type === 'categoría' ? 1 : 0.5;
    return {
      id: o.id || `opp-${i}`,
      topic: o.topic,
      type: o.type,
      demand,
      competition,
      seoGain,
      timeHours,
      action: o.action,
    };
  });

  const business: BusinessAsset[] = [];
  if (profitableCategory) {
    business.push({
      type: 'categoría',
      name: profitableCategory,
      metric: `${formatNumber(categoryViews[profitableCategory] || 0)} vistas`,
      insight: 'Categoría que genera más tráfico. Mantener presencia constante.',
    });
  }
  for (const g of guides.slice(0, 3)) {
    business.push({
      type: 'guía',
      name: g.title,
      metric: g.category,
      insight: 'Tráfico permanente potencial. Verificar vigencia.',
    });
  }
  const topTheme = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1])[0];
  if (topTheme) {
    business.push({
      type: 'tema',
      name: topTheme[0],
      metric: `${topTheme[1]} noticias`,
      insight: 'Tema recurrente. Considerar guía canónica.',
    });
  }
  const guideCandidate = evergreenCandidates
    .filter((n) => !guides.some((g) => g.category === n.categoria))
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))[0];
  if (guideCandidate) {
    business.push({
      type: 'noticia',
      name: guideCandidate.titulo.slice(0, 60),
      metric: `${formatNumber(guideCandidate.vistas || 0)} vistas`,
      insight: 'Puede convertirse en guía evergreen.',
    });
  }
  const updateCandidate = published
    .filter((n) => toDate(n.fecha).getTime() < ms30 && (n.vistas || 0) >= 20)
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))[0];
  if (updateCandidate) {
    business.push({
      type: 'actualización',
      name: updateCandidate.titulo.slice(0, 60),
      metric: `${formatNumber(updateCandidate.vistas || 0)} vistas`,
      insight: 'Contenido maduro con tráfico. Merece seguimiento/actualización.',
    });
  }

  const distribution: DistributionChannel[] = [
    { name: 'Facebook', icon: 'Facebook', published: 0, pending: publishedToday, scheduled: 0, status: publishedToday > 0 ? 'warning' : 'ok' },
    { name: 'Telegram', icon: 'Send', published: 0, pending: publishedToday, scheduled: 0, status: publishedToday > 0 ? 'warning' : 'ok' },
    { name: 'WhatsApp', icon: 'MessageCircle', published: 0, pending: publishedToday, scheduled: 0, status: publishedToday > 0 ? 'warning' : 'ok' },
    { name: 'Newsletter', icon: 'Mail', published: 0, pending: publishedToday, scheduled: 0, status: publishedToday > 2 ? 'critical' : 'ok' },
    { name: 'Push', icon: 'Bell', published: 0, pending: publishedToday, scheduled: 0, status: publishedToday > 0 ? 'warning' : 'ok' },
    { name: 'X', icon: 'Twitter', published: 0, pending: publishedToday, scheduled: 0, status: publishedToday > 0 ? 'warning' : 'ok' },
  ];

  const pendingActions = priorities.map((p) => `${p.title}: ${p.target}`);
  const projected = Math.min(25, Math.round((seo.total / (published.length || 1)) * 100) + pendingActions.length);

  const ceo: CeoSummary = {
    headline: `Hoy Nicaragua Informate tiene ${healthScore >= 80 ? 'un día saludable' : healthScore >= 60 ? 'un día estable con observaciones' : 'un día que requiere atención'}.`,
    healthScore,
    actions: pendingActions.slice(0, 4),
    projectedTraffic: `+${projected}% tráfico estimado si se completan las acciones priorizadas.`,
  };

  return {
    status: errors.length ? 'partial' : 'ok',
    kpis,
    scores,
    priorities: priorities.slice(0, 5),
    radar,
    newsroom,
    opportunities: opportunityCards,
    categoryMap,
    audit: audited,
    business,
    distribution,
    ceo,
  };
}
