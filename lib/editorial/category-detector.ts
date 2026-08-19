/**
 * CategoryDetector V5 — REGLA 2
 * =============================
 * Detecta la categoría PÚBLICA del artículo.
 * Solo puede devolver una de las 6 categorías canónicas.
 * Los perfiles internos (salud, ambiente, cultura, etc.) se mapean a Nacionales.
 */

import type { NoticiaInput } from './core/types';
import { resolvePublicCategory } from './canonical';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { isPublicCategory } from '@/lib/types';

export function detectCategory(noticia: NoticiaInput, textoPlano?: string): string {
  const texto = textoPlano || (typeof noticia.contenido === 'string' ? noticia.contenido : String(noticia.contenido || '')).replace(/<[^>]*>/g, ' ');

  // Si la categoría pública ya está explícita en el input editorial, respetarla.
  // La redetección solo se usa cuando no hay categoría pública o es inválida.
  const explicit = (noticia.categoria || '').trim();
  if (isPublicCategory(explicit)) return explicit;

  const detected = detectContentProfile(
    noticia.titulo || '',
    texto,
    noticia.resumen || ''
  );

  return resolvePublicCategory({
    titulo: noticia.titulo,
    contenido: texto,
    resumen: noticia.resumen,
    categoria: noticia.categoria,
    perfil: detected.profile_detected,
  });
}
