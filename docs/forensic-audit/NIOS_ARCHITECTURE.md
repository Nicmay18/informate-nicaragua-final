# NIOS ARCHITECTURE v2 — Nicaragua Informate

> FASE 8 — NIOS Rebuild
>
> Fecha: 2026-08-15
>
> Estado: First-pass target architecture. Existing `lib/nios/` is large and fragmented; this document defines the canonical v2 authority.

---

## 1. PRINCIPLES

1. **Single source of truth per concern.** No duplicated score engines, no duplicated collectors.
2. **Layered pipeline.** Data → Normalization → Observation → Derivation → Diagnostic → Decision support.
3. **Fail-closed, not fail-open.** If a collector fails, the system reports `DATA_EMPTY`, not `0` or fabricated numbers.
4. **No PII in observability.** Events are anonymous; referrers are sanitized.
5. **Explicit authorities.** Every derived value lists its `source` and `authority`.

---

## 2. TARGET LAYERS

```
Raw data (GSC, GA4, Firestore traffic_log, internal_noticias)
            │
            ▼
    [Collectors]          # google-collector, traffic-collector
            │
            ▼
    [Normalization]       # unify names, cast types, fill DATA_UNKNOWN
            │
            ▼
    [Observation]         # snapshots, telemetry, session tracking
            │
            ▼
    [Derivation]          # fusions, scores, trends, thresholds
            │
            ▼
    [Diagnostics]         # alerts, alerts, health, issues
            │
            ▼
    [Decision support]    # NIOS report, command-center, editorial suggestions
```

---

## 3. MODULE MAP

### 3.1 Collectors (authority: external APIs)

| Collector | Source | Output |
|-----------|--------|--------|
| `gsc-collector` | `lib/nios/intelligence/gsc-collector.ts` | `GSCSnapshot` |
| `ga4-collector` | `lib/nios/intelligence/ga4-collector.ts` | `GA4Snapshot` |
| `traffic-collector` | `lib/observability/session.ts`, `lib/analytics/traffic-reader.ts` | `JourneyEvent[]` |

### 3.2 Normalization (authority: `lib/nios/intelligence/data-merger.ts`)

- Map all GSC rows to `GSCDataRow`.
- Map all GA4 rows to `GA4PageRow`.
- Map traffic events to `JourneyEvent`.
- All timestamps → ISO 8601.
- All missing values → `null` (means UNKNOWN), never `0`.

### 3.3 Observation (authority: `lib/nios/intelligence/telemetry.ts`, `lib/nios/intelligence/store.ts`)

- `DailySnapshot`
- `ArticleFusion` (`NIOSArticle`)
- `ObservabilityBatch`
- `SessionSummary`

### 3.4 Derivation (authority: `lib/nios/intelligence/health-score.ts`, `lib/nios/command-center/...`)

- `GoogleTrustReport`
- `AdSenseRisk`
- `ContentRecoveryReport`
- `WeeklyReliabilityReport`
- `Editorial score` fusion (MENI + traffic + GSC + GA4)

### 3.5 Diagnostics (authority: `lib/nios/intelligence/alerts.ts`)

- Issue domains: `THIN_CONTENT`, `DUPLICATION`, `SEO`, `TRAFFIC_DROP`, `ADN`, `CATEGORY_IMBALANCE`, `INDEXING`.
- Each issue has `severity`, `evidence`, `authority`, `suggestedAction`.

### 3.6 Decision support (authority: `lib/nios/intelligence/orchestrator.ts`, `lib/nios/executive-report.ts`)

- `NIOSReport` → `NIOSDailySummary` → `NIOSWeeklyReport`
- `EditorialAction[]` → Supervisor/MENI

---

## 4. KEY DATA CONTRACTS

See `DATA_CONTRACTS.md` for full detail. NIOS v2 uses:

- `JourneyEvent`
- `GSCSnapshot`, `GSCDataRow`
- `GA4Snapshot`, `GA4PageRow`
- `ArticleFusion`
- `DailySnapshot`
- `GoogleTrustReport`
- `AdSenseReadinessReport`
- `ContentRecoveryReport`
- `RecoveryArticle`

---

## 5. INTEGRITY RULES

1. If `hasGscData === false`, all `gsc*` fields are `null`.
2. If `hasGa4Data === false`, all `ga4*` fields are `null`.
3. `scoreMeni` is never coerced to `0`; `null` means not scored.
4. `gscImpressions === 0` means measured zero, not unknown.
5. `DailySnapshot` is immutable once written to `nios_daily_snapshots`.

---

## 6. OPEN PROBLEMS IN CURRENT CODE

- `lib/nios/` has many overlapping modules (`business-brain`, `command-center`, `content-intelligence`, `copilot`, `mission-engine`, `revenue`, etc.).
- Some modules may duplicate MENI/Supervisor responsibilities.
- `lib/analytics/traffic-reader.ts` and `lib/observability/` are separate roots for similar concerns.
- `lib/home-balance.ts`, `lib/home-ranking.ts`, `lib/discover-score.ts`, `lib/brand-health.ts` are outside `lib/nios/` but are NIOS concerns.

---

## 7. RECOMMENDED REFACTOR

1. Move all observation/normalization into `lib/nios/core/`.
2. Keep `lib/observability/` for low-level `JourneyEvent` ingestion only.
3. Merge `lib/analytics/traffic-*` into `lib/nios/collectors/traffic/`.
4. Move `lib/home-balance.ts`, `lib/discover-score.ts`, `lib/brand-health.ts` to `lib/nios/derivation/` or delete if duplicated.
5. Make `lib/nios/intelligence/orchestrator.ts` the canonical scheduler, not `app/api/cron/nios-collect` directly.

---

*Fase 8 first-pass complete. Next concrete step: implement `lib/nios/core/orchestrator.ts` canonical pipeline and tests.*
