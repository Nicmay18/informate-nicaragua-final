/**
 * Perfil Editorial: Política — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profilePolitica: EditorialProfile = {
  categoria: 'Política',
  requiredEvidence: {
    quePaso:   /\b(?:anunci[oaó]|present[oaó]|reform[oaó]|aprobaron?|decret[oaó]|iniciativa|proyecto\s+de\s+ley|reforma)\b/i,
    quien:     /\b(?:presidente|vicepresidente|ministro|diputad[oa]|canciller|magistrad[oa]|partido\s+pol[ií]tico|asamblea)\b/i,
    posicion:  /\b(?:a\s+favor|en\s+contra|apoyo|rechazo|alianza|oposici[oó]n|oficialismo|coalic[ií]on)\b/i,
    cifras:    /\b(?:\d+\s+(?:votos?|diputados?|firmas?|art[ií]culos?)|C?\$[\d.,]+|por\s+ciento|%)\b/i,
    impacto:   /\b(?:beneficiar[aá]?|afectar[aá]?|consecuencias?|implicaciones?|poblaci[oó]n|ciudadanos?)\b/i,
  },
  requiredContext: { tipo: 'politica', patrones: [/\b(?:asamblea\s+nacional|congreso|legislativo|pol[ií]tica|gobierno)\b/i] },
  requiredUtility: { preguntas: ['qué pasó', 'quién', 'posición', 'cifras', 'impacto'] },
  forbiddenQuestions: ['resultado deportivo', 'concierto', 'estreno'],
  forbiddenRecommendations: ['ir al congreso', 'solicitar expediente privado'],
  scoreWeights: { evidencia: 35, fuente: 25, contexto: 20, utilidad: 10, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['Asamblea Nacional', 'Presidencia', 'Ministerio', 'CSE', 'Partido político', 'Diputado', 'Canciller', 'Comunicado oficial', 'Gaceta'],
  sugerenciasBase: {
    oportunidades: ['Citar fuente oficial con nombre.', 'Incluir posición de partidos.', 'Explicar impacto en la población.'],
    convertirReferencia: ['Contrastar con oposición.', 'Contextualizar con antecedentes legislativos.', 'Incluir reacción ciudadana.'],
    nivel10: ['Infografía del proceso legislativo.', 'Línea de tiempo política.'],
  },
};
