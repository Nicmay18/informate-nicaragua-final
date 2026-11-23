# Investigación — news_pool, news_by_category, related_pool, mas_leidas

**Alcance**: solo investigación y medición. Sin cambios de código funcional.
**Datos**: `metrics_daily` 2026-11-22 y 2026-11-23 (UTC) + verificación de
paridad contra Firestore real. Muestra pequeña: 2 días, uno con 6
mutaciones y otro con 0 — insuficiente para atribuir causalidad.

## 1. Mapado de consultas reales

Todas pasan por `fetchPublishedDocs` (lib/data.ts:269): 2 queries por
llamada (rama `fecha` Timestamp + rama `fecha` string, límite `fetchLimit`
c/u) + rama `publishedAt` SOLO si `fechaDocs < fetchLimit`. Proyección
`.select(LIST_FIELDS)` ya aplicada en todas — **`contenido` no se descarga**
en ninguna de estas superficies.

| Caché | Key args | fetchLimit | TTL | Tag | Consumidores |
|---|---|---|---|---|---|
| `_cachedGetNewsPool` | — | 200 | 600s | noticias | getNews→portada(80), autor(100/500), buscar(120), NIOS/admin(50-500) |
| `_cachedGetNewsByCategory` | (cat, count) | min(count*2,100)=24 | 900s | noticias | portada: 6 cats × count=12 |
| `_cachedGetMasLeidas` | (count) | query limit 120 fija | 900s | noticias+popular | portada/NIOs count=5 |
| `_cachedRelatedPool` | (cat, count+10=16) | 16 | 900s | noticias | /noticias/[slug] → getRelatedNews(6) |
| `_cachedGetCategoryPaginated` | (cat,page,size) | offset+48 | 900s | noticias | /categoria/[slug] |

## 2. Mediciones (docs instrumentados ≈ lecturas para estas rutas)

`docs/regen` ≈ lecturas facturadas porque cada doc devuelto por las ramas
fue leído una vez; la única subestimación es news_pool (docs=200 pool
final pero ~240 leídos: 200 rama ts + ~40 rama string).

| Ruta | Regens/día | Docs/día | Lecturas/regen | TTL efectivo |
|---|---|---|---|---|
| news_pool | 35-36 | ~7,000-7,200 | ~240 | 600s |
| news_by_category (6 keys) | ~150 total | ~5,700-6,800 | ~26-96 | 900s |
| related_pool (6 keys) | ~102-119 | ~2,900-3,800 | ~24-32 | 900s |
| mas_leidas | 23-26 | ~2,760-3,120 | 120 | 900s |
| **Subtotal** | | **~18-21K/día** | | ≈55-65% de los ~29-38K docs instrumentados/día |

Regeneraciones por día NO se explican por TTL solo (600s→144 máx,
900s→96 máx): news_pool 35/día y related_pool hasta 50/día en una sola
categoría implican tráfico sostenido + invalidaciones por publicación.

## 3. Duplicación de lecturas confirmada

Para CADA categoría coexisten hasta 3 consultas separadas del mismo corpus:

- `news_by_category(cat, 24)` — portada (6 keys × ~25 regens/día)
- `related_pool(cat, 16)` — cada artículo visitado (~119 regens/día total)
- `category_paginated(cat, pN)` — /categoria/[slug] (~10 regens/día)

Además `news_pool` relee el top-200 global que incluye ítems de todas las
categorías. **Mismo documento puede leerse 3-4 veces por ventana de 900s**
bajo keys de caché distintas.

## 4. Prueba de paridad — pool global → categorías: RECHAZADA

Verificado contra Firestore real (`parity-pool-category.mts`): derivar las
secciones por categoría desde el pool global de 200 **NO es paritario**.
Tecnología y Espectáculos difieren: su top-12 incluye noticias con rango
global >400 (categorías de bajo volumen) que el pool de 200 no contiene.
El pool global solo sirve para listados cronológicos, no por categoría.

## 5. Propuestas (ninguna implementada)

### P1 — Pool por categoría compartido (news_by_category + related_pool)

- **Problema**: 2 consultas del mismo corpus por categoría con límites y
  post-procesos distintos (24 vs 16; dedup vs sin dedup).
- **Cambio mínimo**: una sola entrada unstable_cache por categoría
  (fetchLimit ~30, misma proyección LIST_FIELDS, tag `noticias`, TTL 900s)
  de la que ambos consumidores hacen slice/filtro. related_pool pasaría a
  reutilizar la entrada ya caliente por la portada → sus ~119 regens/día
  dejarían de leer Firestore cuando la entrada siga vigente.
- **Ahorro estimado**: related_pool ~2.9-3.8K lecturas/día → ~0-1K
  (solo cuando el pool expire). ≈ **10-15% de docs instrumentados/día**.
  En USD lecturas: ~US$0.002-0.003/día ≈ **US$0.06-0.09/mes** + bytes.
- **Riesgo**: related_pool hoy NO deduplica por slug y news_by_category
  sí — unificar exige decidir la semántica; si hay slugs duplicados en el
  corpus el orden de relacionadas podría cambiar. Requiere prueba de
  paridad por categoría antes de implementar.
- **Prueba**: comparar getRelatedNews(6) actual vs slice del pool
  compartido para los ~30 artículos más visitados de cada categoría.
- **Rollback**: `git revert` — sin migraciones.

### P2 — mas_leidas: limit 120 → 60-80

- **Problema**: 120 lecturas/regen para servir count=5 tras filtro de
  ventana temporal (7d→30d→90d→histórico).
- **Cambio mínimo**: bajar `.limit(120)` si la ventana 7d/30d se llena con
  ~60 candidatos (verificar distribución de `vistas>0` por antigüedad).
- **Ahorro estimado**: ~40-60 lecturas × ~25 regens/día ≈ **1-1.5K
  lecturas/día ≈ US$0.02-0.03/mes**.
- **Riesgo**: si <5 artículos recientes tienen vistas altas, la ventana
  caería a histórico antes — contenido visible podría cambiar.
- **Prueba**: script que simule ventanas con limit 60 vs 120 sobre datos
  reales; comparar salida.

### P3 — NO recomendado: reducir pool global o TTLs

- Pool <200 rompe getNews(200+) de NIOS/admin (ceo-agent, daily-editor).
- TTLs congelados por orden ejecutiva. Invalidación granular = PR #50,
  pendiente de más días de métricas.

## 6. Lo que NO explica estas cifras

- `metrics_daily` solo cubre callbacks instrumentados: NO incluye
  count()s, APIs públicas, crons, view-tracking, builds ni previews.
- Lecturas facturadas ≠ docs instrumentados cuando hay fallback
  publishedAt o queries no instrumentadas. Facturación real: pendiente
  CSV Billing (~dic 6).
- Con 2 días de datos no se puede separar efecto crawler vs TTL vs
  invalidación. Se necesitan ≥7 días incluyendo días con y sin
  publicaciones.

## 7. Recomendación

1. Dejar acumular métricas (cada día mejora la atribución).
2. Si se autoriza una siguiente iteración: **P1 es la candidata con mayor
   ahorro (~10-15% del surface instrumentado)** pero exige prueba de
   paridad por categoría y decisión sobre dedup en relacionadas.
3. P2 es trivial pero de ahorro marginal.
4. Ninguna de estas aproximaciones acerca los US$44/mes a US$5 por sí
   sola — el grueso está en la frecuencia de regeneración ISR y en la
   invalidación global (PR #50), pendiente de evidencia.
