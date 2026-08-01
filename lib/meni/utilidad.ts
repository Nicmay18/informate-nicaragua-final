import type { EditorialBrainInput } from './editorial-brain/types';
import type { EvaluacionEditorial } from '@/lib/editorial';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * MENI V3 — Utilidad.
 * Mide si la noticia entrega información que el lector puede usar,
 * no solo la presencia de palabras clave.
 */
export function analyzeUtilidad(input: EditorialBrainInput, evaluacion?: EvaluacionEditorial): number {
  const texto = stripHtml(`${input.titulo} ${input.contenido} ${input.resumen || ''}`).toLowerCase();
  const ev = evaluacion?.evidence;

  let score = 20;

  // Señales positivas
  if (ev?.utility?.tieneServicio) score += 20;
  if (ev?.utility?.tieneRecomendaciones) score += 10;
  if (ev?.adsense?.tieneDatosConcretos) score += 15;
  if (ev?.chronology?.tieneCronologia) score += 10;

  const nombres = ev?.valorEditorial?.nombresPropiosCount ?? 0;
  if (nombres >= 2) score += 5;
  if (nombres >= 4) score += 5;

  if ((ev?.valorEditorial?.institucionesCount ?? 0) >= 1) score += 5;

  const fuentes = ev?.sources?.numeroFuentes ?? 0;
  if (fuentes >= 1) score += 5;
  if (fuentes >= 2) score += 5;

  const total = ev?.valorEditorial?.parrafosTotal ?? 0;
  const sinDato = ev?.valorEditorial?.parrafosSinDato ?? 0;
  if (total > 0 && sinDato / total <= 0.3) score += 10;

  if (texto.length > 300) score += 5;

  // Datos prácticos en el texto
  if (/(\b(tel[ée]fono|contacto|número|llamar|dirección|horario|whatsapp|correo)\b)/.test(texto)) score += 10;
  if (/(\b(c[oó]mo|qu[eé] hacer|d[oó]nde|cu[áa]ndo|paso a paso|evitar|prevenir|recomendaci[oó]n)\b)/.test(texto)) score += 10;
  if (/(\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2} de [a-záéíóúñ]+ de \d{4}\b|\b(hoy|mañana|ayer)\b)/.test(texto)) score += 5;

  // Señales negativas
  if (ev?.risk?.cierreGenerico) score -= 10;
  if (ev?.adsense?.tieneClickbait) score -= 10;
  if (total > 0 && sinDato / total > 0.6) score -= 15;
  if (texto.length < 250) score -= 10;
  if (fuentes === 0) score -= 10;

  return clamp(score);
}
