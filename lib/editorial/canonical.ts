import type { Noticia, PublicCategory } from '@/lib/types';
import { isPublicCategory } from '@/lib/types';
import { detectContentProfile, type MeniContentProfile } from '@/lib/meni/profile-detector';
import { logger } from '@/lib/logger';

export interface EditorialDecision {
  aprobado: boolean;
  publicar: boolean;
  indexar: boolean;
  razon: string;
}

export function getEditorialDecision(article: Partial<Noticia>): EditorialDecision {
  const aprobadoMeni = article.aprobadoMeni === true;
  const publicado = article.publicado === true;
  const archived = article.archived === true;
  const borrador = article.estado === 'borrador';
  const archivado = article.estado === 'archivado';
  const noindex = !!article.noindex;

  const aprobado = aprobadoMeni;
  const publicable = aprobado && publicado && !archived && !borrador && !archivado;
  const indexable = publicable && !noindex;

  let razon = 'OK';
  if (!aprobadoMeni) razon = 'MENI no aprobó la noticia';
  else if (!publicado) razon = 'No está marcada como publicado';
  else if (archived) razon = 'Archivada';
  else if (borrador) razon = 'Borrador';
  else if (archivado) razon = 'Archivado';
  else if (noindex) razon = 'Marcada como noindex';

  return { aprobado, publicar: publicable, indexar: indexable, razon };
}

export function isPublicArticle(article: Partial<Noticia>): boolean {
  const decision = getEditorialDecision(article);
  return decision.publicar;
}

export function shouldIndexArticle(article: Partial<Noticia>): boolean {
  const decision = getEditorialDecision(article);
  return decision.indexar;
}

/**
 * Mapeo de perfil interno → categoría pública canónica
 * REGLA 2: Solo 6 categorías públicas existen. Los perfiles internos
 * (salud, ambiente, cultura, etc.) se mapean a una de las 6.
 * Fuente única de verdad exportada para toda la plataforma.
 */
export const PROFILE_TO_PUBLIC_CATEGORY: Record<MeniContentProfile, PublicCategory> = {
  sucesos: 'Sucesos',
  violencia_genero: 'Sucesos',
  nacionales: 'Nacionales',
  politica: 'Nacionales',
  economia: 'Nacionales',
  salud: 'Nacionales',
  deportes: 'Deportes',
  cultura: 'Nacionales',
  espectaculos: 'Espectáculos',
  tecnologia: 'Tecnología',
  internacional: 'Internacionales',
  educacion: 'Nacionales',
  ambiente: 'Nacionales',
  turismo: 'Nacionales',
  gastronomia: 'Nacionales',
};

/**
 * resolvePublicCategory — FUNCIÓN CANÓNICA ÚNICA
 * Todo el sistema debe usar esta función para obtener la categoría pública.
 * REGLA 5: perfil interno NUNCA escapa a la capa pública.
 */
export function resolvePublicCategory(article: Partial<Noticia>): PublicCategory {
  // 1. Si el artículo ya tiene una categoría pública válida, usarla
  if (article.categoria && isPublicCategory(article.categoria)) {
    return article.categoria;
  }

  // 2. Si tiene perfil interno, mapearlo a categoría pública
  if (article.perfil && PROFILE_TO_PUBLIC_CATEGORY[article.perfil as MeniContentProfile]) {
    return PROFILE_TO_PUBLIC_CATEGORY[article.perfil as MeniContentProfile];
  }

  // 3. Detectar perfil del texto y mapearlo
  try {
    const detected = detectContentProfile(
      article.titulo || '',
      article.contenido || '',
      article.resumen || ''
    );
    const mapped = PROFILE_TO_PUBLIC_CATEGORY[detected.profile_detected];
    if (mapped) return mapped;
  } catch (e) {
    logger.warn('[resolvePublicCategory] Error en detección:', e);
  }

  // 4. Fallback: si tiene categoria pero no es pública, intentar mapeo manual
  if (article.categoria) {
    const catMap: Record<string, PublicCategory> = {
      'Cultura': 'Nacionales',
      'Economía': 'Nacionales',
      'Salud': 'Nacionales',
      'Ambiente': 'Nacionales',
      'Turismo': 'Nacionales',
      'Educación': 'Nacionales',
      'Gastronomía': 'Nacionales',
      'Política': 'Nacionales',
      'General': 'Nacionales',
    };
    if (catMap[article.categoria]) return catMap[article.categoria];
  }

  // 5. Último recurso
  return 'Nacionales';
}

/**
 * @deprecated Usar resolvePublicCategory
 */
export function resolveCanonicalCategoria(perfil: string | undefined, categoria: string | undefined): PublicCategory {
  if (perfil && PROFILE_TO_PUBLIC_CATEGORY[perfil as MeniContentProfile]) {
    return PROFILE_TO_PUBLIC_CATEGORY[perfil as MeniContentProfile];
  }
  if (categoria && isPublicCategory(categoria)) return categoria;
  return 'Nacionales';
}

export function resolveCanonicalProfile(
  titulo: string,
  contenido: string,
  resumen: string,
  perfil?: string | null
): MeniContentProfile {
  if (perfil && PROFILE_TO_PUBLIC_CATEGORY[perfil as MeniContentProfile]) {
    return perfil as MeniContentProfile;
  }
  try {
    const detected = detectContentProfile(titulo, contenido, resumen);
    return detected.profile_detected;
  } catch (e) {
    logger.warn('[resolveCanonicalProfile] Error en detección:', e);
    return 'nacionales';
  }
}
