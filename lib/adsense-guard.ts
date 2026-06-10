/**
 * AdSense Content Guard — Nicaragua Informate
 * Centraliza la lógica de exclusión de monetización para:
 *   - Slugs tóxicos (lista negra exacta)
 *   - Categorías sensibles (sucesos, crónica roja, policiales)
 *   - Palabras clave de luto en título + contenido
 *
 * Uso: import { isAdsenseSafe } from '@/lib/adsense-guard';
 *        if (!isAdsenseSafe(noticia)) { // omitir slots de ads }
 */

import type { Noticia } from './types';

/** Categorías que activan restricción de monetización */
const BLOCKED_CATEGORIES = ['sucesos', 'crónica roja', 'policiales', 'accidentes', 'crimen'];

/** Palabras clave de luto / sensibles que bloquean ads en una noticia */
const SENSITIVE_KEYWORDS = [
  'muere', 'fallece', 'falleció', 'fallecimiento', 'muerto', 'muerta', 'luto',
  'sepelio', 'funeral', 'muert', 'víctima mortal', 'asesinad', 'homicidio',
  'descansa en paz', 'd.e.p', 'dep.', 'accidente mortal', 'tragedia',
];

/** Slugs exactos bloqueados (lista negra manual) */
const BLOCKED_SLUGS: string[] = [
  'tragedia-en-ee-uu-joven-de-rio-san-juan-muere-en-accidente',
  'conductor-se-fuga-tras-causar-muerte-de-joven-en',
];

/** Verifica si una noticia es segura para AdSense */
export function isAdsenseSafe(noticia: Noticia): boolean {
  if (!noticia) return false;

  // 1) Slugs exactos bloqueados
  if (BLOCKED_SLUGS.includes(noticia.slug?.toLowerCase() || '')) return false;

  // 2) Categoría bloqueada
  const cat = (noticia.categoria || '').toLowerCase();
  if (BLOCKED_CATEGORIES.includes(cat)) return false;

  // 3) Palabras sensibles en título + resumen + contenido
  const text = `${noticia.titulo} ${noticia.resumen || ''} ${noticia.contenido || ''}`.toLowerCase();
  const hasSensitive = SENSITIVE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
  if (hasSensitive) return false;

  return true;
}

/** Verifica si una ruta URL es segura para AdSense (uso en componentes cliente) */
export function isAdsenseSafePath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  const blockedPaths = ['/sucesos', '/cronica-roja', '/policiales', '/accidentes', '/crimen'];
  if (blockedPaths.some((bp) => p.startsWith(bp))) return false;
  return true;
}

/** Genera atributo data-adsense-safe para el <body> (usado por CSS y scripts) */
export function getAdsenseSafeAttr(noticia?: Noticia): string {
  if (!noticia) return 'false';
  return isAdsenseSafe(noticia) ? 'true' : 'false';
}
