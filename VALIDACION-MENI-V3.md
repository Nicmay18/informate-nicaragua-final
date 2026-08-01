# Validación MENI V3 vs MENI V2

Muestra: 99 noticias reales de Firestore.
Fecha: 2026-08-01T15:16:42.997Z

## Archivos modificados

- `lib/meni/eeat.ts`
- `lib/meni/utilidad.ts`
- `lib/meni/profundidad.ts`
- `lib/meni/editorial-brain/index.ts`
- `tests/meni-v3-dimensions.test.ts`

## Resumen comparativo

| Métrica | V2 | V3 |
|---|---|---|
| media | 93.31 | 89.08 |
| mediana | 94 | 90 |
| std | 3.62 | 5.45 |
| min | 74 | 72 |
| max | 99 | 97 |

## Distribución por variable

### Score final

| Rango | V2 | V3 |
|---|---|---|
| 0-20 | 0 | 0 |
| 21-40 | 0 | 0 |
| 41-60 | 0 | 0 |
| 61-80 | 2 | 8 |
| 81-90 | 10 | 42 |
| 91-100 | 87 | 49 |

### Utilidad

| Rango | V2 | V3 |
|---|---|---|
| 0-20 | 0 | 0 |
| 21-40 | 0 | 2 |
| 41-60 | 0 | 11 |
| 61-80 | 0 | 28 |
| 81-90 | 0 | 20 |
| 91-100 | 99 | 38 |

### Profundidad

| Rango | V2 | V3 |
|---|---|---|
| 0-20 | 0 | 2 |
| 21-40 | 0 | 6 |
| 41-60 | 0 | 18 |
| 61-80 | 0 | 24 |
| 81-90 | 0 | 27 |
| 91-100 | 99 | 22 |

### EEAT

| Rango | V2 | V3 |
|---|---|---|
| 0-20 | 0 | 0 |
| 21-40 | 0 | 0 |
| 41-60 | 0 | 10 |
| 61-80 | 0 | 17 |
| 81-90 | 0 | 3 |
| 91-100 | 99 | 69 |

## Estadísticas por variable

| Variable | Versión | n | min | max | media | mediana | std |
|---|---|---|---|---|---|---|---|
| score | V2 | 99 | 74 | 99 | 93.31 | 94 | 3.62 |
| score | V3 | 99 | 72 | 97 | 89.08 | 90 | 5.45 |
| utilidad | V2 | 99 | 100 | 100 | 100 | 100 | 0 |
| utilidad | V3 | 99 | 35 | 100 | 83.94 | 85 | 15.97 |
| profundidad | V2 | 99 | 100 | 100 | 100 | 100 | 0 |
| profundidad | V3 | 99 | 15 | 100 | 75.61 | 80 | 21.16 |
| eeat | V2 | 99 | 100 | 100 | 100 | 100 | 0 |
| eeat | V3 | 99 | 45 | 100 | 88.89 | 95 | 14.9 |

## Diferenciación

- Noticias con score V2 ≠ V3: 90
- Valores distintos de utilidad: 69
- Valores distintos de profundidad: 81
- Valores distintos de EEAT: 72
- Noticias con score único (V3): 22 / 99

## Conclusión

MENI V3 mueve 90 scores respecto a V2. La desviación estándar de utilidad, profundidad y EEAT aumentó, lo que indica mayor capacidad discriminativa sin cambiar pesos ni fórmula final.
