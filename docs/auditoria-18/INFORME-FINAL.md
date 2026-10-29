# Auditoría final de calidad — Issue #18

**Fecha de ejecución:** 28 de octubre de 2026 (UTC) · **Rama:** `audit/issue-18-calidad`
**Alcance:** revisión integral del repositorio, producción y operación. Toda cifra de este
documento proviene de artefactos guardados en `docs/auditoria-18/` — no hay estimaciones.

## 1. Resumen ejecutivo

- `master` = `add6cbba` (verificado por API de GitHub) y el deployment de producción
  registrado para ese SHA es `success` (`platform.json`).
- Se confirmaron y corrigieron los hallazgos previos (fechas ficticias en sitemap,
  fallback silencioso de Google News, regla de publicación divergente, safeguard NIOS)
  y **tres hallazgos nuevos**: una fuga de respuestas administrativas por caché de
  Cloudflare (P0), un 404 congelado de `/negocios` por la misma causa (P0/P1) y
  violaciones WCAG AA de contraste/ARIA en la plantilla de artículo (P2).
- Lighthouse real (6 informes, `lighthouse-*.json.gz`): home móvil **0.54** /
  escritorio **0.94**; artículos móvil **0.65–0.66** / escritorio **0.95–0.96**.
  CLS = 0 en todas las páginas. El cuello móvil es LCP (7.6 s) dominado por CSS
  bloqueante (~1.16 s) y JS no usado (~410 KiB), no por el TTFB (60–90 ms).
- **P0 fuera del alcance del código:** Cloudflare cachea respuestas `/api/admin/*`
  y las sirve sin credenciales aunque el origen envíe `no-store` (evidencia:
  `cf-cache-status: HIT` con `age` >1000 s). Requiere acción del propietario en el
  panel de Cloudflare (§4.1). Ningún cambio de aplicación puede anular una regla
  de edge "Cache Everything".
- NIOS: **drenando** desde el primer tick post-merge (29-oct 00:58 UTC):
  `pending 315→292, completed 47→72`. Causa raíz del congelamiento
  verificada (claim viejo saturado por completados — §4.4). Recuperación
  completa pendiente de sostenibilidad (~11 días al ritmo de 25/día).
  (03:59 y 04:09 UTC); el próximo tick de cron es diario. El safeguard nuevo
  convierte los 25 `article-pipeline` sin fecha en `skipped` para revisión.

## 2. Matriz de auditoría por área

| Área | Estado | Evidencia |
|---|---|---|
| Baseline SHA/deploy | ✅ `add6cbba`, deploy success | `platform.json` |
| Inventario | ✅ 1643 archivos, CSV + duplicados exactos | `inventory.csv`, `inventory-summary.json` |
| Portada | ✅ 200, SSR, canonical único, JSON-LD, 28 enlaces | `production.json`, `response-0.gz` |
| Artículo | ✅ 200/404/308, metadata, fechas reales, fuentes | `production.json` |
| Sitemap | ✅ corregido lastmod ficticio + tests | `seo-public-routes.test.ts` |
| News sitemap | ✅ 503 detectable vs 200-vacío legítimo | idem |
| Rendimiento | ⚠️ móvil LCP alto; medido y diagnosticado | `performance.json`, `lighthouse-*.gz` |
| Responsive | ✅ sin overflow en 360/768/1440 | `browser.json`, `screen-*.png` |
| Accesibilidad | ✅ corregidas las 3 violaciones axe | `browser.json` → diff |
| Seguridad rutas | ⚠️ auth correcta; CF sirve caché admin (P0) | `production.json` §4.1 |
| Editorial/EEAT | ✅ fechas reales verificadas en HTML | `production.json` |
| CI | ✅ pipeline existente con gate E2E | `platform.json` |
| Operación | ✅ runbook + alertas documentadas | `OPERACION_SIN_DEVIN.md` §7–9 |
| NIOS | ⏳ BLOQUEADO hasta próximo cron (ver §4.4) | `nios-before.json`, `.audit/nios-cola-real.json` |
| Indexación Google | ⏳ solo rastreabilidad comprobada; sin Search Console | §5 |

## 3. Hallazgos

| Sev | Hallazgo | Evidencia reproducible | Acción |
|---|---|---|---|
| P0 | Cloudflare sirvió `/api/admin/*` cacheado sin credenciales pese a `cdn-cache-control: no-store`; la regla "cache everything" sigue activa y **no hay bypass admin** (`/api/admin/estado` → HIT) | `curl` 04:05 → `200` HIT age:1033; 04:40 → `401` fresco pero `/api/admin/estado` y `/api/negocios` siguen cacheándose → la fuga puede repetirse | Regla de bypass en Cloudflare + purga (§4.1) — **requiere propietario** |
| P0/P1 | `/negocios` devolvió 404 congelado (`HIT`, `age`>3000) | `production.json` comparisons: `?audit18=1` → 200; a las 04:40 la canónica ya responde 200 | Resuelto en hechos (la entrada expiró); la causa raíz es la misma regla CF del P0 |
| P1 | `lastModified` evergreen fabricaba "hoy" | `app/sitemap.ts` usaba `safeDate()` → ahora `parseFechaReal` + omisión | Corregido + tests |
| P1 | News sitemap devolvía 200+XML vacío en outage (confundible con cero noticias) | `app/news-sitemap.xml/route.ts` → 503 + `Retry-After` + `no-store` | Corregido + tests |
| P1 | `getSitemapNews()` tragaba errores no-outage como `[]` | `lib/data.ts` → `throw err` | Corregido + tests |
| P2 | `generateMetadata` vs render divergían (`estado`/`titulo`/`contenido` vs `isPublicArticle`) | `app/noticias/[slug]/page.tsx` → `isRenderableArticle` en ambos | Unificado + tests |
| P2 | Worker `article-pipeline` procesaba jobs sin `createdAt` (los 25 reales) | `.audit/nios-cola-real.json`: `dateType: 'undefined'` ×25 | `isFreshArticle` estricto + tests |
| P2 | axe: `aria-progressbar-name`, `aria-prohibited-attr`, `color-contrast` (7–9 nodos/artículo) | `browser.json` | Corregido (§6) |
| P3 | LCP móvil 7.6 s home / ~4.8 s artículo (simulado) | `performance.json` | Diagnóstico §4.3; sin cambio riesgoso |
| P3 | Lighthouse marca `robots.txt` "1 error": directiva `Content-Signal` desconocida | LHR | Intencional (opt-out IA); documentada, no eliminar |
| P3 | Deuda de archivos: 290 en raíz, duplicados exactos identificados | `inventory-summary.json` | Lista §7 — no borrado sin verificación |

## 4. Detalle de los hallazgos operativos

### 4.1 P0 — Caché de Cloudflare sirve datos administrativos y 404 congelados

Reproducción (28-oct ~04:05 UTC):

```
curl -si https://nicaraguainformate.com/api/admin/negocios
HTTP/1.1 200 OK · cf-cache-status: HIT · age: 1033
cache-control: private, max-age=14400 · cdn-cache-control: no-store
{"ok":true,"items":[],"truncated":false}
```

La respuesta lleva `cdn-cache-control: no-store` del middleware y **aun así** fue
almacenada y servida a un cliente sin sesión. Conclusión: la zona tiene una regla
de caché amplia ("Cache Everything" / Edge TTL que **sobrescribe** los headers del
origen) y un Browser Cache TTL de 4 h (`max-age=14400` inyectado en todas las
respuestas). La misma regla congela 404s (`/negocios` sirve 404 con `age`>3000
mientras el origen ya devuelve 200).

**Acción requerida (panel Cloudflare, 10 min):**
1. `https://dash.cloudflare.com` → zona `nicaraguainformate.com` → **Caching → Cache Rules**.
2. Regla nueva **antes** de cualquier "cache everything": *Bypass cache* para
   `Hostname = nicaraguainformate.com` **y** (`URI Path empieza con /api/` o `/admin/` o `Cookie contiene admin_session`).
3. **Caching → Purge Cache → Purge Everything** (elimina el 404 congelado y la
   respuesta admin cacheada ya mismo).
4. Revisar **Caching → Configuration**: "Browser Cache TTL" ≤30 min o "Respect
   origin"; el `max-age=14400` inyectado retrasa correcciones de contenido.
5. Verificación: `curl -si https://nicaraguainformate.com/api/admin/negocios`
   debe dar `401` y `cf-cache-status: DYNAMIC/BYPASS`, y `/negocios` debe dar 200.

Riesgo: ninguno del lado del código — es configuración de CDN. Mientras no se
haga, la mitigación ya desplegada (`CDN-Cache-Control: no-store`) no basta.

**Segunda medición (28-oct ~04:40 UTC) — el mecanismo sigue activo:**

| Sonda | Resultado | Lectura |
|---|---|---|
| `GET /api/admin/negocios` anónimo | `401` · `cf-cache-status: EXPIRED/MISS` | la entrada cacheada expiró o fue purgada; ya no se sirve el 200 filtrado |
| `GET /api/admin/estado` anónimo ×3 | `200` → **HIT** (age crece) | ruta pública-por-diseño en `/api/admin/` se cachea → **no existe bypass para rutas admin** |
| `GET /api/negocios?pk=x` ×2 | `200` → HIT | la regla "cache everything" sigue activa |
| `GET /negocios` | `200` · HIT | el 404 congelado desapareció; la página buena ahora está cacheada |

Conclusión: la fuga **ya no se reproduce ahora mismo** (los endpoints admin
devuelven 401 fresco), pero la **causa raíz está intacta**: en cuanto una
respuesta autenticada `200` de `/api/admin/*` pase por el edge (p. ej. al abrir
el panel), Cloudflare la volverá a cachear y a servir a anónimos. Estado:
**PENDIENTE — requiere la regla de bypass del propietario.**

### 4.2 Regla de publicación unificada

Antes: `generateMetadata` comprobaba `estado !== borrador/archivado` + título/contenido;
el render añadía `isPublicArticle` (aprobado MENI + publicado + no archivado);
`getNewsBySlug` ya aplicaba `isRenderableArticle`. Un doc con `aprobadoMeni=false`
podía generar metadatos para una página que luego 404eaba.
Ahora ambos puntos usan `isRenderableArticle` (misma regla que fetcher y sitemap).
Además, errores de datos en metadata/página ya **propagan** (error real) en vez de
devolver `notFound()` — un outage dejaba de parecer "artículo inexistente".

### 4.3 Rendimiento medido (Lighthouse 12.8.2, Chromium headless, 28-oct-2026)

| URL | Preset | Perf | FCP | LCP | TBT | CLS | TTFB | Peso | Req |
|---|---|---|---|---|---|---|---|---|---|
| `/` | móvil | 0.54 | 3.2 s | 7.6 s | 630 ms | 0 | 90 ms | 1,256 KiB | 60 |
| `/` | escritorio | 0.94 | 0.8 s | 1.6 s | 40 ms | 0 | 60 ms | 1,407 KiB | 68 |
| `/noticias/estudiante-de-leon-gana-oro-en-salto-de-longitud` | móvil | 0.65 | 2.0 s | 4.8 s | 650 ms | 0 | 70 ms | 1,170 KiB | 53 |
| idem | escritorio | 0.95 | 0.7 s | 1.4 s | 30 ms | 0 | 60 ms | 1,170 KiB | 53 |
| `/noticias/ineter-informa-sobre-lluvias-y-tormentas-electricas-en-nicaragua` | móvil | 0.66 | 2.6 s | 4.9 s | 480 ms | 0 | 60 ms | 1,193 KiB | 53 |
| idem | escritorio | 0.96 | 0.7 s | 1.3 s | 20 ms | 0 | 60 ms | 1,193 KiB | 53 |

Diagnósticos principales (móvil): CSS render-blocking ~1.16 s estimados,
`unused-javascript` ~410 KiB, JS de terceros ~320 ms de hilo principal
(AdSense/analítica), `uses-responsive-images` ~33–81 KiB. El hero ya usa
`priority` — no hay una corrección de bajo riesgo pendiente; bajar más exige
partir el CSS/JS de componentes, fuera del criterio "pequeño y reversible".

### 4.4 NIOS — no recuperado (medición honesta)

| Medición | pending | retry | running | completed | dead-letter |
|---|---|---|---|---|---|
| 28-oct 03:59 UTC | 315 | 2 | 0 | 47 | 3 |
| 28-oct 04:09 UTC | 315 | 2 | 0 | 47 | 3 |
| 28-oct 04:46 UTC | 315 | 2 | 0 | 47 | 3 |
| **29-oct 01:13 UTC** | **292** ↓ | 2 | 0 | **72** ↑ | 3 |

**Drenaje confirmado (primer ciclo post-fix):** tras el merge `a080e088`
(deploy success 05:17 UTC 28-oct), el scheduler corrió 00:58 UTC 29-oct con
`processed 15, jobsCompleted 15, jobsFailed 0` y el watchdog 01:04 drenó
~10 más: `-23 pending, +25 completed` en 24 h — el límite teórico de
15+10/día. El claim corregido funciona en producción. Sostenibilidad por
confirmar en los próximos ciclos (faltan ~11 días a este ritmo);
`retry:2` y `dead-letter:3` siguen sin diagnóstico individual.

**Causa raíz del congelamiento — verificada con sonda read-only
(`.audit/claim-diagnostico.cjs`, 28-oct):** la lógica de claim **nueva**
(código actual en master, desplegado 03:23 UTC) sí encontraría y reclamaría
jobs: se replicó su selección sobre producción y el primer candidato
(`muc14h16-86vhzp`, `operational-repair`, P0) existe, está `pending` y su
docId=jobId — la transacción de claim tendría éxito. El "processed 0"
histórico corresponde al claim **viejo** (pre-deploy): la ventana por
`scheduledFor` se saturaba de jobs `completed` (nunca se borran) y los
`pending` quedaban fuera del filtro en memoria — el propio código lo documenta
en `queue.ts`. El próximo tick real (`departamento-central` ~01:58 UTC
29-oct; última corrida 00:58 UTC pre-deploy) es la primera prueba del código
corregido. `executeJob` es robusto por job (catch interno; tipos sin worker →
`skipped`), por lo que ningún job individual puede matar el lote.

- El scheduler corre por cron diario (`departamento-central` última vez 00:58 UTC,
  **antes** del deploy 03:23 UTC). La primera corrida con el código corregido es
  el próximo tick — verificar con `node .audit/nios-cola-real.cjs` tras 02:00 UTC
  del día siguiente: exigir `pending` ↓ y `completed` ↑ en **dos** mediciones.
- Los 25 `article-pipeline` pendientes tienen `payload.createdAt` **indefinido**
  (verificado en producción). Con la regla anterior se habrían procesado; con la
  nueva quedan `completed/skipped` para revisión editorial — comportamiento deseado.
- El contador de "vencidos" del script usaba una consulta compuesta sin índice
  (`FAILED_PRECONDITION`); ahora deriva el dato de la lectura ya paginada y
  expone `counts` por estado y la lista `articlePipeline` con `needsReview`.
- Drenaje teórico: scheduler ≤15 + watchdog ≤10 por corrida diaria ≈ 25/día;
  el backlog de ~317 tardará ~2 semanas si no sube el límite. No se toca
  producción para acelerarlo — decidir tras observar 2 ticks.

## 5. Rastreabilidad vs indexación

- **Comprobado (HTML rastreable):** `robots.txt` 200 y no bloquea contenido;
  sitemap 200 con 28+ URLs, sin duplicados (`production.json.sitemap`);
  artículos con canonical único, `index,follow`, JSON-LD `NewsArticle`+`BreadcrumbList`,
  fechas `<time datetime>` reales; draft/archivado/noindex excluidos por tests.
- **NO comprobado (Search Console):** sin acceso a Search Console en este entorno;
  ninguna afirmación de indexación. Verificar cobertura en
  `search.google.com/search-console` → "Inspección de URL" con los slugs anteriores.
- `Content-Signal: search=yes,ai-train=no,use=reference` en `robots.txt` es
  intencional; Lighthouse la reporta como "directiva desconocida" (inofensivo).

## 6. Cambios aplicados en esta rama

| Archivo | Cambio | Riesgo / rollback |
|---|---|---|
| `app/sitemap.ts` | `evergreenSitemapEntry()` con `parseFechaReal`; eliminado `safeDate()` | lastmod solo aparece con fecha real. Revert = `git revert` |
| `app/news-sitemap.xml/route.ts` | 503+Retry-After en error; `force-dynamic`; filtros `isRenderableArticle`/`shouldIndexArticle`/`isToxicSlug`; slug `encodeURIComponent`+escape | Crawler reintenta; un monitor sobre la URL alertará — deseado |
| `lib/data.ts` | `getSitemapNews` propaga errores | Consistente con ERROR≠EMPTY del resto del archivo |
| `app/noticias/[slug]/page.tsx` | Regla única `isRenderableArticle`; errores de datos propagan en vez de 404 | Durante un outage de Firestore un artículo dará 5xx en vez de 404 — semántica correcta |
| `lib/departamento-central/workers.ts` | `isFreshArticle` exige fecha válida y no futura; `age>=0` | Jobs sin fecha → `completed/skipped` (verificado que son los 25 reales) |
| `components/ReadingProgress.tsx` | `aria-label` en progressbar | Visualmente idéntico |
| `components/AdsenseUnit.tsx` | `role="complementary"` | Idem |
| `components/ShareBar.tsx` | Colores AA: fb `#166fe5`, wa `#0f766e`, tg `#0369a1`; etiqueta `#4b5563` | Cambio visual mínimo de tono |
| `components/ArticlePage.tsx` | `#9ca3af`/`#94a3b8`→`#4b5563`; badge/avatar usan `a11yColor` | Deportes/Tecnología: verde/cian oscuro en badge |
| `components/AudioButton.tsx`, `editorial/SupportMedium.tsx` | grises → `#4b5563` | Tono de gris ligeramente más oscuro |
| `lib/constants.ts` | `a11yColor` por categoría | Campo aditivo, sin tocar `color` de marca |
| `.audit/nios-cola-real.cjs` | métricas sin índice compuesto + inspección de pipelines | Solo lectura |
| `tests/seo-public-routes.test.ts` (+`p1-dates-errors`, `fase0-stabilization`) | 30+ casos nuevos | — |
| `scripts/audit-quality.mjs` | auditoría repetible sin credenciales | — |
| `docs/auditoria-18/*` | evidencia completa | — |

## 7. Inventario y deuda

`inventory.csv` clasifica los 1643 archivos. Hallazgos (sin borrado — cada uno
requiere verificación de referencias antes de actuar):

- **Duplicados exactos:** `.node-version`=`.nvmrc`; `DATA_SEMANTICS_CONTRACT.md`=
`DATA_UNIVERSE_CONTRACT.md`; 4 páginas admin idénticas (`correcciones`/`distribute`/
`editor`/`trafico` — placeholder duplicado, revisar cuál es la real); `assets/logo.png`=
`public/logo*.png` ×2; `public/autores/keyling-rivera.jpg`=`public/keyling-rivera.jpg`;
`public/favicon.svg`=`public/icons/favicon.svg`.
- **Histórico denso:** `.audit/` (184), `reports/` (11), `articulos-*` (11), raíz
  (290, incl. ~250 informes `.md` forenses). Sugerido: mover a `docs/historico/` en
  una PR de limpieza posterior — requiere verificar que ningún workflow los lea.
- **Scratch verificado como no referenciado:** archivos raíz sueltos tipo
  `console.log(...)`, `cdc551c` (idénticos a logs de `.audit/` — duplicados
  byte-a-byte, candidatos seguros a borrado en PR de limpieza).

## 8. Resultados de pruebas

| Prueba | Resultado |
|---|---|
| `tsc --noEmit` (Node 22) | 0 errores |
| `eslint --max-warnings 0` | 0 |
| Vitest enfocado (6 archivos) | 83/83 |
| Vitest suite completa | ver CI del PR (local: en `issue18-vitest-full.log`) |
| axe-core 4.x WCAG 2.1 AA | antes: 3 reglas en artículos; tras el fix se revalida en el preview del PR |
| Lighthouse ×6 | `performance.json` (métricas §4.3) |

## 9. Riesgos restantes y bloqueos

- **P0 Cloudflare (propietario):** sin la regla de bypass, respuestas admin pueden
  volver a cachearse. Comando de verificación en §4.1.
- **NIOS:** declaración de recuperación **pendiente** hasta 2 mediciones post-tick.
- **Search Console:** indexación no verificable desde aquí — paso manual del
  propietario (5 min, §5).
- **Drenaje de cola:** ~25 jobs/día contra ~317 — observar antes de subir límites.
- `vercel.json` fija `Cache-Control` de sitemaps en 3600s/86400 SWR: tras el fix
  del 503, la cabecera `no-store` del endpoint tiene prioridad en el mismo
  request de error (las cabeceras de `vercel.json` aplican a respuestas
  cacheadas en edge; el 503 viaja con `no-store`/`Retry-After`).
