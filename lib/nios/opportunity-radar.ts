import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';

export interface NiosOpportunity {
  id: string;
  topic: string;
  reason: string;
  action: string;
  type: 'categoría' | 'guía' | 'noticia';
  priority: 'high' | 'medium';
}

const EVERGREEN_TRIGGERS = [
  'cómo',
  'requisitos',
  'pasos',
  'guía',
  'costo',
  'dólar',
  'salario',
  'pasaporte',
  'apostilla',
  'récord policial',
  'migración',
  'turismo',
  'destinos',
];

const COMMERCIAL_CATEGORIES = [
  'Trámites',
  'Turismo',
  'Economía',
  'Tecnología',
  'Migración',
  'Salud',
  'Educación',
];

export function runOpportunityRadar(
  noticias: Noticia[],
  guides: EvergreenArticle[]
): NiosOpportunity[] {
  const opportunities: NiosOpportunity[] = [];

  const counts: Record<string, number> = {};
  for (const n of noticias) {
    if (n.estado === 'borrador' || n.estado === 'archivado') continue;
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
  }

  // Categorías débiles con potencial
  for (const cat of COMMERCIAL_CATEGORIES) {
    const count = counts[cat] || 0;
    if (count < 3) {
      opportunities.push({
        id: `opp-cat-${cat}`,
        topic: cat,
        reason: `Solo ${count} noticias recientes. Tiene intención de búsqueda recurrente en el medio.`,
        action: `Publicar 1 nota o guía sobre ${cat} en los próximos 7 días.`,
        type: 'categoría',
        priority: 'high',
      });
    }
  }

  // Noticias con alto tráfico o palabras clave de guía
  const candidates = noticias
    .filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado')
    .filter((n) => {
      const text = `${n.titulo} ${n.resumen}`.toLowerCase();
      return EVERGREEN_TRIGGERS.some((k) => text.includes(k));
    })
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0));

  for (const n of candidates.slice(0, 5)) {
    if (!opportunities.some((o) => o.topic === n.titulo)) {
      opportunities.push({
        id: `opp-news-${n.slug}`,
        topic: n.titulo,
        reason: 'Tema recurrente con alto interés potencial; puede convertirse en guía evergreen.',
        action: 'Crear una guía derivada o actualizar la nota para que sirva como referencia permanente.',
        type: 'noticia',
        priority: n.vistas && n.vistas >= 80 ? 'high' : 'medium',
      });
    }
  }

  // Guías ausentes por categoría comercial
  const guideCategories = new Set(guides.map((g) => g.category));
  for (const cat of COMMERCIAL_CATEGORIES) {
    if (!guideCategories.has(cat)) {
      opportunities.push({
        id: `opp-guide-${cat}`,
        topic: `Guía de ${cat}`,
        reason: 'No existe una guía evergreen en esta categoría de alto interés comercial.',
        action: `Crear guía canónica "${cat} Nicaragua 2026" para el Centro Útil.`,
        type: 'guía',
        priority: 'medium',
      });
    }
  }

  return opportunities.slice(0, 8);
}
