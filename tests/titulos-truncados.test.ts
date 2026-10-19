import { describe, it, expect } from 'vitest';
import { normalizeEditorialTitle } from '@/lib/formateo';

/**
 * Regresión SEO: 19 noticias publicadas tenían títulos almacenados con
 * artefactos de truncamiento (",…", "…", coma colgante) que se servían
 * literalmente como <title> a Google. Ejemplos reales de producción:
 * "Esteliana resulta afectada en playa de San Sebastián,…"
 * "Nicaragüenses mueren en hechos graves registrados en Costa Rica,…"
 */
describe('normalizeEditorialTitle — artefactos de truncamiento', () => {
  it('elimina ",…" final (caso real: esteliana)', () => {
    expect(normalizeEditorialTitle('Esteliana resulta afectada en playa de San Sebastián,…'))
      .toBe('Esteliana resulta afectada en playa de San Sebastián');
  });

  it('elimina "…" solo al final', () => {
    expect(normalizeEditorialTitle('Dos nicaragüenses fallecen en accidentes ocurridos en…'))
      .toBe('Dos nicaragüenses fallecen en accidentes ocurridos en');
  });

  it('elimina coma colgante final (caso real: cáncer de mama)', () => {
    expect(normalizeEditorialTitle('Nicaragua amplía jornadas contra el cáncer de mama,'))
      .toBe('Nicaragua amplía jornadas contra el cáncer de mama');
  });

  it('conserva títulos legítimos con punto final', () => {
    expect(normalizeEditorialTitle('Alexa salió de Tipitapa por oportunidades y murió en España.'))
      .toBe('Alexa salió de Tipitapa por oportunidades y murió en España.');
  });

  it('conserva comas internas', () => {
    expect(normalizeEditorialTitle('Accidentes dejan varios afectados en Managua, León y Bilwi'))
      .toBe('Accidentes dejan varios afectados en Managua, León y Bilwi');
  });

  it('conserva signos de interrogación legítimos', () => {
    expect(normalizeEditorialTitle('¿Cuándo inicia la matrícula 2027 en Nicaragua?'))
      .toBe('¿Cuándo inicia la matrícula 2027 en Nicaragua?');
  });

  it('conserva la limpieza previa de sufijos de panel', () => {
    expect(normalizeEditorialTitle('Nicaragua Informate - Managua')).toBe('Nicaragua Informate');
  });
});
