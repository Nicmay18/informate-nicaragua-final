/**
 * Temas editoriales — datos puros (sin next/cache ni firebase-admin).
 * Importar desde aquí en rutas de escritura/API: `lib/topics.ts` arrastra
 * `unstable_cache` y rompe los mocks de next/cache en tests.
 */

export interface Tema {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  relatedCategories: string[];
  image?: string;
}

export const TOPICS: Tema[] = [
  {
    slug: 'apostilla',
    name: 'Apostilla de documentos en Nicaragua',
    description: 'Guías, trámites y noticias sobre cómo apostillar documentos nicaragüenses para usar en el extranjero.',
    keywords: ['apostilla', 'cancillería', 'documentos', 'legalización', 'migración', 'trámites Nicaragua'],
    relatedCategories: ['Nacionales'],
  },
  {
    slug: 'policia-nacional',
    name: 'Policía Nacional de Nicaragua',
    description: 'Noticias, reportes y guías sobre la Policía Nacional, antecedentes penales y seguridad ciudadana.',
    keywords: ['policía', 'antecedentes penales', 'récord policial', 'seguridad', 'capturas'],
    relatedCategories: ['Sucesos', 'Nacionales'],
  },
  {
    slug: 'turismo-nicaragua',
    name: 'Turismo en Nicaragua',
    description: 'Destinos turísticos, guías de viaje, volcanes, playas y cultura nicaragüense.',
    keywords: ['turismo', 'viajes', 'Granada', 'León', 'Ometepe', 'volcanes', 'playas'],
    relatedCategories: ['Nacionales', 'Espectáculos'],
  },
  {
    slug: 'tecnologia-nicaragua',
    name: 'Tecnología en Nicaragua',
    description: 'Innovación, startups, internet, telecomunicaciones y transformación digital en Nicaragua.',
    keywords: ['tecnología', 'internet', 'startups', 'telecomunicaciones', 'digital'],
    relatedCategories: ['Tecnología'],
  },
  {
    slug: 'deportes-nicaragua',
    name: 'Deportes en Nicaragua',
    description: 'Resultados, fichajes y noticias del deporte nicaragüense: fútbol, béisbol y atletismo.',
    keywords: ['fútbol', 'béisbol', 'liga primera', 'selección nacional', 'deportes'],
    relatedCategories: ['Deportes'],
  },
  {
    slug: 'economia-nicaragua',
    name: 'Economía de Nicaragua',
    description: 'Noticias sobre economía, comercio, inversión y desarrollo económico en Nicaragua.',
    keywords: ['economía', 'inversión', 'comercio', 'precios', 'mercado', 'finanzas'],
    relatedCategories: ['Nacionales'],
  },
];

/**
 * Slugs de temas que corresponden a una noticia — la misma lógica que
 * antes se aplicaba en memoria sobre docs completos (keywords +
 * relatedCategories). Se persiste en el campo `temas` al escribir la
 * noticia para que /tema/[slug] no tenga que leer cientos de
 * documentos por regeneración.
 */
export function computeTemaSlugs(data: {
  titulo?: unknown;
  resumen?: unknown;
  contenido?: unknown;
  tags?: unknown;
  categoria?: unknown;
}): string[] {
  const tagsText = Array.isArray(data.tags) ? data.tags.join(' ') : String(data.tags ?? '');
  const haystack = `${data.titulo ?? ''} ${data.resumen ?? ''} ${data.contenido ?? ''} ${tagsText}`.toLowerCase();
  const categoria = String(data.categoria ?? 'General');
  return TOPICS.filter(
    (t) => t.relatedCategories.includes(categoria) || t.keywords.some((k) => haystack.includes(k.toLowerCase())),
  ).map((t) => t.slug);
}
