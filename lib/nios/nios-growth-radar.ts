/**
 * NIOS Growth Radar
 * =================
 * Detecta oportunidades reales a partir de GSC, GA4 y artículos en Firestore.
 * No inventa datos. Solo señala patrones observables.
 */

import type { NiosExecutiveData } from './executive-center';
import type { GSCQueryRow } from './intelligence/types';

export interface NiosGrowthOpportunity {
  kind: 'seo-query' | 'seo-page' | 'content-momentum' | 'content-recirculation' | 'distribution';
  title: string;
  evidence: string;
  action: string;
  expectedResult: string;
  confidence: 'Alta' | 'Media' | 'Baja';
  impact: 'Alto' | 'Medio' | 'Bajo';
}

function impactFromClicks(clicks: number): 'Alto' | 'Medio' | 'Bajo' {
  if (clicks >= 50) return 'Alto';
  if (clicks >= 10) return 'Medio';
  return 'Bajo';
}

export function findTopOpportunities(data: NiosExecutiveData, limit = 5): NiosGrowthOpportunity[] {
  const opportunities: NiosGrowthOpportunity[] = [];

  // 1. GSC queries con muchas impresiones y bajo CTR
  if (data.gsc?.status === 'REAL' && data.gsc.queries?.length) {
    const lowCtr = data.gsc.queries
      .filter((q: GSCQueryRow) => q.impressions >= 100 && q.ctr < 0.02)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, limit);

    lowCtr.forEach((q: GSCQueryRow) => {
      opportunities.push({
        kind: 'seo-query',
        title: `Mejorar CTR para "${q.query}"`,
        evidence: `${q.impressions} impresiones · ${q.clicks} clics · CTR ${(q.ctr * 100).toFixed(1)}%`,
        action: 'Revisar título y meta description del artículo que rankea.',
        expectedResult: 'Aumentar clics sin crear contenido nuevo.',
        confidence: q.impressions >= 500 ? 'Alta' : 'Media',
        impact: impactFromClicks(q.clicks),
      });
    });
  }

  // 2. Páginas con impresiones pero pocos clics
  if (data.gsc?.status === 'REAL' && data.gsc.pages?.length) {
    const lowPages = data.gsc.pages
      .filter((p) => p.impressions >= 100 && p.ctr < 0.02)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, limit);

    lowPages.forEach((p) => {
      opportunities.push({
        kind: 'seo-page',
        title: `Optimizar título de ${p.url.split('/').pop() || p.url}`,
        evidence: `${p.impressions} impresiones · ${p.clicks} clics · posición ${p.position.toFixed(1)}`,
        action: 'Actualizar título y mejorar intención de búsqueda.',
        expectedResult: 'Subir CTR y posición promedio.',
        confidence: 'Media',
        impact: impactFromClicks(p.clicks),
      });
    });
  }

  // 3. Artículos con momentum positivo
  if (data.topMovingArticles?.length) {
    data.topMovingArticles
      .filter((a) => a.level === 'ACTIONABLE' && a.delta > 0)
      .slice(0, limit)
      .forEach((a) => {
        opportunities.push({
          kind: 'content-momentum',
          title: `Impulsar "${a.slug}"`,
          evidence: `${a.trend} +${a.delta} vistas · fuente ${a.attribution?.source || 'desconocida'}`,
          action: 'Redistribuir en Telegram/Facebook y agregar enlaces internos.',
          expectedResult: 'Mantener o acelerar crecimiento de vistas.',
          confidence: 'Media',
          impact: a.delta >= 50 ? 'Alto' : 'Medio',
        });
      });
  }

  // 4. Artículos históricos con muchas vistas que pueden recircularse
  if (data.topLifetimeArticles?.length && opportunities.length < limit) {
    data.topLifetimeArticles.slice(0, limit - opportunities.length).forEach((a) => {
      opportunities.push({
        kind: 'content-recirculation',
        title: `Recircular "${a.titulo || a.slug}"`,
        evidence: `${a.vistas ?? 0} vistas acumuladas.`,
        action: 'Republicar en redes o reenviar resumen diario.',
        expectedResult: 'Recuperar tráfico de contenido probado.',
        confidence: 'Alta',
        impact: (a.vistas ?? 0) >= 1000 ? 'Alto' : 'Medio',
      });
    });
  }

  // 5. Oportunidades declaradas por el snapshot
  const declared = (data.contentOpportunity as any)?.opportunities;
  if (declared?.length) {
    declared.slice(0, limit).forEach((o: any) => {
      if (opportunities.length >= limit) return;
      opportunities.push({
        kind: 'seo-query',
        title: `Cubrir oportunidad "${o.query || o.tema || 'detectada'}"`,
        evidence: o.reason || 'Detectada por el radar de contenido.',
        action: o.suggestedAction || 'Crear o actualizar artículo.',
        expectedResult: 'Captar tráfico de búsqueda emergente.',
        confidence: 'Media',
        impact: 'Medio',
      });
    });
  }

  return opportunities.slice(0, limit);
}
