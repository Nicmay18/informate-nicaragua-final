/**
 * Capa de penalización editorial MENI V3.2.
 *
 * Se aplica después del cálculo de `valorEditorial` y antes del redondeo
 * del score final. No modifica los analizadores de dimensión ni los pesos.
 */

export const UMBRAL_DIMENSION_CRITICA = 60;
export const MAXIMA_PENALIZACION_V3_2 = 5;

export interface PenalizacionEditorialInput {
  utilidad: number;
  profundidad: number;
  eeat: number;
  umbral?: number;
  maximo?: number;
}

/**
 * Suma los déficits de utilidad, profundidad y EEAT que caigan por debajo del umbral.
 * Cada punto por debajo del umbral cuenta 1:1.
 */
export function calcularDeficitDimensionesCriticas(input: PenalizacionEditorialInput): number {
  const umbral = input.umbral ?? UMBRAL_DIMENSION_CRITICA;
  return [input.utilidad, input.profundidad, input.eeat]
    .filter((d) => d < umbral)
    .reduce((acumulado, d) => acumulado + (umbral - d), 0);
}

/**
 * Penalización acumulada con tope. Por defecto el tope es 5 puntos.
 */
export function calcularPenalizacionEditorial(input: PenalizacionEditorialInput): number {
  const deficit = calcularDeficitDimensionesCriticas(input);
  const maximo = input.maximo ?? MAXIMA_PENALIZACION_V3_2;
  return Math.min(deficit, maximo);
}
