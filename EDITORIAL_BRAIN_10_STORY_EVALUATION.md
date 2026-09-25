# EDITORIAL BRAIN — EVALUACIÓN EMPÍRICA DE 10 NOTICIAS REALES

Fecha: 2026-09-25
Corpus: Firestore `noticias` en producción (485 docs, 452 publicados)
Método: solo lectura — documentos reales + código que los produjo
Cero cambios a código, producción, prompts o configuración.

---

## CÓMO LLEGAN LAS NOTICIAS (evidencia transversal)

Antes de las fichas: el recorrido real observado en los 10 docs.

```
INPUT externo (texto ya redactado; campos `research`/`story` ausentes en 10/10)
 ↓
guardar-directo | news POST | /api/articles   (3 puertas, mismo guardarConMeni)
 ↓
runMeniAsync → evaluateMeni → editorial-brain (scoring) + analyzers + quality-gate
 ↓                                    quality-gate produce `textoCorregido` (MENI EDITA)
 ↓
Supervisor → decisión PUBLICAR / PUBLICAR_CON_CAMBIOS
 ↓
Firestore write atómico (updateData + noticia) + contentHash + supervisorDecision
 ↓
article_lifecycles creado (CREADA→PUBLICADA→MONITOREO, 1-2 eventos)
 ↓
meni_predictions insertado (predPublicar/predPortada/predFacebook/predDiscover)
 ↓
publication-pipeline + distribuir (solo en 4/10; en 6/10 distribuida=true va en el write inicial)
 ↓
isToxicSlug filtra en la CAPA DE LECTURA (data.ts) — fuera de toda autoridad editorial
```

Divergencia observada entre puertas: `guardar-directo` persiste `meni.articulo.contenido` (texto corregido por quality-gate); `news` POST y `/api/articles` persisten el contenido crudo del input — la corrección de MENI se computa pero se descarta en 2 de 3 rutas.

---

## STORY 1
**Category:** Sucesos · **Slug/ID:** `gh7lOQJoZIJeY5bXhoTe` / diez-lesionados-tras-accidente-de-autobus-en-rio-blanco
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo completo (386 palabras). Sin `research`, sin `story`, sin fuentes estructuradas. `fuente:"Redaccion Nicaragua Informate"`, `fuentesComplementarias:[]`.
- **FACTS:** Hechos identificables: 10 lesionados, autobús Managua–San Carlos, Río Blanco, Caño Samaria, Centro de Salud Denis Gutiérrez, pacientes en "observación". Cifra corroborada por comunicado del MINSA. Sin citas directas; atribución implícita ("según comunicado").
- **JOURNALISM:** Claro qué/dónde/cuántos. Falta cuándo exacto, causa, estado de los lesionados por nombre/gravedad.
- **CONTEXT:** PARCIAL — menciona que el bus cubría ruta Managua–San Carlos; sin antecedentes de la ruta ni estadística vial.
- **READER VALUE:** PARCIAL — información inmediata correcta; no responde si hubo fallecidos (implícito que no), ni contacto del centro de salud, ni qué sigue.
- **WRITING:** MENI EVALÚA + EDITA (qualityGate.textoCorregido persistido si entró por guardar-directo). No genera.
- **SEO:** Título descriptivo con lugar y magnitud — editorial SEO PRESENTE. Technical SEO estándar del renderer.
- **QUALITY:** scoreMeni 92 · PUBLICABLE · nivel FORENSE · tier REPORTAJE · confianza BAJA (guardar-directo) · requiereRevisionHumana=true.
- **MENI:** Decision-relevante: aprobó y abrió la puerta. Sin scoreCalidad persistido (doc anterior al campo).
- **SUPERVISOR:** PUBLICAR, conf 0.5 — confianza por defecto, sin issues registrados en el doc.
- **DECISION:** publicado con publicadoAt inmediato (canonical write).
- **LEARNING:** `meni_predictions` insertado, `validationStatus:PENDING_VALIDATION` (<7 días; aún no medible).
- **FOLLOW-UP:** Requiere seguimiento (gravedad de lesionados, causa) — sin flag operativo de follow-up en el doc.
- **GAPS:** Fuente genérica pese a atribución real al MINSA; `confianza:BAJA` + `publicado:true` coexisten — la confianza no condiciona nada (OBSERVATIONAL_ONLY).

## STORY 2
**Category:** Sucesos · **Slug/ID:** `eA53ptkMPQdrNlotbJ7c` / nina-de-8-anos-grave-tras-ser-atropellada-en-managua
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo (518 palabras), fuente genérica, sin complementarias.
- **FACTS:** Niña 8 años, atropellada, Managua, estado grave, traslado a hospital. Datos verificables mínimos; sin placa del vehículo, sin conductor identificado, sin citas.
- **JOURNALISM:** PRESENTE para qué/quién/dónde; causa del accidente abierta.
- **CONTEXT:** PARCIAL — contexto de accidentes infantiles no aportado.
- **READER VALUE:** PARCIAL — alerta pública útil; sin info práctica (zona exacta, medidas preventivas).
- **WRITING:** Evaluado (editado solo si entró por guardar-directo).
- **SEO:** Título con víctima + lugar + consecuencia — correcto.
- **QUALITY:** scoreMeni 91 · PUBLICABLE · FORENSE · REPORTAJE.
- **MENI:** DECISION_RELEVANT (permitió publicar).
- **SUPERVISOR:** PUBLICAR · confianza ALTA · requiereRevisionHumana=false.
- **DECISION:** publicado; `distribuida:true` en write inicial (mutationLog vacío).
- **LEARNING:** predicción PENDING_VALIDATION.
- **FOLLOW-UP:** Caso activo (niña grave) — candidata natural a update; sin mecanismo de seguimiento consumido.
- **GAPS:** Historia de alto interés humano sin follow-up operativo; fuente genérica.

## STORY 3
**Category:** Nacionales · **Slug/ID:** `pAv7atGxknGok8Wtt6uC` / la-mascota-atiende-a-16-ninos-con-cardiopatias-congenitas
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo, fuente genérica.
- **FACTS:** Hospital La Mascota, 16 niños, cardiopatías congénitas, jornada/aten­ción quirúrgica. Cifra y entidad verificables.
- **JOURNALISM:** PRESENTE — qué/dónde/cuántos claro.
- **CONTEXT:** PARCIAL — faltan antecedentes del programa y financiamiento.
- **READER VALUE:** PARCIAL→PRESENTE — noticia de servicio para familias afectadas; sin info práctica (cómo acceder al programa).
- **WRITING:** Evaluado.
- **SEO:** Entidad + número + condición médica — buena cobertura de intent.
- **QUALITY:** scoreMeni 91 · PUBLICABLE.
- **SUPERVISOR:** PUBLICAR · ALTA.
- **DECISION:** publicado.
- **LEARNING:** PENDING_VALIDATION.
- **FOLLOW-UP:** Oportunidad (resultado de cirugías, lista de espera) sin consumidor.
- **GAPS:** Sin cita de vocero hospitalario pese a ser noticia institucional; atribución genérica.

## STORY 4
**Category:** Nacionales · **Slug/ID:** `AQiSAE7CeGLS9n5AvpzG` / controles-viales-en-nicaragua-dejan-94-detenidos-por-ebriedad
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo, fuente genérica.
- **FACTS:** 94 detenidos por ebriedad, controles viales, Policía Nacional, periodo definido. Cifra central verificable.
- **JOURNALISM:** PRESENTE.
- **CONTEXT:** PARCIAL — sin comparación con operativos previos ni marco legal (multa, retención).
- **READER VALUE:** PRESENTE — información de servicio vial inmediata.
- **WRITING:** Evaluado.
- **SEO:** Número + acción + país — intent cubierto.
- **QUALITY:** scoreMeni 93 · PUBLICABLE.
- **SUPERVISOR:** PUBLICAR · ALTA.
- **DECISION:** publicado.
- **LEARNING:** PENDING_VALIDATION.
- **FOLLOW-UP:** Estadística recurrente — candidata a serie; no existe noción de "serie" en el sistema.
- **GAPS:** Sin desglose (departamentos, periodo exacto del operativo); fuente policial no estructurada.

## STORY 5
**Category:** Internacionales · **Slug/ID:** `gPe3e3k6GAmgPpBJzGkX` / tres-nicaraguenses-enfrentan-procesos-distintos-en-ee-uu
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo, fuente genérica.
- **FACTS:** Tres nicaragüenses, procesos distintos en EE.UU. — agregación de casos separados en una sola pieza.
- **JOURNALISM:** PARCIAL — el formato "tres casos" diluye cada hecho; título ambiguo.
- **CONTEXT:** PARCIAL — contexto migratorio presente pero superficial.
- **READER VALUE:** PARCIAL — interés de comunidad nica en diáspora; sin detalle procesal accionable.
- **WRITING:** Evaluado.
- **SEO:** Título genérico ("procesos distintos") — bajo intent matching; el Supervisor lo marcó.
- **QUALITY:** scoreMeni 92 · PUBLICABLE.
- **SUPERVISOR:** PUBLICAR_CON_CAMBIOS · conf 0.5 · issues: título genérico/ambiguo. La corrección sugerida es **consumida** por guardar-directo (evidencia: PUBLICAR_CON_CAMBIOS sí modifica el título persistido en ese flujo).
- **DECISION:** publicado.
- **LEARNING:** PENDING_VALIDATION.
- **FOLLOW-UP:** Casos judiciales en curso — follow-up natural sin mecanismo.
- **GAPS:** Supervisor detectó problema de título pero el contenido agregado (3 casos en 1) no fue evaluado estructuralmente.

## STORY 6
**Category:** Internacionales · **Slug/ID:** `51OIyVo7HhoY8dcsmoto` / tribunal-limita-deportaciones-tras-22000-migrantes-enviados
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo, fuente genérica.
- **FACTS:** Decisión de tribunal, 22,000 migrantes enviados, límite judicial a deportaciones. Cifra específica — alto riesgo factual sin fuente verificada.
- **JOURNALISM:** PARCIAL — qué/decisión claro; tribunal específico y fundamento legal débiles.
- **CONTEXT:** PARCIAL — política migratoria mencionada sin profundidad.
- **READER VALUE:** PRESENTE — tema de máximo interés para la audiencia (migración).
- **WRITING:** Evaluado.
- **SEO:** Cifra + tribunal + deportaciones — buen intent.
- **QUALITY:** scoreMeni 90 · PUBLICABLE.
- **SUPERVISOR:** PUBLICAR · confianza BAJA (según dump) · requiereRevisionHumana.
- **DECISION:** publicado pese a confianza BAJA — el flag no modifica la decisión.
- **LEARNING:** PENDING_VALIDATION.
- **FOLLOW-UP:** Fallo judicial sujeto a apelación — follow-up obligatorio editorialmente, ausente operativamente.
- **GAPS:** Cifra de 22,000 sin fuente estructurada ni verificación — el sistema no valida cifras contra fuentes externas.

## STORY 7
**Category:** Deportes · **Slug/ID:** `gE9P2rHVhRM0rLqAlb2U` / nisi-blass-gana-bronce-para-nicaragua-en-viga-de-equilibrio
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo, fuente genérica.
- **FACTS:** Atleta nicaragüense (Nisi Blass), bronce, viga de equilibrio, competencia específica. Verificable.
- **JOURNALISM:** PRESENTE — resultado, atleta, aparato.
- **CONTEXT:** PARCIAL — sin puntaje ni contexto del torneo completo.
- **READER VALUE:** PRESENTE — orgullo deportivo nacional, alto engagement local.
- **WRITING:** Evaluado.
- **SEO:** Nombre propio + medalla + disciplina — excellent intent.
- **QUALITY:** scoreMeni 94 · PUBLICABLE.
- **SUPERVISOR:** PUBLICAR · ALTA.
- **DECISION:** publicado.
- **LEARNING:** PENDING_VALIDATION.
- **FOLLOW-UP:** Resultado cerrado — baja necesidad de update; correcto que no lo tenga.
- **GAPS:** Menor: puntaje y torneo no estructurados.

## STORY 8
**Category:** Espectáculos · **Slug/ID:** `EzMFBmEbwymm9YYvvcW5` / muere-pedro-dixon-la-pajarita-chinandegana-a-los-28-anos
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo, fuente genérica.
- **FACTS:** Pedro Dixon, "La Pajarita Chinandegana", fallecimiento a los 28 años. Persona, seudónimo, edad, lugar de origen verificables.
- **JOURNALISM:** PRESENTE en hecho central; causa de muerte posiblemente ausente (obituario temprano).
- **CONTEXT:** PARCIAL — relevancia cultural del personaje insuficientemente explicada para lector ajeno.
- **READER VALUE:** PRESENTE — figura regional conocida.
- **WRITING:** Evaluado.
- **SEO:** Nombre + seudónimo + "muere" + edad — strong intent.
- **QUALITY:** scoreMeni 91 · PUBLICABLE.
- **SUPERVISOR:** PUBLICAR — con warning registrado: título sin ubicación/autoridad confirmante. Warning observacional, no bloqueó ni marcó corrección.
- **DECISION:** publicado.
- **LEARNING:** PENDING_VALIDATION.
- **FOLLOW-UP:** Causa de muerte y homenajes — follow-up probable sin mecanismo.
- **GAPS:** Warning del Supervisor sin efecto; posible dato faltante (causa) no penalizó el score.

## STORY 9 — LA ANOMALÍA CENTRAL
**Category:** Tecnología · **Slug/ID:** `ioylw52HAMCLqp5NlLBb` / apple-presenta-el-iphone-duo-su-primer-modelo-plegable
**Fecha:** 2026-09-24 · **Estado:** `publicado:true` en Firestore — **bloqueado al lector por isToxicSlug**

- **INPUT:** Texto externo (posiblemente generado por IA — evidencia en contenido).
- **FACTS:** Afirmación central ("iPhone Duo, primer plegable de Apple") **no verificable** — producto no existente/hipotético. Además el contenido publicado contiene el artefacto crudo `:contentReference[oaicite:1]{index=1}` — residuo de generación externa visible al lector.
- **JOURNALISM:** AUSENTE en factualidad — la noticia describe un producto que no existe como si existiera.
- **CONTEXT:** irrelevante si el hecho base es falso.
- **READER VALUE:** AUSENTE — desinforma.
- **WRITING:** El contenido llegó **ya generado externamente** con marcadores de IA; el pipeline sanitizador y MENI lo dejaron pasar. `findGenerationDefects` (guardar-directo:94) no detectó el patrón `:contentReference[oaicite:...]`.
- **SEO:** Score 95 "PUBLICABLE ORO" — máximo reconocimiento del sistema para contenido fabricado.
- **QUALITY:** scoreMeni **95** · ORO · aprobadoMeni:true.
- **SUPERVISOR:** PUBLICAR_CON_CAMBIOS · conf 0.5.
- **DECISION:** publicado en Firestore. PERO: `lib/seo-toxic.ts:12` lista este slug en `BLOCKED_SLUGS` — `lib/data.ts` lo filtra en TODAS las consultas públicas (home, categorías, relacionadas, sitemap). El artículo está publicado-para-el-sistema e invisible-para-el-lector por un **firewall manual en la capa de lectura**, ajeno a la autoridad editorial.
- **LEARNING:** PENDING_VALIDATION — cuando el validador lo procese, verificará `publicado:true` y marcará la predicción como "correcta" aunque el lector nunca lo vio.
- **FOLLOW-UP:** Debió ser `articulo_eliminado`/noindex explícito, no filtrado por lista manual.
- **GAPS (múltiples, todos demostrados):**
  1. MENI 95 a contenido fabricado → falsedad factual no detectada.
  2. Artefacto `:contentReference` publicado → sanitizer y generation-defects no lo capturan.
  3. La corrección real se hizo por **blocklist manual** — evade la autoridad editorial; el doc sigue "publicado y aprobado".
  4. El validador contará `publicado:true` como éxito de predicción → aprendizaje contaminado.
  5. `research`/`story` undefined → el input externo con marcadores de IA entró sin checkpoint de provenance.

## STORY 10
**Category:** Tecnología · **Slug/ID:** `d1JwxltReT1Wj88Jl4ZD` / meta-lanza-gafas-sin-camara-y-apuesta-por-audio-e-ia
**Fecha:** 2026-09-24 · **Estado:** publicado

- **INPUT:** Texto externo con especificaciones detalladas (peso, batería, precio, fecha de disponibilidad, agente "Muse", nombres de modelos).
- **FACTS:** Alta densidad factual: precio, autonomía, fecha de lanzamiento, nombres de producto. **Ninguna cifra lleva atribución verificable** — `fuentesComplementarias:[]`, fuente genérica. Sin evidencia de verificación externa en el sistema.
- **JOURNALISM:** PARCIAL — estructura informativa correcta; factualidad sin respaldo.
- **CONTEXT:** PRESENTE — estrategia de Meta explicada.
- **READER VALUE:** PARCIAL — útil si los datos son correctos; riesgo alto si son fabricados (comparar con Story 9, mismo pipeline, score mayor).
- **WRITING:** Evaluado.
- **SEO:** Marca + producto + diferenciador — good intent.
- **QUALITY:** scoreMeni 92 · PUBLICABLE.
- **SUPERVISOR:** PUBLICAR.
- **DECISION:** publicado, visible al lector (slug no bloqueado).
- **LEARNING:** PENDING_VALIDATION.
- **FOLLOW-UP:** Lanzamiento con fecha futura — candidato a update en disponibilidad.
- **GAPS:** El mismo pipeline que dio 95 a un producto fabricado dio 92 a specs detalladas sin verificar — no existe chequeo factual contra fuentes.

---

## MATRIZ COMPARATIVA — CAPACIDADES

| Capability | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Fact extraction | ✓ | ✓ | ✓ | ✓ | ~ | ~ | ✓ | ✓ | ✗ | ~ |
| Source handling | ~ | ~ | ~ | ~ | ~ | ~ | ~ | ~ | ✗ | ~ |
| Factuality | ~ | ~ | ~ | ~ | ~ | ~ | ✓ | ~ | ✗ | ~ |
| Context | ~ | ~ | ~ | ~ | ~ | ~ | ~ | ~ | ✗ | ~ |
| Reader value | ~ | ~ | ~ | ✓ | ~ | ✓ | ✓ | ✓ | ✗ | ~ |
| Writing (MENI edita?) | ~1 | ~1 | ~1 | ~1 | ~1 | ~1 | ~1 | ~1 | ~1 | ~1 |
| SEO editorial | ✓ | ✓ | ✓ | ✓ | ✗2 | ✓ | ✓ | ✓ | ✓3 | ✓ |
| Quality (score discrimina?) | ~ | ~ | ~ | ~ | ~ | ~ | ~ | ~ | ✗ | ~ |
| Supervisor | ✓ | ✓ | ✓ | ✓ | ~4 | ✓ | ✓ | ~5 | ✗ | ✓ |
| Follow-up | ✗ | ✗ | ✗ | ~ | ✗ | ✗ | n/a | ~ | n/a | ~ |
| Learning | ~6 | ~6 | ~6 | ~6 | ~6 | ~6 | ~6 | ~6 | ✗6 | ~6 |

Leyenda: ✓ funciona · ~ parcial · ✗ falla/ausente
1. MENI produce `textoCorregido` pero solo guardar-directo lo persiste; las otras dos puertas lo descartan.
2. Supervisor marcó el título como genérico/ambiguo.
3. SEO editorial "correcto" sobre un hecho falso — la forma no rescató el fondo.
4. PUBLICAR_CON_CAMBIOS funcionó, pero la corrección es solo de título, no estructural.
5. Warning de título sin efecto.
6. PENDING_VALIDATION <7d — el ciclo existe, está cableado (orchestrator:343) y aún no ha producido ninguna validación real en producción.

## MATRIZ — GAPS Y CLASIFICACIÓN

| Story | Major Gap | False Positive | False Negative | Missing Capability |
|---|---|---|---|---|
| S1 | Fuente genérica vs atribución real | Leve (confianza BAJA sin efecto) | — | Follow-up operativo |
| S2 | Sin mecanismo de update en caso activo | — | — | Follow-up / update tracking |
| S3 | Sin vocero citado en nota institucional | — | — | Verificación de atribución |
| S4 | Dato estadístico sin marco temporal fino | — | — | Contexto comparativo |
| S5 | Agregación de 3 casos diluye hechos | — | — | Evaluación estructural de formato |
| S6 | Cifra 22,000 sin fuente verificada | Candidato (confianza BAJA ignorada) | — | Fact-check de cifras |
| S7 | Menor (sin puntaje) | — | — | — |
| S8 | Warning de título sin efecto | — | Leve | Consumo de warnings |
| S9 | **Contenido fabricado + artefacto IA + blocklist paralelo** | **SÍ — mayor evidencia del corpus** | — | Fact-check, provenance de input, autoridad en capa de lectura |
| S10 | Specs sin atribución | Candidato | — | Verificación de datos estructurados |

**Falsos negativos en la muestra: ninguno claro** — todas las noticias publicadas parecen editorialmente aceptables salvo S9 (que fue aprobada a pesar de todo). El bloqueo real del iPhone Duo vino de una lista manual, no de un falso negativo del sistema.

---

## ANÁLISIS TRANSVERSAL

### Scores — ¿qué comportamiento producen?

| Score | Rango observado | Clasificación |
|---|---|---|
| scoreMeni | 90–95 (10/10) | **DECISION_RELEVANT** — abre la puerta; pero rango estrecho sobre corpus divergente sugiere baja discriminación |
| scoreCalidad | ausente en 10/10 docs | n/a — campo agregado al código después de que estas notas se escribieron |
| Supervisor conf | 0.5 en varias | OBSERVATIONAL_ONLY — valor por defecto, sin efecto |
| confianza (ALTA/BAJA) | ALTA en 5, BAJA en 5 | **OBSERVATIONAL_ONLY** — `requiereRevisionHumana:true` convive con `publicado:true`; nadie lo consume |
| prediction confianza | 92+ | LEARNING_RELEVANT en diseño — aún sin output real (0 validadas) |
| mutationLog | 4/10 docs | OBSERVATIONAL_ONLY de momento (provenance recién agregada) |

### Learning — estado real del ciclo

```
prediction (313 docs) → publication → measurement → 7d → validation → adjustment
     ✓ real              ✓ real        ?           wired      0 output    wired
```

- 313 `meni_predictions`: 301 sin `validationStatus` (schema anterior), **12 PENDING_VALIDATION (<7 días — aún no medibles), 0 VALIDATED**.
- `validateMeniPredictions` corre dentro del orchestrator (`lib/nios/intelligence/orchestrator.ts:343`, `minAgeDays:7, limit:100`) — el consumidor existe.
- **Defecto estructural:** el validador escribe `validation.summary` + `realPublicar/realPortada` pero **nunca actualiza `validationStatus`** → el campo que guardar-directo crea queda PENDING_VALIDATION para siempre; los dashboards que lean ese campo mostrarán pendientes eternos.
- **Capacidad honesta declarada en el propio código:** `predFacebook` y `predDiscover` son **siempre INSUFFICIENT_DATA** — no existen métricas de Facebook ni GSC-DISCOVER recolectadas. Dos de las cuatro predicciones son inválidables por diseño.
- Para S9: cuando se valide, `publicado:true` será leído como predicción acertada aunque el artículo es invisible — el aprendizaje absorberá una señal falsa.
- `loadActiveAdjustments` alimenta `evaluateMeni` (cableado desde la fase anterior) — pero con 0 validaciones reales, ningún ajuste ha ocurrido aún.

### Reader Journey — ¿existe operativamente?

```
CLICK → HEADLINE EXPECTATION → FIRST PARAGRAPH → UNDERSTANDING → CONTEXT → ANSWER → NEXT → FOLLOW-UP
```

**No existe como etapa ejecutada.** No hay campo `readerJourney`, ni output persistido, ni consumidor. El journey ocurre implícitamente: el titular publicado crea expectativa, el primer párrafo (texto externo) la responde o no, y el sistema no mide ninguna de esas transiciones. La única señal de journey sería `predFacebook/predDiscover` — pero son inválidables (sin métricas). **Capacidad: EXISTS in design docs ≠ CONNECTED ≠ OUTPUT.**

### Writing — ¿qué recibe y qué hace MENI?

- **Recibe:** texto ya redactado externamente (10/10 — `research`/`story` siempre ausentes). En S9, texto probablemente generado por IA con marcador residual.
- **Hace:** EVALÚA (score+clasificación) + EDITA parcialmente (`qualityGate.textoCorregido`, `seo.tituloSEO`, `resumenOptimizado`) + BLOQUEA vía Supervisor cuando aplica.
- **No genera** en el flujo normal (editor-autonomo existe pero es manual).
- **Divergencia:** la edición solo se persiste en `guardar-directo`; `news`/`articles` descartan `textoCorregido` → el mismo input produce contenido publicado distinto según la puerta usada.

### Technical SEO vs Editorial SEO

- Technical SEO (metadata, canonical, schema, indexabilidad, sitemap): mecanismo uniforme del renderer Next.js — smoke 200 verificado en fase anterior. No difiere por noticia.
- Editorial SEO: evaluado por MENI (`seo.tituloSEO`, slug). Funciona formalmente — pero S9 demuestra que un buen score SEO puede envolver un hecho falso. SEO ≠ factualidad, correctamente separadas como dimensiones.
- `isToxicSlug` es una **capa SEO-operativa paralela a la autoridad editorial**: bloquea al lector sin modificar el estado editorial ni el aprendizaje. La noticia "corregida" sigue contando como publicada y aprobada.

### Content-integrity, editorial-brain, watch-cycle — participación real

- **content-integrity:** la función existe en el pipeline (`runMeni` → core), pero no deja campo persistido visible en los 10 docs (`research`/`story` vacíos sugiere que valida contra input inexistente). Participación: ejecutada en el pipeline, output no trazable por noticia.
- **editorial-brain:** produce el score dentro de `evaluateMeni` — participa en las 10 (todas tienen `scoreMeni`, `calificacion`, `editorialTier`).
- **editor-brain (memoria):** `skipEditorBrain:true` en guardar-con-meni — la memoria se **escribe** (otro writer) pero no se **lee** en producción.
- **watch-cycle / article_lifecycles:** participa — 10/10 tienen doc `article_lifecycles` creado con estado MONITOREO y 1-2 eventos. Pero `updates:0`, `notas:[]` en todas → el ciclo de vida existe, no produce cambios ni seguimiento.
- **publication-pipeline + distribuir:** participaron en 4/10 (mutationLog con `publication-pipeline`, `distribuir`); en 6/10 `distribuida:true` fue establecido en el write inicial por guardar-directo.

---

## CONCLUSIONES

### WHAT WORKS (demostrado)
1. **Autoridad editorial centralizada** — write atómico con decision+hash+supervisorDecision (Fase 3).
2. **Publicación inmediata consistente** — 10/10 publicadas al guardar, sin paso manual.
3. **Supervisor interviene** — PUBLICAR_CON_CAMBIOS detectado y aplicado (S5, S9); warnings registrados (S8).
4. **Lifecycle trazable** — `article_lifecycles` en 10/10.
5. **Predicciones se escriben** — 10/10 tienen doc `meni_predictions` con confianza y fecha.
6. **Validador existe y está invocado** — orchestrator lo corre con ventana de 7 días.
7. **Filtrado de contenido tóxico funciona** — el iPhone Duo no llega al lector.
8. **Rate-limiting/auth** en mutadores post-Fase 3.

### WHAT PARTIALLY WORKS
1. **MENI como editor** — produce `textoCorregido` pero solo 1 de 3 puertas lo persiste.
2. **Supervisor** — detecta problemas de título pero no estructurales; `conf:0.5` de default sugiere calibración sin datos.
3. **Learning loop** — cableado end-to-end pero 0 validaciones producidas; `validationStatus` nunca se cierra (dual-schema); facebook/discover inválidables por diseño.
4. **Factuality** — scores altos (90–95) pero sin verificación real de hechos/cifras contra fuentes.
5. **Source handling** — campo `fuente` existe pero se llena con genérico; `fuentesComplementarias` vacío en 10/10.
6. **Follow-up** — casos que lo requieren (S1, S2, S6, S8, S10) sin mecanismo consumido.

### WHAT DOES NOT WORK (fallos demostrados)
1. **Detección de contenido fabricado** — iPhone Duo: 95 ORO + PUBLICABLE sobre producto inexistente.
2. **Detección de artefactos de generación** — `:contentReference[oaicite:1]` llegó al reader sin que sanitizer ni `findGenerationDefects` lo capturaran.
3. **La corrección real ocurre FUERA de la autoridad** — `isToxicSlug` en la capa de lectura oculta sin cambiar estado editorial: el doc sigue `publicado:true, aprobadoMeni:true`. La Fase 3 cerró la autoridad en escritura; esta bypass vive en lectura.
4. **`confianza:BAJA` + `requiereRevisionHumana:true`** — publicadas sin revisión humana; flag OBSERVATIONAL_ONLY.
5. **Score no discrimina** — 90–95 para noticias correctas y para una fabricada.
6. **Warnings del Supervisor** — registrados sin efecto (S8).

### WHAT IS MISSING
1. **Verificación factual** (hechos, cifras, entidades contra fuentes).
2. **Provenance del input** — no hay checkpoint de "texto generado por IA / pegado de otra fuente".
3. **Follow-up operativo** — nada marca "esto requiere actualización" ni lo consume.
4. **Reader Journey ejecutado** — diseñado, no existe como etapa con output consumido.
5. **Métricas reales de distribución** — facebook/discover inválidables; sin ellas, la mitad del aprendizaje no puede funcionar.
6. **Cierre de `validationStatus`** — el validador no actualiza el campo que guardar-directo crea.

### WHAT SHOULD NOT BE BUILT
1. Otro motor de scoring — ya existen MENI, Supervisor, quality-gate, confidence: el problema no es falta de evaluadores.
2. Otro sistema de lifecycle — `article_lifecycles` ya existe y funciona.
3. Otro mecanismo de bloqueo — `isToxicSlug` debe absorberse en la autoridad editorial, no replicarse.
4. Generación autónoma — el problema de S9 es contenido externo sin verificar, no falta de generación.
5. Segundo validador de predicciones — el actual está cableado; falta cerrar su schema.

### WHAT SHOULD BE IMPROVED (máx. 10 prioridades)
1. **Fact-check estructural mínimo**: verificar que entidades/cifras del texto tengan fuente o atribución antes de PUBLICABLE — especialmente tecnología/internacional.
2. **Sanitizar artefactos de generación** (`:contentReference[...]`, `oaicite`, URLs de tracking) en el pipeline — extender `findGenerationDefects`.
3. **Unificar el consumo de `textoCorregido`** — las 3 puertas deben persistir el mismo contenido (o ninguna debe corregir).
4. **Absorber `isToxicSlug` en la autoridad editorial** — un bloqueo debe cambiar `publicado`/`estado` en Firestore, no solo filtrar en lectura; si no, el aprendizaje lee señales falsas.
5. **Cerrar el dual-schema de predicciones** — el validador debe escribir `validationStatus=VALIDATED` para que el campo sea consistente.
6. **Decidir qué hacer con confianza:BAJA** — o bloquea/marca revisión obligatoria, o se elimina el flag para no fingir control.
7. **Follow-up operativo mínimo** — campo `requiresFollowUp` + consumidor en watch-cycle para S1/S2/S6/S10.
8. **Eliminar predicciones inválidables** — dejar de escribir `predFacebook`/`predDiscover` mientras no exista fuente de medición real, o recolectarla.
9. **Trazabilidad de content-integrity** — persistir qué validó por noticia (hoy ejecuta sin dejar evidencia).
10. **Auditar los 301 docs de schema viejo** — reclasificar como `HISTORICAL_MEMORY` explícito para que no sean confundidos con predicciones activas.

---

## RESPUESTA A LA PREGUNTA DE LA FASE

> *"Si mañana llegan 10 noticias diferentes, ¿qué hace realmente Nicaragua Informate con ellas?"*

Recibe texto externo ya redactado → lo evalúa con MENI (que produce una versión corregida que solo una de las tres puertas persiste) → el Supervisor puede ajustar el titular o bloquear → publica atómicamente con trazabilidad → crea lifecycle en MONITOREO y una predicción que será validable a los 7 días en 2 de sus 4 campos → y si el contenido es fabricado, puede darle 95/100, aprobarlo como ORO y publicarlo, confiando en que una lista manual de slugs lo esconda del lector sin que el sistema editorial se entere.

**Lo que NO hace:** verificar que los hechos sean reales, detectar residuos de generación, distinguir una noticia verdadera de una fabricada en el score, dar seguimiento a casos abiertos, ni aprender todavía de ninguna predicción validada.

---

*Evaluación completada — fase observacional, cero cambios de código. No comienza la siguiente fase.*
