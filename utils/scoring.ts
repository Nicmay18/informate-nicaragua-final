import type { Noticia } from '@/lib/types';

/**
 * Calcula el score de calidad técnica de una noticia basándose estrictamente
 * en criterios objetivos de SEO on-page y estructura de la información.
 * No discrimina categorías ni contiene lógica de ocultamiento.
 *
 * @param noticia - Payload parcial de Noticia (solo campos necesarios)
 * @returns Entero entre 0 y 100
 */
export function calcularScoreEditorial(noticia: Pick<Noticia, 'titulo' | 'resumen' | 'contenido' | 'imagen'>): number {
  let score = 0;

  if (!noticia) return 0;

  // 1. Longitud del Artículo (Meta mínima: 500+ palabras)
  const textoPlano = (noticia.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;

  if (palabras >= 500) {
    score += 30;
  } else if (palabras >= 250) {
    score += 15; // Puntuación parcial para notas de actualización rápida
  }

  // 2. Calidad del Titular SEO (Rango ideal: 65 a 70 caracteres)
  const largoTitulo = noticia.titulo ? noticia.titulo.length : 0;
  if (largoTitulo >= 65 && largoTitulo <= 70) {
    score += 20;
  } else if (largoTitulo > 0) {
    score += 5; // Fuera de rango pero existente
  }

  // 3. Meta Descripción / Resumen (Rango ideal: 120 a 160 caracteres)
  const largoResumen = noticia.resumen ? noticia.resumen.length : 0;
  if (largoResumen >= 120 && largoResumen <= 160) {
    score += 20;
  } else if (largoResumen > 0) {
    score += 5;
  }

  // 4. Imagen Destacada Obligatoria
  if (noticia.imagen && noticia.imagen.trim() !== '' && noticia.imagen.trim() !== '/logo.webp') {
    score += 15;
  }

  // 5. Estructura HTML (Presencia de subtítulos H2, H3 o negritas estructuradas)
  const tieneSubtitulos = /<h[23][^>]*>/i.test(noticia.contenido || '');
  const tieneNegritas = /<strong[^>]*>|<b>/i.test(noticia.contenido || '');

  if (tieneSubtitulos) score += 10;
  if (tieneNegritas) score += 5;

  // Retorna un entero limpio entre 0 y 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Devuelve un label legible para el score calculado.
 */
export function labelScore(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'Regular';
  if (score >= 20) return 'Necesita mejoras';
  return 'Deficiente';
}

/**
 * Devuelve un color asociado al score para UI.
 */
export function colorScore(score: number): string {
  if (score >= 80) return '#16a34a'; // green-600
  if (score >= 60) return '#2563eb'; // blue-600
  if (score >= 40) return '#ca8a04'; // yellow-600
  if (score >= 20) return '#ea580c'; // orange-600
  return '#dc2626'; // red-600
}
