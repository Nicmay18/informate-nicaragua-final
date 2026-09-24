# EDITORIAL_MUTATION_AUDIT.md

**Commit base:** `78befa95` (master, sincronizado con GitHub)
**Método:** búsqueda exhaustiva de escrituras reales a Firestore (`.update(`, `.set(`, `batch.update`, `docRef.set`, `articleRef.set`, `ref.update`) sobre la colección `noticias`, más auditores de archivos que referencian `noticias` y tienen llamadas de escritura.
**Regla aplicada:** solo se listan mutadores que escriben en la colección `noticias`. Escrituras a otras colecciones (`article_lifecycles`, `meni_diagnosis`, `distribuciones_pendientes`, `deletion_audit`, `traffic_log`, colecciones NIOS) se descartaron del mapa — no alteran el documento editorial.

---

## 1. MAPA COMPLETO DE MUTADORES

| Mutador | Campo(s) que escribe | Momento | ¿Puede alterar contenido publicado? | ¿Reevalúa? | Autoridad usada | Estado |
|---|---|---|---|---|---|---|
| `app/api/admin/guardar-directo/route.ts` (:267, :271) | Todos (titulo, contenido, resumen, categoria, slug, scoreMeni, aprobadoMeni, supervisorDecision, contentHash…) | Guardado Admin/pipeline | SÍ | SÍ (guardarConMeni → MENI + Supervisor) | Supervisor | **CANÓNICO** |
| `app/api/admin/guardar-directo/route.ts` (:402) | `confianza` (trust layer) | Post-guardado | NO (metadata técnica) | N/A | — | TÉCNICO |
| `app/api/admin/news/route.ts` POST (:251) | Todos vía `docRef.set` | Creación Admin | SÍ | SÍ (guardarConMeni) | Supervisor | **CANÓNICO** |
| `app/api/admin/news/[id]/route.ts` PUT (:134) | Todos (vía meniUpdateData + titulo/contenido/resumen) | Edición Admin | SÍ | SÍ — gate `contentChanged` → guardarConMeni + Supervisor (:35-102) | Supervisor | **CANÓNICO (ya cerrado)** |
| `app/api/admin/news/[id]/route.ts` PUT (:215) | `imagen, autor, destacada, publicado` (whitelist) | Edición metadata-only | NO contenido; `publicado` solo si `aprobadoMeni===true` (:193) | N/A | Gate parcial | TÉCNICO* |
| `app/api/admin/news/[id]/route.ts` PUT (:177) | `confianza` | Post-edición | NO | N/A | — | TÉCNICO |
| `app/api/admin/news/[id]/route.ts` DELETE (:287) | `estado, archived, publicado, noindex, deletedAt, deleteSnapshot` | Borrado Admin | Retira de público, no altera texto | N/A | `deletion_audit` | LIFECYCLE (auditado) |
| `app/api/articles/route.ts` POST (:117) | Todos vía `articleRef.set` | Creación automatizada | SÍ | SÍ (guardarConMeni) | Supervisor | **CANÓNICO** |
| `app/api/admin/enrich-links/route.ts` (:78, :137) | `contenido` (+bloque "También te puede interesar"), `scoreMeni:null`, `aprobadoMeni:false` | Mantenimiento manual | **SÍ** | **NO** | Ninguna | **VIOLA AUTORIDAD** |
| `app/api/admin/enrich-strong/route.ts` (:180) | `contenido` (inserta `<strong>`), `scoreMeni:null`, `aprobadoMeni:false` | Mantenimiento manual | **SÍ** | **NO** | Ninguna | **VIOLA AUTORIDAD** |
| `app/api/expandir-7/route.ts` (:45) | `contenido` (+párrafos hardcodeados por slug), `scoreMeni:null`, `aprobadoMeni:false` | Migración puntual | **SÍ** | **NO** | Ninguna — **SIN AUTH** | **VIOLA AUTORIDAD + CRÍTICO** |
| `app/api/clean-seo/route.ts` (:54) | `contenido` (regex-clean), `scoreMeni:null`, `aprobadoMeni:false` | Mantenimiento | **SÍ** | **NO** | Ninguna — **SIN AUTH** (solo rate-limit) | **VIOLA AUTORIDAD + CRÍTICO** |
| `app/api/admin/clean-backlog/route.ts` (:170) | `titulo`, `resumen`, `contenido`, `scoreCalidad`, `scoreMeni:null`, `aprobadoMeni:false` | Mantenimiento masivo | **SÍ** | **NO** | Ninguna | **VIOLA AUTORIDAD** |
| `app/api/admin/limpiar-sucesos/route.ts` (:351) | `titulo`, `contenido`, `resumen`, `scoreMeni:null`, `aprobadoMeni:false` | Mantenimiento masivo | **SÍ** | **NO** | Ninguna | **VIOLA AUTORIDAD** |
| `lib/supervisor/editorial-supervisor.ts` `applySafeAutoFixes` (:763) | `categoria` (reclasificación masiva, notas publicadas) | Cron `supervisor-watch` | **SÍ** (taxonomía visible) | **NO** | Ninguna | **VIOLA AUTORIDAD (suave)** |
| `lib/supervisor/editorial-supervisor.ts` `applySafeAutoFixes` (:784) | `publishedAt` (backfill desde `fecha`) | Cron `supervisor-watch` | NO contenido (fecha técnica) | N/A | — | TÉCNICO |
| `lib/supervisor/editorial-supervisor.ts` `applySafeAutoFixes` (:804) | `estado, archived` (solo borradores >7d) | Cron `supervisor-watch` | NO (no publicadas) | N/A | — | LIFECYCLE |
| `lib/meni/publication-pipeline.ts` (:347) | `distribuida`, `fechaDistribucion` | Post-publicación | NO | N/A | — | TÉCNICO |
| `app/api/admin/distribuir/route.ts` (:367) | `distribuida`, `fechaDistribucion` | Distribución manual | NO | N/A | — | TÉCNICO |
| `app/api/admin/limpiar-noindex/route.ts` (:24) | `noindex:false` | Mantenimiento | NO (flag SEO técnico) | N/A | — | TÉCNICO |
| `app/api/admin/repair-fechas/route.ts` (:179) | `fecha`, `publishedAt` | Reparación puntual | Fechas visibles al lector — no alteran afirmaciones | N/A | Audita cambios en response | **TÉCNICO-METADATA (documentado)** |
| `app/api/admin/eliminar-viejas/route.ts` (:59) | `estado, archived, publicado, noindex, deletedAt, deleteReason` | Cron/manual | Retira de público, no altera texto | N/A | `deletion_audit` | LIFECYCLE (auditado) |

### Descartados tras inspección (no escriben `noticias`)

`persistWatchResult` → `article_lifecycles` · `departamento-central/workers.ts` → `meni_diagnosis` · `distribuir` → `distribuciones_pendientes` · `resumen-diario` → registro propio · `nios/operational-loop` → colecciones NIOS · `data-merger`, `metrics-collector`, `correcciones`, `data.ts`, `db/homepage`, `homepage-audit`, `analizador-duplicados`, `knowledge-health` → Map in-memory u otras colecciones · `crecimiento`, `dashboard-calidad`, `traffic`, `auditor-dashboard` → solo lectura · `supervisor-gate` → comentario/código muerto.

---

## 2. CLASIFICACIÓN

### A. Sustantiva editorial (requiere reevaluación)

- `enrich-links` — inserta bloque visible de enlaces en `contenido`.
- `enrich-strong` — altera markup visible de `contenido`.
- `expandir-7` — **inserta párrafos editoriales completos con afirmaciones** (hardcodeados por slug). El más invasivo de todos.
- `clean-seo` — elimina texto visible de `contenido`.
- `clean-backlog` — reescribe `titulo` + `resumen` + `contenido`.
- `limpiar-sucesos` — reescribe `titulo` + `contenido` + `resumen`.
- `supervisor autofix categoria` — cambia taxonomía visible en notas publicadas.

### B. Técnica/no sustantiva

- `publication-pipeline` / `distribuir` — flags de distribución.
- `limpiar-noindex` — flag SEO.
- `confianza` (guardar-directo, news/[id]) — trust layer.
- `repair-fechas` — `fecha`/`publishedAt` (reparación de metadatos, auditada en response).
- `eliminar-viejas` / `news/[id]` DELETE — lifecycle, auditado en `deletion_audit`.
- `autofix publishedAt`, `autofix archivado` — técnico/lifecycle.

### C. Ambigua → REQUIRES_REVIEW

- Ninguna restante. `categoria` se clasificó sustantiva (es visible y forma parte del `contentHash`); `fecha`/`publishedAt` se clasificaron técnico-metadata (reparación de datos, no afirmaciones editoriales).

---

## 3. VULNERABILIDADES CONFIRMADAS

1. **Seis mutadores sustantivos escriben `contenido`/`titulo` post-publicación sin reevaluación** — y cinco de ellos escriben `aprobadoMeni:false` dejando notas publicadas en estado contradictorio (publicada + no aprobada) sin cola de revisión que las procese.
2. **`expandir-7` y `clean-seo` no tienen autenticación** — cualquiera puede disparar mutación masiva de contenido (`expandir-7` además inyecta párrafos editoriales completos hardcodeados).
3. **`aprobadoMeni:false` + `scoreMeni:null` como "reset" no es semántica válida**: el artículo permanece `publicado:true` con contenido nuevo y aprobación invalidada — no hay reevaluación ni estado de revisión.
4. **`contentHash` existe pero nadie lo verifica** — `guardarConMeni` escribe `meni.articleHash` (hash de titulo+resumen+contenido+categoria+autor), pero ningún mutador ni lector comprueba que la aprobación corresponda al contenido actual.
5. **Autofix de categoría del propio Supervisor** modifica notas publicadas sin registrar provenance.
6. **`enrich-links` es el origen del defecto `<li>slug">`** del saneamiento. El generador actual (`buildRelatedContentBlock`, `lib/article-links.ts:11`) ya emite markup correcto y escapado — la corrupción fue histórica. Riesgo residual: `<aside>` no está en la whitelist del sanitizer (`lib/sanitize.ts:33`), por lo que el wrapper semántico se pierde al sanitizar.

---

## 4. INVARIANTE PROPUESTA (a implementar)

```
APROBADA = aprobadoMeni===true AND supervisorApproved===true
           AND contentHash === hash(titulo+resumen+contenido+categoria+autor actual)

Escritura TÉCNICA (campos allowlist)        → permitida, provenance ligera
Escritura SUSTANTIVA vía canonical path     → reevalúa (MENI+Supervisor)
                                              ├─ aprobada → persiste + nueva aprobación vigente
                                              └─ bloqueada → RECHAZADA (no persiste)
Escritura SUSTANTIVA bulk (sin reeval)      → NO PERMITIDA; se marca REVIEW_REQUIRED
                                               (aprobadoMeni:false + mutationLog)
```

Semántica final de `aprobadoMeni`: **"el contenido cuyo hash coincide con `contentHash` fue aprobado"**. Un hash distinto ⇒ aprobación anterior no válida para el contenido actual.

## 5. PLAN DE CIERRE

1. `lib/editorial/mutation-policy.ts` — clasificador + `applyEditorialMutation` (única puerta para mutaciones post-decisión).
2. Enrutar los 6 mutadores sustantivos por la política; agregar auth a `expandir-7` y `clean-seo`.
3. Autofix de categoría: provenance + flag de revisión.
4. `aside` en whitelist del sanitizer + test de regresión del bloque related-links.
5. `mutationLog` (array acotado en el doc) como provenance mínima.
6. Tests obligatorios + suite completa + tsc + build.
