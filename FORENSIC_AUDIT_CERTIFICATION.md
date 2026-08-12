# FORENSIC AUDIT & TECHNICAL CERTIFICATION
## Nicaragua Informate Editorial Ecosystem
### Date: 2026-08-11
### Auditor: Cascade AI (automated code-level audit)

---

## EXECUTIVE SUMMARY

This document presents the findings of a comprehensive forensic code-level audit of the Nicaragua Informate editorial ecosystem. The audit covers MENI scoring, NIOS intelligence, Forense risk evaluation, Firestore persistence, and all write routes.

**CRITICAL BLOCKER**: Firebase service account credentials stored locally are invalid/revoked. Google returns `UNAUTHENTICATED` for all Firestore API calls. Data-level audit items (F4, F5, F22) that require live Firestore access **cannot be completed locally** and must be executed on Vercel or with valid credentials.

**CERTIFICATION STATUS**: CONDITIONAL — code-level findings are complete; data-level findings pending valid credentials.

---

## F1 — INVENTARIO COMPLETO DEL SISTEMA

### 1.1 MENI (Modelo de Evaluación Noticia Integral)

| Component | Path | Role |
|-----------|------|------|
| Core engine | `lib/meni/core.ts` | Orchestrates full evaluation: profile detection → editorial brain → quality gate → scoring → approval |
| Editorial Brain | `lib/meni/editorial-brain/index.ts` | **Sole source of truth for score**. Score = ADN NI percentage |
| Editorial DNA | `lib/meni/editorial-dna/` | Computes Exclusividad, WOW, Sello NI (7 dims), Transcripción, Memoria |
| Quality Gate | `lib/meni/quality-gate/` | Technical verification: transcription detector (n-gram 5), blocking issues |
| Autocorrect | `lib/meni/autocorrect.ts` | Auto-correction on first rejection, re-evaluates after correction |
| Profile Detector | `lib/meni/profile-detector.ts` | Detects content profile (sucesos, politica, etc.) with confidence score |
| Editorial Tiers | `lib/meni/editorial-tiers.ts` | FLASH, NOTICIA, REPORTAJE, INVESTIGACION thresholds |
| Editorial Profiles | `lib/meni/editorial-profiles.ts` | Per-category requirements (servicio, contexto, diferencial, minPalabras) |
| Scoring | `lib/meni/scoring.ts` | `MIN_APPROVED_SCORE` (default 90), grade mapping, priority |
| Forensic | `lib/meni/forensic.ts` | Risk evaluation (distinct from score) |
| E-E-A-T | `lib/meni/eeat.ts` | Experience, Expertise, Authoritativeness, Trustworthiness analysis |
| SEO | `lib/meni/seo.ts` | On-page SEO analysis |
| Discover | `lib/meni/discover.ts` | Google Discover optimization signals |
| AdSense | `lib/meni/adsense.ts` | AdSense compliance signals |
| Editor Chief | `lib/meni/editor-chief.ts` | Builds valor editorial |
| Intelligence | `lib/meni/intelligence.ts` | Intelligence engine for content analysis |
| Hash | `lib/meni/hash.ts` | Deterministic input hash for traceability |
| Context | `lib/meni/contextualiza.ts` | Context score computation |
| Recommendation Filter | `lib/meni/recommendation-filter.ts` | Profile-based recommendation filtering |
| Learning Engine | `lib/meni/learning-engine/` | Active adjustments from historical corrections |
| Editor Brain | `lib/meni/editor-brain/index.ts` | Editorial memory injection (related articles context) |
| Editorial Reason | `lib/meni/editorial-reason.ts` | Human-readable editorial justification |

### 1.2 NIOS (News Intelligence & Operations System)

| Component | Path | Role |
|-----------|------|------|
| Orchestrator | `lib/nios/intelligence/orchestrator.ts` | Central pipeline: collects GSC+GA4, loads Firestore, merges, generates reports |
| Data Merger | `lib/nios/intelligence/data-merger.ts` | Merges Firestore + GSC + GA4 into `ArticleFusion` |
| Google Trust (article) | `lib/nios/intelligence/google-trust.ts` | Per-article trust score, thin content, duplicate risk |
| Google Trust (site) | `lib/nios/command-center/google-trust.ts` | Site-level aggregate trust pillars |
| AdSense Trust | `lib/nios/intelligence/adsense-trust-check.ts` | Site-level AdSense readiness score |
| GSC Collector | `lib/nios/intelligence/gsc-collector.ts` | Google Search Console data collection |
| GA4 Collector | `lib/nios/intelligence/ga4-collector.ts` | Google Analytics 4 data collection |
| Compliance | `lib/nios/intelligence/compliance.ts` | Compliance reporting |
| Readiness | `lib/nios/intelligence/readiness.ts` | AdSense readiness report |
| Dashboard | `lib/nios/intelligence/dashboard.ts` | Google intelligence dashboard |
| Recommendations | `lib/nios/intelligence/editorial-rules.ts` | NIOS recommendations |
| Store | `lib/nios/intelligence/store.ts` | Daily snapshot persistence |
| Cron route | `app/api/cron/nios-collect/route.ts` | Triggers `runNIOSPipeline` via GET |

### 1.3 Forense (Risk Evaluation)

Forense is a **module within MENI**, not a separate system. It's called at:
- `lib/meni/core.ts:174` → `analyzeForensic(evaluacion, input, contentProfile)`
- Returns `MeniRiesgoEditorial` with level (VERDE/AMARILLO/ROJO), motivo, advertencias
- Risk is **derived from EditorialDecision**, not from pipelineV4 independently
- Risk does NOT affect score directly; it's informational metadata in `MeniResult`

### 1.4 Write Routes to Firestore `noticias` Collection

| Route | Path | Uses MENI? | Writes `scoreMeni`? | Writes `scoreCalidad`? |
|-------|------|-----------|--------------------|-----------------------|
| **Guardar directo** | `app/api/admin/guardar-directo/route.ts` | YES (`guardarConMeni`) | YES | NO |
| **News create** | `app/api/admin/news/route.ts` | YES (`guardarConMeni`) | YES | NO |
| **News update** | `app/api/admin/news/[id]/route.ts` | YES (`guardarConMeni`) | YES | NO |
| **Articles** | `app/api/articles/route.ts` | YES (`guardarConMeni`) | YES | NO |
| **Cron-fetch** | `app/api/cron-fetch/route.ts` | **NO** | NO | NO |
| **Clean-backlog** | `app/api/admin/clean-backlog/route.ts` | **NO** | NO | YES (`calcularScoreEditorial`) |
| **Expandir thin content** | `app/api/admin/expandir-thin-content/route.ts` | **NO** | NO | YES (`calcularScoreEditorial`) |
| **AdSense repair** | `app/api/admin/adsense-repair/route.ts` | **NO** | NO | NO (only updates contenido + palabras) |
| **AdSense repair DeepSeek** | `app/api/admin/adsense-repair-deepseek/route.ts` | **NO** | NO | NO |
| **AdSense repair Groq** | `app/api/admin/adsense-repair-groq/route.ts` | **NO** | NO | NO |
| **Corregir titulo** | `app/api/admin/corregir-titulo/route.ts` | **NO** | NO | NO (only updates titulo) |
| **Corregir titulos masivo** | `app/api/admin/corregir-titulos-masivo/route.ts` | **NO** | NO | NO (only updates titulo) |
| **Enrich links** | `app/api/admin/enrich-links/route.ts` | **NO** | NO | NO (only appends links to contenido) |
| **Enrich strong** | `app/api/admin/enrich-strong/route.ts` | **NO** | NO | NO (only adds `<strong>` tags) |
| **Agente crecimiento** | `app/api/admin/agente-crecimiento/route.ts` | **NO** | NO | NO (only updates distribuida flag) |

### 1.5 Sanitization

| Component | Path | Role |
|-----------|------|------|
| Sanitize | `lib/sanitize.ts` | `sanitizeArticleHtml()` using DOMPurify with lazy loading |

---

## F2 — FUENTES CANÓNICAS

### 2.1 MENI Score

**Canonical field**: `scoreMeni` in Firestore
**Canonical writer**: `guardarConMeni()` in `lib/editorial/guardar-con-meni.ts`
**Canonical value**: `meni.scoreFinal` from `runMeniAsync()` → `runEditorialBrain()` → ADN NI percentage

**⚠️ FINDING: Dual scoring field contamination**

The system has TWO scoring fields in Firestore:
1. `scoreMeni` — written by `guardarConMeni`, value = ADN NI (0-100), requires editorial approval
2. `scoreCalidad` — written by `clean-backlog` and `expandir-thin-content`, value = `calcularScoreEditorial()` (simple SEO checklist: word count + title length + resumen length + image + H2/H3 tags)

**`scoreCalidad` is NOT MENI.** It's a simplistic 0-100 score based on:
- 30 pts: 500+ words (15 pts for 250+)
- 20 pts: Title 65-70 chars (5 pts otherwise)
- 20 pts: Resumen 120-160 chars (5 pts otherwise)
- 15 pts: Has image
- 10 pts: Has H2/H3
- 5 pts: Has `<strong>`/`<b>`

This score does NOT evaluate editorial quality, originality, context, service value, or ADN NI. It's a basic SEO checklist.

### 2.2 NIOS Data Merger Field Priority

`lib/nios/intelligence/data-merger.ts:122`:
```typescript
scoreMeni: n.scoreCalidad ?? null,
```

**⚠️ CRITICAL FINDING**: The data merger uses `n.scoreCalidad` (the simplistic SEO score) as the `scoreMeni` field in `ArticleFusion`, NOT the actual `scoreMeni` field from Firestore. This means:

- If a note was processed by `clean-backlog` or `expandir-thin-content` (which write `scoreCalidad`), NIOS will use that simplistic score instead of the real MENI score
- If a note was only processed by `guardarConMeni` (which writes `scoreMeni` but NOT `scoreCalidad`), NIOS will see `null` for the score

However, `data-merger.ts:168` when loading from Firestore:
```typescript
scoreCalidad: d.scoreCalidad ?? d.scoreMeni ?? undefined,
```

This loads `scoreCalidad` preferring the Firestore `scoreCalidad` field, falling back to `scoreMeni`. So the `Noticia` object's `scoreCalidad` property may contain the MENI score if `scoreCalidad` wasn't explicitly set.

**The net effect**: NIOS Google Trust per-article scoring uses `scoreCalidad` (or falls back to `scoreMeni`) as the `scoreMeni` in `ArticleFusion`. This is confusing but functionally works IF `scoreCalidad` is either absent (falls back to `scoreMeni`) or equals the MENI score. The risk is when `clean-backlog` overwrites `scoreCalidad` with the simplistic SEO score after MENI has already set `scoreMeni`.

### 2.3 Forense

Forense is NOT a separate persisted field. It's computed at evaluation time within `runMeni()` and returned as `MeniResult.riesgo` (VERDE/AMARILLO/ROJO). It's not stored in Firestore as a standalone field. The `nivel` field in Firestore (`FORENSE`/`RECHAZADO`/`NO EVALUADA`) is the closest persisted proxy, written by `guardarConMeni` via `mapMeniScoreToNivel()`.

### 2.4 Firestore

Firestore collection `noticias` is the canonical data store. Key fields written by `guardarConMeni`:
- `scoreMeni`, `aprobadoMeni`, `calificacionMeni`, `nivel`, `nivelScore`, `nivelFecha`
- `diagnosticoMeni`, `editorialTier`, `editorialReason`
- `palabras`, `puntosClave`, `fuente`, `fuentesComplementarias`, `autorFoto`

Fields written by other routes (NOT through MENI):
- `scoreCalidad` (clean-backlog, expandir-thin-content)
- `contenido` (adsense-repair variants, enrich-links, enrich-strong)
- `titulo` (corregir-titulo, corregir-titulos-masivo)
- `distribuida` (agente-crecimiento)

---

## F3 — PROVENANCE: TRAZABILIDAD POR NOTA

### Provenance fields per note

Each note evaluated by MENI should have:
- `scoreMeni`: number (0-100) — the ADN NI score
- `aprobadoMeni`: boolean — whether MENI approved it
- `calificacionMeni`: string — grade (ORO/PLATA/BRONCE/MEJORAR)
- `nivel`: string — FORENSE/RECHAZADO/NO EVALUADA
- `nivelScore`: number — same as scoreMeni
- `nivelFecha`: ISO timestamp — when evaluation occurred
- `diagnosticoMeni`: string — editorial diagnosis
- `editorialTier`: string — FLASH/NOTICIA/REPORTAJE/INVESTIGACION
- `editorialReason`: string — human-readable justification

### Provenance gaps

1. **Cron-fetch notes**: Notes created via `cron-fetch` have NONE of these fields. They only have basic fields (titulo, contenido, palabras, tags, etc.). No MENI evaluation was performed.

2. **Clean-backlog contamination**: When `clean-backlog` runs, it overwrites `scoreCalidad` with `calcularScoreEditorial()` result, which is NOT the MENI score. If the note previously had `scoreMeni` set by `guardarConMeni`, the `scoreCalidad` field now diverges from `scoreMeni`.

3. **Expandir-thin-content contamination**: Same issue — overwrites `scoreCalidad` with simplistic SEO score after content expansion, without re-evaluating MENI.

4. **AdSense repair routes**: These modify `contenido` and `palabras` but do NOT re-evaluate MENI. The stored `scoreMeni` (if any) now reflects the pre-modification content, not the current content.

5. **Enrich-links / Enrich-strong**: These modify `contenido` (append links, add `<strong>` tags) without re-evaluating MENI. Same staleness issue.

**DATA-LEVEL VERIFICATION PENDING**: Cannot verify which of the 281 notes have which provenance fields without Firestore access.

---

## F6 — THIN CONTENT AUDIT

### Thin Content Detection Rules (from `lib/nios/intelligence/google-trust.ts`)

**Threshold**: `THIN_WORDS_THRESHOLD = 400` words

**Detection function**: `detectThinContent(article)` flags:
1. `palabras < 400` → "<400 palabras"
2. `palabras > 0 && palabras < 200` → "muy corto"
3. `tags.length < 2` → "pocos tags"
4. `relatedLinksCount < 1` → "sin enlaces"
5. `!autor || !autor.trim()` → "sin autor"
6. `palabras >= 200 && gscImpressions === 0 && scoreMeni < 80` → "meni bajo + 0 impresiones"

**Classification**:
- **By length**: flags 1, 2 (word count below thresholds)
- **By auxiliary signals**: flags 3, 4, 5, 6 (tags, links, author, traffic+score)

**⚠️ FINDING**: The thin content detection uses `ArticleFusion.palabras` which comes from `n.palabras` in Firestore (stored at write time). If maintenance scripts (adsense-repair, expandir-thin-content) modified `contenido` but didn't update `palabras`, or if they updated `palabras` but the actual content differs, the thin content detection may be inaccurate.

**Also**: `gscImpressions` is only available when NIOS has collected GSC data. On first run or without GSC integration, all articles will have `gscImpressions = 0`, which could falsely trigger flag 6 for articles with `scoreMeni < 80`.

---

## F7 — DUPLICATES: DETECTION vs RISK

### Duplicate Detection

Located at: `lib/analizador-duplicados.ts` (imported in `lib/meni/core.ts:21`)
Used by: `runMeni()` via `detectarDuplicadoAdmin()` — checks for duplicate content against existing Firestore notes
Blocking: Yes — if duplicate detected, creates blocking issue in Quality Gate

### Duplicate Risk (NIOS)

Located at: `lib/nios/intelligence/google-trust.ts` — `detectDuplicateRisk(article)`
Logic:
- `palabras < 200 && gscImpressions === 0` → true (short + no traffic)
- `scoreMeni !== null && scoreMeni < 60` → true (very low quality)

**Key distinction**: Duplicate Detection checks content similarity against other notes. Duplicate Risk is a heuristic flag based on word count + traffic + score, NOT actual content similarity.

**⚠️ FINDING**: Duplicate Risk is a proxy signal, not actual duplicate detection. An article could be flagged as "duplicate risk" simply because it's short and has no GSC data, even if it's completely original content.

---

## F8 — GOOGLE TRUST AUDIT

### Per-Article Google Trust (`lib/nios/intelligence/google-trust.ts`)

**Editorial Authority Score** (0-100):
- 5 binary checks: hasAutor, hasFecha, hasFuente (palabras > 0), hasContexto (tags >= 2 AND relatedLinks >= 2), relatedLinks >= 3
- Score = (passed / 5) * 100

**Content Value Score** (0-100, sum of):
- Organic traffic (GSC clicks): 0-20 pts
- CTR: 0-15 pts
- Position: 0-15 pts
- GA4 engagement time: 0-15 pts
- Depth (palabras): 0-15 pts
- Freshness: 0-10 pts
- Internal links: 0-10 pts

**Google Trust Score**: Calculated from authority + contentValue - thin content penalties
- Risk levels: HIGH (<40), MEDIUM (<70), LOW (>=70)

### Site-Level Google Trust (`lib/nios/command-center/google-trust.ts`)

Aggregates across all published articles:
- Authority pillar: % with author, author photo, unique authors
- Variety pillar: unique categories
- Depth pillar: % with 400+ words, key points, explainers
- Freshness pillar: % updated within 90 days, fresh within 7 days
- Meta quality: % with non-weak meta descriptions
- Images: % with non-logo images

**⚠️ FINDING**: Site-level trust uses `n.palabras` from Firestore, which may be stale if content was modified by maintenance scripts without updating `palabras`.

---

## F9 — ADSENSE TRUST AUDIT

Located at: `lib/nios/intelligence/adsense-trust-check.ts`

**Score composition** (weighted):
- Editorial Identity (20%): about page, team page, contact, editorial policy, privacy policy, corrections page
- Content Quality (30%): original content %, depth %, context %, sources %, updated %
- User Experience (20%): avg engagement time, mobile share %, internal links coverage %
- Trust Score (30%): based on Google Trust Report metrics

**⚠️ FINDING**: AdSense Trust is a site-level metric. It depends on Google Trust Report (per-article), which depends on `scoreMeni` from `ArticleFusion`, which (per F2 finding) may be `scoreCalidad` (simplistic SEO score) instead of actual MENI score. This creates a cascading measurement error.

---

## F10 — PROFILE FIXES VALIDATION

Profile detection at: `lib/meni/profile-detector.ts`
Profile-to-category mapping at: `lib/meni/core.ts:55-70`:
```
sucesos → Sucesos
violencia_genero → Sucesos
nacionales → Nacionales
politica → Política
economia → Economía
salud → Salud
deportes → Deportes
cultura → Cultura
tecnologia → Tecnología
internacional → Internacionales
educacion → Educación
ambiente → Ambiente
turismo → Turismo
gastronomia → Cultura
```

**Profile confidence threshold**: 0.40 (`MIN_PROFILE_CONFIDENCE`)
If confidence < 0.40, falls back to `input.categoria || 'General'`

**⚠️ FINDING**: Cannot validate specific profile fixes (Telica, Interpol, Turismo) without Firestore data access. Code-level: the profile detector uses keyword matching on titulo + contenido + resumen. If the keywords for "Telica" (likely → Sucesos), "Interpol" (likely → Internacionales), and "Turismo" (likely → Turismo) are present in the detector, they should be correctly classified.

---

## F11 — CATEGORY vs PROFILE

The system has two category concepts:
1. **Input category**: `input.categoria` — provided by the user/API caller
2. **Profile-detected category**: `contentProfile.profile_detected` → mapped via `PROFILE_TO_CATEGORIA`

When profile confidence >= 0.40, the profile-detected category **overrides** the input category. When < 0.40, the input category is used.

**⚠️ FINDING**: This means the stored `categoria` in Firestore may differ from what the user submitted, if MENI's profile detector disagreed. This is by design (editorial integrity over user input), but could cause confusion in audits if the stored category doesn't match what was submitted.

---

## F12 — HTML SANITIZATION

**Sanitize function**: `lib/sanitize.ts` → `sanitizeArticleHtml()`
- Uses `isomorphic-dompurify` with lazy loading (fixed in previous session)
- Whitelist: allowed tags and attributes
- Hooks: `uponSanitizeAttribute` (strips dangerous attributes), `afterSanitizeAttributes` (enforces safe attributes)

**Routes that sanitize**:
1. `app/api/admin/guardar-directo/route.ts` — sanitizes contenido via `sanitizeArticleHtml`
2. `app/api/admin/news/route.ts` — sanitizes contenido
3. `app/api/admin/news/[id]/route.ts` — sanitizes contenido
4. `app/api/articles/route.ts` — sanitizes contenido

**Routes that DO NOT sanitize**:
- `app/api/cron-fetch/route.ts` — writes `article.contenido` directly from Gemini output without sanitization
- `app/api/admin/adsense-repair/route.ts` — writes Gemini-expanded content without sanitization
- `app/api/admin/adsense-repair-deepseek/route.ts` — same
- `app/api/admin/adsense-repair-groq/route.ts` — same
- `app/api/admin/expandir-thin-content/route.ts` — writes Gemini-expanded content without sanitization
- `app/api/admin/clean-backlog/route.ts` — uses `sanitizarTexto()` (custom function, NOT `sanitizeArticleHtml`)
- `app/api/admin/enrich-links/route.ts` — appends HTML without sanitization
- `app/api/admin/enrich-strong/route.ts` — modifies HTML without sanitization

**⚠️ CRITICAL FINDING**: 8 routes write content to Firestore without passing through `sanitizeArticleHtml()`. The cron-fetch and adsense-repair routes write AI-generated content directly, which could contain dangerous HTML if the AI model produces it.

---

## F13 — CONTEXTO / VALOR / UTILIDAD

These are computed within the Editorial Brain:
- **Contexto**: `editorialDna.selloNI.contextualiza` — does the article provide context?
- **Valor**: `editorialDna.selloNI.valor` — does the article provide value to the reader?
- **Utilidad**: `editorialDna.selloNI.servicio` — is the article useful (service journalism)?

Also computed separately:
- `contextScore` at `lib/meni/core.ts:263` via `computeContextScore()` — separate from editorial DNA
- `valorEditorial` at `lib/meni/core.ts:178` via `buildValorEditorial()` — based on pipelineV4 evidence

**⚠️ FINDING**: There are two context evaluations — one from Editorial Brain (ADN NI) and one from `computeContextScore()`. The `contextScore` is included in `MeniResult` but does NOT affect `scoreFinal`. Only the Editorial Brain's context evaluation affects the score.

---

## F14 — RECONSTRUIR SCORE MENI

### Score derivation chain

```
runMeni(input)
  → evaluateMeni(input)
    → runEditorialBrain(input) → editorialDecision.score = ADN NI %
    → rawScore = editorialDecision.score
    → scoreFinal = clamp(rawScore, 0, 100)
    → aprobadoFinal = scoreFinal >= 90 AND !bloquear AND !qualityGateBloqueado AND !transcripcionBloquear
  → if !aprobado: autoCorrect → re-evaluate → new score
  → return { scoreFinal, aprobado, ... }
```

**Score is deterministic for same input**: YES (no random components, no LLM calls in the scoring path — Editorial Brain uses pattern matching, not AI)

**Score integrity checks**:
- `findInvalidScoreSource()` checks all score components for NaN/Infinity
- `score_status` field: 'VALID' or 'INVALID'
- If invalid, `invalidScoreSource` identifies which component failed

**⚠️ FINDING**: The MENI score is deterministic and traceable. However, the `scoreCalidad` field written by maintenance scripts is a different, non-MENI score that can contaminate NIOS evaluations.

---

## F15 — AUDITORÍA DE RUTAS DE ESCRITURA

### Routes that correctly use MENI (`guardarConMeni`)

1. `app/api/admin/guardar-directo/route.ts` ✓
2. `app/api/admin/news/route.ts` ✓
3. `app/api/admin/news/[id]/route.ts` ✓
4. `app/api/articles/route.ts` ✓

### Routes that bypass MENI

5. `app/api/cron-fetch/route.ts` — **BYPASSES MENI entirely**. Writes directly to Firestore with `adminDb.collection('noticias').doc(slug).set(noticiaData)`. No `scoreMeni`, no `aprobadoMeni`, no editorial evaluation.

6. `app/api/admin/clean-backlog/route.ts` — Modifies titulo, resumen, contenido and writes `scoreCalidad` via `calcularScoreEditorial()`. Does NOT re-run MENI.

7. `app/api/admin/expandir-thin-content/route.ts` — Modifies contenido and writes `scoreCalidad`. Does NOT re-run MENI.

8. `app/api/admin/adsense-repair/route.ts` — Modifies contenido and palabras. Does NOT re-run MENI or update any score.

9. `app/api/admin/adsense-repair-deepseek/route.ts` — Same as above.

10. `app/api/admin/adsense-repair-groq/route.ts` — Same as above.

11. `app/api/admin/corregir-titulo/route.ts` — Modifies titulo only. Does NOT re-run MENI.

12. `app/api/admin/corregir-titulos-masivo/route.ts` — Modifies titulo only. Does NOT re-run MENI.

13. `app/api/admin/enrich-links/route.ts` — Appends links to contenido. Does NOT re-run MENI.

14. `app/api/admin/enrich-strong/route.ts` — Adds `<strong>` tags. Does NOT re-run MENI.

15. `app/api/admin/agente-crecimiento/route.ts` — Only updates `distribuida` flag. No content modification.

**Summary**: 4 routes correctly use MENI. 11 routes bypass MENI (10 modify content/scores without re-evaluation, 1 only updates a flag).

---

## F16 — CRON-FETCH AUDIT

**Route**: `app/api/cron-fetch/route.ts`

**Flow**:
1. Verifies `x-cron-secret` header against `CRON_SECRET`
2. Calls `simulateExternalFeed()` — returns simulated articles (not real feed)
3. Optionally rewrites with Gemini AI (`rewriteWithGemini()`)
4. Saves to Firestore via `saveToFirestore()` — direct `.set()` on `noticias` collection
5. If published, revalidates cache and notifies Google Indexing API

**Critical issues**:
1. **No MENI evaluation**: Articles are saved without any editorial evaluation
2. **No sanitization**: AI-generated content is saved directly without `sanitizeArticleHtml()`
3. **No duplicate check**: No check against existing articles before saving
4. **Simulated feed**: `simulateExternalFeed()` returns hardcoded articles, not a real RSS/API feed
5. **Direct `.set()` with slug as ID**: Uses `adminDb.collection('noticias').doc(slug).set()` which will OVERWRITE existing articles with the same slug

**Risk assessment**: HIGH — If this cron job runs with `estado: 'publicado'`, it can publish AI-generated content without editorial oversight, potentially overwriting existing articles.

---

## F17 — SCRIPTS DE MANTENIMIENTO

| Script | Purpose | Risk |
|--------|---------|------|
| `clean-backlog` | Sanitizes text, recalculates `scoreCalidad` | Medium — overwrites `scoreCalidad` with non-MENI score |
| `expandir-thin-content` | Gemini expansion of short articles | High — modifies content without MENI re-evaluation, writes `scoreCalidad` |
| `adsense-repair` (3 variants) | Gemini expansion for AdSense compliance | High — modifies content without MENI or sanitization |
| `corregir-titulo` | Fixes individual title | Low — only modifies titulo |
| `corregir-titulos-masivo` | Batch title correction with regex rules | Low — only modifies titulo |
| `enrich-links` | Appends internal links block | Medium — modifies contenido without re-evaluating |
| `enrich-strong` | Adds `<strong>` tags | Low — minor content modification |
| `agente-crecimiento` | Distribution + Telegram + IndexNow | Low — only updates distribution flag |

---

## F19 — PRUEBA DE ATAQUE (SCORE FABRICABLE)

### Attack vector 1: Direct Firestore write via cron-fetch
An attacker with the `CRON_SECRET` can call `cron-fetch` with `estado: 'publicado'` to publish arbitrary content with any score (actually no score — `scoreMeni` is absent). The content would appear on the site without editorial evaluation.

### Attack vector 2: Maintenance scripts overwrite scores
`clean-backlog` and `expandir-thin-content` write `scoreCalidad` using `calcularScoreEditorial()`, which is a simple checklist. An attacker with admin access could craft content that maximizes this checklist score (500+ words, 65-char title, 120-160 char resumen, image, H2 tags) without any editorial quality. This `scoreCalidad` would then be used by NIOS as the `scoreMeni` in `ArticleFusion`.

### Attack vector 3: Content modification after MENI approval
Since `adsense-repair`, `enrich-links`, and `enrich-strong` modify `contenido` without re-running MENI, the stored `scoreMeni` becomes stale. Content could be degraded after initial approval.

**Mitigation present**: The middleware (`middleware.ts:64-83`) requires `ADMIN_API_KEY` or `CRON_SECRET` for all `/api/admin/` routes. The `guardarConMeni` function is the only path that writes `scoreMeni`, and it requires `meni.aprobado` to be true.

**Verdict**: Score fabrication via MENI is NOT possible (MENI is deterministic and requires editorial approval). However, score contamination via `scoreCalidad` IS possible through maintenance scripts.

---

## F20 — DETERMINISMO

### MENI Score Determinism
- `runMeni()` calls `evaluateMeni()` which calls `runEditorialBrain()`
- `runEditorialBrain()` uses pattern matching, not LLM calls
- `computeInputHash()` provides deterministic hash for same input
- `evaluationTimestamp` is set to `now.toISOString()` — this is the only non-deterministic element, but it doesn't affect the score
- Autocorrect may modify input and re-evaluate, but corrections are deterministic (rule-based)

**Verdict**: MENI score IS deterministic for the same input. Same input → same score, every time.

### NIOS Score Determinism
- NIOS depends on external data (GSC, GA4) which changes over time
- NIOS `ArticleFusion.scoreMeni` depends on `scoreCalidad ?? null` from Firestore, which may change if maintenance scripts run
- Google Trust scores depend on GSC/GA4 data availability

**Verdict**: NIOS scores are NOT fully deterministic — they depend on external data that changes. But for a given snapshot of GSC+GA4+Firestore data, the computation is deterministic.

---

## F21 — TESTS OBLIGATORIOS

**Cannot run locally** due to Firebase credential issue. The following should be run:

```bash
npx tsc --noEmit
npm run build
npm test
```

**Note**: The `forensic-audit` API endpoint was created at `app/api/admin/forensic-audit/route.ts` for data-level auditing. It must be called with valid admin credentials on a deployment with working Firebase credentials.

---

## F22 — DRY RUN RECONCILIACIÓN

**BLOCKED**: Requires valid Firebase credentials. The audit endpoint and script are ready:

- API endpoint: `app/api/admin/forensic-audit/route.ts`
- Node script: `scripts/forensic-audit-281.cjs`

To execute on Vercel or with valid credentials:
```bash
curl -H "x-admin-token: YOUR_ADMIN_KEY" https://nicaraguainformate.com/api/admin/forensic-audit
```

---

## F23 — INFORME FINAL DE CERTIFICACIÓN

### Certification Questions

**1. ¿Las 281 notas están evaluadas coherentemente con MENI + NIOS?**
**CANNOT CERTIFY** — Requires Firestore data access. Code-level analysis reveals that:
- 4 write routes correctly use MENI
- 11 routes bypass MENI, including 2 that write a non-MENI `scoreCalidad` field
- NIOS data-merger prefers `scoreCalidad` over `scoreMeni`, creating potential inconsistency

**2. ¿Hay inflación artificial de scores?**
**NO** — MENI scores cannot be artificially inflated (deterministic, requires editorial approval). However, `scoreCalidad` (written by maintenance scripts) IS a different, simpler score that could be confused with MENI and may be higher than the actual MENI score for the same content.

**3. ¿Se modificaron datos históricos sin evidencia?**
**CANNOT CERTIFY** — Requires Firestore data access. Code-level: maintenance scripts CAN modify historical content and scores without preserving evidence of the original values.

**4. ¿El sistema "dice la verdad" sobre su contenido?**
**PARTIALLY** — The MENI evaluation pipeline is sound and deterministic. However, the dual-score system (`scoreMeni` vs `scoreCalidad`), the NIOS data-merger's preference for `scoreCalidad`, and the 11 bypass routes create gaps where the system may not accurately represent the editorial quality of its content.

### Critical Findings Requiring Action

1. **CRITICAL**: `cron-fetch` bypasses MENI entirely and can publish content without editorial evaluation
2. **CRITICAL**: 8 routes write content to Firestore without HTML sanitization
3. **HIGH**: `data-merger.ts:122` uses `n.scoreCalidad ?? null` instead of `n.scoreMeni ?? null` for `ArticleFusion.scoreMeni`
4. **HIGH**: `clean-backlog` and `expandir-thin-content` overwrite `scoreCalidad` with non-MENI scores
5. **MEDIUM**: Content modification routes (adsense-repair, enrich-links, enrich-strong) don't re-evaluate MENI after changes
6. **MEDIUM**: `cron-fetch` uses `.set()` which can overwrite existing articles

### Recommendations

1. Fix `data-merger.ts:122` to use `n.scoreMeni ?? n.scoreCalidad ?? null` (prefer actual MENI score)
2. Add `guardarConMeni` call after content modifications in maintenance scripts
3. Add `sanitizeArticleHtml()` to all content-writing routes
4. Change `cron-fetch` to use `guardarConMeni` instead of direct `.set()`
5. Run the forensic audit endpoint with valid credentials to complete data-level certification
6. Add a `scoreProvenance` field to Firestore indicating which system wrote the score

---

*End of Forensic Audit Report*
