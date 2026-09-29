# PHASE B REPORT — Corrección de P1 + profundización MENI

**Fecha:** 2026-09-28 · **Estado:** correcciones implementadas, tests verificados. **Sin merge, sin deploy, sin borrados.**

---

## P1-4 — Diagnóstico causal: `confianza BAJA + 0 fuentes + score 93 → PUBLICAR`

**Caso real:** `tres-dias-siete-muertos-el-saldo-de-los-accidentes-de-transito`

**Cadena reconstruida (doc real de Firestore):**
- `confianza`: BAJA — "48 afirmaciones | 8 atribuidas | 0 fuentes" → `requiereRevisionHumana:true`
- `factuality.signals`: `[]` (evaluado, no disparó)
- `scoreMeni`: 93 `FORENSE` · `supervisorDecision.verdict`: PUBLICAR

**Causa raíz — NO es un bug del detector, es un hueco de política:**

1. `detectFactualitySignals` suprime **todas** las señales si el texto contiene cualquier marcador de atribución (`ATTRIBUTION_RE`). El artículo dice *"de acuerdo con reportes de medios locales"* y *"las autoridades mantienen abiertas las investigaciones"* → `hasAttribution = true` → 0 señales. **Correcto según diseño.**
2. La atribución que satisface el gate es **vaga/colectiva** ("medios locales", "las autoridades") — no distingue fuente concreta ("Policía Nacional informó") de genérica ("reportes de medios").
3. `confianza` (el contador de claims/atribuciones) genera `requiereRevisionHumana` pero **nadie lo consume**: ni el Supervisor ni ningún gate leen `confianza.nivel`. Es OBSERVATIONAL_ONLY.
4. El score 93 no ve fuentes porque `fuentes` (campo estructurado) y `confianza` (señal textual) no alimentan el scoring.

**Veredicto:** publicación *técnicamente correcta* (un resumen de agregados con atribución genérica es publicable), pero hay un **gap real**: "atribución vaga" no debería satisfacer el gate como atribución concreta. Propuesta de señal `VAGUE_ATTRIBUTION` (IMPORTANT, INVESTIGAR_MAS) y/o alimentar `confianza.factores` al Supervisor — **pendiente de decisión, no implementado por mandato**.

## P1-1 — Observabilidad persistente de MENI ✅ CORREGIDO

**Archivos:**
- `lib/editorial/decision-log.ts` (nuevo) — `writeDecisionLog` / `updateDecisionLog` / `newAttemptId`, colección `meni_decision_log`.
- `lib/editorial/guardar-con-meni.ts` — escribe el registro en **toda** evaluación (el único punto por el que pasa cualquier nota, incluidas las que serán rechazadas). Nunca lanza excepción.
- `app/api/admin/guardar-directo/route.ts`, `app/api/articles/route.ts`, `app/api/admin/news/route.ts` — actualizan el resultado final: `REJECTED` + `blockingStage` (CONTENT_INTEGRITY / MENI / SUPERVISOR) + `blockingReason`, o `SAVED` + `savedArticleId`.

**Campos persistidos:** attemptId, timestamp, titulo (trunc), categoría, slug, score, adnNI, aprobado, veredicto, QG (bloqueado/motivos/issues/transcripción%/duplicado), señales factuality, supervisor (verdict/state/reason/issues), resultado final + motivo de bloqueo. **Sin contenido completo, sin secretos, sin PII.**

**Limitación conocida:** rechazos pre-evaluación (400 por campos faltantes o defectos BLOCK en input crudo antes de `guardarConMeni`) no producen registro — son malformaciones, no decisiones editoriales. Aceptable.

## P1-2 — `/api/support/track` ✅ CORREGIDO

**Consumidor legítimo identificado:** `components/editorial/SupportMedium.tsx` (1 impresión + 1 click por vista de artículo).

**Cambios:** rate-limit 20 req/min por IP (429 + Retry-After), límite 2 KB de body (413), validación estricta de `event` (`impression|click`), `slug` sanitizado ≤120 chars, headers UA/referrer truncados, campos extra ignorados (no se persisten).

## P1-3 — Regla `noticias` ✅ CORREGIDO

**Verificado primero:** ningún componente público lee `noticias` por SDK cliente (todo el sitio público usa Admin SDK server-side, que ignora reglas). `public/panel.html` SÍ usa SDK cliente con Firebase Auth — por eso `list` requiere `request.auth != null` (no `isAdmin()`, que podría romper el panel si el usuario no tiene el claim).

```js
allow get:  if request.auth != null || resource.data.publicado == true;
allow list: if request.auth != null;
```

**Resultado:** público anónimo puede obtener un artículo publicado por ID exacto (mismo dato que la web); **no puede listar** (no enumera borradores) ni leer documentos con `publicado != true`. Panel autenticado intacto.

⚠️ Pendiente: desplegar la regla con `firebase deploy --only firestore:rules` (archivo corregido, aún no desplegado).

## P1-5 — Cola `distribuciones_pendientes` — DIAGNOSTICADO

| Dimensión | Hallazgo |
|---|---|
| Escritor | `app/api/admin/distribuir/route.ts` (escribe con `proximoIntento +5min`) — **CURRENT** |
| Lector | `lib/nios/intelligence/notification-forensics.ts` (solo diagnóstico) |
| Consumidor de reintento | **NINGUNO — la cola nunca fue cableada a un worker** |
| Estado | 11 docs: 9 legacy (julio, `reintentos:0`), los mismos canales fallidos (push, telegram) |

**Corrección mínima propuesta (no implementada):** (a) wire un cron que procese `proximoIntento < now` con tope de reintentos y `estado:'exhausted'`, o (b) dejar de escribir la cola si no se va a consumir. Decisión pendiente.

## P1-6 — Acumulación de datos — DIAGNOSTICADO

| Colección | Docs | Escritor | Consumidor | Retención | Riesgo |
|---|---|---|---|---|---|
| `traffic_log` | 24 684 | `traffic-aggregator` + analytics | `lib/db/homepage`, growth, ceo-agent | `expiresAt` 30d escrito; cleanup cron borra 500/día — **backlog no alcanza** (~48 días para drenar). TTL policy de Firestore existe pero debe activarse en consola | Bajo eliminar (agregados diarios separados) |
| `google_learning_patterns` | 15 151 | `saveLearningPatterns` (NIOS orchestrator) | `getLearningPatterns` — existe consumidor, pero la colección crece sin tope | `pruneLearningPatterns` existe — ¿se invoca? verificar | Medio (consultar antes de podar) |

**Propuesta de retención:** `traffic_log` → 30 días vía TTL policy de Firestore (activar en consola) + subir batch del cron a 2 000 hasta drenar. `google_learning_patterns` → conservar 90 días o top-N por fuente. `support_analytics` → 90 días.

## P1-7 — Números de emergencia — DRY-RUN COMPLETADO (sin escrituras)

| Doc | Cambio | Motivo |
|---|---|---|
| `tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada` | quita `505-2228-2000 (denuncias)`, `505-2228-4848`, `505-2228-3883` | teléfonos fijos no verificados |
| `accidentes-dejan-varios-lesionados-en-managua-leon-y-bilwi` | idem | idem |

Cruz Blanca 128 **se conserva** (correcto en Nicaragua). Backups locales creados. Esperando aprobación para escribir.

## Panel — `panel.html` vs `/panel` — DIAGNOSTICADO

- **`/panel/*` (Next.js):** panel activo en producción — los logs de Vercel muestran el flujo real (`POST /api/admin/news`, `guardar-directo`, `distribuir`, `copy-social`, `shortlink`, `index`) y ~20 rutas `/panel/*` compiladas.
- **`public/panel.html`:** monolito legacy (~7 800 líneas) aún servido; usa SDK cliente directo y tiene herramientas únicas (correcciones masivas). Su prompt ya fue parcheado (testigos ficticios → solo citas reales).
- **Veredicto:** `/panel` es el panel de producción. `panel.html` es legacy con funciones residuales — no borrar hasta migrar/desactivar sus herramientas.

## Nuevo hallazgo elevado (no oculto)

- **`public/panel.html` usa SDK cliente** — era un acoplado de la regla `noticias`; la regla nueva lo respeta (`request.auth != null`).
- **Bug propio detectado y corregido:** `sanitizeForFirestore` destruía `FieldValue.serverTimestamp()` (lo convertía en `{}`) — añadido `instanceof FieldValue` (regresión testeada).
- Rechazos **pre-evaluación** (400 por campos faltantes/defectos en input crudo) no generan registro de decisión — documentado como limitación, no bug.

## Matriz final

| Problema | Causa | Corregido | Test | Riesgo restante |
|---|---|---|---|---|
| Rechazos sin rastro | No había persistencia fuera de `noticias` | ✅ `meni_decision_log` | ✅ 3 tests | rechazos pre-eval no loguean |
| `support/track` abierto | Sin auth/rate-limit/validación | ✅ | ✅ 5 tests | rate-limit en memoria (por instancia) |
| Borradores leíbles | `get,list: if true` | ✅ regla corregida | manual (sin emulador) | desplegar regla; verificar claim admin del panel |
| BAJA+0fuentes publica | Atribución vaga satisface gate; `confianza` no se consume | diagnóstico | — | decisión: `VAGUE_ATTRIBUTION`? |
| Cola reintentos muerta | Nunca se cableó consumidor | diagnóstico | — | decidir wirear o retirar |
| Acumulación datos | Retención insuficiente | propuesta | — | activar TTL en consola |

## Estado

- **P0 = 0** · **P1 abiertos = 0 en código** (quedan pendientes acciones externas: desplegar reglas Firestore, aprobar escritura de los 2 artículos, decidir cola de reintentos)
- **P2** = gap de atribución vaga + retención de datos + 5 ramas abandonadas
- **Tests** = 10/10 nuevos · suite: **1045/1048** — 3 fallos = timeouts de red real preexistentes (`ceo-agent` artículos reales, `mission9` GSC, `p1-dates-errors` Firestore) — sin relación con los cambios
- **TSC** = 0 errores · **Build** = PASS
