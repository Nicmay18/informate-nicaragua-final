import { describe, it, expect } from 'vitest';
import {
  calcularPenalizacionEditorial,
  calcularDeficitDimensionesCriticas,
  UMBRAL_DIMENSION_CRITICA,
  MAXIMA_PENALIZACION_V3_2,
} from '@/lib/meni/penalizacion-editorial';

describe('MENI V3.2 — penalización editorial por dimensiones críticas', () => {
  it('sin penalización cuando todas las dimensiones están por encima del umbral', () => {
    const pen = calcularPenalizacionEditorial({
      utilidad: 80,
      profundidad: 75,
      eeat: 90,
    });
    expect(pen).toBe(0);
    expect(pen).toBeGreaterThanOrEqual(0);
    expect(pen).toBeLessThanOrEqual(MAXIMA_PENALIZACION_V3_2);
  });

  it('penaliza cuando una dimensión cae por debajo del umbral', () => {
    const deficit = calcularDeficitDimensionesCriticas({
      utilidad: 50,
      profundidad: 80,
      eeat: 90,
    });
    expect(deficit).toBe(UMBRAL_DIMENSION_CRITICA - 50);
    const pen = calcularPenalizacionEditorial({
      utilidad: 50,
      profundidad: 80,
      eeat: 90,
    });
    expect(pen).toBe(Math.min(UMBRAL_DIMENSION_CRITICA - 50, MAXIMA_PENALIZACION_V3_2));
  });

  it('acumula déficit cuando varias dimensiones están bajas', () => {
    const deficit = calcularDeficitDimensionesCriticas({
      utilidad: 50,
      profundidad: 55,
      eeat: 90,
    });
    expect(deficit).toBe((60 - 50) + (60 - 55));
  });

  it('respeta el límite máximo de -5 puntos', () => {
    const pen = calcularPenalizacionEditorial({
      utilidad: 10,
      profundidad: 20,
      eeat: 30,
    });
    expect(pen).toBe(MAXIMA_PENALIZACION_V3_2);
  });

  it('no afecta noticias fuertes con dimensiones altas', () => {
    const pen = calcularPenalizacionEditorial({
      utilidad: 95,
      profundidad: 92,
      eeat: 96,
    });
    expect(pen).toBe(0);
  });

  it('penalización parcial cuando el déficit es menor al máximo', () => {
    const pen = calcularPenalizacionEditorial({
      utilidad: 58,
      profundidad: 80,
      eeat: 90,
    });
    expect(pen).toBe(2); // 60 - 58 = 2
    expect(pen).toBeLessThan(MAXIMA_PENALIZACION_V3_2);
  });
});
