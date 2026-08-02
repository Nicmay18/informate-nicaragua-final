import { getNews } from '@/lib/data';
import { EVERGREEN_ARTICLES } from '@/lib/evergreen';
import { CATEGORIES } from '@/lib/types';
import type { NiosModuleReport, NiosRecommendation } from './types';
import { daysAgo, rec, sortByPriority, trackError } from './utils';

export async function runOpportunityHunter(): Promise<NiosModuleReport> {
  try {
    const noticias = await getNews(300);
    const existingSlugs = new Set(EVERGREEN_ARTICLES.map((e) => e.slug));
    const existingGuideCategories = new Set(EVERGREEN_ARTICLES.map((e) => e.category));

    const recentTopics = noticias
      .filter((n) => daysAgo(n.fecha) <= 90)
      .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
      .slice(0, 20)
      .map((n) => ({
        titulo: n.titulo,
        slug: n.slug,
        categoria: n.categoria,
        vistas: n.vistas || 0,
        tags: n.tags || [],
      }));

    const highPotential = recentTopics.filter(
      (n) => n.vistas >= 20 || n.tags.some((t) => ['cómo', 'guía', 'paso a paso', 'requisitos'].some((k) => t.toLowerCase().includes(k)))
    );

    const missingEvergreenCategories = CATEGORIES.map((c) => c.name).filter((c) => !existingGuideCategories.has(c));
    const categoriesWithLowCoverage = noticias
      .reduce<Record<string, number>>((acc, n) => {
        acc[n.categoria] = (acc[n.categoria] || 0) + 1;
        return acc;
      }, {});
    const underRepresented = Object.entries(categoriesWithLowCoverage).filter(([, count]) => count < 5).map(([name]) => name);

    const recommendations: NiosRecommendation[] = [];

    highPotential.forEach((n) => {
      if (!existingSlugs.has(n.slug)) {
        recommendations.push(
          rec(
            `Oportunidad de guía: ${n.titulo.slice(0, 50)}…`,
            `${n.vistas} vistas en ${n.categoria}. Tiene potencial evergreen.`,
            'medium',
            'Evaluar convertir la noticia en guía explicativa o complementar con una guía nueva.',
            'opportunityHunter',
            `${n.vistas} vistas`
          )
        );
      }
    });

    if (missingEvergreenCategories.length > 0) {
      recommendations.push(
        rec(
          `Categorías sin guía: ${missingEvergreenCategories.join(', ')}`,
          'Hay categorías de noticias que aún no tienen contenido evergreen asociado.',
          'high',
          'Crear guías prácticas para las categorías faltantes.',
          'opportunityHunter'
        )
      );
    }

    if (underRepresented.length > 0) {
      recommendations.push(
        rec(
          `Categorías con poca cobertura: ${underRepresented.join(', ')}`,
          'Menos de 5 noticias publicadas en los últimos datos disponibles.',
          'medium',
          'Planificar noticias de seguimiento en estas categorías.',
          'opportunityHunter'
        )
      );
    }

    return {
      module: 'opportunityHunter',
      status: recommendations.length ? 'opportunity' : 'ok',
      summary: `Oportunidades: ${highPotential.length} temas con potencial evergreen, ${missingEvergreenCategories.length} categorías sin guía.`,
      metrics: [
        { label: 'Temas con potencial', value: highPotential.length },
        { label: 'Categorías sin guía', value: missingEvergreenCategories.length },
        { label: 'Categorías con poca cobertura', value: underRepresented.length },
        { label: 'Guías existentes', value: EVERGREEN_ARTICLES.length },
      ],
      recommendations: sortByPriority(recommendations),
    };
  } catch (err) {
    return { module: 'opportunityHunter', status: 'requires_attention', summary: 'Módulo Opportunity Hunter falló.', metrics: [], recommendations: [rec('Error en Opportunity Hunter', trackError('opportunityHunter', err), 'critical', 'Revisar conexión Firestore.', 'opportunityHunter')], errors: [trackError('opportunityHunter', err)] };
  }
}
