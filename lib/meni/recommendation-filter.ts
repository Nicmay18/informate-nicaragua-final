/**
 * MENI Recommendation Filter
 * ============================
 * Antes de mostrar una sugerencia al periodista verifica:
 * 1. Si ya está respondida en el texto.
 * 2. Si aplica al perfil detectado.
 * 3. Solo muestra la ausencia real.
 */

import type { MeniContentProfile } from './profile-detector';
import { CATEGORIAS_EDITORIALES, getPerfilEditorial } from './editorial-profiles';

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
    .filter((w) => w.length > 3 && !['para', 'como', 'debe', 'falta', 'agregar', 'incluir', 'respuesta', 'donde', 'cuando', 'quien'].includes(w));
  if (keywords.length === 0) return false;
  return keywords.some((k) => nText.includes(k));
}

function appliesToProfile(mensaje: string, profile: MeniContentProfile, text: string): boolean {
  const nMsg = normalize(mensaje);

  const profileStopwords: Record<MeniContentProfile, string[]> = {
    sucesos: ['sintoma', 'sintomas', 'prevencion', 'como se transmite', 'vacuna', 'enfermedad'],
    violencia_genero: ['sintoma', 'sintomas', 'como se transmite', 'vacuna'],
    nacionales: [],
    politica: ['sintoma', 'sintomas', 'como se transmite'],
    economia: ['sintoma', 'sintomas', 'como se transmite'],
    salud: ['fallecido', 'accidente', 'trafico', 'investigacion policial'],
    deportes: ['sintoma', 'como se transmite'],
    cultura: ['sintoma', 'como se transmite'],
    tecnologia: ['sintoma', 'como se transmite'],
    internacional: [],
  };

  const forbidden = profileStopwords[profile] || [];
  if (forbidden.some((w) => nMsg.includes(w))) return false;

  const perfilCategoria = getPerfilEditorial(profile, text);
  const mandatory = (CATEGORIAS_EDITORIALES[perfilCategoria.tipo]?.preguntasObligatorias || []).map(normalize);

  if (mandatory.some((q) => nMsg.includes(q))) return true;
  if (nMsg.includes(normalize(perfilCategoria.mensajeServicioFaltante))) return true;
  return false;
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
    .filter((r) => appliesToProfile(r.mensaje, profile, text))
    .filter((r) => !isAnsweredInText(r.mensaje, text));
}
