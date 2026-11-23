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
  tráfico (crawlers continuos) → hasta ~96 regens/día.
- Cada regen del índice cuesta **~991 lecturas**: 741 docs del corpus +
  **~250 del fallback `publishedAt`** — `fetchPublishedDocs` ejecuta la
  rama publishedAt cuando `fechaDocs < fetchLimit`; con fetchLimit=1500
  (necesario para holgura de crecimiento) el fallback SIEMPRE corre, y la
  query indexada `estado+publishedAt` **falla siempre** (índice compuesto
  inexistente — FAILED_PRECONDITION verificado), así que paga la rama
  single-field de 250 docs que son 100% duplicados.
- Peor caso estimado: ~991 × 96 ≈ **~95K lecturas/día** vs ~2-3K actuales
  → **regresión ~30-40x**, no optimización.
- Las páginas individuales antiguas nunca pagaban el fallback porque su
  fetchLimit (≤708) queda por debajo del corpus (741).

Para que el índice ganara haría falta una query dedicada de dos ramas sin
fallback (~741/regen) + TTL largo — aún así ~18-70K/día > actual. **El
problema no es la paginación sino la frecuencia de invalidación**
(`revalidateTag('noticias')` global — PR #50, congelado).

## 5. Respuestas a las preguntas obligatorias

- **Orden/duplicados**: idéntico — mismo `mapDocToNoticia`+filtro+sort;
  paridad 0/60 verificada.
- **Invalidación**: tag `noticias` idéntico → publicación/edición/borrado
  se comportan igual (invalidación instantánea garantizada).
- **Expiración/fallo**: unstable_cache TTL 900s + fail-open a `[]` igual
  que hoy; si la caché falla, el siguiente request reintenta.
- **Contrato**: `getNewsPaginated(page,pageSize)` firma y salida
  `Noticia[]` sin cambios; único consumidor `/noticias`.
- **Ahorro estimado**: NEGATIVO (~30-40x peor). **Medido**: paridad exacta;
  freq ~2-8 regens/día; docs ~2.4K/día.

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
