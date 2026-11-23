# Propuesta técnica — Purga selectiva de Cloudflare Edge

**Estado**: IMPLEMENTACIÓN PREPARADA en rama `proposal/cf-selective-purge`.
**NO desplegado, NO mergeado, NO PR abierto.** Requiere autorización expresa.
**Feature-flag**: `CF_PURGE_ENABLED=true` + `CF_ZONE_ID` + `CF_API_TOKEN`.
Sin las variables, el código es 100% no-op — se puede desplegar "apagado".

---

## 1. Problema que resuelve

La Cache Rule "Cache HTML and all static assets" (`/*`, Edge TTL 2h,
ignore cache-control) cachea todo el HTML público por PoP. `revalidateTag`/
`revalidatePath` solo purgan Vercel → **una noticia publicada tarda hasta
~2h en aparecer en edge** (frescura editorial rota HOY, meta <5min).

La purga selectiva resuelve frescura Y habilita TTLs largos en long-tail
(segunda fase, requiere autorización separada).

## 2. Matriz de invalidación por operación

Superficies que lee cada tipo de página (verificado en código):

| Superficie | Fuente de datos | ¿Afectada por publicar/editar/borrar noticia? |
|---|---|---|
| `/` portada | getNews+categorías+mas_leidas | SÍ siempre |
| `/noticias` (p1) | news_paginated p1 | SÍ siempre |
| `/noticias?page=N` (N≥2) | news_paginated pN | SÍ (desplazamiento) — residual documentado |
| `/noticias/{slug}` | artículo + related_pool | SÍ (antes y después de slug) |
| `/categoria/{cat}` | category_paginated/news_by_category | SÍ (cat. anterior y nueva) |
| `/categoria/{cat}?page=N` | idem | SÍ — residual documentado |
| `/tema/{slug}` | noticias.temas (array-contains) | SÍ por cada tema del artículo |
| `/autor/{slug}` | getNews(500) filtrado por autor | SÍ si el autor resuelve en AUTHORS |
| `/entidad/{slug}` | kb_entities/kb_timeline/kb_relations | **NO** — no lee `noticias` |
| `/feed.xml`, `/feed.json`, `/rss`, `/rss.xml` | fetchFeedArticles | SÍ siempre |
| `/news-sitemap.xml`, `/sitemap.xml`, `/mapa-del-sitio` | noticias | SÍ siempre |
| `/buscar` | getNews(120) | bypass CF (propuesta) — no aplica |
| `/api/*`, `/admin/*`, `/panel*` | dinámico/auth | bypass CF — no aplica |

### URLs por operación (todas absolutas, deduplicadas, ≤30/job)

**Publicar** (`POST /api/admin/news`, `POST /api/articles`, guardar-directo nuevo):
`/` `/noticias` `/feed.xml` `/feed.json` `/rss` `/rss.xml` `/news-sitemap.xml` `/sitemap.xml` `/mapa-del-sitio` `/noticias/{slug}` `/categoria/{cat}` `/tema/{t…}` `/autor/{a}` → **~12-20 URLs**.

**Editar** (`PUT /api/admin/news/[id]`, guardar-directo edición, mutation-policy):
lo anterior + `/noticias/{slugAnterior}` si cambió slug + `/categoria/{catAnterior}` si cambió categoría + `/tema/{tAnterior}` si cambiaron temas.

**Despublicar** (soft-delete/archivado): igual que editar con reason `unpublish`.

**Eliminar** (hard-delete): igual con reason `delete`.

**Artículos relacionados**: `getRelatedNews` lee el pool de su categoría —
editar la noticia A puede cambiar las "relacionadas" mostradas en otros
artículos de la misma categoría. **Decisión**: NO se purgan los ~cientos de
artículos hermanos (costo de regeneración inaceptable). Su deriva queda
acotada por Edge TTL (≤2h hoy). Es contenido no-crítico y ya era el
comportamiento efectivo. Documentado como residual aceptado.

## 3. Confiabilidad — diseño del mecanismo

| Requisito | Implementación |
|---|---|
| Idempotencia | `jobId` = sha256(reason + mutationKey + URLs ordenadas). Mismo job no se duplica; `mutationKey` = id doc + timestamp/attemptId por mutación |
| No bloqueo | `enqueueAndPurgeCloudflare` nunca lanza; envuelta en try/catch en cada ruta; timeout API 8s |
| Persistencia | Job en Firestore `cf_purge_jobs/{jobId}`: urls, reason, slug, status, attempts, lastError, timestamps |
| Reintentos | `/api/cron/cf-purge-retry` cada 15min (vercel.json): backoff 2→10→30→60→120min, máx. 5 intentos → `dead` |
| Recuperación | Si CF cae: job queda `failed` → cron reintenta solo. Peor caso = comportamiento actual (stale ≤2h), NUNCA peor |
| Anti-duplicados | status `pending`/`sent`/`done` bloquea re-encolado del mismo jobId |
| Límite URLs | `MAX_URLS_PER_JOB=30` (también límite API CF por llamada); prioridad: artículo+categorías+temas antes que feeds |
| Errores API | Parse de `success:false` + `errors[]` de CF; sanitizado (sin token); log warn |
| Respuestas no-2xx/timeout | `callCloudflarePurge` captura todo → `failed` → reintento |

**Coste del cron**: 1 query indexada (`status in [pending,failed]`, máx 20
docs) por corrida ×96/día ≈ despreciable; respeta `isCronAllowed` (cost_guard).

## 4. Seguridad

| Punto | Estado |
|---|---|
| Token CF | Nuevo secreto `CF_API_TOKEN` — scope propuesto: **Zone → Cache Purge** únicamente, solo zona `nicaraguainformate.com`. Se guarda en Vercel env vars (nunca en repo, nunca cliente) |
| Respuestas admin cacheadas | Ya mitigado: bypass `/api/`,`/admin/`,`/panel` + headers `Cloudflare-CDN-Cache-Control: no-store`. **Verificación pendiente en dashboard**: confirmar que "ignore cache-control" no anula esos headers en respuestas autenticadas (probar 2× request autenticado → nunca HIT con datos) |
| `/buscar` | Propuesta: añadir a bypass (query-string fragmenta cache + página noindex). Hoy puede cachear variantes `?q=` |
| Sesión admin compartiendo caché | Las rutas autenticadas están bajo bypass; cookie `admin_session` solo viaja en requests del admin — CF no la cachea si la ruta está en bypass. Residual: rutas públicas nunca leen esa cookie |
| Secretos en Git | Ninguno añadido; `.env.example` documentará nombres sin valores |
| Purga abusiva | Solo se invoca desde rutas admin autenticadas (`isAdminRequest`/`verifyAdminOrCronToken` ya protegen los handlers) — un tercero no puede forzar purgas |

## 5. Tabla TTL por superficie (propuesta — NO aplicar sin autorización)

| Superficie | ISR actual | Edge TTL actual | TTL propuesto edge | Invalidación | Tolerancia frescura | Riesgo |
|---|---|---|---|---|---|---|
| Portada `/` | 300s | 2h | **30-60min** (o 2h+purga) | Purga en publicación | Alta (meta <5min) | Bajo con purga |
| `/noticias` | 300s | 2h | 30-60min | Purga | Alta | Bajo |
| Artículos `/noticias/*` | 300s | 2h | **12-24h** justificado: contenido inmutable tras publicar; correcciones purgan | Purga en edit/delete | Media (correcciones <5min vía purga) | Bajo — justificado por inmutabilidad |
| Categorías | 3600s | 2h | 2-4h | Purga | Media | Bajo |
| Temas `/tema/*` | 3600s | 2h | 4-12h | Purga | Media | Bajo |
| Entidades `/entidad/*` | 3600s | 2h | 12-24h | Ninguna (kb_*) | Baja (cambian por cron KB) | Bajo |
| Autores `/autor/*` | — | 2h | 12-24h | Purga si aplica | Baja | Bajo |
| `/buscar` | 86400s | 2h | **bypass** | — | — | Elimina fragmentación |
| Feeds `/feed*` | 86400s | ~min | 15-30min + purga | Purga en publicación | Alta (Google News) | Bajo |
| Sitemaps | 3600s | 2h | 1-4h + purga | Purga | Media | Bajo |
| Estáticos `_next/*`, imágenes | — | 2h+ | 30d immutable (versionados) | — | — | Ninguno |
| `/api/*`, `/admin/*`, `/panel*` | dinámico | bypass | bypass | — | — | Ninguno |

**Justificación 12-24h en long-tail**: los artículos publicados son
inmutables en la práctica (correcciones purgan explícitamente); el edge
TTL largo solo afecta contenido que NO cambia — vistas/contadores no se
muestran en tarjetas. Sin purga, 12-24h sería inaceptable; CON purga,
la frescura la garantiza la invalidación, no el TTL.

## 6. Prueba editorial de validación (post-deploy controlado)

1. Publicar noticia controlada (borrador → publicar) con slug único `test-purge-{ts}`.
2. Cronometrar: `curl -s https://nicaraguainformate.com/ | grep -c {slug}` cada 30s → objetivo <5min.
3. Verificar `cf-cache-status` transiciona HIT(viejo)→MISS→HIT(nuevo, Age≈0) en `/`, `/noticias/{slug}`, `/feed.xml`.
4. Editar titular → repetir medición en artículo y categoría.
5. Soft-delete → verificar desaparición de listados.
6. Multi-PoP: `curl --resolve` forzando PoPs distintos (o esperar propagación) — documentar si es viable.
7. Telegram: verificar exactamente 1 mensaje (claim atómico existente).
8. AdSense: inspección visual de anuncio en artículo.
9. `/api/admin/estado` 2× → nunca `cf-cache-status: HIT`.
10. `/buscar?q=test` → `DYNAMIC`/bypass.

## 7. Medición financiera (referencia, NO garantía)

**Baseline medido** (Billing nov 1-22): reads US$21.24 + transfer US$20.98
+ backups ~US$1.80/mes ≈ US$44/mes. `metrics_daily`: ~29-38K docs/día
instrumentados (día típico); hoy anomalía 232K (parcial, crawl wave).

| Escenario | Supuesto | Ahorro estimado/mes | Total proyectado |
|---|---|---|---|
| Conservador | Solo purga (sin TTL changes): frescura resuelta, ahorro indirecto nulo en reads | ~US$0 directo | ~US$44 (frescura arreglada) |
| Probable | Purga + edge TTL 12-24h long-tail + ISR 900: −40-60% origin hits en long-tail | US$10-20 | ~US$24-34 |
| Optimista | + menor crawl wave + ISR 900 | US$15-25 | ~US$19-29 |
| US$5/mes | Requiere que el floor de crawlers baje o reads/regen caigan más — **no demostrable hoy** | — | — |

**Métricas de referencia a capturar ANTES del deploy**: metrics_daily
7 días (regens/docs por ruta), CF Analytics (hit ratio por content-type,
origin requests), Vercel Analytics (requests/functions/bandwidth),
Billing CSV por SKU.

## 8. Archivos modificados (rama `proposal/cf-selective-purge`)

| Archivo | Cambio |
|---|---|
| `lib/cloudflare-purge.ts` | **NUEVO** — cliente CF purge + cola de jobs Firestore + backoff |
| `app/api/cron/cf-purge-retry/route.ts` | **NUEVO** — cron de reintentos (auth cron estándar + cost_guard) |
| `app/api/admin/news/route.ts` | Hook purge tras publicar (POST) |
| `app/api/admin/news/[id]/route.ts` | Hooks purge en PUT + soft-delete + hard-delete |
| `app/api/admin/guardar-directo/route.ts` | Hook purge en guardado (edit/create) |
| `app/api/articles/route.ts` | Hook purge en publicación automatizada |
| `lib/editorial/mutation-policy.ts` | Hooks purge en 3 mutaciones sustantivas (enrich/clean crons) |
| `vercel.json` | +cron `/api/cron/cf-purge-retry` cada 15min |
| `tests/cloudflare-purge.test.ts` | **NUEVO** — 5 tests de matriz URL (✅ pasando) |
| `docs/CF_PURGE_PROPOSAL.md` | Este documento |

**Variables de entorno nuevas** (configurar en Vercel, NO en repo):
`CF_ZONE_ID`, `CF_API_TOKEN` (scope Cache Purge), `CF_PURGE_ENABLED=true`.

**TypeScript**: `tsc --noEmit` ✅ limpio. **Tests**: 5/5 ✅.

## 9. Plan de despliegue coordinado

1. Crear token CF (Zone.Cache Purge, solo este dominio) → Vercel env.
2. Deploy con `CF_PURGE_ENABLED=false` (código dormido, cero efecto).
3. Smoke test producción.
4. `CF_PURGE_ENABLED=true` → publicación controlada → verificar <5min.
5. (Fase 2, autorización separada) Ajustar Cache Rules: bypass /buscar,
   reorder bypass primero, TTL long-tail.

## 10. Rollback

- `CF_PURGE_ENABLED=false` → comportamiento idéntico a hoy (no-op total).
- `git revert` del merge → elimina hooks; jobs pendientes quedan huérfanos
  inertes en `cf_purge_jobs` (sin cron que los procese si se revierte
  vercel.json también).
- CF rules: reversión manual en dashboard (documentar valores antes).

## 11. Lo que NO incluye (justificado)

- ISR 300→900: justificación separada — con purga CF la frescura ya no
  depende de ISR; subirlo ahorra regens solo en origin-hits residuales.
  Recomendado como fase 2 con datos.
- Edge TTL 12-24h: fase 2, depende de que la purga esté probada.
- Purga de artículos relacionados hermanos: costo de regeneración
  inaceptable; deriva acotada documentada.
- Purga de `/entidad/*`: no leen `noticias`, no aplica.
