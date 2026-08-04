# 06 — PERFORMANCE / CORE WEB VITALS AUDIT

**Auditor:** Performance Engineer + Frontend Lead
**Fecha:** 2026-08-03

---

## 1. MÉTRICAS CLAVE

### LCP (Largest Contentful Paint)
- **Hero image:** `OptimizedImage` component usa `next/image` con `priority` para arriba del fold
- **Fuentes:** `next/font/google` con `display: 'swap'` y `preload: true` para Inter
- **Critical CSS:** Inyectado inline en `<head>` via `lib/critical-css.ts` (8KB)
- **Evaluación:** Buena estrategia LCP

### CLS (Cumulative Layout Shift)
- **Imágenes:** `OptimizedImage` define width/height → reserva espacio
- **Ads:** `AdsenseUnit` lazy-loaded via IntersectionObserver
- **Fuentes:** `display: 'swap'` + `font-display`
- **Evaluación:** Buena

### FID/INP (Interaction to Next Paint)
- **Code splitting:** `AudioButton`, `PullQuote`, `AdsenseUnit` lazy-loaded
- **`removeConsole: true`** en producción
- **`optimizePackageImports`** para lucide-react, date-fns, firebase
- **Evaluación:** Buena

## 2. HALLAZGOS

### H-PERF-01: `pro-design.css` = 167KB sin purge
- **Evidencia:** `app/pro-design.css` = 167,321 bytes, importado en `app/layout.tsx:9`
- **Impacto:** CSS crítico que bloquea render. 167KB es excesivo
- **Riesgo:** ALTO — afecta LCP, FCP, TBT
- **Prioridad:** P1
- **Solución:** PurgeCSS o migrar a Tailwind, eliminar clases no usadas

### H-PERF-02: Google Fonts cargados via `<link>` además de `next/font`
- **Evidencia:** `app/layout.tsx:155-158` — carga Spectral + IBM Plex Mono desde Google Fonts CDN
- **Impacto:** Render-blocking external request, FOIT/FOUT
- **Riesgo:** MEDIO — afecta LCP
- **Prioridad:** P2
- **Solución:** Usar `next/font/google` para Spectral e IBM Plex Mono también

### H-PERF-03: AdSense script en `<head>` con `async`
- **Evidencia:** `app/layout.tsx:160-164` — `<script async src="...adsbygoogle.js">`
- **Impacto:** Aunque es async, compite por ancho de banda y CPU
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Cargar via IntersectionObserver como ya hace `AdsenseUnit`

### H-PERF-04: `home-redesign.css` = 13KB
- **Evidencia:** `app/home-redesign.css` = 13,164 bytes, importado en `app/page.tsx:1`
- **Impacto:** CSS específico de home, razonable
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-PERF-05: `articulo.css` = 15KB
- **Evidencia:** `app/articulo.css` = 15,335 bytes
- **Impacto:** CSS específico de artículo, razonable
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-PERF-06: 7 archivos CSS globales importados en layout
- **Evidencia:** `app/layout.tsx:5-12` — globals.css, components.css, responsive.css, clock-widget.css, pro-design.css, tailwind.css, nios.css, command-center.css
- **Impacto:** CSS acumulado podría ser >200KB
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Auditar y consolidar

### H-PERF-07: `OptimizedImage` usa `next/image` correctamente
- **Evidencia:** `components/OptimizedImage.tsx` — 3,068 bytes
- **Impacto:** Positivo — lazy loading, responsive sizes, formatos modernos
- **Riesgo:** N/A

### H-PERF-08: Image optimization con AVIF + WebP
- **Evidencia:** `next.config.ts:44` — `formats: ['image/avif', 'image/webp']`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-PERF-09: `minimumCacheTTL: 86400` para imágenes
- **Evidencia:** `next.config.ts:45`
- **Impacto:** Positivo — cache de 24h
- **Riesgo:** N/A

### H-PERF-10: `deviceSizes` y `imageSizes` optimizados
- **Evidencia:** `next.config.ts:46-47` — 6 device sizes, 8 image sizes
- **Impacto:** Positivo — no genera demasiadas variantes
- **Riesgo:** N/A

### H-PERF-11: Custom image loader vía weserv.nl
- **Evidencia:** `next.config.ts:22` — `loaderFile: './lib/image-loader.ts'`
- **Impacto:** Positivo — delega optimización a CDN externo, reduce carga Vercel
- **Riesgo:** N/A

### H-PERF-12: `ReadingProgress` y `ShareBar` son client components pesados
- **Evidencia:** `components/ShareBar.tsx` = 9,927 bytes, `components/ReadingProgress.tsx` = 1,577 bytes
- **Impacto:** ShareBar es grande para algo que podría ser más simple
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-PERF-13: `RadioPlayer.tsx` = 16KB client component
- **Evidencia:** `components/RadioPlayer.tsx` = 15,952 bytes
- **Impacto:** Componente pesado que carga en todas las páginas (TopBar)
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Lazy-load el reproductor de radio

### H-PERF-14: `WeatherWidget.tsx` = 7.3KB + `WorldClock.tsx` = 4.7KB + `EconomicBar.tsx` = 2.9KB
- **Evidencia:** TopBar carga múltiples widgets client-side
- **Impacto:** Hidratación JS en todas las páginas
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Lazy-load widgets no críticos

### H-PERF-15: `compiler.removeConsole: true` elimina logs en producción
- **Evidencia:** `next.config.ts:13`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-PERF-16: `scrollRestoration: true` experimental
- **Evidencia:** `next.config.ts:17`
- **Impacto:** Positivo para UX en navegación
- **Riesgo:** N/A

### H-PERF-17: Homepage hace 4 queries paralelas con `Promise.all`
- **Evidencia:** `app/page.tsx:73-78` — `getLatestNews(40)`, `getTrendingNews(20)`, `getPopularNews(20)`, `getAllEvergreen()`
- **Impacto:** Positivo — paralelismo
- **Riesgo:** N/A

### H-PERF-18: `getTrendingNews` llama `getNews(100)` internamente
- **Evidencia:** `lib/db/homepage.ts:102` — `const all = await getNews(100)`
- **Impacto:** Reutiliza cache de `getNews` pero en cache miss son 100 docs
- **Riesgo:** BAJO (cache hit la mayoría del tiempo)
- **Prioridad:** P3

### H-PERF-19: Lighthouse CI configurado
- **Evidencia:** `lighthouserc.js` = 1,246 bytes
- **Impacto:** Positivo — existe config para auditoría automatizada
- **Riesgo:** N/A

## 3. BUNDLE SIZE ESTIMADO

| Asset | Tamaño estimado | Nota |
|---|---|---|
| pro-design.css | 167KB | ⚠️ Excesivo |
| home-redesign.css | 13KB | OK |
| articulo.css | 15KB | OK |
| tailwind.css | ~20KB | OK |
| JS framework (Next+React) | ~150KB gzip | Normal |
| lucide-react (tree-shaken) | ~10KB | OK |
| RadioPlayer | ~8KB | Carga global |
| ShareBar | ~5KB | Solo artículos |
| **CSS total** | **~220KB** | ⚠️ |
| **JS total (gzip)** | **~200KB** | Aceptable |

## 4. SCORE

| Dimensión | Score |
|---|---|
| LCP strategy | 7/10 |
| CLS prevention | 8/10 |
| Code splitting | 7/10 |
| CSS optimization | 4/10 |
| Image optimization | 9/10 |
| Font loading | 6/10 |
| JS bundle | 7/10 |
| **Total** | **6.9/10** |
