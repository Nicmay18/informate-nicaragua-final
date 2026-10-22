# PLAN DE REPARACIÓN PRIORIZADO — NICARAGUA INFORMATE
Base: autopsia del corpus (597) + sonda producción (784 URLs) + auditoría código/CI. 2026-10-22.
P0 = seguridad/datos/falsedad publicable · P1 = corrupción editorial/evasión de controles/errores técnicos · P2 = calidad/pruebas/perf · P3 = monetización/pulido.

## P0

| # | Ítem | Estado | Acción |
|---|---|---|---|
| P0.1 | Eufemismo "afectado" en corpus | 23/29 docs corregidos en Firestore (36 cambios verificados en DB); 2 rectificaciones; 6 docs intactos por ambigüedad | Aprobar la lista `.audit/repair-afectado-pendientes.json` (47 frases con decisión editorial marcada) → ejecutar `node scripts/repair-afectado-p2.mjs --apply` |
| P0.2 | Fabricación de evidencia en panel.html | ✅ CERRADO en `fix/estabilizacion-forense` (bloques de inyección y regla anti-palabras eliminados) | Mergear la rama |
| P0.3 | `/api/telemetry/ads` mutador abierto | ✅ Rate limit en PR #10 (`ebf9ade1`) | Mergear PR #10 |
| P0.4 | `/panel.html` sin headers de seguridad | ✅ En rama de estabilización | Mergear |
| P0.5 | updateDoc directos del panel a `noticias`/`config/admin` | Latente (fail-closed por reglas — claim `admin` no se emite en repo) | Enrutar por `PUT /api/admin/news/[id]` — cirugía, aprobar alcance |
| P0.6 | `isPublicArticle` sin invariante completo | NO implementable sin migración: 254 docs sin supervisorApproved, 261 sin hash — gatear escondería el 43% del corpus | Primero: backfill/migración de aprobación legacy (aprobación masiva con revisión por muestra); después: gate |

## P1

| # | Ítem | Estado |
|---|---|---|
| P1.1 | 3 artículos E (párrafo ×42) | Ficha lista — decisión dedup/retiro del propietario |
| P1.2 | Residuo `oaicite` en 9 docs | Script de limpieza mecánica (render ya lo oculta) |
| P1.3 | Auditor MENI no detecta defectos (score 100 a párrafo ×42) | Añadir checks a content-integrity: párrafo repetido ≥3 → BLOCK; patrón eufemismo + vocabulario de muerte → REVIEW |
| P1.4 | Separar AUTHORITY_FIELDS de TECHNICAL_FIELDS en mutation-policy | Solo guardarConMeni debe escribir aprobación/hash |
| P1.5 | IP+UA crudos en analytics_traffic sin TTL | Hashear o TTL |
| P1.6 | Secrets por query param (articles/telegram/cache-purge) | Header-only |
| P1.7 | `/api/nios/brief`, `/api/nios/growth` abiertos | Gatear admin/cron |
| P1.8 | `x-cron-secret` en todo /api/admin; CLEANUP_TOKEN con alcance editorial | Restringir scope |
| P1.9 | `publicado` no-booleano en guardar-directo | Validación estricta |
| P1.10 | editorOverride sin motivo obligatorio | Requerir razón + log; bloquear con factuality CRITICAL |

## P2

| # | Ítem | Estado |
|---|---|---|
| P2.1 | Canonical paginado /categoria; clamp /tema,/entidad; canonical /entidad | ✅ En `fix/estabilizacion-forense` — mergear |
| P2.2 | CI: E2E gate, crecimiento-diario auth, deploy-staging | ✅ En `fix/ci-e2e-gate` — mergear tras verificar E2E |
| P2.3 | 67 artículos clase C | Revisión editorial (12 F1 atribución sola; 23 plantilla) |
| P2.4 | 357 bajadas duplicadas | Decisión editorial (patrón común, no urgente) |
| P2.5 | Hub pages huérfanas (/guia,/entidad,/autores,/mapa-del-sitio) | Enlazar en footer |
| P2.6 | JSON-LD: 3 ImageObjects con dimensiones fijas | Una sola sin width/height inventados |
| P2.7 | Imágenes locales sin optimizar (image-loader bypass) | Restaurar resize |
| P2.8 | `/autor/[slug]` force-dynamic | ISR como el resto |
| P2.9 | Count mismatch: slug "seis-fallecidos" vs título "Cinco" | Verificar hecho real — humano |

## P3

| # | Ítem | Estado |
|---|---|---|
| P3.1 | Monetización: PR #10 lista (CRUD, banner, telemetría, panel, métricas honestas) | Mergear + deploy + verificar en prod. Producto vendible: banner artículo US$20/14d. NO vender portada (no renderiza) |
| P3.2 | `/publicidad` prod con cifras sin evidencia | Se corrige con el merge de PR #10 |
| P3.3 | PR #15 (negocios-mvp) | Revisar solape con auspiciadores antes de mergear |
| P3.4 | robots: quitar `host:` y disallow `/buscar`; admin logout; autor duplicado; iPhone Duo desbloquear tras limpieza oaicite | Pulido |

## NO se hará
- Firestore rules (prohibido sin autorización; propuesta documentada: restringir client-SDK writes a `noticias`).
- Bulk delete/noindex sin aprobación de lista.
- AdSense ni servicios pagos.
- Endurecer isPublicArticle antes del backfill (escondería ~254 artículos legítimos).

## Verificación ejecutada
`tsc` limpio · `vitest` 25/25 (ads+pagination) · sonda prod 784 URLs/0 errores · corpus 597 clasificado con falsos positivos separados · correcciones DB verificadas por lectura directa.
