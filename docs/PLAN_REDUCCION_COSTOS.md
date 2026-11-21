# Plan de Reducción de Costos Google Cloud — Nicaragua Informate

Rama: `audit/costos-firestore` · Estado: **Fases 1–3 implementadas y verificadas** · Sin merge, sin deploy.

## Fase 1 — Implementado en esta rama

| # | Optimización | Estado | Ahorro estimado |
|---|---|---|---|
| 1 | `contenido` fuera de `LIST_FIELDS` + proxy `palabras` en `hasRenderableContent` | ✅ | ~85% bytes en listados (~7 GB/día) |
| 2 | Pool único `getNews` (un fetch, slice por count) | ✅ | ~70% lecturas de listas |
| 3 | TTL 60→300 s portada/listas; 300→900 s categorías/relacionadas/más-leídas | ✅ | ~5–15× menos regeneraciones |
| 4 | `publishedAt` branch cap 100 (0 docs sin `fecha` en prod) | ✅ | ~15% lecturas por query |
| 5 | `getCanonicalArticleMetrics` → `select('vistas')` | ✅ | ~10 KB→0.1 KB por pageview |
| 6 | Sitemap/list-all/getAllSlugs sin `contenido` | ✅ | ~250 MB/día + robustez |
| 7 | `/api/entity` → admin-only (middleware) | ✅ | Cierra escaneo público ilimitado |
| 8 | `/negocios*` y `/correcciones` cacheados | ✅ | Elimina 2–3 queries por request dinámico |
| 9 | `metrics-collector` + `loadNoticiasFromFirestore` con proyección/flag | ✅ | −~10 MB/día NIOS |
| 10 | Tests de regresión `tests/costos-firestore.test.ts` | ✅ | 6 casos |

## Fase 2 — Recomendado (siguiente iteración, requiere decisión)

| # | Acción | Impacto | Riesgo |
|---|---|---|---|
| 1 | **Migrar `fecha` a Timestamp único** en `noticias` (script one-off + dual-write) | Elimina la triple query de `fetchPublishedDocs` → ~3× menos lecturas en TODOS los listados | Medio: requiere migración de datos y validación; hacer en ventana controlada |
| 2 | **`detectarDuplicadoAdmin`**: persistir índice de shingles/ MinHash por artículo en vez de re-escanear ~750 docs por evaluación MENI | ~750 lecturas → ~1 por evaluación | Medio: cambio de arquitectura del chequeo de duplicados |
| 3 | **`select()` en dashboards admin** (`auditor-dashboard`, `dashboard-calidad`, `stats`, `meni-dashboard`, `traffic`) | Admin lee docs completos de `noticias` (~10 KB c/u) | Bajo |
| 4 | **`resumen-diario`**: pool sin `contenido` + `getAll` de las 6 seleccionadas | −~5 MB/día | Bajo |
| 5 | **Paginación `/noticias?page=N`**: limitar profundidad indexable (noindex a partir de página K) o canonical a página 1 | Crawlers profundos = peores claves de caché | SEO: decidir con criterio editorial |
| 6 | **Article pages**: evaluar `select()` de campos no usados en JSON-LD/render | ~10–20% bytes del detalle | Bajo |
| 7 | Revisar `nios_actions` backlog (182 EXPIRED) y `depto_jobs` (411) — archivado/TTL | Higiene, no costo directo | Bajo |

## Fase 3 — Controles y medición (no implementados aún)

| # | Acción | Dónde |
|---|---|---|
| 1 | **Presupuesto de billing con alertas** al 50/90/100% | GCP Console → Billing → Budgets & alerts (requiere acceso consola) |
| 2 | **Métrica semanal de reads/día**: registrar en `nios_daily_snapshots` o dashboard el conteo de lecturas estimado por ruta | Código: agregar telemetría de queries (contador por función) |
| 3 | **Límite de seguridad**: alerta si `traffic_log`/`analytics_traffic` crece >X% semanal (posible abuso de tracking) | Cloud Monitoring o chequeo en cron |
| 4 | Documentar runbook: "si reads/día > 500K → revisar cache-hit rate y regeneraciones" | `docs/` |

## Lo que NO se hizo (a propósito)

- ❌ No se redujo frecuencia de crons NIOS/departamento (dependencias diarias verificadas).
- ❌ No se tocaron reglas de seguridad de Firestore ni se borraron datos.
- ❌ No se desactivó PITR ni backups (pendiente decisión en consola).
- ❌ No se hizo merge ni deploy — todo queda en `audit/costos-firestore`.

## Criterio de éxito

- Lecturas/día objetivo intermedio: **< 500K** (desde 1.77M).
- Transferencia/día objetivo intermedio: **< 3 GiB** (desde ~9 GiB).
- Costo Firestore proyectado: **~US$15–25/mes** (desde US$40.48 parcial / US$63.97 proyectado).
- US$1–5/mes **no es alcanzable** con esta arquitectura (730 artículos × crawlers constantes + ISR por slug); requeriría exportación estática o moving reads a CDN/edge — documentado honestamente en `PROYECCION_COSTOS_GOOGLE_CLOUD.md`.
