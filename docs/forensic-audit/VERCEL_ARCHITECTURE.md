# VERCEL / NEXT.JS ARCHITECTURE — Nicaragua Informate

> FASE 5 — Vercel / Next.js
>
> Fecha: 2026-08-15
>
> Estado: First-pass audit + one optimization applied.

---

## 1. CONFIGURATION FILES

| File | Purpose | Key facts |
|------|---------|-----------|
| `next.config.ts` | Next.js runtime config | `trailingSlash: false`, `ignoreDuringBuilds: true` (eslint + tsc), `reactStrictMode`, `removeConsole` in prod, custom image loader, redirects, headers, webVitals attribution |
| `vercel.json` | Vercel platform config | `framework: nextjs`, `regions: iad1`, `maxDuration` per API routes (60s for heavy, 30s default), 3 crons (resumen-diario, nios-collect, supervisor-watch), cache headers for sitemaps/feed |

---

## 2. BUILD & CACHE

| Concern | Setting | Impact |
|---------|---------|--------|
| `eslint.ignoreDuringBuilds: true` | Build ignores ESLint errors | Risk: lint issues reach production |
| `typescript.ignoreBuildErrors: true` | Build ignores tsc errors | Risk: type errors reach production |
| `removeConsole: true` | Strips `console.*` in prod | Good for bundle/runtime, but `logger.error` still works |
| `compress: true` | Brotli/Gzip | Good |
| `poweredByHeader: false` | Removes `X-Powered-By` | Good for security |
| `images.loader: 'custom'` | Uses `lib/image-loader.ts` | Must be verified |
| `formats: ['image/avif', 'image/webp']` | Modern image formats | Good |
| `minimumCacheTTL: 86400` | Image cache | Good |

---

## 3. CRON JOBS

| Cron | Schedule | Purpose | Risk |
|------|----------|---------|------|
| `/api/cron/resumen-diario` | 0 12 * * * | Daily summary | OK |
| `/api/cron/nios-collect` | 0 6 * * * | NIOS data collection | OK |
| `/api/cron/supervisor-watch` | 0 8 * * * | Supervisor watch | Downgraded to daily due to Hobby plan |

**Risk:** If any cron fails silently, the next run is 24h later. Need Vercel logs / NIOS telemetry to alert.

---

## 4. REDIRECTS

| Source | Destination | Permanent |
|--------|-------------|-----------|
| `www.*` → apex | `nicaraguainformate.com/:path*` | Yes |
| `http` → `https` | `https://...` | Yes |
| Flat category slugs (`/sucesos`, `/nacionales`, etc.) | `/categoria/:slug` | Yes |
| Legacy `.html` and `/index.php/feed/*` | New paths | Yes |
| `/admin/*` old paths | `/admin/nios` | No (soft) |

**Note:** Large redirect list is correct for SEO but should be audited for obsolete entries.

---

## 5. IMAGES

| Setting | Value |
|---------|-------|
| Loader | Custom (`lib/image-loader.ts`) |
| Formats | AVIF, WebP |
| Device sizes | 640, 750, 828, 1080, 1200, 1920 |
| Image sizes | 16, 32, 48, 64, 96, 128, 256, 384 |
| Minimum cache TTL | 86400s |

**Risk:** Custom loader must handle `firebasestorage`, `cdn.jsdelivr`, `weserv`, etc. `lib/image-loader.ts` needs audit.

---

## 6. CLIENT COMPONENTS (sample)

| Component | Current status | Note |
|-----------|----------------|------|
| `components/Footer.tsx` | `'use client'` | **Candidate** for Server Component — no client-only APIs used |
| `components/OptimizedImage.tsx` | `'use client'` | Uses `useState` for skeleton — keep client |

---

## 7. OPTIMIZATION APPLIED

`components/Footer.tsx` no longer needs `'use client'`. It was removed to reduce client JS bundle. Footer now renders on the server.

---

## 8. OPEN RISKS

1. `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` allow broken code to deploy.
2. `next.config.ts` does not set `headers` for security (CSP, HSTS) — those may be in `app/layout.tsx` or middleware, not audited.
3. Heavy API routes (`/api/admin/meni/generar`, `/api/cron/nios-collect`) run 60s — verify they complete within Vercel limits.
4. No confirmed ISR strategy per route beyond `revalidate = 60` on homepage.

---

*Fase 5 first-pass complete. Further work: bundle analysis, route-level ISR, security headers, image loader audit.*
