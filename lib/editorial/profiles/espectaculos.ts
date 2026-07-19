/**
 * Perfil Editorial: Espectáculos — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileEspectaculos: EditorialProfile = {
  categoria: 'Espectáculos',
  requiredEvidence: {
    evento:      /\b(?:concierto|festival|exposici[oó]n|obra|estreno|premiere|funci[oó]n|presentaci[oó]n|show|gira)\b/i,
    artista:     /\b(?:cantante|actor|actriz|grupo|banda|artista|pintor|director|productor|humorista|bailar[ií]n|poeta|escritor)\b/i,
    lugar:       /\b(?:teatro|estadio|galer[ií]a|museo|plaza|centro\s+de\s+convenciones|cine|auditorio|bar|discoteca)\b/i,
    fecha:       /\b(?:\d{1,2}\s+de\s+\w+|agosto|septiembre|octubre|s[aá]bado|domingo|viernes|fin\s+de\s+semana)\b/i,
    cifras:      /\b(?:\d+\s+(?:personas?|asistentes?|entradas?|entradas?\s+vendidas?|obras?|bandas?|pa[ií]ses?)|C?\$[\d.,]+|agotad[oa])\b/i,
  },
  requiredContext: { tipo: 'espectaculos', patrones: [/\b(?:cultural|art[ií]stico|entretenimiento|m[uú]sica|cine|teatro|literatura)\b/i] },
  requiredUtility: { preguntas: ['evento', 'artista', 'lugar', 'fecha', 'cifras'] },
  forbiddenQuestions: ['ley', 'decreto', 'trámite', 'marco jurídico', 'resultado deportivo'],
  forbiddenRecommendations: ['comprar entradas sin verificar', 'ir sin entrada'],
  scoreWeights: { evidencia: 35, fuente: 15, contexto: 20, utilidad: 20, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['Artista', 'Productor', 'Organizador', 'Director', 'Crítico', 'Medios especializados', 'Plataforma oficial', 'Comunicado'],
  sugerenciasBase: {
    oportunidades: ['Incluir fecha, lugar y precio de entradas.', 'Citar al artista o organizador.', 'Agregar contexto sobre el evento.'],
    convertirReferencia: ['Incluir reacción del público.', 'Comparar con eventos anteriores.', 'Contextualizar dentro del género o movimiento.'],
    nivel10: ['Guía cultural mensual.', 'Entrevista exclusiva con el artista.'],
  },
};
