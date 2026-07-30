/**
 * MENI Quality Gate — Reglas y lexicones
 * =======================================
 */

// Variantes de terminología que deben unificarse a una forma canónica.
export const TERMINOLOGY_VARIANTS: Record<string, string[]> = {
  pitbull: ['pit bull', 'pitbull', 'pit-bull', 'american pitbull', 'american pit bull', 'american pit-bull'],
  'motocicleta': ['moto', 'motocicleta', 'motociclo'],
  'vehículo': ['carro', 'vehiculo', 'vehículo', 'automóvil', 'automovil'],
};

// Palabras de relleno que no aportan información verificable.
export const FILLER_WORDS = [
  'muy', 'bastante', 'sumamente', 'terrible', 'espantoso', 'impactante',
  'macabro', 'horrible', 'brutal', 'dantesco', 'escalofriante', 'devastador',
];

// Frases sensacionalistas que deben eliminarse o neutralizarse.
export const SENSATIONALIST_PHRASES = [
  'bañado en sangre',
  'devorado',
  'desgarró',
  'cuerpo destrozado',
  'escena de terror',
  'escena dantesca',
  'baño de sangre',
  'masacre',
];

// Afirmaciones absolutas sin respaldo típico (patrones).
export const UNSUPPORTED_CLAIM_PATTERNS: RegExp[] = [
  /el\s+(\w+)\s+es\s+el\s+(más|mas)\s+agresivo/i,
  /siempre\s+(ataca|mata|hace)/i,
  /todos\s+los\s+(\w+)\s+son/i,
  /nunca\s+(falla|se\s+equivoca)/i,
];

// Patrones de cronología: detectan contradicciones reales, no estructuras narrativas válidas.
export const CHRONOLOGY_CONTRADICTION_PATTERNS: RegExp[] = [
  // Muerte o desenlace seguido de acción posterior con vida en la misma oración.
  // Ej: "falleció y luego fue trasladado al hospital" (imposible si ya murió).
  /(?:falleci[oó]|muri[oó]|fallecimient|muerte)\b[^.!?]{0,80}\b(?:luego|posteriormente|después|despues|más tarde|dias después|días después|al día siguiente)\b[^.!?]{0,80}\b(?:fue\s+trasladad|trasladaron|ingresad|hospitalizad|atendid[oa]|intervenid[oa])\b/i,
  // Fechas incompatibles en la misma oración: falleció el 10 ... ingresado el 12.
  /(?:falleci[oó]|muri[oó])\b[^.]{0,120}\bel\s+(\d{1,2})\s+de\s+([a-záéíóúñ]+)[^.]{0,120}\b(?:trasladad|ingresad|hospitalizad|atendid[oa])\b[^.]{0,120}\bel\s+(\d{1,2})\s+de\s+([a-záéíóúñ]+)/i,
];

// Eventos reconocidos para verificar secuencias narrativas (no bloquean solos).
export const CHRONOLOGY_EVENT_PATTERNS = {
  inicio: /\b(?:accidente|ataque|emergencia|enfermedad|incidente)\b/i,
  atencion: /\b(?:traslado|ingreso hospitalario|tratamiento médico|intervención quirúrgica|cuidados intensivos|fue trasladad[oa]|trasladaron|hospitalizad[oa])\b/i,
  desenlace: /\b(?:fallecimient|murió|falleció|recuperación|alta médica)\b/i,
};

// Cierres genéricos / introducciones repetidas típicas de relleno editorial.
export const GENERIC_CLOSINGS = [
  'las autoridades continúan las investigaciones',
  'se espera que las autoridades brinden más información',
  'hasta el momento no hay más detalles',
];

export const MIN_EXPLANATION_SCORE = 60;
export const MAX_TRANSCRIPTION_PERCENT = 40;
export const MIN_ORIGINALITY_PERCENT = 70;
