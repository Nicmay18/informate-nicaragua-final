/**
 * MENI Recommendation Filter
 * ============================
 * Antes de mostrar una sugerencia al periodista verifica:
 * 1. Si ya está respondida en el texto.
 * 2. Si aplica al perfil detectado.
 * 3. Solo muestra la ausencia real.
 */

import type { MeniContentProfile } from './profile-detector';

export interface MeniRecomendacion {
  area: string;
  severidad: 'baja' | 'media' | 'alta';
  mensaje: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isAnsweredInText(recommendation: string, text: string): boolean {
  const nText = normalize(text);
  const nRec = normalize(recommendation);
  const keywords = nRec
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['para', 'como', 'debe', 'falta', 'agregar', 'incluir', 'respuesta', 'donde', 'cuando', 'quien', 'fue', 'hace', 'esta', 'cuales', 'cuantos', 'cuantas'].includes(w));

  // Evidencia semántica: una recomendación está respondida si la mitad
  // o más de sus palabras clave aparecen en el texto.
  if (keywords.length === 0) return false;
  const matches = keywords.filter((k) => nText.includes(k)).length;
  return matches >= Math.ceil(keywords.length / 2);
}

function appliesToProfile(mensaje: string, profile: MeniContentProfile): boolean {
  const nMsg = normalize(mensaje);

  const profileStopwords: Record<MeniContentProfile, string[]> = {
    sucesos: ['sintoma', 'sintomas', 'prevencion', 'prevenir', 'como se transmite', 'transmision', 'vacuna', 'enfermedad'],
    violencia_genero: ['sintoma', 'sintomas', 'como se transmite', 'vacuna'],
    nacionales: [],
    politica: ['sintoma', 'sintomas', 'como se transmite'],
    economia: ['sintoma', 'sintomas', 'como se transmite'],
    salud: ['fallecido', 'accidente', 'trafico', 'investigacion policial'],
    deportes: ['sintoma', 'como se transmite', 'marco legal'],
    cultura: ['sintoma', 'como se transmite'],
    espectaculos: ['sintoma', 'como se transmite', 'marco legal', 'fallecido', 'accidente'],
    tecnologia: ['sintoma', 'como se transmite'],
    internacional: [],
    educacion: ['fallecido', 'accidente', 'trafico', 'investigacion policial'],
    ambiente: ['fallecido', 'accidente', 'trafico', 'investigacion policial'],
    turismo: ['sintoma', 'como se transmite', 'marco legal', 'quien gana', 'quien pierde', 'salud', 'prevencion', 'vacuna', 'enfermedad', 'hospital', 'medico', 'brote', 'epidemia', 'contagio'],
    gastronomia: ['sintoma', 'como se transmite', 'marco legal'],
    espectaculos: ['sintoma', 'como se transmite', 'marco legal', 'brote', 'epidemia', 'contagio'],
  };

  const forbidden = profileStopwords[profile] || [];
  if (forbidden.some((w) => nMsg.includes(w))) return false;

  // Una recomendación aplica al perfil si no contiene palabras prohibidas.
  // La ausencia real se decide luego en isAnsweredInText.
  return true;
}

export function filterRecommendations(
  recomendaciones: MeniRecomendacion[],
  profile: MeniContentProfile,
  titulo: string,
  contenido: string,
  resumen?: string,
): MeniRecomendacion[] {
  const text = `${titulo} ${contenido} ${resumen || ''}`;
  return recomendaciones
    .filter((r) => appliesToProfile(r.mensaje, profile))
    .filter((r) => !isAnsweredInText(r.mensaje, text));
}
