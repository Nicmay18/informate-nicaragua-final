/**
 * Paginación canónica — política única para /noticias y /categoria/[slug].
 * =====================================================================
 * Reglas:
 * - `page` ausente → página 1.
 * - `page` inválida (no numérica, 0, negativa, decimal) → 404.
 * - `page > totalPages` → 404 (soft-404 eliminado: una página fuera de rango
 *   NO muestra silenciosamente otra página ni una lista vacía con 200).
 * - `page <= totalPages` → OK.
 *
 * No reemplazar con clamping: devolver contenido de otra página bajo una URL
 * distinta es contenido duplicado para SEO.
 */

export type PageResolution =
  | { status: 'ok'; page: number; totalPages: number }
  | { status: 'not_found' };

export function resolvePage(
  rawPage: string | undefined,
  totalCount: number,
  pageSize: number,
): PageResolution {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (rawPage === undefined || rawPage === '') {
    return { status: 'ok', page: 1, totalPages };
  }

  // Solo enteros positivos estrictos: "2" ok; "2.5", "abc", "0", "-1" → 404.
  if (!/^\d+$/.test(rawPage)) {
    return { status: 'not_found' };
  }
  const page = Number.parseInt(rawPage, 10);
  if (page < 1 || page > totalPages) {
    return { status: 'not_found' };
  }
  return { status: 'ok', page, totalPages };
}
