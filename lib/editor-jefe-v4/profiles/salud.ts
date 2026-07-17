/**
 * Perfil Editorial: Salud — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileSalud: EditorialProfile = {
  categoria: 'Salud',
  requiredEvidence: {
    enfermedad:    /\b(?:dengue|malaria|paludismo|zika|chikungunya|covid|VIH|diabetes|hipertensi[oó]n|c[aá]ncer|conjuntivitis|influenza|virus|brote|epidemia)\b/i,
    cifras:        /\b(?:\d+\s+(?:casos?|personas?|muertes?|dosis|unidades?|familias?|barrios?|municipios?)|por\s+ciento|%)\b/i,
    fuente:        /\b(?:MINSa|ministerio\s+de\s+salud|hospital|OMS|OPS|Cruz\s+Roja|epidemi[oó]log[oa]|direct[oa]r|m[eé]dic[oa])\b/i,
    ubicacion:     /\b(?:barrio|municipio|departamento|hospital|centro\s+de\s+salud|comunidad|regi[oó]n|Costa\s+Caribe)\b/i,
    recomendaciones: /\b(?:recomienda|prevenci[oó]n|higiene|lavado\s+de\s+manos|repelente|mosquitero|vacuna|tratamiento|acudir\s+al\s+m[eé]dico)\b/i,
  },
  requiredContext: { tipo: 'salud', patrones: [/\b(?:salud\s+p[uú]blica|epidemiolog[ií]a|sistema\s+de\s+salud|prevenci[oó]n)\b/i] },
  requiredUtility: { preguntas: ['enfermedad', 'cifras', 'fuente', 'ubicación', 'recomendaciones'] },
  forbiddenQuestions: ['resultado deportivo', 'concierto', 'estreno de cine', 'precio de producto tech'],
  forbiddenRecommendations: ['automedicarse', 'ir al hospital sin síntomas'],
  scoreWeights: { evidencia: 35, fuente: 25, contexto: 15, utilidad: 15, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['MINSa', 'Ministerio de Salud', 'Hospital', 'OMS', 'OPS', 'Cruz Roja', 'Epidemiólogo', 'Director', 'Médico', 'Investigador', 'UNAN'],
  sugerenciasBase: {
    oportunidades: ['Citar fuente del MINSa con nombre del funcionario.', 'Incluir cifras de casos y ubicación.', 'Agregar recomendaciones de prevención.'],
    convertirReferencia: ['Comparar con brotes anteriores.', 'Construir mapa de casos por zona.', 'Actualizar con nuevos datos del MINSa.'],
    nivel10: ['Guía de prevención por enfermedad.', 'Mapa de brotes por municipio.'],
  },
};
