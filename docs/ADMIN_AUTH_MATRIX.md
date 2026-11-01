# Matriz de autorización — rutas /api/admin/*

Generado por `.audit/admin-matrix.py` (audit del 31-oct-2026). Regenerar con:
`python .audit/admin-matrix.py`

## Cómo leer la tabla

- **Auth handler**: mecanismo de autorización dentro del propio handler.
  - `—` = el handler NO verifica credenciales; la única barrera es el middleware.
  - `admin-hdr` = compara header `x-admin-token`/`x-admin-key` con `ADMIN_API_KEY`.
  - `admin|cookie` = `verifyAdminToken` (header admin o cookie `admin_session`).
  - `admin|cron` = `verifyAdminOrCronToken` (acepta también `x-cron-secret`/`Authorization: Bearer`).
  - `cron` = solo secreto de cron.
  - `cleanup` = `verifyAdminOrCleanupToken`.
- **401 ad-hoc**: respuestas `{ status: 401 }` explícitas en el archivo del handler.
- **no-store**: el archivo emite los tres headers `Cache-Control: private, no-cache, no-store`,
  `CDN-Cache-Control: no-store`, `Cloudflare-CDN-Cache-Control: no-store`
  (constante `NO_STORE_401_HEADERS` de `lib/auth.ts` o su `unauthorized()`).

## Cobertura de middleware (barrera primaria)

`middleware.ts` (matcher: todo excepto `_next/*`, favicon, robots, sitemap) aplica:

| Segmento | Regla | 401 sin credenciales |
|---|---|---|
| `/api/admin/*` | Requiere admin (header válido o cookie `admin_session`); en `ADMIN_CRON_ROUTES` también acepta cron | 401 con 3 headers no-store |
| `/api/admin/session`, `/api/admin/estado` | `PUBLIC_ADMIN_ROUTES`: pasa sin auth, pero con headers no-store en la respuesta | n/a (200/307) |
| `/api/cron/*`, handlers con auth propia | El middleware no exige auth fuera de `/api/admin/*` y `SENSITIVE_API_PATHS`; el handler decide | 401 con 3 headers no-store (verificado en 75 sitios) |
| `SENSITIVE_API_PATHS` (12 rutas no-admin) | Requiere admin | 401 con 3 headers no-store |

## Rutas alternativas

- Next.js normaliza trailing slash dentro del mismo matcher: `/api/admin/x/` pasa por la
  misma rama `pathname.startsWith('/api/admin/')` → no hay bypass.
- `next.config.ts` define un único rewrite: `/l/:id → /api/l/:id` (shortlinks públicos).
  `/api/l/*` no es ruta admin ni sensible → el rewrite no crea acceso alternativo a handlers
  protegidos. Ningún rewrite/redirect mapea paths públicos a rutas admin.
- `/panel*` y `/admin/*` (páginas) redirigen a `/login` con `no-store` — no exponen datos.

## Hallazgos de la matriz

- **79 rutas** bajo `/api/admin/`; **18 sin auth a nivel handler** (`handlerAuth: —`) — todas
  cubiertas por middleware excepto las 2 públicas intencionales.
- **0 respuestas 401** en todo `app/` sin los tres headers no-store (antes: 38 ad-hoc +
  middleware + `unauthorized()`).
- Las 5 rutas de `ADMIN_CRON_ROUTES` son las únicas donde el secreto de cron abre `/api/admin/*`;
  el resto lo rechaza aunque el handler use `verifyAdminOrCronToken` (middleware gana primero).

## Tabla

| Endpoint | Métodos | Auth handler | 401 ad-hoc | no-store |
|---|---|---|---|---|
| /api/admin/analizar | POST | — | 0 | — |
| /api/admin/auditor-dashboard | GET,POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/auditoria-completa | POST | admin|cookie | 0 | — |
| /api/admin/auditoria-taxonomia | GET | — | 0 | — |
| /api/admin/auspiciadores | GET,POST | admin|cookie | 0 | sí |
| /api/admin/auspiciadores/{id} | PATCH,PUT | admin|cookie | 0 | sí |
| /api/admin/cache-purge | GET,POST | admin|cookie | 0 | — |
| /api/admin/centro-de-comando | GET | — | 0 | — |
| /api/admin/ceo-agent/analyze | POST | admin|cookie | 0 | — |
| /api/admin/ceo-agent/daily | GET,POST | admin|cookie | 0 | — |
| /api/admin/clean-backlog | POST | admin+admin-hdr | 1 | sí |
| /api/admin/comercial | GET | admin|cookie | 0 | sí |
| /api/admin/config | GET,POST | admin|cookie | 0 | — |
| /api/admin/copy-social | GET,POST | admin|cookie | 0 | sí |
| /api/admin/crecimiento | GET | — | 0 | — |
| /api/admin/dashboard-calidad | GET,POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/departamento/ejecutar | GET | admin|cron+cron | 1 | sí |
| /api/admin/departamento/resumen | GET | — | 0 | — |
| /api/admin/departamento/trabajos | GET | — | 0 | — |
| /api/admin/distribuir | GET,POST | admin-hdr+admin|cron | 2 | sí |
| /api/admin/eliminar-viejas | POST | admin|cron | 1 | sí |
| /api/admin/enrich-links | POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/enrich-strong | POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/estado | GET,POST | — | 0 | — |
| /api/admin/exportar-sucesos | POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/facebook-rescrape | POST | — | 0 | — |
| /api/admin/guardar-directo | POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/health | GET | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/index | POST | — | 0 | — |
| /api/admin/kb-backfill | POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/limpiar-noindex | POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/limpiar-sucesos | POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/linkedin | POST | admin|cookie | 0 | — |
| /api/admin/medium | POST | admin|cookie | 0 | — |
| /api/admin/meni/arquitectura | GET | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/meni/evaluar | POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/meni/generar | POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/meni/registry | GET,POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/meni/registry/sync | POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/meni-dashboard | GET,POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/meni-learning | GET,POST | admin-hdr+admin|cleanup | 2 | sí |
| /api/admin/meni-rating | POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/metricas | GET,POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/negocios | POST | — | 0 | — |
| /api/admin/negocios/{id} | GET,PATCH,PUT | — | 0 | — |
| /api/admin/negocios-auditoria | ? | — | 0 | — |
| /api/admin/negocios-campanas | GET | — | 0 | — |
| /api/admin/negocios-planes | ? | — | 0 | — |
| /api/admin/negocios-prospectos | ? | — | 0 | — |
| /api/admin/negocios-reporte | GET | — | 0 | sí |
| /api/admin/negocios-solicitudes | ? | — | 0 | — |
| /api/admin/news | GET,POST | admin+admin-hdr | 2 | sí |
| /api/admin/news/{id} | DELETE,PUT | admin+admin-hdr | 2 | sí |
| /api/admin/nios/growth | GET,POST | admin-hdr+admin|cleanup | 2 | sí |
| /api/admin/nios/loop | GET,POST | admin-hdr+admin|cron+cron | 2 | sí |
| /api/admin/nios/repair | POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/nios-collect | GET,POST | admin-hdr+admin|cleanup+admin|cron+cron | 2 | sí |
| /api/admin/nios-intelligence | GET | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/nios-queues | GET,POST | admin-hdr+admin|cleanup | 2 | sí |
| /api/admin/nios-telemetry | GET | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/nota-trust | GET | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/portada | GET,POST | admin|cookie | 0 | — |
| /api/admin/portada-intel | GET,POST,PUT | admin-hdr+admin|cleanup | 3 | sí |
| /api/admin/push-notificar | POST | admin|cookie | 0 | — |
| /api/admin/reindexar-google | POST | admin|cron+cron | 1 | sí |
| /api/admin/repair-fechas | GET,POST | admin-hdr+admin|cleanup | 2 | sí |
| /api/admin/session | POST | — | 2 | sí |
| /api/admin/shortlink | GET,POST | admin|cookie | 0 | — |
| /api/admin/social-conversion | GET | admin|cookie | 0 | — |
| /api/admin/stats | GET | admin+admin-hdr | 1 | sí |
| /api/admin/traffic | GET,POST | admin-hdr+admin|cron | 1 | sí |
| /api/admin/trafico | GET | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/twitter | POST | admin|cookie | 0 | — |
| /api/admin/upload-image | POST | admin+admin-hdr | 2 | sí |
| /api/admin/verificar-telegram | POST | admin-hdr+admin|cleanup | 1 | sí |
| /api/admin/whatsroute.ts | POST | admin|cookie | 0 | — |