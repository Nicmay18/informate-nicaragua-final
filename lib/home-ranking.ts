import type { Noticia } from '@/lib/types';

const CATEGORY_BOOST: Record<string, number> = {
  Nacionales: 1.0,
  Sucesos: 0.55,
  Deportes: 0.70,
  Internacionales: 0.65,
  Tecnología: 0.55,
  Espectáculos: 0.50,
};

const NATIONAL_KEYWORDS = [
  'nicaragua',
  'managua',
  'gobierno',
  'sandino',
  'administración',
  'ministerio',
  'alcalde',
  'combustible',
  'dólar',
  'córdoba',
  'salario',
  'pensiones',
  'salud',
  'educación',
  'caribe',
  'pacífico',
  'infraestructura',
  'economía',
  'inversión',
  'exportación',
  'pib',
  'banco central',
  'alcaldía',
  'asamblea',
  'ley',
  'decreto',
  'proyecto',
  'carretera',
  'puente',
  'turismo',
  'agricultura',
  'café',
  'energía',
  'presidente',
];

const WEIGHTS = {
  national: 0.30,
  meni: 0.25,
  freshness: 0.20,
  reader: 0.15,
  category: 0.10,
};

function hoursSince(dateString: string): number {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return Infinity;
  return (Date.now() - date.getTime()) / 36e5;
}

function normalizeScore(value: number, max: number): number {
  return Math.max(0, Math.min(1, value / max));
}

function nationalBoost(noticia: Noticia): number {
  const text = `${noticia.titulo} ${noticia.resumen} ${noticia.contenido || ''}`.toLowerCase();
  const hits = NATIONAL_KEYWORDS.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
  return Math.min(1, hits / 4);
}

function scoreNoticia(noticia: Noticia): number {
  const h = hoursSince(noticia.fechaActualizacion || noticia.fechaPublicacion || noticia.fecha);

  const freshness = Math.max(0, 1 - h / 12);

  const meniScore = normalizeScore(noticia.scoreCalidad ?? 70, 100);

  const views = noticia.vistas ?? 0;
  const readerInterest = normalizeScore(Math.log(views + 1), Math.log(2000));

  const category = CATEGORY_BOOST[noticia.categoria] ?? 0.50;

  const national = nationalBoost(noticia);

  return (
    national * WEIGHTS.national +
    meniScore * WEIGHTS.meni +
    freshness * WEIGHTS.freshness +
    readerInterest * WEIGHTS.reader +
    category * WEIGHTS.category
  );
}

// Aplica tope de categoría: máximo 30% del top 10 (3 noticias) por categoría.
// Evita que Sucesos u otra categoría viral domine la portada.
function applyCategoryCap(ranked: Noticia[], topN = 10, maxPerCategory = 3): Noticia[] {
  const top: Noticia[] = [];
  const overflow: Noticia[] = [];
  const counts: Record<string, number> = {};

  for (const n of ranked) {
    if (top.length < topN) {
      counts[n.categoria] = (counts[n.categoria] || 0) + 1;
      if (counts[n.categoria] <= maxPerCategory) {
        top.push(n);
      } else {
        counts[n.categoria]--;
        overflow.push(n);
      }
    } else {
      overflow.push(n);
    }
  }

  return [...top, ...overflow];
}

export function rankNoticias(noticias: Noticia[]): Noticia[] {
  const ranked = [...noticias]
    .map((n) => ({ n, score: scoreNoticia(n) }))
    .sort((a, b) => b.score - a.score)
    .map(({ n }) => n);

  return applyCategoryCap(ranked);
}

export function selectDestacada(noticias: Noticia[]): Noticia | null {
  const ranked = rankNoticias(noticias);
  return ranked[0] ?? null;
}
