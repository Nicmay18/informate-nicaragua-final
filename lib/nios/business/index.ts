import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';

export interface BusinessSignalV3 {
  name: string;
  type: 'categoría' | 'guía' | 'tema' | 'autor' | 'contenido';
  metric: string;
  value: string;
  monetization: 'publicidad' | 'afiliado' | 'patrocinio' | 'premium' | 'newsletter' | 'descargable';
  insight: string;
}

export interface BusinessIntelligenceV3 {
  profitableCategories: BusinessSignalV3[];
  valuableGuides: BusinessSignalV3[];
  commercialTopics: BusinessSignalV3[];
  recurrentThemes: BusinessSignalV3[];
  affiliateCandidates: BusinessSignalV3[];
  sponsorCandidates: BusinessSignalV3[];
  downloadableCandidates: BusinessSignalV3[];
  premiumCandidates: BusinessSignalV3[];
  newsletterCandidates: BusinessSignalV3[];
  topAuthors: BusinessSignalV3[];
}

const COMMERCIAL_KEYWORDS = [
  'pasaporte', 'apostilla', 'récord policial', 'antecedentes', 'migración', 'visa', 'residencia',
  'dólar', 'cambio', 'salario', 'precio', 'costo', 'tarifa', 'impuesto',
  'turismo', 'hotel', 'vuelo', 'transporte', 'tour',
  'salud', 'hospital', 'clínica', 'medicamento', 'cita médica',
  'educación', 'universidad', 'curso', 'beca', 'matrícula',
  'tecnología', 'celular', 'internet', 'plan', 'app',
];

export function runBusinessV3(noticias: Noticia[], guides: EvergreenArticle[] = []): BusinessIntelligenceV3 {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');

  const categoryViews: Record<string, number> = {};
  const authorViews: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};

  for (const n of published) {
    categoryViews[n.categoria] = (categoryViews[n.categoria] || 0) + (n.vistas || 0);
    if (n.autor) authorViews[n.autor] = (authorViews[n.autor] || 0) + (n.vistas || 0);
    for (const kw of COMMERCIAL_KEYWORDS) {
      const text = `${n.titulo} ${n.resumen}`.toLowerCase();
      if (text.includes(kw)) themeCounts[kw] = (themeCounts[kw] || 0) + 1;
    }
  }

  const profitableCategories = Object.entries(categoryViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, views]) => ({
      name,
      type: 'categoría' as const,
      metric: `${views} vistas`,
      value: String(views),
      monetization: 'publicidad' as const,
      insight: `Categoría atractiva para anuncios y contenido patrocinado.`,
    }));

  const valuableGuides = guides
    .slice(0, 5)
    .map((g) => ({
      name: g.title,
      type: 'guía' as const,
      metric: g.category,
      value: g.category,
      monetization: 'afiliado' as const,
      insight: 'Tráfico permanente. Ideal para enlaces afiliados o descargas.',
    }));

  const commercialTopics = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name,
      type: 'tema' as const,
      metric: `${count} noticias`,
      value: String(count),
      monetization: 'patrocinio' as const,
      insight: 'Tema comercial recurrente. Posible guía o review patrocinado.',
    }));

  const topRecurring = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      type: 'tema' as const,
      metric: `${count} apariciones`,
      value: String(count),
      monetization: 'newsletter' as const,
      insight: 'Tema recurrente. Considere newsletter especializada.',
    }));

  const affiliateCandidates = commercialTopics
    .filter((t) => ['pasaporte', 'apostilla', 'dólar', 'turismo', 'salario', 'precio', 'costo'].some((k) => t.name.includes(k)))
    .map((t) => ({ ...t, monetization: 'afiliado' as const, insight: 'Tema con intención de compra o trámite. Alto potencial afiliado.' }));

  const sponsorCandidates = profitableCategories
    .filter((c) => ['Tecnología', 'Turismo', 'Deportes', 'Trámites'].includes(c.name) || c.value && Number(c.value) > 100)
    .map((c) => ({ ...c, monetization: 'patrocinio' as const, insight: 'Categoría con audiencia comercial. Aproveche para contenido patrocinado.' }));

  const downloadableCandidates = valuableGuides
    .filter((g) => g.name.includes('cómo') || g.name.includes('requisitos'))
    .map((g) => ({ ...g, monetization: 'descargable' as const, insight: 'Guía paso a paso. Puede convertirse en PDF descargable.' }));

  const premiumCandidates = commercialTopics
    .filter((t) => ['migración', 'apostilla', 'pasaporte', 'dólar', 'salario'].includes(t.name))
    .map((t) => ({ ...t, monetization: 'premium' as const, insight: 'Tema con alto valor informativo. Posible contenido de pago.' }));

  const newsletterCandidates = topRecurring
    .filter((t) => t.value && Number(t.value) >= 3)
    .map((t) => ({ ...t, monetization: 'newsletter' as const, insight: 'Tema recurrente. Considere sección fija del boletín.' }));

  const topAuthors = Object.entries(authorViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, views]) => ({
      name,
      type: 'autor' as const,
      metric: `${views} vistas`,
      value: String(views),
      monetization: 'publicidad' as const,
      insight: 'Autor con mayor audiencia. Puede liderar contenido comercial.',
    }));

  return {
    profitableCategories,
    valuableGuides,
    commercialTopics,
    recurrentThemes: topRecurring,
    affiliateCandidates,
    sponsorCandidates,
    downloadableCandidates,
    premiumCandidates,
    newsletterCandidates,
    topAuthors,
  };
}
