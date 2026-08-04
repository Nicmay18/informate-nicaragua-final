# 03 — VERCEL / ISR / CACHING AUDIT

**Auditor:** Platform Engineer + DevOps
**Fecha:** 2026-08-03

---

## 1. CONFIGURACIÓN VERCEL

**Archivo:** `vercel.json`
- **Framework:** nextjs
- **Región:** `iad1` (US East) — correcto para audiencia Nicaragua/US
- **Build:** `npm run build` con `NODE_OPTIONS=--max-old-space-size=4096`
- **API maxDuration:** 30s — adecuado
- **Cron:** `/api/cron/resumen-diario` a las 12:00 UTC (06:00 Nica)

## 2. ISR (INCREMENTAL STATIC REGENERATION)

| Ruta | revalidate | Cache-Control | Evaluación |
|---|---|---|---|
| Home (`/`) | 300s (5min) | `public, max-age=3600, swr=86400` | ✅ Correcto para medio |
| Artículo (`/noticias/:slug`) | 300s | `public, max-age=3600, swr=86400` | ✅ |
| Categoría (`/categoria/:slug`) | 3600s (1h) | `public, max-age=3600, swr=86400` | ✅ |
| Sitemap | 3600s | `public, s-maxage=3600, swr=86400` | ✅ |
| News Sitemap | — | `public, s-maxage=3600, swr=86400` | ✅ |
| Feed XML | — | `public, s-maxage=1800, swr=3600` | ✅ |
| Feed JSON | — | `public, s-maxage=1800, swr=3600` | ✅ |
| Panel | force-dynamic | `no-store, must-revalidate` | ✅ |

## 3. HALLAZGOS

### H-VC-01: Cache-Control del header de Next.config vs Vercel.json — duplicación
- **Evidencia:** `next.config.ts:316` define `Cache-Control: public, max-age=3600, swr=86400` para `/`, y `vercel.json` no lo sobrescribe. Pero `next.config.ts:404` también define cache para `/noticias/:slug*`
- **Impacto:** Ambos funcionan, pero hay duplicación de configuración
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Consolidar en un solo lugar

### H-VC-02: Middleware sobrescribe Cache-Control para crawlers
- **Evidencia:** `middleware.ts:157-162` — si es crawler y path es `/noticias/` o `/categoria/`, setea `Cache-Control: public, s-maxage=3600, swr=86400`
- **Impacto:** Positivo — mejor cache para bots
- **Riesgo:** N/A
- **Prioridad:** N/A

### H-VC-03: Static assets con cache immutable correcto
- **Evidencia:** `next.config.ts:364-368` — `/_next/static/(.*)` → `max-age=31536000, immutable`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-VC-04: Imágenes con cache 1 año correcto
- **Evidencia:** `next.config.ts:376-380` — `/:all*(.webp|.jpg|.jpeg|.png|.gif|.svg)` → `max-age=31536000, immutable`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-VC-05: `unstable_cache` tags bien configurados
- **Evidencia:** `lib/data.ts:177-181` — tags `['noticias']` con revalidate 300s
- **Impacto:** Positivo — invalidación granular
- **Riesgo:** N/A

### H-VC-06: API `/api/transform` sin rate limiting
- **Evidencia:** `app/api/transform/route.ts:6` — procesa imágenes con sharp sin rate limit
- **Impacto:** Puede ser abusado para DoS via procesamiento de imágenes
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Agregar rate limiting o auth

### H-VC-07: API `/api/radio-proxy` sin cache ni rate limiting
- **Evidencia:** `app/api/radio-proxy/route.ts` — proxy de radio
- **Impacto:** Cada request hace fetch externo
- **Riesgo:** MEDIO
- **Prioridad:** P2

### H-VC-08: `compiler.removeConsole: true` en producción
- **Evidencia:** `next.config.ts:13` — `removeConsole: true`
- **Impacto:** Positivo — elimina console.log en producción
- **Riesgo:** N/A

### H-VC-09: `poweredByHeader: false` correcto
- **Evidencia:** `next.config.ts:50`
- **Impacto:** Positivo — no revela tech stack
- **Riesgo:** N/A

### H-VC-10: `compress: true` habilitado
- **Evidencia:** `next.config.ts:49`
- **Impacto:** Positivo — gzip/brotli
- **Riesgo:** N/A

### H-VC-11: `reactStrictMode: true` habilitado
- **Evidencia:** `next.config.ts:11`
- **Impacto:** Positivo — detecta side effects
- **Riesgo:** N/A

### H-VC-12: `optimizePackageImports` para lucide-react, date-fns, firebase
- **Evidencia:** `next.config.ts:16`
- **Impacto:** Positivo — reduce bundle size
- **Riesgo:** N/A

### H-VC-13: `scrollRestoration: true` experimental
- **Evidencia:** `next.config.ts:17`
- **Impacto:** Positivo para UX
- **Riesgo:** BAJO — feature experimental
- **Prioridad:** P3

### H-VC-14: `trailingSlash: false` correcto para SEO
- **Evidencia:** `next.config.ts:4`
- **Impacto:** Positivo — evita duplicación de URLs
- **Riesgo:** N/A

### H-VC-15: Redirects masivos bien configurados
- **Evidencia:** `next.config.ts:55-299` — 30+ redirects 301 para URLs legacy de WordPress
- **Impacto:** Positivo — conserva link equity
- **Riesgo:** N/A

### H-VC-16: `webpack.resolve.symlinks = false`
- **Evidencia:** `next.config.ts:52`
- **Impacto:** Puede causar issues con paquetes symlinked en monorepo, pero aquí no hay monorepo
- **Riesgo:** BAJO
- **Prioridad:** P3

## 4. COSTO VERCEL ESTIMADO

| Recurso | Uso estimado | Costo |
|---|---|---|
| Bandwidth | ~50GB/mes | $0 (Hobby) o ~$20 (Pro) |
| Serverless invocations | ~100K/mes | $0 (Hobby) |
| ISR regenerations | ~5K/mes | $0 |
| Cron | 1/día | $0 |
| Image Optimization | ~5K/mes | $0 (Hobby) o incluido Pro |

**Plan recomendado:** Vercel Pro ($20/mes) para producción con tráfico >10K visitas/día

## 5. SCORE

| Dimensión | Score |
|---|---|
| ISR configuration | 9/10 |
| Cache headers | 8/10 |
| CDN strategy | 8/10 |
| API route protection | 5/10 |
| Build optimization | 8/10 |
| **Total** | **7.6/10** |
