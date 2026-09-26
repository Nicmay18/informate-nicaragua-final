# FORENSIC PRODUCTION CLOSURE REPORT

> Nicaragua Informate — cierre forense de producción.
> HEAD: `1d78bcc6` (+ docs `9af84f66`). Verificado contra producción real el día del deploy.
> Cadena de verificación: reproducido → corregido → probado → verificado en prod.

---

## 1. Executive Summary

El sistema opera sobre una superficie administrativa única (`/panel/*`), un solo NIOS, una fuente de verdad editorial (Firestore + canonical), y una cadena de autoridad intacta (Editor → MENI → Supervisor → persistencia → publicación).

Estado: **estable y operable**. Queda UN ítem P0 con causa raíz fuera del código: caché de Cloudflare sirviendo respuestas autenticadas del panel (remediación exacta en §3).

## 2. Production Status

| Verificación | Resultado |
|---|---|
| Público: `/`, `/noticias`, categorías, artículos | 200 ✓ |
| `/feed.xml`, `/sitemap.xml` | 200 ✓ |
| `/panel.html`, `/panel` → `/panel/centro-de-comando` | 200 / 307 ✓ |
| 22 rutas `/panel/*` sin sesión | `307 /login` en origin (cache-bust: `cf BYPASS`) ✓ |
| `/admin/*` compatibilidad | redirects a `/panel/*` correctos, sin loops ✓ |
| `/api/admin/config`, `/api/admin/news` sin credenciales | 401 ✓ |
| Cookie `admin_session` inválida | 401 ✓ |
| Login → panel | session cookie HttpOnly; renovación automática de cookie implementada |

## 3. Critical Findings

### P0 — Cloudflare cachea respuestas del panel autenticado (ACCION REQUERIDA — fuera del repo)

**Evidencia reproducida**: `GET /panel/nios` sin cookie → `200` con `cf-cache-status: HIT`, `age: 6837`, `cache-control: private, max-age=14400` — contenido admin real (5.6 MB renderizado). Con query `?cb=` (bypass): `307 /login` correcto.

**Causa raíz**: una regla de Cloudflare ("Cache Everything"/Edge TTL) cachea objetos marcados `private`. El objeto en caché fue capturado cuando la ruta era pública (pre-consolidación). El origen (Vercel) ya responde `no-store` + gate auth — el problema es solo el objeto cached + la regla CF.

**Remediación exacta (requiere dashboard Cloudflare del propietario)**:
1. Caching → Purge Cache → URLs: `https://nicaraguainformate.com/panel*` (o Purge Everything).
2. Rules → Page Rules/Cache Rules → `nicaraguainformate.com/panel*` → **Bypass cache** (y `/admin*`).
3. Verificar: `curl -sI https://nicaraguainformate.com/panel/nios | grep cf-cache-status` debe dejar de devolver `HIT`.

**Bloquea producción**: sí — divulgación de contenido admin vía edge cache hasta purgar + regla.

### P1/P2 corregidos — ver §4.

## 4. Fixes Applied (solo cambios justificados)

| Cambio | Clase | Por qué |
|---|---|---|
| `app/panel/layout.tsx` — `isAuthenticatedAdmin` gate | P0 | Páginas migradas `/admin→/panel` habían perdido la barrera del layout viejo; además el layout dinámico impide prerender público |
| `isAdminRequest` cookie-aware (`lib/auth.ts`) | P0 | `/api/admin/config` (exento de middleware) y cualquier ruta similar ahora aceptan la sesión HttpOnly → 401→200 con sesión válida |
| Menú panel.html: −5 duplicados, −3 tabs huérfanos, −210 líneas JS muertas | P1 | Navegación duplicada y código muerto activo en prod |
| `/panel/nios` unificado en `NiosExecutiveCenter` + nav interna | P1 | Fin de 5 componentes NIOS apilados; una sola superficie |
| 15 rutas `/admin/*` migradas a `/panel/*` + stubs redirect + redirects en `next.config.ts` reconciliados | P1 | Eliminada superficie paralela duplicada; links viejos no rompen |
| `cargarEstadisticas` muestra estado ⚠ + toast de error | P2 | 401 se mostraba como ceros — usuario no distinguía error de vacío |
| `guardarConMeni` persiste `classificationConflict`, `suggestedCategory`, `classificationSource`, `classificationStatus`, `classificationReason` | P2 | La divergencia editor↔MENI quedaba invisible (incidente Morgan's Rock/"selección") |
| 5 etiquetas Google Intelligence → lenguaje de datos ("0 impresiones en GSC", "señal interna") | P2 | Presentaban inferencia como hecho comprobado |

## 5. Regression Tests

- `tests/panel-authority-regression.test.ts` (nuevo, 9/9): precedencia editor sobre MENI (`selección`→deportes vs editor=Nacionales → gana Nacionales + conflicto registrado); `isAdminRequest` acepta cookie válida / rechaza inválida / fail-closed.
- `fase0-stabilization.test.ts` actualizado a la nueva página NIOS: 14/14.
- Suite completa: **90 archivos / 1024 tests PASS** (2 skipped).
- `tsc --noEmit`: **0 errores** (árbol fusionado).
- `npm run build`: **BUILD_OK**; manifiesto prerender: 0 rutas `/panel|admin` estáticas.

## 6. Editorial Integrity

Verificado en código (ruta `guardar-directo`):

- Entrada sanitizada → `guardarConMeni` → MENI evalúa → `canonical.contenido` = única versión persistible.
- Gate `repairMechanicalDefects`/`findBlockingDefects`: rechaza con `CONTENT_INTEGRITY_VIOLATION` si quedan defectos; **no reescribe el contenido aprobado** (el texto reparado solo se usa para validación).
- `updateData.contenido = canonical.contenido`; `categoria`/`perfil` canónicos — nunca del body.
- `supervisorApproved=false` → 400 `SUPERVISOR_BLOCKED` antes de persistir.
- Decisiones del Supervisor inmutables (`computePublicationAllowed` — 17 tests previos).
- **Bypass buscado**: no existe ruta que publique contenido distinto al aprobado sin reevaluación.

## 7. Security/Auth

- Browser nunca recibe `ADMIN_API_KEY` (cookie HttpOnly `admin_session` es la credencial).
- Layout `/panel` gate + `isAdminRequest` dual (header + cookie) + `timingSafeCompare`.
- Fail-closed probado: sin credenciales 401, cookie inválida 401, cookie válida 200 (tests + prod).
- **Excepción externa**: caché Cloudflare (§3) — fuera del alcance del código.

## 8. Panel

- Menú: 1 entrada por función, sin duplicados ni tabs huérfanos.
- Tabs activos: Dashboard, Nueva Noticia, Noticias, Evaluador, Calidad, Guías, Correcciones, Categorías, Analytics, Config, Agente IA, NIOS, Entidades.
- Errores visibles (estado ⚠ + toast); ya no hay "0 datos" por error.
- MENI (`/panel/meni`, `/panel/meni-dashboard`), Knowledge Center, Portada, Google News, Ads, Crecimiento — migrados y gated.

## 9. NIOS

`/panel/nios` = `NiosExecutiveCenter` + `DepartamentoCentralSummary`. Submódulos conservados: `performance`, `editorial-strategy`, `weekly`, `recovery`, `reparaciones`, `command-center`, `google-intelligence`, `adsense-recovery`, `adsense-report`. Componentes retirados: NiosPanelPageContent, V3/V4/ExecutiveDashboard, TeHabla, PlanOfToday — sin referencias activas.

## 10. Metrics Reliability

- Capa de datos honesta ya existente: `compliance.ts` usa "HIPÓTESIS INTERNA", "no se puede concluir", `no_data` para ausencia de GSC.
- Capa UI corregida: ya no dice "Google ignora"/"MENI sobreestima" como hechos.
- **Regla vigente**: 0 impresiones = ausencia de datos de visibilidad, NO sentencia de calidad.

## 11. Known Limitations

- Caché CF de rutas panel (§3) — acción del propietario.
- Endpoints legacy `?secret=` (mutaciones de correcciones) siguen aceptando secret por query — documentado; migración de auth fuera de alcance.
- AdSense readiness: métricas de riesgo son internas/heurísticas — fórmula documentada en `lib/nios/swiss-watch/adsense-readiness.ts`; no se reemplaza por mandato.

## 12. Explicitly NOT TOUCHED

Learning Engine · predicciones · Reader Journey · fact-checkers · scores/dimensiones MENI · SEO experimental · distribución NIOS · crons · schema Firestore · contenido periodístico · procesamiento masivo · `docs/*` históricas · `useAdminFetch`/`x-admin-token` (localStorage marker — cubierto por cookie injection en middleware).

## 13. Production Verification

Fecha: deploy `1d78bcc6` propagado. Resultados en §2 + §3 (reproducibles con `.audit/smoke-final.cjs`).

## 14. Final Risk Register

| Riesgo | Severidad | Nota |
|---|---|---|
| CF sirve panel admin desde caché | **CRÍTICO** | Purga + page rule bypass — acción del propietario (§3) |
| Cookie sesión expira tras 24h sin actividad | Bajo | Renovación automática ya implementada |
| Código legacy `?secret=` | Medio | Endpoints internos, documentados |
| Etiquetas de riesgo AdSense heurísticas | Bajo | Ya dicen "riesgo interno", no "rechazo" |
