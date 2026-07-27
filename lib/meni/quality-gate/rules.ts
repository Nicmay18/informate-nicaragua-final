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

// Patrones de cronología imposible: acción posterior a la muerte descrita antes de un traslado con vida.
export const CHRONOLOGY_CONTRADICTION_PATTERNS: [RegExp, RegExp][] = [
  [/muri[oó]/i, /(fue\s+traslad|trasladaron|es\s+traslad)/i],
  [/falleci[oó]/i, /(fue\s+traslad|trasladaron|es\s+traslad)/i],
];

// Cierres genéricos / introducciones repetidas típicas de relleno editorial.
export const GENERIC_CLOSINGS = [
  'las autoridades continúan las investigaciones',
  'se espera que las autoridades brinden más información',
  'hasta el momento no hay más detalles',
];

export const MIN_EXPLANATION_SCORE = 60;
export const MAX_TRANSCRIPTION_PERCENT = 40;
export const MIN_ORIGINALITY_PERCENT = 80;
