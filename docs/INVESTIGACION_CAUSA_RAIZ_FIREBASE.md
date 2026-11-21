# Investigación — Causa Raíz Firebase/Firestore

**Fecha:** 2026-11-21 · **Base:** facturación real 1–19 nov 2026 + inspección del corpus en producción.

## Veredicto

La causa raíz NO es el volumen de datos (corpus ≈ 8 MB) sino la **frecuencia de regeneración de caché × proyección de documentos completos**, amplificada por tráfico de crawlers.

## Cadena causal comprobada

1. `LIST_FIELDS` en `lib/data.ts` incluía `contenido` → **cada documento de listado pesaba ~10 KB** (el HTML completo) aunque las tarjetas solo muestran título/resumen/imagen.
2. La portada tenía `revalidate = 60` y ejecutaba `getNews(80)` + `getMasLeidas(5)` + 12× `getNewsByCategory(12)` + trending — cada función con su propia query y su propia entrada de `unstable_cache`.
3. `getNews(count)` cacheaba por cada `count` distinto → el mismo pool de ~500–751 docs se releía 5–6 veces por ciclo de regeneración.
4. `fetchPublishedDocs` ejecutaba 2–3 queries por el campo `fecha` de tipo mixto (539 Timestamp + 212 String verificado en prod) + rama `publishedAt`.
5. `getCanonicalArticleMetrics` descargaba el documento completo (~10 KB) en **cada pageview** para leer un solo campo `vistas`.
6. Crawlers (Googlebot, Facebook, WhatsApp preview, Telegram) mantienen las cachés ISR invalidándose constantemente → regeneraciones continuas las 24 h.

## Aritmética de la factura

- Regeneración de listados (antes): ~15–25 queries × ~500–2000 docs × ~10 KB ≈ **30–80 MB por ciclo**.
- Con TTL 60 s y tráfico de crawlers: ~1,000–1,500 ciclos/día → **~9 GiB/día de egress** y **~1.5–2M reads/día** — coincide con lo facturado (171 GiB/19d ≈ 9 GiB/día; 33.5M reads/19d ≈ 1.77M/día).

## Estado tras `606c887d` + `e55ffd81`

| Problema | Estado |
|---|---|
| `contenido` en listados | Eliminado; proxy `palabras` para renderabilidad (100% poblado en prod) |
| Cachés duplicadas por `count` | Pool único cacheado |
| TTL portada 60 s | 300 s (publicación invalida tags al instante) |
| Métricas por pageview | `select('vistas')` |
| Consultas sin límite | Todas las rutas públicas y NIOS acotadas (verificado) |
| `/api/entity` escaneos ilimitados | Admin-only |
| Control de gasto reactivo | `config/cost_guard` + `cost_daily` snapshots |

## Lo que NO explica la factura (descartado con evidencia)

- **Tamaño del corpus**: 751 docs × ~10 KB ≈ 8 MB — irrelevante.
- **onSnapshot/listeners**: no existe ninguno en el código (verificado por búsqueda).
- **NIOS/departamento**: todas las consultas tienen `.limit()` (200–600) y las colecciones operativas son pequeñas (depto_jobs 411, nios_memory 816).
- **Cloud Functions/Run/App Engine**: no hay funciones desplegadas en el repo; todo corre en Vercel + Firestore.
