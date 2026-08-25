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
 * resolveEditorialClassification — Resolución completa de categoría con trazabilidad.
 *
 * Jerarquía editorial:
 * 1. Categoría pública explícita del editor (article.categoria).
 * 2. Perfil interno almacenado (article.perfil) solo si no hay categoría explícita.
 * 3. Detección automática a partir del texto.
 * 4. Fallback Nacionales.
 *
 * REGLA DE PRECEDENCIA: la selección explícita del editor NO puede ser
 * sobrescrita silenciosamente por la IA. Si la detección contradice al editor,
 * se reporta classificationConflict = true y el sistema conserva la decisión
 * editorial mientras explica el motivo.
 */
export interface EditorialClassification {
  finalCategory: PublicCategory;
  editorCategory: PublicCategory | null;
  suggestedProfile: MeniContentProfile | null;
  suggestedCategory: PublicCategory | null;
  classificationSource: 'editor' | 'AI';
  classificationConfidence: number;
  classificationReason: string;
  classificationConflict: boolean;
  classificationStatus: 'OK' | 'CATEGORY_CONFLICT' | 'CATEGORY_AMBIGUOUS';
}

const LEGACY_TO_PUBLIC_CATEGORY: Record<string, PublicCategory> = {
  'Cultura': 'Nacionales',
  'Economía': 'Nacionales',
  'Salud': 'Nacionales',
  'Ambiente': 'Nacionales',
  'Turismo': 'Nacionales',
  'Educación': 'Nacionales',
  'Gastronomía': 'Nacionales',
  'Política': 'Nacionales',
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

export function resolveEditorialClassification(article: Partial<Noticia>): EditorialClassification {
  const titulo = article.titulo || '';
  const contenido = article.contenido || '';
  const resumen = article.resumen || '';

  // 1. PRECEDENCIA EDITORIAL: categoría pública explícita del editor.
  const explicitCat = article.categoria ? article.categoria.trim() : '';
  const editorCategory: PublicCategory | null = isPublicCategory(explicitCat)
    ? explicitCat
    : (LEGACY_TO_PUBLIC_CATEGORY[explicitCat] || null);

  // 2. Detectar perfil/sugerencia automática (siempre, para reportar conflictos).
  let detectedProfile: MeniContentProfile | null = null;
  let suggestedCategory: PublicCategory | null = null;
  let aiConfidence = 0;

  const hasText = !!(titulo.trim() || contenido.trim() || resumen.trim());

  if (hasText) {
    try {
      const storedOrDetectedProfile = article.perfil
        ? (article.perfil as MeniContentProfile)
        : detectContentProfile(titulo, contenido, resumen).profile_detected;
      const effectiveProfile = overrideProfileFromContext(
        storedOrDetectedProfile,
        titulo,
        contenido,
        resumen,
      );
      const mapped = PROFILE_TO_PUBLIC_CATEGORY[effectiveProfile];
      detectedProfile = effectiveProfile;
      suggestedCategory = mapped || null;
      // Confianza estimada: si venía del editor (perfil) damos baja confianza
      // porque no es una selección de categoría pública, es una etiqueta interna.
      aiConfidence = article.perfil ? 0.5 : 0;
    } catch (e) {
      logger.warn('[resolveEditorialClassification] Error en detección:', e);
    }
  }

  // Si no hay perfil almacenado, recalcular confianza del detector.
  if (!article.perfil && hasText) {
    try {
      const detected = detectContentProfile(titulo, contenido, resumen);
      aiConfidence = detected.profile_confidence;
    } catch (e) {
      logger.warn('[resolveEditorialClassification] Error en confianza:', e);
    }
  }

  // 3. Resolver con la taxonomía editorial y la precedencia.
  if (editorCategory) {
    const conflict = !!suggestedCategory && suggestedCategory !== editorCategory;
    const reason = conflict
      ? `La categoría seleccionada por el editor es ${editorCategory}. MENI detecta señales de ${suggestedCategory} (perfil ${detectedProfile}) en el texto, pero mantiene la decisión editorial explícita.`
      : `La categoría seleccionada por el editor es ${editorCategory} y las señales del texto son coherentes.`;
    return {
      finalCategory: editorCategory,
      editorCategory,
      suggestedProfile: detectedProfile,
      suggestedCategory,
      classificationSource: 'editor',
      classificationConfidence: 1,
      classificationReason: reason,
      classificationConflict: conflict,
      classificationStatus: conflict ? 'CATEGORY_CONFLICT' : 'OK',
    };
  }

  // 4. Sin categoría explícita: perfil almacenado o detección automática.
  if (suggestedCategory) {
    const ambiguous = aiConfidence > 0 && aiConfidence < 0.5;
    const reason = article.perfil
      ? `No hay categoría pública explícita. Se usa el perfil almacenado (${detectedProfile}) que se mapea a ${suggestedCategory}.`
      : `No hay categoría editorial explícita. MENI sugiere ${suggestedCategory} a partir del perfil ${detectedProfile} (confianza ${Math.round(aiConfidence * 100)}%).`;
    return {
      finalCategory: suggestedCategory,
      editorCategory: null,
      suggestedProfile: detectedProfile,
      suggestedCategory,
      classificationSource: 'AI',
      classificationConfidence: aiConfidence,
      classificationReason: reason,
      classificationConflict: false,
      classificationStatus: ambiguous ? 'CATEGORY_AMBIGUOUS' : 'OK',
    };
  }

  // 5. ÚLTIMO RECURSO
  return {
    finalCategory: 'Nacionales',
    editorCategory: null,
    suggestedProfile: null,
    suggestedCategory: null,
    classificationSource: 'AI',
    classificationConfidence: 0,
    classificationReason: 'No hay categoría, perfil ni texto suficiente. Se aplica fallback Nacionales.',
    classificationConflict: false,
    classificationStatus: 'CATEGORY_AMBIGUOUS',
  };
}

/**
 * resolvePublicCategory — FUNCIÓN CANÓNICA ÚNICA
 * Todo el sistema debe usar esta función para obtener la categoría pública.
 * REGLA 5: perfil interno NUNCA escapa a la capa pública.
 */
export function resolvePublicCategory(article: Partial<Noticia>): PublicCategory {
  return resolveEditorialClassification(article).finalCategory;
}

/**
 * @deprecated Usar resolvePublicCategory
 */
export function resolveCanonicalCategoria(perfil: string | undefined, categoria: string | undefined): PublicCategory {
  if (categoria && isPublicCategory(categoria)) return categoria;
  if (perfil && PROFILE_TO_PUBLIC_CATEGORY[perfil as MeniContentProfile]) {
    return PROFILE_TO_PUBLIC_CATEGORY[perfil as MeniContentProfile];
  }
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
