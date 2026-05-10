/**
 * Interface principal para noticias/artículos del sistema
 * @description Representa una noticia completa con todos sus campos
 */
export interface Noticia {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido?: string;
  categoria: string;
  imagen: string;
  fecha: string;
  autor?: string;
  destacada?: boolean;
  vistas?: number;
  palabras?: number;
}

/**
 * Alias de Noticia para compatibilidad con código existente
 * @deprecated Usar Noticia directamente en su lugar
 */
export type Article = Noticia;

/**
 * Categorías válidas para noticias
 */
export type Category = 'Sucesos' | 'Nacionales' | 'Deportes' | 'Internacionales' | 'Espectáculos';

/**
 * Configuración de categorías con colores e iconos
 * @description Fuente única de verdad para datos de categorías
 */
export const CATEGORIES = [
  { name: 'Sucesos', color: '#dc2626', icon: 'AlertTriangle' },
  { name: 'Nacionales', color: '#1d4ed8', icon: 'Flag' },
  { name: 'Deportes', color: '#16a34a', icon: 'Trophy' },
  { name: 'Internacionales', color: '#7c3aed', icon: 'Globe' },
  { name: 'Espectáculos', color: '#db2777', icon: 'Star' },
] as const;

/**
 * Mapa de colores por categoría (derivado de CATEGORIES)
 */
export const CATEGORY_COLORS: Record<string, string> = CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.name]: cat.color }),
  {} as Record<string, string>
);

/**
 * Mapa de iconos por categoría (derivado de CATEGORIES)
 */
export const CAT_ICONS: Record<string, string> = CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.name]: cat.icon }),
  {} as Record<string, string>
);

/**
 * Imagen por defecto para noticias sin imagen
 */
export const FALLBACK_IMAGE = '/logo.png';

/**
 * Valida si una categoría es válida
 * @param category Nombre de la categoría a validar
 * @returns true si la categoría es válida
 */
export function isValidCategory(category: string): category is Category {
  return CATEGORIES.some(cat => cat.name === category);
}
