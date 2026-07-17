/**
 * Consistency Engine V4 — REGLA 4 + REGLA 13
 * ==========================================
 * Se ejecuta ANTES del Editor Jefe.
 * Verifica coherencia entre módulos.
 * Si SEO>95 AND EEAT>95 AND FORENSE>95 AND VALOR>95 → EditorJefe no puede
 * devolver publicar_breve, no_publicar, ni score<90.
 * Si ocurre → EDITOR_INCONSISTENT y detener.
 */

import type {
  NormalizedResults,
  ConsistencyCheck,
  ViolacionConsistencia,
} from './types';

export function check(results: NormalizedResults): ConsistencyCheck {
  const violaciones: ViolacionConsistencia[] = [];

  const { seo, eeat, forense, valorEditorial } = results;

  // REGLA 4: Si todos los módulos principales > 95
  const todosAltos =
    seo.score > 95 &&
    eeat.score > 95 &&
    forense.score > 95 &&
    valorEditorial.score > 95;

  if (todosAltos) {
    // El Editor Jefe no podrá devolver breve, no_publicar ni score<90
    // Esta validación se hace aquí como pre-check, pero también se valida
    // post-Editor Jefe en el pipeline
    // Aquí solo marcamos que se debe cumplir esta restricción
    // La violación real se detecta después del Editor Jefe
  }

  // Detectar contradicciones entre módulos
  // Si SEO dice 100 pero AdSense dice 30 → posible contradicción
  if (seo.score > 90 && results.adsense.score < 40) {
    violaciones.push({
      tipo: 'SCORE_CONTRADICTORY',
      descripcion: 'SEO alto pero AdSense muy bajo: posible contenido optimizado pero no apto para monetización',
      modulos: ['SEO', 'ADSENSE'],
      scoreEsperado: 70,
      scoreObtenido: results.adsense.score,
    });
  }

  // Si EEAT dice 100 pero Valor Editorial dice 30 → contradicción
  if (eeat.score > 90 && valorEditorial.score < 40) {
    violaciones.push({
      tipo: 'SCORE_CONTRADICTORY',
      descripcion: 'EEAT alto pero Valor Editorial bajo: fuentes detectadas pero sin aporte propio',
      modulos: ['EEAT', 'VALOR_EDITORIAL'],
      scoreEsperado: 60,
      scoreObtenido: valorEditorial.score,
    });
  }

  // Si Forense detecta atribuciones falsas pero EEAT da score alto
  if (forense.score > 80 && eeat.score > 80) {
    const hasAtribucionesFalsas = eeat.errors.some(e => e.includes('atribuciones'));
    if (hasAtribucionesFalsas) {
      violaciones.push({
        tipo: 'EDITOR_INCONSISTENT',
        descripcion: 'EEAT detecta atribuciones falsas pero otorga score alto',
        modulos: ['EEAT', 'FORENSE'],
        scoreEsperado: 60,
        scoreObtenido: eeat.score,
      });
    }
  }

  // Verificar penalizaciones duplicadas (REGLA 9)
  const causasDuplicadas = results.penalizacionesDeduplicadas.filter(
    p => p.modulosAfectados.length > 1
  );
  for (const dup of causasDuplicadas) {
    violaciones.push({
      tipo: 'PENALTY_DUPLICATED',
      descripcion: `Penalización duplicada en ${dup.modulosAfectados.length} módulos: ${dup.causa}`,
      modulos: dup.modulosAfectados,
      scoreEsperado: 0,
      scoreObtenido: 0,
    });
  }

  return {
    ok: violaciones.length === 0,
    violaciones,
  };
}

/**
 * Validación post-Editor Jefe (REGLA 13)
 * Verifica que el veredicto sea coherente con los scores de los módulos.
 */
export function validateVerdicto(
  results: NormalizedResults,
  scoreFinal: number,
  veredicto: string
): ViolacionConsistencia | null {
  const { seo, eeat, forense, valorEditorial } = results;

  const todosAltos =
    seo.score > 95 &&
    eeat.score > 95 &&
    forense.score > 95 &&
    valorEditorial.score > 95;

  if (todosAltos) {
    if (veredicto === 'no_publicar' || veredicto === 'publicar_breve') {
      return {
        tipo: 'EDITOR_INCONSISTENT',
        descripcion: `Todos los módulos >95 pero veredicto=${veredicto}. REGLA 13 violada.`,
        modulos: ['SEO', 'EEAT', 'FORENSE', 'VALOR_EDITORIAL'],
        scoreEsperado: 90,
        scoreObtenido: scoreFinal,
      };
    }
    if (scoreFinal < 90) {
      return {
        tipo: 'EDITOR_INCONSISTENT',
        descripcion: `Todos los módulos >95 pero score final=${scoreFinal} <90. REGLA 13 violada.`,
        modulos: ['SEO', 'EEAT', 'FORENSE', 'VALOR_EDITORIAL'],
        scoreEsperado: 90,
        scoreObtenido: scoreFinal,
      };
    }
  }

  return null;
}
