/**
 * Perfil Editorial: Turismo/Servicio — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileTurismo: EditorialProfile = {
  categoria: 'Turismo',
  requiredEvidence: {
    destino:     /\b(?:mirador|mirador\s+de|catarina|volcan|isla|playa|reserva|parque|laguna|laguna\s+de|lagoon|lagunar|cerro|montana|museo|centro\s+historico|catedral|iglesia|mercado|malecon|puerto|ruta\s+turistica|destino\s+turistico)\b/i,
    ubicacion:   /\b(?:Managua|Leon|Granada|Masaya|Esteli|Jinotega|Matagalpa|Chinandega|Carazo|Rivas|Boaco|Chontales|Nueva\s+Segovia|Madriz|Rio\s+San\s+Juan|RACCS|RACCN|municipio|departamento|comunidad|barrio|km\s+\d+)\b/i,
    comoLlegar:  /\b(?:como\s+llegar|direccion|desde|carretera|ruta|entrada|acceso|se\s+llega|llegar)\b/i,
    horarios:    /\b(?:horario|hora|abre|cierra|lunes\s+a\s+domingo|todos\s+los\s+dias|de\s+\d+\s+a\s+\d+|dias\s+habiles)\b/i,
    precios:     /\b(?:C?\$[\d.,]+|\d+\s*(?:cordobas?|dolares?)|precio|costo|entrada|boleto|tarifa|gratuito|gratis)\b/i,
    actividades: /\b(?:actividad|actividades|que\s+hacer|que\s+ver|atractivo|tour|recorrido|senderismo|cabalgar|cabalgar|caminata|nadar|observacion|avistamiento|degustacion)\b/i,
    servicios:   /\b(?:restaurante|cafeteria|bano|estacionamiento|guia|tours|tour\s+guiado|info|oficina\s+de\s+informacion|tienda)\b/i,
    recomendaciones: /\b(?:recomendacion|recomendaciones|consejo|sugerencia|llevar|ropa|zapatos|protector\s+solar|agua|repelente)\b/i,
  },
  requiredContext: { tipo: 'historia o atractivo del destino', patrones: [/\b(?:historia|tradicion|patrimonio|cultura|naturaleza|panorama|vista|origen|fundado|siglo)\b/i] },
  requiredUtility: { preguntas: ['destino', 'ubicacion', 'como llegar', 'horarios', 'precios', 'actividades', 'servicios', 'recomendaciones'] },
  forbiddenQuestions: ['qué fenómeno', 'cuánto subió o bajó', 'impacto en presupuesto familiar', 'qué institución interviene'],
  forbiddenRecommendations: ['invertir sin verificar', 'comprar paquete no confirmado'],
  scoreWeights: { evidencia: 35, fuente: 15, contexto: 15, utilidad: 25, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['INIFOM', 'INTUR', 'Alcaldía municipal', 'Guía turística oficial', 'Sistema de reservas', 'Entrevista con guía', 'Sitio web del destino'],
  sugerenciasBase: {
    oportunidades: ['Incluir ubicación exacta y cómo llegar.', 'Verificar horarios y precios actuales.', 'Mencionar servicios disponibles.'],
    convertirReferencia: ['Agregar recomendaciones prácticas para el visitante.', 'Incluir advertencias sobre condiciones de acceso.', 'Citar la fuente de precios y horarios.'],
    nivel10: ['Mapa de acceso.', 'Checklist para el visitante.'],
  },
};
