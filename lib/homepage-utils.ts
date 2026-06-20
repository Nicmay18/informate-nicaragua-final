import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAllEvergreen } from './evergreen';

export const TRENDS = [
  { label: 'Elecciones 2026', href: '/buscar?q=elecciones' },
  { label: 'Dólar / Córdoba', href: '/buscar?q=dolar' },
  { label: 'Liga Primera', href: '/buscar?q=liga+primera' },
  { label: 'Bluefields', href: '/buscar?q=bluefields' },
  { label: 'Costa Caribe', href: '/buscar?q=costa+caribe' },
];

export const CATEGORIES = [
  { name: 'Sucesos', slug: 'sucesos', color: 'sucesos' },
  { name: 'Nacionales', slug: 'nacionales', color: 'nacionales' },
  { name: 'Espectáculos', slug: 'espectaculos', color: 'espectaculos' },
  { name: 'Deportes', slug: 'deportes', color: 'deportes' },
  { name: 'Tecnología', slug: 'tecnologia', color: 'tecnologia' },
  { name: 'Internacionales', slug: 'internacionales', color: 'internacionales' },
];

export const CAT_LOOKUP: Record<string, string> = {};
CATEGORIES.forEach(c => {
  CAT_LOOKUP[c.slug] = c.slug;
  CAT_LOOKUP[c.name.toLowerCase()] = c.slug;
  CAT_LOOKUP[c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] = c.slug;
});

export function catClass(cat?: string) {
  const key = cat?.toLowerCase() || '';
  return CAT_LOOKUP[key] || CAT_LOOKUP[key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || 'nacionales';
}

export function timeAgo(dateInput: unknown): string {
  const dateStr = typeof dateInput === 'string' ? dateInput : '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return '';
  }
}

export const EVERGREEN_GUIDES = getAllEvergreen().slice(0, 4);
