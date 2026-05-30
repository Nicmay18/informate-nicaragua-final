// lib/constants.ts
// FUENTE ÚNICA DE VERDAD - No duplicar en ningún componente

export const CATEGORIES = [
  { name: 'Nacionales', slug: 'nacionales', color: '#1d4ed8', description: 'Noticias nacionales de Nicaragua: política, economía, infraestructura, educación, salud y desarrollo social desde Managua.' },
  { name: 'Sucesos', slug: 'sucesos', color: '#dc2626', description: 'Reportes de sucesos en Nicaragua: accidentes de tránsito, hechos policiales, emergencias y seguridad ciudadana en tiempo real.' },
  { name: 'Internacionales', slug: 'internacionales', color: '#7c3aed', description: 'Noticias internacionales relevantes para Nicaragua: Centroamérica, Estados Unidos, Europa y eventos globales.' },
  { name: 'Deportes', slug: 'deportes', color: '#16a34a', description: 'Resultados, fichajes y noticias del deporte nicaragüense. Liga Primera, selección nacional, béisbol, boxeo y atletismo.' },
  { name: 'Tecnología', slug: 'tecnologia', color: '#0ea5e9', description: 'Avances tecnológicos en Nicaragua: internet, telecomunicaciones, startups, transformación digital y redes sociales.' },
  { name: 'Espectáculos', slug: 'espectaculos', color: '#db2777', description: 'Farándula, música, cine, televisión y eventos culturales de Nicaragua y el mundo del entretenimiento.' },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];
export type CategoryName = typeof CATEGORIES[number]['name'];

// Mapa rápido para lookups
export const CATEGORY_MAP: Record<string, (typeof CATEGORIES)[number]> = {};
CATEGORIES.forEach((c) => {
  CATEGORY_MAP[c.slug] = c;
  CATEGORY_MAP[c.name.toLowerCase()] = c;
});

// Colores para uso rápido (compatibilidad con código existente)
export const CATEGORY_COLORS: Record<string, string> = {};
CATEGORIES.forEach(c => {
  CATEGORY_COLORS[c.name] = c.color;
  CATEGORY_COLORS[c.slug] = c.color;
});

// Slugs válidos para validación
export const VALID_CATEGORY_SLUGS: Set<string> = new Set(CATEGORIES.map(c => c.slug));

// Normaliza cualquier input de categoría a slug válido
export function normalizeCategory(raw?: string): string {
  if (!raw) return 'nacionales';
  const slug = raw.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');

  if (VALID_CATEGORY_SLUGS.has(slug)) return slug;

  // Fallbacks comunes
  if (slug === 'tecnologa') return 'tecnologia';
  if (slug === 'espectaculo') return 'espectaculos';
  if (slug === 'internacional') return 'internacionales';
  if (slug === 'nacional') return 'nacionales';
  if (slug === 'suceso') return 'sucesos';
  if (slug === 'deporte') return 'deportes';

  return 'nacionales'; // default seguro
}

// Obtiene el objeto categoría completo
export function getCategory(raw?: string) {
  const slug = normalizeCategory(raw);
  return CATEGORY_MAP[slug] || CATEGORY_MAP['nacionales'];
}

// ============ REDES SOCIALES ============
export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61578261125687',
  whatsapp: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
  telegram: 'https://t.me/+fHHjncJqMQM3NjZh',
} as const;

// ============ CONFIGURACIÓN SEO ============
export const SITE_CONFIG = {
  name: 'Nicaragua Informate',
  tagline: 'Infórmate al Instante',
  url: 'https://nicaraguainformate.com',
  email: 'info@nicaraguainformate.com',
  location: 'Managua, Nicaragua',
  founded: 2024,
} as const;

// ============ RADIOS ============
export const RADIOS = [
  { name: 'Radio Ya', url: 'https://www.radioya.com.ni/' },
  { name: 'Viva FM', url: 'https://www.vivafm.com.ni/' },
  { name: 'Fiesta Latina', url: 'https://fiestalatina.com.ni/' },
  { name: 'Radio Juvenil', url: 'https://radiojuvenil.com.ni/' },
  { name: 'Radio Nicaragua', url: 'https://www.radionicaragua.com/' },
  { name: 'Radio Futura', url: 'https://radiofutura.net/' },
  { name: 'La Tuani', url: 'https://www.latuani.com/' },
  { name: 'Radio Amor', url: 'https://radioamor.com.ni/' },
  { name: 'Radio Tigre', url: 'https://radiotigre.com.ni/' },
] as const;

// ============ TENDENCIAS ============
export const TRENDS = [
  { label: 'Elecciones 2026', href: '/buscar?q=elecciones' },
  { label: 'Dólar / Córdoba', href: '/buscar?q=dolar' },
  { label: 'Liga Primera', href: '/buscar?q=liga+primera' },
  { label: 'Bluefields', href: '/buscar?q=bluefields' },
  { label: 'Costa Caribe', href: '/buscar?q=costa+caribe' },
  { label: 'Clima', href: '/buscar?q=clima' },
  { label: 'Volcán', href: '/buscar?q=volcan' },
  { label: 'Migración', href: '/buscar?q=migracion' },
] as const;

// ============ NAV LINKS ============
export const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  ...CATEGORIES.map(c => ({ href: `/categoria/${c.slug}`, label: c.name })),
] as const;
