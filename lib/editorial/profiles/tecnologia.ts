/**
 * Perfil Editorial: Tecnología — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileTecnologia: EditorialProfile = {
  categoria: 'Tecnología',
  requiredEvidence: {
    especificaciones: /\b(?:\d+\s*(?:GB|MB|GHz|RAM|pulgadas|MP|nm)|procesador|c[aá]mara|pantalla|AMOLED|OLED|bater[ií]a|SSD|5G|WiFi|USB|carga\s+rápida)\b/i,
    precio:           /\b(?:C?\$[\d.,]+|precio|costo|d[oó]lares)\b/i,
    queCambia:        /\b(?:nuevo|mejora|diferencia|vs\.?|comparaci[oó]n|versi[oó]n|anterior|upgrade)\b/i,
    disponibilidad:   /\b(?:disponible|lanzamiento|a\s+la\s+venta|tiendas?|online|desde|agosto|septiembre)\b/i,
    compatibilidad:   /\b(?:compatible|soporta|incluye|conectividad|sistema\s+operativo|Windows|Android|iOS|app)\b/i,
  },
  requiredContext: { tipo: 'tecnologia', patrones: [/\b(?:marca|modelo|fabricante|empresa|startup|desarrollador|CEO)\b/i] },
  requiredUtility: { preguntas: ['especificaciones', 'precio', 'qué cambia', 'disponibilidad', 'compatibilidad'] },
  forbiddenQuestions: ['ley', 'decreto', 'trámite', 'marco legal', 'marco jurídico'],
  forbiddenRecommendations: ['comprar', 'probar', 'ir a tienda'],
  scoreWeights: { evidencia: 45, fuente: 15, contexto: 15, utilidad: 15, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['Fabricante', 'Comunicado oficial', 'Spec sheet', 'Review técnico', 'CEO', 'Desarrollador', 'Medios especializados', 'Representante'],
  sugerenciasBase: {
    oportunidades: ['Incluir especificaciones técnicas concretas.', 'Agregar precio y disponibilidad.', 'Comparar con modelo anterior o competencia.'],
    convertirReferencia: ['Citar comunicado del fabricante.', 'Construir tabla comparativa.', 'Incluir experiencia de usuarios.'],
    nivel10: ['Guía de compra por rango de precio.', 'Comparativa anual de modelos.'],
  },
};
