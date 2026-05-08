/**
 * Genera un slug URL-friendly a partir de un título
 * @param title Título a convertir a slug
 * @returns Slug URL-friendly
 * @throws Error si el título está vacío o es inválido
 */
export function generateSlug(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new Error('Title must be a non-empty string');
  }

  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new Error('Title cannot be empty');
  }

  return trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 90);
}

/**
 * Genera un slug único añadiendo sufijo numérico si es necesario
 * @param title Título a convertir a slug
 * @param existingSlugs Slugs existentes para verificar unicidad
 * @returns Slug único
 */
export function ensureUniqueSlug(title: string, existingSlugs: string[] = []): string {
  const base = generateSlug(title);
  
  if (!existingSlugs.includes(base)) {
    return base;
  }

  let counter = 1;
  let uniqueSlug = `${base}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug) && counter < 1000) {
    counter++;
    uniqueSlug = `${base}-${counter}`;
  }

  return uniqueSlug;
}

/**
 * Valida si un slug es válido
 * @param slug Slug a validar
 * @returns true si el slug es válido
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length <= 90 && slug.length > 0;
}
