/**
 * Consistency Audit — V4.1
 * Verifica que el resultado del motor no contenga contradicciones internas
 * ni divergencias entre el objeto V4 y cualquier mapeo V3 que lo consuma.
 * No modifica scores ni veredictos; solo registra conflictos para depuración.
 */

import type { ResultadoEditorial } from './types';
import type { ResultadoAnalisis } from '../analizador-noticias';

export interface ConsistencyAudit {
  ok: boolean;
  conflictos: string[];
  verificadoEn: number;
}

function checkScoreMatch(
  conflictos: string[],
  nombre: string,
  scoreA: number | undefined,
  scoreB: number | undefined,
) {
  if (scoreA !== scoreB) {
    conflictos.push(`${nombre}: scores != results.score (${scoreA} != ${scoreB})`);
  }
}

export function consistencyAudit(
  v4: ResultadoEditorial,
  v3?: ResultadoAnalisis | null,
): ConsistencyAudit {
  const conflictos: string[] = [];

  // ── 1. Cada score del desglose debe coincidir con el módulo que lo originó ──
  checkScoreMatch(conflictos, 'SEO', v4.scores.seo, v4.results.seo.score);
  checkScoreMatch(conflictos, 'EEAT', v4.scores.eeat, v4.results.eeat.score);
  checkScoreMatch(conflictos, 'Forense', v4.scores.forense, v4.results.forense.score);
  checkScoreMatch(conflictos, 'AdSense', v4.scores.adsense, v4.results.adsense.score);
  checkScoreMatch(conflictos, 'Discover', v4.scores.discover, v4.results.discover.score);
  checkScoreMatch(conflictos, 'Valor Editorial', v4.scores.valorEditorial, v4.results.valorEditorial.score);

  // ── 2. Coherencia del veredicto con el Consistency Engine ──
  if (v4.veredicto === 'EDITOR_INCONSISTENT' && v4.consistencia.ok) {
    conflictos.push('Veredicto EDITOR_INCONSISTENT pero consistencia.ok = true');
  }
  if (v4.veredicto !== 'EDITOR_INCONSISTENT' && v4.consistencia.violaciones.length > 0) {
    conflictos.push('Hay violaciones de consistencia pero el veredicto no es EDITOR_INCONSISTENT');
  }

  // ── 3. Coherencia evidencia → score (solo direcciones, no recálculo de pesos) ──
  const expectedOriginalidad = v4.evidence.originality.tieneAportePropio
    ? 100
    : v4.evidence.originality.tieneReporteoPropio
      ? 70
      : 25;
  if (v4.scores.originalidad !== expectedOriginalidad) {
    conflictos.push(
      `Originalidad: scores.originalidad (${v4.scores.originalidad}) no coincide con la evidencia de aporte propio`,
    );
  }

  if (
    v4.evidence.discover.tituloClickbait &&
    v4.results.discover.score >= 80
  ) {
    conflictos.push(
      'Discover: título clickbait detectado pero el score del módulo es alto',
    );
  }

  // ── 4. Categoría única ──
  if (v4.categoria !== v4.perfilUsado) {
    conflictos.push(`Categoría: perfilUsado (${v4.perfilUsado}) != categoria (${v4.categoria})`);
  }
  if (v4.evidence.category !== v4.categoria) {
    conflictos.push(`Categoría: evidence.category (${v4.evidence.category}) != categoria (${v4.categoria})`);
  }

  // ── 5. Explainability compensa el score final ──
  const totalPerdido = v4.explainability.reduce(
    (acc, item) => acc + (item.puntosPerdidos || 0),
    0,
  );
  if (totalPerdido !== 100 - v4.scores.final) {
    conflictos.push(
      `Explainability: suma puntosPerdidos (${totalPerdido}) != 100 - scoreFinal (${100 - v4.scores.final})`,
    );
  }

  // ── 6. Si se entrega un mapeo V3, debe ser fiel al V4 ──
  if (v3) {
    if (v3.puntuacion !== v4.scores.final) {
      conflictos.push(`V3 vs V4: puntuación V3 (${v3.puntuacion}) != scoreFinal V4 (${v4.scores.final})`);
    }

    const v3Filtros = v3.filtros;
    if (v3Filtros) {
      if (v3Filtros.seo?.puntuacion !== v4.scores.seo) {
        conflictos.push(`V3 vs V4: filtro SEO (${v3Filtros.seo?.puntuacion}) != score SEO V4 (${v4.scores.seo})`);
      }
      if (v3Filtros.eeat?.puntuacion !== v4.scores.eeat) {
        conflictos.push(`V3 vs V4: filtro EEAT (${v3Filtros.eeat?.puntuacion}) != score EEAT V4 (${v4.scores.eeat})`);
      }
      if (v3Filtros.oro?.puntuacion !== v4.scores.forense) {
        conflictos.push(`V3 vs V4: filtro ORO/Forense (${v3Filtros.oro?.puntuacion}) != score Forense V4 (${v4.scores.forense})`);
      }
      if (v3Filtros.news?.puntuacion !== v4.scores.eeat) {
        conflictos.push(`V3 vs V4: filtro News/EEAT (${v3Filtros.news?.puntuacion}) != score EEAT V4 (${v4.scores.eeat})`);
      }
      if (v3Filtros.adsense?.puntuacion !== v4.scores.adsense) {
        conflictos.push(`V3 vs V4: filtro AdSense (${v3Filtros.adsense?.puntuacion}) != score AdSense V4 (${v4.scores.adsense})`);
      }
      if (v3Filtros.discover?.puntuacion !== v4.scores.discover) {
        conflictos.push(`V3 vs V4: filtro Discover (${v3Filtros.discover?.puntuacion}) != score Discover V4 (${v4.scores.discover})`);
      }
      if (v3Filtros.valorEditorial?.puntuacion !== v4.scores.valorEditorial) {
        conflictos.push(`V3 vs V4: filtro Valor Editorial (${v3Filtros.valorEditorial?.puntuacion}) != score Valor Editorial V4 (${v4.scores.valorEditorial})`);
      }
    }
  }

  return {
    ok: conflictos.length === 0,
    conflictos,
    verificadoEn: Date.now(),
  };
}
