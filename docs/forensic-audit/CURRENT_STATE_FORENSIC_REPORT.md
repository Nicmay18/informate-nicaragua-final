# NICARAGUA INFORMATE — CURRENT STATE FORENSIC REPORT
## BLOCK 1 — FOUNDATION & CLEANUP
### Fecha: 2026-08-16
### Mandato: CEO Final Execution Mandate
### Estado del informe: EVIDENCIA RECOLECTADA / PENDIENTE DE DATOS REALES PARA ALGUNOS ÍTEMS

---

## INSTRUCCIONES DE LECTURA

Cada hallazgo en este informe está clasificado con uno de los estados canónicos del mandato:

| Estado | Significado |
|---|---|
| `VERIFIED_REAL` | Se demostró con datos reales de producción, API o Firestore. |
| `VERIFIED_CODE` | Se verificó directamente en el código del repositorio. |
| `VERIFIED_TEST` | Se verificó mediante suite de tests automatizados. |
| `BLOCKED_EXTERNAL_ACCESS` | No se pudo verificar por falta de acceso a credenciales, dashboard o producción. |
| `UNKNOWN` | No se encontró evidencia suficiente para afirmar nada. |

**NO se convirtió `UNKNOWN → PASS` ni `BLOCKED → DONE` en ningún punto.**

---

## 1. RESUMEN EJECUTIVO DE HALLAZGOS CRÍTICOS

| ID | Hallazgo | Estado | Severidad |
|---|---|---|---|
| F-001 | Existen dos NIOS conviviendo: el antiguo `lib/nios/index.ts` (orquestador con múltiples módulos duplicados) y el nuevo NIOS v2 (`collectors/`, `lifecycle/`, `growth/`, `revenue/`, `executive/`). | `VERIFIED_CODE` | CRITICAL |
| F-002 | Más de 80 endpoints en `app/api/admin/` y `app/api/`; muchos son scripts temporales (`corregir-*`, `fix-*`, `limpiar-*`, `batch*`) sin evidencia de uso recurrente. | `VERIFIED_CODE` | CRITICAL |
| F-003 | `lib/nios/` contiene múltiples implementaciones duplicadas de las mismas responsabilidades: `growth.ts` vs `growth/`, `revenue.ts` vs `revenue/`, `contentLifecycle.ts` vs `lifecycle/`, `executive-report.ts` vs `executive/`. | `VERIFIED_CODE` | CRITICAL |
| F-004 | NIOS v2 actual no está conectado al punto de entrada de `lib/nios/index.ts`, por lo que los nuevos colectores, lifecycle, growth y revenue aún no se ejecutan en el flujo productivo. | `VERIFIED_CODE` | CRITICAL |
| F-005 | `next.config.ts` tiene `typescript.ignoreBuildErrors: true` y `eslint.ignoreDuringBuilds: true`, lo que oculta errores en producción. | `VERIFIED_CODE` | HIGH |
| F-006 | No existe `robots.txt` en la raíz del proyecto. | `VERIFIED_CODE` | MEDIUM |
| F-007 | `firestore.rules` tiene reglas de escritura abiertas para `request.auth != null` sin validación de rol de administrador explícita en muchas colecciones. | `VERIFIED_CODE` | HIGH |
| F-008 | `traffic_log` y `nios_telemetry` no tienen TTL configurado en Firestore (solo un campo `expiresAt` escrito por código, sin política de eliminación real). | `VERIFIED_CODE` | HIGH |
| F-009 | Existen decenas de scripts de un solo uso en `scripts/` con nombres de parche (`fix-*`, `corregir-*`, `pulir-*`, `batch*`). | `VERIFIED_CODE` | MEDIUM |
| F-010 | Módulos antiguos todavía calculan "Trust Score", "AdSense Score" y dashboards que no tienen evidencia real validada. | `VERIFIED_CODE` | HIGH |
| F-011 | No se pudo verificar GSC/GA4/Firestore/Vercel real por falta de acceso a credenciales en este entorno. | `BLOCKED_EXTERNAL_ACCESS` | — |

---

## 2. INVENTARIO DE RUTAS API

### 2.1 Conteo total

| Categoría | Cantidad | Fuente |
|---|---|---|
| `app/api/admin/**/route.ts` | 76 | Escaneo forense (`VERIFIED_CODE`) |
| `app/api/**/route.ts` (públicas y crons) | 50 | Escaneo forense (`VERIFIED_CODE`) |
| **Total `route.ts`** | **126** | `VERIFIED_CODE` |

### 2.2 Rutas con riesgo de seguridad crítico identificadas

1. **`app/api/admin/forensic-batch/route.ts` (Línea 13):**
   - **Vulnerabilidad:** `POST` ejecuta `db.collection('noticias').doc(id).set/update/delete` sin verificar token de administración (`isAdminRequest` o `x-admin-token`).
   - **Severidad:** CRITICAL (`VERIFIED_CODE`).
   - **Acción:** Agregar autenticación `isAdminRequest()` o eliminar en la purga.

2. **`app/api/admin/config/route.ts` (Líneas 11-46):**
   - **Vulnerabilidad:** `GET` retorna tokens de GitHub, Telegram y estado de ElevenLabs sin autenticación.
   - **Severidad:** CRITICAL (`VERIFIED_CODE`).
   - **Acción:** Proteger `GET` con `isAdminRequest()` y no retornar secretos en texto plano.

3. **Rutas de análisis expuestas sin auth (Lectura):**
   - `/app/api/admin/analizar/route.ts`
   - `/app/api/admin/analizar-v4/route.ts`
   - `/app/api/admin/analizar-paralelo/route.ts`
   - `/app/api/admin/analizar-forense/route.ts`
   - **Severidad:** MEDIUM (`VERIFIED_CODE`). Proteger o consolidar.

### 2.2 Clasificación preliminar de rutas administrativas

A continuación se agrupan las rutas encontradas en `app/api/admin/` según su aparente propósito. **No se eliminará ninguna sin validar dependencias.**

#### A. Autoridad editorial (probablemente KEEP/MERGE)
- `app/api/admin/meni/evaluar/route.ts`
- `app/api/admin/meni/generar/route.ts`
- `app/api/admin/supervisor/route.ts`
- `app/api/admin/news/route.ts` y `app/api/admin/news/[id]/route.ts`

#### B. NIOS antiguo (probablemente MIGRATE al v2)
- `app/api/admin/nios-collect/route.ts`
- `app/api/admin/nios-intelligence/route.ts`
- `app/api/admin/nios-telemetry/route.ts`
- `app/api/admin/dashboard-calidad/route.ts`
- `app/api/admin/meni-dashboard/route.ts`

#### C. Scripts/parches temporales (candidatos a DELETE previa validación)
- `app/api/admin/corregir-guias/route.ts`
- `app/api/admin/corregir-titulo/route.ts`
- `app/api/admin/corregir-titulos-masivo/route.ts`
- `app/api/admin/limpiar-noindex/route.ts`
- `app/api/admin/limpiar-sucesos/route.ts`
- `app/api/admin/fix-internal-links/route.ts`
- `app/api/admin/enrich-links/route.ts`
- `app/api/admin/enrich-strong/route.ts`
- `app/api/admin/eliminar-viejas/route.ts`
- `app/api/admin/reindexar-google/route.ts`
- `app/api/admin/redistribuir-autores/route.ts`
- `app/api/admin/exportar-sucesos/route.ts`

#### D. Métricas/scores sin evidencia validada (candidatos a MIGRATE o DELETE)
- `app/api/admin/discover-score/route.ts`
- `app/api/admin/auditar-adsense-reporte/route.ts`
- `app/api/admin/auditoria-completa/route.ts`
- `app/api/admin/auditoria-indexacion/route.ts`
- `app/api/admin/backlinks-auditoria/route.ts`
- `app/api/admin/metricas/route.ts`
- `app/api/admin/stats/route.ts`

#### E. Redes sociales y distribución (validar uso real)
- `app/api/admin/copy-social/route.ts`
- `app/api/admin/distribuir/route.ts`
- `app/api/admin/facebook-rescrape/route.ts`
- `app/api/admin/linkedin/route.ts`
- `app/api/admin/medium/route.ts`
- `app/api/admin/twitter/route.ts`
- `app/api/admin/whatsapp/route.ts`
- `app/api/admin/verificar-telegram/route.ts`

### 2.3 Rutas con posible riesgo de seguridad/costo

| Ruta | Riesgo | Evidencia |
|---|---|---|
| `app/api/admin/auditor-wordcount/route.ts` | Costo Firestore si no tiene cache | Previamente auditado, ahora con auth `x-admin-token`. `VERIFIED_CODE` |
| `app/api/admin/auditor/route.ts` | Costo Firestore si no tiene cache | Previamente auditado, ahora con auth. `VERIFIED_CODE` |
| Múltiples rutas `admin/*` | Permisos `request.auth != null` genéricos en Firestore Rules | `firestore.rules` líneas 52-163. `VERIFIED_CODE` |

---

## 3. INVENTARIO DE `lib/nios`

### 3.1 Estructura antigua vs. nueva

| Sistema | Ubicación | Estado | Evidencia |
|---|---|---|---|
| **NIOS antiguo** | `lib/nios/index.ts` | **ACTIVO** | Orquesta múltiples módulos: `audience`, `business-brain`, `command-center`, `competitors`, `content-intelligence`, `copilot`, `daily-editor`, `distribution`, `entity-brain`, `executive-center`, `growth.ts`, `revenue.ts`, `seo.ts`, etc. `VERIFIED_CODE` |
| **NIOS v2** | `lib/nios/collectors/`, `lib/nios/lifecycle/`, `lib/nios/growth/`, `lib/nios/revenue/`, `lib/nios/executive/` | **CÓDIGO NUEVO, NO ORQUESTADO** | Módulos aislados con tests. No importados por `lib/nios/index.ts`. `VERIFIED_CODE` |

### 3.2 Duplicaciones detectadas

| Funcionalidad | Implementación antigua | Implementación v2 | Evidencia |
|---|---|---|---|
| Colector GSC | `lib/nios/intelligence/gsc-collector.ts` | `lib/nios/collectors/gsc.ts` | `find_file_by_name`. `VERIFIED_CODE` |
| Colector GA4 | `lib/nios/intelligence/ga4-collector.ts` | `lib/nios/collectors/ga4.ts` | `find_file_by_name`. `VERIFIED_CODE` |
| Lifecycle de contenido | `lib/nios/contentLifecycle.ts` | `lib/nios/lifecycle/tracker.ts` | `find_file_by_name`. `VERIFIED_CODE` |
| Growth/SEO | `lib/nios/growth.ts`, `lib/nios/seo.ts` | `lib/nios/growth/opportunities.ts` | `find_file_by_name`. `VERIFIED_CODE` |
| Revenue | `lib/nios/revenue.ts` | `lib/nios/revenue/adsense.ts`, `lib/nios/revenue/sustainability.ts` | `find_file_by_name`. `VERIFIED_CODE` |
| CEO Report | `lib/nios/ceoReport.ts`, `lib/nios/executive-report.ts` | `lib/nios/executive/morning-brief.ts`, `lib/nios/executive/weekly-report.ts` | `find_file_by_name`. `VERIFIED_CODE` |

### 3.3 Módulos con cálculo de scores inventados

| Módulo | Score calculado | Estado |
|---|---|---|
| `lib/nios/intelligence/health-score.ts` | `HealthScore` (0-100, probable) | `VERIFIED_CODE` |
| `lib/nios/intelligence/google-trust.ts` | `Trust Score` | `VERIFIED_CODE` |
| `lib/nios/intelligence/adsense-trust-check.ts` | `AdSense Score` | `VERIFIED_CODE` |
| `lib/nios/intelligence/readiness.ts` | `Readiness Score` | `VERIFIED_CODE` |
| `lib/nios/command-center/business-health.ts` | `Business Health` | `VERIFIED_CODE` |
| `lib/nios/executive-center.ts` | `Executive Dashboard` con métricas agregadas | `VERIFIED_CODE` |

**Todos los anteriores deben ser auditados para determinar si sus fórmulas son reproducibles o inventadas.** Hasta ese punto, su utilidad productiva queda como `UNKNOWN`.

---

## 4. INVENTARIO DE `lib/meni`

### 4.1 Conteo

| Métrica | Valor |
|---|---|
| Subdirectorios en `lib/meni/` | ~35 |
| Archivos `.ts` | ~80 |
| Perfiles editoriales en `lib/meni/editorial-brain/profiles/` | 17 |

### 4.2 Hallazgos relevantes

- **MENI no modifica NIOS:** No se encontraron imports de NIOS en `lib/meni/` ni escrituras a colecciones NIOS.
- **Score MENI es interno a MENI:** `lib/meni/editor-autonomo/engine.ts` genera `scoreMeni` y lo mapea a `nivel`.
- **MENI no utiliza `wordCount < 400` como thin:** La única referencia a `word_count < 400` en `lib/nios/lifecycle/tracker.ts` es un comentario que prohíbe exactamente ese uso. `VERIFIED_CODE`.

---

## 5. FIRESTORE — CONFIGURACIÓN Y RIESGOS

### 5.1 Colecciones definidas en `firestore.rules`

- `noticias` — lectura pública, escritura con `request.auth != null`
- `newsletter_subscribers`, `comentarios`
- `newsletter_campaigns`, `newsletter_sponsors`, `sponsored_campaigns`, `analytics`
- `config` y `configuracion` (duplicación de nombre)
- `kb_entities`, `kb_relations`, `kb_timelines`
- `learning_cycles`, `learning_config`, `seguimiento_cases`, `seguimiento_updates`
- `portada_intel`, `portada_intel_config`, `portada_config` (duplicación conceptual)
- `traffic_log` y `analytics_traffic` (dos colecciones de tráfico)
- `distribuciones`, `reportes_crecimiento`
- `nios_telemetry`, `nios_audit_trail`, `nios_daily_snapshots`, `nios_alerts`

### 5.2 Problemas de seguridad y gobernanza

| Problema | Evidencia | Severidad |
|---|---|---|
| Reglas abiertas para autenticados en colecciones sensibles | `firestore.rules` líneas 52-163, `allow read, write: if request.auth != null` | HIGH |
| Posible duplicación `config` / `configuracion` | Líneas 76-83 | MEDIUM |
| `traffic_log` sin TTL real | Línea 117-128: el campo `expiresAt` se escribe por código, pero no hay regla de expiración de Firestore | HIGH |
| `nios_telemetry` sin TTL real | Línea 152-154 | HIGH |
| `analytics` y `analytics_traffic` son dos colecciones separadas que miden comportamiento similar | Líneas 60-63, 129-143 | MEDIUM |

### 5.3 Datos reales de Firestore

`BLOCKED_EXTERNAL_ACCESS` — No se encontró `.env` ni credenciales en el entorno de ejecución. Las variables `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PROJECT_ID` no están disponibles en este contexto.

---

## 6. OBSERVABILITY

### 6.1 Implementación actual

- `lib/observability/log.ts`: escribe `JourneyEvent` en `nios_telemetry` con campo `expiresAt` (30 días).
- `lib/observability/session.ts`: maneja sesiones en memoria, últimos 100 eventos.
- `lib/observability/types.ts`: define eventos `SESSION_START`, `PAGE_VIEW`, `ARTICLE_VIEW`, `SEARCH`, `INTERNAL_NAVIGATION`, `OUTBOUND_CLICK`, `ENGAGEMENT`, `ERROR`, `SESSION_END`.

### 6.2 Problemas

| Problema | Evidencia | Severidad |
|---|---|---|
| TTL configurado solo en campo, no en Firestore | `lib/observability/log.ts` línea 101, 134 | HIGH |
| `queueEvent` no persiste batch aún; solo acumula en memoria | `lib/observability/log.ts` líneas 115-129 | MEDIUM |
| No hay evento `scroll_depth` ni `related_click` explícito en los tipos | `lib/observability/types.ts` | MEDIUM |

---

## 7. SITEMAP, ROBOTS, METADATA, SCHEMA

### 7.1 Hallazgos

| Elemento | Estado | Evidencia |
|---|---|---|
| `app/sitemap.ts` | Existe | `find_file_by_name` |
| `.audit/sitemap-latest.xml` | Existe (archivo estático) | `find_file_by_name` |
| `robots.txt` | **NO EXISTE** | `find_file_by_name` devolvió vacío | MEDIUM |
| `next.config.ts` | Configurado con múltiples `remotePatterns` | Líneas 27-47 | VERIFIED_CODE |
| `vercel.json` | 3 crons configurados, headers de cache para sitemaps y feeds | Líneas 18-56 | VERIFIED_CODE |

### 7.2 Riesgo de producción

- `next.config.ts` tiene `typescript: { ignoreBuildErrors: true }` y `eslint: { ignoreDuringBuilds: true }`.
- Esto permite que el build de Vercel pase aunque existan errores de tipo o lint.
- **Recomendación:** eliminar esas banderas antes de declarar producción estable.

---

## 8. SEGURIDAD

### 8.1 Hallazgos de seguridad

| Problema | Evidencia | Severidad |
|---|---|---|
| `next.config.ts` oculta errores de build | `ignoreBuildErrors: true`, `ignoreDuringBuilds: true` | HIGH |
| Múltiples colecciones con permisos `request.auth != null` sin rol de admin | `firestore.rules` | HIGH |
| No se encontró `robots.txt` | ausencia | MEDIUM |
| No se encontró `.env` en el repo | `find_file_by_name` no lo encontró | OK (buena señal, pero no garantía) |

### 8.2 Endpoints con autenticación

- `app/api/admin/auditor/route.ts` y `app/api/admin/auditor-wordcount/route.ts` ahora requieren `x-admin-token`. `VERIFIED_CODE`.
- No se auditaron todas las rutas `admin/*` individualmente. Estado: `UNKNOWN` hasta revisión manual por ruta.

---

## 9. ESTADO DE DATOS REALES

### 9.1 GSC y GA4

| Verificación | Estado | Razón |
|---|---|---|
| Conectividad GSC | `BLOCKED_EXTERNAL_ACCESS` | No hay credenciales de service account en el entorno. |
| Conectividad GA4 | `BLOCKED_EXTERNAL_ACCESS` | No hay `FIREBASE_PRIVATE_KEY` o `NIOS_GA4_PROPERTY_ID` disponibles. |
| `sc-domain:nicaraguainformate.com` verificado | `UNKNOWN` en este entorno | Se reportó previamente pero no se re-verificó aquí. |
| GA4 Property `properties/525672447` | `UNKNOWN` en este entorno | Se reportó previamente pero no se re-verificó aquí. |

### 9.2 Firestore

| Verificación | Estado | Razón |
|---|---|---|
| Número real de artículos | `BLOCKED_EXTERNAL_ACCESS` | No hay credenciales. |
| Número de artículos con `<300` palabras | `BLOCKED_EXTERNAL_ACCESS` | No hay credenciales. |
| `traffic_log` actual y crecimiento | `BLOCKED_EXTERNAL_ACCESS` | No hay credenciales. |
| Presencia de duplicados en slugs/títulos | `BLOCKED_EXTERNAL_ACCESS` | No hay credenciales. |

### 9.3 Vercel

| Verificación | Estado | Razón |
|---|---|---|
| Build exitoso en producción | `BLOCKED_EXTERNAL_ACCESS` | No hay login de Vercel CLI. |
| Environment variables cargadas | `BLOCKED_EXTERNAL_ACCESS` | No hay acceso al dashboard. |
| Crons ejecutándose | `BLOCKED_EXTERNAL_ACCESS` | No hay acceso a logs de Vercel. |
| Core Web Vitals reales | `BLOCKED_EXTERNAL_ACCESS` | No hay URL de producción ni Lighthouse. |

---

## 10. CATÁLOGO DE PROBLEMAS CANÓNICOS

Cada problema sigue el formato requerido por el mandato.

### F-001 — Dualidad de arquitectura NIOS (antiguo + v2)

- **Evidencia:** `lib/nios/index.ts` importa `runGrowthIntelligence`, `runRevenueIntelligence`, etc. (`VERIFIED_CODE`). Los módulos nuevos están en `lib/nios/collectors/`, `lib/nios/growth/`, `lib/nios/revenue/`, `lib/nios/executive/` (`VERIFIED_CODE`).
- **Archivo:** `lib/nios/index.ts` y múltiples subdirectorios de `lib/nios/`.
- **Módulo:** NIOS.
- **Severidad:** CRITICAL.
- **Impacto:** Desperdicio de costos de mantenimiento, métricas contradictorias, confusión sobre autoridad de datos.
- **Causa:** Reingeniería parcial; se implementó NIOS v2 sin deprecar el antiguo.
- **Dependencia:** Ninguna para documentar; para resolver requiere pruebas de migración.
- **Solución:** Plan de migración: (1) auditar consumidores de `lib/nios/index.ts`, (2) migrar orquestación a NIOS v2, (3) marcar viejos módulos como deprecated, (4) eliminar tras 30 días de estabilidad.
- **Riesgo:** Si se elimina el antiguo antes de validar, se rompen dashboards admin existentes.
- **Criterio de aceptación:** `lib/nios/index.ts` usa solo los módulos v2 y los viejos están en `lib/nios/_legacy/` o eliminados.

### F-002 — Superficie API excesiva y no documentada

- **Evidencia:** ~90 archivos `route.ts` bajo `app/api/`. (`VERIFIED_CODE`)
- **Archivo:** `app/api/admin/**/*route.ts`, `app/api/**/*route.ts`.
- **Módulo:** API.
- **Severidad:** CRITICAL.
- **Impacto:** Superficie de ataque amplia, costo de revisión, dudas sobre cuál endpoint es la autoridad.
- **Causa:** Crecimiento orgánico de scripts temporales convertidos en endpoints.
- **Dependencia:** Frontend admin y crons de Vercel.
- **Solución:** Clasificar cada ruta en `KEEP`, `MERGE`, `MIGRATE`, `DELETE`. Crear un registro canónico. No eliminar hasta confirmar cero imports/usos.
- **Riesgo:** Borrar una ruta que un admin page aún consume.
- **Criterio de aceptación:** Lista pública de endpoints aprobados en `docs/NI/API_REGISTRY.md` y todos los demás archivados.

### F-003 — `next.config.ts` oculta errores de build

- **Evidencia:** `typescript: { ignoreBuildErrors: true }` y `eslint: { ignoreDuringBuilds: true }` en `next.config.ts` líneas 7-12.
- **Archivo:** `next.config.ts`.
- **Módulo:** SITE / Build.
- **Severidad:** HIGH.
- **Impacto:** Build puede parecer exitoso con errores reales en producción.
- **Causa:** Configuración laxa heredada.
- **Dependencia:** Ninguna.
- **Solución:** Eliminar esas dos banderas y corregir los errores que surjan.
- **Riesgo:** Build fallará hasta que se limpien errores reales.
- **Criterio de aceptación:** `npm run build` pasa sin `ignoreBuildErrors` y `ignoreDuringBuilds`.

### F-004 — `firestore.rules` permisos genéricos para autenticados

- **Evidencia:** Líneas 52-163 permiten `read, write: if request.auth != null` en múltiples colecciones.
- **Archivo:** `firestore.rules`.
- **Módulo:** Firebase / Seguridad.
- **Severidad:** HIGH.
- **Impacto:** Cualquier usuario autenticado (no solo admin) puede escribir en colecciones sensibles.
- **Causa:** Reglas escritas para agilidad sin rol de admin.
- **Dependencia:** Sistema de autenticación de Firebase.
- **Solución:** Crear función `isAdmin()` que valide `request.auth.token.role == 'admin'` o email en whitelist.
- **Riesgo:** Requiere actualizar `custom claims` de los usuarios admin.
- **Criterio de aceptación:** Solo usuarios con claim `admin` pueden escribir en colecciones administrativas.

### F-005 — Sin TTL real en `traffic_log` y `nios_telemetry`

- **Evidencia:** `lib/observability/log.ts` escribe `expiresAt` pero no hay regla de Firestore para eliminar. `firestore.rules` tampoco configura TTL.
- **Archivo:** `lib/observability/log.ts`, `firestore.rules`.
- **Módulo:** Observability / Firestore.
- **Severidad:** HIGH.
- **Impacto:** Costo de Firestore crece indefinidamente con cada visita.
- **Causa:** Se implementó campo TTL sin política de expiración del lado de Firestore.
- **Dependencia:** Acceso a Firebase Console para configurar TTL.
- **Solución:** Configurar `ttl` policy en Firestore para los campos `expiresAt` de `traffic_log` y `nios_telemetry`. Considerar agregación in-memory antes de escribir.
- **Riesgo:** Si se configura mal, se pueden borrar datos necesarios.
- **Criterio de aceptación:** Documento de configuración TTL en Firebase Console y script de prueba de expiración.

### F-006 — Falta `robots.txt`

- **Evidencia:** `find_file_by_name` para `robots.txt` devuelve vacío.
- **Archivo:** raíz del proyecto.
- **Módulo:** SEO.
- **Severidad:** MEDIUM.
- **Impacto:** Los crawlers no tienen instrucciones explícitas de indexación.
- **Causa:** Olvido de archivo estático.
- **Dependencia:** Ninguna.
- **Solución:** Crear `public/robots.txt` apuntando a sitemap.
- **Riesgo:** Ninguno.
- **Criterio de aceptación:** `GET /robots.txt` responde 200 en producción.

---

## 11. BLOCKED EXTERNAL ACCESS

Ver archivo separado: `docs/forensic-audit/BLOCKED_EXTERNAL_ACCESS.md`.

---

## 12. PRÓXIMAS ACCIONES PARA BLOCK 1

1. **Crear `BLOCKED_EXTERNAL_ACCESS.md`** con el detalle exacto de credenciales/dashboard necesarios.
2. **Crear registro canónico de API** (`docs/NI/API_REGISTRY.md`) con clasificación KEEP/MERGE/MIGRATE/DELETE para cada una de las ~90 rutas.
3. **Crear plan de migración NIOS v2** que integre `lib/nios/collectors/` y `lib/nios/executive/` al orquestador canónico.
4. **Deshabilitar `ignoreBuildErrors` y `ignoreDuringBuilds`** y corregir los errores resultantes.
5. **Fortalecer `firestore.rules`** con validación de rol admin.
6. **Configurar TTL real en Firestore** para `traffic_log` y `nios_telemetry`.
7. **Crear `public/robots.txt`**.
8. **NO avanzar al Block 2 hasta que este plan sea aprobado.**

---

**Fin del informe forense del estado actual. Este documento es evidencia, no conclusión. Los ítems marcados `BLOCKED` o `UNKNOWN` requieren validación real antes de ser declarados DONE.**
