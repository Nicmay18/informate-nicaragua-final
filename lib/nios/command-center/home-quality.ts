import type { Noticia } from '@/lib/types';
import { rankNoticias } from '@/lib/home-ranking';
import { BRAND_PRIORITY, BRAND_SLOTS, HOME_CATEGORY_CAP } from './constants';
import type { HomeQuality, HomeSlotAudit } from './types';

const HOME_WINDOW = 20;

/**
 * Audita la portada tal como la produce el Home Ranking Engine.
 * No modifica el ranking: lo evalúa contra las reglas de marca.
 */
export function buildHomeQuality(noticias: Noticia[]): HomeQuality {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');

  if (published.length === 0) {
    return {
      score: 0,
      analyzed: 0,
      dominantCategory: null,
      dominantShare: 0,
      brandSlots: [],
      violations: ['No hay noticias publicadas para construir la portada.'],
      verdict: 'Portada vacía.',
    };
  }

  const ranked = rankNoticias(published).slice(0, HOME_WINDOW);

  const counts: Record<string, number> = {};
  for (const n of ranked) {
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
  }

  const dominantEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dominantCategory = dominantEntry ? dominantEntry[0] : null;
  const dominantShare = dominantEntry ? Math.round((dominantEntry[1] / ranked.length) * 1000) / 10 : 0;

  const brandSlots: HomeSlotAudit[] = ranked.slice(0, BRAND_SLOTS).map((n, i) => {
    const rank = BRAND_PRIORITY.indexOf(n.categoria);
    const onBrand = rank !== -1;
    return {
      position: i + 1,
      title: n.titulo,
      category: n.categoria,
      slug: n.slug,
      onBrand,
      note: onBrand
        ? `Representa la marca (prioridad ${rank + 1} de ${BRAND_PRIORITY.length}).`
        : `${n.categoria} no pertenece a la vitrina de marca. Debería ceder la posición.`,
    };
  });

  const violations: string[] = [];

  if (dominantCategory && dominantShare > HOME_CATEGORY_CAP) {
    violations.push(
      `${dominantCategory} ocupa el ${dominantShare}% de la portada, por encima del máximo permitido de ${HOME_CATEGORY_CAP}%.`
    );
  }

  const offBrand = brandSlots.filter((s) => !s.onBrand);
  if (offBrand.length > 0) {
    violations.push(
      `${offBrand.length} de las primeras ${BRAND_SLOTS} posiciones no representan la marca (${offBrand.map((s) => s.category).join(', ')}).`
    );
  }

  const sucesosInTop3 = ranked.slice(0, 3).filter((n) => n.categoria === 'Sucesos').length;
  if (sucesosInTop3 >= 2) {
    violations.push('Dos o más Sucesos en el top 3. La portada comunica nota roja, no periodismo nacional.');
  }

  const missingBrand = BRAND_PRIORITY.filter((c) => !counts[c]);
  if (missingBrand.length >= 4) {
    violations.push(`Sin presencia en portada de: ${missingBrand.join(', ')}.`);
  }

  const capPenalty = Math.max(0, dominantShare - HOME_CATEGORY_CAP) * 1.5;
  const brandPenalty = offBrand.length * 8;
  const sucesosPenalty = sucesosInTop3 >= 2 ? 15 : 0;
  const coveragePenalty = missingBrand.length * 3;
  const score = Math.max(0, Math.min(100, Math.round(100 - capPenalty - brandPenalty - sucesosPenalty - coveragePenalty)));

  let verdict: string;
  if (score >= 80) {
    verdict = 'La portada comunica un medio nacional serio.';
  } else if (score >= 55) {
    verdict = 'La portada funciona pero cede demasiado espacio al tráfico fácil.';
  } else {
    verdict = 'La portada no representa la marca. Un lector nuevo no entendería qué medio es este.';
  }

  return {
    score,
    analyzed: ranked.length,
    dominantCategory,
    dominantShare,
    brandSlots,
    violations,
    verdict,
  };
}
