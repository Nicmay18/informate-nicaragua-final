/**
 * Perfil Editorial: Economía — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileEconomia: EditorialProfile = {
  categoria: 'Economía',
  requiredEvidence: {
    indicador:   /\b(?:PIB|crecimiento|inflaci[oó]n|exportaci[oó]n|importaci[oó]n|inversi[oó]n|tasa|precio|costo|d[oó]lar|c[oó]rdoba)\b/i,
    cifras:      /\b(?:C?\$[\d.,]+|\d+(?:\.\d+)?(?:\s*(?:millones|mil|billones|por ciento|%))|\d+\s+(?:millones|d[oó]lares|c[oó]rdobas))\b/i,
    fuente:      /\b(?:Banco\s+Central|BCN|ministerio|c[aá]mara|FMI|BID|Banco\s+Mundial|INEC)\b/i,
    sector:      /\b(?:agricultura|manufactura|comercio|turismo|construcci[oó]n|servicios?|caf[eé]|arroz|frijo?l|ganader[ií]a|l[aá]cteos?|industrial)\b/i,
    tendencia:   /\b(?:aument[oaó]|creci[oó]|disminuy[oó]|reducci[oó]n|alza|baja|estable|proyecci[oó]n|meta)\b/i,
  },
  requiredContext: { tipo: 'economia', patrones: [/\b(?:mercado|sector|productores?|comerciantes?|economistas?|analistas?)\b/i] },
  requiredUtility: { preguntas: ['indicador', 'cifras', 'fuente', 'sector', 'tendencia'] },
  forbiddenQuestions: ['resultado deportivo', 'concierto', 'estreno de cine'],
  forbiddenRecommendations: ['ir al lugar', 'solicitar expediente judicial'],
  scoreWeights: { evidencia: 35, fuente: 25, contexto: 20, utilidad: 10, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['Banco Central', 'BCN', 'Ministerio', 'Cámara de Comercio', 'FMI', 'BID', 'Banco Mundial', 'INEC', 'Productores', 'Comerciantes', 'Economistas', 'Analistas'],
  sugerenciasBase: {
    oportunidades: ['Incluir cifras concretas del indicador.', 'Citar fuente económica identificada.', 'Comparar con período anterior.'],
    convertirReferencia: ['Contrastar con proyecciones oficiales.', 'Incluir reacción del sector.', 'Contextualizar con tendencia regional.'],
    nivel10: ['Infografía económica.', 'Comparativa anual.'],
  },
};
