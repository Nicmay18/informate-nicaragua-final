import type { EditorialBrainInput } from './editorial-brain/types';
import type { EvaluacionEditorial } from '@/lib/editorial';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * MENI V3 — Profundidad.
 * Mide la capacidad de la noticia para explicar más allá del titular:
 * causas, consecuencias, contexto, antecedentes y datos verificables.
 */
export function analyzeProfundidad(input: EditorialBrainInput, evaluacion?: EvaluacionEditorial): number {
  const texto = stripHtml(`${input.titulo} ${input.contenido} ${input.resumen || ''}`).toLowerCase();
  const ev = evaluacion?.evidence;

  let score = 25;

  // Señales positivas
  if (ev?.context?.contextoHistorico) score += 15;
  if (ev?.context?.contextoInstitucional) score += 10;
  if (ev?.context?.contextoLegal) score += 10;
  if (ev?.chronology?.tieneCronologia) score += 10;

  const nombres = ev?.valorEditorial?.nombresPropiosCount ?? 0;
  if (nombres >= 3) score += 10;
  if (nombres >= 6) score += 5;

  if ((ev?.valorEditorial?.institucionesCount ?? 0) >= 1) score += 10;

  const fuentes = ev?.sources?.numeroFuentes ?? 0;
  if (fuentes >= 2) score += 10;
  if (fuentes >= 3) score += 5;
  if (ev?.sources?.documentoOficial) score += 5;

  const cifras = ev?.evidence?.datosConcretos?.cifras ?? 0;
  if (cifras > 0) score += 10;
  if (cifras >= 3) score += 5;

  const total = ev?.valorEditorial?.parrafosTotal ?? 0;
  const sinDato = ev?.valorEditorial?.parrafosSinDato ?? 0;
  if (total > 0 && sinDato / total <= 0.3) score += 10;

  if (texto.length > 800) score += 5;

  // Señales negativas
  if (ev?.forense?.tieneRedundancia) score -= 10;
  if (ev?.risk?.atribucionesFalsas) score -= 15;
  if (ev?.valorEditorial?.tieneAtribucionVaga) score -= 10;
  if (total > 0 && sinDato / total > 0.6) score -= 15;
  if (texto.length < 250) score -= 10;
  if (fuentes === 0) score -= 10;

  return clamp(score);
}
