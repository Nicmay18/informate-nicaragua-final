import type { Noticia } from '@/lib/types';
import { TARGET_MIX, OTHERS_TARGET } from './constants';
import type { CategoryBalance, EditorialBalance } from './types';

function share(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

/**
 * Compara la distribución real de contenido contra la mezcla editorial
 * objetivo y mide cuánto se aleja la identidad del medio de su plan.
 */
export function buildEditorialBalance(noticias: Noticia[]): EditorialBalance {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const total = published.length;

  const counts: Record<string, number> = {};
  for (const n of published) {
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
  }

  const categories: CategoryBalance[] = [];
  const alerts: string[] = [];

  for (const [category, { target, max }] of Object.entries(TARGET_MIX)) {
    const count = counts[category] || 0;
    const actual = share(count, total);
    const ceiling = max ?? target;
    const deviation = Math.round((actual - target) * 10) / 10;

    let status: CategoryBalance['status'] = 'equilibrado';
    let verdict = `En línea con el objetivo de ${target}%.`;

    if (max !== undefined && actual > max) {
      status = 'excedido';
      verdict = `Supera el techo permitido de ${max}%.`;
    } else if (deviation > 8) {
      status = 'excedido';
      verdict = `${deviation.toFixed(1)} puntos por encima del objetivo.`;
    } else if (deviation < -8) {
      status = 'deficitario';
      verdict = `${Math.abs(deviation).toFixed(1)} puntos por debajo del objetivo.`;
    }

    categories.push({ category, count, share: actual, target, maxShare: max, deviation, status, verdict });

    if (status === 'excedido' && actual > ceiling) {
      alerts.push(
        category === 'Sucesos'
          ? `Sucesos genera tráfico pero domina demasiado la identidad editorial (${actual}% frente a un techo de ${ceiling}%).`
          : `${category} ocupa ${actual}% del volumen, por encima del objetivo de ${target}%.`
      );
    }
    if (status === 'deficitario') {
      alerts.push(`${category} está en ${actual}% cuando debería rondar el ${target}%. Falta cobertura.`);
    }
  }

  const trackedCategories = new Set(Object.keys(TARGET_MIX));
  const othersCount = Object.entries(counts)
    .filter(([cat]) => !trackedCategories.has(cat))
    .reduce((sum, [, c]) => sum + c, 0);
  const othersShare = share(othersCount, total);

  categories.push({
    category: 'Otros',
    count: othersCount,
    share: othersShare,
    target: OTHERS_TARGET,
    deviation: Math.round((othersShare - OTHERS_TARGET) * 10) / 10,
    status: othersShare > OTHERS_TARGET + 8 ? 'excedido' : 'equilibrado',
    verdict: `Categorías fuera del plan editorial (${othersCount} piezas).`,
  });

  const dominantEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dominant = dominantEntry ? dominantEntry[0] : null;

  // La identidad se penaliza por la desviación absoluta total contra el plan.
  const totalDeviation = categories.reduce((sum, c) => sum + Math.abs(c.deviation), 0);
  const identityScore = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - totalDeviation * 1.2)));

  let verdict: string;
  if (total === 0) {
    verdict = 'Sin contenido publicado para evaluar la identidad editorial.';
  } else if (identityScore >= 80) {
    verdict = 'La mezcla editorial refleja la identidad planificada del medio.';
  } else if (identityScore >= 55) {
    verdict = 'La identidad editorial es reconocible pero se está desviando del plan.';
  } else {
    verdict = 'El medio está publicando algo distinto a lo que dice ser. Corregir la mezcla es prioridad.';
  }

  return { total, categories, identityScore, dominant, alerts, verdict };
}
