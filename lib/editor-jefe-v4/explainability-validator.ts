/**
 * Explainability Validator V4 — FASE 4
 * =====================================
 * Cada recomendación debe responder 4 preguntas:
 * ¿Qué detectó? (regla)
 * ¿Dónde lo detectó? (parrafo)
 * ¿Por qué resta puntos? (motivo)
 * ¿Cómo corregirlo? (solucion)
 */

import type { ResultadoEditorial } from './types';

export interface ExplainabilityAuditResult {
  totalItems: number;
  itemsValidos: number;
  itemsInvalidos: number;
  detalles: {
    item: number;
    regla: string;
    tieneQue: boolean;
    tieneDonde: boolean;
    tienePorQue: boolean;
    tieneComo: boolean;
    completo: boolean;
  }[];
  porcentajeCompletitud: number;
}

export function auditExplainability(resultado: ResultadoEditorial): ExplainabilityAuditResult {
  const detalles = resultado.explainability.map((item, i) => {
    const tieneQue = !!item.regla && item.regla.trim().length > 0;
    const tieneDonde = !!item.parrafo && item.parrafo.trim().length > 0;
    const tienePorQue = !!item.motivo && item.motivo.trim().length > 0;
    const tieneComo = !!item.solucion && item.solucion.trim().length > 0;
    return {
      item: i,
      regla: item.regla,
      tieneQue,
      tieneDonde,
      tienePorQue,
      tieneComo,
      completo: tieneQue && tieneDonde && tienePorQue && tieneComo,
    };
  });

  const itemsValidos = detalles.filter(d => d.completo).length;
  const total = detalles.length;

  return {
    totalItems: total,
    itemsValidos,
    itemsInvalidos: total - itemsValidos,
    detalles,
    porcentajeCompletitud: total > 0 ? (itemsValidos / total) * 100 : 100,
  };
}

/**
 * Valida que las recomendaciones sean específicas de la categoría.
 * FASE 5: No pedir marco legal en nota deportiva, etc.
 */
export function auditRelevanciaCategoria(resultado: ResultadoEditorial): {
  relevante: boolean;
  sugerenciasAjenas: string[];
} {
  const categoria = resultado.categoria;
  const sugerenciasAjenas: string[] = [];

  const terminosAjenos: Record<string, string[]> = {
    'Deportes': ['marco legal', 'sentencia', 'tribunal', 'legislación', 'decreto'],
    'Espectáculos': ['marco legal', 'sentencia', 'tribunal', 'legislación', 'fiscalía'],
    'Tecnología': ['fiscalía', 'tribunal', 'sentencia', 'parte civil'],
    'Clima': ['fiscalía', 'tribunal', 'sentencia', 'parte civil', 'orden de captura'],
    'Salud': ['orden de captura', 'allanamiento', 'fiscalía', 'parte civil'],
  };

  const terminosProhibidos = terminosAjenos[categoria];
  if (!terminosProhibidos) return { relevante: true, sugerenciasAjenas: [] };

  for (const item of resultado.explainability) {
    const textoCompleto = `${item.motivo} ${item.solucion}`.toLowerCase();
    for (const termino of terminosProhibidos) {
      if (textoCompleto.includes(termino.toLowerCase())) {
        sugerenciasAjenas.push(`[${item.regla}] menciona "${termino}" en categoría ${categoria}`);
      }
    }
  }

  return {
    relevante: sugerenciasAjenas.length === 0,
    sugerenciasAjenas,
  };
}
