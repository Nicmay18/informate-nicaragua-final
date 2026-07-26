/**
 * Case Detector — Sistema de Seguimiento
 * ========================================
 * Detecta automáticamente casos abiertos desde el texto de artículos publicados.
 * Identifica historias en desarrollo que requieren cobertura continua.
 */

import type { TrackingCase, CaseDetectionResult, CaseType, CasePriority } from './types';

/** Palabras clave que indican un caso en desarrollo */
const DEVELOPING_KEYWORDS: Array<{ pattern: RegExp; type: CaseType; priority: CasePriority }> = [
  // Judiciales
  { pattern: /\b(juicio|proceso judicial|audiencia|tribunal|fiscalía|juez|jueza|sentencia|condena|acusad[oa]|procesad[oa]|detenid[oa]|capturad[oa]|prisión|carcel|libertad)\b/i, type: 'judicial', priority: 'alta' },
  // Conflictos
  { pattern: /\b(conflicto|disputa|manifestación|protesta|bloqueo|huelga|paro|toma de|reclam[ao]|desalojo)\b/i, type: 'conflicto', priority: 'alta' },
  // Investigaciones
  { pattern: /\b(investigación|investiga|indaga|pesquisa|peritaje|evidencia|prueba|testigo|denuncia|querella)\b/i, type: 'investigacion', priority: 'media' },
  // Salud pública
  { pattern: /\b(brote|epidemia|pandemia|contagio|casos activos|transmisión|dengue|malaria|covid|virus|vacunación|cuarentena)\b/i, type: 'salud_publica', priority: 'urgente' },
  // Economía
  { pattern: /\b(crisis económica|inflación|devaluación|precios|canasta básica|salario mínimo|combustible|gasolina|dólar)\b/i, type: 'economia', priority: 'alta' },
  // Desastres
  { pattern: /\b(terremoto|sismo|erupción|inundación|deslave|huracán|tormenta|emergencia|desastre|evacuación|damnificados)\b/i, type: 'desastre', priority: 'urgente' },
  // Políticos
  { pattern: /\b(elecciones|campaña|candidato|reforma|asamblea|legislativo|decreto|ley|constitucional|gabinete|ministro)\b/i, type: 'politico', priority: 'media' },
  // Deportivos
  { pattern: /\b(torneo|campeonato|liga|clasificación|eliminatoria|final|semifinal|transferencia|fichaje|selección)\b/i, type: 'deportivo', priority: 'baja' },
  // Sociales
  { pattern: /\b(movimiento social|lucha|reivindicación|derechos|comunidad|territorio|tierra|agua|medio ambiente)\b/i, type: 'social', priority: 'media' },
];

/** Palabras que indican cierre o resolución */
const CLOSURE_KEYWORDS = [
  /\b(sentencia firme|caso cerrado|resuelto|concluido|finalizó|terminó|archivado|sobreseído|absuelt[oa]|exonerad[oa])\b/i,
  /\b(final del conflicto|acuerdo alcanzado|paz restablecida|normalidad|estado de emergencia levantado)\b/i,
];

/** Palabras que indican novedad significativa */
const SIGNIFICANT_UPDATE_KEYWORDS = [
  /\b(nueva evidencia|testigo clave|viraje|giro inesperado|desarrollo crucial|hecho nuevo|ruptura|escándalo)\b/i,
  /\b(capturad[oa]|detenid[oa]|procesad[oa]|condenad[oa]|absuelt[oa]|liberad[oa])\b/i,
  /\b(falleció|murió|asesinat[oa]|ejecutad[oa])\b/i,
];

export function detectCaseFromArticle(
  title: string,
  content: string,
  category: string,
  existingCases: TrackingCase[],
): CaseDetectionResult {
  const fullText = `${title} ${content}`;

  // 1. Verificar si es cierre de un caso existente
  for (const caseItem of existingCases) {
    if (caseItem.status === 'cerrado' || caseItem.status === 'archivado') continue;

    const caseKeywords = caseItem.metadata.keyEntities;
    const hasEntityMatch = caseKeywords.some((entity) =>
      fullText.toLowerCase().includes(entity.toLowerCase()),
    );

    if (hasEntityMatch) {
      const isClosure = CLOSURE_KEYWORDS.some((re) => re.test(fullText));
      if (isClosure) {
        return {
          detected: true,
          caseId: caseItem.id,
          newCase: null,
          matchedEntities: caseKeywords,
          reason: `Detectado cierre del caso "${caseItem.title}" por palabras clave de resolución.`,
        };
      }

      const isSignificant = SIGNIFICANT_UPDATE_KEYWORDS.some((re) => re.test(fullText));
      if (isSignificant || hasEntityMatch) {
        return {
          detected: true,
          caseId: caseItem.id,
          newCase: null,
          matchedEntities: caseKeywords,
          reason: isSignificant
            ? `Novedad significativa detectada para el caso "${caseItem.title}".`
            : `Artículo relacionado con el caso abierto "${caseItem.title}".`,
        };
      }
    }
  }

  // 2. Detectar nuevo caso potencial
  for (const { pattern, type, priority } of DEVELOPING_KEYWORDS) {
    if (pattern.test(fullText)) {
      // Verificar que no sea un caso efímero (necesita indicadores de continuidad)
      const continuityIndicators = /\b(continuará|seguirá|próxima|próximas semanas|en los próximos días|pendiente|por definir|aún no|sin resolver|en curso|en proceso)\b/i;
      const isDeveloping = continuityIndicators.test(fullText);

      if (isDeveloping || priority === 'urgente') {
        const newCase: Partial<TrackingCase> = {
          title: title.substring(0, 100),
          summary: content.replace(/<[^>]*>/g, ' ').trim().substring(0, 300),
          type,
          priority,
          category,
          status: 'abierto',
          expectedUpdateFrequencyDays: type === 'desastre' || type === 'salud_publica' ? 1 : type === 'judicial' ? 7 : 3,
        };

        return {
          detected: true,
          caseId: null,
          newCase,
          matchedEntities: [],
          reason: `Nuevo caso detectado: tipo ${type}, prioridad ${priority}. Indicadores de continuidad encontrados.`,
        };
      }
    }
  }

  return {
    detected: false,
    caseId: null,
    newCase: null,
    matchedEntities: [],
    reason: 'No se detectaron indicadores de caso en desarrollo.',
  };
}

export function isSignificantUpdate(title: string, content: string): boolean {
  const fullText = `${title} ${content}`;
  return SIGNIFICANT_UPDATE_KEYWORDS.some((re) => re.test(fullText));
}

export function shouldCloseCase(title: string, content: string): boolean {
  const fullText = `${title} ${content}`;
  return CLOSURE_KEYWORDS.some((re) => re.test(fullText));
}
