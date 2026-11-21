# Mapa de Consumo Firestore — Nicaragua Informate

Inventario de rutas de lectura/escritura a Firestore con frecuencia, volumen estimado y estado post-optimizaciones (rama `audit/costos-firestore`).

## Leyenda de volumen

- **Docs/regeneración**: documentos leídos por ejecución del proceso.
- **Frecuencia**: cada cuánto se ejecuta en régimen normal.
- **Bytes/doc**: tamaño medio transferido por documento (post-optimización ~1.5 KB en listados; ~10 KB con `contenido`).

## A. Superficie pública (mayor impacto)

| Ruta / función | Archivo | Proceso | Frecuencia | Docs/ejecución | Bytes aprox. | Estado |
|---|---|---|---|---|---|---|
| `/` portada | `app/page.tsx` → `lib/db/homepage.ts` `buildHomePageData` | pool noticias + 10 categorías + más leídas | ISR 300 s + invalidación por tag en cada publicación | ~500 (pool) + ~720 (cats, TTL 900 s) + ~120 | ~1 MB | Optimizado: pool único, sin `contenido`, TTL ×5 |
| `/noticias` y `?page=N` | `app/noticias/page.tsx` → `getNewsPaginated`/`getNewsCount` | `fetchPublishedDocs` + `count()` | ISR 300 s / dinámico por searchParams | ~150–600 según página | ~0.3–1 MB | Cache por página; count() barato |
| `/noticias/[slug]` | `app/noticias/[slug]/page.tsx` → `getNewsBySlug` | doc completo + relacionadas | ISR 300 s por slug | 1 doc (~10 KB) + pool categoría | ~10 KB + ~20 KB | Necesario (renderiza cuerpo); cacheado |
| `/categoria/[slug]` | `app/categoria/[slug]/page.tsx` → `getCategoryPaginated` | `fetchPublishedDocs` por categoría | ISR 3600 s | ~150 | ~0.3 MB | Correcto |
| `/buscar` | `app/buscar/page.tsx` | `getNews(120)` → pool | cache 300 s | 0 (pool compartido) | 0 | Se beneficia del pool único |
| `/autor/[slug]` | `app/autor/[slug]/page.tsx` | `getNews(500)` ×2 (metadata+página) | force-dynamic, pero datos cacheados | 0 (pool) | 0 | OK tras pool único |
| `/negocios`, `/negocios/[slug]` | `app/negocios/**` → `lib/negocios/datos.ts` | 2 queries (negocios+campañas) | **force-dynamic** | ~2 + N | bajo | **Cacheado 300 s (nuevo)** |
| `/correcciones` | `app/correcciones/page.tsx` → `lib/correcciones.ts` | `editor_corrections` + join noticias | **force-dynamic** | ~60 | ~50 KB | **Cacheado 300 s (nuevo)** |
| `/api/list-all` | `components/Header.tsx` (hover menú) | triple query por categoría | cache 300 s por (cat,limit) | ~15 | ~25 KB | Sin `contenido` (nuevo) |
| `/api/top-noticias`, `/api/count-news` | widgets | `orderBy vistas limit 6` / `count()` | bajo tráfico / 86400 s | 6 / 0 | mínimo | OK |
| `/feed.xml`, `/rss`, `/feed.json`, `/news-sitemap.xml`, `/sitemap.xml` | `app/feed*/route.ts`, `app/*sitemap*` | `fetchFeedArticles`/`getSitemapNews` | cache 86400 s / 3600 s + CDN | ~200–1000 | ~2 MB (feed, necesario) / ~1.5 MB (sitemap, sin `contenido` ya) | Sitemap optimizado |
| `/api/l/[id]` links cortos | `app/api/l/[id]/route.ts` | 1 doc + analytics write | por clic Telegram/redes | 1 | ~1 KB | OK (guards bots/dedup) |
| Pageviews artículo → server actions | `ArticlePage.tsx` → `trackViewAction`, `getArticleMetricsAction` | select() + writes | por visita con JS | ~3 reads + 2 writes | ~0.5 KB | `getCanonicalArticleMetrics` ahora `select('vistas')` |

## B. Procesos NIOS / Departamento Central (diarios)

| Proceso | Archivo | Lecturas | Notas |
|---|---|---|---|
| `nios-collect` (08:00–09:30, 4 etapas) | `app/api/cron/nios-collect/route.ts` + `lib/nios/intelligence/orchestrator.ts` | ~500 docs (sin `contenido` ya) + snapshots chunked | GSC/GA4 son APIs externas, no Firestore |
| `nios-ceo-loop` (02:00) | `app/api/cron/nios-ceo-loop/route.ts` + `lib/nios/ceo-loop.ts` | snapshots + `nios_memory` pending + heartbeat | acotado |
| `ceo-observatory` / `repair-engine` | `lib/nios/ceo-observatory.ts`, `repair-engine.ts` | 500–1000 docs sin `contenido` | antes incluían `contenido` |
| `loadNoticiasAsInputs` (forense, 3 docs) | `lib/nios/operational-loop.ts` | 3 docs **con** `contenido` | flag `includeContenido` |
| `departamento-central` scheduler/watchdog/daily | `lib/departamento-central/*` | `depto_jobs` limit 200, noticias limit 20 | jobs article-pipeline → `runMeni` → `detectarDuplicadoAdmin` (~747 lecturas metadata por evaluación) |
| `meni-learning-cycle` (domingos) | `app/api/cron/meni-learning-cycle/route.ts` | `noticias` completo **con select()** (~747) + `traffic_log` ≤5000 | antes leía `contenido` de todo el corpus |
| `resumen-diario` (12:00) | `app/api/cron/resumen-diario/route.ts` | `fetchPublishedDocs` ~600 docs **con `contenido`** | 1×/día; contenido necesario para extractos del boletín |
| `distribuciones-retry` (05:15) | `app/api/cron/distribuciones-retry/route.ts` | batches limitados + slug lookups | OK |
| `supervisor-watch`, `traffic-cleanup` | crons | heartbeats/borrados acotados | OK |

## C. Panel admin (bajo demanda)

| Endpoint | Patrón | Estado |
|---|---|---|
| `/api/admin/centro-de-comando` | polling 30 s desde panel abierto; `count()` + reads limitados | Aceptable (solo con sesión) |
| `/api/admin/*` dashboards | varias consultas sin `limit()` sobre `noticias`/`meni_*` | Candidatas a `.limit()`/`select()` — bajo impacto real (tráfico admin mínimo) |
| `/api/admin/meni/evaluar`, `guardar-directo` | `runMeni` → `detectarDuplicadoAdmin` lee hasta 2,000 docs **metadata only** (select titulo/resumen/slug/estado) | ~750 lecturas/evaluación — optimizable a futuro con índice de shingles persistido |

## D. Escrituras (no auditadas en profundidad — el costo reportado es de lecturas)

`traffic_log` (+1/view), `traffic_daily` (increment), `analytics_traffic`, `distribuciones_*`, `nios_*`, `depto_*`, `learning_cycles`. Volumen diario estimado <10K writes — despreciable vs. 1.77M reads.

## E. Resumen de la reducción esperada

| Métrica | Antes (est.) | Después (est.) | Reducción |
|---|---|---|---|
| Lecturas/día por listados públicos | ~1.5–2M | ~250–450K | ~75–85% |
| Bytes por regeneración de portada | ~13 MB | ~1.5 MB | ~88% |
| Bytes por pageview (métricas) | ~10 KB | ~0.1 KB | ~99% |
| Transferencia total/día | ~9 GiB | ~2–3 GiB | ~65–75% |
