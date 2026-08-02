import type { Noticia } from '@/lib/types';

const CATEGORY_BOOST: Record<string, number> = {
  Nacionales: 1.0,
  Sucesos: 0.95,
  Deportes: 0.70,
  Internacionales: 0.75,
  Tecnología: 0.60,
  Espectáculos: 0.55,
};

const NATIONAL_KEYWORDS = [
  'nicaragua',
  'managua',
  'gobierno',
  'sandino',
  'ortega',
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
  'inseguridad',
  'accidente',
  'sismo',
  'volcán',
  'huracán',
];

const WEIGHTS = {
  freshness: 0.25,
  meni: 0.25,
  reader: 0.20,
  trend: 0.15,
  category: 0.10,
  national: 0.05,
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
  return Math.min(1, hits / 3);
}

function scoreNoticia(noticia: Noticia): number {
  const h = hoursSince(noticia.fechaActualizacion || noticia.fechaPublicacion || noticia.fecha);

  const freshness = Math.max(0, 1 - h / 12);

  const meniScore = normalizeScore(noticia.scoreCalidad ?? 70, 100);

  const views = noticia.vistas ?? 0;
  const readerInterest = normalizeScore(Math.log(views + 1), Math.log(2000));

  const trend = normalizeScore(views / (h + 1), 30);

  const category = CATEGORY_BOOST[noticia.categoria] ?? 0.50;

  const national = nationalBoost(noticia);

  return (
    freshness * WEIGHTS.freshness +
    meniScore * WEIGHTS.meni +
    readerInterest * WEIGHTS.reader +
    trend * WEIGHTS.trend +
    category * WEIGHTS.category +
    national * WEIGHTS.national
  );
}

export function rankNoticias(noticias: Noticia[]): Noticia[] {
  return [...noticias]
    .map((n) => ({ n, score: scoreNoticia(n) }))
    .sort((a, b) => b.score - a.score)
    .map(({ n }) => n);
}

export function selectDestacada(noticias: Noticia[]): Noticia | null {
  const ranked = rankNoticias(noticias);
  return ranked[0] ?? null;
}
