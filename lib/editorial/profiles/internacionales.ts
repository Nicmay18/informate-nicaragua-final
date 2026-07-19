/**
 * Perfil Editorial: Internacionales — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileInternacionales: EditorialProfile = {
  categoria: 'Internacionales',
  requiredEvidence: {
    quePaso:    /\b(?:acuerd[oaó]|firm[oaó]|anunci[oaó]|decidi[oó]|report[oaó]|cumbre|reuni[oó]n|negociaci[oó]n|tratado|resoluci[oó]n)\b/i,
    quien:      /\b(?:ONU|Naciones\s+Unidas|UE|Uni[oó]n\s+Europea|G20|OTAN|FMI|OMS|UNESCO|presidente|canciller|secretario\s+general|embajador|primer\s+ministro)\b/i,
    cifras:     /\b(?:C?\$[\d.,]+|\d+(?:\.\d+)?(?:\s*(?:millones|mil|billones|por ciento|%))|\d+\s+(?:pa[ií]ses|personas|millones))\b/i,
    impacto:    /\b(?:afect[oaó]|beneficiar[aá]?|consecuencias?|implicaciones?|regional|global|mundo|internacional)\b/i,
    contexto:   /\b(?:tras|despu[eé]s\s+de|durante|en\s+el\s+marco\s+de|seg[uú]n\s+el\s+informe)\b/i,
  },
  requiredContext: { tipo: 'internacionales', patrones: [/\b(?:relaciones\s+bilaterales|diplom[aá]tic[oa]|cooperaci[oó]n|pol[ií]tica\s+exterior)\b/i] },
  requiredUtility: { preguntas: ['qué pasó', 'quién', 'cifras', 'impacto', 'contexto'] },
  forbiddenQuestions: ['resultado deportivo local', 'sucesos locales', 'trámite nacional'],
  forbiddenRecommendations: ['ir al lugar', 'solicitar expediente local'],
  scoreWeights: { evidencia: 35, fuente: 25, contexto: 20, utilidad: 10, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['ONU', 'Naciones Unidas', 'Unión Europea', 'G20', 'OTAN', 'FMI', 'Banco Mundial', 'OMS', 'UNESCO', 'ACNUR', 'FAO', 'OEA', 'Presidente', 'Canciller', 'Embajador', 'Comunicado oficial', 'Medios internacionales'],
  sugerenciasBase: {
    oportunidades: ['Citar fuente internacional identificada.', 'Incluir cifras del acuerdo o reporte.', 'Explicar impacto para Nicaragua o Centroamérica.'],
    convertirReferencia: ['Contrastar con postura de Nicaragua.', 'Incluir reacción regional.', 'Contextualizar con antecedentes.'],
    nivel10: ['Infografía del acuerdo.', 'Línea de tiempo de relaciones.'],
  },
};
