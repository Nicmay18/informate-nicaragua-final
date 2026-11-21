# Análisis — 33.5M Read Ops (US$19.58 en 19 días)

## Desglose por proceso (estimación por modelo de código; la factura no desglosa por función)

| Proceso | Archivo | Reads estimados/día (antes) | Estado |
|---|---|---|---|
| Portada ISR (revalidate 60s) | `app/page.tsx`, `lib/data.ts` | ~700,000–1,000,000 | Pool único + TTL 300s → ~50,000–100,000 |
| `/noticias` + categorías | `app/noticias/`, `lib/db/homepage.ts` | ~300,000–500,000 | TTL 300–900s + pool compartido |
| Página de artículo (ISR + server actions) | `app/noticias/[slug]/`, `lib/canonical-article-metrics.ts` | ~100,000–200,000 | `select('vistas')` en métricas; detalle 1 doc |
| Sitemap/noticias relacionadas | `app/sitemap.ts`, `getRelatedNews` | ~50,000–100,000 | TTL 3600s, sin `contenido` |
| NIOS crons (4 etapas + ceo-loop + depto) | `app/api/cron/*`, `lib/nios/*` | ~20,000–50,000 | Ya acotado; sin cambios de frecuencia |
| Server actions por pageview | `trackViewAction`, `getArticleMetricsAction` | ~50,000–150,000 | Proyección `select` aplicada |

## Causa raíz de las lecturas

Firestore cobra **por documento devuelto**, no por query. Cada regeneración de caché releía el corpus completo (~750 docs) multiplicado por ~15–25 queries separadas (una por sección/categoría/orden). Con TTL de 60 s y crawlers pegando el sitio constantemente, las regeneraciones se producían ~1,000–1,500 veces al día.

## Correcciones aplicadas (`606c887d`)

1. **Pool único**: `getNews(count)` comparte un único dataset cacheado — una sola lectura del corpus por regeneración en vez de 5–6.
2. **TTL reales**: portada/listas 300 s, categorías/relacionadas/más-leídas 900 s. `revalidateTag('noticias')` sigue invalidando **al instante** cuando se publica/edita una noticia — la frescura editorial no se degrada.
3. **`fetchPublishedDocs`**: rama `publishedAt` acotada a 100 docs (verificado: 0 docs sin `fecha` en prod).
4. **`getCanonicalArticleMetrics`**: lectura por ID primero, fallback slug `limit(1)`, solo `select('vistas')`.
5. **NIOS**: `loadNoticiasFromFirestore` sin `contenido` (salvo forense de 3 docs); `metrics-collector` con `select()`.
6. **`/api/entity`**: admin-only (hacía escaneos ilimitados de `kb_relations`/`kb_timeline`).

## Proyección

~350,000–550,000 reads/día → ~13M/mes → **~US$8/mes** (vs US$31 proyectado antes).
