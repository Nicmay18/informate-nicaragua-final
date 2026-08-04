# 08 — ADMIN PANEL AUDIT

**Auditor:** UX Engineer + Security Analyst
**Fecha:** 2026-08-03

---

## 1. ARQUITECTURA DEL PANEL

### Panel HTML estático
- **Archivo:** `public/panel.html` — servidor via `/api/panel/route.ts`
- **Autenticación:** Token-based via `x-admin-token` header
- **Middleware:** `middleware.ts:63-88` protege `/api/admin/*`

### Páginas admin Next.js
- `/admin/editor` — Editor de artículos
- `/admin/portada` — Generador de portada
- `/admin/nios` — Command center (NIOS)
- `/admin/meni` — Dashboard MENI
- `/admin/ads` — Gestión de anuncios
- `/admin/correcciones` — Correcciones
- `/admin/distribute` — Distribución
- `/admin/entities` — Entidades
- `/admin/google-news` — Google News
- `/admin/growth` — Crecimiento (redirect a nios)
- `/admin/knowledge-center` — Knowledge center (redirect a nios)

### API Routes admin: 72 rutas
- CRUD noticias: `/api/admin/news`
- Análisis: `/api/admin/analizar`, `/api/admin/analizar-v4`, `/api/admin/analizar-forense`
- Pulido: `/api/admin/adsense-repair`, `/api/admin/corregir-titulo`, etc.
- NIOS: `/api/admin/meni-dashboard`, `/api/admin/dashboard-calidad`
- Knowledge: `/api/admin/knowledge`, `/api/admin/knowledge-health`
- Portada: `/api/admin/portada`, `/api/admin/portada-intel`
- Stats: `/api/admin/stats`, `/api/admin/metricas`, `/api/admin/traffic`

## 2. HALLAZGOS

### H-ADM-01: Panel HTML estático con 44 referencias a ADMIN_API_KEY
- **Evidencia:** `public/panel.html` — contiene lógica client-side que referencia `ADMIN_API_KEY`
- **Impacto:** El token se maneja en el cliente. Si el panel es accesible, el código JS es visible
- **Riesgo:** MEDIO — el token se obtiene del input del usuario, no está hardcodeado
- **Prioridad:** P2

### H-ADM-02: Middleware protege `/api/admin/*` con token check
- **Evidencia:** `middleware.ts:63-88` — verifica `x-admin-token` o `x-cron-secret` contra `ADMIN_API_KEY` y `CRON_SECRET`
- **Impacto:** Positivo — protección a nivel de middleware
- **Riesgo:** N/A
- **Nota:** Rutas públicas como `/api/auditor` no están protegidas (ver H-SEC-01)

### H-ADM-03: `isAuthenticatedAdmin` usa cookie comparison
- **Evidencia:** `lib/admin-auth.ts:10-13` — compara cookie `admin_session` con `ADMIN_API_KEY`
- **Impacto:** Funciona pero no usa Firebase Auth verification
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-ADM-04: Session route valida credenciales
- **Evidencia:** `app/api/admin/session/route.ts` — maneja login/logout
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-ADM-05: `useAdminFetch` hook centraliza auth
- **Evidencia:** `hooks/useAdminFetch.ts` — agrega `x-admin-token` header automáticamente
- **Impacto:** Positivo — consistencia
- **Riesgo:** N/A

### H-ADM-06: 72 API routes admin — posible superficie de ataque amplia
- **Evidencia:** `app/api/admin/` contiene 72 rutas
- **Impacto:** Superficie de ataque grande, difícil de auditar completamente
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Documentar rutas activas vs deprecated, eliminar las no usadas

### H-ADM-07: Editor de artículos usa TipTap
- **Evidencia:** `package.json:31-34` — `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`
- **Impacto:** Positivo — editor WYSIWYG moderno
- **Riesgo:** N/A

### H-ADM-08: Generador de portada desacoplado
- **Evidencia:** `/admin/portada` — guarda config visual en Firestore sin modificar artículos
- **Impacto:** Positivo — separación de concerns
- **Riesgo:** N/A

### H-ADM-09: NIOS Command Center completo
- **Evidencia:** `/admin/nios` — integra NIOS v5 con 14 módulos en command-center
- **Impacto:** Positivo — dashboard ejecutivo
- **Riesgo:** N/A

### H-ADM-10: `panel.html` no tiene cache
- **Evidencia:** `middleware.ts:98-104` — `Cache-Control: no-store, must-revalidate, max-age=0`
- **Impacto:** Positivo — siempre sirve versión fresca
- **Riesgo:** N/A

### H-ADM-11: Redirects de rutas admin legacy
- **Evidencia:** `next.config.ts:250-283` — `/admin/growth` → `/admin/nios`, etc.
- **Impacto:** Positivo — conserva bookmarks
- **Riesgo:** N/A

### H-ADM-12: `wp-admin` y `xmlrpc.php` bloqueados
- **Evidencia:** `next.config.ts:285-298`
- **Impacto:** Positivo — evita ataques legacy de WordPress
- **Riesgo:** N/A

### H-ADM-13: Rate limiting solo en `/api/pulir`
- **Evidencia:** `app/api/pulir/route.ts:6` — RateLimiter 20 req/min por IP
- **Impacto:** Solo una ruta tiene rate limiting
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Aplicar a todas las APIs admin

### H-ADM-14: `X-RateLimit-Limit` header en middleware admin
- **Evidencia:** `middleware.ts:85-86` — setea headers pero no enforce real rate limiting
- **Impacto:** Los headers son cosméticos, no hay rate limiting real
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-ADM-15: Componentes admin en `components/admin/` (8 items)
- **Evidencia:** `components/admin/` — 8 componentes
- **Impacto:** Estructura organizada
- **Riesgo:** N/A

### H-ADM-16: `components/pro/` con 18 items
- **Evidencia:** `components/pro/` — 18 componentes pro
- **Impacto:** Positivo — componentes reutilizables
- **Riesgo:** N/A

### H-ADM-17: `components/nios/` con 13 items
- **Evidencia:** `components/nios/` — 13 componentes NIOS
- **Impacto:** Positivo
- **Riesgo:** N/A

## 3. UX DEL PANEL

- **Login:** Session-based con cookie
- **Navegación:** Tabs en panel.html + páginas Next.js
- **Editor:** TipTap WYSIWYG
- **Feedback visual:** Loading states, error messages
- **Responsive:** Panel.html usa Tailwind via CDN
- **Accesibilidad:** No auditada a fondo, pero usa elementos semánticos

## 4. SCORE

| Dimensión | Score |
|---|---|
| Autenticación | 6/10 |
| Autorización | 7/10 |
| UX | 7/10 |
| Funcionalidad | 8/10 |
| Seguridad | 5/10 |
| Mantenibilidad | 6/10 |
| **Total** | **6.5/10** |
