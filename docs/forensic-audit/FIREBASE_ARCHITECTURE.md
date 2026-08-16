# FIREBASE / FIRESTORE ARCHITECTURE — Nicaragua Informate

> FASE 4 — Firebase / Firestore
>
> Fecha: 2026-08-15
>
> Estado: First-pass audit. No live Firestore console access; based on code + rules.

---

## 1. CONFIGURATION

| File | Purpose |
|------|---------|
| `lib/firebase-admin.ts` | Firebase Admin SDK init with service account (base64 or env) |
| `firestore.rules` | Security rules (just updated to include NIOS collections) |
| `lib/env.ts` | Environment validation (assumed) |

---

## 2. COLLECTIONS

| Collection | Purpose | Writes from | Reads from | Notes |
|------------|---------|-------------|------------|-------|
| `noticias` | Canonical article store | `lib/editorial/guardar-con-meni.ts`, `lib/meni/publication-pipeline.ts`, admin API | Public pages, sitemap, feeds | Main source of truth |
| `traffic_log` | Raw traffic events | `lib/db/homepage.ts` | `lib/analytics/traffic-aggregator.ts` | High volume; **TTL not configured** |
| `traffic_daily` | Aggregated daily traffic | `lib/analytics/traffic-aggregator.ts` | Dashboards, NIOS | Subcollection `articles` per date |
| `views` | Public view counters | `lib/view-counter.ts` | Public pages | Increment guarded in rules |
| `config` / `configuracion` | Site config | Admin | Public + admin | Two names — possible duplication |
| `nios_daily_snapshots` | Daily NIOS snapshots | `lib/nios/intelligence/store.ts` | `lib/nios/executive-center.ts` | Subcollections `articles` / `reports` |
| `nios_telemetry` | NIOS telemetry / observability | `lib/nios/intelligence/telemetry.ts`, `lib/observability/log.ts` | Dashboard | New (Fase 3) |
| `nios_audit_trail` | Audit trail | `lib/observability/log.ts` | Dashboard | New (Fase 3) |
| `nios_alerts` | NIOS alerts | `lib/nios/intelligence/alerts.ts` | Dashboard |  |
| `meni_learning_feedback` | MENI learning | `lib/nios/intelligence/meni-learning.ts` | Learning engine |  |
| `google_learning_patterns` | Google pattern learning | `lib/nios/intelligence/google-feedback.ts` | Learning engine |  |
| `learning_cycles` / `learning_config` | MENI learning config | `lib/meni/learning-engine/index.ts` | Learning engine |  |
| `distribuciones` | Distribution log | `lib/meni/publication-pipeline.ts` | Admin |  |
| `social_copies` | Social copy per article | `lib/meni/publication-pipeline.ts` | Admin |  |
| `supervisor_updates` | Supervisor decisions log | `lib/supervisor/editorial-supervisor.ts` | Admin |  |
| `article_lifecycles` | Lifecycle tracking | `lib/supervisor/editorial-supervisor.ts`, `lib/news-watch/watch-engine.ts` | Supervisor |  |

---

## 3. KEY OBSERVATIONS

### 3.1 `traffic_log` — high-volume, no TTL

* Writes: one document per view via `lib/db/homepage.ts`.
* Rules: strict field validation but no TTL.
* Aggregation: `traffic_daily` aggregates raw logs daily.
* **Risk:** Infinite growth. At ~1 doc per view, this becomes the dominant storage/cost driver.

### 3.2 Dual `config` / `configuracion`

* `config` and `configuracion` both exist. This is a duplication risk. Need to unify.

### 3.3 `noticias` queries

* `lib/db/homepage.ts` uses `where('slug', '==', slug).limit(1)` then `doc(slug)` fallback. Requires composite index on `slug`.
* `lib/data.ts` likely has multiple category/orderBy queries (not fully inspected in this pass).

### 3.4 Rules

* `noticias` allows `get, list` to public — correct for a public news site.
* `traffic_log` requires `request.auth != null` for create. Server actions use Admin SDK, so this is OK.
* New NIOS collections added in this pass.

### 3.5 Missing live verification

* Cannot verify indexes, TTL policies, backup, or actual document counts without Firebase Console access.
* Cannot verify billing/quota without console.

---

## 4. RECOMMENDED ACTIONS

1. **Enable TTL on `traffic_log`** — retain raw logs for 90 days, keep `traffic_daily` aggregates indefinitely.
2. **Unify `config` / `configuracion`** — pick one canonical collection.
3. **Create composite index** on `noticias` for `slug` equality if not present.
4. **Monitor `nios_telemetry` growth** — apply TTL (e.g., 90 days) for event-level data.
5. **Schedule regular exports** of `noticias` and critical snapshots.

---

## 5. FIRST-PASS VERDICT

Firestore structure is reasonable but has cost risks (`traffic_log`, telemetry). Rules have been updated to include NIOS collections. Full optimization requires live console inspection and TTL configuration.

*Fase 4 first-pass complete. Requires follow-up with live Firebase access for TTL/index verification.*
