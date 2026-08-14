import type { Noticia } from '@/lib/types';
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

const PROFILE_TO_CATEGORIA: Record<MeniContentProfile, string> = {
  sucesos: 'Sucesos',
  violencia_genero: 'Sucesos',
  nacionales: 'Nacionales',
  politica: 'Política',
  economia: 'Economía',
  salud: 'Salud',
  deportes: 'Deportes',
  cultura: 'Cultura',
  espectaculos: 'Espectáculos',
  tecnologia: 'Tecnología',
  internacional: 'Internacionales',
  educacion: 'Educación',
  ambiente: 'Ambiente',
  turismo: 'Turismo',
  gastronomia: 'Cultura',
};

export function resolveCanonicalCategoria(perfil: string | undefined, categoria: string | undefined): string {
  const known = perfil && PROFILE_TO_CATEGORIA[perfil as MeniContentProfile];
  if (known) return known;
  if (categoria && categoria.trim()) return categoria.trim();
  return 'General';
}

export function resolveCanonicalProfile(
  titulo: string,
  contenido: string,
  resumen: string,
  perfil?: string | null
): MeniContentProfile {
  if (perfil && PROFILE_TO_CATEGORIA[perfil as MeniContentProfile]) {
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
