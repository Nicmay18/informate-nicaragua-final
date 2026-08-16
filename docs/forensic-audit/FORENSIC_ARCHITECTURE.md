# FORENSIC ARCHITECTURE — Nicaragua Informate v2.0.0

> FASE 1 — Inventario Forense Total
>
> Fecha: 2026-08-15
>
> Estado: IN PROGRESS / First-pass inventory. This document reflects the architecture actually found in the repository, not an idealized version.

---

## 1. EXECUTIVE SUMMARY

Nicaragua Informate v2.0.0 is a Next.js 15 + Firebase/Firestore platform for Nicaraguan news publishing. It combines a public reader-facing site, an admin panel, MENI (editorial scoring/decision engine), NIOS (observability/recovery), Google integrations (Search Console, Analytics, Indexing), and automated distribution (Telegram, Facebook, WhatsApp, etc.).

The codebase is large and layered. Several architectural concerns are visible from inspection:

* Multiple scoring systems coexist (`lib/meni/scoring.ts`, `lib/editorial/core/`, `lib/supervisor/editorial-supervisor.ts`).
* Two editorial decision builders exist (`buildEditorialDecision` in `lib/editorial/decision.ts` and `makeEditorialDecision` in `lib/supervisor/editorial-supervisor.ts`); the Supervisor is the canonical authority after recent surgery.
* NIOS modules are spread across `lib/*` (traffic, analytics, discover, brand, etc.) without a single clean `lib/nios/` root.
* There are many one-off admin API routes (~90+ under `app/api/admin/`) that are hard to audit and may overlap.
* Vercel crons exist but one (`supervisor-watch`) was recently downgraded to daily because of Hobby-plan limits.
* Firestore collections (`noticias`, `traffic_log`, etc.) are used directly; TTL is not confirmed.

---

## 2. PROJECT CONFIGURATION

| File | Purpose | Key facts |
|------|---------|-----------|
| `package.json` | Dependencies & scripts | Node 22.x, Next 15.3.9, React 19, Firebase Admin 12.7.0, `@googleapis/searchconsole` 7.0.0, `@google-analytics/data` 7.0.0, `@sentry/nextjs` 8.55.2, Vitest 2.0.5, Playwright 1.48.0 |
| `vercel.json` | Vercel platform config | `framework: nextjs`, region `iad1`, crons (resumen-diario, nios-collect, supervisor-watch), `maxDuration` per API route pattern, custom cache headers for sitemap/feed |
| `tsconfig.json` | TypeScript config | (assumed standard Next.js; not inspected in this pass) |
| `next.config.*` | Next.js config | (assumed; not inspected in this pass) |
| `.env` / `.env.local` | Secrets | Gitignored; contains Firebase service account, Google credentials, Sentry, etc. |

---

## 3. DIRECTORY INVENTORY

### 3.1 `app/` — Next.js App Router

| Subtree | Responsibility |
|---------|----------------|
| `app/page.tsx`, `app/noticias/`, `app/categoria/`, `app/autor/`, `app/entidad/`, `app/guia/` | Public reader pages |
| `app/admin/*` | Admin dashboard pages (MENI, NIOS, editor, traffic, growth, etc.) |
| `app/api/admin/*` | ~90+ admin API routes |
| `app/api/cron/*` | Vercel cron endpoints |
| `app/api/*` | Public/utility API routes (feed.xml, sitemap, etc.) |
| `app/actions/track-view.ts` | (Likely) view tracking server action |

### 3.2 `lib/` — Core logic

| Subtree | Responsibility |
|---------|----------------|
| `lib/meni/` | MENI: editorial scoring, quality gate, profiling, editorial brain, autocorrect, anti-clickbait, diagnostics |
| `lib/editorial/` | Editorial decision, canonical category, pipeline, profile loaders, story editor |
| `lib/supervisor/` | Editorial Supervisor (final authority), cost guard, abandoned-article detection |
| `lib/nios*` / `lib/analytics/`, `lib/discover-score.ts`, `lib/home-balance.ts`, `lib/brand-health.ts` | NIOS/observability modules (scattered) |
| `lib/google-indexing.ts`, `lib/analytics/` | Google integrations (GSC, GA4, Indexing) |
| `lib/firebase-admin.ts`, `lib/data.ts` | Firestore / Firebase access |
| `lib/auth.ts`, `lib/admin-auth.ts` | Authentication |
| `lib/*` (many) | SEO, distribution, images, sitemap, JSON-LD, corrections, explainer, etc. |

### 3.3 `tests/`

Approximately 40+ test files. Relevant examples:

* `tests/supervisor.test.ts`
* `tests/editorial-invariants.test.ts`
* `tests/adversarial-scoring-audit.test.ts`
* `tests/meni-*`
* `tests/nios-*`

---

## 4. KEY MODULES — REAL ARCHITECTURE

### 4.1 Public / Reader layer

| Module | Responsibility | Authority / Data source |
|--------|----------------|-------------------------|
| `app/page.tsx` | Home page, lists latest/trending news, runs `auditHomepage()` | Firestore `noticias` |
| `app/noticias/[slug]/page.tsx` | Article page, renders `ArticlePage` | Firestore `noticias` |
| `app/categoria/[slug]/page.tsx` | Category page | Firestore `noticias` |
| `app/sitemap.xml` / `app/news-sitemap.xml` (assumed) | Sitemap generation | Firestore |
| `app/opengraph-image.tsx` | OG image generation | — |

### 4.2 Admin layer

| Module | Responsibility |
|--------|----------------|
| `app/admin/editor/page.tsx` | Article editor |
| `app/admin/meni-dashboard/page.tsx` | MENI dashboard |
| `app/admin/nios/page.tsx` | NIOS dashboard |
| `app/admin/trafico/page.tsx` | Traffic analytics dashboard |

### 4.3 MENI (Editorial scoring)

| Module | Responsibility |
|--------|----------------|
| `lib/meni/core.ts` | `runMeniAsync`, orchestrates the full MENI pipeline |
| `lib/meni/scoring.ts` | Scoring v1/v2, `computePriority`, `scoreToGrade` |
| `lib/meni/editorial-brain/index.ts` | Editorial brain: news value, competition, NI angle, reader questions, etc. |
| `lib/meni/editorial-dna/engine.ts` | Computes editorial DNA (adnNI, exclusividad, wow, selloNI) |
| `lib/meni/profile-detector.ts` | Detects content profile (internacional, nacional, etc.) |
| `lib/meni/quality-gate.ts` | Quality gate / text correction |
| `lib/meni/autocorrect.ts` | Auto-corrects rejected articles and re-runs MENI |
| `lib/meni/auditor.ts` | MENI audit / health checks |
| `lib/editorial/guardar-con-meni.ts` | Persist canonical MENI + Supervisor output to Firestore |
| `lib/editorial/canonical.ts` | Resolves public category from content |

### 4.4 Editorial Supervisor

| Module | Responsibility |
|--------|----------------|
| `lib/supervisor/editorial-supervisor.ts` | `makeEditorialDecision`, final editorial authority |
| `lib/supervisor/types.ts` | Supervisor types and issue domains |
| `lib/supervisor/cost-guard.ts` | Detects wasteful API/LLM calls |
| `lib/supervisor/supervisor-gate.ts` | Supervisor gate used in editorial flow |

### 4.5 NIOS / Observability (scattered)

| Module | Responsibility |
|--------|----------------|
| `lib/analytics/traffic-reader.ts` | Reads traffic events |
| `lib/analytics/traffic-aggregator.ts` | Aggregates traffic |
| `lib/audience-intelligence.ts` | Audience insights |
| `lib/brand-health.ts` | Brand health |
| `lib/discover-score.ts` | Google Discover scoring |
| `lib/home-balance.ts` | Homepage balance |
| `lib/home-ranking.ts` | Homepage ranking |
| `lib/content-lifecycle.ts` | Content lifecycle tracking |
| `lib/news-watch/` (assumed) | Article watch post-publication |

### 4.6 Google integrations

| Module | Responsibility |
|--------|----------------|
| `lib/google-indexing.ts` | Google IndexNow / URL notification |
| `lib/analytics/traffic-reader.ts` | (Likely GA4 / traffic) |

### 4.7 Security / Auth

| Module | Responsibility |
|--------|----------------|
| `lib/auth.ts` | Token verification |
| `lib/admin-auth.ts` | Admin auth utilities |

### 4.8 Distribution

| Module | Responsibility |
|--------|----------------|
| `lib/distribution.ts` | Distribution orchestration |
| `lib/distribution-intelligence.ts` | Social copy / distribution decisions |
| `lib/meni/publication-pipeline.ts` | Publication pipeline (Telegram, Facebook, etc.) with cost guard |

---

## 5. DATA FLOW (high level)

```
Editor input
    │
    ▼
app/admin/editor  →  app/api/admin/news/  →  guardarConMeni(input, db)
    │
    ▼
runMeniAsync(input, db)  →  MENI pipeline
    │
    ▼
makeEditorialDecision(ctx)  →  Supervisor decision
    │
    ▼
Firestore: noticias.update({ supervisorDecision, editorialState, ... })
    │
    ▼
Publication pipeline (if approved): Telegram, Facebook, IndexNow, Push
    │
    ▼
NIOS / watch / analytics observe over time
```

---

## 6. SOURCES OF TRUTH

| Concern | Canonical authority | Notes |
|---------|---------------------|-------|
| Editorial approval | `lib/supervisor/editorial-supervisor.ts` | After recent surgery, `verdict === 'PUBLICAR'` requires `aprobadoMeni === true && recomendacionMeni === 'publicar' && scoreMeni >= 90` |
| Public category | `lib/editorial/canonical.ts` | Uses `resolvePublicCategory` |
| Content profile | `lib/meni/profile-detector.ts` | `detectContentProfile` |
| Score | `lib/meni/scoring.ts` + `lib/editorial/core/` | Multiple scoring paths exist; this is a known inconsistency |
| Published article | Firestore `noticias` collection | Single source for public site and admin |

---

## 7. ENDPOINT INVENTORY (sample)

### Public / utility

* `GET /api/articles` — articles list
* `GET /api/listar-categoria` — category list
* `GET /api/feed-xml` — RSS feed
* `GET /api/sitemap.xml` (assumed) — sitemap
* `GET /api/count-news` — count articles

### Cron

* `GET/POST /api/cron/resumen-diario` — daily summary
* `GET/POST /api/cron/nios-collect` — NIOS collection
* `GET/POST /api/cron/supervisor-watch` — supervisor watch (now daily at 8am)
* `GET/POST /api/cron/distribuir-pendientes` — pending distribution
* `GET/POST /api/cron-fetch` — fetch content from external source

### Admin (selected)

* `POST /api/admin/news` — create article
* `PUT /api/admin/news/[id]` — update article
* `POST /api/admin/meni/generar` — generate with MENI
* `POST /api/admin/analizar` — analyze article
* `POST /api/admin/auditoria-completa` — full audit
* `POST /api/admin/forensic-audit` — forensic audit
* `POST /api/admin/traffic` — traffic analytics
* `POST /api/admin/research` — research
* `POST /api/admin/story` — story editor
* `POST /api/admin/learning` — learning engine
* `POST /api/admin/limpiar-*` — cleanup utilities

---

## 8. FIRESTORE / PERSISTENCE

| Collection / Document | Used by | Notes |
|-----------------------|---------|-------|
| `noticias` | Admin, public pages, sitemap, feeds | Main article store |
| `traffic_log` | Analytics | High-volume; TTL not confirmed |
| `analytics_*` (assumed) | NIOS | Not inspected in this pass |
| `gsc_*` / `ga4_*` (assumed) | Google integrations | Not inspected in this pass |
| `knowledge_base` / `editorial_memory` | Editorial brain, learning | Not inspected in this pass |

---

## 9. RISKS & DUPLICATIONS

| # | Risk / duplication | Evidence | Severity |
|---|--------------------|----------|----------|
| 1 | Multiple scoring engines | `lib/meni/scoring.ts`, `lib/editorial/core/scorer.ts`, `lib/supervisor/editorial-supervisor.ts` | HIGH |
| 2 | Two editorial decision builders | `buildEditorialDecision` (`lib/editorial/decision.ts`) and `makeEditorialDecision` (`lib/supervisor/editorial-supervisor.ts`) | HIGH (partially mitigated by recent surgery) |
| 3 | Many one-off admin routes | ~90+ `app/api/admin/*` routes | MEDIUM |
| 4 | NIOS scattered, no unified lib/nios root | `lib/analytics/`, `lib/discover-score.ts`, `lib/brand-health.ts`, `lib/home-*` | MEDIUM |
| 5 | Vercel crons on Hobby plan | `vercel.json` only allows 1 cron per day; `supervisor-watch` had to be reduced | MEDIUM |
| 6 | Firestore undefined values | `sanitizeForFirestore` added recently as reactive fix | MEDIUM |
| 7 | No confirmed TTL on `traffic_log` | Mandate explicitly mentions this | MEDIUM |
| 8 | No evidence of GSC/GA4 verification in tests | Mandate requires verified GSC/GA4 | HIGH |
| 9 | Large admin surface / potential for unprotected endpoints | Many `app/api/admin/*` and `app/api/*` routes | MEDIUM |

---

## 10. DEAD CODE / SUSPECTED WASTE

* `lib/editorial/decision.ts` — `buildEditorialDecision` still exists but is reportedly out of the canonical flow; only used by tests and possibly old code paths.
* `app/home-v2/page.tsx` and `components/pro/HomePageV2.tsx` referenced in docs but do not exist on disk (per `CERTIFICATION_FINAL.md`).
* Many `lib/*` single-purpose files (`lib/explainer.ts`, `lib/evergreen.ts`, `lib/formateo.ts`, etc.) — need usage audit.
* Old `editorial-brain` flat decision field set inside `lib/meni/core.ts` may be redundant with `lib/meni/editorial-brain`.

---

## 11. TEST INVENTORY

| Test category | Files | Status |
|---------------|-------|--------|
| MENI | `meni-*.test.ts` | Exists |
| Supervisor | `supervisor.test.ts`, `adversarial-scoring-audit.test.ts` | Passing (per last run) |
| Editorial invariants | `editorial-invariants.test.ts` | Passing |
| NIOS | `nios-*.test.ts` | Exists |
| Security / SSRF | `ssrf-protection.test.ts` | Exists |
| API auth | `api-authorization.test.ts` | Exists |

---

## 12. OPEN QUESTIONS / BLOCKERS FOR FASE 2+

1. **GSC/GA4 credentials** — cannot verify real connectivity without the service account / `.env`.
2. **Firestore indexes and TTL rules** — not inspected yet.
3. **Actual production data** — cannot inspect `noticias` count, traffic volume, etc. without live DB access.
4. **Vercel build / runtime logs** — last manual deploy succeeded, but auto-deploy still needs monitoring.

---

## 13. FIRST-PASS CONCLUSION

The repository is a mature but complex Next.js + Firebase application. The architecture has clear separation between MENI, Supervisor, public site, admin, and distribution, but with significant layering issues: multiple scoring systems, scattered NIOS code, a large surface of admin API routes, and recent reactive fixes for Firestore undefined values.

Fase 1 inventory is sufficient to proceed to Fase 2 (Data Contracts), but the inventory should be treated as a living document and expanded as each module is audited in depth.

---

*Document generated as part of Fase 1 — Reingeniería Total.*
