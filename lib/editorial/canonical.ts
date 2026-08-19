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
const LEGACY_TO_PUBLIC_CATEGORY: Record<string, PublicCategory> = {
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

// Marcadores para resolver ambigüedades nacionales/sucesos sin alterar
// el detector de perfiles estable. Se aplica en el resolver canónico.
const SUCESOS_EVENT_MARKERS = new Set([
  'accidente', 'transito', 'policia', 'homicidio',
  'fallecido', 'muere', 'murio', 'muerte', 'muerto', 'muerta',
  'heridos', 'herido', 'lesionado', 'lesionada', 'baleado', 'baleada',
  'captura', 'delito', 'crimen', 'ataco', 'atacado', 'atropello', 'embiste',
  'embistio', 'incendio', 'rescate', 'arma', 'disparo', 'balazo', 'golpeado',
  'agredido', 'agredida', 'pelea',
]);

const NACIONALES_SERVICE_MARKERS = new Set([
  'inss', 'seguro social', 'prestacion', 'beneficio', 'beneficios', 'tramite',
  'tramites', 'solicitar', 'solicitud', 'requisitos', 'como solicitar',
  'familiares', 'pension', 'jubilacion', 'subsidio', 'indemnizacion',
  'fallecimiento', 'procedimiento', 'aplicar',
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasAnyMarker(text: string, markers: Set<string>): boolean {
  const n = normalizeText(text);
  for (const m of markers) {
    if (n.includes(m)) return true;
  }
  return false;
}

function overrideProfileFromContext(
  perfil: MeniContentProfile,
  titulo: string,
  contenido: string,
  resumen: string,
): MeniContentProfile {
  const full = `${titulo} ${contenido} ${resumen}`;
  const hasService = hasAnyMarker(full, NACIONALES_SERVICE_MARKERS);
  const hasEvent = hasAnyMarker(full, SUCESOS_EVENT_MARKERS);

  // perfil dice sucesos pero el contenido es de trámites/servicio institucional
  if (perfil === 'sucesos' && hasService && !hasEvent) return 'nacionales';

  // perfil dice nacionales pero el contenido es un hecho policial/accidente
  if (perfil === 'nacionales' && hasEvent && !hasService) return 'sucesos';

  return perfil;
}

export function resolvePublicCategory(article: Partial<Noticia>): PublicCategory {
  // 1. AUTORIDAD EDITORIAL: perfil interno almacenado + verificación de contexto.
  //    Si el perfil contradice el contenido (p. ej. INSS/fallecimiento como sucesos),
  //    el resolver canónico corrige ANTES de mapear a categoría pública.
  if (article.perfil && PROFILE_TO_PUBLIC_CATEGORY[article.perfil as MeniContentProfile]) {
    const effectiveProfile = overrideProfileFromContext(
      article.perfil as MeniContentProfile,
      article.titulo || '',
      article.contenido || '',
      article.resumen || ''
    );
    return PROFILE_TO_PUBLIC_CATEGORY[effectiveProfile];
  }

  // 2. CATEGORÍA PÚBLICA ALMACENADA: si no hay perfil, la categoría editorial
  //    guardada y válida es la segunda fuente de verdad. Esto preserva
  //    decisiones editoriales explícitas y mantiene compatibilidad con datos
  //    históricos que no tienen perfil.
  if (article.categoria) {
    const key = article.categoria.trim();
    if (isPublicCategory(key)) return key;
    if (LEGACY_TO_PUBLIC_CATEGORY[key]) return LEGACY_TO_PUBLIC_CATEGORY[key];
  }

  // 3. SEÑALES CONTEXTUALES: re-detectar perfil del texto
  const hasText = !!(article.titulo?.trim() || article.contenido?.trim() || article.resumen?.trim());
  if (hasText) {
    try {
      const detected = detectContentProfile(
        article.titulo || '',
        article.contenido || '',
        article.resumen || ''
      );
      const effectiveProfile = overrideProfileFromContext(
        detected.profile_detected,
        article.titulo || '',
        article.contenido || '',
        article.resumen || ''
      );
      const mapped = PROFILE_TO_PUBLIC_CATEGORY[effectiveProfile];
      if (mapped) return mapped;
    } catch (e) {
      logger.warn('[resolvePublicCategory] Error en detección:', e);
    }
  }

  // 4. ÚLTIMO RECURSO
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
