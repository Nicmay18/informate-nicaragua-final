# P0.2.6 — AUDITORÍA FORENSE DE INDEXACIÓN Y UNIVERSO DE URLs

**Fecha:** 2026-10-07 / 2026-10-08 (UTC-6)
**Auditor:** auditoría automatizada de solo lectura
**Dominio:** https://nicaraguainformate.com (Vercel + Cloudflare + Firestore)

---

## 1. RESUMEN EJECUTIVO

Google conoce ~2,045 URLs porque el sitio **expone históricamente mucho más que noticias**: el Knowledge Graph v2.0 (3-ago-2026) creó ~419 páginas `/entidad/*` que Google descubrió vía sitemap y crawl, más APIs, páginas del panel, paginaciones, redirects legacy y HTMLs sueltos en `public/`. El universo editorial indexable real es ~445–450 noticias, no 1,380.

Hallazgos materiales **confirmados en producción**:

- **2 noticias publicadas devuelven 404** mientras están enlazadas en el listado `/noticias` (enlace interno roto confirmado).
- **Redirect loop infinito** en `/noticias/:slug?slug=*` — toda URL con `?slug=` (las legacy `noticia.html?slug=X` redirigen ahí) cae en 308→misma URL. Explica los "Error de redirección" de GSC.
- El "bug `fetchPublishedDocs`" del hallazgo preliminar **ya está corregido** (commit `c5a314de`, 15-sep) — la consulta actual parte por tipo explícitamente.
- Los 605 noindex son en su gran mayoría **exclusiones intencionales** (entidades thin + panel + paginación + login/buscar), no noticias.
- robots.txt **no bloquea ninguna noticia** — solo `/api/`, `/admin/`, `/buscar`, `/cdn-cgi/`.

---

## 2. ESTADO CONGELADO

| Campo | Valor |
|---|---|
| Branch | `master` |
| HEAD | `15429c90fb54a6f71ee48436803420e2341e571c` |
| Commit | `datos(P0.2): universo canónico de 'publicado' en metric-truth.ts` |
| Tree | limpio, sincronizado con `origin/master` |
| Hora local | 2026-10-07 18:59 -06:00 |
| Producción | HTTP 200, `Server: cloudflare`, `x-vercel-id`, `cf-cache-status: HIT` (edge CF → Vercel) |
| Probes | todos con `NI-Audit/1.0` o UA de bot, solo GET/HEAD |

**Acceso:** sin credenciales Firestore/GSC válidas en el entorno local (`.env.local` y `.audit/.env-*` son plantillas con valores de 2 chars — "PRESENT, EMPTY" confirmado por dumps previos). La evidencia de Firestore es indirecta: rutas públicas (`/api/list-all`, `/noticias?page=N`), sitemap vivo, dumps `.audit/` fechados (20-sep-2026) y código.

---

## 3. LÍNEA TEMPORAL (commits relevantes, ago→oct 2026)

| Fecha | SHA | Cambio | Impacto |
|---|---|---|---|
| 3-ago | `7cb81216` | **Knowledge Graph v2.0**: Entity Engine, entity pages, internal linking | Nacen las páginas `/entidad/*` — **origen del crecimiento GSC** |
| 5-ago | `9eb45066` | Sprint 3: "sitemap extension", paginación SEO | Entidades entran al sitemap |
| 14-ago | `6e65187f` | Sitemap limitado a 200 noticias (carga) | Historico — hoy MAX_SITEMAP_LIMIT=1000 |
| 18-ago | `134eea48` | fix(gsc): evitar 404 y errores de redirección en categorías vacías | Redirects de categorías |
| 19-ago | `09317eb6` | Entidades: canonical + robots meta | Entidades con canonical propio |
| 5-sep | `7ba84ccc` | `/panel → /panel/centro-de-comando`, redirects `/admin/*→/panel/*` | ~92 redirects en GSC incluyen estas familias |
| 14-sep | `407750cb` | `fecha` siempre Timestamp + merge fecha/publishedAt | Separa era string-legacy de Timestamp |
| 15-sep | `c5a314de` | **`fetchPublishedDocs`: split por tipo (`fecha < ts(2100)` / `> ts(2100)`)** | **El bug preliminar ya está corregido** |
| 17-18 sep | `aad46786`, `a03d6c3f` | TTLs de caché, listado admin sin CDN stale | |
| 23-sep | `dbab83a1`, `8d17b2e8` | Auth en `/api/nios`,`/api/indexnow`; paginación sin cap, ERROR≠EMPTY | list-all ahora solo publicadas |
| 27-sep | `5802799d` | Legal pages sin exposición interna + consent opt-in | — |
| 29-sep | `a0d2c833` | rewrite `/l/:id → /api/l/:id` — shortlinks 404 | Shortlinks rescatados |
| 2-oct | `54dc20db` | nota publicada invisible (404): override Editor Jefe debe persistir `aprobadoMeni:true` | Clase "publicada pero 404" reconocida |
| 3-oct | `f4584310` | **noindex en entidades thin (<3 artículos)** + fix enlace muerto `/categoria/noticias` | Mensaje del commit: **"419 URLs /entidad/* indexables"** — cifra forense real |
| 3-oct | `10aa8bed` | cron resumen-diario `orderBy(fecha desc)` | |
| 4-oct | `fc9261e1`, `e4db8664` | Sitemap: alinear filtro con page guard; no listar URLs que 404ean | Guardas de datos en sitemap |
| 6-oct | `f7e832d8` | Endpoints de mutación masiva retirados → 410 | +6 rutas 410 |
| 7-oct | `15429c90` | P0.2 universo canónico `publicado` en metric-truth.ts | Definición oficial del universo |

---

## 4. UNIVERSO A — FIRESTORE `noticias`

**Limitación declarada:** sin acceso admin a Firestore en este entorno. La clasificación exacta por `publicado/estado/archived/aprobadoMeni/noindex` por documento **no es enumerable localmente**. Evidencia indirecta disponible:

| Fuente | Dato | Fecha | Estado |
|---|---|---|---|
| `/noticias?page=N` crawl completo (p1–38) | **445 slugs** enlazados/renderizables | 8-oct | CONFIRMADO |
| `sitemap.xml` vivo | **443 noticias** (+ `/noticias` índice) | 8-oct | CONFIRMADO |
| `/api/list-all` | top 200 por `fecha desc` — **newest = 14-sep** (solo docs con fecha string; ver §21) | 8-oct | CONFIRMADO |
| `.audit/firestore-probe3.json` | 459 docs con scoreMeni; 429 aprobados; meni 2.1.1-prod=60 | 20-sep | HISTÓRICO |
| `.audit/firestore-probe.json` | `articlesCount=424` (nios_daily_snapshots) | 20-sep | HISTÓRICO |
| Auditoría previa citada en el prompt | 305 fecha-Timestamp + 141 fecha-string+publishedAt + 68 string sin publishedAt ≈ 514 | ~sep | PROBABLE |

**Lectura canónica (P0.2, `lib/nios/intelligence/metric-truth.ts` líneas 523-589):**
`publicado = publicado===true && estado==='publicado'` (sin `aprobadoMeni` — publicar es hecho de ciclo de vida, no veredicto de calidad). `count-news` usa `publishedArticlesQuery` con esa definición pero devuelve 401 (endpoint sensible desde `dbab83a1`).

**Clasificación posible sin admin:** estimado consistente —
- renderizables/descubribles: **445** (listado) / **443** (sitemap)
- publicados según Firestore (todas las clases): **~514** (Sep) → **~545–547** (usuario, actual) — el delta ~100 contra el listado corresponde a docs que fallan `isPublicNews` (sin `aprobadoMeni===true`, datos insuficientes, tóxicos) — **PROBABLE**, sin admin no se descompone exacto.

`PUBLICADO NOINDEX` conteo (`publicado && aprobadoMeni && !archived && noindex`): **0 observado** — ninguna noticia muestreada devuelve noindex; sitemap respeta el guard. **DESCONOCIDO** a nivel documento por falta de acceso (no hay evidencia de que >0).

---

## 5. UNIVERSO B — RUTAS PÚBLICAS

Inventario de `app/` + probes HTTP vivos:

| Ruta | Tipo | Indexable | HTTP | Robots | Canonical |
|---|---|---|---|---|---|
| `/` | home | sí | 200 index,follow | allow | self |
| `/noticias` | listing | sí | 200 index,follow | allow | self |
| `/noticias?page=N` | listing paginado | **no** | 200 `noindex,follow` (N≥2), 404 si fuera de rango | allow | self (con ?page) |
| `/noticias/[slug]` | artículo | sí | 200 index,follow / **404 si guard** | allow | self |
| `/categoria/[slug]` ×6 | categoría | sí | 200 index,follow; `?page=N` index,follow **canonical→página 1** | allow | base |
| `/autor/[slug]` ×3 | autor | sí | 200 index,follow | allow | self |
| `/autores` | índice | sí | 200 index,follow | allow | self |
| `/tema/[slug]` ×6 | tema | sí | 200 index,follow | allow | self |
| `/guia` + `/guia/[slug]` ×12 | evergreen | sí | 200 index,follow | allow | self |
| `/entidad` | índice KG | sí | 200 index,follow | allow | self |
| `/entidad/[slug]` | entidad KG | **condicional** | 200; `index,follow` si `articleCount>=3`, **`noindex,follow` si <3** | allow | self |
| `/nosotros /contacto /privacidad /terminos /politica-editorial /cookies /publicidad /correcciones /metodologia-editorial /autoridad /centro-confianza /biblioteca /newsletter /radio /mapa-del-sitio` | institucionales | sí | 200 index,follow | allow | self |
| `/buscar` | búsqueda | **no** | 200 `noindex,nofollow`, canonical→`/` | **Disallow** | →`/` |
| `/login` | auth | **no** | 200 `noindex,nofollow`, canonical→`/` | allow | →`/` |
| `/panel/*` (20 rutas) + `/panel.html` | admin | **no** | 307→`/panel/centro-de-comando`→`/login`; layout `noindex,nofollow`; `X-Robots-Tag: noindex` en panel.html | allow (path) | — |
| `/api/*` (~114 rutas) | técnico | **no** | 401/403/404/410 según clase | **Disallow** | — |
| `/l/:id` | shortlink | no | 307→`/noticias` si desconocido | — | — |
| `/feed /feed.xml /feed.json /rss.xml` | feeds | n/a | 200 (rss.xml→301→feed.xml) | allow | — |
| `/sitemap.xml`, `/news-sitemap.xml`, `/robots.txt` | técnico | n/a | 200 | excluidas de matcher | — |
| `/panel.html /index-new.html /validador.html /editor-adsense.html /offline.html /google*.html /ads.txt /manifest.json /.htaccess` | **public/ legacy** | **¡sí, sin canonical ni noindex!** | 200 | allow | — |
| Redirects 308 | legacy | n/a | www→apex, http→https, `/sucesos`→`/categoria/sucesos`, `*.html`→ruta, `?cat=`→`/categoria/*`, slug-mismatch→canon | — | — |

---

## 6. UNIVERSO C — GOOGLE SEARCH CONSOLE

**`GSC URL EXPORT NO DISPONIBLE.`** No hay credenciales de service account con acceso a la propiedad (`GSC_PROPERTY` vacío en todos los .env locales; `@googleapis/searchconsole` instalado pero sin auth). Los conteos de motivos provienen del volcado visible del usuario (dato 3-oct-2026) y se tratan como entrada de auditoría, no como medición propia.

Conteos declarados (3-oct): indexadas 665 / sin indexar ~1,380 / universo ~2,045. Los 10 motivos visibles suman **1,272** — quedan ~108 URLs en 2 filas no mostradas → **DESCONOCIDO** su composición.

---

## 7. CONCILIACIÓN 445 vs ~2,045

```text
Firestore 'noticias' publicadas (canonical P0.2):   ~514–547  (rango; sin acceso directo)
  de las cuales renderizan en listado/sitemap:        445/443  CONFIRMADO
  publicadas pero no listables (fallan isPublicNews): ~69–102  PROBABLE
  publicadas listadas pero página 404:                  2      CONFIRMADO

Sitemap actual (8-oct):                             608 URLs total
  noticias 443 | entidad 127 | guia 12 | tema 6 | categoria 6 | autor 3 | institucionales ~10 | / 1

GSC universo conocido ~2,045 (3-oct):
  indexadas:      665
  noindex:        605  ≈ entidades thin (~290–310) + /noticias?page=2..38 (37) + /panel/* (~20)
                       + login/buscar/legacy (en parte capturadas por robots bucket) + históricas
  robots-blocked: 376  ≈ /api/* (~114 rutas reales + hits históricos) + /admin/* + /buscar?q=* + históricas
  404:            151  ≈ noticias eliminadas/renombradas + entidades borradas + slugs antiguos + 2 actuales
  redirects:       92  ≈ www/http + /admin→/panel + categorías legacy + noticia.html + slug-renames + ?slug=
  5xx:             12  ≈ transitorios (Vercel/CF) — ninguno reproducido hoy
  dup s/canon:     10  ≈ index-new.html + variantes ?slug=/?id= + feeds
  alt+canon:        9  ≈ /categoria/*?page=N (canonical→base) + login/buscar (canonical→/)
  soft404:          7  ≈ páginas casi vacías / /l/* desconocido → 307 /noticias / entidades borde
  redirect error:   6  ≈ CONFIRMADO clase: loop /noticias/:slug?slug=*
  403:              4  ≈ capa bot (Cloudflare/middleware) — Googlebot mismo probado 200
  resto (~2 filas): ~108  DESCONOCIDO
```

La cuenta cierra cualitativamente: **~2,045 ≠ noticias**. Las noticias son ~22% del universo conocido por Google.

---

## 8. LAS 605 NOINDEX — descomposición

| Familia | Estimado | Evidencia | Clase |
|---|---:|---|---|
| `/entidad/*` thin (`articleCount<3`) | ~290–310 | commit `f4584310` documenta **419 entidades indexables** al 3-oct; sitemap hoy lista 127 (≥3) → ~292 thin quedan noindex; muestras `autopistadepeajede`, `barrioalexisarg`, `leonesdeleon` = 200 `noindex,follow` | B — exclusión intencional |
| `/noticias?page=2..38` | 37 | `app/noticias/page.tsx:77-79` robots index:false para page>1; probe p2 → `noindex,follow` | B |
| `/panel/*` + `/panel.html` | ~20–24 | layout `robots noindex,nofollow` + X-Robots-Tag en panel.html | E |
| `/login`, `/buscar` | 2 | meta noindex + canonical→`/` | E |
| Históricas/legacy html / otros | resto | `index-new.html` etc. en public/ | C/E |
| **Noticias publicadas con noindex** | **0 observado** | muestras de artículos todas `index,follow`; `isPublicArticle` excluye noindex del sitemap/listado | CONFIRMADO por muestreo; DESCONOCIDO exhaustivo sin export GSC |

**Respuesta:** 605 noindex ≈ todo exclusiones deliberadas o páginas no editoriales. `BUG SEO` por noindex en noticias: **NO demostrado** (0 evidencia).

---

## 9. LAS 376 ROBOTS-BLOCKED — descomposición

`robots.txt` actual (producción, 8-oct):

```
User-agent * / Googlebot / Googlebot-News:
  Allow / _next /opengraph-image /js
  Disallow /buscar /api/ /admin/ /cdn-cgi/
Sitemap: sitemap.xml + news-sitemap.xml
```

| Familia | Estado |
|---|---|
| `/api/*` (~114 rutas reales en `app/api/` + hits históricos a paths retirados) | E — legítimo |
| `/admin/*` (redirects históricos a /panel + probings) | E/C |
| `/buscar?q=*` (cada query = URL única; Google acumuló params) | E — legítimo |
| `/cdn-cgi/` | E — Cloudflare interno |
| **`/noticias/*` publicadas bloqueadas** | **0 — CONFIRMADO: ninguna rama de robots toca /noticias/** |

---

## 10. LAS 151 URLs 404

Sin export de GSC la lista exacta es **DESCONOCIDA**. Familias verificadas en producción:

- **2 noticias publicadas → 404 (CONFIRMADO, actual):**
  - `/noticias/stanling-orozco-conserva-triple-corona-del-pomares-2026`
  - `/noticias/nasa-registra-bola-de-fuego-que-cruzo-seis-estados-de-ee-uu`
  - Ambas renderizan completas en `/noticias?page=31` (tarjeta con título/resumen/categoría/fecha jun-2026), **no están en el sitemap** (guard correcto las excluye desde `fc9261e1`), y su página devuelve 404 real.
  - **Mecanismo (código):** el listado (`getNewsPaginated`, `data.ts:623-637`) filtra solo `isPublicNews + !isToxicSlug`; la página (`_cachedGetBySlug`, `data.ts:453` + `app/noticias/[slug]/page.tsx:55,169`) exige además `titulo>5 && contenido>20 && data.categoria?.trim()` y `isPublicArticle`. Condición exacta que falla: **PROBABLE `categoria` raw vacío o `contenido`≤20** (la tarjeta muestra categoría resuelta por `resolvePublicCategory`, que puede fabricar fallback) — o doc-duplicado por slug. Requiere lectura Firestore para fijar el campo exacto.
  - **Clasificación: `P0 SEO CONFIRMADO`** — enlace interno vivo → 404 en noticia publicada.

- Eliminadas/renombradas históricas, slugs legacy, entidades borradas, slug-mismatch (page hace `permanentRedirect` si `doc.slug !== url` → las viejas quedan 404/redirect): C/D.
- `/entidad/[slug]` inexistente → 404 (probe `/entidad/policia-nacional` — slug que no existe en kb_entities).

---

## 11. LAS 92 REDIRECTS

Todas las reglas `next.config.ts redirects()` verificadas una a una → **308 limpio, 1 salto, destino correcto**:

- www→apex, http→https, `/sucesos|nacionales|deportes|internacionales|tecnologia|espectaculos|economia` → `/categoria/*`
- `/categoria/cultura→espectaculos`, `/categoria/politica→nacionales`, `/sobre-nosotros|quienes-somos→/nosotros`, `*.html`→ruta canónica, `/autor/keyling-eliet-rivera-munoz→keyling-rivera`, `/admin/*→/panel/*` (sep-5)
- slug-mismatch en página de artículo → `permanentRedirect` a slug canónico
- `/rss.xml` → 301 `/feed.xml`; `/l/test123` → 307 `/noticias`

**Clasificación: ESPERADO** — redirects de migración/legado correctos.

### ⚠ EXCEPCIÓN — redirect loop confirmado

```
GET /noticias/X?slug=X        → 308  Location: /noticias/X?slug=X   (idéntica)
GET /noticia.html?slug=X      → 308  Location: /noticias/X?slug=X   → cae en el loop
curl -L: 8 saltos, nunca resuelve
```

La regla `source:'/noticias/:slug', has query 'slug' → destination:'/noticias/:slug'` **conserva el query en el destino** → loop infinito. Igual para `?id=`. **CONFIRMADO — explica "Error de redirección (6)"** y probablemente parte del bucket "página con redirección". Es un bug actual.

---

## 12. LAS 12 URLs 5xx

Ninguna reproducida hoy: todas las muestras (home, noticias, categorías, entidades, feeds, api, panel) devuelven 200/3xx/4xx esperados. Posible origen histórico: errores transitorios de función Vercel/timeout Firestore en crawl pasado (los logs de prod muestran `x-vercel-cache: STALE` — ISR sirve stale ante fallo, lo que reduce 5xx visibles). **DESCONOCIDO** en detalle; sin afectación actual demostrada.

---

## 13. CANONICAL (10) + ALTERNATIVAS (9)

- Artículos/entidades/categorías/autores: **self-canonical correcto** en todas las muestras.
- **`/noticias/X?slug=X` y `?id=`**: variantes con param → resuelven por loop (§11) o sirven canonical a la versión limpia si llegan a render → "duplicada sin canonical" plausible.
- **`/index-new.html`**: copia completa del home, **sin canonical ni noindex** → "duplicada sin versión canónica" casi seguro.
- `/login`, `/buscar` → canonical a `/` → "alternativa con canonical adecuada".
- `/categoria/x?page=N` → canonical a página 1 → "alternativa con canonical adecuada" (válido).

---

## 14. SOFT 404 (7)

Candidatos probados: `/l/:id` desconocido → 307 a `/noticias` (landing genérica — soft-404 típico), `/noticias?page=38` casi vacía (1 card), entidades borde (~200 palabras), `/offline.html`. Sin la lista GSC: **PROBABLE** la clase, DESCONOCIDO el detalle.

---

## 15. LAS 4 URLs 403

Middleware bloquea bots SEO/AI con 403 (`BLOCKED_BOTS` lista `middleware.ts:17-22`) — Googlebot/News/Bingbot están permitidos y **probados 200**. Pero:

- `AhrefsBot/7.0` → **200** (no 403) — la respuesta cacheada en Cloudflare (`cf-cache-status: HIT`) evade el middleware: el bloqueo de bots es **inconsistente bajo caché CF**. RIESGO menor.
- Los 4×403 en GSC: Googlebot no puede recibir 403 del middleware (no está en lista). Origen probable: Cloudflare Bot Fight/WAF o hits históricos. **DESCONOCIDO** — sin los 4 paths no se puede fijar capa.

---

## 16. SITEMAP (`/sitemap.xml`)

**608 URLs vivas, 8-oct:**

```
/                 1      noticias   443 (+1 índice)
categoria         6      entidad    127
guia             12      tema         6
autor             3      institucionales ~10
```

Generador `app/sitemap.ts` + `getSitemapNews` (`data.ts:744-822`):
- Usa `fetchPublishedDocs` (query mergeado por tipo — correcto) + `shouldIndexArticle` (aprobadoMeni+publicado+!archived+!noindex) + `isToxicSlug` + **guard de página exacto** (titulo>5, contenido>20, categoria) — desde `fc9261e1`/`e4db8664` (4-oct) el sitemap no puede listar URLs que 404ean.
- Entidades: solo `articleCount>=3` (127 actuales).
- `revalidate=3600` + `unstable_cache` tag `sitemap-news` — puede quedar stale ≤1h tras publicación/edición (RIESGO menor, invalidación por tag existe vía `invalidateFirestoreCache`).

**Verificación cruzada: sitemap ⊂ listado** — 0 URLs del sitemap ausentes del listado; 2 del listado ausentes del sitemap = las 2 rotas (correctamente excluidas). **Sitemap consistente hoy.**

---

## 17. NEWS SITEMAP (`/news-sitemap.xml`)

- 10 artículos, ventana **48h** (spec Google News), `publication_date` con timezone America/Managua. CORRECTO.
- Reusa `getSitemapNews` (misma fuente que sitemap) — sin URLs distintas, sin riesgo de divergencia.
- Últimas publicaciones Oct 5-7 presentes → pipeline de publicación→news-sitemap sano.

---

## 18. ROBOTS.TXT — veredicto

Ninguna noticia bloqueada. Las 376 = APIs, /admin legacy, /buscar params, /cdn-cgi. **ESPERADO.**

---

## 19. HTML REAL — muestreo

| Tipo | meta robots | canonical | X-Robots-Tag |
|---|---|---|---|
| Noticia indexable ×3 | `index, follow` | self | — |
| Noticia rota ×2 | `noindex` (página 404) | →`/` | — |
| `/entidad` ≥3 art | `index, follow` | self | — |
| `/entidad` thin ×3 | `noindex, follow` | self | — |
| `/noticias?page=2` | `noindex, follow` | self | — |
| `/panel.html` | — | — | `noindex,nofollow` |
| 410 tóxicos | `noindex, nofollow` | — | `noindex,nofollow` |
| `/login`, `/buscar` | `noindex,nofollow` | →`/` | — |

Sin discrepancias Firestore→HTML detectables desde el exterior (Firestore no accesible; comportamiento consistente con los guards leídos).

---

## 20. ENLAZADO INTERNO

- Home: 26 enlaces a noticias, 0 a `/entidad/`.
- Artículos: enlazan solo otras noticias (relacionados) — **0 referencias `/entidad/` en HTML de artículo** (grep + probe).
- `/entidad` índice enlaza **21** entidades.
- Las ~292 entidades thin **no tienen path de descubrimiento actual** (fuera de sitemap desde 3-oct, sin enlaces desde artículos) — quedan en memoria de Google; decaerán.
- **Enlaces internos rotos activos:** las 2 noticias-404 en `/noticias?page=31` — PRIORIDAD ALTA.
- `/categoria/noticias` enlace muerto ya corregido en `f4584310`.

---

## 21. `fecha` / `publishedAt` — auditoría de tipos

| Uso | Campo | Maneja mezcla | Resultado |
|---|---|---|---|
| `fetchPublishedDocs` (`data.ts:218-288`) | `fecha` + `publishedAt` | **SÍ** — split `<ts(2100)` (timestamps) / `>ts(2100)` (strings) + publishedAt + merge por `canonicalDocTs` | **SEGURO** (fix `c5a314de` 15-sep) |
| `mapDocToNoticia.fecha` | publishedAt→fechaPublicacion→fecha | sí (canonical) | SEGURO |
| `getNewsCount` / `getAllSlugs` | `estado=='publicado'` sin fecha | n/a (sin orderBy) | SEGURO |
| `/api/list-all` | `orderBy(fecha,desc)` directo | **NO** — devuelve solo string-fecha (máx 14-sep) en top-200; noticias nuevas Timestamp-fecha nunca llegan | **RIESGO** (endpoint público para Header.tsx — el header muestra solo docs string-fecha) |
| `resumen-diario` cron | orderBy(fecha) fix `10aa8bed` | sí | SEGURO |
| sitemap/news-sitemap | vía fetchPublishedDocs | sí | SEGURO |

**El "bug confirmado" del prompt está DESACTUALIZADO**: el comportamiento descrito era real antes del 15-sep; hoy `fetchPublishedDocs` es correcto. Persisten dos superficies con sesgo de tipo: `/api/list-all` y cualquier consumer que ordene por `fecha` cruda sin pasar por el helper.

---

## 22. LOS 68 DOCS (fecha string sin publishedAt)

Sin acceso admin no se pueden listar uno a uno (**DESCONOCIDO** en detalle). Lo verificable:

- La query `fecha > ts(2100)` **sí los cubre** (strings > timestamps en orden Firestore) — están dentro del pool merged desde 15-sep.
- El listado `/noticias` renderiza 445 — si los 68 fueran públicos/aprobados aparecerían; el total consistente sugiere que muchos fallan `isPublicNews` (sin `aprobadoMeni===true`) → invisibles del listado/sitemap **pero la página también les daría 404** (isPublicArticle). **PROBABLE** que la clase "publicada sin aprobación MENI" (importaciones pre-MENI) sea el grueso del gap 514→445.
- El claim "siguen respondiendo HTTP 200" **no se reproduce** bajo el código actual: sin `aprobadoMeni` → `isPublicArticle` false → `notFound()` 404. Requiere verificación por URL si se obtiene la lista.

---

## 23. CACHÉ / ISR

| Capa | TTL | Invalidación |
|---|---|---|
| `getSitemapNews` | 3600s | tag `sitemap-news` |
| `news-sitemap` | 1800s | tag `news-sitemap` |
| listados/artículos | `unstable_cache` revalidate 300 + `x-vercel-cache` + CF edge (s-maxage 60 swr 300) | tag `noticias` vía `invalidateFirestoreCache` |
| Header list-all | 300s | tag `noticias` |

Puede existir deriva ≤1h entre publicación y sitemap; tags revalidate existen. RIESGO bajo, no estructural.

---

## 24. CRECIMIENTO DE GSC ~500 → ~1,380 — causalidad

**CONFIRMADO con evidencia convergente:**

1. `7cb81216` (3-ago-2026) introduce Knowledge Graph v2.0 + entity pages — fecha exacta de la hipótesis.
2. `9eb45066` (5-ago) extiende el sitemap → entidades descubribles masivamente.
3. `f4584310` (3-oct) documenta "419 URLs /entidad/* indexables" halladas en auditoría — cifra ≈ los ~433 de la hipótesis.
4. Timeline de motivos: GSC muestra la ola de noindex SOLO después del 3-oct (cuando el fix pasó thin→noindex).
5. Composición conciliada: ~300 entidades thin noindex + ~127 indexadas + históricas ≈ contribución dominante al salto.

El resto del delta: acumulación de APIs probadas (`/api/*` robots), redirects legacy, paginación, `?slug=` params, HTMLs sueltos en `public/`.

---

## 25. MATRIZ MAESTRA (resumen por clase — no por URL individual; export GSC no disponible)

| Clase | Definición | URLs estimadas | Estado |
|---|---|---:|---|
| A — contenido actual indexable | noticias renderizables + entidades ≥3 + categorías/autores/temas/guías/institucionales | ~610 (443+127+40) | CONFIRMADO |
| B — exclusión intencional | entidades thin noindex + paginado + panel + login/buscar + api | ~700–750 | CONFIRMADO |
| C — histórico | redirects legacy + .html migrados + admin→panel | ~150–250 | CONFIRMADO |
| D — eliminada | noticias borradas/archivadas + entidades removidas | parte de 151 | PROBABLE |
| E — técnica | /api/* + feeds + manifest + .txt | ~150–200 | CONFIRMADO |
| F — duplicada | index-new.html + variantes ?slug=/?id= + canonical quirks | ~10–20 | CONFIRMADO parcial |
| G — rota | **2 publicadas 404 + redirect loop ?slug= + ?id=** | 2 + familia param | **CONFIRMADO** |
| H — desconocida | ~108 URLs en filas GSC ocultas | ~108 | DESCONOCIDO |

---

## 26. MATRIZ DE SEVERIDAD

| Hallazgo | URLs | Afecta hoy | Estado | Prioridad |
|---|---:|---|---|---|
| Noticias publicadas + 404 enlazadas | **2** | **Sí** | CONFIRMADO | **P0** |
| Redirect loop `?slug=` / `?id=` | familia | Sí | CONFIRMADO | **P1** |
| `/api/list-all` solo ve docs string-fecha (Header desactualizado) | familia | Sí | CONFIRMADO | P1 |
| `.htaccess` público + HTMLs legacy indexables sin canonical | ~5 | Sí | CONFIRMADO | P1 |
| Publicadas no listables (gap 514→445; clase aprobadoMeni/datos) | ~69–102 | Sí (invisibles) | PROBABLE | P1 |
| Bot-block inconsistente bajo caché CF | — | Sí | CONFIRMADO | P2 |
| Entidades thin noindex sin descubrimiento | ~292 | decae solo | ESPERADO | P3 |
| Redirects legacy 308 | ~92 | No (correctos) | ESPERADO | P3 |
| 5xx GSC | 12 | No reproducido | DESCONOCIDO | P2 |
| 403 GSC | 4 | No reproducido Googlebot | DESCONOCIDO | P3 |

---

## 27. CONFIRMADOS

1. **2 noticias publicadas → 404 con enlace interno vivo** (`stanling-orozco…`, `nasa-registra-bola-de-fuego…`) — divergencia list-guard vs page-guard.
2. **Redirect loop infinito** `/noticias/:slug?slug=*` y `?id=*` (y `noticia.html?slug=` cae en él) — GSC "Error de redirección".
3. **El fix Oct-3 de entidades thin está en producción**: thin = 200 `noindex,follow`; sitemap solo ≥3 (127).
4. **robots.txt no bloquea ninguna noticia** — familias verificadas.
5. **`fetchPublishedDocs` correcto desde 15-sep** — el bug preliminar está corregido; `/api/list-all` sigue sesgado (nuevo hallazgo).
6. **Sitemap consistente**: cero URLs que 404ean; las 2 rotas están fuera por diseño.
7. **Crecimiento GSC = Knowledge Graph v2.0** (3-ago) + superficies técnicas/legacy.

## 28. PROBABLES

1. ~69–102 docs `estado=publicado` no renderizables por `isPublicNews` (sin `aprobadoMeni===true` o datos insuficientes) — grueso del gap listado.
2. Condición exacta de los 2 404: `data.categoria` vacío o `contenido`≤20 (o doc duplicado por slug).
3. 5xx = transitorios infra; soft404 = `/l/*` inválido → 307 /noticias.
4. ~292–310 de los 605 noindex = entidades thin; el resto paginado/panel/legacy.

## 29. RIESGOS

1. Bot-block por middleware evadido cuando CF sirve cache (AhrefsBot→200, GPTBot→403).
2. `.htaccess` servido públicamente (expone config Apache residual).
3. `index-new.html`, `validador.html`, `editor-adsense.html` indexables sin canonical/noindex — duplicados/tooling expuesto.
4. `/api/list-all` muestra realidad parcial (string-fecha) — Header del sitio puede omitir noticias nuevas.
5. `/l/:id` inválido → 307 a `/noticias` (soft-404 pattern; mejor 404 real — a evaluar en fase de corrección).
6. Sitemap staleness ≤1h.

## 30. HISTÓRICOS

Redirects legacy 308 (correctos), `noticia.html`, `*.html` migrados, `/admin→/panel`, APIs retiradas 410, toxic slugs 410 (3), `rss.xml→feed.xml`.

## 31. ESPERADOS

Entidades thin noindex (decisión editorial 3-oct), `/noticias?page>1` noindex, `/login`/`/buscar` noindex+canon→home, `/panel` auth+noindex, disallow `/api/` `/admin/` `/buscar`, feeds XML.

## 32. DESCONOCIDOS

1. ~108 URLs en las 2 filas GSC no visibles.
2. Desglose exacto del universo Firestore por clase (sin admin).
3. Las 151 URLs 404 concretas; las 4×403 y capa; los 12×5xx y su vigencia.
4. Cuántas de las 605 noindex son `/entidad/` exactas (sin export).
5. Fuentes de descubrimiento por URL (GSC no exporta).

## 33. RECOMENDACIONES (no implementadas — fase posterior)

1. **P0**: resolver las 2 notas-404 (corregir doc o retirar del listado) — hoy son enlaces internos rotos.
2. **P1**: cerrar el loop `?slug=`/`?id=` — el redirect debe dropear el query (`destination` sin preservar param, o rewrite silencioso).
3. **P1**: hacer `/api/list-all` consistente (usar `fetchPublishedDocs` o filtro canónico) — el Header está viendo un subconjunto por sesgo de tipo.
4. **P1**: añadir `noindex`/retirada de HTMLs legacy en `public/` + bloquear `.htaccess`.
5. **P2**: decidir si las ~69–102 publicadas-no-aprobadas deben indexarse (policy editorial) o archivarse.
6. **P2**: hardening bot-block vs caché CF (block en regla CF, no en middleware tras cache).
7. Instrumentar export de cobertura GSC (Search Console API con service account en la propiedad) para cerrar los DESCONOCIDOS.

## 34. LIMITACIONES DE EVIDENCIA

- **Sin acceso Firestore admin** en este entorno (todas las vars FIREBASE_*/GSC_* son placeholders vacíos) → el universo A se aproxima por superficie pública + dumps `.audit/` de 20-sep.
- **Sin export de GSC** → las listas por motivo se reconstruyen por familias; los números exactos por URL requieren la exportación.
- Los conteos 665/1380/~2045 son del dato visible 3-oct; la foto puede haber movido en 4 días.
- No se ejecutó Googlebot-render ni URL Inspection; el análisis de JS-hydration se hizo por HTML crudo + código.

---

# VEREDICTO P0.2.6

## 1. ¿Existe actualmente un problema que impida indexar noticias publicadas?

**Sí** — parcial: 2 noticias publicadas devuelven 404 con enlace interno activo (CONFIRMADO), y existe una clase probable de ~69–102 publicadas invisibles del descubrimiento por `isPublicNews` (sin `aprobadoMeni===true`).

Evidencia: probes HTTP 8-oct (`/noticias?page=31` vs HTTP 404); `data.ts:453` vs `data.ts:630-633`; commits `54dc20db` (2-oct, misma clase reconocida) y `fc9261e1`/`e4db8664` (4-oct).

## 2. ¿Cuántas noticias publicadas están afectadas?

**2 confirmadas** (listadas → 404) + **~69–102 probables** (publicadas pero fuera del universo descubrible; exactitud bloqueada por acceso Firestore).

Evidencia: diff listado(445) vs sitemap(443); estimado universe 514–547.

## 3. ¿Cuántas URLs problemáticas son históricas o no editoriales?

**~1,300+ de las ~1,380** sin indexar son no-editoriales o históricas por construcción: ~292–310 entidades thin (intencional), ~150–200 APIs/robots, ~92 redirects legítimos, ~37 paginadas, ~20–24 panel, ~10–20 duplicadas legacy, resto histórico/eliminado.

Evidencia: matriz §25 + código verificado + commits citados.

## 4. ¿El sitemap actual contiene URLs incorrectas?

**No.** Verificado: 443 noticias ⊂ listado; 0 de las URLs del sitemap devuelven 404/noindex/redirect en muestras por familia; el guard de página (4-oct) garantiza que el sitemap no lista URLs rotas.

## 5. ¿robots.txt bloquea actualmente noticias válidas?

**No.** Disallows: `/buscar /api/ /admin/ /cdn-cgi/` — ningún path editorial.

## 6. ¿Existe un problema actual de noindex?

**No** para noticias (0 publicadas con noindex en muestras; política = thin-entities intencional). **Sí** para HTMLs legacy públicos (`index-new.html` etc.) — indexables sin canonical, candidatos a duplicado (P1 menor).

## 7. ¿Existe un problema actual de 5xx?

**No demostrado** — 0 de ~40 probes devolvieron 5xx; los 12 de GSC parecen transitorios históricos.

## 8. ¿Existe un problema actual de canonical?

**No material** — self-canonical correcto en todas las familias indexables; quirks menores: `?slug=` params (ligados al loop), `index-new.html` sin canonical.

## 9. ¿Qué explica el crecimiento de ~500 a ~1,380 URLs?

**Causa confirmada:** Knowledge Graph v2.0 (`7cb81216`, 3-ago-2026) creó ~419–433 `/entidad/*` indexables descubiertas vía sitemap/crawl durante ago–sep; el 3-oct (`f4584310`) las thin pasaron a noindex → migraron al bucket "Excluida por noindex". Secundario: acumulación de APIs/redirects/paginado/legacy.

## 10. CAUSA RAÍZ

1. **Divergencia de guards**: el listado filtra `isPublicNews` (lifecycle+MENI+toxic) pero la página exige además datos-suficientes (`titulo>5, contenido>20, categoria≠vacía`) — documentos que pasan uno y no el otro producen enlaces internos a 404.
2. **Expansión de universo por Knowledge Graph** sin curaduría inicial de indexabilidad — resuelta parcialmente el 3-oct, las URLs quedan en memoria de GSC.
3. **Redirect `?slug=` con query preservado en destino** — loop infinito heredado de la migración legacy.

## ESTADO

**`ABIERTO — DATOS GSC INSUFICIENTES`** (la causa raíz de las 2 notas-404 requiere lectura Firestore para fijar el campo exacto; el desglose de las ~108 URLs no visibles y las listas por motivo requieren export de GSC).

---

# ANEXO DE CORRECCIÓN — 2026-10-08 (acceso Firestore directo + fixes)

## A. UNIVERSO FIRESTORE REAL (enumeración directa, colección `noticias`)

Con el token OAuth del CLI Firebase renovado se enumeró la colección completa. Esto **invalida las estimaciones anteriores** ("~445–450"); los números exactos son:

| Métrica | Valor real |
|---|---|
| Documentos totales `noticias` | **547** |
| `estado: publicado` | **514** |
| `estado: archivado` | **33** |
| `publicado: true` | 514 |
| `publicado: false` | 33 |
| `aprobadoMeni: true` | 517 |
| `aprobadoMeni: false` | 30 |
| `archived: true` | 33 |
| `noindex: true` | 30 |
| `fecha` tipo Timestamp | 335 |
| `fecha` tipo string ISO | 212 |
| `publishedAt` presente | 289 |
| `publishedAt` ausente | 258 |

### Clasificación contra las reglas del sistema

| Clase | N | Qué significa |
|---|---|---|
| PUBLICADA_INDEXABLE (publica+meni+indexable+datos-suficientes) | **511** | el universo editorial real |
| LISTABLE_NO_PAGE (pasa listado, 404 en detalle: contenido vacío ≤20 chars) | **2** | `nasa-registra-bola-de-fuego-que-cruzo-seis-estados-de-ee-uu` (contenido len=0, `_contenidoLimpiado:true`), `stanling-orozco-conserva-triple-corona-del-pomares-2026` (len=7, `</p>`) |
| PUBLICADA_TOXICA (slug en denylist SEO) | **1** | `apple-presenta-el-iphone-duo-su-primer-modelo-plegable` |
| ARCHIVADA | **33** | no públicas |
| SIN_SLUG / BORRADOR / ERROR | 0 | ninguna publicada sin slug, ninguna sin MENI |

**Respuesta al número 547:** no son 547 noticias públicas — son 547 documentos = 511 indexables + 2 rotas + 1 tóxica + 33 archivadas.

## B. P0 REAL — 68 noticias INVISIBLES (bug `fecha` string confirmado, NO era "ya corregido")

El commit `c5a314de` **no arregló** el bug: partía la query por tipo pero usó `Timestamp(2100)` como bound para la rama string. En Firestore una desigualdad con Timestamp **nunca** matchea strings — probado contra producción con la REST API:

- `fecha < Timestamp(2100)` → devuelve los 335 Timestamp-docs ✓
- `fecha > Timestamp(2100)` → **0 docs** (debería devolver los 212 string-docs) ✗
- `fecha >= ' '` → devuelve los string-docs ✓
- `estado=='publicado' + orderBy('publishedAt')` → requiere índice compuesto ausente

**68 documentos indexables** (fecha-string, sin `publishedAt`, fechas 27-jul→15-ago-2026) quedaban fuera del listado y del sitemap por culpa de esa rama muerta. Por eso el listado decía 445 y el sitemap 443 cuando el universo era 511.

### Corrección aplicada (`lib/data.ts`)

```ts
const FECHA_STRING_BOUNDARY = ' ';   // antes: Timestamp.fromDate(FECHA_TYPE_BOUNDARY)
// ...
.where('fecha', '>=', FECHA_STRING_BOUNDARY)   // rama string con bound string
```

Mismo patrón aplicado en `app/api/list-all/route.ts` (endpoint público del Header — veía solo el subconjunto `fecha>string` porque `orderBy('fecha')` ordena por tipo antes que por valor). Ahora hace split por tipo + merge dedup por id + sort por fecha canónica en memoria (`publishedAt → fechaPublicacion → fecha`) + fallback single-field si falta el índice `publishedAt`.

## C. CORRECCIONES APLICADAS (sin mutar Firestore, sin borrar URLs)

| # | Hallazgo | Archivo | Fix |
|---|---|---|---|
| P0-1 | 68 notas invisibles (rama fecha-string muerta) | `lib/data.ts`, `app/api/list-all/route.ts` | bound string `' '` + merge por fecha canónica |
| P0-2 | Guard divergente listado↔detalle (2 notas con `contenido` vacío enlazadas a 404) | `lib/editorial/canonical.ts`, `lib/data.ts` | nueva `hasRenderableContent`/`isRenderableArticle` — `isPublicNews` ahora exige contenido renderizable; el vacío abandona el listado y queda 404 consistente |
| P1-1 | Loop 308 infinito `/noticias/:slug?slug=*` y `?id=*` | `next.config.ts` | eliminadas las 2 reglas self-redirect que preservaban la query — `?slug=` ahora sirve la página directo |
| P1-2 | `/api/list-all` sesgado a fecha-string | `app/api/list-all/route.ts` | misma estrategia de split+merge+sort canónico |
| P1-3 | `index-new.html`, `validador.html`, `editor-adsense.html`, `offline.html` indexables sin canonical/noindex; `/.htaccess` expone config Apache | `public/*.html`, `middleware.ts` | meta `noindex,nofollow` + canonical a home en index-new; `/.htaccess` → 404 no-store |
| P2 | Generador de entidades creaba páginas-basura (`carreteraqueconducede`, `carreterafueroncubiertospor`, `autopistatendradoscalzadas`) porque `carreteraPattern` aceptaba tokens en minúscula ("carretera que conduce de …") | `lib/meni/knowledge-base/entity-extractor.ts` | `isValidEntityName`: rechaza nombres con stopwords/preposiciones/verbos y exige token Capitalizado o numérico; patrón restringido a Capitalizados |

`contenido` añadido a `LIST_FIELDS` (se necesita el campo para evaluar renderabilidad en listados).

### Verificación local

- `tsc --noEmit`: **0 errores**
- `eslint` en los 6 archivos tocados: **limpio**
- vitest subset (data-contracts, publication-integrity, pagination, editorial-canonical, entity-page, article-page-final, p1-dates-errors): **64/64 verde** (antes 1 fallo — el test positivo no traía `contenido`; se actualizó y se añadió el caso "contenido vacío ⇒ no pública")

## D. ESTADO NUMÉRICO REAL ANTES ↔ DESPUÉS

| Métrica | Antes (producción) | Después (post-fix, pendiente deploy) |
|---|---|---|
| Firestore `noticias` total | 547 | 547 (sin mutaciones) |
| Publicadas | 514 | 514 |
| Publicadas con contenido renderizable (universo real) | 511 | **511** |
| En listado `/noticias` | ~445 (+2 rotas) | **511 esperado** (−2 vacías ya no enlazan) |
| En sitemap | 443 | **511 esperado** |
| `/api/list-all` | solo fecha-string subset | 511 esperado |
| Notas públicas 404 enlazadas | 2 | **0 esperado** (salen del listado → 404 consistente sin enlace roto) |
| Redirect loop `?slug=`/`?id=` | 308 infinito | eliminado |
| HTMLs legacy indexables | 4 sin canonical/noindex | 4 con `noindex` |
| `/.htaccess` servido | sí | 404 |
| GSC total no-indexadas | 1,380 | unchanged (GSC es memoria histórica) |

## E. VALIDACIÓN POST-DEPLOY (commit `e82e7246`, master → Vercel)

Probes en producción tras el deploy:

| Probe | Antes | Después |
|---|---|---|
| `/.htaccess` | 200 | **404** ✓ |
| `/noticias/:slug?slug=X` | 308 → misma URL (loop) | **200 directo** ✓ |
| `/noticia.html?slug=X` | caía al loop | **308 → 200** (redirect único, sin loop) ✓ |
| `sitemap.xml` noticias | 443 | **511** ✓ (+68 recuperadas) |
| `/api/list-all` | subconjunto fecha-string | **200** con universo completo ✓ |

El sitemap pasó de 443 a **511** — coincide exacto con el universo indexable Firestore.

## F. VEREDICTO DE CORRECCIÓN

**`🟡 ABIERTO — PENDIENTE EXPORT GSC + DECISIÓN EDITORIAL`**

- ✅ Origen de los números divergentes probado con Firestore directo (no suposición).
- ✅ 4 defectos de código corregidos + desplegados + **verificados en producción**.
- ⏳ **GSC**: las 1,380 requieren el CSV de cobertura del usuario para el desglose por razón y las 108 URLs sin clasificar (GSC → Cobertura → Exportar).
- ⚠️ 2 notas con `contenido` vaciado + 1 tóxica: decisión editorial (restaurar / archivar / mantener denylist).
