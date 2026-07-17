/**
 * Perfil Editorial: Sucesos — REGLA 5 (declarativo, sin lógica)
 */
import type { EditorialProfile } from '../types';

export const profileSucesos: EditorialProfile = {
  categoria: 'Sucesos',
  requiredEvidence: {
    queOcurrio:    /\b(?:ocurri[oó]|sucedi[oó]|incidente|accidente|robo|hurto|incautaci[oó]n|decomis[oa]|incendio|colisi[oó]n|explosi[oó]n|fuga|hallazgo|pelea|altercado|atropell[oa]|ahogad[oa])\b/i,
    donde:         /\b(?:barrio|colonia|carretera|ruta|km\s+\d+|municipio|departamento|comunidad|zona|sector|calle|avenida|entrada)\b/i,
    cuando:        /\b(?:\d{1,2}\s+de\s+\w+|\d{1,2}:\d{2}|madrugada|mañana|tarde|noche|horas?\s+de\s+la)\b/i,
    estadoActual:  /\b(?:investigaci[oó]n|pesquisas|seguimiento|b[uú]squeda|operativo|detenid[oa]|capturad[oa]|trasladad[oa])\b/i,
    seguimiento:   /\b(?:actualizaci[oó]n|pr[oó]ximas?\s+horas|se\s+espera|en\s+desarrollo|m[aá]s\s+informaci[oó]n)\b/i,
    impacto:       /\b(?:herid[oa]s?|fallecid[oa]s?|afectad[oa]s?|damnificad[oa]s?|evacuad[oa]s?|v[ií]ctimas?|p[eé]rdidas?|da[nñ]os?)\b/i,
  },
  requiredContext: { tipo: 'sucesos', patrones: [/\b(?:causa|motivo|circunstancias|seg[uú]n|testigos?|familiares?|vecinos?|autoridades?)\b/i] },
  requiredUtility: { preguntas: ['qué ocurrió', 'dónde', 'cuándo', 'estado actual', 'seguimiento', 'impacto'] },
  forbiddenQuestions: ['ley', 'decreto', 'trámite', 'política pública', 'marco jurídico', 'reglamento'],
  forbiddenRecommendations: ['entrevistar', 'ir al lugar', 'solicitar expediente', 'esperar versión oficial'],
  scoreWeights: { evidencia: 40, fuente: 25, contexto: 15, utilidad: 10, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['Policía Nacional', 'Fiscalía', 'Bomberos', 'Cruz Roja', 'Medicina Legal', 'Hospital', 'Testigos', 'Familiares', 'Medios locales', 'Autoridades'],
  sugerenciasBase: {
    oportunidades: ['Citar fuente oficial sobre el estado de las víctimas.', 'Incluir hora, ruta y número de heridos.', 'Agregar contexto de incidentes similares.'],
    convertirReferencia: ['Citar parte oficial cuando exista.', 'Construir cronología con horas verificables.', 'Actualizar con nuevos datos oficiales.'],
    nivel10: ['Mapa de incidentes por zona.', 'Guía de prevención.'],
  },
};
