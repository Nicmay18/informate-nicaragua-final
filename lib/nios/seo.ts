import { getNews } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { NiosModuleReport, NiosRecommendation } from './types';
import { daysAgo, rec, sortByPriority, trackError } from './utils';
import { hasWeakMetaDescription, hasWeakKeywords } from '@/lib/seo/effective';

export async function runSeoIntelligence(): Promise<NiosModuleReport> {
  try {
    const noticias = await getNews(300);
    if (noticias.length === 0) {
      return { module: 'seo', status: 'ok', summary: 'Sin noticias para analizar SEO.', metrics: [], recommendations: [] };
    }

    const total = noticias.length;
    const avgViews = Math.round(noticias.reduce((s, n) => s + (n.vistas || 0), 0) / total) || 0;
    const lowTraffic = noticias.filter((n) => (n.vistas || 0) < Math.max(avgViews * 0.3, 1) && daysAgo(n.fecha) < 30);
    const stale = noticias.filter((n) => daysAgo(n.fechaActualizacion || n.fecha) > 90 && (n.vistas || 0) > avgViews);
    const noMeta = noticias.filter(hasWeakMetaDescription);
    const noKeywords = noticias.filter(hasWeakKeywords);
    const possibleCannibalization = noticias
      .filter((n) => n.keywords)
      .reduce<Record<string, Noticia[]>>((acc, n) => {
        (n.tags || []).forEach((t) => {
          acc[t] = acc[t] || [];
          acc[t].push(n);
        });
        return acc;
      }, {});
    const cannibalTags = Object.entries(possibleCannibalization).filter(([, v]) => v.length > 3).slice(0, 10);

    const metrics = [
      { label: 'Analizadas', value: total },
      { label: 'Promedio de vistas', value: avgViews },
      { label: 'Poco tráfico reciente', value: lowTraffic.length },
      { label: 'Sin meta description óptima', value: noMeta.length },
      { label: 'Sin keywords', value: noKeywords.length },
      { label: 'Posible canibalización (tags)', value: cannibalTags.length },
      { label: 'Evergreen para actualizar', value: stale.length },
    ];

    const recommendations: NiosRecommendation[] = [];

    if (noMeta.length > 0) {
      recommendations.push(rec(`${noMeta.length} noticias con meta description débil`, 'Pueden afectar CTR en buscadores.', 'high', 'Revisar y reescribir meta descriptions entre 80 y 160 caracteres.', 'seo', `${noMeta.length} artículos`));
    }

    if (noKeywords.length > 0) {
      recommendations.push(rec(`${noKeywords.length} noticias sin keywords`, 'Faltan palabras clave para SEO.', 'high', 'Asignar keywords relevantes antes de publicar.', 'seo', `${noKeywords.length} artículos`));
    }

    if (lowTraffic.length > 0) {
      recommendations.push(rec(`${lowTraffic.length} noticias recientes con bajo tráfico`, 'Publicadas hace menos de 30 días y bajo el 30% del promedio.', 'medium', 'Impulsar en redes, newsletter y enlaces internos.', 'seo', `${lowTraffic.length} artículos`));
    }

    if (stale.length > 0) {
      recommendations.push(rec(`${stale.length} noticias estancadas para actualizar`, 'Contenido con buen tráfico y sin actualización en 90 días.', 'medium', 'Actualizar datos, ampliar información y refrescar fecha.', 'seo', `${stale.length} artículos`));
    }

    if (cannibalTags.length > 0) {
      recommendations.push(rec('Etiquetas con posible canibalización', `${cannibalTags.length} tags cubiertos por más de 3 noticias.`, 'low', 'Consolidar en una guía o diferenciar los títulos.', 'seo'));
    }

    return {
      module: 'seo',
      status: recommendations.length ? 'opportunity' : 'ok',
      summary: `SEO: ${total} artículos analizados. Promedio vistas: ${avgViews}. Problemas principales: meta ${noMeta.length}, keywords ${noKeywords.length}, poco tráfico ${lowTraffic.length}.`,
      metrics,
      recommendations: sortByPriority(recommendations),
    };
  } catch (err) {
    return { module: 'seo', status: 'requires_attention', summary: 'Módulo SEO falló.', metrics: [], recommendations: [rec('Error en SEO', trackError('seo', err), 'critical', 'Revisar logs y conexión con Firestore.', 'seo')], errors: [trackError('seo', err)] };
  }
}
