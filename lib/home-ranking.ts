import { isLutoNews, type Noticia } from '@/lib/types';

// Pesos orientativos: Nacionales 40%, Deportes 15%, Internacionales 15%,
// Sucesos 15%, Tecnología 10%, Espectáculos 5%.
const CATEGORY_BOOST: Record<string, number> = {
  Nacionales: 1.00,
  Sucesos: 0.65,
  Deportes: 0.85,
  Internacionales: 0.80,
  Tecnología: 0.70,
  Espectáculos: 0.35,
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
  actualidad: 0.20,
  interesPublico: 0.20,
  calidadMeni: 0.25,
  categoriaEstrategica: 0.20,
  potencialSeo: 0.10,
  diversidadEditorial: 0.05,
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

function seoBoost(noticia: Noticia): number {
  let s = 0;
  if (noticia.metaDescription?.trim()) s += 0.5;
  if (noticia.keywords?.trim()) s += 0.3;
  if (noticia.tags && noticia.tags.length > 0) s += 0.2;
  return Math.min(1, s);
}

function interesPublico(noticia: Noticia): number {
  const national = nationalBoost(noticia);
  const views = noticia.vistas ?? 0;
  const readerInterest = normalizeScore(Math.log(views + 1), Math.log(2000));
  return (national + readerInterest) / 2;
}

function scoreNoticia(noticia: Noticia): number {
  const h = hoursSince(noticia.fechaActualizacion || noticia.fechaPublicacion || noticia.fecha);

  const actualidad = Math.max(0, 1 - h / 12);

  // Sin fallback: si scoreMeni es null, la nota no fue evaluada por MENI
  // y no debe recibir puntaje de calidad. Score 0 = sin evaluación.
  const calidadMeni = normalizeScore(noticia.scoreMeni ?? 0, 100);

  const categoriaEstrategica = CATEGORY_BOOST[noticia.categoria] ?? 0.50;

  const potencialSeo = seoBoost(noticia);

  const interes = interesPublico(noticia);

  // Penaliza levemente noticias de luto en rankings de portada sin eliminarlas.
  const lutoPenalty = isLutoNews(noticia) ? 0.08 : 0;

  const score =
    actualidad * WEIGHTS.actualidad +
    interes * WEIGHTS.interesPublico +
    calidadMeni * WEIGHTS.calidadMeni +
    categoriaEstrategica * WEIGHTS.categoriaEstrategica +
    potencialSeo * WEIGHTS.potencialSeo;

  return Math.max(0, score - lutoPenalty);
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
  if (noticias.length === 0) return null;

  const ranked = rankNoticias(noticias);
  const candidates = ranked.slice(0, 10);

  const scored = candidates.map((n) => {
    let s = 0;
    const h = hoursSince(n.fechaActualizacion || n.fechaPublicacion || n.fecha);
    const actualidad = Math.max(0, 1 - h / 12);

    s += actualidad * 2;
    s += normalizeScore(n.scoreMeni ?? 0, 100) * 3;
    if (['Nacionales', 'Tecnología', 'Deportes', 'Internacionales'].includes(n.categoria)) s += 2;
    if (['Sucesos', 'Espectáculos'].includes(n.categoria)) s -= 2;
    if (isLutoNews(n)) s -= 6;
    if ((n.vistas ?? 0) >= 50) s += 1;
    if (n.metaDescription?.trim() && n.keywords?.trim()) s += 0.5;
    return { n, s };
  });

  scored.sort((a, b) => b.s - a.s);
  return scored[0]?.n ?? ranked[0] ?? null;
}
