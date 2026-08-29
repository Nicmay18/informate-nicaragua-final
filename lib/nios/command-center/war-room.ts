import type { Noticia } from '@/lib/types';
import type { ContentWarRoom, EditorialBalance, WarRoomSlot } from './types';

const DAY = 24 * 60 * 60 * 1000;

function toTime(v: unknown): number {
  if (v instanceof Date) return isNaN(v.getTime()) ? Date.now() : v.getTime();
  if (typeof v === 'string' && v.trim()) {
    const t = new Date(v).getTime();
    return isNaN(t) ? Date.now() : t;
  }
  return Date.now();
}

interface SlotTemplate {
  category: string;
  format: string;
  brief: string;
  priority: WarRoomSlot['priority'];
  conditional?: string;
}

const BASE_PLAN: SlotTemplate[] = [
  {
    category: 'Nacionales',
    format: 'Nota profunda',
    brief: 'Un tema nacional con contexto, cifras y consecuencia para el ciudadano. Mínimo 600 palabras.',
    priority: 'critica',
  },
  {
    category: 'Internacionales',
    format: 'Explicador',
    brief: 'Un hecho internacional explicado desde su impacto en Nicaragua: precios, migración o comercio.',
    priority: 'alta',
  },
  {
    category: 'Tecnología',
    format: 'Pieza útil',
    brief: 'Contenido de servicio: cómo usar, cómo protegerse, cuánto cuesta. Debe resolver algo concreto.',
    priority: 'alta',
  },
  {
    category: 'Deportes',
    format: 'Cobertura',
    brief: 'Resultado o figura nacional con datos. Preferir protagonistas nicaragüenses.',
    priority: 'media',
  },
  {
    category: 'Sucesos',
    format: 'Nota condicional',
    brief: 'Publicar solo si hay interés público real: responsabilidad institucional, prevención o patrón.',
    priority: 'baja',
    conditional: 'Solo si tiene relevancia y no repite el patrón del día anterior.',
  },
];

/**
 * Convierte el diagnóstico de balance en un plan de producción del día.
 * No dice "publicar noticias": dice qué pieza, de qué tipo y por qué.
 */
export function buildContentWarRoom(
  noticias: Noticia[],
  balance: EditorialBalance,
  now = new Date()
): ContentWarRoom {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const since = now.getTime() - 7 * DAY;
  const recent = published.filter((n) => toTime(n.fecha) > since);

  const recentByCategory: Record<string, number> = {};
  for (const n of recent) {
    recentByCategory[n.categoria] = (recentByCategory[n.categoria] || 0) + 1;
  }

  const balanceByCategory = new Map(balance.categories.map((c) => [c.category, c]));

  const slots: WarRoomSlot[] = BASE_PLAN.map((tpl, i) => {
    const cat = balanceByCategory.get(tpl.category);
    const recentCount = recentByCategory[tpl.category] || 0;

    let priority = tpl.priority;
    let reason = `${recentCount} pieza${recentCount === 1 ? '' : 's'} en los últimos 7 días.`;

    if (cat?.status === 'deficitario') {
      priority = 'critica';
      reason = `Déficit editorial: ${cat.share}% publicado frente a un objetivo de ${cat.target}%.`;
    } else if (cat?.status === 'excedido') {
      priority = 'baja';
      reason = `Ya está sobrerrepresentada (${cat.share}% frente a ${cat.target}% objetivo). Reducir volumen.`;
    } else if (recentCount === 0) {
      priority = 'alta';
      reason = 'Sin cobertura en la última semana. Riesgo editorial de pérdida de relevancia; no concluye penalización de Google.';
    }

    const conditional =
      tpl.category === 'Sucesos' && cat?.status === 'excedido'
        ? 'Sucesos ya domina la mezcla. Publicar solo si es un hecho de interés público ineludible.'
        : tpl.conditional;

    return {
      id: `slot-${i}-${tpl.category.toLowerCase()}`,
      category: tpl.category,
      format: tpl.format,
      brief: tpl.brief,
      reason,
      priority,
      conditional,
    };
  });

  const order: Record<WarRoomSlot['priority'], number> = { critica: 0, alta: 1, media: 2, baja: 3 };
  slots.sort((a, b) => order[a.priority] - order[b.priority]);

  const rationale: string[] = [];
  rationale.push(`Plan calculado sobre ${recent.length} publicaciones de los últimos 7 días.`);
  if (balance.dominant) {
    rationale.push(`Categoría dominante actual: ${balance.dominant}.`);
  }
  for (const alert of balance.alerts.slice(0, 2)) {
    rationale.push(alert);
  }
  if (rationale.length === 1) {
    rationale.push('La mezcla está equilibrada: mantener el ritmo y subir profundidad.');
  }

  return {
    date: now.toLocaleDateString('es-NI', { dateStyle: 'long' }),
    slots,
    rationale,
  };
}
