# EDITORIAL BRAIN — TARGET ARCHITECTURE (ESPECIFICACIÓN)

> Fase 2 — especificación operacional. Construida exclusivamente sobre
> evidencia de código y `SYSTEM_TRUTH_EDITORIAL_BRAIN.md` (commit `fa16c1ae`).
> **No es implementación. No cambia producción, Firestore ni código.**
> Confidence: HIGH = verificado en código esta sesión · MEDIUM = inferido de
> estructura/imports · LOW = requiere verificación adicional.

---

## 1. EXECUTIVE SUMMARY

Nicaragua Informate ya tiene un ciclo editorial casi completo — disperso en
tres rutas de guardado, dos "brains", un supervisor, un evaluador y un
sistema de observación. La arquitectura objetivo NO requiere construir un
motor nuevo: requiere **nombrar el ciclo que ya existe, cerrar las vías que
lo evaden y conectar las piezas que producen datos que nadie consume**.

El flujo canónico real (evidencia):

```
Entrada (humana o externa, texto ya redactado)
  → guardar-directo | news POST | /api/articles        (3 vías equivalentes)
  → content-integrity (REJECT mecánico)
  → guardarConMeni → runMeniAsync (MENI evalúa)
      → editorial-brain (score único) + analyzers + quality-gate
  → makeEditorialDecision (Supervisor = autoridad única)
  → Firestore write
  → publication-pipeline (Telegram/FB/IndexNow — distribución real)
  → news-watch → article_lifecycles
  → registerCorrection (aprendizaje de ediciones humanas)
Cron: NIOS pipeline (GA4+GSC → reportes → meni_predictions validadas
      → learning-engine → tierOverrides → vuelve a evaluateMeni)
```

Las preguntas críticas que este documento responde:

1. Hay **dos brains** — `editorial-brain` (score dentro de MENI) y
   `editor-brain` (memoria post-publicación, saltado en el guardado).
   No son redundantes: uno evalúa, otro recuerda. El error arquitectónico
   es de naming y de visibilidad, no de duplicación funcional.
2. El **Supervisor es la autoridad única** de publicación; MENI es
   subordinado. Esa decisión ya está tomada en código — debe formalizarse.
3. Existen **mutadores laterales** (`enrich-links`, `enrich-strong`,
   `expandir-7`, `clean-seo`) que modifican `contenido` publicado sin
   re-evaluación — la violación de invariante más importante del sistema.
4. El **ciclo de aprendizaje existe end-to-end** pero es frágil:
   predictions→validation→patterns→tierOverrides→MENI está cableado;
   las colas de acción (distribución) no tienen ejecutor.
5. SEO está **subordinado** al análisis periodístico (es un analyzer que
   produce metadata, no un decisor) — eso es correcto y debe conservarse.

---

## 2. CURRENT EDITORIAL LIFECYCLE

Cada etapa: componente · archivo · función · ¿ejecuta? · input → output ·
consumidor · estado.

| # | Etapa | Componente real | Archivo / función | ¿Ejecuta? | Input → Output | Consumidor | Estado |
|---|-------|-----------------|-------------------|-----------|----------------|------------|--------|
| 1 | INPUT | Rutas de guardado (3) | `app/api/admin/guardar-directo/route.ts` POST L44 · `news/route.ts` POST L154 · `articles/route.ts` POST L12 | SÍ | JSON {titulo,contenido,resumen,categoria,…} → NoticiaInput | guardarConMeni | ACTIVE + DUPLICATED (3 vías) |
| 2 | FACT EXTRACTION | pipelineV4 | `lib/editorial/core/pipeline.ts` `evaluate()` — llamada en `core.ts:148` | SÍ | NoticiaInput → EvaluacionEditorial {evidence: textoPlano, entidades, hechos…} | editorial-brain, analyzers | ACTIVE |
| 3 | SOURCE / EVIDENCE | quote-guard + trust + extractor | `lib/editorial/quote-guard.ts` `validateQuotesAndAttributions` · `trust.ts` `analyzeTrust` · `extractor.ts` | PARCIAL | contenido+fuente → fabricatedQuotes[] / TrustReport | gate de publicación (quote-guard); trust solo en PUT post-save | PARTIAL — quote-guard solo corre en editor-autonomo y decision-gate, NO en guardar-directo/news (HIGH: grep de callers) |
| 4 | CONTEXT | contextualiza + knowledge-base | `meni/contextualiza.ts` `computeContextScore` (core.ts:269) · `meni/knowledge-base/knowledge-query.ts` | SÍ / PARCIAL | noticia+corpus → contextScore / knowledgeQuery | editorialReason (visible) / editorial-brain | ACTIVE (context) / PARTIAL (kb solo si editorJefe.knowledgeQuery presente) |
| 5 | JOURNALISTIC ANALYSIS | editorial-brain | `meni/editorial-brain/index.ts` `runEditorialBrain` (core.ts:156) — 9 sub-motores: news-value, competition, NI-engine, verification, utility-gate… | SÍ | input+evaluacion+perfil → EditorialDecision {score, editorialDna, bloquear, acciones} | MENI (deriva todo) | ACTIVE |
| 6 | READER VALUE | reader-questions + retention + public-value + utility-gate | `meni/editorial-brain/reader-questions-engine.ts` etc. | SÍ (dentro de editorial-brain) | noticia → sub-scores ADN NI | score final | ACTIVE pero solo como score — no produce guía al escritor |
| 7 | STORY STRUCTURE | story-planner + story-editor | `meni/story-planner/index.ts` · `lib/editorial/story-editor/` | PARTIAL | input → story plan (manual vía `/api/admin/story`) | Supervisor recibe `input.story` | PARTIAL — existe pero es opcional/manual, no etapa del pipeline |
| 8 | WRITING | ninguno en el flujo canónico | editor-autonomo (`generarArticuloAutonomo`) existe pero solo `/api/admin/meni/generar` | NO en producción | fuente → artículo | — | El sistema NO escribe: recibe texto externo. MISSING como etapa (por diseño actual) |
| 9 | EDITORIAL REVIEW | MENI diagnostics + autocorrect | `meni/core.ts` + `autocorrect.ts` `autoCorrectNoticia` (core.ts:426) | SÍ | issues → auto-correcciones + re-evaluación | aprobado/blockingIssues | ACTIVE — MENI auto-corrige y re-evalúa (loop L423-430) |
| 10 | SEO | analyzeSEO + meta | `meni/seo.ts` (core.ts:170) · `lib/editorial/meta.ts` `generarMetaDescription` | SÍ | evaluacion → MeniSEO + metaDescripcion | updateData.seo, panel | ACTIVE — advisory, no decide |
| 11 | QUALITY / SAFETY | quality-gate + content-integrity | `meni/quality-gate/` `runQualityGate` (core.ts:191) · `lib/editorial/content-integrity.ts` | SÍ | contenido → issues blocking / defectos mecánicos | aprobado (QG) / REJECT 400 (integrity) | ACTIVE |
| 12 | PUBLICATION DECISION | Editorial Supervisor | `lib/supervisor/editorial-supervisor.ts` `makeEditorialDecision` (guardar-con-meni.ts:85) | SÍ | MENI result + input → verdict PUBLICAR/PUBLICAR_CON_CAMBIOS/NO_PUBLICAR | rutas bloquean con 400 | ACTIVE — única autoridad |
| 13 | PUBLICATION | Firestore write | las 3 rutas (`docRef.set`/`update`) | SÍ | updateData → doc noticias/{id} | sitio público | ACTIVE |
| 14 | DISTRIBUTION | publication-pipeline | `meni/publication-pipeline.ts` `runPublicationPipeline` | SÍ | noticia → Telegram+FB+IndexNow+push; update {distribuida:true} | canales externos | ACTIVE — única distribución real |
| 15 | AUDIENCE MEASUREMENT | NIOS collectors GA4+GSC | `lib/nios/collectors/{ga4,gsc}.ts` → `intelligence/orchestrator.ts` `runNIOSPipeline` | SÍ (cron 08:00) | APIs Google → snapshots + ~15 reportes | panel (lectura pasiva) | ACTIVE (colecta) / PARTIAL (consumo) |
| 16 | POST-PUBLICATION REVIEW | news-watch + supervisor-watch | `lib/news-watch/watch-engine.ts` `runWatchCycle` → article_lifecycles · cron supervisor-watch `runSupervisorWatchCycle`+`applySafeAutoFixes` | SÍ | nota publicada → updates detectados / issues auto-fixables | article_lifecycles; autofix muta categoria/publishedAt | ACTIVE (watch) — autofix sin re-evaluación |
| 17 | LEARNING | editor-jefe + learning-engine + prediction-validator | `meni/editor-jefe/correction-tracker.ts` `registerCorrection` (PUT) · `learning-engine/learning-adapter.ts` `loadActiveAdjustments` (core.ts:453) · `prediction-validator.ts` `validateMeniPredictions` (orchestrator.ts:343) | SÍ | ediciones humanas + predicciones → patterns → tierOverrides | evaluateMeni (vuelve al score) | ACTIVE end-to-end — congelado por política |
| 18 | FOLLOW-UP / UPDATE | news-watch state ACTUALIZACION + update-engine report | `watch-engine` · `nios/intelligence/update-engine.ts` (genera reporte) | PARCIAL | detección de cambios → lifecycle state / reporte | reporte sin actor editorial | PARTIAL — detecta, no dispara actualización |

## 3. CURRENT CAPABILITY MAP

Para cada componente: A qué hace / B dónde corre / C quién llama / D qué
produce / E quién consume / F ¿afecta decisión? / G ¿conectado al flujo? /
H ¿duplica? / I ¿sobrevive? / J ¿función del brain único?

### MENI (`lib/meni/core.ts`)
A. Evaluador integral: orquesta evidencia→brain→analyzers→QG→score→aprobado.
B. En `guardarConMeni` (las 3 rutas de guardado) + `meni/evaluar` (preview).
C. guardar-directo, news POST/PUT, articles POST, meni/generar, depto worker.
D. MeniResult {scoreFinal, aprobado, calificacion, diagnostico, blockingIssues, recomendaciones, seo, eeat, editorialDna…}.
E. Supervisor (input principal), rutas (updateData), panel.
F. SÍ — `aprobado` es condición necesaria (no suficiente).
G. SÍ — núcleo del flujo.
H. Parcialmente solapa análisis con editorial-brain (su motor interno).
I. SÍ.  J. Es el **evaluador** del brain único.

### editorial-brain (`lib/meni/editorial-brain/`)
A. Motor del score editorial: 9 sub-engines (news-value, competition,
nicaragua-informate, reader-questions, explanation, difference,
public-value, retention, story-completeness) + utility-gate + verification.
B. Dentro de evaluateMeni (core.ts:156).
C. runMeni (único llamador).
D. EditorialDecision {score, editorialDna{adnNI, exclusividad, wow, selloNI},
bloquear, acciones, riesgoEditorial, mensajeEditor}.
E. MENI deriva TODO de él ("una sola verdad" — core.ts:226).
F. SÍ — es el score. G. SÍ, núcleo. H. NO (ver §4). I. SÍ.
J. Es el **corazón analítico** del brain único.

### editor-brain (`lib/meni/editor-brain/`)
A. Memoria editorial del corpus: `runEditorBrain` (patrones del conjunto
publicado) e `ingestPublishedArticle` (aprende de cada publicada).
B. `ingestPublishedArticle` corre post-evaluación en core.ts:596;
`runEditorBrain` solo si `!skipEditorBrain`.
C. core.ts — pero **TODOS los callers productivos pasan skipEditorBrain:true**
(guardar-con-meni.ts:62). Solo editor-autonomo lo ejecuta realmente.
D. EditorBrainResult (patrones, estadísticas del corpus).
E. En teoría alimenta la evaluación contextual; en producción se salta.
F. NO en producción actual. G. PARCIAL (ingest sí, brain no).
H. Solapa *conceptualmente* con editor-jefe/learning-engine (ambos
"aprenden del corpus") pero con mecanismo distinto.
I. SÍ la capacidad (memoria de corpus); el componente es candidato a
consolidarse con learning-engine. J. Función **learning/memory**.

### Editorial Supervisor (`lib/supervisor/editorial-supervisor.ts`)
A. Decisor: `makeEditorialDecision` + watch cycle + autofixes + cost-guard.
B. En guardarConMeni (decisión) + cron supervisor-watch 04:00.
C. guardar-con-meni, cron.
D. SupervisorDecision {verdict, confidence, issues, actions, resultingState}.
E. Rutas (bloqueo 400), Firestore (supervisorDecision persistida).
F. SÍ — autoridad final; puede bloquear lo que MENI aprobó.
G. SÍ. H. NO. I. SÍ. J. Es la **autoridad** — fuera del brain, encima de él.

### Quality Gate (`lib/meni/quality-gate/`)
A. Verificación técnica: contradicciones, transcripción, duplicados internos;
autoFix interno (`applyAutoFix`).
B. Dentro de evaluateMeni (core.ts:191).
D. issues {severidad:blocking}, motivosBloqueo, textoCorregido.
F. SÍ — issues blocking niegan aprobado (core.ts:217-240).
G. SÍ. H. Solapa leve con content-integrity (distinto dominio: QG es
semántico, integrity es mecánico). I. SÍ. J. Función **quality**.

### Research (`lib/research/`)
A. Agente LLM de investigación (fuentes, contexto, verificación).
B. `/api/admin/research` POST — manual.
C. Panel (humano lo invoca). D. ResearchResult → `input.research`.
E. Supervisor lo recibe (guardar-con-meni.ts:100) — afecta verdict.
F. SÍ (como evidencia de la decisión). G. PARCIAL — manual, fuera del flujo
automático. I. SÍ. J. Función **research** previa a análisis.

### Story Planner / Story Editor (`meni/story-planner/`, `editorial/story-editor/`)
A. Planificación de estructura narrativa.
B. `/api/admin/story` POST — manual.
D. story/StoryProposal → `input.story`. E. Supervisor (input opcional).
F. Débil. G. PARCIAL. H. Solapa con story-completeness-engine (que evalúa
estructura sin planificar). I. SÍ como capacidad. J. Función
**story-structure** — hoy evalúa estructura, no la produce.

### Reader Journey (`meni/reader-journey/`, `lib/nios/reader-experience/`, `app/api/telemetry/journey`)
A. Tres cosas distintas con el mismo nombre conceptual:
reader-questions-engine (dentro de editorial-brain, activo),
telemetry/journey (endpoint que recibe eventos de lectura),
nios/reader-experience (muerto).
E. telemetry → almacena eventos; consumo no evidenciado en decisiones.
F. NO directo. G. PARCIAL. J. Función **reader-value** + métrica de
audiencia (la telemetría debería alimentar learning).

### SEO (`meni/seo.ts`, `lib/seo/`, `lib/editorial/meta.ts`, JsonLdSchema)
A. analyzeSEO produce MeniSEO (advisory); meta.ts genera metaDescripción;
lib/seo/* sirven sitemap/schema/canonical en producción pública.
F. NO decide publicación (score SEO es informativo en MENI).
G. SÍ. H. `seo-toxic.ts`/`seo-cleanup.ts` son utilidades paralelas menores.
I. SÍ. J. Función **seo** subordinada a journalism.

### Fact checking / verificación
A. Tres capas: `editorial-brain/verification.ts` (dentro del score),
`quote-guard.ts` (cita-vs-fuente), `trust.ts` `analyzeTrust` (diagnóstico
HECHOS/ATRIBUCIONES/NO_CONFIRMADA persistido en `confianza`).
B. verification: en MENI. quote-guard: editor-autonomo + decision-gate.
trust: PUT post-save + `/api/admin/nota-trust` (read-only).
F. verification sí (vía score); quote-guard sí donde corre; trust NO decide
(persiste señal). H. Solapan parcialmente — tres detectores de "fuente".
J. Consolidar en función **evidence/verification** del brain.

### Audience analysis
A. `audience-intelligence.ts` (muerto), GA4/GSC collectors (activos),
`content-mix`/`category-intelligence` reports (activos, sin consumidor),
telemetry/journey.
F. NO — ninguna métrica de audiencia altera una decisión editorial hoy.
J. Función **measurement** → debe alimentar learning (solo lo hace vía
prediction-validator).

### Learning Engine (`meni/learning-engine/` + `editor-jefe/`)
A. Ciclo gobernado: correcciones humanas → `editor_corrections` →
`editor_patterns` (OBSERVED→CANDIDATE→VALIDATING→APPROVED→ACTIVE);
`loadActiveAdjustments` → tierOverrides en evaluateMeni;
`meni_predictions` escritas en guardar-directo:373, validadas por
`validateMeniPredictions` en orchestrator:343 (minAgeDays:7).
B. PUT (corrections), evaluateMeni (adjustments), cron NIOS (validation).
F. SÍ — los ACTIVE adjustments modifican umbrales de tier en evaluateMeni
(core.ts:133-134). G. SÍ — el único bucle cerrado real del sistema.
I. SÍ. J. Es la función **learning** del brain — ya existe y funciona.

### NIOS (`lib/nios/`, orchestrator + ceo-loop)
A. Plataforma de observación de negocio: colecta GA4/GSC, genera ~15
reportes, snapshot diario, CEO loop (observe→decide→execute→verify→learn),
propone acciones.
C. cron nios-collect + nios-ceo-loop + rutas admin.
D. snapshots, reportes, `nios_distribution_queue` (PREPARED), nios_memory.
E. Panel (lectura). Las acciones "ejecutadas" encolan PREPARED que
**nadie envía** (action-engine.ts:340-380 — la propia nota del código dice
"Todavía no se envió realmente a Telegram").
F. NO sobre publicación; sí sobre sí mismo (memoria).
G. PARCIAL — observa todo, no cierra ningún acto externo.
I. SÍ como capa de observación; NO como autoridad editorial.
J. NIOS queda **fuera** del brain: es el sistema nervioso de negocio, no
el editor.

## 4. TWO-BRAIN ANALYSIS

| | editorial-brain | editor-brain |
|---|---|---|
| Archivo | `lib/meni/editorial-brain/` | `lib/meni/editor-brain/` |
| Función | Evaluar ESTA nota → score/ADN/decisión | Aprender del CORPUS publicado → patrones |
| Naturaleza | Analítico (por nota) | Memorístico (por corpus) |
| En el guardado | SIEMPRE (core.ts:156) | SALTADO (skipEditorBrain:true, guardar-con-meni.ts:62) |
| Ingesta | — | `ingestPublishedArticle` corre sí (core.ts:596) |
| Consume | input + pipelineV4 | corpus Firestore |

**Por qué existe skipEditorBrain**: la llamada es `await`/Firestore-heavy
(corre el brain sobre el corpus en cada evaluación — costo/latencia).
guardar-con-meni lo desactiva por defecto (`?? true`). La decisión está en
`guardar-con-meni.ts:60-63`. Evidencia HIGH.

**Qué se pierde al saltarlo**: el contexto de corpus (qué patrones ya
publicados se parecen, saturación) no alimenta la evaluación de la nota
nueva en el flujo canónico. `ingestPublishedArticle` sí corre — el brain
**escribe memoria pero no la lee** en producción.

**Veredicto**: no son duplicados funcionales — son dos mitades de una
capacidad "análisis + memoria" mal nombradas. La confusión es de naming.

**Decisión conceptual propuesta** (sin implementar):

```
EDITORIAL BRAIN (único)
  ├── evaluate()      ← hoy: editorial-brain + pipelineV4 + analyzers + QG
  ├── verify()        ← hoy: verification + quote-guard + trust + integrity
  ├── readerValue()   ← hoy: reader-questions + retention + public-value + utility
  ├── structure()     ← hoy: story-completeness (evalúa) + story-planner (planifica)
  ├── seo()           ← hoy: analyzeSEO + meta
  ├── memory()        ← hoy: editor-brain (corpus) — reconectar lectura
  └── learn()         ← hoy: editor-jefe + learning-engine + prediction-validator
```

`evaluate()` produce el dictamen; `learn()`/`memory()` alimentan y son
alimentados. El Supervisor permanece FUERA del brain (autoridad, no análisis).

## 5. AUTHORITY MODEL

### Quién decide qué (evidencia)

| Actor | Puede decidir | Puede bloquear | Evidencia |
|---|---|---|---|
| content-integrity | rechazar request (400) | defecto mecánico/fabricado | routes + content-integrity.ts |
| MENI | `aprobado` true/false + recomendaciones | score<85, bloquear, QG-blocking, transcripción | core.ts:236-240 |
| **Supervisor** | PUBLICAR / PUBLICAR_CON_CAMBIOS / NO_PUBLICAR | puede decir NO aunque MENI apruebe | guardar-con-meni.ts:81-109, rutas 400 SUPERVISOR_BLOCKED |
| Humano (panel) | guardar/publicar/editar | — (sujeto a los de arriba) | news/[id] PUT, guardar-directo |

**¿Una decisión BLOCKED se revierte?** No hay mecanismo de apelación:
un re-save re-evalúa de cero. `computePublicationAllowed` hace la decisión
inmutable una vez publicada (publication-gate test). HIGH.

**¿Algún mutator se salta la decisión?** SÍ — ver tabla.

### Tabla de mutadores (§4 requerida)

| Proceso | Modifica contenido | Modifica título | Publica | Re-evalúa MENI | Re-evalúa Supervisor | Riesgo |
|---|---|---|---|---|---|---|
| news POST (crear) | escribe nuevo | sí | sí | sí | sí | bajo |
| news/[id] PUT (contenido) | sí | sí | sí | sí | sí | bajo |
| news/[id] PUT (metadata) | no | no | sí (si ya aprobado) | no | no | bajo |
| guardar-directo | sí | sí | sí | sí | sí | bajo |
| articles POST | sí | sí | sí | sí | sí | bajo |
| **enrich-links** | **sí (append)** | no | — | **NO** | **NO** | **ALTO — origen del defecto `<li>` roto** |
| **enrich-strong** | **sí (strongs)** | no | — | **NO** | **NO** | **ALTO** |
| **expandir-7** | sí (reescribe) | no | — | NO (resetea aprobado=false) | NO | ALTO — deja nota publicada sin aprobación |
| **clean-seo** | sí (limpia) | no | — | NO (resetea) | NO | ALTO |
| supervisor-watch `applySafeAutoFixes` | no (categoria, publishedAt) | no | — | NO | NO | medio — muta categoría post-decisión |
| autoCorrectNoticia (en runMeni) | sí (antes de persistir) | posible | — | sí (re-evalúa loop) | sí (contenido final evaluado) | bajo — ocurre DENTRO de la evaluación |
| publication-pipeline | no (distribuida:true, social_copies) | no | — | n/a | n/a | bajo — metadata técnica |
| news-watch | no (article_lifecycles) | no | — | n/a | n/a | bajo |
| departamento-central worker | no (meni_diagnosis) | no | — | n/a | n/a | bajo — diagnóstico paralelo |
| CEO action-engine | no (queues propias) | no | — | n/a | n/a | bajo |
| correcciones page → PUT | sí | sí | — | sí | sí | bajo |

## 6. EDITORIAL INVARIANTS

**Invariante propuesta (casa con el código existente):**

> **INV-1**: Ningún proceso puede publicar o modificar material editorial
> sustantivo después de la decisión editorial sin pasar por la política de
> re-evaluación correspondiente.

Clasificación:

- **Sustantivo** (requiere re-evaluación completa MENI+Supervisor):
  título, cuerpo, hechos, citas, atribuciones, contexto, conclusión,
  afirmaciones, enlaces que añaden significado (→ `enrich-links`,
  `enrich-strong`, `expandir-7`, `clean-seo` HOY violan INV-1).
- **Técnico/no sustantivo** (permitido sin re-evaluación, con logging):
  caché, `distribuida`, `vistas`, `publishedAt`, `categoria` canónica
  (autofix), `confianza` persistida, `noindex`, `dateModified`.

El código YA respeta INV-1 en las rutas principales (PUT con contenido →
MENI+Supervisor obligatorios). La violación está en los mutadores laterales.
Implementación futura = canalizar esos mutadores por la puerta, no crear
un motor nuevo.

**INV-2 (propuesta)**: toda escritura a `noticias` pasa por un único
módulo de persistencia — hoy hay 3 rutas equivalentes + mutadores que
hacen `doc.update({contenido})` directo.

## 7. READER VALUE MODEL

Qué existe hoy (todo dentro del score, nada llega al escritor como guía):

| Capacidad | Componente real | Produce hoy |
|---|---|---|
| ¿Qué preguntas responde? | `reader-questions-engine.ts` | sub-score ADN |
| Retención | `reader-retention-engine.ts` | sub-score |
| Valor público | `public-value-engine.ts` | sub-score |
| Utilidad | `utility-gate.ts` | gate/score |
| Contexto | `contextualiza.ts` `computeContextScore` | score + reason |
| Completitud | `story-completeness-engine.ts` | sub-score |
| Explicación | `explanation-engine.ts` | sub-score |

**Brecha**: el sistema *puntúa* el valor para el lector pero nunca lo
*articula* — no existe un output "esta nota no responde X, agrégalo".

Especificación objetivo (solo spec):

```
READER VALUE
├── immediate information    (qué pasó — hechos verificados)
├── context                  (por qué importa — contextualiza)
├── relevance                (a quién le afecta — public-value)
├── clarity                  (legibilidad — retention)
├── practical implications   (qué cambia para el lector — utility)
├── unanswered questions     (qué NO sabemos — verification/trust)
└── follow-up                (qué sigue — watch/lifecycle)
```

## 8. JOURNALISM vs SEO

**Journalism** (precisión, fuentes, atribución, contexto, honestidad):
editorial-brain (9 engines), verification, quote-guard, trust layer,
content-integrity, supervisor. — la capa dominante del sistema.

**SEO** (título, intención, estructura, entidades, metadata, schema):
`meni/seo.ts` (advisory score), `lib/editorial/meta.ts`, `lib/seo/*`
(sitemap, canonical, toxic), JsonLdSchema, google-indexing.

**¿SEO puede modificar una decisión periodística?** NO en el flujo canónico:
analyzeSEO produce metadata y un sub-score informativo; `aprobado` deriva
del editorial-brain score + bloqueos, no del SEO score (core.ts:236-240).
HIGH. La única excepción histórica son los mutadores SEO (`clean-seo`,
`expandir-7`) que reescriben contenido por motivos SEO — eso ES SEO
alterando periodismo, y es exactamente la violación INV-1.

Principio a formalizar: *SEO optimiza la presentación de una decisión
periodística ya tomada; nunca la cambia.*

## 9. AUDIENCE / DISTRIBUTION

| Métrica/canal | Entra | Se muestra | Produce decisión | Produce aprendizaje | Consumida |
|---|---|---|---|---|---|
| GA4 (páginas, sesiones) | sí (collector) | sí (dashboards) | no | indirecto (snapshot momentum → alerts) | parcial |
| GSC (queries, CTR, posición) | sí (collector) | sí | no | vía meni_predictions validation | parcial |
| Telegram/FB/IndexNow/push | sale (publication-pipeline) | — | n/a | — | real |
| `nios_distribution_queue` | CEO escribe PREPARED | panel nios-queues | NO | NO | **NUNCA — ORPHANED_OPERATIONAL_CAPABILITY** |
| telemetry/journey | endpoint existe | ? | no | no | desconocido |
| article_lifecycles | watch escribe | ? | no | no | parcial |

`nios_distribution_queue`: escritor = action-engine.ts:357; lector = solo
`app/api/admin/nios-queues` (vista admin); ejecutor = **ninguno**;
marcador de enviado = ninguno; medidor de resultado = ninguno.
→ `ORPHANED_OPERATIONAL_CAPABILITY`.

## 10. LEARNING LOOP

Ciclo real verificado end-to-end:

| Paso | Evidencia | Estado |
|---|---|---|
| OBSERVE | `registerCorrection` captura diff de ediciones humanas (news/[id] PUT L128-154); `meni_predictions` escritas en guardar-directo:373 | REAL |
| MEASURE | `validateMeniPredictions` corre en orchestrator:343 (diario, minAge 7d) contra datos reales | REAL |
| ANALYZE | `editor_patterns` derivados de corrections; `learning_cycles` | REAL |
| GENERATE INSIGHT | learning-engine/insight-generator, pattern-analyzer | REAL (en código) |
| VALIDATE | gobierno OBSERVED→CANDIDATE→VALIDATING→APPROVED (lifecycle.ts; tests/learning-governance) | REAL |
| CHANGE | `loadActiveAdjustments` → `tierOverrides` en evaluateMeni (core.ts:133, 449-454) | REAL — cableado, congelado por política |
| MEASURE AGAIN | próximas predicciones validadas | REAL (mismo mecanismo) |

El bucle existe y está cableado. Lo que falta no es el mecanismo sino
**consumidores** de las otras señales (audiencia, distribución).

## 11. DEAD / LEGACY CLASSIFICATION (54 archivos)

| Clase | Archivos | Capacidad | ¿Duplicada? | ¿Recuperable? | ¿Valor para brain único? |
|---|---|---|---|---|---|
| B. DUPLICATE | `editorial/pipeline.ts`, `mapper-v3.ts`, `profile-loader.ts`, `editorial/profiles/{clima,cultura,economia,politica,salud,servicio,turismo}.ts` | pipeline V3 anterior | sí — reemplazado por core/pipelineV4 | no hace falta | NO — superado |
| B. DUPLICATE | `meni/editor-meni.ts`, `meni/penalizacion-editorial.ts`, `meni/profundidad.ts`, `meni/risk.ts`, `meni/taxonomy.ts`, `meni/utilidad.ts` | analizadores MENI viejos | sí — absorbidos por editorial-brain | no | NO |
| B. DUPLICATE | `editorial/supervisor-gate.ts`, `editorial-intelligence/index.ts`, `editorial/editorialEnhancerAction.ts`, `editorial/enhancer/` | gates/editores alternos | sí — supervisor canónico existe | no | NO |
| C. LEGACY | `meni/registry/index.ts`, `knowledge-base/{editorial-memory,internal-linking}.ts`, `meni/utils/{angles,entities}.ts`, `editorial/adsense-safety.ts` | utilidades viejas | parcial | selectivo | bajo |
| D. FUTURE CAPABILITY | `nios/revenue/*` (adsense,sustainability), `nios/growth/opportunities.ts`, `nios/executive/{morning-brief,weekly-report}.ts` | monetización/briefs | no | sí | MEDIO — métricas de negocio para NIOS, no para brain editorial |
| D. FUTURE CAPABILITY | `nios/reader-experience/*`, `content-lifecycle.ts`, `audience-intelligence.ts`, `distribution-intelligence.ts`, `revenue-intelligence.ts`, `internal-linking-engine.ts` | experiencia/audiencia | parcial | sí | ALTO si se conectan a measurement |
| E. EXPERIMENT | `nios/validators/*`, `nios/lifecycle/tracker.ts`, `nios/collectors/internal.ts`, `nios/intelligence/{index,ceo-status}.ts`, `nios/command-center/*` | prototipos NIOS | — | caso a caso | incierto |
| C. LEGACY | `api-error-handler.ts`, `dtos.ts`, `explainer.ts`, `image-loader.ts`, `discover-score.ts`, `observability/cost-control.ts`, `editorial-fix.ts` | helpers sin uso | — | no | NO |
| F. FALSE POSITIVE | `tests/lib/env.test.ts` | es test, no lib productivo | — | n/a | n/a |

(No se borra nada en esta fase.)

## 12. DOCUMENTATION CONTRADICTIONS

| Documento | Qué afirma | Qué muestra el código | Estado |
|---|---|---|---|
| `CURRENT_SYSTEM_TRUTH` (78befa95) | Estado del sistema con verifiedAgainst commit | Corresponde al código (fixes reales) | CURRENT |
| `docs/SYSTEM_REGISTRY.md` | Catálogo de módulos "integrados" | Varios módulos listados son inalcanzables | PARTIALLY TRUE |
| `FINAL-NIOS-PRODUCTION-REPORT.md` | NIOS operativo integral | NIOS observa pero no actúa (cola sin consumidor) | PARTIALLY TRUE |
| `FORENSIC_AUDIT_CERTIFICATION*.md` | Certificaciones de completitud | Certifican componentes hoy muertos | CONTRADICTED |
| `CEO_AGENT_CLOSURE_REPORT.md` / `FORENSIC_CEO_AUDIT.md` | CEO autónomo con ejecución | Acciones quedan PREPARED sin ejecutor | CONTRADICTED |
| `NIOS-CEO-FINAL-OPERATING-REPORT.md` | Loop operativo | Loop corre; sus efectos externos son nulos | PARTIALLY TRUE |
| Reportes históricos restantes (~40 *.md raíz) | estados pasados | historia | HISTORICAL |

## 13. KEEP / CONNECT / CONSOLIDATE / REPAIR / RETIRE / BUILD

**KEEP** (funcionan, preservar):
- guardar-con-meni (puerta única canónica)
- meni/core → editorial-brain (evaluación)
- editorial-supervisor (autoridad)
- quality-gate, quote-guard, content-integrity, sanitize, trust
- publication-pipeline (única distribución real)
- news-watch → article_lifecycles
- editor-jefe correction-tracker + learning-engine + prediction-validator
- NIOS collectors GA4/GSC + orchestrator + snapshots
- departamento-central (ops) — como capa de plataforma, no editorial

**CONNECT** (buenos pero desconectados):
- editor-brain memory → lectura en evaluación (hoy solo escribe)
- telemetry/journey → learning
- update-engine report → acción editorial real (follow-up)
- article_lifecycles → surface en flujo editorial
- knowledge-base query → ya cableado pero solo cuando presente

**CONSOLIDATE** (duplicados → una capacidad):
- 3 rutas de guardado → 1 puerta de persistencia
- 3 detectores de "fuente" (verification/quote-guard/trust) → verify()
- editor-brain + learning-engine memory → learn()/memory()
- story-planner + story-completeness → structure()
- meni_diagnosis (depto) → eliminar evaluación paralela, reusar meni/evaluar

**REPAIR**:
- enrich-links / enrich-strong → pasar por puerta editorial (INV-1)
- expandir-7 / clean-seo → idem (o retirar si sin uso)
- supervisor-watch autofix → limitar a no-sustantivo (ya lo es en la
  práctica: categoria/publishedAt) + logging
- related-links generator → causa raíz del `<li>` roto

**RETIRE** (sin ejecutar aún):
- lib/editorial/pipeline viejo + mapper-v3 + profile-loader + 7 profiles
- meni editor-meni, penalizacion-editorial, profundidad, risk, taxonomy,
  utilidad, registry
- editorial-intelligence/, enhancer/, supervisor-gate.ts
- nios subárboles muertos (validators, reader-experience, revenue si no se
  conectan, executive briefs)
- appx/ (binario), articulos-generados/, *.md históricos → docs/archived

**BUILD** (realmente inexistente):
- Consumidor de nios_distribution_queue (o decisión de retirarla)
- Output articulado de reader-value ("qué falta para el lector") hacia el
  escritor — hoy es solo score
- Follow-up editorial real: watch detecta ACTUALIZACION pero nadie actualiza
- Puerta de persistencia única (INV-2)

## 14. TARGET ARCHITECTURE

La evidencia sostiene esta arquitectura — es la que YA existe, formalizada:

```
                    ┌────────────────────────────┐
                    │  ENTRADA ÚNICA             │  ← 1 puerta (no 3)
                    │  (humano | externo)        │
                    └─────────────┬──────────────┘
                                  ↓
                    ┌────────────────────────────┐
                    │  INTEGRITY GATE            │  ← content-integrity
                    │  (defectos mecánicos)      │    + sanitize
                    └─────────────┬──────────────┘
                                  ↓
        ┌─────────────────────────────────────────────────┐
        │              EDITORIAL BRAIN (único)            │
        │                                                 │
        │  evaluate()   ← editorial-brain + pipelineV4    │
        │                 + analyzers (seo/eeat/forensic) │
        │  verify()     ← verification + quote-guard      │
        │                 + trust + duplicados            │
        │  readerValue()← reader-questions + retention    │
        │                 + public-value + utility        │
        │  structure()  ← story-completeness + planner    │
        │  seo()        ← analyzeSEO + meta (advisory)    │
        │  memory()     ← editor-brain corpus (RELEER)    │
        │  learn()      ← editor-jefe + learning-engine   │
        └────────────────────┬────────────────────────────┘
                             ↓  dictamen {score, issues, dna, reason}
                    ┌────────────────────────────┐
                    │  EDITORIAL AUTHORITY       │  ← Supervisor
                    │  (única decisión)          │    makeEditorialDecision
                    └─────────────┬──────────────┘
                             PUBLICAR / CON_CAMBIOS / NO_PUBLICAR
                                  ↓
                    ┌────────────────────────────┐
                    │  PERSISTENCE (única)       │  ← INV-2
                    └─────────────┬──────────────┘
                                  ↓
              ┌───────────────────┼───────────────────┐
              ↓                   ↓                   ↓
        DISTRIBUTION          WATCH               MEASUREMENT
        publication-pipeline  news-watch          GA4/GSC collectors
        (única real)          lifecycles          NIOS snapshots
              │                   │                   │
              └───────────────────┴───────────────────┘
                                  ↓
                          LEARNING (learn())
                  corrections → patterns → validation
                  → adjustments → (vuelve a evaluate)
```

Mutadores laterales (`enrich-*`, `expandir-7`, `clean-seo`) → **detrás de
la puerta o eliminados**. NIOS queda fuera: observación de negocio,
no autoridad editorial.

## 15. 10-ARTICLE VALIDATION PLAN (diseño, sin ejecutar)

| # | Tipo | Input | Comportamiento editorial esperado | Reader value esperado | SEO esperado | Decisión esperada | Follow-up | Métricas |
|---|---|---|---|---|---|---|---|---|
| 1 | Suceso con fuente | nota policial atribuida | hechos+atribución separados, provisional honesto | qué/dónde/cuándo claro | entidades+schema | PUBLICAR | watch MONITOREO | score, trust nivel |
| 2 | Accidente sin causa confirmada | nota sin causa | NO convertir hipótesis en hecho | causa marcada como en investigación | — | PUBLICAR_CON_CAMBIOS o PUBLICAR | ACTUALIZACION al confirmar causa | provisional flags |
| 3 | Nacional institucional | comunicado oficial | fuente institucional atribuida | utilidad práctica | meta correcta | PUBLICAR | — | eeat |
| 4 | Internacional | despacho agencia | contexto NI-angle | relevancia local | canonical | PUBLICAR | — | contextScore |
| 5 | Deportes resultado | resultado confirmado | no convertir previa en resultado | marcador+contexto | sports schema | PUBLICAR | — | sports-classifier |
| 6 | Espectáculos | evento cultural | sin fuente forzada si es descriptiva | qué/cuándo/dónde | event schema | PUBLICAR | — | profile=cultura |
| 7 | Tecnología | lanzamiento | sin citas fabricadas | implicación práctica | — | PUBLICAR | — | CITA_FABRICADA=0 |
| 8 | Info incompleta | nota con datos faltantes | uncertainty expresada honestamente, NO rellenar | "qué no sabemos" explícito | — | PUBLICAR_CON_CAMBIOS | watch hasta completar | noDisponible>0 OK |
| 9 | Fuentes contradictorias | dos versiones | ambas presentadas, ninguna como hecho | conflicto explícito | — | NO_PUBLICAR o CON_CAMBIOS | — | CONTRADICTION |
| 10 | Requiere seguimiento | caso en curso | marcada para watch | follow-up plan | — | PUBLICAR + watch | ACTUALIZACION detectada→update real | lifecycle state |

Para cada caso: input = doc real de `noticias` del tipo; ejecutar
runMeniAsync + makeEditorialDecision en dry-run; comparar verdict vs
esperado; verificar que verify() detecte lo esperado; verificar que el
output incluya razón legible (editorialReason).

## 16. IMPLEMENTATION DEPENDENCIES

Orden lógico (no ejecutar sin autorización):

1. Formalizar INV-1/INV-2 → canalizar mutadores por la puerta (depende de nada)
2. Consolidar rutas de guardado → una puerta de persistencia
3. Reconectar editor-brain memory → evaluate (quitar skipEditorBrain con caché)
4. Unificar verify() (verification+quote-guard+trust) — quote-guard hoy no corre en guardar-directo
5. Consumidor de distribution_queue O retiro
6. Reader-value articulado (output para el escritor)
7. Follow-up real (watch ACTUALIZACION → flujo de actualización)
8. Retiro de dead code (último — cosmético)

Dependencias externas: el generador de contenido vive FUERA del repo —
ninguna refactorización interna lo corrige; content-integrity es el muro.

## 17. RISKS

- **Reconectar editor-brain**: costo/latencia en cada guardado (razón
  original del skip) — requiere caché, no activación ingenua.
- **Cerrar mutadores laterales**: si el panel/ops depende de enrich-links
  para SEO, bloquearlos sin alternativa rompe flujo — requiere migrar la
  capacidad dentro de la puerta.
- **Consolidar rutas**: guardar-directo tiene comportamiento divergente
  documentado (related_links distintos) — la unificación debe preservar
  el comportamiento correcto, no el cómodo.
- **Learning adjustments**: reactivar tierOverrides sin gobierno reabriría
  lo que se congeló — mantener OBSERVED→APPROVED gate.
- **Confusión de autoridad**: departamento-central escribe meni_diagnosis
  que parece evaluación pero no decide — riesgo de que alguien la use como
  autoridad.

## 18. OPEN QUESTIONS (requieren decisión humana)

1. ¿La generación de contenido seguirá siendo externa? Si sí, la puerta de
   entrada es el boundary correcto y editor-autonomo queda como herramienta
   manual. Si no, el flujo cambia de raíz.
2. ¿nios_distribution_queue se conecta a un envío real (Telegram) o se
   retira formalmente?
3. ¿Las 3 rutas de guardado se consolidan en una, o se mantienen por
   compatibilidad del panel con alias interno?
4. ¿enrich-links/enrich-strong son usados hoy por operación real? (Si sí →
   migrar capacidad; si no → retirar.)
5. ¿editor-brain memory se reconecta con caché o su capacidad se absorbe en
   learning-engine?
6. ¿El Supervisor mantiene veto absoluto sobre MENI en todos los casos, o
   hay clase de bloqueos técnicos donde MENI es suficiente?
7. ¿Qué nivel de automatización post-publicación es aceptable (autofix de
   categoría ya corre sin humano)?
8. ¿NIOS sigue siendo sistema de observación separado, o su capa editorial
   (diagnosis, editorial-score) se absorbe en el brain?

## 19. EVIDENCE INDEX

| Afirmación | Evidencia | Conf. |
|---|---|---|
| Supervisor = única autoridad | guardar-con-meni.ts:81-114 + bloqueo 400 en ambas rutas | HIGH |
| editorial-brain = fuente del score | core.ts:153-156, 224-240 | HIGH |
| editor-brain saltado en guardado | guardar-con-meni.ts:60-63 (`?? true`) | HIGH |
| enrich-links muta contenido post-publish | enrich-links/route.ts:76-79,137-138 | HIGH |
| expandir-7/clean-seo resetean aprobado | expandir-7/route.ts:45, clean-seo/route.ts:54 | HIGH |
| publication-pipeline solo marca metadata | publication-pipeline.ts:347 | HIGH |
| distribution_queue sin consumidor | action-engine.ts:340-380 ("no se envió realmente"); solo vista admin | HIGH |
| Learning loop cableado | guardar-directo:373 → orchestrator:343 → core.ts:453/133 | HIGH |
| 54 archivos inalcanzables | .audit/reach2.mjs BFS desde 195 entrypoints | HIGH |
| autoCorrect re-evalúa dentro de MENI | core.ts:423-430 | HIGH |
| autofix supervisor muta categoria/publishedAt | editorial-supervisor.ts:729-790 | HIGH |
| meni_diagnosis sin consumidor | workers.ts:87-97 (add, nunca leído para decidir) | MEDIUM |
| quote-guard no corre en guardar-directo | callers: editor-autonomo + decision-gate solamente | HIGH |
| story/research manuales fuera del flujo | rutas admin individuales | HIGH |
| telemetría journey sin consumo en decisión | endpoint existe; ningún lector en flujo | MEDIUM |
