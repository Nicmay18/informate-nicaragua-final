# Auditoría Forense de Costos Firebase — Nicaragua Informate

**Período auditado:** facturación Google Cloud 1–19 nov 2026 · **Rama:** `audit/costos-firestore` · **Fecha:** 2026-11-20

## 1. Evidencia de facturación (reportada)

| Concepto | Consumo (19 días) | Costo |
|---|---|---|
| Firestore Read Ops | 33,581,497 | US$19.58 |
| Firestore Internet Data Transfer Out (Américas→Américas) | 171.37 GiB | US$19.36 |
| Zonal Backup Storage | 43.99 GiB-month | US$1.32 |
| Point-in-time Recovery Storage | 0.92 GiB-month | US$0.17 |
| Firestore Storage | 0.92 GiB-month | US$0.06 |
| **Total** | | **US$40.48** |

Proyección mensual observada: **US$63.97**. Ritmo diario implícito: **~1.77M lecturas/día** y **~9 GiB/día** de salida.

## 2. Estado real del corpus (verificado en producción, solo lectura)

| Métrica | Valor |
|---|---|
| Docs `noticias` | 747 total / 730 publicados |
| Tamaño medio por doc | ~10 KB (JSON; el HTML de `contenido` domina) |
| `traffic_log` | 17,836 docs (~1–2K vistas/día; ~30% bots en muestra) |
| `kb_entities` / `kb_relations` / `kb_timeline` | 474 / 9,477 / 6,089 |
| `nios_actions` | 200 (13 PENDING, 182 EXPIRED) |
| `depto_jobs` | 411 |

**Conclusión estructural:** el corpus es pequeño (~8 MB de datos). 1.77M lecturas/día y 9 GiB/día **no provienen del volumen de datos sino de la frecuencia de regeneración de cachés y de proyectar `contenido` en consultas de listado**.

## 3. Causa raíz identificada (con evidencia de código)

### 3.1 `contenido` (~10 KB/doc) en TODAS las consultas de listado — principal responsable de los 171 GiB

`LIST_FIELDS` en `lib/data.ts` incluía `contenido`. Cada regeneración de caché de portada/listados leía **cientos de documentos con el cuerpo HTML completo** para renderizar tarjetas que solo usan título/resumen/imagen:

- `buildHomePageData` (`lib/db/homepage.ts`): `getNews(80)` + `getMasLeidas(5)` + **10× `getNewsByCategory(12)`** por regeneración.
- `fetchPublishedDocs` ejecuta **3 sub-queries** por llamada (rama `fecha` Timestamp + rama `fecha` string + rama `publishedAt`), cada una con `limit(fetchLimit)` — hasta ~3× las lecturas necesarias por diseño del campo de fecha de tipo mixto.
- `getSitemapNews` proyectaba `contenido` de hasta **1,000 docs cada hora**.
- `/api/list-all` (header del sitio) proyectaba `contenido` solo para reportar su longitud.
- `getCanonicalArticleMetrics` (`lib/canonical-article-metrics.ts`) leía el **documento completo** en CADA pageview de artículo (server action `getArticleMetricsAction` en `ArticlePage.tsx`) para obtener un solo número (`vistas`).

### 3.2 TTL de caché de 60 segundos en la portada — principal responsable de los 33.5M reads

`app/page.tsx` (`revalidate = 60`), `_cachedGetHomePageData`, `_cachedGetNews`, `_cachedGetNewsByCategory` y `_cachedGetMasLeidas` usaban `revalidate: 60`. Con tráfico continuo de crawlers (Googlebot, bingbot — 216 hits en muestra de 2,000 de `traffic_log`), la portada se regeneraba ~cada minuto:

- ~1,400–1,500 lecturas + ~13 MB **por regeneración**.
- ~1,000–1,400 regeneraciones/día → **~1.5–2M lecturas/día + ~15 GB/día** — coincide con la facturación.

Agravante: `getNews(count)` cacheaba por valor de `count` (30, 80, 100, 120, 500…), de modo que portada, trending, buscador y páginas de autor generaban **regeneraciones independientes** del mismo pool de datos.

### 3.3 Consultas sin auth verificadas (riesgo, ya cubierto por middleware)

`/api/revalidate`, `/api/check-content`, `/api/list-empty`, `/api/listar-categoria`, `/api/top-noticias`, `/api/nios/*` son endpoints sin auth **en el handler**, pero `middleware.ts` los cubre vía `SENSITIVE_API_PATHS` + `requireAdminAuth` (401 sin credencial admin). `/api/revalidate` además invalidaja todos los tags públicos — si algún día quedara expuesto sería un vector de amplificación de costos; permanece cerrado.

`/api/entity` (force-dynamic, escaneos sin límite sobre `kb_relations`/`kb_timeline`, sin consumidor público conocido) **no estaba en la lista** → se agregó.

## 4. Lo que NO es el problema (descartado con evidencia)

- **Listeners `onSnapshot`:** no existen en el código (SDK cliente deshabilitado: `NEXT_PUBLIC_FIREBASE_*` vacíos).
- **`trackViewAction`:** ya proyecta `select('titulo','vistas','slug')`, con rate-limit 5/min/IP+slug y dedup por sesión.
- **Páginas públicas:** ISR + `unstable_cache` con tags (portada, /noticias, artículo, categorías, feeds, sitemap).
- **Crons Vercel:** todos diarios y acotados (`vercel.json`); NIOS persiste artículos en chunks de 50; `nios-collect` usa leases de 12 min.
- **`/api/l/[id]` (links cortos):** 1 doc get + guards de bots/dedup por clic.
- **Admin polling:** centro de comando cada 30 s solo con panel abierto; consultas `count()` o limitadas.

## 5. Cambios implementados (rama `audit/costos-firestore`)

| Cambio | Archivo | Efecto |
|---|---|---|
| `contenido` fuera de `LIST_FIELDS`; guard usa proxy `palabras` | `lib/data.ts`, `lib/editorial/canonical.ts` | ~85% menos bytes en listados |
| Pool único `getNews` (slice en memoria) | `lib/data.ts` | ~6 claves de caché → 1; elimina regeneraciones duplicadas |
| Rama `publishedAt` acotada a 100 (100% de publicados tiene `fecha`) | `lib/data.ts` | −100 lecturas/regeneración |
| TTL 60→300 s (portada, pool, listas) y 300→900 s (categorías, más leídas, relacionadas) | `lib/data.ts`, `lib/db/homepage.ts`, `app/page.tsx` | Regeneraciones /5 y /15 en lugar de /1 min |
| `getCanonicalArticleMetrics` con `select('vistas')` | `lib/canonical-article-metrics.ts` | ~10 KB → ~0.1 KB por pageview |
| `/api/list-all` sin `contenido` (campo `palabras`) | `app/api/list-all/route.ts` | −90% bytes por hover de categoría |
| `/api/entity` → admin-only | `middleware.ts` | Cierra escaneos públicos sin límite |
| `listarNegociosPublicos`/`getNegocioPublicoBySlug` cacheados 300 s | `lib/negocios/datos.ts` | `/negocios` force-dynamic ya no consulta por request |
| `getPublicCorrections` cacheado 300 s | `lib/correcciones.ts` | `/correcciones` force-dynamic cacheado |
| `metrics-collector` con `select()` de campos usados | `lib/meni/learning-engine/metrics-collector.ts` | Ciclo semanal sin `contenido` |
| `loadNoticiasFromFirestore` sin `contenido` por defecto; `includeContenido` solo para forense (3 docs) | `lib/nios/intelligence/data-merger.ts`, `lib/nios/operational-loop.ts` | −5 MB/día en NIOS sin perder detección forense |
| `getAllSlugs` y sitemap sin `contenido` (proxy `palabras`) | `lib/data.ts` | Sitemap horario −~10 MB/regeneración |
| Tiempo de lectura del hero usa `palabras` | `components/HomePagePro.tsx` | Sin regresión visual |

**Verificación:** `tsc --noEmit` limpio · ESLint limpio · suite completa verde (1,926 tests, incl. `tests/costos-firestore.test.ts` nuevo con 6 casos de regresión).

## 6. Zonal Backup Storage — 43.99 GiB-month (pendiente de consola)

El corpus activo (~8 MB de noticias + colecciones operativas, orden de magnitud <1 GiB) **no explica 44 GiB-month de backups**. Hipótesis a verificar en Firebase Console → Firestore → Backups:

1. **Retención de backups programados** (diarios/semanales) sobre una base que históricamente fue mayor (p.ej. `traffic_log`, snapshots NIOS con subcolecciones de artículos, colecciones eliminadas).
2. Subcolecciones de `nios_daily_snapshots/{date}/articles` y `nios_runs/{date}/pipeline/*` — cada snapshot embebe ~500 artículos fusionados; 96 snapshots × chunks pueden sumar cientos de MB por generación de backup.
3. PITR (0.92 GiB-month) es independiente y pequeño — no es la causa.

**Acción requerida (NO ejecutada — requiere autorización):** revisar en consola la política de backups programados (frecuencia y retención) y dimensionar el almacenamiento real por colección. No se eliminó ni modificó ninguna política.
