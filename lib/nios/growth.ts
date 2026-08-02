import { getGrowthMetrics } from '@/lib/growth';
import type { NiosModuleReport, NiosRecommendation } from './types';
import { emptyModule, rec, sortByPriority } from './utils';

export async function runGrowthIntelligence(): Promise<NiosModuleReport> {
  try {
    const m = await getGrowthMetrics();
    const recommendations: NiosRecommendation[] = [];

    if (m.errors.length > 0) {
      return {
        module: 'growth',
        status: 'requires_attention',
        summary: `Crecimiento: ${m.totalNews} noticias activas, ${m.totalViews.toLocaleString('es-NI')} vistas, ${m.recentVisits} visitas recientes. Se detectaron errores en fuentes de datos.`,
        metrics: [
          { label: 'Noticias activas', value: m.totalNews },
          { label: 'Vistas totales', value: m.totalViews },
          { label: 'Vistas promedio', value: m.avgViews },
          { label: 'Visitas últimas 24h', value: m.recentVisits },
          { label: 'Fuentes de tráfico', value: Object.keys(m.trafficSources).join(', ') || '—' },
        ],
        recommendations: m.errors.map((e) => rec('Error en fuente de crecimiento', e, 'high', 'Revisar conexión Firestore y permisos del SDK.', 'growth')),
        errors: m.errors,
      };
    }

    const trafficKeys = Object.keys(m.trafficSources);
    if (m.recentVisits === 0 && m.totalNews > 0) {
      recommendations.push(rec('Sin tráfico reciente', 'No se registraron visitas en las últimas 24 horas.', 'critical', 'Revisar trackeo de traffic_log y lanzar una distribución de noticias del día.', 'growth'));
    }

    if (m.totalNews > 0 && m.avgViews === 0) {
      recommendations.push(rec('Promedio de vistas en cero', 'Las noticias activas tienen 0 vistas promedio.', 'critical', 'Verificar contador de vistas y logs de tráfico.', 'growth'));
    }

    if (m.totalNews > 100 && m.avgViews < 5) {
      recommendations.push(rec('Bajo promedio de vistas', `Con ${m.totalNews} noticias, el promedio es ${m.avgViews}. Hay oportunidad de distribuir mejor el contenido.`, 'high', 'Priorizar distribución de noticias con score > 80 o categoría Nacionales.', 'growth'));
    }

    if (trafficKeys.length === 0) {
      recommendations.push(rec('No hay fuentes de tráfico identificadas', 'Falta UTM/referrer en los enlaces compartidos.', 'medium', 'Agregar parámetros UTM a distribución social y newsletter.', 'growth'));
    } else {
      const topSource = trafficKeys.sort((a, b) => m.trafficSources[b] - m.trafficSources[a])[0];
      if (topSource && m.trafficSources[topSource] > m.recentVisits * 0.7) {
        recommendations.push(rec(`Tráfico concentrado en ${topSource}`, `El ${Math.round((m.trafficSources[topSource] / Math.max(m.recentVisits, 1)) * 100)}% del tráfico proviene de una sola fuente.`, 'medium', 'Diversificar distribución a WhatsApp, Telegram y newsletter.', 'growth'));
      }
    }

    if (m.mostRead && m.mostRead.vistas < 10) {
      recommendations.push(rec('Noticia más leída con pocas vistas', `${m.mostRead.titulo} lidera con solo ${m.mostRead.vistas} vistas.`, 'high', 'Impulsar la noticia más leída en redes y newsletter.', 'growth'));
    }

    return {
      module: 'growth',
      status: recommendations.length ? 'opportunity' : 'ok',
      summary: `Crecimiento: ${m.totalNews} noticias, ${m.totalViews.toLocaleString('es-NI')} vistas totales, promedio ${m.avgViews}. Fuentes: ${trafficKeys.join(', ') || '—'}.`,
      metrics: [
        { label: 'Noticias activas', value: m.totalNews },
        { label: 'Vistas totales', value: m.totalViews },
        { label: 'Vistas promedio', value: m.avgViews },
        { label: 'Visitas últimas 24h', value: m.recentVisits },
        { label: 'Noticia más leída', value: m.mostRead ? m.mostRead.titulo : '—' },
      ],
      recommendations: sortByPriority(recommendations),
    };
  } catch (err) {
    return { ...emptyModule('growth', 'Módulo de crecimiento falló al ejecutarse.', 'requires_attention'), errors: [err instanceof Error ? err.message : String(err)] };
  }
}
