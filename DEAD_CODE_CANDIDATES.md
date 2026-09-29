# DEAD CODE CANDIDATES — auditoría de referencias

**Generado:** 2026-09-28 · **Método:** `.audit/dead-code-scan.mjs` — 870 archivos fuente, resolución real de imports (`@/`, relativos, `index`).
**Resultado:** 326 entrypoints (convención Next.js) · **66 archivos sin ninguna referencia · ~5 496 líneas**.

## CLASIFICACIÓN FASE B

**SAFE_TO_REMOVE** (librerías huérfanas, sin UI ni efectos laterales):
- `lib/editorial/profiles/{turismo,clima,cultura,servicio,economia,politica,salud}.ts`
- `lib/meni/modules/*` (7 archivos + index)
- `lib/meni/editorial-brain/profiles/*` (15 archivos — tercer sistema de perfiles redundante)
- `lib/meni/registry/*`, `lib/meni/{risk,seo,discover,auditor,editor-chief,adsense}.ts`, `lib/meni/utils/{entities,angles}.ts`, `lib/meni/{editor-autonomo,editor-brain}/types.ts`, `lib/meni/registry/index.ts`
- `lib/editorial/{mapper-v3,pipeline}.ts` (stubs)
- `lib/{editorial-intelligence,distribution-intelligence,audience-intelligence,revenue-intelligence,explainer,discover-score,internal-linking-engine,editorial-fix,dtos,image-loader,seo/meta,observability/cost-control,content-lifecycle}.ts`
- `lib/editorial/{editorialEnhancerAction,category-detector,profile-loader}.ts`, `lib/editorial/story-editor/*`
- `lib/db/cached-firestore.mjs`, `lib/nios/contentLifecycle.ts`
- `hooks/{useTheme,useScrollProgress}.ts`

**NEEDS_MANUAL_REVIEW** (hay que confirmar intención de producto antes de borrar):
- `components/pro/*` — portada alternativa completa + `EmergencyWidget` (911): ¿diseño descartado o rollout pendiente?
- `components/admin/{TipTapEditor,AnalizadorPanel,ImageAnalyzer,DashboardCalidad}` — ¿herramientas del panel viejo pendientes de migrar?
- `components/nios/*` y `lib/nios/*` huérfanos (~30) — módulos NIOS sin cablear; decidir si es roadmap o abandono.
- `public/panel.html`, `index-new.html`, `validador.html`, `editor-adsense.html`, `ads.txt.bak`, `nicaraguainformate.txt`, `panel-mobile.css` — servidos por URL directa; `panel.html` tiene herramientas únicas (correcciones masivas) y aún usa SDK cliente.
- `app/panel/nios/reparaciones/actions.ts` (15 líneas, huérfano dentro de ruta activa).
- `components/{JsonLdSchema,NewsGrid,IndicadoresWidget,ArticleDataCard,ArticleFaq,ContentWarning,TaboolaAds,PropellerAds,Analytics,DeferredAnalytics,ThirdPartyScripts,OneSignalProvider,PullQuote,ReadingProgress,OptimizedImage,AudioButton}` — verificar si son intencionales para futuras features.

**KEEP** (falsos positivos ya descartados): `ShareBar`, `KeyPoints`, `editorial-contract.ts`, `quality-gate.ts`, `sanitize.ts`, `canonical.ts` — usados en el pipeline vivo.

**CAVEAT:** el escáner no ve llamadas por string (rutas dinámicas, `fetch` a APIs, entrypoints de config). Cada archivo fue contrastado; los marcados ⚠️ requieren confirmación antes de borrar.

## LOTE 1 — seguro de eliminar (huérfanos verificados)

| Archivo | Líneas | Motivo |
|---|---|---|
| `lib/editorial/profiles/{turismo,clima,cultura,servicio,economia,politica,salud}.ts` | ~203 | perfiles huérfanos; el loader vivo está en `lib/editorial/canonical.ts` + `profile-loader` propio |
| `lib/meni/modules/{deportes,espectaculos,internacionales,nacionales,sucesos,tecnologia,default}.ts` + `index.ts` | ~141 | módulos meni viejos sin consumidor |
| `lib/meni/editorial-brain/profiles/{turismo,deportes-colectivos,espectaculos,sucesos,default,deportes-individuales,medio-ambiente,cultura,economia,educacion,internacionales,nacionales,politica,salud}.ts` | ~565 | perfilado por categoría duplicado — coexisten 3 sistemas de perfiles (este, `editorial/profiles`, `canonical`) |
| `lib/meni/registry/{registry,index}.ts` | ~312 | registro sin consumidores |
| `lib/meni/risk.ts`, `lib/meni/seo.ts`, `lib/meni/discover.ts`, `lib/meni/auditor.ts`, `lib/meni/editor-chief.ts`, `lib/meni/adsense.ts`, `lib/meni/utils/{entities,angles}.ts`, `lib/meni/editor-autonomo/types.ts`, `lib/meni/editor-brain/types.ts` | ~300 | helpers MENI aislados, ningún import |
| `lib/editorial/mapper-v3.ts`, `lib/editorial/pipeline.ts` | 4 | stubs de 2 líneas |
| `lib/editorial-intelligence/index.ts`, `lib/distribution-intelligence.ts`, `lib/audience-intelligence.ts`, `lib/revenue-intelligence.ts`, `lib/explainer.ts`, `lib/discover-score.ts`, `lib/internal-linking-engine.ts`, `lib/editorial-fix.ts`, `lib/editorial/editorialEnhancerAction.ts`, `lib/editorial/category-detector.ts`, `lib/editorial/profile-loader.ts`, `lib/editorial/story-editor/story-editor.ts` | ~1 200 | librerías de "intelligence" sin imports — reemplazadas por el pipeline meni/supervisor |
| `lib/db/cached-firestore.mjs` | 68 | `.mjs` suelto, sin uso |
| `lib/content-lifecycle.ts`, `lib/nios/contentLifecycle.ts`, `lib/dtos.ts`, `lib/image-loader.ts`, `lib/seo/meta.ts`, `lib/observability/cost-control.ts` | ~400 | utilidades sin referencia |
| `hooks/useTheme.ts`, `hooks/useScrollProgress.ts` | 112 | hooks sin uso |
| `lib/nios/*` sin referencias (~30 archivos: collectors/internal, intelligence, actions-server, utils, types, audience, business, content-intelligence, content-recycler, copilot, distribution-agent, distribution, daily-automation, editorial-memory, editorial-score, editorial-timeline, entity-brain, growth, learning-system, mission-center, mission-engine, morning-report, opportunityHunter, opportunity-radar, seo, seo-cleanup, smart-links, v3-report, v4-report, watcher, ceoReport, ceo-observatory, revenue, executive-report, business-signals, content-mix, category-health, editorial-diagnosis?) | ~3 000 | módulos NIOS paralelos nunca cableados — el NIOS vivo usa otras rutas (⚠️ re-verificar 2–3 nombres antes del borrado por nombre parecido) |

**Total lote 1 ≈ 5 000 líneas.**

## LOTE 2 — componentes UI huérfanos (confirmar si la portada "pro" es intencionalmente desactivada)

`components/pro/*` completo (HeroPrincipal, SeccionSucesos, SeccionCategoria, SeccionDestacados, SeccionOpinion, ZonaIndicadores, ZonaMultimedia, GridTematico, EditorsPick, TickerUltimaHora, BarraUltimaHora, ServiciosCiudadano, HerramientasCiudadanas, EmergencyWidget, GuiaUtilWidget, NewsletterBanner) — **una portada alternativa entera, no cableada**. ~1 400 líneas.
`components/{JsonLdSchema,NewsGrid,IndicadoresWidget,ArticleDataCard,ArticleFaq,ContentWarning,TaboolaAds,PropellerAds,Analytics,DeferredAnalytics,ThirdPartyScripts,OneSignalProvider,PullQuote,ReadingProgress,OptimizedImage,AudioButton}` — sin imports.
`components/admin/{TipTapEditor,AnalizadorPanel,ImageAnalyzer,DashboardCalidad,portada/PortadaCard}`, `components/nios/{NiosCeoShell,DailyEditorPanel,command-center/*}` (~700 líneas) — paneles admin sin ruta.

⚠️ **El widget de emergencias con el "911" vive en este lote** — nunca se renderizaba; el 911 que viste venía de `contacto` (ya corregido).

## LOTE 3 — `public/` servido pero legacy

`panel.html` (7 800 líneas — panel viejo; contiene prompt que instruía testigos ficticios, ya parcheado), `index-new.html`, `validador.html`, `editor-adsense.html`, `ads.txt.bak`, `nicaraguainformate.txt`, `panel-mobile.css`. Son HTML público accesible por URL — riesgo de indexación de páginas internas de herramientas.

## NO TOCAR (falsos positivos del escáner descartados)

`ShareBar`, `KeyPoints`, `editorial-contract.ts`, `quality-gate.ts` — usados (eran falsos negativos del primer regex, ya corregido).

## Recomendación de borrado

Lote 1 por `git rm` en 3 commits pequeños (lib/meni legacy → lib/nios → lib/misc). Lote 2 tras confirmar que la portada `pro` es intencionalmente inactiva. Lote 3 tras confirmar si `panel.html` sigue siendo el panel operativo.
