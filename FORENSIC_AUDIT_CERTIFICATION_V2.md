# FORENSIC AUDIT CERTIFICATION V2
## Nicaragua Informate — Editorial Pipeline MENI
### Date: 2026-08-11 (Session 2)
### Auditor: Cascade AI

---

## EXECUTIVE VERDICT

**CONDITIONAL CERTIFICATION — Code pipeline certified, data backfill required.**

The codebase is now **MENI-compliant**: all write routes that create or modify editorial content either pass through `guardarConMeni()` or invalidate MENI (`scoreMeni: null, aprobadoMeni: false`). NIOS consumes `scoreMeni` (not `scoreCalidad`). No route accepts external MENI overrides. HTML sanitization enforced on all content-writing routes.

**Remaining:** 208 articles without `scoreMeni` must be backfilled through authentic MENI evaluation. Until then, NIOS correctly treats them as `null` (not evaluated).

---

## P0 FIXES (BLOCKING — FIXED)

| ID | File | Before | After |
|---|---|---|---|
| P0-1 | `lib/nios/intelligence/data-merger.ts:122` | `scoreMeni: n.scoreCalidad ?? null` | `scoreMeni: n.scoreMeni ?? null` |
| P0-2 | `lib/nios/intelligence/data-merger.ts:168` | `scoreCalidad ?? d.scoreMeni` | `scoreMeni: d.scoreMeni ?? null` (separate) |
| P0-3 | `app/api/cron-fetch/route.ts` | `.set()` direct, no MENI, no sanitize | `guardarConMeni()` + `sanitizeArticleHtml()` |
| P0-4 | `lib/types.ts:38` | No `scoreMeni` field | Added `scoreMeni`, `aprobadoMeni`, `nivel`, `nivelScore`, etc. |
| P0-5 | `lib/sanitize.ts` | Used `isomorphic-dompurify` (jsdom `ENOENT` in Vercel) | Server-safe HTML sanitizer: no DOM, no fs reads |
| P0-6 | `lib/meni/learning-engine/metrics-collector.ts:72` | `scoreMeni: d.scoreMeni ?? d.scoreCalidad ?? null` | `scoreMeni: d.scoreMeni ?? null` (no falsification fallback) |
| P0-7 | `app/api/admin/dashboard-calidad/route.ts:182` | `scoreMeni ?? scoreCalidad ?? null` | `scoreMeni ?? null` (no falsification fallback) |

## P1 FIXES (HIGH — FIXED)

15 maintenance routes now sanitize HTML + invalidate MENI on content modification:

`expandir-thin-content`, `adsense-repair` (x3), `clean-backlog`, `enrich-links`, `enrich-strong`, `expandir-7`, `clean-seo`, `limpiar-sucesos`, `rescribir-sucesos`, `limpiar-palabras-sensibles`, `revertir-sensacionalismo`, `corregir-titulo`, `corregir-titulos-masivo`

### P1-B: NIOS modules — scoreCalidad → scoreMeni (8 modules)

| File | Change |
|---|---|
| `lib/audience-intelligence.ts:24` | `scoreCalidad` → `scoreMeni` |
| `lib/content-lifecycle.ts:24` | `scoreCalidad` → `scoreMeni` |
| `lib/distribution-intelligence.ts:16` | `scoreCalidad` → `scoreMeni` |
| `lib/distribution.ts:25` | `scoreCalidad` → `scoreMeni` |
| `lib/home-ranking.ts:96,162` | `scoreCalidad` → `scoreMeni` |
| `lib/internal-linking-engine.ts:169` | `scoreCalidad` → `scoreMeni` |
| `lib/revenue-intelligence.ts:25` | `scoreCalidad` → `scoreMeni` |
| `lib/nios/content-intelligence/index.ts:133` | `scoreCalidad` → `scoreMeni` |
| `lib/nios/distribution.ts:16,23` | `scoreCalidad` → `scoreMeni` |
| `lib/nios/editorial-score/index.ts:34` | `scoreCalidad` → `scoreMeni` |
| `lib/nios/executive-report.ts:244,389` | `scoreCalidad` → `scoreMeni` |
| `lib/nios/intelligence/compliance.ts:83` | Evidence label `scoreCalidad` → `scoreMeni` |
| `lib/nios/intelligence/editorial-rules.ts:186` | Evidence label `scoreCalidad` → `scoreMeni` |

### P1-C: metrics-collector — aprobadoMeni default

`metrics-collector.ts:73`: Changed `aprobadoMeni: d.aprobadoMeni ?? true` → `?? false`. Articles without MENI are NOT approved by default.

## P2 (ACCEPTED RISK)

Routes modifying non-editorial metadata (`puntosClave`, `related_links`, `autor`, `distribuida`, `noindex`) do NOT invalidate MENI — acceptable since MENI scores content, not metadata.

---

## SECURITY: NO SCORE FALSIFICATION

- `guardarConMeni()` builds `updateData` exclusively from `meni.*` — no external input
- No route reads `body.scoreMeni`, `body.aprobadoMeni`, or `body.nivelScore`
- MENI fields set only by `guardarConMeni()` or invalidated to `null/false` by maintenance

## CANONICAL PIPELINE

All creation routes use `guardarConMeni()`: `guardar-directo`, `admin/news` (POST), `admin/news/[id]` (PUT), `api/articles`, `cron-fetch` (fixed).

## PUBLICATION GATE

`admin/news/[id]` PUT: if `body.publicado === true` and `snap.data().aprobadoMeni !== true`, returns 400 with `MENI_NOT_APPROVED`. No content change required to publish, but MENI approval is mandatory.

## SANITIZATION

`sanitizeArticleHtml()`: `id` NOT in ALLOWED_ATTR, `style` forbidden, iframes restricted, external links get `rel="noopener noreferrer nofollow"`. Enforced on all P1 routes.

## HTML EXTRACTION → MENI

`lib/editorial/extractor.ts:67-72`: `textoPlano = contenidoStr.replace(/<p[^>]*>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, ' ')`. All HTML tags and attributes are stripped before MENI evaluation. No `id`, `style`, or class attributes can contaminate the editorial score.

## PROFILE DETECTOR

Turismo: no `volcan`/`laguna`/`León`. Ambiente: has `volcan`/`ceniza`/`ineter`. Internacional: has `honduras`/`interpol`/`extradicion`. Sucesos: has `captura`/`contrabando`. Turismo +2 boost removed.

---

## FIRESTORE AUDIT (281 articles — live data)

| Metric | Value |
|---|---|
| Total articles | 281 |
| CON MENI (scoreMeni != null) | 73 |
| SIN MENI (scoreMeni = null) | 208 |
| Scores 90-100 | 68 |
| Scores 70-89 | 5 |
| Scores < 70 | 0 |
| Duplicate risk | 0 |
| All have autor | 281/281 |
| All have related_links | 281/281 |
| Tags >= 2 | 208/281 |
| Thin content | 89 |
| Profiles set | 0 (all N/A — no profile_used field) |

### Provenance classification

| Category | Count | Description |
|---|---|---|
| A — MENI authentic | 73 | `scoreMeni` + `aprobadoMeni` + `calificacionMeni` + `diagnosticoMeni` set by `guardarConMeni()` |
| B — Legacy without MENI | 208 | No `scoreMeni`, no `aprobadoMeni`. Have `nivel`/`nivelScore` from legacy scripts. NIOS treats as `null`. |
| C — cron-fetch bypass | 0 | No articles match cron-fetch pre-fix pattern |
| D — admin/news FORENSE+0 | 0 | No articles match admin/news pre-fix pattern |

### Key findings

- 73 CON MENI articles: all have `aprobadoMeni`, `calificacionMeni`, `diagnosticoMeni`, `editorialTier` (72/73), `nivel` set
- 208 SIN MENI articles: 0 have `aprobadoMeni`, `calificacionMeni`, `diagnosticoMeni`, or `editorialTier`
- 0 articles have `nivel='FORENSE' + nivelScore=0` (old admin/news bypass pattern eliminated)
- CON MENI date range: 2026-07-27 to 2026-08-11 (recent articles)
- SIN MENI date range: 2026-05-15 to 2026-07-26 (legacy articles)
- `profile_used` field: 0/281 — not populated by current pipeline (minor gap, non-blocking)

---

## TESTS PASSED

- TypeScript: `tsc --noEmit` — 0 errors
- Vitest: 229 tests, 21 files — all passed
- Profile regression: 27/27 passed (Telica/Melba, Turismo/Ambiente/Internacional/Sucesos, sanitization, ALLOWED_ATTR)

---

## REMAINING RISKS

1. **208 articles without scoreMeni**: Legacy scripts set `nivel`/`nivelScore` without running MENI. NIOS correctly treats as `null`. Require authentic MENI backfill via `guardarConMeni()`.
2. **Scripts `.mjs` in `scripts/`**: batch1-9, corregir-noticia, fix-titles, etc. modify content without MENI invalidation. One-time legacy scripts, not production routes. Low risk.
3. **`profile_used` not populated**: 0/281 articles have this field. The pipeline loads profiles internally but doesn't persist the name. Non-blocking — profiles are deterministic from category.
4. **`articleHash` / `evaluationTimestamp` not populated**: 0/281 articles. These fields exist in `guardarConMeni()` output but are not currently set. Non-blocking for certification.
5. **Forense vs MENI**: `nivel: 'FORENSE'` is set by `mapMeniScoreToNivel()` only when `score >= 85 && aprobado`. Forense is a risk analysis component inside the editorial pipeline, not a substitute for MENI approval. Confirmed correct.

---

## CERTIFICATION STATUS

| Check | Status |
|---|---|
| All creation routes use `guardarConMeni()` | PASS |
| All maintenance routes invalidate MENI on content change | PASS |
| All maintenance routes sanitize HTML | PASS |
| NIOS consumes `scoreMeni` (not `scoreCalidad`) | PASS |
| No `scoreCalidad` fallback to `scoreMeni` anywhere | PASS |
| No external override of MENI fields via API | PASS |
| Publication gate requires `aprobadoMeni` | PASS |
| HTML extraction strips all tags before MENI | PASS |
| `null` preserved for `scoreMeni` (no coercion to 0) | PASS |
| Profile classification deterministic (Telica/Melba) | PASS |
| `id` attribute NOT in sanitizer whitelist | PASS |
| TypeScript compiles with 0 errors | PASS |
| All 229 tests pass | PASS |
| 27/27 profile regression tests pass | PASS |
| 281 articles audited against Firestore | PASS |
| 0 bypass routes detected | PASS |
| 208 articles correctly marked as not evaluated | PASS |

**VERDICT: CODE PIPELINE CERTIFIED. Data backfill of 208 articles required for full certification.**
