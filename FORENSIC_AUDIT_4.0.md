# FORENSIC RELEASE AUDIT — Nicaragua Informate 4.0

**Fecha:** 2026-09-28 · **Branch:** `master` @ `1d8ec96f` · **Fase:** A (diagnóstico, sin cambios destructivos)
**Método:** evidencia real — Firestore (507 docs noticias, 40 colecciones inventariadas), logs Vercel runtime, suite completa Vitest (1038 tests), escáner de referencias propio (870 archivos), curl a producción, revisión directa de middleware/rutas/reglas.

---

## 1. ESTADO CONGELADO (fotografía)

| Item | Valor |
|---|---|
| Branch activo | `master` (sync con `origin/master`) |
| HEAD | `1d8ec96f` fix(portada+articulo) |
| Ramas remotas | `audit/meni-forense-2026-09`, `fix/nios-execution-004`, `fix/social-distribution`, `fix/vercel-runtime-errors`, `ops/editorial-growth-live` (todas con trabajo sin mergear — deuda) |
| Deploy prod | `informate-nicaragua-nextjs-bjkoc2ku4` ● Ready, aliased a `nicaraguainformate.com` |
| Crons (vercel.json) | 8 jobs diarios: nios-collect, resumen-diario, departamento-central/daily/watchdog, nios-ceo-loop, supervisor-watch, traffic-cleanup |
| Cambios sin commit | 4 archivos (corrección números emergencia — ya aplicada localmente) |
| Tests | **1037/1038 PASS** — 1 fallo: `mission9-real-sources` (conexión real GSC, flaky de red, preexistente) |

## 2. INVENTARIO REAL

| Área | Tamaño |
|---|---|
| API routes | 118 archivos `route.ts` |
| Páginas | 75 `page.tsx` |
| Componentes | 94 `.tsx` (components/) |
| Librerías | 443 `.ts` (lib/) |
| Tests | 92 archivos `.test.ts` |
| Colecciones Firestore | **40** (noticias 507, traffic_log **24 684**, google_learning_patterns **15 151**, support_analytics 2 783, distribuciones 739, meni_predictions 335, article_lifecycles 223, editorial_review_queue 143…) |
| Public/ legacy | `panel.html` (7 800+ líneas), `index-new.html`, `validador.html`, `editor-adsense.html`, `ads.txt.bak`, `nicaraguainformate.txt` |

## 3. MATRIZ DE HALLAZGOS (severidad / estado)

| # | Hallazgo | Sev | Estado | Evidencia |
|---|---|---|---|---|
| 1 | **Notas rechazadas no dejan rastro persistente.** Las 27 notas de los últimos 4 días están todas publicadas; la nota de Sucesos rechazada "ayer" no existe en `noticias`, `editorial_review_queue` (todo `RESUELTA`), ni logs accesibles (Vercel retiene solo minutos). **El caso real es NO REPRODUCIBLE con la instrumentación actual.** | **P1** | REAL | `.audit/sucesos-rechazada.mjs`, `review-queue.mjs` |
| 2 | `POST /api/support/track` escribe en Firestore **sin auth ni rate-limit**. `support_analytics` tiene 2 783 docs — spam-prone. | **P1** | REAL | `app/api/support/track/route.ts` |
| 3 | `firestore.rules`: `noticias` permite `get,list: if true` → **borradores y notas no publicadas son leíbles por cualquiera** vía SDK público. | **P1** | REAL | `firestore.rules:12` |
| 4 | `distribuciones_pendientes`: retries muertos — docs de **julio** con `reintentos:0` y `proximoIntento` vencido hace meses. La cola de reintento no funciona. | P1 | REAL | `.audit` muestra: telegram/push fallidos nunca reintentados |
| 5 | `traffic_log`: 24 684 docs, `expiresAt` vencido sin borrar (cleanup no alcanza). Costo Firestore creciente. | P2 | REAL | count + query `expiresAt < now` |
| 6 | `google_learning_patterns`: **15 151 docs** — el "learning" acumula patrones masivamente; sin evidencia de consumo en decisiones (acumulación ≠ aprendizaje). | P2 | REAL | count de colección |
| 7 | `meni_predictions` dual-schema: predicciones nuevas guardan `validationStatus='PENDING_VALIDATION'`; el validador escribe `validation.summary` — **0 VALIDATED en producción**. `predFacebook`/`predDiscover` son `INSUFFICIENT_DATA` permanentes (no hay métricas). | P2 | REAL | muestra de 335 docs |
| 8 | `confianza.nivel:'BAJA'` + `requiereRevisionHumana:true` con **0 fuentes** publica igual (ej. `tres-dias-siete-muertos` score 93 PUBLICAR). Flag observacional, nadie lo consume. | P2 | REAL | `doc-*.json` |
| 9 | `factuality.signals: []` en nota con 48 afirmaciones / 8 atribuidas / 0 fuentes — la barrera factual existe pero **no disparó señales** donde debía. | P2 | REAL/POTENCIAL | `factuality.evaluatedAt` presente, signals vacío |
| 10 | Doble marcado de distribución: `publication-pipeline` y `distribuir` ambos escriben `distribuida:true` (mutationLog lo muestra). | P3 | REAL | mutationLog de nota real |
| 11 | Código muerto: **66 archivos / ~5 500 líneas sin referencias** (scanner corregido, resolución real de imports). Incluye `JsonLdSchema` alterno, `TipTapEditor`, `DashboardCalidad`, todo `components/pro/*` (portada alternativa), perfiles huérfanos `lib/editorial/profiles/*` y `lib/meni/modules/*`. Detalle: `DEAD_CODE_CANDIDATES.md`. | P3 | REAL | `.audit/dead-code-raw.txt` |
| 12 | `public/` legacy servido: `panel.html` (admin viejo, ~7 800 líneas, prompt que instruía **inventar testigos ficticios** — ya corregido localmente), `index-new.html`, `validador.html`, `editor-adsense.html`, `ads.txt.bak`. | P2 | REAL | `ls public/` |
| 13 | Números de emergencia: "911" (EE. UU.) en widget muerto + `contacto`; teléfonos fijos 505-2228-XXXX **no verificados** en `limpiar-sucesos` y 2 artículos publicados. Corregido en código (pendiente commit); corrección de los 2 artículos lista en script (no ejecutada). | P2 | REAL | grep + scan de 469 publicados |
| 14 | Middleware: `PUBLIC_ADMIN_ROUTES` incluye `repair-fechas` (mutación masiva) — ruta protegida internamente por token, pero bypass del middleware es una fragilidad si el check interno falla. | P3 | POTENCIAL | `middleware.ts:133` |
| 15 | `/api/admin/config` GET público: expone solo `configured: bool` — aceptable, pero expone `voiceId` por defecto de ElevenLabs. | P4 | REAL | `config/route.ts:20-49` |
| 16 | 5 ramas remotas abandonadas con trabajo sin mergear → divergencia local/preview. | P3 | REAL | `git branch -a` |
| 17 | CSP usa `'unsafe-inline'` en script-src (necesario para ads/scripts actuales). Nonce generado pero no se aplica a scripts inline. | P3 | POTENCIAL | `middleware.ts:208` |
| 18 | Home TTFB: 0.17–0.46s caliente, ~6s frío (ISR miss). `sitemap.xml`/`news-sitemap.xml` exceden 2 MB → **no cacheables en Next data cache** (re-computan siempre). | P2 | REAL | curl ×3 + build log |
| 19 | `editorial_review_queue` funciona (143 items resueltos) pero `reason` vacío en docs — la trazabilidad existe, el contenido es pobre. | P3 | REAL | muestra de cola |
| 20 | SEO técnico básico presente (sitemap, news-sitemap, robots, JSON-LD, canonical, metadata). `ads.txt.bak` sugiere ads.txt tocado a mano. | P4 | — | verificado build+curl |

## 4. MENI FORENSE — matriz de decisión

Determinismo verificado en fases previas + esta corrida: gates mecánicos (QG BLOQUEADO, transcripción, duplicados, quote-guard, factuality CRITICAL) **bloquean sin importar score** — cubierto por tests `factuality-barrier`, `editorial-authority`, `publish-edit-flow` (58/58).

| Capacidad | Estado | Evidencia |
|---|---|---|
| Única fuente de aprobación (`isApprovalCurrent` por contentHash) | ✅ | mutation-policy + news/[id] |
| Contenido canónico único (`textoCorregido` en las 5 vías de escritura) | ✅ | fase 5 |
| Detección de artefactos IA (`:contentReference`, oaicite, 【†】) | ✅ | content-integrity BLOCK/AUTO_REMOVE + tests |
| Trazabilidad por nota (`mutationLog`, `supervisorDecision`) | ✅ real, funcionando | doc real inspeccionado |
| Trazabilidad de RECHAZOS | ❌ **P1** — rechazo no persiste en ninguna colección | caso "ayer" irreproducible |
| `qualityGate` persistido al doc | ⚠️ ausente como campo | doc real |
| `confianza`/`factuality` como decisión | ⚠️ evaluadas, no consumidas | `signals:[]`, `BAJA` publica |
| Learning real (predicción→validación→ajuste) | ⚠️ pipeline existe, 0 validaciones reales | 335 predictions, dual-schema |
| Overrides peligrosos | ✅ bloqueados por fases 3–5 | `expandir-7`/`clean-seo` ahora con auth |

**Caso real de Sucesos rechazada:** NO RESUELTO por falta de trazabilidad (ver hallazgo #1). No fue posible reconstruir `input→evaluación→rechazo` porque el sistema no persiste decisiones negativas fuera de `editorial_review_queue`, y allí todo está resuelto sin `reason`. **Necesito el slug/título o la hora aproximada para buscar en `nios_memory`/`meni_learning_feedback`.**

## 5. PANEL ADMINISTRATIVO

- **Dos paneles coexisten**: `/panel` (Next.js, componentes React) y `public/panel.html` (monolito legacy de ~7 800 líneas que sigue servido). El legacy contiene prompts con instrucciones periodísticas incorrectas (testigo ficticio — corregido; "Cruz Blanca" era correcta tras tu corrección).
- Auth: cookie `admin_session` HttpOnly + header `x-admin-token` con comparación timing-safe. Middleware inyecta header desde cookie. Sólido.
- `/api/admin/estado` y `config` GET intencionalmente públicos (solo booleans `configured`).
- No verificado visualmente (Fase D): doble-submit, estados de carga, responsive — pendiente de revisión con browser.

## 6. SEGURIDAD (resumen)

| Control | Estado |
|---|---|
| `/api/admin/*` | ✅ middleware + timing-safe + no-store (fix Cloudflare ya aplicado) |
| Mutadores masivos (`expandir-7`, `clean-seo`, `limpiar-sucesos`, etc.) | ✅ auth desde fase 3 — verificado 401 en prod |
| Secrets | ✅ ningún secreto en repo; `.env.local` no trackeado; gitleaks hook presente (avisa "no instalado") |
| CSP/HSTS/XFO/COOP/Permissions-Policy | ✅ activos |
| Lectura pública de borradores (`noticias get,list: if true`) | ❌ **P1** |
| `support/track` sin auth ni rate-limit | ❌ **P1** |
| Bots AI bloqueados, crawlers permitidos | ✅ |
| Source maps / errores | build limpio; `logger` sin leaks detectados en muestra |

## 7. VEREDICTO

**`NOT_READY_FOR_4.0`** — con 3 P1 abiertos que deben cerrarse en Fase B:

1. **P1-OBS**: persistir decisiones de rechazo (colección o campo) — sin esto, ningún fallo de publicación es auditable.
2. **P1-SEC**: `support/track` + regla `noticias get,list` (exposición de borradores).
3. **P1-OPS**: cola `distribuciones_pendientes` muerta (o eliminarla, o reintentarla).

P2 más urgentes: fix de los 2 artículos con teléfonos falsos (script listo), traffic_log cleanup, retirar `public/*.html` legacy, cerrar dual-schema de predictions.

### Pendiente de decisión tuya (Fase B/C):
- ¿Commit + deploy del fix de números de emergencia ya hecho?
- ¿Ejecuto corrección de los 2 artículos (dry-run primero)?
- ¿`public/panel.html` es el panel real o `/panel`? (define qué se borra en Fase C)
- Aprobar lote 1 de DEAD_CODE_CANDIDATES.md.
