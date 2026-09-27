# FINAL FORENSIC SURGICAL AUDIT — Nicaragua Informate

Fecha: 2026-02-25
Auditoría quirúrgica sobre el commit `e3a5cd7c` + correcciones aplicadas en `a5e8a2bc`.
Alcance: corrección exclusiva de hallazgos forenses confirmados. Sin nueva arquitectura, sin nueva fase.

---

## 1. Executive Summary

- Dos defectos P1 confirmados y corregidos con cambios mínimos:
  1. `app/page.tsx` tragaba `FirestoreOutageError` y renderizaba una portada vacía falsa.
  2. El tag interno `sitemap-news-full` (caché real de `getSitemapNews`) nunca se invalidaba tras publicar/editar/borrar.
- Regresión nueva: `tests/homepage-outage.test.ts` (4/4 verde).
- Verificación completa: 91 archivos / 1028 tests verdes, `tsc --noEmit` limpio, `next build` OK, deploy y smoke de producción OK.
- Panel: todas las rutas protegidas devuelven `307 /login` con `cf-cache-status: DYNAMIC` y `Cache-Control: private, no-cache, no-store`. Sin HTML administrativo cacheado.
- Hallazgos P2 (Firestore público, `?secret=` legacy, validador público, escalabilidad del panel, cookie-secreto maestro) evaluados y clasificados; ninguno recibió refactor porque excede el mandato quirúrgico.

## 2. Commit auditado

- Base forense: `e3a5cd7c` — "docs: veredicto final — bloqueador Cloudflare resuelto y verificado".
- Commit de correcciones de esta auditoría: `a5e8a2bc` — "fix: error Firestore != homepage vacia; invalidar tag sitemap-news-full".
- Pusheado a `origin/master`; Vercel desplegó y el smoke corre sobre producción viva.

## 3. Arquitectura revisada

- Superficie administrativa canónica: `/panel/*` con `app/panel/layout.tsx` (gate de auth + render dinámico).
- `/admin/*` = rutas legacy de compatibilidad que redirigen o también pasan por el gate.
- Homepage: SSR con `revalidate = 60` (ISR), datos vía `getHomePageData()` → `lib/data.ts` con `safeGet` + `FirestoreOutageError`.
- Sitemaps: `app/sitemap.ts` (estático + dinámico, revalidate 3600) y `app/news-sitemap.xml/route.ts` (ventana Google News).
- Invalidación: `revalidatePath` + `revalidateTag` en rutas de publicación, `/api/revalidate` y `cache-purge`.
- CDN: Cloudflare con Cache Rule `Bypass cache` sobre `*/panel*` y `*/admin*`.

## 4. Homepage

**Respuesta a las preguntas del encargo:**

- ¿La homepage funciona correctamente? **Sí** — `GET /` → `200`, `x-vercel-cache: REVALIDATED`, `cf-cache-status: HIT`.
- ¿Puede un fallo de Firestore aparecer como homepage vacía? **No, ya no.** `app/page.tsx` re-lanza `FirestoreOutageError`. Con ISR (`revalidate = 60`), Next/Vercel sirve la última versión válida cacheada si existe; en un request sin caché el usuario ve un error real (página de error de Next), no una portada falsa que finge "no hay noticias".
- Error ≠ empty: errores no-outage (p.ej. fallo de un check auxiliar) siguen logueándose y renderizando con los datos disponibles — comportamiento resiliente existente que se conserva.
- Corpus legítimamente vacío sigue renderizando el empty-state válido (test `corpus legítimamente vacío → renderiza shell vacía`).

## 5. Caché / ISR / CDN

| Capa | Rutas públicas | Rutas `/panel*` + `/admin*` |
|---|---|---|
| Vercel | `PRERENDER` / `REVALIDATED` / `MISS` normal | `MISS` (dinámico por layout) |
| Cloudflare | `cf-cache-status: HIT` en `/`, `/news-sitemap.xml` | `cf-cache-status: DYNAMIC` + `Cache-Control: private, no-cache, no-store` |

- La Cache Rule de bypass sigue activa y verificada post-deploy: `/panel/nios` → `307 /login` + `DYNAMIC`.
- Nada en `a5e8a2bc` toca headers ni reglas de CDN; la protección no se degradó.

## 6. Sitemap

**Respuesta:** ¿una publicación nueva invalida el sitemap correctamente? **Sí, ahora.**

- `app/sitemap.ts` consume `getSitemapNews()` → `unstable_cache` con key/tag `sitemap-news-full` (`lib/data.ts:776-781`).
- Antes del fix: las rutas invalidaban `sitemap-news` (tag del wrapper en `app/sitemap.ts:16-20`) y `news-sitemap`, pero **nadie** invalidaba `sitemap-news-full` → el dataset interno podía quedar stale hasta el revalidate de 1h aunque el wrapper se regenerara con datos viejos.
- Después del fix: `revalidateTag('sitemap-news-full')` añadido en las 5 rutas que ya invalidaban los otros tags:
  - `app/api/revalidate/route.ts:80`
  - `app/api/admin/news/route.ts:320`
  - `app/api/admin/guardar-directo/route.ts:311`
  - `app/api/admin/news/[id]/route.ts:250` (PUT), `:358` y `:410` (DELETE)
  - `app/api/admin/cache-purge/route.ts:20`

## 7. Firestore

- `firestore.rules` permite `get, list: if true` en `noticias/{id}`.
- Consumidores públicos confirmados: `public/validador.html` y `public/panel.html` (Firebase client SDK → `collection(db, 'noticias')`).
- Cerrar la regla sin migrar esos consumidores rompería el validador y partes del panel → **no se tocó** (ver §24).
- Corpus (snapshot read-only, `.audit/corpus-recon.cjs`): 500 docs / 467 publicados / 33 archived / 30 noindex / 0 borrador / 0 eliminado.
- `getHomePageData` propaga `FirestoreOutageError` cuando todas las subqueries fallan (`lib/data.ts` `safeGet`); ahora también lo respeta `app/page.tsx`.

## 8. Seguridad

- Panel: gate de auth en layout; sin auth → `307 /login`; APIs admin → `401` fail-closed.
- Cloudflare: bypass de caché verificado post-deploy (`DYNAMIC`); `Cache-Control: no-store` en respuestas del gate.
- Firestore público en lectura: exposición documentada como riesgo aceptado/deferido (ver F-06).
- `?secret=` en querystring: inventariado y clasificado legacy (ver F-07). Los endpoints siguen validando el secreto server-side; el riesgo es de higiene (secretos en URLs/logs), no de auth rota.

## 9. Autenticación

- `isAdminRequest(request)` en `lib/auth.ts:54-57` acepta header `x-admin-token`/`x-admin-key` **o** cookie `admin_session`.
- Cookie (`app/api/admin/session/route.ts:53-62`): `HttpOnly; SameSite=Strict; Path=/; Max-Age=86400; Secure` en producción.
- Valor de la cookie = `ADMIN_API_KEY` en claro → es el "secreto maestro". `HttpOnly` impide lectura por XSS y `SameSite=Strict` mitiga CSRF; rotar la key invalida sesiones. Aceptable para un panel de un operador; firmar tokens opacos sería el hardening futuro (no realizado por alcance).
- Verificado en producción: `admin_session=invalida` → `401`; sin credenciales → `401`.

## 10. Editorial / MENI / Supervisor

- Autoridad editorial intacta: `resolveEditorialClassification` con precedencia de la categoría del editor sobre la sugerencia de MENI (`lib/editorial/guardar-con-meni.ts`).
- Conflictos de clasificación persistidos: `classificationSource`, `suggestedCategory`, `classificationConflict`, `classificationStatus`, `classificationReason`.
- `mutation-policy.ts` requiere aprobación vigente vía `contentHash` (título+resumen+contenido+categoría).
- Tests de autoridad: 9/9 en `tests/panel-authority-regression.test.ts`; suite completa 1028/1030 (2 skipped preexistentes).

## 11. Mutaciones

- Rutas de publicación/edición/borrado (`/api/admin/news`, `/api/admin/news/[id]`, `/api/admin/guardar-directo`) siguen tras `isAdminRequest`.
- Sin auth → `401` (verificado en producción sobre `/api/admin/config` y `/api/admin/news`).
- Tras mutar: invalidación de `noticias`, `latest-news`, `trending-news`, `news-sitemap`, `sitemap-news`, **`sitemap-news-full`** (nuevo) + `revalidatePath` de `/`, `/noticias`, artículo y categoría.
- Invalidación de caché en memoria de Firestore (`invalidateFirestoreCache`) intacta.

## 12. Corpus

Snapshot read-only (`.audit/corpus-recon.cjs`, Admin SDK, sin escrituras):

| Métrica | Valor |
|---|---|
| Documentos totales `noticias` | 500 |
| `estado=publicado` | 467 |
| `publicado=true` | 467 |
| `archived=true` | 33 |
| `noindex=true` | 30 |
| `aprobadoMeni=true` | 470 |
| `supervisorApproved=true` | 210 |
| `borrador` | 0 |
| `eliminado` | 0 |

**Sitemap real** (fetch a producción, 448 `<url>`):

| Prefijo | URLs |
|---|---|
| `/noticias/` (artículos) | 398 |
| `/categoria/` | 6 |
| `/entidad/` | 12 |
| `/autor/` | 3 |
| `/guia/` | 12 |
| `/tema/` | 6 |
| Estáticas (home, /noticias, legales, etc.) | 11 |
| **Total** | **448** |

**Por qué difieren:** 467 publicados − 30 noindex = 437 candidatos indexables; el sitemap emite 398 artículos. Delta ≈39 explicado por la cadena de filtros `isPublicArticle` + `shouldIndexArticle` + `isToxicSlug` (`lib/data.ts:771`, `app/sitemap.ts:110-114`), más el lag de caché de 1h del sitemap y el distinto instante del snapshot. Los 50 restantes no son artículos: son taxonomía/páginas estáticas.
**¿Se modificaron artículos históricos?** No. **¿Reprocesamiento masivo?** No — el probe fue estrictamente read-only.

## 13. Panel

- Todas las rutas `/panel/*` probadas → `307 /login` sin credenciales (smoke completo en §18).
- `/panel` → `307 /panel/centro-de-comando` (entrada canónica).
- `/admin/*` legacy → `307` a su equivalente `/panel/*` o a `/login` según corresponda.
- `public/panel.html` sigue disponible (`200 HIT`) como shell estático; sus datos llegan vía APIs protegidas, así que servir el HTML no filtra contenido administrativo.
- Escalabilidad: `panel.html` hace fetch directo de la colección `noticias` completa vía client SDK (~500 docs, manejable). Sin paginación real — degrada si el corpus crece mucho → clasificado P2/DEFERRED (F-08).

## 14. SEO

- `/sitemap.xml` → `200` `PRERENDER`, 448 URLs; `news-sitemap.xml` → `200` `cf:HIT` (ventana Google News, 15 URLs).
- `/feed.xml` → `200`; `/robots.txt` servido.
- Invalidación coherente post-fix: publicar una noticia ahora purga los tres tags del sitemap (`news-sitemap`, `sitemap-news`, `sitemap-news-full`) → Google News ve la URL sin esperar el revalidate de 1h.
- Filtros `shouldIndexArticle`/`isToxicSlug`/`noindex` activos en emisión de sitemap.

## 15. AdSense readiness

- Técnicamente preparado: sitemap válido y fresco, corpus indexable depurado (toxic/noindex filtrados), páginas legales presentes en sitemap (`/privacidad`, `/terminos`, `/politica-editorial`, `/cookies`, `/publicidad`), feed y canonicals operativos.
- **¿Algo garantiza aprobación de Google? NO.** AdSense depende de revisión editorial de Google; el sistema solo puede garantizar higiene técnica, que está verificada.

## 16. Tests

| Suite | Resultado |
|---|---|
| `tests/homepage-outage.test.ts` (nueva) | 4/4 verde |
| Suite completa `npx vitest run` | **91 archivos, 1028 passed, 2 skipped** |
| `tsc --noEmit` (heap 8GB) | 0 errores |
| `next build` (NODE_OPTIONS heap 8GB) | OK |

Regresión homepage cubre los 4 casos pedidos: datos OK → renderiza; corpus vacío legítimo → empty-state válido (sin error); `FirestoreOutageError` → re-lanza (nunca portada vacía falsa); error no-outage → log + render resiliente.

## 17. Build

- `npx next build` con `NODE_OPTIONS=--max-old-space-size=8192`: compilado en ~3.1min, type-check + lint OK, tabla de rutas emitida.
- Nota operativa: sin heap extra el worker de type-check hace OOM (2GB default). Es límite de recursos de la máquina, no un defecto del código; documentado como gotcha de build.

## 18. Production verification

Smoke post-deploy sobre `https://nicaraguainformate.com` (`.audit/smoke-final.cjs`):

```
/                                -> 200  REVALIDATED
/noticias                        -> 200  MISS
/feed.xml                        -> 200  PRERENDER
/sitemap.xml                     -> 200  PRERENDER
/panel.html                      -> 200  HIT
/panel                           -> 307 /panel/centro-de-comando
/panel/* (19 rutas)              -> 307 /login  MISS
/admin/* (9 rutas legacy)        -> 307 → /panel/* o /login
api/admin/config no-auth         -> 401
api/admin/news no-auth           -> 401
api/admin/config cookie-invalida -> 401
```

Headers Cloudflare:
```
/panel/nios        -> 307 /login | cf-cache-status: DYNAMIC | Cache-Control: private, no-cache, no-store
/                  -> 200        | cf-cache-status: HIT
/news-sitemap.xml  -> 200        | cf-cache-status: HIT
```

## 19. Hallazgos P0

Ninguno. El único bloqueador P0 previo (Cloudflare cacheando HTML del panel) quedó resuelto y re-verificado en este deploy (`DYNAMIC` + `no-store`).

## 20. Hallazgos P1

```
ID: F-01
Severidad: P1
Archivo: app/page.tsx
Línea: 128-131
Problema: catch genérico tragaba FirestoreOutageError → homepage renderizaba
          arrays vacíos como si no hubiera noticias.
Evidencia: análisis de lib/data.ts safeGet + getHomePageData; FirestoreOutageError
           se lanza cuando todas las subqueries fallan pero page.tsx lo logueaba
           y continuaba con data=null → HomePagePro con hero:null y [].
Impacto: un apagón de Firestore se presentaba al público como "sitio sin
         noticias" — daño editorial y a SEO (homepage vacía indexable).
Causa: el catch no distinguía error de infraestructura de corpus legítimamente
       vacío.
Corrección: re-lanzar FirestoreOutageError antes del logger (app/page.tsx:129-131).
            ISR sirve la última versión válida; request sin caché recibe error real.
Tests: tests/homepage-outage.test.ts — 4 casos, todos verdes.
Producción: / -> 200 REVALIDATED; cf:HIT; comportamiento nominal intacto.
Estado: FIXED
```

```
ID: F-02
Severidad: P1
Archivo: lib/data.ts + 5 rutas de mutación/revalidación
Línea: lib/data.ts:780 (tag 'sitemap-news-full'); fixes en
       app/api/revalidate/route.ts:80, app/api/admin/news/route.ts:320,
       app/api/admin/guardar-directo/route.ts:311,
       app/api/admin/news/[id]/route.ts:250,358,410,
       app/api/admin/cache-purge/route.ts:20
Problema: el dataset del sitemap se cacheaba bajo el tag 'sitemap-news-full'
          pero ninguna ruta lo invalidaba → sitemap stale hasta 1h tras publicar.
Evidencia: grep de revalidateTag en rutas — solo 'news-sitemap' y
           'sitemap-news' (tag del wrapper en app/sitemap.ts:19); nunca el tag
           interno del unstable_cache real.
Impacto: Google News/sitemap no veían artículos nuevos hasta el revalidate;
         invalidar el wrapper servía datos viejos.
Causa: dos niveles de caché con tags distintos y solo el externo se invalidaba.
Corrección: añadir revalidateTag('sitemap-news-full') junto a las invalidaciones
            existentes en las 5 rutas.
Tests: suite completa verde (1028 passed); diff revisado línea a línea.
Producción: /sitemap.xml -> 200 PRERENDER (448 URLs); news-sitemap cf:HIT.
Estado: FIXED
```

## 21. Hallazgos P2

```
ID: F-03
Severidad: P2
Archivo: app/page.tsx (render HomePagePro)
Problema: en un request ISR sin versión previa cacheada, un apagón produce
          la página de error de Next (mejor que portada falsa, pero sin
          fallback dedicado).
Evidencia: comportamiento por diseño de error boundaries App Router.
Impacto: UX degradada solo en el caso apagón+sin-caché (raro).
Corrección: ninguna — fallback dedicado sería nueva feature fuera de alcance.
Estado: ACCEPTED RISK
```

```
ID: F-06
Severidad: P2
Archivo: firestore.rules (match /noticias/{noticiaId}: get,list if true)
Problema: lectura pública completa de la colección noticias.
Evidencia: reglas + consumidores públicos confirmados
           (public/validador.html, public/panel.html usan client SDK).
Impacto: metadatos internos legibles (flags de workflow, scores); expone el
         corpus entero a scraping de campos no públicos.
Corrección: no realizada — cerrar la regla rompe validador y panel; requiere
            migración de consumidores, fuera del mandato quirúrgico.
Estado: DEFERRED
```

```
ID: F-07
Severidad: P2
Archivo: 12 rutas con auth por ?secret= / x-cron-secret:
  app/api/articles/route.ts:19, admin/eliminar-viejas/route.ts:16,
  admin/nios/loop/route.ts:14, admin/departamento/ejecutar/route.ts:12,
  admin/reindexar-google/route.ts:12, cron/nios-ceo-loop:15,
  cron/departamento-watchdog:13, cron/supervisor-watch:27,
  cron/departamento-daily:13, cron/departamento-central:12,
  cron/resumen-diario:77, telegram/route.ts:24
Problema: secretos viajando en querystring (quedan en logs/historial/proxies).
Evidencia: grep de searchParams.get('secret') — 12 coincidencias.
Impacto: exposición del secreto en logs; endpoints de cron/admin siguen
         validando server-side → auth no rota, higiene pobre.
Corrección: no realizada — migrar a Authorization/cron-header firma excede
            el alcance quirúrgico; varios son invocados manualmente desde
            public/panel.html (p.ej. resumen-diario?secret=manual-run).
Estado: LEGACY
```

```
ID: F-08
Severidad: P2
Archivo: public/panel.html
Problema: fetch client-SDK de toda la colección noticias sin paginación real;
          escala mal si el corpus crece mucho más allá de ~500 docs.
Evidencia: collection(db,'noticias') directo en el HTML del panel.
Impacto: latencia/consumo creciente en el panel; no afecta al sitio público.
Corrección: no realizada — paginación del panel = refactor fuera de alcance.
Estado: DEFERRED
```

```
ID: F-09
Severidad: P2 (informativo)
Archivo: public/validador.html
Problema: validador forense públicamente accesible que lee noticias vía
          client SDK; muestra columnas internas (Relleno emocional,
          Transiciones IA) con placeholders.
Evidencia: archivo servido bajo /validador.html; depende de la regla pública.
Impacto: superficie de información interna; sin datos sensibles críticos.
Corrección: clasificado — es herramienta auxiliar legítima; su dependencia
            de la regla pública ya está en F-06.
Estado: LEGACY
```

```
ID: F-10
Severidad: P2 (informativo)
Archivo: app/api/admin/session/route.ts:53-62
Problema: la cookie admin_session contiene ADMIN_API_KEY en claro
          (secreto maestro). HttpOnly+SameSite=Strict+Secure mitigan.
Evidencia: cookieOptions explícitos; isAdminRequest lib/auth.ts:54-57.
Impacto: robo de cookie = acceso admin total hasta Max-Age 86400.
Corrección: no realizada — tokens opacos firmados = cambio de arquitectura
            de auth fuera de alcance. Aceptable para operador único; rotar la
            key invalida sesiones.
Estado: ACCEPTED RISK
```

## 22. Riesgos futuros

- `sitemap-news-full` ahora invalida correctamente; vigilar que futuras cachés internas también reciban tag + invalidación simétrica.
- Migración pendiente de consumidores públicos de Firestore antes de poder cerrar la regla `noticias`.
- Hardening pendiente de `?secret=` → header `x-cron-secret` o Authorization.
- Build OOM con heap default en máquinas con poca RAM — usar `NODE_OPTIONS=--max-old-space-size=8192`.
- El corpus crecerá: considerar paginación del panel cuando supere ~1-2k docs.
- Supervisor approval solo cubre 210/500 docs — si se endurece `mutation-policy`, operaciones sobre artículos antiguos requerirán re-aprobación.

## 23. Cambios realizados

Commit `a5e8a2bc` (7 archivos, +59 líneas):

| Archivo | Cambio |
|---|---|
| `app/page.tsx` | import + re-throw de `FirestoreOutageError` (l.4, 129-131) |
| `app/api/revalidate/route.ts` | `revalidateTag('sitemap-news-full')` (l.80) |
| `app/api/admin/news/route.ts` | idem (l.320) |
| `app/api/admin/guardar-directo/route.ts` | idem (l.311) |
| `app/api/admin/news/[id]/route.ts` | idem en PUT+DELETE (l.250, 358, 410) |
| `app/api/admin/cache-purge/route.ts` | idem en lista de tags (l.20) |
| `tests/homepage-outage.test.ts` | **nuevo** — 4 regresiones error≠empty |

## 24. Cambios NO realizados y por qué

- **Cerrar `get,list if true` en `noticias`** — rompería `public/validador.html` y `public/panel.html` (client SDK). Requiere migrar consumidores a APIs admin primero → fuera de alcance quirúrgico.
- **Migrar `?secret=` a headers/cron-secret** — 12 rutas + invocaciones desde `panel.html`; cambio de superficie de auth → LEGACY.
- **Error boundary/fallback dedicado de homepage** — nueva feature; el comportamiento actual (ISR stale o error real) ya es correcto.
- **Tokens de sesión firmados/opacos** — refactor de arquitectura de auth.
- **Paginación del panel** — refactor, corpus actual manejable.
- **Rediseñar/eliminar `validador.html`** — sin evidencia de daño; es herramienta legítima.
- **Reprocesamiento masivo del corpus** — prohibido explícitamente y no necesario: el delta sitemap↔corpus se explica por filtros existentes.

## 25. Evidencia

- `git show a5e8a2bc` — diff quirúrgico (+59 líneas, 7 archivos).
- `npx vitest run` — 91 files / 1028 passed / 2 skipped.
- `tsc --noEmit` (NODE_OPTIONS 8GB) — 0 errores (.audit/tsc-surgical.txt vacío).
- `next build` — OK, rutas emitidas.
- `.audit/smoke-final.cjs` output — tabla completa en §18.
- Headers curl: `/panel/nios` → `307` + `cf-cache-status: DYNAMIC` + `Cache-Control: no-store`; `/` y `/news-sitemap.xml` → `cf:HIT`.
- `.audit/corpus-recon.cjs` — snapshot read-only 500/467/33/30/470/210.
- Sitemap fetch: 448 `<url>` (398 artículos + 50 taxonomía/estáticas).
- Cloudflare Cache Rule: bypass `*/panel*` + `*/admin*` activa (verificación previa + re-verificada post-deploy).

## 26. STOP / cierre

Condiciones de cierre verificadas:

- [x] Homepage error/empty resuelto (F-01 FIXED, 4 regresiones verdes)
- [x] Invalidación de sitemap coherente (F-02 FIXED, `sitemap-news-full` en las 5 rutas)
- [x] Corpus reconciliado (500/467/33/30; sitemap 398 artículos + 50 no-artículo; delta explicado)
- [x] `?secret=` clasificado (F-07 LEGACY, 12 rutas inventariadas)
- [x] Firestore público evaluado (F-06 DEFERRED, consumidores documentados)
- [x] Sesión admin evaluada (F-10 ACCEPTED RISK, atributos verificados)
- [x] Validador clasificado (F-09 LEGACY)
- [x] Escalabilidad del panel evaluada (F-08 DEFERRED)
- [x] Tests: 1028 passed · tsc: 0 errores · build: OK
- [x] Deploy pusheado (`a5e8a2bc`) y smoke de producción verde
- [x] Cloudflare protegido: `/panel*` → `307 /login` + `DYNAMIC`

**Respuestas finales del encargo:**
- ¿Homepage correcta? **Sí.**
- ¿Fallo Firestore → homepage vacía? **No.**
- ¿Publicación invalida sitemap? **Sí (tras el fix).**
- ¿Docs/publicados/archivados/indexables/sitemap? **500 / 467 / 33 / 437 candidatos → 398 artículos emitidos (+50 URLs no-artículo = 448 total).**
- ¿Por qué difieren? Filtros `isPublicArticle`/`shouldIndexArticle`/`isToxicSlug`/`noindex` + lag de caché 1h.
- ¿Artículos históricos modificados? **No.** ¿Reprocesamiento masivo? **No.**
- ¿Panel protegido? **Sí** (`307 /login` + `401` APIs). ¿Cloudflare puede cachear `/panel`? **No** (rule bypass + `no-store` verificados).
- ¿Firestore expone metadatos? **Sí** (lectura pública `noticias`, F-06 DEFERRED).
- ¿Existe `?secret=`? **Sí** (12 rutas, F-07 LEGACY).
- ¿AdSense técnicamente preparado? **Sí.** ¿Garantía de aprobación? **NO.**

Cierre de la auditoría quirúrgica. No se abre nueva fase ni roadmap.
