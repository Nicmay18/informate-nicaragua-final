/**
 * Validation Tests V4 — FASES 4, 6, 7, 8
 * =======================================
 * Tests automatizados para validación editorial.
 * No son tests de funcionalidad — son tests de CALIDAD del analizador.
 */

import { describe, it, expect } from 'vitest';
import { pipelineV4 } from '@/lib/editor-jefe-v4/pipeline';
import { auditExplainability, auditRelevanciaCategoria } from '@/lib/editor-jefe-v4/explainability-validator';
import { testStability } from '@/lib/editor-jefe-v4/stability-tester';
import { sucesosFixtures } from './fixtures';
import { nacionalesFixtures } from './fixtures';
import { internacionalesFixtures, deportesFixtures } from './fixtures-2';
import { tecnologiaFixtures, climaFixtures, saludFixtures, espectaculosFixtures } from './fixtures-3';

// Fixtures para estabilidad — usar primera noticia de Sucesos
const noticiaEstabilidad = sucesosFixtures[0].noticia;

// ───────────────────────────────────────────────
// FASE 4: Auditoría de Explainability
// ───────────────────────────────────────────────

describe('FASE 4 — Auditoría de Explainability', () => {
  const todasFixtures = [
    ...sucesosFixtures.slice(0, 5),
    ...nacionalesFixtures.slice(0, 5),
    ...internacionalesFixtures.slice(0, 5),
    ...deportesFixtures.slice(0, 5),
    ...tecnologiaFixtures.slice(0, 5),
    ...climaFixtures.slice(0, 5),
    ...saludFixtures.slice(0, 5),
    ...espectaculosFixtures.slice(0, 5),
  ];

  for (const fixture of todasFixtures) {
    it(`Explainability completa: ${fixture.nombre}`, () => {
      const resultado = pipelineV4(fixture.noticia);
      const audit = auditExplainability(resultado);

      expect(audit.porcentajeCompletitud).toBe(100);
      expect(audit.itemsInvalidos).toBe(0);

      for (const detalle of audit.detalles) {
        expect(detalle.tieneQue).toBe(true);
        expect(detalle.tieneDonde).toBe(true);
        expect(detalle.tienePorQue).toBe(true);
        expect(detalle.tieneComo).toBe(true);
      }
    });
  }
});

// ───────────────────────────────────────────────
// FASE 5: Relevancia por categoría
// ───────────────────────────────────────────────

describe('FASE 5 — Relevancia por categoría (no sugerencias ajenas)', () => {
  const fixturesPorCategoria = [
    { nombre: 'Deportes', fixtures: deportesFixtures.slice(0, 10) },
    { nombre: 'Tecnología', fixtures: tecnologiaFixtures.slice(0, 10) },
    { nombre: 'Clima', fixtures: climaFixtures.slice(0, 10) },
    { nombre: 'Salud', fixtures: saludFixtures.slice(0, 10) },
    { nombre: 'Espectáculos', fixtures: espectaculosFixtures.slice(0, 10) },
  ];

  for (const { nombre, fixtures } of fixturesPorCategoria) {
    it(`${nombre}: sin sugerencias ajenas a la categoría`, () => {
      for (const fixture of fixtures) {
        const resultado = pipelineV4(fixture.noticia);
        const audit = auditRelevanciaCategoria(resultado);
        expect(audit.sugerenciasAjenas).toHaveLength(0);
      }
    });
  }
});

// ───────────────────────────────────────────────
// FASE 6: Estabilidad — 20 ejecuciones mismo artículo
// ───────────────────────────────────────────────

describe('FASE 6 — Estabilidad (20x mismo artículo)', () => {
  it('Mismo artículo produce mismos resultados en 20 ejecuciones', () => {
    const result = testStability(noticiaEstabilidad, 20);

    expect(result.categoriaEstable).toBe(true);
    expect(result.scoreEstable).toBe(true);
    expect(result.veredictoEstable).toBe(true);
    expect(result.sugerenciasEstables).toBe(true);
    expect(result.variacionScore).toBe(0);
    expect(result.resultado).toBe(true);
  });

  it('Estabilidad con artículo de Nacionales', () => {
    const result = testStability(nacionalesFixtures[0].noticia, 10);
    expect(result.resultado).toBe(true);
  });

  it('Estabilidad con artículo de Deportes', () => {
    const result = testStability(deportesFixtures[0].noticia, 10);
    expect(result.resultado).toBe(true);
  });
});

// ───────────────────────────────────────────────
// FASE 7: Consistency Engine — cero inconsistencias
// ───────────────────────────────────────────────

describe('FASE 7 — Consistency Engine', () => {
  const todasFixtures = [
    ...sucesosFixtures.slice(0, 10),
    ...nacionalesFixtures.slice(0, 10),
    ...internacionalesFixtures.slice(0, 10),
    ...deportesFixtures.slice(0, 10),
  ];

  for (const fixture of todasFixtures) {
    it(`Sin inconsistencias críticas: ${fixture.nombre}`, () => {
      const resultado = pipelineV4(fixture.noticia);
      const criticas = resultado.consistencia.violaciones.filter(
        v => v.tipo === 'EDITOR_INCONSISTENT'
      );
      expect(criticas).toHaveLength(0);
    });
  }

  it('No hay caso: Forense 100 + Editor 30', () => {
    for (const fixture of sucesosFixtures.slice(0, 20)) {
      const r = pipelineV4(fixture.noticia);
      if (r.scores.forense >= 95) {
        expect(r.scores.final).toBeGreaterThanOrEqual(45);
      }
    }
  });

  it('No hay caso: EEAT 100 + Fuentes insuficientes', () => {
    for (const fixture of nacionalesFixtures.slice(0, 20)) {
      const r = pipelineV4(fixture.noticia);
      if (r.scores.eeat >= 95) {
        expect(r.evidence.sources.numeroFuentes).toBeGreaterThan(0);
      }
    }
  });
});

// ───────────────────────────────────────────────
// FASE 8: Rendimiento — V4 no degrada experiencia
// ───────────────────────────────────────────────

describe('FASE 8 — Rendimiento', () => {
  it('V4 ejecuta en menos de 500ms por artículo', () => {
    const start = performance.now();
    pipelineV4(noticiaEstabilidad);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500);
  });

  it('V4 ejecuta 10 artículos en menos de 3s', () => {
    const start = performance.now();
    for (const f of sucesosFixtures.slice(0, 10)) {
      pipelineV4(f.noticia);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });
});
