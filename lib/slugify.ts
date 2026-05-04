export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 90);
}

export async function ensureUniqueSlug(title: string): Promise<string> {
  const base = generateSlug(title);
  return base;
}
