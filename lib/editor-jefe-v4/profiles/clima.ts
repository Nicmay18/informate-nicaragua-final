/**
 * Perfil Editorial: Clima — REGLA 5 + REGLA 7 (declarativo, categoría propia)
 */
import type { EditorialProfile } from '../types';

export const profileClima: EditorialProfile = {
  categoria: 'Clima',
  requiredEvidence: {
    municipios:      /\b(?:municipio|departamento|Managua|Le[oó]n|Granada|Estel[ií]|Jinotega|Matagalpa|Chinandega|Tipitapa|Bluefields|Rivas|Masaya|Boaco|Chontales|Madriz|Nueva\s+Segovia)\b/i,
    fenomeno:        /\b(?:lluvia|hurac[aá]n|tormenta|depressi[oó]n\s+tropical|sequ[ií]a|inundaci[oó]n|aluv[ií]on|deslave|derrumbe|viento|rafaga|marea|ola\s+de\s+calor|temperatura|sismo|terremoto|volc[aá]n|emisiones)\b/i,
    rios:            /\b(?:r[ií]o|cuenca|cauce|desbordamiento|nivel\s+del?\s+(?:r[ií]o|lago|mar)|lag[oa])\b/i,
    comunidades:     /\b(?:comunidades?|barrios?|sectores?|zonas?|familias?|viviendas?|damnificad[oa]s?|evacuad[oa]s?|afectad[oa]s?|albergue)\b/i,
    seguimiento:     /\b(?:pron[oó]stico|alerta|vigilancia|bolet[ií]n|INETER|SINAPRED|COMUPRED|evoluci[oó]n|pr[oó]ximas?\s+horas)\b/i,
    recomendaciones: /\b(?:recomendaciones?|medidas|prevenci[oó]n|evacuar|segurar|hidrataci[oó]n|alejar|abrigarse|no\s+salir|kit\s+de\s+emergencia)\b/i,
  },
  requiredContext: { tipo: 'clima', patrones: [/\b(?:INETER|SINAPRED|COMUPRED|meteor[oó]log[oa]|hidr[oó]log[oa]|vulcan[oó]log[oa]|servicio\s+(?:meteorol[oó]gico|forestal))\b/i] },
  requiredUtility: { preguntas: ['municipios', 'ríos', 'comunidades', 'seguimiento', 'recomendaciones', 'zonas afectadas'] },
  forbiddenQuestions: ['ley', 'trámite', 'documento jurídico', 'decreto', 'marco jurídico', 'reglamento'],
  forbiddenRecommendations: ['ir al lugar', 'solicitar expediente', 'entrevistar víctimas'],
  scoreWeights: { evidencia: 35, fuente: 20, contexto: 20, utilidad: 15, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['INETER', 'SINAPRED', 'COMUPRED', 'Bomberos', 'Cruz Roja', 'Alcaldía', 'MINSa', 'MTI', 'ENATREL', 'Autoridad portuaria', 'Meteorólogo', 'Hidrólogo'],
  sugerenciasBase: {
    oportunidades: ['Citar boletín INETER o SINAPRED.', 'Listar municipios y zonas afectadas.', 'Incluir recomendaciones de seguridad.'],
    convertirReferencia: ['Citar pronóstico oficial.', 'Construir mapa de zonas afectadas.', 'Actualizar con nuevo boletín.'],
    nivel10: ['Mapa de riesgo por municipio.', 'Guía de prevención familiar.'],
  },
};
