# MENI Learning 4.0 — Implementación del circuito de aprendizaje gobernado

**Fecha:** 2026-10-02 · **Branch:** `master` · **Base:** `b95ba909`
**Regla rectora cumplida:** MENI aprende, pero NO se auto-programa.
Nada de lo implementado modifica automáticamente scores, Quality Gates,
Forense, Supervisor ni decisiones de publicación.

---

## 1. Arquitectura anterior (estado real verificado)

La auditoría `.audit/MENI_522_APRENDIZAJE_FORENSE.md` demostró que la
infraestructura de aprendizaje existía pero el circuito estaba abierto:

| Canal | Antes | Desconexión |
|---|---|---|
| `editor_corrections` | 0 | Las mutaciones nunca registraban corrección |
| `editor_patterns` | 0 | Sin correcciones → sin evidencia → sin patrones |
| `learning_cycles` | 0 | `runLearningCycle` no tenía caller |
| `meni_predictions` | 352 | Validadas por NIOS, nunca consumidas por MENI |
| `kb_entities` / `kb_relations` / `kb_timeline` | 17 / 0 / 0 | `ingestArticle` fallaba en silencio (bug `undefined`) |
| `meni_decision_log` | 40 | Write-only, sin lector |
| `meni_false_positives` | no existía | Sin memoria de errores del sistema |
| mutationLog | 125 eventos | Todos TECHNICAL, sin antes/después |

Además `score` no podía moverse por memoria: se computaba antes de
adjuntar `patronesAplicados`/`saturacion`/`memoriaEditorial`.

## 2. Las 7 conexiones implementadas

### 2.1 Mutación sustantiva → corrección real (FASE 1)

`lib/editorial/mutation-policy.ts → applySubstantiveMutation` ahora
registra cada campo sustantivo realmente cambiado en `editor_corrections`,
con clasificación `kind` (`AUTO_CORREGIBLE | SUGERENCIA_EDITORIAL |
DECISION_HUMANA | FALSO_POSITIVO | DECISION_SUPERVISOR`) inferida del actor
(`inferCorrectionKind`) y filtro de cambios triviales (`isTrivialChange`:
normaliza HTML/whitespace — una edición cosmética no es decisión
editorial). El PUT del panel (`app/api/admin/news/[id]`) y
`guardar-directo` etiquetan sus correcciones como `DECISION_HUMANA` con
`origen` trazable.

### 2.2 Corrección → patrón con evidencia (FASE 2)

`correction-tracker.ts`: `registerCorrection` rechaza triviales;
`detectAndPersistPattern` (ahora exportado para el harvest) solo cuenta
**evidencia humana** (`kind === DECISION_HUMANA` o legado `undefined`) —
50 aplicaciones idénticas de una regla del sistema NO fabrican un patrón.
El patrón conserva frecuencia, confianza, ejemplos, estado gobernado
(`learningState`) y `version`.

### 2.3 Patrón ACTIVE → contexto explicable, no puntos (FASE 3/15)

`applyPatternsToDiagnostic` devuelve `trazas: PatronAplicadoTraza[]` y cada
sugerencia declara su evidencia:
`"Acortar titulo — el editor suele reducirlo [aprendido de N correcciones
del editor · confianza X% · vK]"`.
`runEditorialBrain` compone `decision.aprendizaje` (patrones + predicciones
+ falsos positivos + `conocimientoVersion`) y `buildVeredictoEjecutivo`
añade la frase "Conocimiento histórico de Nicaragua Informate: …".
**El score no se toca** — verificado en tests y en producción (30/30
scores idénticos antes/después).

### 2.4 Learning Engine con caller controlado (FASE 4)

- Nuevo `lib/meni/learning-engine/experience-harvest.ts`:
  correcciones → candidatos gobernados; `meni_decision_log` (REJECTED,
  códigos reales en `factuality[].code` + `blockingReason`) → candidatos a
  falso positivo (≥3 ocurrencias). Escribe resumen en `learning_cycles`.
- Nuevo cron `app/api/cron/meni-learning-cycle` (`0 6 * * 0`, semanal) +
  entrada en `vercel.json` y `DECLARED_CRONS` del Swiss Watch.
- `app/api/admin/meni-learning`: `run-cycle` manual +
  `report-false-positive`. Las transiciones de patrón siguen pasando por
  `transitionLearning` (OBSERVED→CANDIDATE→VALIDATING→APPROVED→ACTIVE→
  ROLLED_BACK); la activación es **solo humana**.
- `runLearningCycle` (existente) persistía ajustes de peso sin
  activarlos — se mantiene igual; `ENABLE_MENI_LEARNING` sigue apagado.

### 2.5 Knowledge Base: fix + backfill real (FASE 5)

**Bug raíz encontrado:** `ingestArticle` escribía campos `undefined`
(`description: info?.info`, `metadata.departamento`) → Firestore rechazaba
el documento → como el ingest post-publicación es fire-and-forget, la KB
quedó en 17 entidades sin que nadie lo notara. Fix: `withoutUndefined()`
antes de cada `set()` + escritura paralela por artículo (ids únicos por
artículo → sin carreras).

**Backfill real ejecutado** (`app/api/admin/kb-backfill` existe como
endpoint paginado por documentId; la corrida se hizo vía script con las
mismas funciones):

- 522 notas escaneadas en 6 lotes de 100 (`select` parcial, sin scan completo repetido)
- **489 publicadas procesadas, 33 no publicadas omitidas, 0 errores**

**Bug de costo corregido (P1-01 de SPRINT3_AUDIT):** `loadGraph` cargaba
las 3 colecciones completas por consulta (~12.9K docs tras backfill → 36s
en frío). `queryKnowledgeForArticle` ahora usa `loadScopedGraph`: getAll
de entidades extraídas + relaciones por `in` + timeline por entidad
(límite 25) + vecinos acotados (~60) → ~200–600 lecturas por evaluación.

### 2.6 Predicciones validadas → contexto (FASE 6)

Nuevo `lib/meni/learning-engine/prediction-context.ts`: solo documentos
`meni_predictions` con `validation.summary.validated > 0` (medidos contra
`noticias.publicado+estado` / `noticias.destacada` — nunca datos
pendientes ni insuficientes). Exige ≥3 validadas o devuelve `null`.
Cache 15 min. Se inyecta en `runMeniAsync` como
`editorJefe.predictionContext` → `aprendizaje.predicciones` → veredicto.

### 2.7 Memoria de falsos positivos (FASE 7)

- `quality-gate.ts` ahora compara defectos pre-autofix vs post-autofix y
  reporta `selfInducedDefects` (la firma exacta de CONCAT_MOTOCICLETA: el
  gate detectó la corrupción que el autofix introdujo).
- Nuevo `meni_false_positives` (registry con dedup por código+contexto,
  ocurrencias, articleIds, estados REGISTERED→CONFIRMED→FIXED/IGNORED).
- `runMeniAsync` registra `SELF_INDUCED_DEFECT` automáticamente y añade
  warnings trazables `FP_*` cuando un defecto del artículo ya está en
  memoria. **El bloqueo NO se relaja** — la memoria sirve para corregir el
  proceso previo (autofix), no para ignorar el gate.
- El bloque se ejecuta antes del early-return de `skipDuplicateCheck`
  (depende del Quality Gate, no del chequeo de duplicados).

### 2.8 Observabilidad y persistencia de la traza (FASE 9/13)

`guardar-con-meni` persiste `noticia.meniLearning` con la evaluación:
patrones usados (id, versión, casos, confianza), predicciones validadas,
tasa de acierto, falsos positivos presentes, `conocimientoVersion` y
timestamp — "¿por qué MENI recomendó esto?" deja de ser caja negra.

## 3. Datos reales — antes / después (producción, 2026-10-02)

| Métrica | Antes | Después | Fuente |
|---|---|---|---|
| `kb_entities` | 17 | **421** | censo Firestore |
| `kb_relations` | 0 | **8,217** | censo |
| `kb_timeline` | 0 | **4,259** | censo |
| `meni_false_positives` | 0 | **3** | 1 seed forense + 2 candidatos del harvest |
| `learning_cycles` | 0 | 3 | corridas reales del harvest |
| `editor_corrections` | 0 | **0** | ver §5 — honestidad |
| `editor_patterns` | 0 | **0** | sin correcciones humanas → sin evidencia → correcto que sea 0 |
| Predicciones con validación medida | 200/352 | igual | 48 con `summary.validated>0` consumibles |
| Evaluación consulta KB poblada | no | **sí** (69–189 notas relacionadas/eval) | evalKb |

Rechazos reales aprendidos del decision log (16 REJECTED en Supervisor):
`TRUST_SOURCE_MISSING` ×13, `VAGUE_ATTRIBUTION` ×6, `NO_ATTRIBUTION` ×2,
`UNSOURCED_MATERIAL_FIGURES` ×2, `FIELD_REPORT` ×1 → los dos códigos con
≥3 ocurrencias quedaron registrados como candidatos a revisión humana
(NO silenciados).

### Evaluación antes/después — 30 notas publicadas

| Indicador | Resultado |
|---|---|
| Notas evaluadas | 30 (+10 con KB poblada) |
| Scores idénticos antes/después | **30/30** — y 10/10 en la segunda muestra |
| Cambios en recomendación de publicación | **0** |
| Nuevos bloqueos del Quality Gate | **0** |
| Evaluaciones que usaron memoria (`aprendizaje.memoriaUtilizada`) | **30/30** y 10/10 |
| Latencia antes (media/mediana) | 97 ms / 74 ms |
| Latencia después (media/mediana) | 234 ms / 197 ms (KB de 17 entidades) |
| Latencia con KB poblada (scoped) | ~2.5–5.5 s desde dev-box — dominada por red local→Firestore; en Vercel (misma región) ≈ 3 oleadas de queries ≈ 200–500 ms. Limitación documentada. |
| Veredicto ejemplo | "…Conocimiento histórico de Nicaragua Informate: 48 predicciones validadas (0% acierto)." |

Nota honesta: la tasa de acierto de predicciones validadas es **0%**
(sobre-predicción de portada/publicación) — se reporta tal cual; es
evidencia real de que el predictor de portada es demasiado optimista, no
una métrica embellecida.

## 4. Lo que el circuito demuestra vs. lo que no

**Demostrado en producción:**
experiencia (mutationLog 125, decision_log 40, predictions 352, corpus 522)
→ memoria (KB 421/8,217/4,259; FP registry 3; learning_cycles 3)
→ consumo en evaluación (30/30 evals con `aprendizaje` + veredicto que
declara la evidencia) → persistido (`meniLearning` en la nota).

**No demostrable con datos históricos (honesto):**
`editor_corrections` = 0 y `editor_patterns` = 0 porque las 125 mutaciones
históricas fueron TODAS `TECHNICAL` y el log no guarda antes/después —
no existen correcciones editoriales humanas reales que reconstruir. El
canal quedó cableado (applySubstantiveMutation→registerCorrection→
detectAndPersistPattern gobernado, cubierto por tests) y producirá la
primera observación con la primera edición humana sustantiva real.
Generar datos sintéticos para "llenar" el circuito habría sido exactamente
lo prohibido (inventar experiencia).

## 5. Seguridad / anti-autoprogramación (FASE 8)

- Patrón ACTIVE nunca mueve el score — invariante testado
  (`meni-learning-4.0.test.ts`: "un patrón ACTIVE NUNCA mueve el score").
- Patrones NO ACTIVE nunca llegan a `loadEditorPatterns` (solo `ACTIVE`).
- `ENABLE_MENI_LEARNING` permanece **apagado**; `activeAdjustments` no
  cargan → determinismo idéntico al pre-cambio cuando el flag está off.
- Falso positivo registrado = contexto, nunca relaja el gate
  (`motocicleta` limpio / `motocicletacicletas` bloquea — tests fijos).
- Solo evidencia humana promueve patrones; el sistema no vota consigo mismo.
- Rollback `ACTIVE→ROLLED_BACK` preserva evidencia (lifecycle existente).
- Cron no corre por publicación (semanal), nunca dentro de la evaluación.

## 6. Costo Firestore (FASE 14)

| Acción | Lecturas | Escrituras | Frecuencia |
|---|---|---|---|
| Harvest semanal | ≤700 acotadas | ~3–10 | semanal (cron) |
| KB backfill único | ~522 (+~4.5K entity gets) | ~8–12K | una vez, lotes de 100 |
| KB query por evaluación | ~200–600 (antes ~0; vs ~12.9K/refresco del diseño anterior) | 0 | por evaluación |
| Prediction context | ≤200, cache 15 min | 0 | por evaluación (cache) |
| FP context | ≤200, cache 10 min | ~1–2 por evento real | por evaluación (cache) |
| `meniLearning` persistido | 0 | incluido en el save | por publicación |

Neto por evaluación en estado estable: **+~300–800 lecturas y +~150–400 ms
(prod)** a cambio de memoria real del medio. El antiguo `loadGraph` habría
costado ~12.9K lecturas por refresco — se reemplazó antes de que doliera.

Ticket separado (NO resuelto por instrucción):
`.audit/TICKET_detectarDuplicadoAdmin_costo.md` — ~2,000 docs con
`contenido` por evaluación duplicada.

## 7. Archivos tocados

Nuevos: `experience-harvest.ts`, `false-positive-registry.ts`,
`prediction-context.ts`, `app/api/cron/meni-learning-cycle`,
`app/api/admin/kb-backfill`, `tests/meni-learning-4.0.test.ts`,
`.audit/meni-learning-4.0-*.ts`, este informe + regresión + ticket.

Modificados: `meni/types.ts`, `editorial-brain/{index,types}.ts`,
`quality-gate/{quality-gate,types}.ts`, `meni/core.ts`,
`editor-jefe/correction-tracker.ts`, `knowledge-base/index.ts`,
`learning-engine/experience-harvest`, `editorial/{mutation-policy,
guardar-con-meni}.ts`, `admin/news/[id]`, `admin/guardar-directo`,
`admin/meni-learning`, `nios/swiss-watch/board.ts`,
`tests/swiss-watch.test.ts`, `vercel.json`.

## 8. Limitaciones declaradas

1. `editor_corrections`/`editor_patterns` = 0 en producción — faltan
   correcciones humanas reales; el canal está cableado y testado.
2. Latencia del scoped-KB medida desde dev-box (red lenta); en producción
   se estima 200–500 ms — medir tras deploy.
3. `queryKnowledge` trae artículos "relacionados" por entidades compartidas
   (~70–190/eval) — matching correcto pero ancho; la relevancia fina es
   trabajo de maduración posterior.
4. `articleCount`/`strength` de KB pueden inflarse si se re-ingesta el
   mismo artículo (no hay marca idempotente por artículo).
5. Timeline por entidad usa `limit(25)` sin índice compuesto — puede
   omitir entradas muy antiguas de entidades hub.
6. Predicciones con validación útil real: 48 de 352 (152 validadas con
   `validated=0` por artículo borrado y resto pendiente/insuficiente).
7. `meniLearning` se persiste solo cuando `aprendizaje` existe — notas sin
   conocimiento aplicable no llevan el campo (correcto).
