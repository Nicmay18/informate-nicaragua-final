/**
 * REGLA 7 — Most Read con ventana temporal
 * Test directo de la lógica de ventana temporal.
 */
import { describe, it, expect } from 'vitest';

describe('REGLA 7 — Most Read temporal window', () => {
  const withinDays = (fecha: string, days: number, now: number) => {
    const t = new Date(fecha).getTime();
    return !isNaN(t) && (now - t) <= days * 24 * 60 * 60 * 1000;
  };

  it('ventana de 7 días rechaza artículo de 47 días atrás', () => {
    const now = new Date('2026-08-14T00:00:00Z').getTime();
    const antigua = new Date('2026-06-28T00:00:00Z').toISOString();
    expect(withinDays(antigua, 7, now)).toBe(false);
  });

  it('ventana de 7 días acepta artículo de 6 días atrás', () => {
    const now = new Date('2026-08-14T00:00:00Z').getTime();
    const reciente = new Date('2026-08-08T00:00:00Z').toISOString();
    expect(withinDays(reciente, 7, now)).toBe(true);
  });

  it('ventana de 30 días rechaza artículo de 60 días atrás', () => {
    const now = new Date('2026-08-14T00:00:00Z').getTime();
    const antigua = new Date('2026-06-15T00:00:00Z').toISOString();
    expect(withinDays(antigua, 30, now)).toBe(false);
  });

  it('ventana de 30 días acepta artículo de 15 días atrás', () => {
    const now = new Date('2026-08-14T00:00:00Z').getTime();
    const reciente = new Date('2026-07-30T00:00:00Z').toISOString();
    expect(withinDays(reciente, 30, now)).toBe(true);
  });
});
