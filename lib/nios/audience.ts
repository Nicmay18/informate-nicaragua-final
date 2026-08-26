import { getNews } from '@/lib/data';
import type { NiosModuleReport, NiosRecommendation } from './types';
import { rec, sortByPriority, trackError } from './utils';
import { isContentComplete } from './intelligence/absurd-recommendation-guard';

export async function runAudienceIntelligence(): Promise<NiosModuleReport> {
  try {
    const noticias = await getNews(300);
    if (noticias.length === 0) {
      return { module: 'audience', status: 'ok', summary: 'Sin noticias para análisis de audiencia.', metrics: [], recommendations: [] };
    }

    const byCategory = noticias.reduce<Record<string, { count: number; views: number; palabras: number }>>((acc, n) => {
      const c = n.categoria || 'Sin categoría';
      if (!acc[c]) acc[c] = { count: 0, views: 0, palabras: 0 };
      acc[c].count += 1;
      acc[c].views += n.vistas || 0;
      acc[c].palabras += n.palabras || 0;
      return acc;
    }, {});

    const categoryEntries = Object.entries(byCategory)
      .map(([name, data]) => ({ name, ...data, avg: data.count ? Math.round(data.views / data.count) : 0 }))
      .sort((a, b) => b.views - a.views);

    const avgPalabras = noticias.reduce((s, n) => s + (n.palabras || 0), 0) / noticias.length;
    const shallow = noticias.filter(
      (n) =>
        (n.palabras || 0) < avgPalabras * 0.6 &&
        (n.vistas || 0) > 0 &&
        !isContentComplete({
          scoreMeni: n.scoreMeni ?? null,
          palabras: n.palabras || 0,
          vistas: n.vistas || 0,
        }),
    ).length;
    const topCategory = categoryEntries[0];
    const bottomCategory = categoryEntries[categoryEntries.length - 1];

    const metrics = categoryEntries.map((c) => ({ label: c.name, value: { noticias: c.count, vistas: c.views, promedio: c.avg } }));

    const recommendations: NiosRecommendation[] = [];

    if (topCategory && bottomCategory) {
      recommendations.push(
        rec(
          `Audiencia concentra interés en ${topCategory.name}`,
          `Genera ${topCategory.views} vistas (${topCategory.count} noticias). ${bottomCategory.name} es la categoría con menos tracción.`,
          'medium',
          `Publicar más contenido balanceado en ${bottomCategory.name} y reforzar ${topCategory.name}.`,
          'audience'
        )
      );
    }

    if (shallow > 0) {
      recommendations.push(
        rec(
          `${shallow} noticias con profundidad baja`,
          'Menos del 60% del promedio de palabras aunque tengan vistas.',
          'medium',
          'Ampliar análisis, contexto y datos concretos para mejorar retención.',
          'audience'
        )
      );
    }

    const singleCategoryDominance = topCategory ? topCategory.count / noticias.length : 0;
    if (singleCategoryDominance > 0.35) {
      recommendations.push(
        rec(
          `${Math.round(singleCategoryDominance * 100)}% del contenido es ${topCategory.name}`,
          'Exceso de una sola categoría puede limitar la diversidad de audiencia.',
          'medium',
          'Programar cobertura de otras categorías para equilibrar intereses.',
          'audience'
        )
      );
    }

    return {
      module: 'audience',
      status: recommendations.length ? 'opportunity' : 'ok',
      summary: `Audiencia: ${noticias.length} noticias. Categoría líder: ${topCategory?.name || '—'}. Promedio palabras: ${Math.round(avgPalabras)}.`,
      metrics: [
        { label: 'Noticias analizadas', value: noticias.length },
        { label: 'Categoría principal', value: topCategory?.name || '—' },
        { label: 'Promedio palabras', value: Math.round(avgPalabras) },
        { label: 'Noticias poco profundas', value: shallow },
        ...metrics,
      ],
      recommendations: sortByPriority(recommendations),
    };
  } catch (err) {
    return { module: 'audience', status: 'requires_attention', summary: 'Módulo de audiencia falló.', metrics: [], recommendations: [rec('Error en Audience', trackError('audience', err), 'critical', 'Revisar conexión Firestore.', 'audience')], errors: [trackError('audience', err)] };
  }
}
