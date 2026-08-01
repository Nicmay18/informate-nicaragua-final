/**
 * Editor MENI — Diagnóstico editorial a partir del score y las dimensiones.
 *
 * No modifica el score. Convierte la puntuación en una guía de corrección
 * para el flujo: Nueva noticia → Redacción → MENI → Diagnóstico → Corrección → Publicación.
 */

export type MeniCalificacion =
  | 'PUBLICABLE_ORO'
  | 'PUBLICABLE_REVISION'
  | 'NECESITA_MEJORAS'
  | 'NO_PUBLICAR';

export interface EditorMeniInput {
  score: number;
  utilidad: number;
  profundidad: number;
  eeat: number;
  originalidad: number;
  aportePropio: number;
  adnNI: number;
}

export interface EditorMeniOutput {
  score: number;
  calificacion: MeniCalificacion;
  calificacionTexto: string;
  fortalezas: string[];
  debilidades: string[];
  acciones: string[];
}

const CALIFICACION_TEXTOS: Record<MeniCalificacion, string> = {
  PUBLICABLE_ORO: 'Publicable Oro',
  PUBLICABLE_REVISION: 'Publicable con revisión',
  NECESITA_MEJORAS: 'Necesita mejoras',
  NO_PUBLICAR: 'No publicar sin edición',
};

export function calificarMeni(score: number): { calificacion: MeniCalificacion; texto: string } {
  if (score >= 95) return { calificacion: 'PUBLICABLE_ORO', texto: CALIFICACION_TEXTOS.PUBLICABLE_ORO };
  if (score >= 85) return { calificacion: 'PUBLICABLE_REVISION', texto: CALIFICACION_TEXTOS.PUBLICABLE_REVISION };
  if (score >= 70) return { calificacion: 'NECESITA_MEJORAS', texto: CALIFICACION_TEXTOS.NECESITA_MEJORAS };
  return { calificacion: 'NO_PUBLICAR', texto: CALIFICACION_TEXTOS.NO_PUBLICAR };
}

function generarFortalezas(input: EditorMeniInput): string[] {
  const f: string[] = [];
  if (input.utilidad >= 80) f.push('Entrega información práctica o datos de servicio.');
  if (input.profundidad >= 80) f.push('Buena profundidad: contexto, antecedentes o cifras verificables.');
  if (input.eeat >= 80) f.push('Fuente clara y atribución identificada.');
  if (input.originalidad >= 80) f.push('Aporte propio o ángulo diferencial.');
  if (input.aportePropio === 100) f.push('Aporte propio explícito identificado.');
  if (input.adnNI >= 80) f.push('Identidad Nicaragua Informate fuerte.');
  return f;
}

function generarDebilidades(input: EditorMeniInput): string[] {
  const d: string[] = [];
  if (input.utilidad < 60) d.push('Falta utilidad concreta para el lector.');
  if (input.profundidad < 60) d.push('Falta contexto histórico, institucional o cifras.');
  if (input.eeat < 60) d.push('Falta atribución clara o citas estructuradas.');
  if (input.originalidad < 60) d.push('Poco aporte propio o ángulo poco diferenciado.');
  if (input.aportePropio === 0) d.push('No se detecta aporte propio.');
  if (input.adnNI < 60) d.push('Identidad editorial débil.');
  return d;
}

function generarAcciones(input: EditorMeniInput, score: number): string[] {
  const a: string[] = [];

  if (input.utilidad < 60) a.push('Mejorar cierre práctico o añadir datos de contacto/horario.');
  if (input.profundidad < 60) a.push('Añadir antecedentes, contexto o cifras oficiales.');
  if (input.eeat < 60) a.push('Incorporar fuente oficial o cita estructurada.');
  if (input.originalidad < 60) a.push('Reforzar el ángulo diferencial o el aporte propio.');
  if (input.aportePropio === 0) a.push('Añadir análisis o aporte propio de Nicaragua Informate.');
  if (input.adnNI < 60) a.push('Fortalecer el enfoque y la identidad editorial de Nicaragua Informate.');

  if (score < 70) a.push('No publicar sin edición sustancial.');
  else if (score < 85) a.push('Revisión editorial completa antes de publicar.');

  if (a.length === 0) a.push('Listo para publicar.');
  return a;
}

export function diagnosticarMeni(input: EditorMeniInput): EditorMeniOutput {
  const { calificacion, texto } = calificarMeni(input.score);
  return {
    score: input.score,
    calificacion,
    calificacionTexto: texto,
    fortalezas: generarFortalezas(input),
    debilidades: generarDebilidades(input),
    acciones: generarAcciones(input, input.score),
  };
}
