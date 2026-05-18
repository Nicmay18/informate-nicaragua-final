/**
 * SEO Title System — Nicaragua Informate
 * Genera y valida títulos optimizados para Google Search y Discover
 */

export type NoticiaTipo =
  | 'Tecnología' | 'Sucesos' | 'Economía' | 'Salud' | 'Infraestructura' | 'Judicial'
  | 'Nacionales' | 'Deportes' | 'Internacionales' | 'Espectáculos' | 'General';

export interface SEOInput {
  tipo: NoticiaTipo;
  tituloOriginal: string;
  lugar?: string;
  pais?: string;
  empresa?: string;
  cifra?: string;
  palabraClave: string;
  contexto?: string;
}

const MAX_LENGTH = 60;
const MIN_LENGTH = 30;

function cleanTitle(title: string): string {
  return title
    .replace(/[¡!]/g, '')
    .replace(/\.\.\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cutToLimit(title: string, limit = MAX_LENGTH): string {
  if (title.length <= limit) return title;
  const words = title.split(' ');
  let result = '';
  for (const word of words) {
    const next = result ? `${result} ${word}` : word;
    if (next.length > limit) break;
    result = next;
  }
  return result.trim();
}

/**
 * Genera un título SEO optimizado según el tipo de noticia
 */
export function generateOptimizedTitle(input: SEOInput): string {
  const { tipo, tituloOriginal, lugar, pais, empresa, cifra, palabraClave, contexto } = input;

  // Detectar palabras clave del título original para contexto
  const hasVerbs = /\b(abre|inicia|deja|anuncia|estrena|confirma|investiga|amplia|revela|presenta|lanza)\b/i.test(tituloOriginal);

  let title = '';

  switch (tipo) {
    case 'Tecnología':
      title = `${pais || 'China'} impulsa ${palabraClave} para industria`;
      break;
    case 'Sucesos':
      title = `${palabraClave} deja ${cifra || 'afectados'} en ${lugar || 'Nicaragua'}`;
      break;
    case 'Economía':
      title = `${empresa || palabraClave} expande operaciones en ${lugar || 'Nicaragua'}`;
      break;
    case 'Salud':
      title = `${pais || 'Autoridades'} investigan ${palabraClave}`;
      break;
    case 'Infraestructura':
      title = `${lugar || 'Nicaragua'} inaugura ${palabraClave}`;
      break;
    case 'Judicial':
      title = `Condenan por ${palabraClave} en ${lugar || 'Nicaragua'}`;
      break;
    case 'Deportes':
      title = `${palabraClave} en ${lugar || 'Nicaragua'}: ${contexto || 'resultados de la jornada'}`;
      break;
    case 'Nacionales':
      title = `${palabraClave} en Nicaragua: ${contexto || 'detalles del anuncio'}`;
      break;
    case 'Internacionales':
      title = `${palabraClave} en ${pais || 'el extranjero'}: ${contexto || 'últimas novedades'}`;
      break;
    case 'Espectáculos':
      title = `${palabraClave} ${contexto || 'en el mundo del entretenimiento'}`;
      break;
    default:
      title = tituloOriginal;
  }

  title = cleanTitle(title);

  if (contexto && !title.includes(contexto)) {
    title = cutToLimit(`${title} ${contexto}`);
  }

  // Si no tiene verbo fuerte, forzar uno
  if (!hasVerbs && title.length < MAX_LENGTH - 10) {
    const strongVerbs = ['Anuncian', 'Confirman', 'Investigan', 'Abren', 'Inician', 'Presentan'];
    const verb = strongVerbs[Math.floor(Math.random() * strongVerbs.length)];
    if (!title.toLowerCase().includes(verb.toLowerCase())) {
      title = `${verb} ${title.charAt(0).toLowerCase()}${title.slice(1)}`;
    }
  }

  title = cutToLimit(title);

  return title;
}

/**
 * Valida un título SEO según las reglas editoriales
 */
export function validateTitle(title: string): { valid: boolean; errors: string[]; score: number } {
  const errors: string[] = [];
  let score = 100;

  const bannedWords = [
    'increible', 'impactante', 'escandalo', 'revelan',
    'destapan', 'no vas a creer', 'sorprendente', 'impacto',
    'shocking', 'exclusivo', 'urgente', 'alerta',
  ];

  if (title.length > MAX_LENGTH) {
    errors.push(`Título muy largo: ${title.length} caracteres (máx ${MAX_LENGTH})`);
    score -= 25;
  }

  if (title.length < MIN_LENGTH) {
    errors.push(`Título muy corto: ${title.length} caracteres (mín ${MIN_LENGTH})`);
    score -= 15;
  }

  if (/[¡!]/.test(title)) {
    errors.push('No usar signos de exclamación');
    score -= 10;
  }

  if (/[A-Z]{3,}/.test(title)) {
    errors.push('No usar MAYÚSCULAS excesivas');
    score -= 10;
  }

  if (title.includes('...')) {
    errors.push('No usar puntos suspensivos');
    score -= 5;
  }

  const lowerTitle = title.toLowerCase();
  for (const word of bannedWords) {
    if (lowerTitle.includes(word)) {
      errors.push(`Palabra prohibida detectada: "${word}"`);
      score -= 20;
    }
  }

  const properNames = title.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || [];
  if (properNames.length > 5) {
    errors.push('Demasiados nombres propios');
    score -= 10;
  }

  const strongVerbs = /\b(confirma|investiga|abre|inicia|deja|anuncia|estrena|presenta|lanza|amplia|revela|condena|inaugura|expande)\b/i;
  if (!strongVerbs.test(title) && !/[0-9]/.test(title)) {
    errors.push('Falta verbo fuerte o dato concreto');
    score -= 15;
  }

  // Bonus por buenas prácticas
  if (title.length >= 45 && title.length <= 60) score += 5;
  if (/[0-9]/.test(title)) score += 5;
  if (strongVerbs.test(title)) score += 5;

  return { valid: errors.length === 0, errors, score: Math.max(0, Math.min(100, score)) };
}

/**
 * Genera SEO title + valida en una sola llamada
 */
export function generateAndValidateTitle(input: SEOInput): {
  title: string;
  valid: boolean;
  errors: string[];
  score: number;
} {
  const title = generateOptimizedTitle(input);
  const validation = validateTitle(title);
  return { title, ...validation };
}
