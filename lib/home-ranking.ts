import { isLutoNews, type Noticia } from '@/lib/types';
import { isPublicArticle } from '@/lib/editorial/canonical';

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

// La diversidad editorial NO es un peso: la aplica applyCategoryCap() con
// tope duro por categoría (ver más abajo). Antes había una clave
// 'diversidadEditorial: 0.05' declarada pero nunca usada en la fórmula —
// peso muerto que hacía sumar los pesos 0.95 en lugar de 1.00.
const WEIGHTS = {
  actualidad: 0.20,
  interesPublico: 0.20,
  calidadMeni: 0.25,
  categoriaEstrategica: 0.20,
  potencialSeo: 0.10,
};

function hoursSince(dateString: string): number {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return Infinity;
  return (Date.now() - date.getTime()) / 36e5;
}

/** Edad de la noticia en horas, medida desde su fecha de PUBLICACIÓN. */
export function articleAgeHours(n: Noticia, now: number = Date.now()): number {
  const t = new Date(n.fechaPublicacion || n.fecha).getTime();
  return Number.isNaN(t) ? Infinity : (now - t) / 36e5;
}

/**
 * Ventana máxima de 'noticia actual' para posiciones primarias (hero y
 * Principales). Fuera de ella, un artículo SOLO puede ocupar posición
 * primaria si tiene actividad medida hoy (traffic_daily) — nunca por su
 * score histórico de MENI/vistas, que es exactamente como una nota vieja
 * se disfrazaba de noticia del día.
 */
export const FRONT_PAGE_MAX_AGE_HOURS = 48;

/**
 * Elegible para hero/Principales: reciente (<= 48h desde publicación) o con
 * tráfico medido hoy (activeSlugs viene de traffic_daily del día actual).
 */
export function isFrontPageEligible(
  n: Noticia,
  activeSlugs: ReadonlySet<string>,
  now: number = Date.now(),
): boolean {
  return articleAgeHours(n, now) <= FRONT_PAGE_MAX_AGE_HOURS || activeSlugs.has(n.slug);
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
  // La actualidad debe medirse desde la fecha de PUBLICACIÓN, no desde
  // la última edición técnica; de lo contrario una corrección menor
  // reaviva una noticia de hace días como si fuera recién salida.
  const h = hoursSince(noticia.fechaPublicacion || noticia.fecha);

  const actualidad = Math.max(0, 1 - h / 24);

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
    const h = hoursSince(n.fechaPublicacion || n.fecha);
    const actualidad = Math.max(0, 1 - h / 24);

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

// ============================================================================
// Selección de secciones de portada — actualidad primero, popularidad aparte.
// ============================================================================

export interface HomeSections {
  hero: Noticia | null;
  enPortada: Noticia[];
  ultimas: Noticia[];
  breaking: Noticia[];
}

/**
 * Ventanas progresivas de actualidad para posiciones primarias (hero y
 * En portada): 24h → 48h → 7 días. Si ninguna ventana cubre el mínimo de
 * candidatas, se amplía a la siguiente; si el corpus entero está viejo, se
 * muestra lo mejor disponible SIN fabricar recencia.
 * Las visitas acumuladas y el score MENI histórico NO amplían la ventana:
 * una nota de hace semanas con miles de vistas pertenece a «Más leídas»,
 * no al titular.
 */
export const FRONT_WINDOWS_HOURS = [24, 48, 168] as const;
const EN_PORTADA_LIMIT = 5;
const EN_PORTADA_CAT_CAP = 2;
const ULTIMAS_LIMIT = 8;
const BREAKING_LIMIT = 4;
const LAST_HOUR_HOURS = 24;

/** Timestamp de publicación en ms (0 si la fecha es inválida). */
function publicationMs(n: Noticia): number {
  const t = new Date(n.fecha).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Selección pura de las secciones de portada a partir del pool `latest`
 * (publicadas, ya filtradas por isPublicNews en la capa de datos).
 *
 * - hero / enPortada: solo noticias dentro de la ventana de actualidad.
 * - ultimas: cronología estricta por fecha de publicación, descendente.
 *   NO excluye notas por aparecer en secciones temáticas ni por popularidad;
 *   solo omite el hero y duplicados por slug/id.
 * - breaking («Última hora»): últimas 24h, sin repetir lo ya mostrado.
 */
export function selectHomeSections(latest: Noticia[], now: number = Date.now()): HomeSections {
  // Defensa en profundidad: aunque la capa de datos ya filtra, la portada
  // nunca debe mostrar borradores, archivadas ni no aprobadas por MENI.
  const elegibles = latest.filter(n => isPublicArticle(n));
  const ranked = rankNoticias(elegibles);
  const age = (n: Noticia) => articleAgeHours(n, now);

  const poolFor = (minCount: number): Noticia[] => {
    let widest: Noticia[] = [];
    for (const h of FRONT_WINDOWS_HOURS) {
      const p = ranked.filter(n => age(n) <= h);
      if (p.length > 0) widest = p;
      if (p.length >= minCount) return p;
    }
    // Ninguna ventana cubre el mínimo: usar la más amplia con contenido
    // (≤7d). Solo si TODO el corpus es más viejo se recurre al ranking
    // completo — la portada nunca queda vacía, sin fabricar recencia.
    return widest.length > 0 ? widest : ranked.slice(0, 50);
  };

  const heroPool = poolFor(1);
  const hero = selectDestacada(heroPool.filter(n => !isLutoNews(n))) ?? heroPool[0] ?? null;

  // EN PORTADA: la ventana se amplía según cuántas noticias REALMENTE
  // entran tras el tope de diversidad (2 por categoría) — no por cuántas
  // candidatas crudas tiene la ventana. Seis notas de Nacionales en 24h no
  // bastan para llenar la sección: se amplía a 48h/7d buscando otras
  // categorías. Se toma la ventana más pequeña que completa la sección;
  // si ninguna la completa, la más amplia con contenido.
  const fillPortada = (pool: Noticia[]): Noticia[] => {
    const out: Noticia[] = [];
    const counts: Record<string, number> = {};
    for (const n of pool) {
      if (out.length >= EN_PORTADA_LIMIT) break;
      if (hero && n.id === hero.id) continue;
      const c = counts[n.categoria] || 0;
      if (c >= EN_PORTADA_CAT_CAP) continue;
      out.push(n);
      counts[n.categoria] = c + 1;
    }
    return out;
  };

  let enPortada: Noticia[] = [];
  let sawWindow = false;
  for (const h of FRONT_WINDOWS_HOURS) {
    const p = ranked.filter(n => age(n) <= h);
    if (p.length === 0) continue;
    sawWindow = true;
    enPortada = fillPortada(p);
    if (enPortada.length >= EN_PORTADA_LIMIT) break;
  }
  if (!sawWindow) enPortada = fillPortada(ranked.slice(0, 50));

  // ÚLTIMAS NOTICIAS: flujo cronológico independiente. Orden por fecha de
  // publicación real (desc); sin filtros de popularidad ni exclusiones por
  // sección — una nota que encabeza el hero o una fila temática sigue
  // apareciendo aquí porque el feed es la verdad cronológica de la portada.
  // Dedup por slug (un doc puede existir con id ≠ slug).
  const chrono = [...elegibles].sort((a, b) => publicationMs(b) - publicationMs(a));
  const ultimas: Noticia[] = [];
  const seenKeys = new Set<string>();
  for (const n of chrono) {
    if (ultimas.length >= ULTIMAS_LIMIT) break;
    const key = n.slug || n.id;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    ultimas.push(n);
  }

  // ÚLTIMA HORA: solo lo publicado en las últimas 24h que aún no se muestra.
  const placed = new Set<string>([
    ...(hero ? [hero.id] : []),
    ...enPortada.map(n => n.id),
    ...ultimas.map(n => n.id),
  ]);
  const breaking: Noticia[] = [];
  const breakCat: Record<string, number> = {};
  for (const n of chrono) {
    if (breaking.length >= BREAKING_LIMIT) break;
    if (placed.has(n.id)) continue;
    if (age(n) > LAST_HOUR_HOURS) break; // cronológico desc: lo que sigue es más viejo
    const c = breakCat[n.categoria] || 0;
    if (n.categoria === 'Sucesos' && c >= 2) continue;
    breaking.push(n);
    breakCat[n.categoria] = c + 1;
  }

  return { hero, enPortada, ultimas, breaking };
}
