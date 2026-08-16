# DATA CONTRACTS — Nicaragua Informate

> FASE 2 — Data Contracts
>
> Fecha: 2026-08-15
>
> Estado: PASS — Contracts frozen and verified against code. tsc noEmit PASS. Observability 4/4 PASS.

---

## 1. CONTRACT PRINCIPLES

1. **No `any` in critical data.** Every field has a concrete type.
2. **NULL is not 0.** `null` / `undefined` means UNKNOWN / NOT_MEASURED.
3. **Authority is explicit.** Each field lists `source` and `authority`.
4. **Timestamps are ISO 8601 strings.** No implicit date formats.
5. **Status is explicit.** States like `UNKNOWN`, `DATA_EMPTY`, `API_ERROR` are preferred over false numeric defaults.

---

## 2. CONTRACTS

### 2.1 `Noticia` — Article persistence

**Authority:** `lib/types.ts` (canonical), stored in Firestore `noticias`.

| Field | Type | Nullable | Source | Authority | Meaning |
|-------|------|----------|--------|-----------|---------|
| `id` | `string` | no | Admin API / MENI | Firestore | Document ID |
| `slug` | `string` | no | Admin / MENI | Firestore | URL slug |
| `titulo` | `string` | no | Editor / MENI | MENI | Public title |
| `resumen` | `string` | no | Editor / MENI | MENI | Public excerpt |
| `contenido` | `string` | yes | Editor / MENI | MENI | Full article body |
| `categoria` | `string` | no | MENI / Canonical | `lib/editorial/canonical.ts` | Resolved public category |
| `perfil` | `string` | yes | MENI profile detector | `lib/meni/profile-detector.ts` | Editorial profile |
| `imagen` | `string` | no | Editor | MENI | Featured image URL |
| `fecha` | `string` | no | Editor / auto | MENI | Creation date (ISO) |
| `fechaPublicacion` | `string` | yes | Supervisor | `lib/supervisor/editorial-supervisor.ts` | Publication timestamp |
| `autor` | `string` | yes | Editor | MENI | Author name |
| `estado` | `'publicado' \| 'borrador' \| 'archivado'` | no | Supervisor | `lib/supervisor/editorial-supervisor.ts` | Life-cycle state |
| `publicado` | `boolean` | yes | Supervisor | `lib/supervisor/editorial-supervisor.ts` | Publication flag |
| `scoreCalidad` | `number` | yes | MENI | `lib/meni/scoring.ts` | Legacy quality score |
| `scoreMeni` | `number \| null` | yes | MENI | `lib/meni/scoring.ts` | MENI final score |
| `aprobadoMeni` | `boolean` | yes | MENI | `lib/meni/core.ts` | MENI approval flag |
| `calificacionMeni` | `string` | yes | MENI | `lib/meni/core.ts` | MENI grade label |
| `diagnosticoMeni` | `string` | yes | MENI | `lib/meni/core.ts` | MENI diagnostic text |
| `editorialTier` | `string` | yes | Supervisor | `lib/supervisor/editorial-supervisor.ts` | Tier assigned on publication |
| `noindex` | `boolean` | yes | NIOS / Admin | `lib/nios/intelligence/types.ts` | Block indexing flag |
| `tags` | `string[]` | yes | MENI / Editor | MENI | Tags/keywords |
| `articleType` | `ArticleType` | yes | MENI | `lib/types.ts` | `noticia`, `explicador`, etc. |
| `explainer` | `ExplainerFields` | yes | MENI | `lib/types.ts` | Explicador/guía fields |
| `fuente` | `string` | yes | Editor | MENI | Primary source |
| `fuentesComplementarias` | `string[]` | yes | Editor | MENI | Secondary sources |
| `related_links` | `{ url, anchor, type }[]` | yes | MENI | `lib/internal-linking-engine.ts` | Internal links |

**Risk:** `estado`, `publicado`, and `aprobadoMeni` can diverge. Single authority must be the Supervisor lifecycle state.

---

### 2.2 `NoticiaInput` — Editorial input

**Authority:** `lib/editorial/types.ts` is the canonical V4 source. `lib/meni/types.ts` extends it (`NoticiaInput = EditorialNoticiaInput & { ... }`) with MENI-only fields (`id`, `departamento`, `research`, `story`). No duplication: it is composition.

| Field | Type | Nullable | Source | Authority |
|-------|------|----------|--------|-----------|
| `titulo` | `string` | no | Editor | Editor |
| `contenido` | `string` | no | Editor | Editor |
| `resumen` | `string` | no | Editor | Editor |
| `categoria` | `string` | no | Editor | Editor (can be normalized) |
| `autor` | `string` | no | Editor | Editor |
| `fecha` | `string` | no | Editor | Editor |
| `fechaActualizacion` | `string` | yes | Editor | Editor |
| `imagen` | `string` | yes | Editor | Editor |
| `imagenDestacada` | `string` | yes | Editor | Editor |
| `slug` | `string` | no | Editor | Editor |
| `palabrasClave` | `string[]` | yes | Editor / MENI | Editor |
| `keywords` | `string \| string[]` | yes | Editor | Editor |

**Risk:** Two `NoticiaInput` definitions. Must be unified in a single contract.

---

### 2.3 `MeniResult`

**Authority:** `lib/meni/types.ts`.

| Field | Type | Nullable | Source | Meaning |
|-------|------|----------|--------|---------|
| `aprobado` | `boolean` | no | MENI score engine | Final MENI approval |
| `score` | `number \| null` | yes | MENI score engine | 0-100 final score |
| `recomendacion` | `'publicar' \| 'mejorar' \| 'rechazar'` | no | Editorial brain | MENI recommendation |
| `calificacion` | `string` | yes | MENI | Grade label |
| `diagnostico` | `string` | yes | MENI | Diagnostic message |
| `advertencias` | `string[]` | no | MENI | Warnings |
| `errores` | `string[]` | no | MENI | Critical errors |
| `perfil` | `string` | yes | Profile detector | Detected profile |
| `categoriaPublica` | `string` | yes | Canonical | Public category |
| `acciones` | `string[]` | yes | MENI | Suggested actions |

**Rule:** `score === null` must stay null. It does NOT mean 0.

---

### 2.4 `EditorialDecision` — Supervisor authority

**Authority:** `lib/supervisor/editorial-supervisor.ts` for the final verdict.

| Field | Type | Nullable | Source | Authority |
|-------|------|----------|--------|-----------|
| `decisionId` | `string` | no | Supervisor | Generated UUID |
| `timestamp` | `string` | no | Supervisor | ISO 8601 |
| `verdict` | `SupervisorVerdict` | no | Supervisor | `PUBLICAR`, `REVISION_HUMANA`, etc. |
| `reason` | `string` | no | Supervisor | Human-readable reason |
| `confidence` | `number` | no | Supervisor | 0-1 |
| `scoreOverride` | `boolean` | no | Supervisor | Was a high score overridden? |
| `scoreOverrideReason` | `string \| undefined` | yes | Supervisor | Reason for override |
| `issues` | `SupervisorIssue[]` | no | Supervisor | Detected issues |
| `actions` | `SupervisorAction[]` | no | Supervisor | Recommended actions |
| `resultingState` | `ArticleLifecycleState` | no | Supervisor | Next lifecycle state |
| `modelVersion` | `string` | no | Supervisor | Model version string |

**Invariant (post-surgery):** `verdict === 'PUBLICAR'` requires:
- `ctx.aprobadoMeni === true`
- `ctx.recomendacionMeni === 'publicar'`
- `ctx.scoreMeni >= 90`

---

### 2.5 `NIOSArticle` — `ArticleFusion`

**Authority:** `lib/nios/intelligence/types.ts`.

| Field | Type | Nullable | Source | Meaning |
|-------|------|----------|--------|---------|
| `slug` | `string` | no | `Noticia.slug` | Article slug |
| `url` | `string` | no | Derived | Full public URL |
| `titulo` | `string` | no | `Noticia.titulo` | Title |
| `categoria` | `string` | no | `Noticia.categoria` | Category |
| `autor` | `string` | yes | `Noticia.autor` | Author |
| `fechaPublicacion` | `string` | yes | `Noticia.fechaPublicacion` | Publication date |
| `palabras` | `number` | yes | MENI / computed | Word count |
| `scoreMeni` | `number \| null` | yes | `Noticia.scoreMeni` | MENI score (null = unknown) |
| `tags` | `string[]` | yes | `Noticia.tags` | Tags |
| `gscImpressions` | `number` | no | GSC | Impressions (0 means measured 0, NOT unknown) |
| `gscClicks` | `number` | no | GSC | Clicks |
| `gscCtr` | `number` | no | GSC | CTR |
| `gscPosition` | `number` | no | GSC | Avg position |
| `gscTopQueries` | `GSCQueryRow[]` | yes | GSC | Top queries |
| `ga4Users` | `number` | no | GA4 | Users |
| `ga4Sessions` | `number` | no | GA4 | Sessions |
| `ga4Pageviews` | `number` | no | GA4 | Pageviews |
| `ga4AvgEngagementTimeSec` | `number` | no | GA4 | Engagement time |
| `ga4EngagementRate` | `number` | no | GA4 | Engagement rate |
| `hasGscData` | `boolean` | no | NIOS | Was GSC data available? |
| `hasGa4Data` | `boolean` | no | NIOS | Was GA4 data available? |

**Rule:** `gscImpressions` defaults to `0` in fusion. Mandate requires distinguishing `DATA_EMPTY` from `0`. Contract must be: if `hasGscData === false` then `gscImpressions` is `UNKNOWN` (not 0). Current code may violate this.

---

### 2.6 `GSCData` — `GSCSnapshot`

**Authority:** `lib/nios/intelligence/types.ts`.

| Field | Type | Nullable | Meaning |
|-------|------|----------|---------|
| `date` | `string` | no | Snapshot date |
| `collectedAt` | `string` | no | Collection timestamp |
| `siteUrl` | `string` | no | GSC property URL |
| `dateRange` | `{ start, end }` | no | Query range |
| `totalImpressions` | `number` | no | Total impressions in range |
| `totalClicks` | `number` | no | Total clicks in range |
| `avgCtr` | `number` | no | Average CTR |
| `avgPosition` | `number` | no | Average position |
| `pages` | `GSCDataRow[]` | no | Per-page data |
| `queries` | `GSCQueryRow[]` | no | Per-query data |
| `countries` | `GSCCountryRow[]` | no | Per-country data |
| `devices` | `GSCDeviceRow[]` | no | Per-device data |

`GSCDataRow`:
| `url` | `string` | no | Page URL |
| `impressions` | `number` | no | Measured impressions |
| `clicks` | `number` | no | Measured clicks |
| `ctr` | `number` | no | `clicks / impressions` if `impressions > 0` |
| `position` | `number` | no | Average position |

**Rule:** `GSCSnapshot` as a whole can be `null` (API unavailable / not configured). No field inside should represent `UNKNOWN` with `0`.

---

### 2.7 `GA4Data` — `GA4Snapshot`

**Authority:** `lib/nios/intelligence/types.ts`.

| Field | Type | Nullable | Meaning |
|-------|------|----------|---------|
| `date` | `string` | no | Snapshot date |
| `collectedAt` | `string` | no | Collection timestamp |
| `propertyId` | `string` | no | GA4 property ID |
| `dateRange` | `{ start, end }` | no | Query range |
| `totalUsers` | `number` | no | Users in range |
| `totalSessions` | `number` | no | Sessions in range |
| `totalPageviews` | `number` | no | Pageviews in range |
| `averageEngagementTimeSec` | `number` | no | Avg engagement |
| `engagementRate` | `number` | no | Engagement rate |
| `pages` | `GA4PageRow[]` | no | Per-page data |
| `sources` | `GA4SourceRow[]` | no | Per-source data |
| `devices` | `GA4DeviceRow[]` | no | Per-device data |

**Rule:** `GA4Snapshot` can be `null`. `totalUsers` of 0 is a valid measured 0 only if `snapshot !== null`.

---

### 2.8 `TrustResult` — `GoogleTrustReport`

**Authority:** `lib/nios/intelligence/types.ts`.

| Field | Type | Meaning |
|-------|------|---------|
| `generatedAt` | `string` | When the report was generated |
| `totalArticles` | `number` | Articles analyzed |
| `highRiskArticles` | `number` | Count high risk |
| `mediumRiskArticles` | `number` | Count medium risk |
| `lowRiskArticles` | `number` | Count low risk |
| `averageGoogleTrustScore` | `number` | Composite average trust |
| `thinContentCount` | `number` | Articles flagged as thin |
| `articlesWithoutAuthor` | `number` | Count missing author |
| `articlesWithoutSources` | `number` | Count missing sources |
| `articles` | `GoogleTrustArticle[]` | Per-article trust data |
| `topBlocked` | `GoogleTrustArticle[]` | Highest risk articles |

**Note:** `googleTrustScore` is derived from a formula. Per the mandate, it must be reproducible. Current implementation must be audited and documented before being treated as authoritative.

---

### 2.9 `AdSenseRisk` — `AdSenseReadinessReport`

**Authority:** `lib/nios/intelligence/types.ts`.

| Field | Type | Meaning |
|-------|------|---------|
| `generatedAt` | `string` | Report timestamp |
| `totalArticles` | `number` | Analyzed articles |
| `readyArticles` | `number` | Ready for AdSense |
| `needsWorkArticles` | `number` | Need work |
| `criticalArticles` | `number` | Critical issues |
| `averageReadinessScore` | `number` | 0-100 readiness |
| `articles` | `AdSenseReadinessArticle[]` | Per-article readiness |
| `googleIgnoredWithHighMeni` | `{ slug, titulo, scoreMeni, gscImpressions }[]` | High MENI + low GSC |

---

### 2.10 `TrafficEvent` — `JourneyEvent`

**Authority:** `lib/observability/types.ts` (canonical implementation from Fase 3).

| Field | Type | Nullable | Meaning |
|-------|------|----------|---------|
| `id` | `string` | yes | Firestore document id |
| `sessionId` | `string` | no | Anonymous session token |
| `type` | `JourneyEventType` | no | `SESSION_START`, `PAGE_VIEW`, `ARTICLE_VIEW`, `SEARCH`, `INTERNAL_NAVIGATION`, `OUTBOUND_CLICK`, `ENGAGEMENT`, `SCROLL_50`, `SCROLL_90`, `ERROR`, `SESSION_END` |
| `timestamp` | `string` | no | ISO 8601 |
| `path` | `string` | no | URL path |
| `articleSlug` | `string` | yes | Article slug if applicable |
| `referrer` | `string` | yes | Sanitized referrer host/path |
| `source` | `TrafficSource` | no | `direct`, `organic`, `social`, `referral`, `search`, `unknown` |
| `device` | `DeviceCategory` | no | `mobile`, `desktop`, `tablet`, `unknown` |
| `browser` | `string` | yes | Browser family only (no full UA) |
| `country` | `string` | yes | Country code if available |
| `durationMs` | `number` | yes | Event duration |
| `metadata` | `Record<string, unknown>` | yes | Extra event context |
| `dataStatus` | `DataStatus` | no | `UNKNOWN`, `DATA_AVAILABLE`, `DATA_EMPTY`, `ERROR` |

**Rule:** No PII. Full user agent is never stored.

---

### 2.11 `Snapshot` — `DailySnapshot`

**Authority:** `lib/nios/intelligence/types.ts`.

| Field | Type | Nullable | Meaning |
|-------|------|----------|---------|
| `date` | `string` | no | Snapshot date |
| `collectedAt` | `string` | no | Collection timestamp |
| `gsc` | `GSCSnapshot \| null` | yes | GSC data or unknown |
| `ga4` | `GA4Snapshot \| null` | yes | GA4 data or unknown |
| `articlesFused` | `ArticleFusion[]` | no | Fused article view |
| `recommendations` | `NIOSRecommendation[]` | no | Recommendations |
| `compliance` | `ComplianceReport \| null` | yes | Compliance report |
| `readiness` | `AdSenseReadinessReport \| null` | yes | AdSense readiness |
| `trust` | `GoogleTrustReport \| null` | yes | Trust report |
| `contentRecovery` | `ContentRecoveryReport \| null` | yes | Recovery report |
| `trafficPerformance` | `TrafficPerformance \| null` | yes | Traffic performance |

---

### 2.12 `RecoveryItem` — `RecoveryArticle`

**Authority:** `lib/nios/intelligence/types.ts`.

| Field | Type | Nullable | Meaning |
|-------|------|----------|---------|
| `slug` | `string` | no | Article slug |
| `titulo` | `string` | no | Title |
| `categoria` | `string` | no | Category |
| `url` | `string` | no | Full URL |
| `scoreMeni` | `number \| null` | yes | MENI score |
| `googleTrustScore` | `number` | no | Trust score |
| `gscImpressions` | `number` | no | Impressions |
| `gscClicks` | `number` | no | Clicks |
| `gscCtr` | `number` | no | CTR |
| `gscPosition` | `number` | no | Position |
| `ga4Users` | `number` | no | Users |
| `ga4Sessions` | `number` | no | Sessions |
| `ga4Pageviews` | `number` | no | Pageviews |
| `palabras` | `number` | no | Word count |
| `hasAutor` | `boolean` | no | Has author? |
| `hasFecha` | `boolean` | no | Has date? |
| `hasFuente` | `boolean` | no | Has source? |
| `hasContexto` | `boolean` | no | Has context? |
| `recoveryScore` | `number` | no | 0-100 recovery priority |
| `status` | `RecoveryStatus` | no | `green` / `yellow` / `red` |
| `mainProblem` | `string` | no | Primary problem |
| `recommendedAction` | `string` | no | Suggested action |
| `evidence` | `NIOSEvidence[]` | no | Evidence sources |

---

## 3. DATA-AUTHORITY CONFLICTS IDENTIFIED

| # | Conflict | Risk |
|---|----------|------|
| 1 | `NoticiaInput` defined in both `lib/meni/types.ts` and `lib/editorial/types.ts` | Duplication, divergence |
| 2 | `ArticleFusion.gscImpressions` uses `number` with `0` for both missing and measured-zero | Violates `NULL ≠ 0` rule |
| 3 | `scoreMeni: number | null` vs some legacy code that may coerce to `0` | Score magic / hidden defaults |
| 4 | `Noticia.estado`, `Noticia.publicado`, `Noticia.aprobadoMeni` can conflict | Multiple publication truths |
| 5 | `GoogleTrustReport.googleTrustScore` formula not yet audited | Cannot be treated as authoritative |
| 6 | `TrafficEvent` contract does not exist | User-journey events have no shared type |

---

## 4. FIRST-PASS VERDICT

Fase 2 produced concrete contracts for the data entities actually present in the repository. Two critical gaps remain and must be closed in subsequent passes:

1. `TrafficEvent` contract must be created (Fase 3).
2. `NoticiaInput` must be unified into a single source.
3. `ArticleFusion` and `GSCData` must be refactored to represent `UNKNOWN` explicitly.

---

*Document generated as part of Fase 2 — Reingeniería Total.*
