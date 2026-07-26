/**
 * Metrics Collector — Learning Engine
 * ====================================
 * Recolecta métricas reales de Firestore: vistas, tráfico, distribución.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { ArticleMetrics, SourcePerformance } from './types';
import type { LearningConfig } from './types';

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: unknown }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }
  if (typeof val === 'object' && val !== null && '_seconds' in val) {
    return new Date((val as { _seconds: number })._seconds * 1000);
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function detectSource(referrer?: string, utmSource?: string): string {
  if (utmSource) return utmSource.toLowerCase().trim();
  if (!referrer) return 'directo';
  const r = referrer.toLowerCase();
  if (r.includes('facebook') || r.includes('fb.')) return 'facebook';
  if (r.includes('t.me') || r.includes('telegram')) return 'telegram';
  if (r.includes('whatsapp')) return 'whatsapp';
  if (r.includes('twitter') || r.includes('x.com') || r.includes('t.co')) return 'twitter';
  if (r.includes('google')) return 'google';
  if (r.includes('bing.com')) return 'bing';
  if (r.includes('duckduckgo')) return 'duckduckgo';
  if (r && !r.includes('nicaraguainformate')) return 'otro';
  return 'directo';
}

export async function collectArticleMetrics(
  db: Firestore,
  config: LearningConfig,
): Promise<ArticleMetrics[]> {
  const cutoff = new Date(Date.now() - config.daysToAnalyze * 24 * 60 * 60 * 1000);
  const snap = await db.collection('noticias').get();

  const articles: ArticleMetrics[] = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const fecha = parseDate(d.fecha);
    if (!fecha || fecha < cutoff) continue;

    const vistas = typeof d.vistas === 'number' ? d.vistas : 0;
    const imagen = d.imagen || d.imagenDestacada || '';
    const tieneImagen = !!imagen && (imagen.startsWith('http') || imagen.startsWith('/images/') || imagen.startsWith('images/'));
    const resumen = (d.resumen || '').replace(/<[^>]*>/g, ' ').trim();
    const tieneResumen = resumen.length > 30;
    const distribuida = d.distribuida === true || d.distribuida === 'true' || d.distribuida === 1 || !!d.fechaDistribucion;

    articles.push({
      articleId: doc.id,
      slug: d.slug || '',
      titulo: d.titulo || '',
      categoria: d.categoria || 'General',
      departamento: d.departamento || '',
      autor: d.autor || '',
      vistas,
      palabras: typeof d.palabras === 'number' ? d.palabras : 0,
      scoreMeni: typeof d.scoreMeni === 'number' ? d.scoreMeni : (typeof d.scoreCalidad === 'number' ? d.scoreCalidad : 0),
      aprobadoMeni: d.aprobadoMeni ?? true,
      fecha: fecha.toISOString(),
      fechaPublicacion: fecha.toISOString(),
      tieneImagen,
      tieneResumen,
      fuentePrincipal: 'directo',
      distribuida,
    });
  }

  return articles;
}

export async function collectTrafficSources(
  db: Firestore,
  config: LearningConfig,
): Promise<SourcePerformance[]> {
  const cutoff = new Date(Date.now() - config.daysToAnalyze * 24 * 60 * 60 * 1000);

  try {
    const snap = await db
      .collection('traffic_log')
      .where('timestamp', '>=', cutoff)
      .limit(5000)
      .get();

    const sourceMap = new Map<string, { visits: number; articles: Set<string> }>();

    for (const doc of snap.docs) {
      const d = doc.data();
      const source = detectSource(d.referrer, d.utmSource);
      const existing = sourceMap.get(source) || { visits: 0, articles: new Set<string>() };
      existing.visits++;
      if (d.slug) existing.articles.add(d.slug);
      sourceMap.set(source, existing);
    }

    const totalVisits = Array.from(sourceMap.values()).reduce((sum, s) => sum + s.visits, 0) || 1;

    return Array.from(sourceMap.entries())
      .map(([fuente, data]) => ({
        fuente,
        visitas: data.visits,
        articulosUnicos: data.articles.size,
        visitasPorArticulo: data.articles.size > 0 ? Math.round(data.visits / data.articles.size) : 0,
        porcentajeTotal: Math.round((data.visits / totalVisits) * 100),
      }))
      .sort((a, b) => b.visitas - a.visitas);
  } catch {
    return [];
  }
}

export async function collectDistributionStats(
  db: Firestore,
  config: LearningConfig,
): Promise<{ totalDistribuciones: number; canalStats: Record<string, { exitosos: number; fallidos: number }> }> {
  const cutoff = new Date(Date.now() - config.daysToAnalyze * 24 * 60 * 60 * 1000);

  try {
    const snap = await db
      .collection('distribuciones')
      .orderBy('fecha', 'desc')
      .limit(500)
      .get();

    const canalStats: Record<string, { exitosos: number; fallidos: number }> = {};
    let totalDistribuciones = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      const fecha = parseDate(d.fecha);
      if (!fecha || fecha < cutoff) continue;

      totalDistribuciones++;
      const resultados = d.resultados || {};
      for (const [canal, data] of Object.entries(resultados)) {
        if (!canalStats[canal]) canalStats[canal] = { exitosos: 0, fallidos: 0 };
        if ((data as { ok?: boolean }).ok) canalStats[canal].exitosos++;
        else canalStats[canal].fallidos++;
      }
    }

    return { totalDistribuciones, canalStats };
  } catch {
    return { totalDistribuciones: 0, canalStats: {} };
  }
}
