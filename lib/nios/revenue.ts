import { getAdInventory, getAvailableSlots } from '@/lib/ads/inventory';
import { getNews } from '@/lib/data';
import { EVERGREEN_ARTICLES } from '@/lib/evergreen';
import type { NiosModuleReport, NiosRecommendation } from './types';
import { daysAgo, rec, sortByPriority, trackError } from './utils';

export async function runRevenueIntelligence(): Promise<NiosModuleReport> {
  try {
    const noticias = await getNews(300);
    const available = getAvailableSlots();
    const inventory = getAdInventory();

    const byCategory = noticias.reduce<Record<string, { count: number; views: number }>>((acc, n) => {
      const c = n.categoria || 'Sin categoría';
      if (!acc[c]) acc[c] = { count: 0, views: 0 };
      acc[c].count += 1;
      acc[c].views += n.vistas || 0;
      return acc;
    }, {});

    const topCategories = Object.entries(byCategory)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);

    const guidesWithPotential = EVERGREEN_ARTICLES.filter(
      (g) => ['Trámites', 'Turismo', 'Economía'].includes(g.category) && daysAgo(g.updatedDate) < 60
    );

    const highVisibilitySlots = inventory.filter((s) => ['home-top', 'article-sidebar', 'category-sponsor'].includes(s.id));
    const unfilledHighValue = highVisibilitySlots.filter((s) => !s.filled);

    const recommendations: NiosRecommendation[] = [];

    if (available.length > 0) {
      recommendations.push(
        rec(
          `${available.length} espacios publicitarios disponibles`,
          'Existen espacios sin anunciante que pueden activarse.',
          'high',
          'Contactar anunciantes locales para patrocinio de categorías o newsletter.',
          'revenue'
        )
      );
    }

    topCategories.forEach((c) => {
      recommendations.push(
        rec(
          `Categoría con potencial comercial: ${c.name}`,
          `${c.views} vistas en ${c.count} noticias.`,
          'medium',
          `Ofrecer patrocinio de categoría /${c.name.toLowerCase().replace(/[^a-z]/g, '')} a marcas afines.`,
          'revenue',
          `${c.views} vistas`
        )
      );
    });

    if (guidesWithPotential.length > 0) {
      recommendations.push(
        rec(
          `${guidesWithPotential.length} guías evergreen actualizadas`,
          'Trámites, Turismo y Economía tienen alto potencial de patrocinio.',
          'medium',
          'Buscar patrocinadores para guías prácticas (bancos, agencias, servicios).',
          'revenue'
        )
      );
    }

    if (unfilledHighValue.length > 0) {
      recommendations.push(
        rec(
          'Espacios de alta visibilidad sin llenar',
          `Patrocinios premium como ${unfilledHighValue.map((s) => s.name).join(', ')} están disponibles.`,
          'high',
          'Priorizar venta de espacios de home, sidebar y categorías.',
          'revenue'
        )
      );
    }

    return {
      module: 'revenue',
      status: recommendations.length ? 'opportunity' : 'ok',
      summary: `Revenue: ${available.length} espacios libres de ${inventory.length}. Categorías con más vistas: ${topCategories.map((c) => c.name).join(', ') || '—'}.`,
      metrics: [
        { label: 'Espacios publicitarios totales', value: inventory.length },
        { label: 'Espacios disponibles', value: available.length },
        { label: 'Patrocinio premium libre', value: unfilledHighValue.length },
        { label: 'Guías con potencial', value: guidesWithPotential.length },
        ...topCategories.map((c) => ({ label: `Vistas ${c.name}`, value: c.views })),
      ],
      recommendations: sortByPriority(recommendations),
    };
  } catch (err) {
    return { module: 'revenue', status: 'requires_attention', summary: 'Módulo de revenue falló.', metrics: [], recommendations: [rec('Error en Revenue', trackError('revenue', err), 'critical', 'Revisar conexión Firestore.', 'revenue')], errors: [trackError('revenue', err)] };
  }
}
