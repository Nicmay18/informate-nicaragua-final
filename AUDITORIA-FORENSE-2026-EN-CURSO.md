# AUDITORIA FORENSE 2026 — Nicaragua Informate
## Estado: FASE 1 en progreso | Iniciado: 2026-07-02

---

## HALLAZGOS CRÍTICOS (P0 — Arreglar AHORA)

### 1.1 FUGA DE COSTOS Vercel/Firebase
- [x] **vercel.json sin `regions`**: ✅ FIX — Agregado `regions: ["mia1"]` (Miami, closest to Nicaragua). Agregado `functions.maxDuration: 30`.
- [ ] **30+ API routes con `dynamic = 'force-dynamic'`**: PARCIAL — 5 rutas críticas ahora tienen `maxDuration`. Falta revisar las 25+ restantes.
- [x] **Sin `maxDuration` ni `memory` en API routes**: ✅ FIX — Agregado `maxDuration` a: cron-fetch (30s), articles (15s), admin/distribuir (30s), admin/reindexar-google (30s), admin/guardar-directo (30s).
- [ ] **Firestore reads sin caché en endpoints admin**: PENDIENTE — Requiere implementar `unstable_cache` en endpoints admin.

### 1.2 SEGURIDAD
- [x] **CSP con `'unsafe-inline'` y `'unsafe-eval'`**: ✅ FIX — Removido `'unsafe-eval'` del CSP. `'unsafe-inline'` permanece temporalmente (requiere nonce middleware para eliminarlo sin romper hydration).
- [x] **Middleware ejecuta en cada request a `/` y `/noticias/*`**: ✅ FIX — Removido `'/'` del matcher. Ahora solo intercepta `/noticias/:slug*` y `/panel.html`.

### 1.3 RENDIMIENTO
- [x] **Fuentes Google con `preload: false`**: ✅ FIX — Inter (fuente primaria) ahora `preload: true`. Merriweather (secundaria) sigue sin preload (usada selectivamente). Preconnect agregado a weserv.nl.
- [x] **Image loader externo (weserv.nl)**: ✅ FIX — Imágenes locales (`/`) ahora se sirven directamente sin proxy externo. Solo imágenes externas pasan por weserv.nl.
- [ ] **`eslint.ignoreDuringBuilds: true`**: PENDIENTE — No se modificó para evitar break de build. Deuda técnica documentada.

### 1.4 CÓDIGO MUERTO
- [x] `batch-sucesos.js` — ✅ ELIMINADO
- [x] `fix-medias.js` — ✅ ELIMINADO
- [x] `fix-3-medias.js` — ✅ ELIMINADO
- [x] `auditar-todas.js` — ✅ ELIMINADO
- [x] `test-thin.mjs` — ✅ ELIMINADO
- [ ] `scripts/test-normalize.js`, `scripts/test-norm.js` — PENDIENTE
- [ ] `functions/predictChurn.js`, `functions/index.js` — PENDIENTE

---

## HALLAZGOS MAYORES (P1 — Arreglar esta semana)

### 2.1 Core Web Vitals
- [ ] LCP 2.9s: Imagen hero sin `fetchpriority="high"` ni preconnect a weserv.nl
- [ ] INP 93ms: Event listeners pesados en ShareBar, botones de compartir
- [ ] CSS 580ms bloqueante: 3 archivos CSS bloquean render
- [ ] JS muerto 172 KiB: GTM (87 KiB) carga incondicional, chunk propio (84 KiB)
- [ ] Cache 1 día en Cloudflare: Debe ser 1 año para assets estáticos

### 2.2 Accesibilidad
- [ ] Contraste en "COMPARTIR" (font-size 0.62rem, color #94a3b8 sobre fondo claro)
- [ ] Links de compartir necesitan `aria-label` descriptivo con título de noticia

### 2.3 SEO/E-E-A-T
- [ ] Notas sin `dateModified` en schema.org
- [ ] Faltan fuentes citadas en notas de sucesos
- [ ] Autor sin foto/bio en muchas notas antiguas

---

## CORRECCIONES APLICADAS (FASE 1 — Parcial)

| # | Archivo | Problema | Estado |
|---|---|---|---|
| 1 | vercel.json | Sin regions, sin límites | ✅ FIX |
| 2 | next.config.ts | CSP unsafe-eval presente | ✅ FIX |
| 3 | app/layout.tsx | Fonts sin preload, sin preconnect | ✅ FIX |
| 4 | lib/image-loader.ts | Proxy externo para imágenes locales | ✅ FIX |
| 5 | middleware.ts | Matcher excesivamente amplio | ✅ FIX |
| 6 | API routes críticas | Sin maxDuration | ✅ FIX |
| 7 | Código muerto root | 5 archivos one-off | ✅ ELIMINADOS |
| 8 | scripts/, functions/ | Código muerto legacy | PENDIENTE |
| 9 | eslint bypass | ignoreDuringBuilds: true | PENDIENTE |
| 10 | API routes restantes | maxDuration faltante | PENDIENTE |
