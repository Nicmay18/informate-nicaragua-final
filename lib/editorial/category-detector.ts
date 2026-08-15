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

export function detectCategory(noticia: NoticiaInput, textoPlano?: string): string {
  const texto = textoPlano || (typeof noticia.contenido === 'string' ? noticia.contenido : String(noticia.contenido || '')).replace(/<[^>]*>/g, ' ');

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
