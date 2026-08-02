import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { runBusinessV3 } from '../business';

export interface BusinessBrainSignal {
  name: string;
  type: 'categoría' | 'guía' | 'tema';
  potential: 'alto' | 'medio' | 'bajo';
  reason: string;
  actions: string[];
}

const HIGH_VALUE_TOPICS = ['migración', 'pasaporte', 'apostilla', 'turismo', 'tecnología', 'educación', 'trámites', 'dólar', 'salario'];

export function runBusinessBrain(noticias: Noticia[], guides: EvergreenArticle[] = []): BusinessBrainSignal[] {
  const business = runBusinessV3(noticias, guides);
  const signals: BusinessBrainSignal[] = [];

  for (const c of business.profitableCategories.slice(0, 5)) {
    const potential: BusinessBrainSignal['potential'] = Number(c.value) > 100 ? 'alto' : Number(c.value) > 50 ? 'medio' : 'bajo';
    signals.push({
      name: c.name,
      type: 'categoría',
      potential,
      reason: `${c.value} vistas acumuladas. Categoría patrocinable.`,
      actions: ['Buscar patrocinador', 'Crear contenido premium'],
    });
  }

  for (const t of business.commercialTopics.slice(0, 10)) {
    const high = HIGH_VALUE_TOPICS.some((h) => t.name.includes(h));
    const potential: BusinessBrainSignal['potential'] = high ? 'alto' : Number(t.value) >= 5 ? 'medio' : 'bajo';
    signals.push({
      name: t.name,
      type: 'tema',
      potential,
      reason: `${t.value} noticias. Tema comercial con intención de búsqueda.`,
      actions: high ? ['Crear guía afiliada', 'Newsletter dedicada'] : ['Cubrir más frecuentemente'],
    });
  }

  for (const g of business.valuableGuides.slice(0, 5)) {
    signals.push({
      name: g.name,
      type: 'guía',
      potential: 'alto',
      reason: 'Tráfico permanente y recurrente.',
      actions: ['Actualizar', 'Crear PDF descargable', 'Enlace afiliado'],
    });
  }

  return signals.sort((a, b) => (a.potential === 'alto' ? 3 : a.potential === 'medio' ? 2 : 1) - (b.potential === 'alto' ? 3 : b.potential === 'medio' ? 2 : 1));
}
