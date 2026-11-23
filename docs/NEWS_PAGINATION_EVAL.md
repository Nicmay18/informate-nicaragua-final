# Evaluación — caché compartida para `/noticias` paginado

**Estado**: implementación preparada y verificada en esta rama.
**RECOMENDACIÓN BASADA EN DATOS: NO MERGEAR** — la alternativa cuesta más
que el problema. Ver análisis abajo.

## 1. Cómo funciona hoy

`getNewsPaginated(page, pageSize=12)` → `_cachedGetNewsPaginated` (unstable_cache
por `(page,pageSize)`, TTL 900s, tag `noticias`):

1. `fetchPublishedDocs(LIST_FIELDS, offset + pageSize*4)` — ejecuta **2
   queries** (rama `fecha` Timestamp + rama `fecha` string) porque el campo
   `fecha` tiene tipo mixto en Firestore.
2. `mapDocToNoticia` + filtro `isPublicNews`/`isToxicSlug` + sort por fecha
   canónica en memoria + `slice(offset, offset+pageSize)`.

El `×4` compensa el filtrado en memoria; en la práctica el filtro remueve
~0 docs (741/741 pasan hoy).

## 2. Consultas reales por regeneración

Por página profunda: hasta `2 × (offset+48)` docs leídos entre ambas ramas
(p56: ~708×2 intentados, ~738 únicos). **Pero la frecuencia es baja**:

| Día | Regens news_paginated | Docs totales |
|---|---|---|
| 2026-11-22 | 2 (p1, p56) | 834 |
| 2026-11-23 | 8 (p1×5, p27, p34, p36) | 2,385 |

**Coste real actual: ~2-3K lecturas/día ≈ US$0.002/día.** No es un driver
de la factura — el O(n²) existe por regeneración pero las páginas profundas
casi no se regeneran.

## 3. Propuesta implementada (esta rama)

`_cachedGetNewsIndex`: UNA entrada unstable_cache con el listado completo
mapeado+filtrado+ordenado (~741 items); `getNewsPaginated` solo hace
`slice()` — cero Firestore por página.

**Paridad verificada en producción real**: páginas 1-60, slugs idénticos
**0/60 diferencias**, sin underfill en ninguna implementación.

## 4. Por qué NO conviene (análisis de costos)

- La índice regenera en CADA ventana de 900s mientras `/noticias` reciba
  tráfico (crawlers continuos).
- Cada regen del índice cuesta **~991 lecturas**: 741 docs del corpus +
  **~250 del fallback `publishedAt`** — `fetchPublishedDocs` ejecuta la
  rama publishedAt cuando `fechaDocs < fetchLimit`; con fetchLimit=1500
  (necesario para holgura de crecimiento) el fallback SIEMPRE corre, y la
  query indexada `estado+publishedAt` **falla siempre** (índice compuesto
  inexistente — FAILED_PRECONDITION verificado), así que paga la rama
  single-field de 250 docs que son 100% duplicados.

### Escenarios de costo diario (separando observado / estimado / hipotético)

Costo por regen del índice: **~991 lecturas** (estimación basada en corpus
real de 741 docs + fallback medido de ~250).

| Escenario | Regens/día | Lecturas/día estimadas | vs actual |
|---|---|---|---|
| Observado bajo | 2 | ~1,982 | ~2.4x PEOR que 834 observadas |
| Observado medio | 4 | ~3,964 | ~2.3x PEOR |
| Observado alto | 8 | ~7,928 | ~3.3x PEOR que 2,385 observadas |
| **Extremo hipotético** | 96 (techo si /noticias recibiera tráfico continuo toda ventana de 900s) | ~95,136 | ~40x peor — **NO es consumo observado** |

Incluso en el escenario observado más favorable (2 regens/día), la caché
compartida cuesta ~2.4x más lecturas que la implementación actual, porque
cada regeneración del índice relee el corpus completo (~991 docs) mientras
las páginas individuales solo leen `offset+48` docs y la mayoría de
regeneraciones observadas son páginas someras (p1 ≈ 48-96 docs).

**Conclusión**: la propuesta es una regresión a CUALQUIER frecuencia
observada, no solo en el peor caso. El problema real no es la paginación
sino la frecuencia de invalidación (`revalidateTag('noticias')` global —
PR #50, congelado hasta tener métricas).

## 5. Respuestas a las preguntas obligatorias

- **Orden/duplicados**: idéntico — mismo `mapDocToNoticia`+filtro+sort;
  paridad 0/60 verificada.
- **Invalidación**: tag `noticias` idéntico → publicación/edición/borrado
  se comportan igual (invalidación instantánea garantizada).
- **Expiración/fallo**: unstable_cache TTL 900s + fail-open a `[]` igual
  que hoy; si la caché falla, el siguiente request reintenta.
- **Contrato**: `getNewsPaginated(page,pageSize)` firma y salida
  `Noticia[]` sin cambios; único consumidor `/noticias`.
- **Ahorro estimado**: NEGATIVO — ~2.4-3.3x más lecturas que la actual a
  las frecuencias observadas (2-8 regens/día); ~40x solo en el escenario
  hipotético extremo de 96 regens/día.
- **Medido**: paridad exacta 0/60 páginas; freq 2-8 regens/día;
  docs ~0.8-2.4K/día; corpus 741; fallback publishedAt ~250 lecturas
  desperdiciadas por regen del índice.

## 6. Recomendación

1. **NO mergear esta rama.** Cerrar el PR como "evaluado y rechazado".
2. La optimización real de este surface está en **PR #50** (invalidación
   granular) — reduce las regeneraciones post-publicación que SÍ explican
   la mayoría de regens de paginación.
3. Micro-opción opcional (ahorro ~US$0.05/mes, no justifica PR propio):
   subir `revalidate` del paginado 900→14400s — las tarjetas no muestran
   contadores y la publicación invalida el tag al instante. Diferible.

## Rollback

Si se mergeara por error: `git revert` del squash — sin migraciones,
sin cambios de datos, sin efectos fuera de la caché.
