# EDITORIAL_AUTHORITY_IMPLEMENTATION_REPORT.md

**Fase:** CIERRE DE AUTORIDAD EDITORIAL (primera fase de implementación tras `fa16c1ae` + `a1ef7ffe`)
**Base de auditoría:** `EDITORIAL_MUTATION_AUDIT.md`
**Alcance:** único objetivo — *una noticia tiene una única autoridad editorial y ningún proceso posterior puede modificar contenido editorial sustantivo saltándose la política de reevaluación.*

---

## 1. Cambios realizados

### Nueva política canónica — `lib/editorial/mutation-policy.ts`

Única puerta para mutaciones post-decisión sobre `noticias`:

- `SUBSTANTIVE_FIELDS` — `titulo, subtitulo, resumen, excerpt, contenido, categoria, autor, related_links, blockquote` (los 5 campos del `contentHash` + campos que renderizan contenido editorial).
- `TECHNICAL_FIELDS` — allowlist operativa (`distribuida, fechaDistribucion, noindex, vistas, confianza, fecha, publishedAt, dateModified, lifecycle, campos de decisión…`).
- `classifyFields(fields)` → `SUBSTANTIVE | TECHNICAL | REQUIRES_REVIEW` (campo desconocido ⇒ REQUIRES_REVIEW).
- `isApprovalCurrent(doc)` — `aprobadoMeni===true AND supervisorApproved===true AND contentHash === computeInputHash(campos actuales)`.
- `applyTechnicalMutation` — solo campos técnicos; **rechaza `publicado:true`/`estado:'publicado'` sin aprobación vigente** (cierra la vía lateral de publicación); escribe `mutationLog`.
- `applySubstantiveMutation` — merge + content-integrity + `guardarConMeni` (MENI + Supervisor). Si la autoridad aprueba → persiste con **nueva** aprobación y nuevo `contentHash`. Si bloquea → `reject` (no persiste, log REJECTED) o `review` (persiste marcado `REVIEW_REQUIRED`, nunca "aparentemente aprobado").
- `flagSubstantiveMutation` — mutación masiva diferida: aplica + `aprobadoMeni:false, scoreMeni:null, editorialState:'REVIEW_REQUIRED', requiresReevaluation:true` + provenance.

### Mutadores reparados (todos los sustantivos del audit)

| Mutador | Antes | Ahora |
|---|---|---|
| `enrich-links` | `contenido` directo + `aprobadoMeni:false`, sin reeval | `applySubstantiveMutation` (ambos modos) — bloqueado ⇒ no persiste |
| `enrich-strong` | ídem | ídem |
| `expandir-7` | **SIN AUTH** + párrafos hardcodeados + reset | `verifyAdminOrCronToken` + `applySubstantiveMutation` |
| `clean-seo` | **SIN AUTH** (solo rate-limit) + reset | `verifyAdminOrCronToken` + `applySubstantiveMutation` |
| `clean-backlog` | `batch.update` titulo/resumen/contenido + reset | `applySubstantiveMutation` + `applyTechnicalMutation` (scoreCalidad) |
| `limpiar-sucesos` | update directo + `doc.ref.delete()` sin auditoría + citas genéricas | `applySubstantiveMutation`; delete → soft-delete auditado en `deletion_audit` |
| `supervisor autofix categoria` | `doc.ref.update({categoria})` sin provenance | `flagSubstantiveMutation` (REVIEW_REQUIRED + provenance) |
| `supervisor autofix publishedAt/archivado` | update directo | `applyTechnicalMutation` |

### Mutadores técnicos enrutados (provenance + guard de publicación)

`publication-pipeline` (distribuida), `distribuir`, `limpiar-noindex`, `repair-fechas` (batch→policy), `eliminar-viejas` (batch→policy), `guardar-directo` confianza, `news/[id]` confianza + metadata-path + soft-delete.

### `news/[id]` PUT — cierre semántico

- `alreadyApproved` = `aprobadoMeni===true` → **`isApprovalCurrent(doc)`** (flag + hash verificado). Publicar con aprobación stale ahora es imposible.
- `autor` salió del whitelist metadata-only (forma parte del hash) — un cambio real de autor dispara reevaluación.

### Sanitizer — causa raíz del `<li>` roto

`decodeHtmlEntities` reintroducía `<`/`>` literales en nodos de texto: `&lt;especial&gt;` volvía a ser markup inyectable en el output. Corregido: las entidades que decodifican a `<`/`>` se preservan codificadas (render idéntico, markup imposible). `aside` agregado a `ALLOWED_TAGS` (el bloque related-links conserva su wrapper semántico).

### Archivos modificados

```
lib/editorial/mutation-policy.ts          (nuevo)
tests/editorial-authority.test.ts         (nuevo, 32 tests)
EDITORIAL_MUTATION_AUDIT.md               (nuevo)
lib/sanitize.ts
lib/supervisor/editorial-supervisor.ts
lib/meni/publication-pipeline.ts
app/api/admin/enrich-links/route.ts
app/api/admin/enrich-strong/route.ts
app/api/admin/clean-backlog/route.ts
app/api/admin/limpiar-sucesos/route.ts
app/api/admin/limpiar-noindex/route.ts
app/api/admin/eliminar-viejas/route.ts
app/api/admin/distribuir/route.ts
app/api/admin/repair-fechas/route.ts
app/api/admin/guardar-directo/route.ts
app/api/admin/news/[id]/route.ts
app/api/clean-seo/route.ts
app/api/expandir-7/route.ts
```

---

## 2. Autoridad antes / después

**ANTES:** Supervisor decidía en las 3 rutas canónicas, pero 7 mutadores reescribían `contenido`/`titulo`/`resumen`/`categoria` post-decisión sin reevaluación, 5 reseteaban `aprobadoMeni:false` dejando notas publicadas en estado contradictorio sin cola de revisión, y 2 rutas de mutación masiva no tenían autenticación.

**DESPUÉS:**

```
CANÓNICO (creación/edición):  guardar-directo │ news POST │ news/[id] PUT │ articles POST
                               → content-integrity → guardarConMeni → MENI → Supervisor → Firestore

MUTACIÓN SUSTANTIVA posterior: → applySubstantiveMutation → misma autoridad (MENI+Supervisor)
                               ├─ aprobada → persiste + nueva aprobación (nuevo contentHash)
                               ├─ bloqueada → RECHAZADA (no persiste, log)
                               └─ bulk/no viable → REVIEW_REQUIRED (aprobación invalidada explícitamente)

MUTACIÓN TÉCNICA:              → applyTechnicalMutation (allowlist + guard de publicación + provenance)

PUBLICAR sin aprobación vigente: IMPOSIBLE por cualquier vía.
```

## 3. Semántica final de `aprobadoMeni`

> **`aprobadoMeni` significa: "el contenido cuyo hash coincide con `contentHash` fue evaluado por MENI y aprobado por el Supervisor".**

- Cambia el contenido ⇒ cambia el hash ⇒ la aprobación anterior **no es válida** para el contenido actual.
- `isApprovalCurrent` lo verifica (flag + supervisorApproved + hash), no solo el booleano.
- Los mutadores ya no escriben `aprobadoMeni:false` como "reset" ambiguo: o la nueva versión sale aprobada (nuevo hash), o la nota queda `REVIEW_REQUIRED` con `requiresReevaluation:true` — estado explícito, no contradicción.

## 4. Provenance

`mutationLog` — array acotado a 20 entradas en el doc de la noticia (sin colección nueva):

```
{ at, actor, reason, fields[], classification, result,
  hashBefore, hashAfter, reeval:{required, meniScore, supervisorVerdict, decisionId} }
```

Responde: quién/proceso, cuándo, qué cambió, por qué, si requirió reevaluación, resultado y decisión final. Complementa (no reemplaza) `deletion_audit` y `supervisorDecision`.

## 5. Corrección `enrich-links`

- **Generador:** `buildRelatedContentBlock` ya emitía markup correcto y escapado — el `<li>slug">` fue histórico.
- **Causa residual real encontrada y corregida:** el sanitizer reintroducía `<`/`>` decodificados en texto (markup inyectable) y `<aside>` se perdía por no estar en la whitelist.
- **Autoridad:** la escritura ahora pasa por `applySubstantiveMutation` — el bloque solo persiste si la nota reevaluada sigue aprobada.
- Regresión cubierta por 4 tests (HTML con/ sin listas, caracteres especiales, bloque vacío, sanitizado).

## 6. Tests / Typecheck / Build

| Verificación | Resultado |
|---|---|
| Tests nuevos (`editorial-authority.test.ts`) | **32/32 PASS** |
| Suite completa | **997/997 PASS** (run anterior: 2 fallos flaky de red GA4/GSC, no relacionados) |
| `tsc --noEmit` | **PASS** (0 errores) |
| `npm run build` | **PASS** (103/103 páginas) |

Cobertura nueva: cambio técnico permitido · sustantivo → reeval · bloqueado no queda aprobado · Supervisor BLOCKED no publica · MENI BLOCKED no publica · título/contenido sustantivos · técnico no dispara reeval · provenance · publish-guard con aprobación stale · content-integrity en mutaciones · regresión `<li>` roto · REVIEW_REQUIRED.

## 7. Riesgos restantes

1. **Mutaciones bulk ahora reevalúan por doc** — `enrich-links masivo`, `clean-seo`, `clean-backlog`, `limpiar-sucesos` son más lentos (1 MENI eval por nota modificada). Son operaciones manuales; `maxDuration` podría limitar corridas masivas grandes — mitigable procesando en tandas.
2. **`REVIEW_REQUIRED` no tiene consumidor dedicado** — las notas marcadas esperan re-guardado manual o futura cola de reevaluación. Es explícito y observable (campo queryable), mejor que el estado contradictorio anterior.
3. **`expandir-7`/`clean-seo`** ahora exigen token admin/cron — integraciones antiguas que los llamaban sin auth recibirán 401 (intencional: eran mutación masiva pública).
4. **El generador externo** sigue produciendo contenido fuera del repo — `content-integrity` lo cubre en escritura, pero su corrección queda como deuda documentada.
5. `slug` permanece técnico en la política (solo rutas canónicas lo cambian tras reevaluación) — revisar si se necesita endurecer.

## 8. Deploy / Smoke tests

**Commit:** `b4ad0a67` → master (pusheado a GitHub)
**Deploy:** Vercel production — `informate-nicaragua-nextjs-5tzrx7xo7` → aliased a `https://nicaraguainformate.com` (build remoto PASS)

### Smoke tests (producción)

| Verificación | Resultado |
|---|---|
| `GET /` | 200 |
| `GET /noticias` | 200 |
| `GET /feed.xml` | 200 |
| `GET /sitemap.xml` | 200 |
| `GET /noticias/[slug]` (artículo real) | 200 |
| `POST /api/expandir-7` sin auth | **401** (antes: público) |
| `POST /api/clean-seo` sin auth | **401** (antes: público) |
| `POST /api/admin/enrich-links` sin auth | 401 |
| `POST /api/admin/enrich-strong` sin auth | 401 |
| `POST /api/admin/clean-backlog` sin auth | 401 |
| `POST /api/admin/limpiar-sucesos` sin auth | 401 |
| `POST /api/admin/guardar-directo` sin auth | 401 |
| `POST /api/admin/news` sin auth | 401 |
| `POST /api/articles` sin auth | 401 |

La invariante queda garantizada: ningún mutador sustantivo puede escribir `contenido`/`titulo`/`resumen`/`categoria`/`autor` sin pasar por content-integrity → MENI → Supervisor, y ninguna vía técnica puede activar `publicado` sin aprobación vigente verificada por `contentHash`.
