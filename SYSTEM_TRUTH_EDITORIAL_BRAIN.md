# SYSTEM TRUTH — EDITORIAL BRAIN

> Documento de realidad del sistema, construido exclusivamente desde evidencia
> de código: imports, llamadas, rutas, crons (`vercel.json`), middleware,
> escrituras a Firestore y grafo de alcanzabilidad estático (BFS desde
> `app/**` + `middleware.ts`, 195 entrypoints → 646 archivos alcanzados,
> 442 archivos en `lib/`).
> Fecha: cierre post-saneamiento. Commit base: `41bcf47a` (master).
> Nada en este documento proviene de archivos `*_REPORT.md` / `FINAL` /
> `CERTIFIED` — esos documentos se trataron como pista, no como verdad.

---

## 1. REPOSITORY_MAP

```
app/                    Next.js 15 App Router — 112 rutas API + páginas públicas + admin
  app/api/admin/        67 endpoints admin (todos tras middleware /api/admin/*)
  app/api/cron/         8 endpoints cron (declarados en vercel.json)
  app/api/              endpoints públicos (feed, rss, weather, telegram, webhooks…)
  app/admin/            páginas del panel admin (editor, correcciones, meni-*, nios-*)
public/panel.html       Panel operativo principal (SPA en un solo HTML, ~8.5k líneas)
lib/
  meni/                 50 archivos — evaluador editorial (core, editorial-brain,
                        quality-gate, editor-brain, learning-engine, editor-jefe,
                        editor-autonomo, story-planner, modules, intelligence…)
  editorial/            21 archivos — pipelineV4 (core/), guardar-con-meni, trust,
                        quote-guard, content-integrity, canonical, meta
  nios/                 68 archivos — observabilidad/orquestación de negocio
                        (intelligence/, ceo-loop, action-engine, collectors/, …)
  supervisor/           5 archivos — Editorial Supervisor (autoridad de publicación)
                        + supervisor watch cycle + cost-guard
  departamento-central/ 13 archivos — scheduler + cola de jobs + watchdog +
                        heartbeat + workers (ops de plataforma)
  research/             research-agent + llm-client (LLM)
  news-watch/           watch-engine — monitoreo post-publicación
  analytics/            traffic-reader, traffic-ttl (GA4/GSC plumbing)
  observability/        8 archivos
  seo/, portada/, ads/, admin/, db/, utils/, contracts/, editorial-intelligence/
middleware.ts           auth admin, rutas sensibles, CSP, slugs
tests/                  vitest (incl. learning-governance, quote-guard,
                        content-integrity, publication-gate, pagination…)
scripts/ + .audit/      scripts operativos y artefactos forenses de saneamiento
appx/                   ⚠ instalador de Windsurf (windsurf_x64.appx, dll) — basura
articulos-generados/    1 txt suelto — residuo histórico
docs/, reports/, *.md   ~40 documentos de auditoría/reportes históricos en raíz
vercel.json             8 crons + headers de caché
```

## 2. MAPA DE EJECUCIÓN — QUIÉN ENTRA AL SISTEMA

### Puntos de entrada que ESCRIBEN `noticias`

| Entrypoint | Auth | Qué hace |
|---|---|---|
| `POST /api/admin/news` | `verifyAdminToken` | Crea nota: `guardarConMeni` → `docRef.set` → `runPublicationPipeline` → `runWatchCycle` → `runCEODecisionForArticle` → IndexNow + revalidate |
| `PUT /api/admin/news/[id]` | `verifyAdminToken` | Edita nota: si cambia contenido/título/resumen → `content-integrity` → `guardarConMeni` (MENI+Supervisor) → `ref.update` → `registerCorrection` (Editor Jefe) → `analyzeTrust` (trust layer) → revalidate |
| `DELETE /api/admin/news/[id]` | `verifyAdminToken` | Soft-delete de publicadas (archivado + snapshot + `deletion_audit`); hard-delete solo borradores |
| `POST /api/admin/guardar-directo` | `verifyAdminOrCleanupToken` | Crea/edita nota (ruta usada por el panel y por automatización externa): `content-integrity` → `guardarConMeni` → `docRef.set/update` → `runWatchCycle` + publication-pipeline |
| `POST /api/articles` | `verifyAdminOrCronToken` | Tercera vía de creación: también pasa por `guardarConMeni` |
| `POST /api/admin/meni/generar` | `verifyAdminOrCleanupToken` | Generación autónoma: `generarArticuloAutonomo` (editor-autonomo). Solo llamado desde esta ruta — el panel NO lo invoca |
| `POST /api/admin/enrich-links` | middleware | **Modifica `contenido` post-publicación**: append del bloque "También te puede interesar" |
| `POST /api/admin/enrich-strong` | middleware | Modifica `contenido` (keywords en `<strong>`) |
| `POST /api/expandir-7`, `/api/clean-seo` | middleware (SENSITIVE) | Reescriben `contenido` y resetean `aprobadoMeni:false` |
| `POST /api/admin/distribuir`, `clean-backlog`, `eliminar-viejas`, `limpiar-*`, `repair-fechas`, `correcciones` | middleware | Mutan metadatos o `contenido` de notas existentes |

**Conclusión de generación**: el contenido llega ya redactado desde fuera
(panel humano o automatización externa → `guardar-directo`). El generador
autónomo en-repo (`editor-autonomo/engine.ts`) existe, está protegido por
`quote-guard` (cita-vs-fuente) y `cost-guard`, pero solo se dispara por el
endpoint manual `/api/admin/meni/generar`. La corrupción mecánica hallada
en el saneamiento (concatenaciones, citas-plantilla, `<li>` rotos) entró por
la vía externa — el guarda `content-integrity` ahora la bloquea en los 3
puntos de escritura.

### Crons reales (vercel.json)

| Cron | Hora | Llama | Efecto |
|---|---|---|---|
| `/api/cron/nios-collect` | 08:00 | `runNIOSPipeline` → `runCEOLoop` | Colecta GA4+GSC → ~15 reportes → snapshot diario → CEO loop |
| `/api/cron/resumen-diario` | 12:00 | Telegram | Resumen diario a Telegram |
| `/api/cron/departamento-central` | 00:00 | `runScheduler` | Encola + drena `depto_jobs` |
| `/api/cron/departamento-daily` | 06:00 | `runDepartamentoCentralCycle` | Reporte diario del depto |
| `/api/cron/departamento-watchdog` | 01:00 | `runWatchdog` + `processJobQueue` | Salud de crons/jobs + drenaje |
| `/api/cron/nios-ceo-loop` | 02:00 | `runCEOLoop` + `proposeActionsFromOpportunities` | Segundo ciclo CEO diario |
| `/api/cron/supervisor-watch` | 04:00 | `runSupervisorWatchCycle` + `checkMediumHealth` + `applySafeAutoFixes` | Vigilancia editorial de notas publicadas (limit:5) |
| `/api/cron/traffic-cleanup` | 03:00 | `cleanupTrafficLog` | TTL del log de tráfico |

## 3. CADENA CANÓNICA DE UNA NOTICIA

```
PANEL/EXTERNO (titulo+contenido ya redactados)
  → POST /api/admin/guardar-directo  |  /api/admin/news  |  /api/articles
  → findGenerationDefects()            [content-integrity — REJECT mecánico]
  → guardarConMeni()                   [lib/editorial/guardar-con-meni.ts]
      → runMeniAsync()                 [lib/meni/core.ts]
          → loadActiveAdjustments()    learning-engine → tierOverrides (MENI congelado)
          → loadNoticiasAsInputs / editorPatterns / knowledgeQuery (editorJefe)
          → evaluateMeni():
              1. detectTier + getPerfilEditorial      (editorial-tiers/profiles)
              2. pipelineV4()                          lib/editorial/core/pipeline — evidencia técnica
              3. runEditorialBrain()                   meni/editorial-brain — ÚNICA fuente del score
                 (news-value, competition, NI-engine, reader-questions,
                  explanation, difference, public-value, retention,
                  story-completeness, utility-gate, verification)
              4. analyzeSEO/Forensic/EEAT/Discover/AdSense/ValorEditorial/audit
              5. runIntelligenceEngine()               meni/intelligence/*
              6. runQualityGate()                      meni/quality-gate — issues técnicos blocking
              7. aprobado = score≥85 && !bloquear && !QG-blocking && !transcripción
          → detectarDuplicadoAdmin()   (similitud, bloqueo por duplicado)
          → editorBrain: SALTADO (skipEditorBrain:true en TODOS los callers)
          → ingestPublishedArticle()   post-evaluación (knowledge-base)
      → resolvePublicCategory()        editorial/canonical — categoría canónica
      → makeEditorialDecision()        lib/supervisor/editorial-supervisor
                                       SUPERVISOR = única autoridad de publicación
      → updateData (score, diagnostico, supervisorDecision, editorialState…)
  → Firestore noticias/{id}.set/update
  → runPublicationPipeline()           meni/publication-pipeline (Telegram+FB+IndexNow+push)
  → runWatchCycle() + persistWatchResult → article_lifecycles
  → revalidateTag/Path                 (noticias, home, categoría, sitemaps)
```

**Autoridad para publicar**: `editorial-supervisor.ts` (`makeEditorialDecision`).
MENI evalúa (score + blockingIssues), el Supervisor decide
(`PUBLICAR`/`PUBLICAR_CON_CAMBIOS`/`NO_PUBLICAR`). Ambas rutas de guardado
respetan `SUPERVISOR_BLOCKED` con 400. La decisión publicada es inmutable
(`computePublicationAllowed` exige editorial AND qualityGate AND quoteGuard —
commit `4f279215`).

### Quién puede modificar una nota DESPUÉS de evaluada

| Vía | Modifica | Re-pasa MENI |
|---|---|---|
| `PUT /api/admin/news/[id]` (edición con contenido) | contenido/título/resumen | SÍ — guardarConMeni completo + correction-tracker + trust |
| `PUT` metadata-only (imagen/autor/destacada/publicado) | metadatos | NO — pero publicar exige `aprobadoMeni` previo |
| `guardar-directo` re-save | todo | SÍ |
| `enrich-links`, `enrich-strong` | contenido (append) | **NO** — mutan contenido sin re-evaluar |
| `expandir-7`, `clean-seo` | contenido + reset `aprobadoMeni:false` | NO — dejan la nota desaprobada |
| `correcciones` (admin page → PUT) | contenido | SÍ (vía PUT) |
| `news-watch` | NO toca `noticias` — escribe `article_lifecycles` | n/a |
| `departamento-central articlePipelineWorker` | NO toca `noticias` — escribe `meni_diagnosis` | n/a |
| NIOS action-engine | NO toca `noticias` — escribe `nios_distribution_queue` | n/a |

⚠ `enrich-links`/`enrich-strong` son **mutación de contenido sin puerta
editorial** — y el formato del bloque que appendan es el origen demostrado
de los `<li>` rotos corregidos en el saneamiento.

## 4. FUNCIÓN DE CADA SISTEMA (evidencia)

| Sistema | Rol real | Estado |
|---|---|---|
| **MENI** (`lib/meni/core.ts`) | Evaluador: score, aprobado, diagnóstico, recomendaciones. NO decide publicar | ACTIVO — congelado |
| **Editorial Brain** (`meni/editorial-brain`) | Motor interno del score MENI ("única fuente de verdad" del score) — 9 sub-motores | ACTIVO dentro de runMeni |
| **Editor Brain** (`meni/editor-brain`) | Segundo "cerebro": aprendizaje del corpus (`runEditorBrain`, `ingestPublishedArticle`) | **PARCIAL**: skipEditorBrain:true en el flujo de guardado; solo corre en editor-autonomo e ingest post-publicación |
| **pipelineV4** (`lib/editorial/core/pipeline`) | Extracción de evidencia técnica que alimenta Editorial Brain | ACTIVO |
| **Quality Gate** (`meni/quality-gate`) | Verificación técnica (contradicciones, transcripción, duplicados) — issues blocking | ACTIVO |
| **Editorial Supervisor** (`lib/supervisor`) | Autoridad final de publicación + watch cycle + cost-guard de LLM | ACTIVO |
| **quote-guard** (`lib/editorial/quote-guard`) | Bloquea citas/atribuciones no presentes en la fuente | ACTIVO en editor-autonomo + gate de publicación |
| **content-integrity** (`lib/editorial/content-integrity`) | Bloquea defectos mecánicos conocidos en los 3 puntos de escritura | ACTIVO (nuevo) |
| **Research** (`lib/research`) | Agente LLM de investigación → `input.research` | ACTIVO vía `/api/admin/research` (manual) |
| **Story Planner** (`meni/story-planner`) | Plan de historia → `input.story` | ACTIVO vía `/api/admin/story` (manual); consumido por Supervisor |
| **Editor Jefe** (`meni/editor-jefe`) | correction-tracker: registra diffs de ediciones humanas → `editor_corrections` → `editor_patterns` | ACTIVO (enganchado en PUT) |
| **Learning Engine** (`meni/learning-engine`) | `loadActiveAdjustments` → tierOverrides que llegan a evaluateMeni; lifecycle OBSERVED→…→ACTIVE | ACTIVO (lee patrones aprobados) — congelado |
| **NIOS Intelligence** (`lib/nios/intelligence/orchestrator`) | Pipeline diario: GA4+GSC+noticias → ~15 reportes → snapshots, patrones, alertas | ACTIVO (cron 08:00 + manual) |
| **NIOS CEO Loop** (`lib/nios/ceo-loop` + `action-engine`) | Observa→diagnostica→decide→planifica→"ejecuta"→verifica→aprende. Las acciones ejecutables escriben PREPARED en `nios_distribution_queue` | ACTIVO pero **sin consumidor de cola** — nada sale realmente a Telegram |
| **Departamento Central** (`lib/departamento-central`) | Scheduler + `depto_jobs` + watchdog + heartbeats + worker `article-pipeline` que RE-evalúa con runMeni y escribe `meni_diagnosis` | ACTIVO — diagnóstico paralelo sin autoridad |
| **news-watch** (`lib/news-watch`) | Monitorea actualizaciones de notas vivas → `article_lifecycles` | ACTIVO (post-publish hook) |
| **publication-pipeline** (`meni/publication-pipeline`) | Distribución real: Telegram, Facebook, IndexNow, push | ACTIVO — el único que SÍ publica fuera |

## 5. DATOS QUE ENTRAN

| Fuente | Colector | Destino |
|---|---|---|
| GA4 (`NIOS_GA4_PROPERTY_ID`, default 525672447) | `lib/nios/collectors/ga4.ts` → orchestrator | `nios_daily_snapshots`, reportes |
| GSC (`sc-domain:nicaraguainformate.com`) | `lib/nios/collectors/gsc.ts` → orchestrator | snapshots, content-* reports |
| `noticias` (Firestore) | data-merger / loadNoticiasAsInputs | todos los reportes NIOS + MENI editorJefe |
| Telegram webhook | `/api/telegram`, `/api/webhooks/departamento` | comandos/alertas |
| Journey telemetry | `/api/telemetry/journey` | reader journey |
| Tráfico | traffic-reader / traffic-ttl | dashboards |

**Lo que vuelve al proceso editorial**: `learning-engine` (tierOverrides →
evaluateMeni), `editor_patterns` (correcciones humanas → editorJefe en MENI),
`knowledgeQuery` (knowledge-base → Editorial Brain), snapshot momentum
(alerts). Los ~15 reportes NIOS (compliance, readiness, adsense-recovery,
content-mix, opportunities…) se escriben a Firestore pero **no tienen
consumidor que actúe** — son lectura de panel.

## 6. DUPLICADOS / SOLAPAMIENTOS

| Par | Evidencia |
|---|---|
| `meni/editor-brain` vs `meni/editorial-brain` | Dos "brains" distintos. El segundo calcula el score dentro de MENI; el primero quedó como aprendizaje post-publicación y está saltado en el flujo de guardado |
| `lib/editorial/pipeline.ts` + `mapper-v3.ts` + `profile-loader.ts` + `supervisor-gate.ts` | Pipeline viejo — **inalcanzable** desde app (reemplazado por `core/pipeline.ts` = pipelineV4) |
| `departamento-central articlePipelineWorker` vs flujo canónico | Re-evalúa cada nota nueva con `runMeni` y escribe `meni_diagnosis` — evaluación paralela que no bloquea ni informa al Supervisor |
| `meni/editor-meni.ts`, `meni/editor-chief.ts`, `editorial-intelligence/` | Múltiples "editores" históricos; `editor-meni` y `editorial-intelligence` inalcanzables |
| `nios/` subárboles | `executive/morning-brief`, `executive/weekly-report`, `growth/opportunities`, `reader-experience/`, `revenue/`, `validators/`, `lifecycle/tracker`, `intelligence/index`, `collectors/internal`, `command-center/*` — inalcanzables |

## 7. COMPONENTES MUERTOS O DESCONECTADOS (grafo: sin camino desde app/)

54 archivos en `lib/` sin import alcanzable. Los significativos:

```
editorial/pipeline.ts, mapper-v3.ts, profile-loader.ts, supervisor-gate.ts,
editorial/adsense-safety.ts, editorialEnhancerAction.ts, enhancer/,
editorial/profiles/{clima,cultura,economia,politica,salud,servicio,turismo}.ts
  (profile-loader solo carga un subconjunto — 7 perfiles huérfanos)
meni/editor-meni.ts, penalizacion-editorial.ts, profundidad.ts, risk.ts,
taxonomy.ts, utilidad.ts, registry/index.ts,
knowledge-base/{editorial-memory,internal-linking}.ts, utils/{angles,entities}.ts
nios/{collectors/internal,executive/*,growth/opportunities,lifecycle/tracker,
     reader-experience/*,revenue/*,validators/*,intelligence/{index,ceo-status}}
editorial-intelligence/index.ts, content-lifecycle.ts, audience-intelligence.ts,
distribution-intelligence.ts, discover-score.ts, revenue-intelligence.ts,
explainer.ts, explainer, image-loader.ts, internal-linking-engine.ts,
api-error-handler.ts, dtos.ts, observability/cost-control.ts
```

Colecciones/colas sin consumidor: `nios_distribution_queue` (PREPARED nunca
→ SENT), `meni_diagnosis` (se escribe, nadie la lee para decidir), y los
~15 reportes NIOS (persistidos, sin actor). `depto_jobs` sí tiene consumidor
(el scheduler/watchdog lo drenan).

## 8. COMPONENTES REALMENTE CRÍTICOS

1. `guardar-con-meni.ts` — puerta única (todas las vías de guardado pasan aquí)
2. `meni/core.ts` → `editorial-brain` — el evaluador
3. `supervisor/editorial-supervisor.ts` — la autoridad
4. `middleware.ts` — toda la seguridad admin/sensitive
5. `publication-pipeline.ts` — la única distribución real
6. `data.ts`/`db/` + `unstable_cache` — lectura pública (riesgo de caché conocido)
7. `sanitize.ts` + `content-integrity.ts` + `quote-guard.ts` — integridad de contenido

## 9. DEUDA TÉCNICA

- 54 archivos `lib/` muertos + `appx/` (instalador binario en el repo) +
  `articulos-generados/`, ~40 reportes `*.md` históricos en raíz.
- `enrich-links`/`enrich-strong` mutan `contenido` publicado sin puerta
  editorial → origen del defecto `<li>` roto (corregido en datos, no en causa).
- Triple vía de creación (`news` POST vs `guardar-directo` vs `/api/articles`)
  con lógica casi duplicada — divergencia ya observada (related_links
  distintos entre rutas).
- `departamento-central` duplica evaluación MENI sin autoridad — `meni_diagnosis`
  es una colección escrita-nunca-leída.
- Generador externo (fuera del repo) produce las corrupciones — mitigado por
  content-integrity pero la causa raíz no está en este codebase.

## 10. QUÉ FALTA PARA UN "CEREBRO EDITORIAL VIVO"

- Un **solo** flujo de guardado (hoy hay 3 rutas + mutadores laterales).
- Consumidor real de `nios_distribution_queue` o retiro consciente.
- Que los reportes NIOS alimenten decisiones (hoy son lectura pasiva).
- `editor-brain` unificado o eliminado del doble-brain actual.
- `meni_diagnosis` conectado al Supervisor o eliminado.
- Bucle learning completo verificado end-to-end en producción
  (corrections→patterns→adjustments existe en código; el gobierno
  OBSERVED→ACTIVE está implementado y congelado).

---

### DOCS_CONTRADICT_CODE

- Documentos raíz (`FINAL-NIOS-PRODUCTION-REPORT.md`, `FORENSIC_AUDIT_CERTIFICATION*.md`,
  `docs/SYSTEM_REGISTRY.md`) describen sistemas como integrados/operativos que el grafo
  muestra inalcanzables (p.ej. `reader-experience`, `revenue`, `validators`, pipeline
  viejo de `lib/editorial`). Tratados como historia, no como verdad.
- `CURRENT_SYSTEM_TRUTH` upstream (commit `78befa95`) sí corresponde mayoritariamente
  al código — sus `verifiedAgainst` son veraces.
