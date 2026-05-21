/**
 * Genera un slug URL-friendly a partir de un título.
 * Reglas:
 * - Minúsculas
 * - Sin tildes (normalización NFD)
 * - Solo a-z, 0-9, guiones
 * - Espacios → guiones
 * - Máximo 100 caracteres
 * - Sin guiones al inicio/final
 * - Colapsa guiones múltiples
 */
export function generateSlug(titulo: string): string {
  if (!titulo || typeof titulo !== 'string') {
    return 'sin-titulo';
  }

  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')           // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')              // quitar caracteres especiales
    .replace(/\s+/g, '-')                       // espacios → guiones
    .replace(/-+/g, '-')                        // colapsar guiones múltiples
    .replace(/^-+|-+$/g, '')                    // quitar guiones al inicio/final
    .substring(0, 100);
}

/**
 * Genera un slug único asegurándose de que no exista ya en la base.
 * Si existe, agrega un contador al final.
 */
export async function ensureUniqueSlug(
  titulo: string,
  existsCheck: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = generateSlug(titulo);
  let slug = baseSlug;
  let counter = 1;

  while (await existsCheck(slug)) {
    const suffix = `-${counter}`;
    slug = baseSlug.substring(0, 100 - suffix.length) + suffix;
    counter++;
    if (counter > 999) {
      // fallback extremo: timestamp
      slug = `${baseSlug.substring(0, 85)}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Fallback temporal: compara un slug de params contra el slug
 * generado dinámicamente desde el título de una noticia.
 * Útil mientras se migra la base de datos.
 */
export function slugMatches(title: string, slugParam: string): boolean {
  return generateSlug(title) === slugParam;
}
