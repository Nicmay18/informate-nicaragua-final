import type {
  CalidadModules,
  EditorialProfile,
  VeredictoEditorial,
} from './types';

const VEREDICT_ORDER: VeredictoEditorial[] = [
  'no_publicar',
  'publicar_breve',
  'publicar_estandar',
  'publicar_destacado',
  'portada',
  'cobertura_especial',
];

export interface Decision {
  scoreFinal: number;
  veredicto: VeredictoEditorial;
  calidad: {
    score: number;
    detalle: { modulo: string; score: number; peso: number }[];
  };
}

export function decide(
  modules: CalidadModules,
  profile: EditorialProfile,
  adsenseSeguro: boolean
): Decision {
  const weights = profile.scoreWeights;
  const detalle: { modulo: string; score: number; peso: number }[] = [
    { modulo: 'seo', score: modules.seo.score, peso: weights.seo },
    { modulo: 'eeat', score: modules.eeat.score, peso: weights.eeat },
    { modulo: 'discover', score: modules.discover.score, peso: weights.discover },
    { modulo: 'adsense', score: modules.adsense.score, peso: weights.adsense },
    { modulo: 'valorEditorial', score: modules.valorEditorial.score, peso: weights.valorEditorial },
  ];

  const totalWeight = detalle.reduce((acc, d) => acc + d.peso, 0);
  const scoreFinal =
    totalWeight > 0
      ? detalle.reduce((acc, d) => acc + d.score * d.peso, 0) / totalWeight
      : 0;

  const scoreRounded = Math.max(0, Math.min(100, Number(scoreFinal.toFixed(2))));

  // Gate 1: EEAT mínimo
  if (modules.eeat.score < profile.gates.eeatMinimo) {
    return {
      scoreFinal: scoreRounded,
      veredicto: 'no_publicar',
      calidad: { score: scoreRounded, detalle },
    };
  }

  // Gate 2: Adsense seguro (solo afecta el techo de veredicto)
  const indexByScore = resolveIndexByScore(scoreRounded, profile.editorialThreshold);
  let index = indexByScore;
  if (!adsenseSeguro) {
    const estandarIndex = VEREDICT_ORDER.indexOf('publicar_estandar');
    index = Math.min(index, estandarIndex);
  }

  const veredicto = VEREDICT_ORDER[index];

  return {
    scoreFinal: scoreRounded,
    veredicto,
    calidad: { score: scoreRounded, detalle },
  };
}

function resolveIndexByScore(
  score: number,
  thresholds: Record<VeredictoEditorial, number>
): number {
  const sorted = Object.entries(thresholds) as [VeredictoEditorial, number][];
  sorted.sort((a, b) => b[1] - a[1]);

  let best = 0;
  for (const [veredicto, threshold] of sorted) {
    const idx = VEREDICT_ORDER.indexOf(veredicto);
    if (idx === -1) continue;
    if (score >= threshold && idx > best) {
      best = idx;
    }
  }

  return best;
}
