# Implementación MENI V3.2

## Resumen

MENI V3.2 añade una capa de penalización editorial por debajo del cálculo de `valorEditorial`, sin alterar analizadores, pesos, blend, ADN NI, originalidad ni aporte propio.

## Archivos modificados

### Nuevos

- `lib/meni/penalizacion-editorial.ts`
- `tests/meni-v3-2-penalizacion.test.ts`

### Modificados

- `lib/meni/editorial-brain/index.ts`
  - Importa `calcularPenalizacionEditorial`.
  - Aplica la penalización después de `valorEditorial` y antes del redondeo del `scoreFinal`.

## Detalle de la penalización

```ts
// lib/meni/penalizacion-editorial.ts

export const UMBRAL_DIMENSION_CRITICA = 60;
export const MAXIMA_PENALIZACION_V3_2 = 5;

export function calcularDeficitDimensionesCriticas(input: PenalizacionEditorialInput): number {
  const umbral = input.umbral ?? UMBRAL_DIMENSION_CRITICA;
  return [input.utilidad, input.profundidad, input.eeat]
    .filter((d) => d < umbral)
    .reduce((acumulado, d) => acumulado + (umbral - d), 0);
}

export function calcularPenalizacionEditorial(input: PenalizacionEditorialInput): number {
  const deficit = calcularDeficitDimensionesCriticas(input);
  const maximo = input.maximo ?? MAXIMA_PENALIZACION_V3_2;
  return Math.min(deficit, maximo);
}
```

## Integración en `calcularScoreEjecutivoV2`

```ts
// 4. Penalización editorial V3.2 (capa aditiva por dimensiones críticas bajas).
const penalizacionEditorial = calcularPenalizacionEditorial({ utilidad, profundidad, eeat });

// 5. Blend base/valor centralizado.
let score = Math.round(
  base.score * MENI_V2_BLEND.base + valorEditorial * MENI_V2_BLEND.valor - penalizacionEditorial,
);
if (bloquear) score = Math.min(score, 74);
score = Math.max(0, Math.min(100, score));
```

## Invariantes mantenidas

- `analyzeUtilidad`, `analyzeProfundidad` y `analyzeEEAT` no cambian.
- `MENI_V2_WEIGHTS` y `MENI_V2_BLEND` se mantienen intactos.
- Fórmula base del score (`calcularScoreEjecutivo`) no cambia.
- ADN Nicaragua Informate, originalidad y aporte propio siguen operando como antes.
- El score final permanece en el rango `[0, 100]` gracias al `clamp` final.

## Pruebas unitarias

Archivo: `tests/meni-v3-2-penalizacion.test.ts`

Cobertura:

1. Sin penalización: todas las dimensiones por encima del umbral.
2. Una dimensión crítica baja.
3. Varias dimensiones críticas bajas.
4. Límite máximo de -5 puntos.
5. Noticia fuerte con dimensiones altas sin penalización.
6. Penalización parcial cuando el déficit es menor al máximo.

### Resultado de las pruebas

```
✓ tests/meni-v3-2-penalizacion.test.ts (6)
  ✓ MENI V3.2 — penalización editorial por dimensiones críticas (6)

Test Files  1 passed (1)
Tests  6 passed (6)
```

### Verificación de tipos

```
npx tsc --noEmit
# OK
```

## Resultados de la validación final (99 noticias reales)

Archivos generados:

- `VALIDACION-FINAL-MENI-V3-2.md`
- `validacion-final-meni-v3-2.json`

| Métrica | V2 | V3.2 |
|---|---|---|
| Media | 92.59 | 87.87 |
| Mediana | 94 | 90 |
| Std | 5.25 | 6.95 |
| Min | 74 | 70 |
| Max | 99 | 97 |

### Cumplimiento de criterios

1. **Reducción de falsos positivos:** los casos inferidos con `minDim < 60` y `score >= 85` bajan de 9 (V3 base) a 2 (V3.2).
2. **Estabilidad del ranking:** 89/99 scores se mueven frente a V2, el top 10 mantiene las noticias de mayor calidad editorial y el bottom 10 refleja mejor las noticias con dimensiones críticas bajas.
3. **Dispersión superior a V2:** la desviación estándar sube de 5.25 a 6.95, lo que confirma mayor capacidad discriminativa.

## Estatus de candidato a producción

MENI V3.2 cumple los tres criterios establecidos: reduce falsos positivos, mantiene estabilidad en el ranking y aumenta la dispersión respecto a V2.

**MENI V3.2 está marcado como versión candidata a producción.**

