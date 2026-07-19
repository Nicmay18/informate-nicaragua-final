/**
 * Shadow Logger V4 — FASE 1
 * ==========================
 * Registra cada análisis V3+V4 en Firestore para auditoría.
 * No reemplaza V3. Solo observa y registra.
 */

import { getAdminDb } from '../firebase-admin';
import type { ResultadoAnalisis } from '../analizador-noticias';
import type { ResultadoEditorial } from './types';
import type { ComparacionV3V4 } from './parallel-runner';

export interface ShadowLogEntry {
  timestamp: string;
  slug: string;
  titulo: string;
  categoriaInput: string;
  categoriaDetectadaV4: string;
  scoreV3: number | null;
  scoreV4: number;
  veredictoV3: string | null;
  veredictoV4: string;
  diferenciaScore: number | null;
  coinciden: boolean;
  tiempoV3Ms: number | null;
  tiempoV4Ms: number;
  moduloMayorDiferencia: string | null;
  consistenciaOk: boolean;
  violacionesConsistencia: number;
  explainabilityItems: number;
  observaciones: string[];
  explainabilityReglas: string[];
  // Datos de aprendizaje (APRENDIZAJE)
  estructura: {
    h2Count: number;
    strongCount: number;
    blockquoteCount: number;
    palabraCount: number;
  };
  fuentes: {
    numeroFuentes: number;
    fuentesDetectadas: string[];
    tieneFuentePropia: boolean;
  };
  seguimiento: {
    tieneSeguimiento: boolean;
    actualizable: boolean;
  };
  utilidad: {
    tieneServicio: boolean;
    tieneRecomendaciones: boolean;
  };
}

export async function logShadowRun(
  noticia: { titulo: string; slug: string; categoria: string },
  v3: ResultadoAnalisis | null,
  v4: ResultadoEditorial,
  comparacion: ComparacionV3V4,
  tiempoV3Ms: number | null,
  tiempoV4Ms: number,
): Promise<void> {
  try {
    const db = getAdminDb();

    // Determinar qué módulo produjo la mayor diferencia
    let moduloMayorDiferencia: string | null = null;
    let mayorDiff = 0;
    if (v3) {
      const diffs: Record<string, number> = {
        seo: Math.abs((v3.filtros.seo?.puntuacion ?? 0) - v4.scores.seo),
        eeat: Math.abs((v3.filtros.eeat?.puntuacion ?? 0) - v4.scores.eeat),
        forense: Math.abs((v3.filtros.oro?.puntuacion ?? 0) - v4.scores.forense),
        adsense: Math.abs((v3.filtros.adsense?.puntuacion ?? 0) - v4.scores.adsense),
        discover: Math.abs((v3.filtros.discover?.puntuacion ?? 0) - v4.scores.discover),
        valorEditorial: Math.abs((v3.filtros.valorEditorial?.puntuacion ?? 0) - v4.scores.valorEditorial),
      };
      for (const [mod, diff] of Object.entries(diffs)) {
        if (diff > mayorDiff) {
          mayorDiff = diff;
          moduloMayorDiferencia = mod;
        }
      }
    }

    const entry: ShadowLogEntry = {
      timestamp: new Date().toISOString(),
      slug: noticia.slug,
      titulo: noticia.titulo,
      categoriaInput: noticia.categoria,
      categoriaDetectadaV4: v4.categoria,
      scoreV3: v3?.puntuacion ?? null,
      scoreV4: v4.scores.final,
      veredictoV3: v3?.nivel ?? null,
      veredictoV4: v4.veredicto,
      diferenciaScore: comparacion.diferenciaScore,
      coinciden: comparacion.coinciden,
      tiempoV3Ms,
      tiempoV4Ms,
      moduloMayorDiferencia,
      consistenciaOk: v4.consistencia.ok,
      violacionesConsistencia: v4.consistencia.violaciones.length,
      explainabilityItems: v4.explainability.length,
      observaciones: comparacion.observaciones,
      explainabilityReglas: v4.explainability.map(e => e.regla),
      estructura: {
        h2Count: v4.evidence.seo.h2Count,
        strongCount: v4.evidence.seo.strongCount,
        blockquoteCount: v4.evidence.forense.estructuraHtml.blockquote,
        palabraCount: v4.evidence.adsense.palabraCount,
      },
      fuentes: {
        numeroFuentes: v4.evidence.sources.numeroFuentes,
        fuentesDetectadas: v4.evidence.sources.fuentesIdentificadas,
        tieneFuentePropia: v4.evidence.valorEditorial.tieneFuentePropia,
      },
      seguimiento: {
        tieneSeguimiento: v4.evidence.followUp.tieneSeguimiento,
        actualizable: v4.evidence.followUp.actualizable,
      },
      utilidad: {
        tieneServicio: v4.evidence.utility.tieneServicio,
        tieneRecomendaciones: v4.evidence.utility.tieneRecomendaciones,
      },
    };

    await db.collection('shadow_logs').add(entry);
  } catch (error) {
    console.error('[shadow-logger] Error guardando log:', error);
  }
}

/**
 * Registra un análisis V4 sin comparación V3 (modo V4-only).
 */
export async function logV4Run(
  noticia: { titulo: string; slug: string; categoria: string },
  v4: ResultadoEditorial,
  tiempoV4Ms: number,
): Promise<void> {
  try {
    const db = getAdminDb();

    const entry: ShadowLogEntry = {
      timestamp: new Date().toISOString(),
      slug: noticia.slug,
      titulo: noticia.titulo,
      categoriaInput: noticia.categoria,
      categoriaDetectadaV4: v4.categoria,
      scoreV3: null,
      scoreV4: v4.scores.final,
      veredictoV3: null,
      veredictoV4: v4.veredicto,
      diferenciaScore: null,
      coinciden: true,
      tiempoV3Ms: null,
      tiempoV4Ms,
      moduloMayorDiferencia: null,
      consistenciaOk: v4.consistencia.ok,
      violacionesConsistencia: v4.consistencia.violaciones.length,
      explainabilityItems: v4.explainability.length,
      observaciones: v4.consistencia.violaciones.map(v => `${v.tipo}: ${v.descripcion}`),
      explainabilityReglas: v4.explainability.map(e => e.regla),
      estructura: {
        h2Count: v4.evidence.seo.h2Count,
        strongCount: v4.evidence.seo.strongCount,
        blockquoteCount: v4.evidence.forense.estructuraHtml.blockquote,
        palabraCount: v4.evidence.adsense.palabraCount,
      },
      fuentes: {
        numeroFuentes: v4.evidence.sources.numeroFuentes,
        fuentesDetectadas: v4.evidence.sources.fuentesIdentificadas,
        tieneFuentePropia: v4.evidence.valorEditorial.tieneFuentePropia,
      },
      seguimiento: {
        tieneSeguimiento: v4.evidence.followUp.tieneSeguimiento,
        actualizable: v4.evidence.followUp.actualizable,
      },
      utilidad: {
        tieneServicio: v4.evidence.utility.tieneServicio,
        tieneRecomendaciones: v4.evidence.utility.tieneRecomendaciones,
      },
    };

    await db.collection('shadow_logs').add(entry);
  } catch (error) {
    console.error('[shadow-logger] Error guardando log V4:', error);
  }
}

/**
 * Recupera historial de shadow logs para análisis.
 */
export async function getShadowHistory(
  limit = 100,
): Promise<ShadowLogEntry[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('shadow_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as ShadowLogEntry);
  } catch (error) {
    console.error('[shadow-logger] Error leyendo logs:', error);
    return [];
  }
}
