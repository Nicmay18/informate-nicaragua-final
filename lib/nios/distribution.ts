import { getNews } from '@/lib/data';
import { generateDistribution, shouldDistribute } from '@/lib/distribution';
import type { NiosModuleReport, NiosRecommendation } from './types';
import { rec, sortByPriority, trackError } from './utils';

export async function runDistributionIntelligence(): Promise<NiosModuleReport> {
  try {
    const noticias = await getNews(100);
    const candidates = noticias
      .filter((n) => shouldDistribute(n))
      .slice(0, 5)
      .map((n) => ({
        slug: n.slug,
        titulo: n.titulo,
        categoria: n.categoria,
        score: n.scoreMeni ?? 0,
        vistas: n.vistas || 0,
        messages: generateDistribution(n),
      }));

    const highValue = candidates.filter((n) => n.score >= 90 || n.categoria === 'Nacionales' || n.vistas >= 50);
    const withoutDistribution = noticias.filter(
      (n) => (n.scoreMeni ?? 0) >= 80 && (n.vistas ?? 0) >= 10 && !shouldDistribute(n)
    ).slice(0, 3);

    const recommendations: NiosRecommendation[] = [];

    if (candidates.length === 0) {
      recommendations.push(
        rec(
          'No hay noticias listas para distribución automática',
          'Ninguna noticia cumple criterios de score, categoría o vistas.',
          'medium',
          'Publicar noticias Nacionales de alto score o impulsar las que ya tienen tráfico.',
          'distribution'
        )
      );
    } else {
      highValue.forEach((n) => {
        recommendations.push(
          rec(
            `Distribuir: ${n.titulo.slice(0, 50)}…`,
            `Score ${n.score}, categoría ${n.categoria}, ${n.vistas} vistas.`,
            'high',
            'Publicar en Facebook, WhatsApp, Telegram, X y newsletter con mensajes adaptados.',
            'distribution'
          )
        );
      });
    }

    if (withoutDistribution.length > 0) {
      recommendations.push(
        rec(
          `${withoutDistribution.length} noticias con buen score pero sin criterios de distribución`,
          'Tienen calidad y vistas pero no encajan en las reglas actuales.',
          'low',
          'Revisar reglas de shouldDistribute o forzar distribución manual.',
          'distribution'
        )
      );
    }

    return {
      module: 'distribution',
      status: recommendations.length ? 'opportunity' : 'ok',
      summary: `Distribución: ${candidates.length} noticias candidatas, ${highValue.length} de alto valor.`,
      metrics: [
        { label: 'Candidatas', value: candidates.length },
        { label: 'Alto valor', value: highValue.length },
        ...candidates.map((c) => ({ label: c.titulo.slice(0, 40), value: c.messages.whatsapp.slice(0, 80) })),
      ],
      recommendations: sortByPriority(recommendations),
    };
  } catch (err) {
    return { module: 'distribution', status: 'requires_attention', summary: 'Módulo de distribución falló.', metrics: [], recommendations: [rec('Error en Distribution', trackError('distribution', err), 'critical', 'Revisar conexión Firestore.', 'distribution')], errors: [trackError('distribution', err)] };
  }
}
