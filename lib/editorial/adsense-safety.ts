/**
 * Seguridad publicitaria para AdSense.
 *
 * Dos niveles de decisión, ambos puras y testeables:
 *
 * 1. `isMonetizablePath(pathname)` — allowlist de superficies públicas con
 *    contenido real. Admin, panel, login, API, feeds y búsqueda interna
 *    nunca cargan el script de anuncios.
 *
 * 2. `adsAllowedForArticle(sensitive)` — un artículo sensible (muerte,
 *    violencia, abuso sexual, etc., clasificado por CONTENIDO, no por el
 *    nombre de la categoría) no muestra unidades manuales ni debe cargar
 *    el script para Auto ads.
 */

/** Rutas públicas donde tiene sentido monetizar con AdSense. */
const MONETIZABLE_PREFIXES = [
  '/',
  '/noticias',
  '/categoria',
  '/guia',
  '/util',
  '/tema',
  '/entidad',
  '/autor',
  '/autores',
  '/negocios',
  '/radio',
  '/nosotros',
  '/contacto',
  '/publicidad',
  '/mapa-del-sitio',
  '/biblioteca',
  '/centro-confianza',
  '/newsletter',
] as const;

/** Rutas nunca monetizables: privadas, operativas o sin contenido editorial. */
const BLOCKED_PREFIXES = [
  '/admin',
  '/panel',
  '/login',
  '/api',
  '/buscar',
  '/feed',
  '/rss',
  '/feed.xml',
  '/feed.json',
  '/news-sitemap',
  '/sitemap',
  '/robots',
  '/autoridad', // página institucional de verificación, no contenido
] as const;

export function isMonetizablePath(pathname: string): boolean {
  const p = pathname.toLowerCase().split('?')[0];
  if (BLOCKED_PREFIXES.some((bp) => p === bp || p.startsWith(bp + '/'))) return false;
  return MONETIZABLE_PREFIXES.some((mp) =>
    mp === '/' ? p === '/' : p === mp || p.startsWith(mp + '/'),
  );
}

/**
 * Decisión final para cargar/montar publicidad en la página actual.
 * `articleSensitive` viene de isSensitiveArticle() (clasificación por
 * contenido) — no del nombre de la categoría.
 */
export function adsAllowed(pathname: string, articleSensitive = false): boolean {
  return isMonetizablePath(pathname) && !articleSensitive;
}

/** Compat: nombre anterior usado por hooks/tests. */
export function isAdsenseSafePath(pathname: string): boolean {
  return isMonetizablePath(pathname);
}
