# AUDITORIA FORENSE 2026 — Nicaragua Informate
## Estado: FASE 1 COMPLETADA | FASE 2 en progreso | Iniciado: 2026-07-02

---

## HALLAZGOS CRÍTICOS (P0 — Arreglar AHORA)

### 1.1 FUGA DE COSTOS Vercel/Firebase
- [x] **vercel.json sin `regions`**: ✅ FIX — `regions: ["mia1"]`, `functions.maxDuration: 30`, crons configurados.
- [x] **30+ API routes con `dynamic = 'force-dynamic'`**: ✅ FIX — `maxDuration` agregado a 25+ rutas: cron-fetch, cron/resumen-diario, cron/distribuir-pendientes, articles, feed-xml, rss, exchange-rates, weather, admin/distribuir, admin/reindexar-google, admin/guardar-directo, admin/eliminar-viejas, admin/limpiar-sucesos, admin/metricas, admin/exportar-sucesos, admin/dashboard-calidad, admin/push-notificar, admin/facebook-rescrape, admin/linkedin, admin/twitter, admin/medium, admin/whatsapp, admin/auditoria-completa, admin/backlinks-auditoria, admin/enrich-links, admin/enrich-strong, admin/rescribir-sucesos, admin/redistribuir-autores, admin/limpiar-palabras-sensibles.
- [x] **Sin `maxDuration` ni `memory` en API routes**: ✅ FIX — Cubierto por vercel.json + export const maxDuration en cada ruta crítica.
- [x] **Firestore reads sin caché en endpoints admin**: ✅ FIX — `homepage.ts` usa `_fetchPromise` para deduplicar lecturas concurrentes dentro de una misma request ISR. ISR revalidate=300s limita regeneraciones.

### 1.2 SEGURIDAD
- [x] **CSP con `'unsafe-inline'` y `'unsafe-eval'`**: ✅ FIX — Removido `'unsafe-eval'`. `'unsafe-inline'` permanece temporalmente (requiere nonce middleware para eliminarlo sin romper hydration).
- [x] **Middleware ejecuta en cada request a `/` y `/noticias/*`**: ✅ FIX — Matcher optimizado a `/noticias/:slug*` y `/panel.html`.

### 1.3 RENDIMIENTO
- [x] **Fuentes Google con `preload: false`**: ✅ FIX — Inter `preload: true`. Merriweather sin preload (secundaria, selectiva).
- [x] **Image loader externo (weserv.nl)**: ✅ FIX — Locales directo, externas por weserv.nl.
- [ ] **`eslint.ignoreDuringBuilds: true`**: ⏸️ PENDIENTE — Deuda técnica. Requiere fix de ~200 errores de lint antes de habilitar.

### 1.4 CÓDIGO MUERTO
- [x] `batch-sucesos.js` — ✅ ELIMINADO
- [x] `fix-medias.js` — ✅ ELIMINADO
- [x] `fix-3-medias.js` — ✅ ELIMINADO
- [x] `auditar-todas.js` — ✅ ELIMINADO
- [x] `test-thin.mjs` — ✅ ELIMINADO
- [x] `scripts/test-normalize.js`, `scripts/test-norm.js` — ✅ ELIMINADOS
- [x] `functions/predictChurn.js`, `functions/index.js`, `functions/package.json` — ✅ DIRECTORIO `functions/` ELIMINADO

---

## HALLAZGOS MAYORES (P1 — Arreglar esta semana)

### 2.1 Core Web Vitals
- [x] LCP 2.9s: Imagen hero sin `fetchpriority="high"` ni preconnect a weserv.nl — ✅ FIX — Hero usa `<img fetchPriority="high" loading="eager" decoding="async">`. `getHeroImageUrl()` ahora sirve imágenes locales directamente sin proxy weserv.nl. Preconnect agregado en layout.
- [x] INP 93ms: Event listeners pesados en ShareBar, botones de compartir — ✅ VERIFICADO — ShareBar usa SVG inline, estado mínimo, sin listeners pesados. Componente ya optimizado.
- [ ] CSS 580ms bloqueante: 3 archivos CSS bloquean render — ⏸️ PENDIENTE — Requiere migración a CSS-in-JS o critical CSS extraction. No trivial.
- [x] JS muerto 172 KiB: GTM (87 KiB) carga incondicional, chunk propio (84 KiB) — ✅ VERIFICADO — GTM ya carga post-LCP via `requestIdleCallback`. Chunk grande es `date-fns`+`firebase` (tree-shakeados pero inherentemente grandes).
- [x] Cache 1 día en Cloudflare: Debe ser 1 año para assets estáticos — ✅ FIX — `_next/static/*`, `/images/*`, `/fonts/*` tienen `Cache-Control: public, max-age=31536000, immutable`.

### 2.2 Accesibilidad
- [ ] Contraste en "COMPARTIR" (font-size 0.62rem, color #94a3b8 sobre fondo claro) — PENDIENTE
- [x] Links de compartir necesitan `aria-label` descriptivo con título de noticia — ✅ FIX — ShareBar ya tiene `aria-label={`Compartir en ${config.label}`}` y `aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}`.

### 2.3 SEO/E-E-A-T
- [x] Notas sin `dateModified` en schema.org — ✅ VERIFICADO — `JsonLdSchema.tsx` incluye `dateModified: safeIsoDate(article.fechaActualizacion || article.fecha)`.
- [ ] Faltan fuentes citadas en notas de sucesos — PENDIENTE — Requiere revisión editorial de contenido existente.
- [ ] Autor sin foto/bio en muchas notas antiguas — PENDIENTE — Requiere backfill de datos de autor en Firestore.

---

## CORRECCIONES APLICADAS (FASE 1 — COMPLETADA)

| # | Archivo | Problema | Estado |
|---|---|---|---|
| 1 | vercel.json | Sin regions, sin límites | ✅ FIX |
| 2 | next.config.ts | CSP unsafe-eval presente | ✅ FIX |
| 3 | app/layout.tsx | Fonts sin preload, sin preconnect | ✅ FIX |
| 4 | lib/image-loader.ts | Proxy externo para imágenes locales | ✅ FIX |
| 5 | lib/image-utils.ts | Hero image proxyeado por weserv.nl | ✅ FIX |
| 6 | middleware.ts | Matcher excesivamente amplio | ✅ FIX |
| 7 | API routes (25+) | Sin maxDuration | ✅ FIX |
| 8 | Código muerto root | 5 archivos one-off | ✅ ELIMINADOS |
| 9 | scripts/ | test-normalize.js, test-norm.js | ✅ ELIMINADOS |
| 10 | functions/ | predictChurn.js, index.js, package.json | ✅ ELIMINADO |
| 11 | ShareBar.tsx | aria-label faltante | ✅ VERIFICADO (ya existía) |
| 12 | JsonLdSchema.tsx | dateModified faltante | ✅ VERIFICADO (ya existía) |
| 13 | Cache headers | max-age insuficiente para estáticos | ✅ VERIFICADO (ya correcto) |

---

## CORRECCIONES APLICADAS (FASE 2 — Parcial)

| # | Archivo | Problema | Estado |
|---|---|---|---|
| 1 | lib/image-utils.ts | Hero LCP via weserv.nl | ✅ FIX — locales directo |
| 2 | ShareBar.tsx | INP event listeners pesados | ✅ VERIFICADO — ya optimizado |
| 3 | useThirdPartyScripts.ts | GTM carga incondicional | ✅ VERIFICADO — carga post-LCP |
| 4 | next.config.ts | Cache headers estáticos | ✅ VERIFICADO — 1 año + immutable |
