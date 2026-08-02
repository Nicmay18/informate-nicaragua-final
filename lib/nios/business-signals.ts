import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';

export interface BusinessSignal {
  id: string;
  category: string;
  reason: string;
  contentCount: number;
  traffic: number;
  potential: 'alto' | 'medio';
}

const COMMERCIAL_VERTICALS: Record<string, string[]> = {
  'Trámites': ['servicios legales', 'asesoría migratoria', 'documentación consular'],
  'Turismo': ['hoteles', 'agencias de viaje', 'tours'],
  'Economía': ['banca', 'remesas', 'asesoría financiera'],
  'Tecnología': ['cursos', 'apps', 'e-commerce'],
  'Deportes': ['marcas deportivas', 'eventos', 'patrocinio'],
  'Migración': ['remesas', 'consultoría migratoria', 'legalización'],
  'Salud': ['clínicas', 'seguros médicos', 'farmacia'],
  'Educación': ['cursos', 'universidades', 'capacitación'],
};

export function runBusinessSignals(
  noticias: Noticia[],
  guides: EvergreenArticle[]
): BusinessSignal[] {
  const signals: BusinessSignal[] = [];
  const counts: Record<string, number> = {};
  const traffic: Record<string, number> = {};

  for (const n of noticias) {
    if (n.estado === 'borrador' || n.estado === 'archivado') continue;
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
    traffic[n.categoria] = (traffic[n.categoria] || 0) + (n.vistas || 0);
  }

  for (const [cat, verticals] of Object.entries(COMMERCIAL_VERTICALS)) {
    const contentCount = (counts[cat] || 0) + guides.filter((g) => g.category === cat).length;
    const catTraffic = traffic[cat] || 0;

    if (contentCount >= 3 || catTraffic >= 50) {
      signals.push({
        id: `biz-${cat}`,
        category: cat,
        reason: `${verticals.join(', ')}. Contenido con intención comercial: ${contentCount} piezas.`,
        contentCount,
        traffic: catTraffic,
        potential: catTraffic >= 100 ? 'alto' : 'medio',
      });
    }
  }

  // Señales por guía de alto tráfico
  for (const g of guides) {
    if (g.category === 'Deportes' && g.slug.includes('beisbol')) {
      signals.push({
        id: `biz-guide-${g.slug}`,
        category: 'Guía: ' + g.category,
        reason: 'Contenido permanente con alto interés de búsqueda y patrocinio deportivo.',
        contentCount: 1,
        traffic: 0,
        potential: 'medio',
      });
    }
  }

  return signals.slice(0, 6);
}
