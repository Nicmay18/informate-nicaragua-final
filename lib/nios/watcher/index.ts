import type { Noticia } from '@/lib/types';
import { runCategoryHealth } from '../category-health';
import { runSeoCleanup } from '../seo-cleanup';
import { buildKnowledgeGraph } from '../knowledge-graph';
import { runContentIntelligence } from '../content-intelligence';

export interface NiosAlert {
  id: string;
  type: string;
  priority: 'critical' | 'medium';
  reason: string;
  impact: string;
  action: string;
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function runWatcher(noticias: Noticia[]): NiosAlert[] {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const alerts: NiosAlert[] = [];
  const { health } = runCategoryHealth(noticias);
  const totalViews = published.reduce((s, n) => s + (n.vistas || 0), 0);
  const seo = runSeoCleanup(noticias);
  const graph = buildKnowledgeGraph(noticias);
  const ci = runContentIntelligence(noticias);

  // tráfico desbalanceado por categoría
  const viewsByCat: Record<string, number> = {};
  for (const n of published) {
    viewsByCat[n.categoria] = (viewsByCat[n.categoria] || 0) + (n.vistas || 0);
  }
  for (const [cat, views] of Object.entries(viewsByCat)) {
    if (totalViews > 0 && (views / totalViews) > 0.45) {
      alerts.push({
        id: `watch-overweight-${cat}`,
        type: 'Tráfico desbalanceado',
        priority: 'critical',
        reason: `${cat} representa el ${Math.round((views / totalViews) * 100)}% del tráfico.`,
        impact: 'Falta diversidad editorial y mayor riesgo comercial.',
        action: `Planificar más contenido en otras categorías.`,
      });
    }
  }

  // categoría débil
  for (const [cat, h] of Object.entries(health)) {
    if (h.level === 'bajo') {
      alerts.push({
        id: `watch-weak-${cat}`,
        type: 'Categoría débil',
        priority: 'medium',
        reason: `${cat} solo tiene ${h.count7} noticia${h.count7 === 1 ? '' : 's'} en 7 días.`,
        impact: 'Pérdida de presencia en portada y SEO.',
        action: `Publicar 1-2 notas en ${cat}.`,
      });
    }
  }

  // noticias sin distribución (hoy)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = published.filter((n) => toDate(n.fecha).getTime() >= todayStart.getTime());
  if (today.length > 0) {
    alerts.push({
      id: 'watch-dist-today',
      type: 'Distribución pendiente',
      priority: 'critical',
      reason: `${today.length} noticia${today.length === 1 ? '' : 's'} publicada${today.length === 1 ? '' : 's'} hoy sin confirmación de distribución.`,
      impact: 'Tráfico social no aprovechado.',
      action: 'Distribuir en Facebook, Telegram, WhatsApp y Newsletter.',
    });
  }

  // noticias importantes sin enlaces
  const important = published.filter((n) => (n.vistas || 0) >= 20 && !(n.related_links && n.related_links.length > 0));
  if (important.length > 0) {
    alerts.push({
      id: 'watch-links',
      type: 'Enlaces internos',
      priority: 'critical',
      reason: `${important.length} noticia${important.length === 1 ? '' : 's'} con tráfico y sin enlaces internos.`,
      impact: 'Pérdida de PageRank y contexto para el lector.',
      action: 'Agregar 2-3 enlaces internos a contenido relacionado.',
    });
  }

  // noticias creciendo rápido
  const growing = ci.growing.length;
  if (growing > 0) {
    alerts.push({
      id: 'watch-growing',
      type: 'Noticias creciendo',
      priority: 'medium',
      reason: `${growing} noticia${growing === 1 ? '' : 's'} reciente con pico de vistas.`,
      impact: 'Oportunidad de re-distribución y posicionamiento.',
      action: 'Impulsar de nuevo y considerar seguimiento.',
    });
  }

  // problemas SEO
  if (seo.total > 10) {
    alerts.push({
      id: 'watch-seo',
      type: 'SEO',
      priority: 'critical',
      reason: `${seo.total} problemas SEO pendientes.`,
      impact: 'CTR e indexación afectados.',
      action: 'Revisar títulos, metas, autores e imágenes.',
    });
  }

  // entidades con cobertura creciente
  const hotEntities = graph.entities.filter((e) => e.count >= 5).slice(0, 3);
  for (const e of hotEntities) {
    alerts.push({
      id: `watch-entity-${e.id}`,
      type: 'Entidad activa',
      priority: 'medium',
      reason: `${e.name} aparece en ${e.count} noticias.`,
      impact: 'Tema con momentum.',
      action: `Crear seguimiento o especial sobre ${e.name}.`,
    });
  }

  return alerts;
}
