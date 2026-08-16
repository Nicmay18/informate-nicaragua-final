# GOOGLE INTEGRATION — GSC / GA4

> FASE 6–7 — Google Search Console / Google Analytics 4
>
> Fecha: 2026-08-15
>
> Estado: GSC VERIFIED. GA4 bloqueado por API Admin no habilitada.

---

## 1. CREDENTIALS / AUTHORITY

| Source | Account | Authority |
|--------|---------|-----------|
| Firebase Service Account | `firebase-adminsdk-fbsvc@informate-instant-nicaragua.iam.gserviceaccount.com` | GCP project `24988088146` |
| GSC property | `sc-domain:nicaraguainformate.com` | Service account is `siteOwner` |
| GA4 property | `NIOS_GA4_PROPERTY_ID=525672447` (pending validation) | Not accessible yet |

---

## 2. GSC — VERIFIED ✅

### What was tested

- `google.searchconsole({ version: 'v1', auth: JWT })`
- `sites.get({ siteUrl: 'sc-domain:nicaraguainformate.com' })`

### Result

- `siteUrl: 'sc-domain:nicaraguainformate.com'`
- `permissionLevel: 'siteOwner'`

✅ GSC connectivity works with the Firebase service account.

### Config in environment

```text
NIOS_SITE_URL=sc-domain:nicaraguainformate.com   # Recommended canonical form
```

The old value `https://nicaraguainformate.com` is **not** a verified URL prefix in GSC; the domain property is.

---

## 3. GA4 — PENDING ⚠️

### What was tested

- `google.analyticsdata({ version: 'v1beta', auth: JWT })`
- `properties.getMetadata({ name: 'properties/525672447' })`
- `google.analyticsadmin({ version: 'v1beta', auth: JWT })` to list account summaries.

### Result

- `properties/525672447` returns **HTTP 404 Not Found**.
- `accountSummaries.list` returns:
  - `Google Analytics Admin API has not been used in project 24988088146 before or it is disabled.`

### Blocker

**Google Analytics Admin API is not enabled** in GCP project `24988088146`.

Enable it at:

```text
https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=24988088146
```

After enabling, also confirm:

1. The Firebase service account has `Viewer` role on the GA4 property.
2. The `NIOS_GA4_PROPERTY_ID` value is the actual **GA4 property ID** (not a data stream ID or measurement ID).
3. Re-run `scripts/verify-google-temp.mjs` (or the NIOS test) to validate.

---

## 4. CODE REFERENCES

| File | Purpose |
|------|---------|
| `lib/nios/intelligence/orchestrator.ts` | NIOS orchestrator that uses `NIOS_GA4_PROPERTY_ID` |
| `app/api/admin/nios-collect/route.ts` | Cron endpoint for NIOS collection |
| `lib/analytics/traffic-reader.ts` | Traffic / GA4 reader |
| `docs/NIOS-INTELLIGENCE-PLATFORM.md` | Docs referencing `NIOS_GA4_PROPERTY_ID` |

---

## 5. RECOMMENDED NEXT ACTION

1. **Enable Google Analytics Admin API** in GCP.
2. **Verify / correct `NIOS_GA4_PROPERTY_ID`** in Vercel env.
3. **Add the Firebase service account as Viewer** in GA4 property access.
4. Re-run GSC/GA4 verification and mark Fase 7 as `PASS`.

---

*Fase 6 (GSC) PASS. Fase 7 (GA4) blocked until Admin API is enabled and property ID is confirmed.*
