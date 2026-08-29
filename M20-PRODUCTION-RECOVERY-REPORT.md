# M20 - NIOS PRODUCTION RECOVERY & FINAL INTEGRITY GATE

**Started:** 2026-08-28T17:16:47.306Z
**Finished:** 2026-08-28T17:17:04.634Z

## 1. Root cause and repair

- M19 diagnosed a revoked Firebase private key (key id 2da99059f4...).
- New service account JSON (key id 22d36c6175...) was downloaded and placed at G:\RESPALDO\informate-instant-nicaragua-firebase-adminsdk-fbsvc-22d36c6175.json.
- `m20-recovery.ts` verified the key with Google OAuth, read one real Firestore document and updated `.env.local` safely with base64 + individual credentials.
- `firebase-health.ts` now tries `orderBy("__name__", "desc")` and falls back to `.limit(1).get()` if the required index is missing, so health check does not crash in this environment.

## 2. Evidence

| Check | Status | Detail |
|---|---|---|
| Firebase Admin SDK | DEGRADED | CONNECTED - Firestore conectado. 4 colecciones verificadas. Última actividad: 2026-08-25T03:52:09.268Z. Latencia 1440ms. |
| Firestore noticias | READ | 10 documents, top lifetime 10 |
| Firestore traffic_log | READ | 20 documents |
| Firestore traffic_daily | READ | 0 documents |
| Firestore nios_alerts | READ EMPTY | 0 documents (query with orderBy requires composite index) |
| Firestore distribuciones | READ | 30 documents |
| GSC | CONFIG_REQUIRED | NIOS_GSC_SITE_URL / NIOS_SITE_URL no está configurada. |
| GA4 | CONFIG_REQUIRED | NIOS_GA4_PROPERTY_ID no está configurada. |
| Facebook | NOT_CONFIGURED | not configured |

## 3. NIOS Executive summary

- Snapshot date: 2026-08-20
- Snapshot age: 203 hours
- CEO verdict: UNKNOWN
- Top Lifetime articles: 5
- Top Moving articles: 0
- Article momentum entries: 0
- Alert count: 0
- DATA_CONFLICT: snapshotCount 0 vs dashboardCount 0

## 4. Tests / build

| Gate | Result |
|---|---|
| npx tsc --noEmit | OK |
| npm run lint | OK |
| npm run build | OK |
| npm run test:merge | 619 passed, 1 failed (nios-operating-mode DATA_CONFLICT) |

## 5. Security

- gitleaks not installed.
- `.env.local`, `m20-new-base64.txt` and all service account files are gitignored.
- No secrets printed in console output.

## 6. GO / NO-GO

**Veredicto final: NO-GO**

Firebase is recovered and real Firestore reads work, but M20 cannot be GO while:
- `nios_alerts` composite index is missing (resolved ASC, createdAt DESC).
- NIOS has a real DATA_CONFLICT: snapshots are empty but dashboard sees 270 articles.
- GSC and GA4 are not configured.

## 7. Required actions

1. Create the Firestore composite index on `nios_alerts`: resolved ASCENDING, createdAt DESCENDING.
2. Investigate why `nios_daily_snapshots` is empty and real snapshots are not being saved.
3. Configure `NIOS_GSC_SITE_URL` and `NIOS_GA4_PROPERTY_ID` if real GSC/GA4 data is required.
4. Install gitleaks and run `gitleaks detect --source .` before the next commit.

## 8. Modified / temporary files

**Modified:**
- `lib/nios/intelligence/firebase-health.ts` (index fallback)
- `firestore.indexes.json` (nios_alerts index, single-field order fixes)
- `.gitignore` (M19/M20 temp patterns)
- `.env.local` (new Firebase credential, not in Git)

**Temporary (ignored):**
- `m20-recovery.ts`, `m20probe.ts`, `m20genreport.ts`, `m20genreport.js`, `m20createindex.ts`, `m20-new-base64.txt`, `m20-probe-output.json`, `firebase.json`