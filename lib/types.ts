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
  excerpt?: string;
  featuredImage?: string;
  categoria: string;
  imagen: string;
  fecha: string;
  fechaPublicacion?: string;
  fechaActualizacion?: string;
  autor?: string;
  autorFoto?: string;
  destacada?: boolean;
  vistas?: number;
  palabras?: number;
  tags?: string[];
  estado?: 'publicado' | 'borrador' | 'archivado';
  pieFoto?: string;
  puntosClave?: string[];
}

/**
 * Interface para categoría
 */
export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  color?: string;
}

/**
 * Interface para autor
 */
export interface Autor {
  id: string;
  nombre: string;
  avatar?: string;
}

/**
 * Alias de Noticia para compatibilidad con código existente
 * @deprecated Usar Noticia directamente en su lugar
 */
export type Article = Noticia;

/**
 * Categorías válidas para noticias
 */
export type Category = 'Nacionales' | 'Sucesos' | 'Internacionales' | 'Tecnología' | 'Economía' | 'Deportes' | 'Espectáculos';

/**
 * Configuración de categorías con colores e iconos
 * @description Fuente única de verdad para datos de categorías
 */
export const CATEGORIES = [
  { name: 'Nacionales', color: '#1d4ed8', icon: 'Flag' },
  { name: 'Sucesos', color: '#dc2626', icon: 'AlertTriangle' },
  { name: 'Internacionales', color: '#7c3aed', icon: 'Globe' },
  { name: 'Tecnología', color: '#0ea5e9', icon: 'Cpu' },
  { name: 'Economía', color: '#f97316', icon: 'TrendingUp' },
  { name: 'Deportes', color: '#16a34a', icon: 'Trophy' },
  { name: 'Espectáculos', color: '#ec4899', icon: 'Star' },
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
export const FALLBACK_IMAGE = '/logo.svg';

/**
 * Valida si una categoría es válida
 * @param category Nombre de la categoría a validar
 * @returns true si la categoría es válida
 */
export function isValidCategory(category: string): category is Category {
  return CATEGORIES.some(cat => cat.name === category);
}

/** Convierte nombre de categoría a slug URL (sin tildes, minúsculas) */
export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/ó/g, 'o')
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ú/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '');
}

/** Convierte slug URL a nombre de categoría (con tilde) */
export function slugToCategory(slug: string): Category | null {
  const map: Record<string, Category> = {
    nacionales: 'Nacionales',
    sucesos: 'Sucesos',
    internacionales: 'Internacionales',
    tecnologia: 'Tecnología',
    economia: 'Economía',
    deportes: 'Deportes',
    espectaculos: 'Espectáculos',
  };
  return map[slug] || null;
}

/** Keywords que indican noticia de luto/fallecimiento */
const LUTO_KEYWORDS = ['muere', 'fallece', 'falleció', 'fallecimiento', 'muerto', 'muerta', 'luto', 'sepelio', 'funeral', 'muert', 'víctima mortal', 'asesinad', 'homicidio', 'descansa en paz', 'd.e.p', 'dep.', ' DEP '];

/**
 * Detecta si una noticia es de luto/fallecimiento basado en título y contenido
 */
export function isLutoNews(noticia: Noticia): boolean {
  const text = `${noticia.titulo} ${noticia.resumen} ${noticia.contenido || ''}`.toLowerCase();
  return LUTO_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}
