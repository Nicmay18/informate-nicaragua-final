import type { MeniResult } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { PROFILE_TO_PUBLIC_CATEGORY } from '@/lib/editorial/canonical';

export type EditorialStatus = 'READY' | 'NEEDS_REVIEW' | 'CONFLICT' | 'INSUFFICIENT_DATA' | 'BLOCKED';

export interface EditorialProblem {
  id: string;
  problem: string;
  cause: string;
  impact: string;
  recommendation: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  autoFixAvailable: boolean;
  requiresHuman: boolean;
  evidence?: string;
  field?: 'categoria' | 'perfil' | 'ubicacion' | 'titulo' | 'contenido' | 'autor' | 'fuente' | 'general';
}

export interface EditorialDiagnosis {
  generatedAt: string;
  editorialStatus: EditorialStatus;
  observations: string[];
  problems: EditorialProblem[];
  warnings: EditorialProblem[];
  recommendations: EditorialProblem[];
  requiredActions: EditorialProblem[];
  autoFixes: EditorialProblem[];
  humanActions: EditorialProblem[];
  publicationReadiness: 'READY' | 'NEEDS_REVIEW' | 'BLOCKED';
  score: number | null;
  scoreReadiness: 'READY' | 'NEEDS_REVIEW' | 'BLOCKED';
  category: string;
  editorCategory?: string;
  suggestedCategory?: string;
  profile?: string;
  eventCountry?: string;
  eventCity?: string;
  personNationality?: string;
  summary: string;
  hasEvidence: boolean;
}

const NATIONALITY_WORDS: Record<string, string> = {
  nicaragüense: 'Nicaragua',
  nicaraguense: 'Nicaragua',
  panameño: 'Panamá',
  panameno: 'Panamá',
  mexicano: 'México',
  costarricense: 'Costa Rica',
  guatemalteco: 'Guatemala',
  salvadoreño: 'El Salvador',
  salvadoreno: 'El Salvador',
  hondureño: 'Honduras',
  hondureno: 'Honduras',
  estadounidense: 'Estados Unidos',
  norteamericano: 'Estados Unidos',
  colombiano: 'Colombia',
  venezolano: 'Venezuela',
  ecuatoriano: 'Ecuador',
  peruano: 'Perú',
  boliviano: 'Bolivia',
  chileno: 'Chile',
  argentino: 'Argentina',
  uruguayo: 'Uruguay',
  paraguayo: 'Paraguay',
  brasileño: 'Brasil',
  cubano: 'Cuba',
  dominicano: 'República Dominicana',
  español: 'España',
  canadiense: 'Canadá',
};

const COUNTRY_WORDS: Record<string, string> = {
  nicaragua: 'Nicaragua',
  panamá: 'Panamá',
  panama: 'Panamá',
  méxico: 'México',
  mexico: 'México',
  'costa rica': 'Costa Rica',
  guatemala: 'Guatemala',
  'el salvador': 'El Salvador',
  honduras: 'Honduras',
  'estados unidos': 'Estados Unidos',
  'ee.uu.': 'Estados Unidos',
  eeuu: 'Estados Unidos',
  usa: 'Estados Unidos',
  colombia: 'Colombia',
  venezuela: 'Venezuela',
  ecuador: 'Ecuador',
  perú: 'Perú',
  peru: 'Perú',
  bolivia: 'Bolivia',
  chile: 'Chile',
  argentina: 'Argentina',
  uruguay: 'Uruguay',
  paraguay: 'Paraguay',
  brasil: 'Brasil',
  cuba: 'Cuba',
  'república dominicana': 'República Dominicana',
  españa: 'España',
  canadá: 'Canadá',
  canada: 'Canadá',
};

const CITY_WORDS: Record<string, string> = {
  managua: 'Managua',
  león: 'León',
  leon: 'León',
  granada: 'Granada',
  matagalpa: 'Matagalpa',
  chinandega: 'Chinandega',
  'ciudad de panamá': 'Ciudad de Panamá',
  'ciudad de panama': 'Ciudad de Panamá',
  'san josé': 'San José',
  'san jose': 'San José',
  'san salvador': 'San Salvador',
  'guatemala city': 'Ciudad de Guatemala',
  tegucigalpa: 'Tegucigalpa',
};

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectPersonNationality(text: string): string | undefined {
  const lower = stripAccents(text.toLowerCase());
  for (const [word, country] of Object.entries(NATIONALITY_WORDS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
      return country;
    }
  }
  return undefined;
}

const LOCATION_PREPOSITIONS = new Set([
  'en',
  'en la',
  'en el',
  'en las',
  'en los',
  'ocurrió en',
  'ocurrio en',
  'sucedió en',
  'sucedio en',
  'falleció en',
  'fallecio en',
  'murió en',
  'murio en',
  'accidente en',
  'hecho en',
  'lugar de',
  'ocurrido en',
  'fallecido en',
  'ubicado en',
  'situado en',
  'reside en',
  'llegó a',
  'llego a',
  'viajó a',
  'viajo a',
  'fue a',
  'cerca de',
  'alrededor de',
  'frente a',
]);

function scoreLocationPreposition(text: string, matchStart: number): number {
  const windowStart = Math.max(0, matchStart - 50);
  const before = text.slice(windowStart, matchStart);
  const lowerBefore = before.toLowerCase();
  for (const prep of LOCATION_PREPOSITIONS) {
    if (lowerBefore.endsWith(prep.toLowerCase())) return 10;
  }
  // weaker signals
  if (/(?:^|\s)(de|del|a|al)\s+$/i.test(before)) return 2;
  return 1;
}

function findBestLocation(text: string, dictionary: Record<string, string>): string | undefined {
  const lower = stripAccents(text.toLowerCase());
  const entries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
  let bestScore = -1;
  let bestValue: string | undefined;
  let bestIndex = Infinity;

  for (const [key, value] of entries) {
    const normalizedKey = stripAccents(key.toLowerCase());
    if (normalizedKey.includes(' ')) {
      let idx = lower.indexOf(normalizedKey);
      while (idx !== -1) {
        const score = scoreLocationPreposition(lower, idx);
        if (score > bestScore || (score === bestScore && idx < bestIndex)) {
          bestScore = score;
          bestValue = value;
          bestIndex = idx;
        }
        idx = lower.indexOf(normalizedKey, idx + 1);
      }
    } else {
      const regex = new RegExp(`\\b${normalizedKey.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = regex.exec(lower)) !== null) {
        const idx = m.index;
        const score = scoreLocationPreposition(lower, idx);
        if (score > bestScore || (score === bestScore && idx < bestIndex)) {
          bestScore = score;
          bestValue = value;
          bestIndex = idx;
        }
      }
    }
  }

  return bestValue;
}

function detectEventCountry(text: string): string | undefined {
  return findBestLocation(text, COUNTRY_WORDS);
}

function detectEventCity(text: string): string | undefined {
  return findBestLocation(text, CITY_WORDS);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function problemsForCategoryConflict(result: MeniResult): EditorialProblem[] {
  const list: EditorialProblem[] = [];
  if (result.classificationConflict && result.editorCategory && result.suggestedCategory) {
    list.push({
      id: 'category-conflict',
      problem: 'La categoría seleccionada entra en conflicto con la clasificación sugerida.',
      cause: `El editor seleccionó "${result.editorCategory}" pero MENI sugiere "${result.suggestedCategory}".`,
      impact: 'Puede producir clasificación editorial incorrecta si se publica sin revisar.',
      recommendation: 'Revisar la categoría y confirmar si la selección del editor es la correcta.',
      priority: 'medium',
      autoFixAvailable: false,
      requiresHuman: true,
      evidence: result.classificationReason,
      field: 'categoria',
    });
  }

  if (result.suggestedProfile) {
    const profileCategory = PROFILE_TO_PUBLIC_CATEGORY[result.suggestedProfile];
    if (profileCategory && profileCategory !== result.categoria) {
      list.push({
        id: 'profile-category-conflict',
        problem: `El perfil detectado (${result.suggestedProfile}) apunta a "${profileCategory}", no a "${result.categoria}".`,
        cause: 'El contenido contiene señales del módulo ' + result.suggestedProfile + ' que no coinciden con la categoría pública resuelta.',
        impact: 'El módulo editorial aplicado puede no ser el más adecuado para la redacción.',
        recommendation: 'Verificar si la categoría o el enfoque del texto es el correcto.',
        priority: 'medium',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'perfil',
      });
    }
  }

  return list;
}

function problemsForLocation(
  result: MeniResult,
  extracted: { eventCountry?: string; personNationality?: string; eventCity?: string },
): EditorialProblem[] {
  const list: EditorialProblem[] = [];
  const { eventCountry, personNationality } = extracted;

  if (eventCountry && result.categoria === 'Nacionales' && eventCountry !== 'Nicaragua') {
    list.push({
      id: 'location-category-conflict',
      problem: `La categoría es Nacionales, pero el hecho principal parece ocurrir en ${eventCountry}.`,
      cause: `MENI encontró una referencia explícita a ${eventCountry} en el contenido.`,
      impact: 'Puede clasificarse incorrectamente como noticia nacional.',
      recommendation: 'Revisar si el evento realmente ocurre en Nicaragua o si corresponde a Internacionales.',
      priority: 'high',
      autoFixAvailable: false,
      requiresHuman: true,
      evidence: `eventCountry=${eventCountry}`,
      field: 'ubicacion',
    });
  }

  if (personNationality && !eventCountry) {
    list.push({
      id: 'missing-event-location',
      problem: `Se identifica nacionalidad (${personNationality}), pero no se detecta el país del evento.`,
      cause: 'El contenido menciona el origen de la persona, pero no dónde ocurre la noticia.',
      impact: 'Dificulta determinar si la noticia es nacional o internacional.',
      recommendation: 'Agregar la ubicación del hecho si es relevante.',
      priority: 'low',
      autoFixAvailable: false,
      requiresHuman: true,
      field: 'ubicacion',
    });
  }

  return list;
}

function hasMatch(text: string, regex: RegExp): boolean {
  return regex.test(text);
}

function problemsForMissingContext(noticia: NoticiaInput, result: MeniResult): EditorialProblem[] {
  const list: EditorialProblem[] = [];
  const text = `${noticia.titulo} ${noticia.resumen || ''} ${noticia.contenido}`;

  const isSucesos = result.categoria === 'Sucesos' || result.suggestedProfile === 'sucesos';
  const isHealth = /\b(salud|enfermedad|médico|medico|vacuna|hospital|MINSA|clínica)\b/i.test(text);
  const isSports = result.categoria === 'Deportes' || result.suggestedProfile === 'deportes';

  if (isSucesos) {
    if (!hasMatch(text, /\b\d{1,3}\s+(?:años|año)\b/i)) {
      list.push({
        id: 'missing-age',
        problem: 'No se detecta edad de la persona involucrada.',
        cause: 'Los hechos de sucesos suelen requerir edad para contexto social y legal.',
        impact: 'El lector pierde referencia demográfica y el relato carece de contexto.',
        recommendation: 'Agregar la edad si está disponible o indicar que no fue proporcionada.',
        priority: 'low',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
    if (!hasMatch(text, /\b(nomb(?:re|rada|rado)|identificad[oa]|llamad[oa]|identificada)\b/i)) {
      list.push({
        id: 'missing-name',
        problem: 'No se identifica el nombre de la persona.',
        cause: 'La nota no menciona nombre ni indica que no fue revelado.',
        impact: 'Dificulta la verificación y la conexión con otras noticias.',
        recommendation: 'Incluir el nombre si es público o aclarar que se reserva por privacidad.',
        priority: 'low',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
    if (!hasMatch(text, /\b(carro|moto|camion|autobus|microbus|vehículo|vehiculo|camión)\b/i)) {
      list.push({
        id: 'missing-vehicle',
        problem: 'No se menciona el vehículo involucrado.',
        cause: 'Un accidente vial típicamente incluye el tipo de vehículo.',
        impact: 'Falta precisión en la narrativa del incidente.',
        recommendation: 'Agregar el tipo de vehículo si aplica.',
        priority: 'low',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
    if (!hasMatch(text, /\b(hospital|clínica|policía|bomberos|MINSA|INSS|alcaldía|ministerio|institución)\b/i)) {
      list.push({
        id: 'missing-institution',
        problem: 'No se identifica una institución relacionada.',
        cause: 'Sucesos de tránsito o emergencias suelen involucrar cuerpos de socorro o autoridades.',
        impact: 'La nota pierde atribución y contexto oficial.',
        recommendation: 'Incluir la institución que atendió o investigó el hecho.',
        priority: 'low',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
  }

  if (isHealth) {
    if (!hasMatch(text, /\b(MINSA|ministerio de salud|hospital|clínica|fuente|declaró|informó|dijo)\b/i)) {
      list.push({
        id: 'missing-health-source',
        problem: 'Falta una fuente de salud identificada.',
        cause: 'Notas de salud requieren atribución a una institución o profesional.',
        impact: 'Riesgo de desinformación médica y baja confianza.',
        recommendation: 'Agregar la fuente de la información médica.',
        priority: 'high',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'fuente',
      });
    }
    if (!hasMatch(text, /\b\d{1,2}\s+de\s+[a-zA-Z]+|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}\b/)) {
      list.push({
        id: 'missing-health-date',
        problem: 'No se detecta una fecha específica del dato de salud.',
        cause: 'Datos sanitarios requieren referencia temporal para ser verificables.',
        impact: 'El lector no puede contextualizar la vigencia de la información.',
        recommendation: 'Incluir la fecha del comunicado o dato.',
        priority: 'low',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
    if (!hasMatch(text, /\b\d+\s*(?:casos?|personas?|pacientes?|fallecidos?|heridos?|vacunados?|%|por ciento)\b/i)) {
      list.push({
        id: 'missing-health-figures',
        problem: 'No se detectan cifras sanitarias.',
        cause: 'Notas de salud suelen incluir números verificables.',
        impact: 'La información parece vaga y poco sustentable.',
        recommendation: 'Incluir cifras con su fuente o aclarar que no hay datos disponibles.',
        priority: 'low',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
  }

  if (isSports) {
    if (!hasMatch(text, /\b(selección|equipo|contra|vs\b|versus|frente a)\b/i)) {
      list.push({
        id: 'missing-teams',
        problem: 'No se identifican equipos o rivales.',
        cause: 'Una nota deportiva requiere saber quiénes compitieron.',
        impact: 'El lector no entiende el enfrentamiento.',
        recommendation: 'Mencionar los equipos o deportistas involucrados.',
        priority: 'high',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
    if (!hasMatch(text, /\b(ganó|perdió|empató|venció|derrotó|marcador|resultado|\d+\s*-\s*\d+)\b/i)) {
      list.push({
        id: 'missing-result',
        problem: 'No se indica el resultado del encuentro.',
        cause: 'El resultado es el dato central de una nota deportiva.',
        impact: 'La nota no cumple con el interés informativo.',
        recommendation: 'Agregar el resultado o indicar si aún no se juega.',
        priority: 'high',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
    if (!hasMatch(text, /\b(liga|copa|torneo|campeonato)\b/i)) {
      list.push({
        id: 'missing-tournament',
        problem: 'No se menciona el torneo o competición.',
        cause: 'Falta contexto competitivo.',
        impact: 'El lector no sabe la importancia del encuentro.',
        recommendation: 'Incluir el torneo, liga o campeonato.',
        priority: 'low',
        autoFixAvailable: false,
        requiresHuman: true,
        field: 'contenido',
      });
    }
  }

  return list;
}

function problemsForAutoCategorization(result: MeniResult): EditorialProblem[] {
  if (result.classificationSource !== 'AI' || !result.suggestedCategory) return [];
  return [{
    id: 'auto-category-suggestion',
    problem: `No se seleccionó categoría editorial. MENI sugiere "${result.suggestedCategory}".`,
    cause: 'La nota llegó sin categoría explícita del editor.',
    impact: 'La categoría pública dependerá de la clasificación automática.',
    recommendation: `Usar la categoría sugerida por MENI: ${result.suggestedCategory}.`,
    priority: 'low',
    autoFixAvailable: true,
    requiresHuman: false,
    field: 'categoria',
  }];
}

function problemsForContentQuality(noticia: NoticiaInput, result: MeniResult): EditorialProblem[] {
  const list: EditorialProblem[] = [];

  if (!noticia.titulo || noticia.titulo.trim().length < 10) {
    list.push({
      id: 'missing-title',
      problem: 'Título ausente o demasiado corto.',
      cause: 'El título no tiene información suficiente.',
      impact: 'El lector no puede identificar el contenido.',
      recommendation: 'Escribir un título claro de entre 30 y 70 caracteres.',
      priority: 'critical',
      autoFixAvailable: false,
      requiresHuman: true,
      field: 'titulo',
    });
  } else if (noticia.titulo.length > 80) {
    list.push({
      id: 'title-too-long',
      problem: 'El título supera los 80 caracteres.',
      cause: `Título actual: ${noticia.titulo.length} caracteres.`,
      impact: 'Puede cortarse en resultados de búsqueda y redes sociales.',
      recommendation: 'Acortar el título a menos de 80 caracteres.',
      priority: 'low',
      autoFixAvailable: true,
      requiresHuman: false,
      field: 'titulo',
    });
  }

  const words = wordCount(noticia.contenido);
  if (words < 150) {
    list.push({
      id: 'content-too-short',
      problem: 'Contenido demasiado corto.',
      cause: `La nota tiene ${words} palabras.`,
      impact: 'Google y el lector pueden considerarla de bajo valor.',
      recommendation: 'Ampliar el contenido con contexto, fuentes y datos relevantes.',
      priority: 'high',
      autoFixAvailable: false,
      requiresHuman: true,
      field: 'contenido',
    });
  }

  if ((noticia.resumen || '').length < 30) {
    list.push({
      id: 'summary-too-short',
      problem: 'Resumen muy corto.',
      cause: 'El resumen no describe el contenido.',
      impact: 'Afecta SEO y comprensión en portada.',
      recommendation: 'Escribir un resumen de 120-160 caracteres.',
      priority: 'medium',
      autoFixAvailable: false,
      requiresHuman: true,
      field: 'contenido',
    });
  }

  if (!noticia.autor || noticia.autor.trim().length === 0) {
    list.push({
      id: 'missing-author',
      problem: 'No se identifica un autor.',
      cause: 'El campo autor está vacío.',
      impact: 'Afecta EEAT y confianza del lector.',
      recommendation: 'Agregar el nombre del periodista o fuente.',
      priority: 'high',
      autoFixAvailable: false,
      requiresHuman: true,
      field: 'autor',
    });
  }

  if (result.eeat?.score && result.eeat.score < 70) {
    list.push({
      id: 'eeat-low',
      problem: 'Puntuación EEAT baja.',
      cause: `EEAT score: ${result.eeat.score}.`,
      impact: 'Google puede considerar la noticia poco confiable.',
      recommendation: 'Mejorar atribuciones, fuentes y autoría.',
      priority: 'medium',
      autoFixAvailable: false,
      requiresHuman: true,
      field: 'fuente',
    });
  }

  if (result.forense?.score && result.forense.score < 70) {
    list.push({
      id: 'forense-low',
      problem: 'Forense detecta posibles problemas de veracidad.',
      cause: `Forense score: ${result.forense.score}.`,
      impact: 'Riesgo de publicar información sin verificar.',
      recommendation: 'Verificar fuentes y añadir atribuciones explícitas.',
      priority: 'high',
      autoFixAvailable: false,
      requiresHuman: true,
      field: 'fuente',
    });
  }

  return list;
}

export function runEditorialDiagnosis(noticia: NoticiaInput, result: MeniResult): EditorialDiagnosis {
  const generatedAt = new Date().toISOString();

  if (!noticia.titulo || !noticia.contenido) {
    return {
      generatedAt,
      editorialStatus: 'BLOCKED',
      observations: ['Faltan datos mínimos para diagnosticar: título o contenido.'],
      problems: [],
      warnings: [],
      recommendations: [],
      requiredActions: [],
      autoFixes: [],
      humanActions: [],
      publicationReadiness: 'BLOCKED',
      score: null,
      scoreReadiness: 'BLOCKED',
      category: 'Nacionales',
      summary: 'Noticia sin título o contenido. No se puede evaluar.',
      hasEvidence: false,
    };
  }

  const fullText = `${noticia.titulo} ${noticia.resumen || ''} ${noticia.contenido}`;
  const eventCountry = detectEventCountry(fullText);
  const eventCity = detectEventCity(fullText);
  const personNationality = detectPersonNationality(fullText);

  const observations: string[] = [
    `Categoría resuelta: ${result.categoria}.`,
    `Fuente de la categoría: ${result.classificationSource}.`,
    `Conflicto de clasificación: ${result.classificationConflict ? 'sí' : 'no'}.`,
    result.suggestedProfile ? `Perfil detectado: ${result.suggestedProfile}.` : 'No se detectó un perfil interno específico.',
    personNationality ? `Nacionalidad identificada: ${personNationality}.` : 'No se identificó nacionalidad de persona.',
    eventCountry ? `País del evento: ${eventCountry}.` : 'No se identificó país del evento.',
  ];

  const problems: EditorialProblem[] = [
    ...problemsForCategoryConflict(result),
    ...problemsForLocation(result, { eventCountry, eventCity, personNationality }),
    ...problemsForContentQuality(noticia, result),
    ...problemsForMissingContext(noticia, result),
    ...problemsForAutoCategorization(result),
  ];

  const warnings = problems.filter((p) => p.priority === 'low' || p.priority === 'medium');

  if (result.scoreFinal !== null && result.scoreFinal < 90) {
    problems.push({
      id: 'score-below-threshold',
      problem: `Score MENI ${result.scoreFinal} está por debajo del umbral de publicación recomendado.`,
      cause: 'El puntaje editorial no alcanza el nivel de calidad mínimo.',
      impact: 'La noticia requiere mejora antes de publicar.',
      recommendation: result.calificacion || 'Revisar las recomendaciones de MENI y reforzar los criterios con puntuación baja.',
      priority: 'high',
      autoFixAvailable: false,
      requiresHuman: true,
      field: 'general',
    });
  }

  const autoFixes = problems.filter((p) => p.autoFixAvailable);
  const humanActions = problems.filter((p) => p.requiresHuman);

  let editorialStatus: EditorialStatus = 'READY';
  if (!result.aprobado || result.scoreFinal === null) {
    editorialStatus = 'BLOCKED';
  } else if (problems.some((p) => p.priority === 'critical')) {
    editorialStatus = 'BLOCKED';
  } else if (result.classificationConflict) {
    editorialStatus = 'CONFLICT';
  } else if (humanActions.length > 0) {
    editorialStatus = 'NEEDS_REVIEW';
  } else if (result.scoreFinal < 90) {
    editorialStatus = 'NEEDS_REVIEW';
  }

  const publicationReadiness: 'READY' | 'NEEDS_REVIEW' | 'BLOCKED' = (() => {
    if (editorialStatus === 'BLOCKED') return 'BLOCKED';
    if (editorialStatus === 'CONFLICT' || editorialStatus === 'NEEDS_REVIEW') return 'NEEDS_REVIEW';
    return 'READY';
  })();

  const scoreReadiness: 'READY' | 'NEEDS_REVIEW' | 'BLOCKED' = publicationReadiness;

  const summary = buildSummary(problems, autoFixes, humanActions, publicationReadiness);

  return {
    generatedAt,
    editorialStatus,
    observations,
    problems,
    warnings,
    recommendations: [...problems],
    requiredActions: [...problems],
    autoFixes,
    humanActions,
    publicationReadiness,
    score: result.scoreFinal,
    scoreReadiness,
    category: result.categoria,
    editorCategory: result.editorCategory,
    suggestedCategory: result.suggestedCategory,
    profile: result.suggestedProfile,
    eventCountry,
    eventCity,
    personNationality,
    summary,
    hasEvidence: true,
  };
}

function buildSummary(
  problems: EditorialProblem[],
  autoFixes: EditorialProblem[],
  humanActions: EditorialProblem[],
  readiness: 'READY' | 'NEEDS_REVIEW' | 'BLOCKED',
): string {
  if (problems.length === 0) {
    return 'No se detectaron problemas. La noticia está lista para publicar.';
  }
  const high = humanActions.filter((p) => p.priority === 'high' || p.priority === 'critical').length;
  return `Se detectaron ${problems.length} problemas. ${high} requieren atención del editor. ${autoFixes.length} son auto-fix seguros. Publicabilidad: ${readiness}.`;
}

export interface CEOResponse {
  diagnose: string;
  firstFix: string;
  canFix: string;
  isReady: string;
  topProblem?: string;
}

export function generateCEOResponse(diagnosis: EditorialDiagnosis): CEOResponse {
  const top = diagnosis.humanActions[0] || diagnosis.problems[0];
  const auto = diagnosis.autoFixes[0];

  let diagnose = 'No detecté problemas relevantes.';
  if (diagnosis.problems.length > 0) {
    const first = diagnosis.problems[0];
    const second = diagnosis.problems[1];
    diagnose = `Encontré ${diagnosis.problems.length} problemas. `;
    diagnose += `Primero, ${first.problem}`;
    if (second) diagnose += `. Segundo, ${second.problem}`;
    diagnose += '.';
  }

  const firstFix = top
    ? `Arreglaría primero: ${top.recommendation}`
    : 'No hay correcciones pendientes.';

  const canFix = auto
    ? `Puedo corregir automáticamente: ${auto.problem}. Necesito que decidas: ${top?.recommendation || 'ninguna acción humana pendiente.'}`
    : top
      ? `No hay auto-fixes seguros. Necesito que decidas: ${top.recommendation}`
      : 'No hay acciones pendientes.';

  const isReady =
    diagnosis.publicationReadiness === 'READY'
      ? 'Sí, la noticia está lista para publicar.'
      : `No. ${diagnosis.summary}`;

  return {
    diagnose,
    firstFix,
    canFix,
    isReady,
    topProblem: top?.problem,
  };
}
