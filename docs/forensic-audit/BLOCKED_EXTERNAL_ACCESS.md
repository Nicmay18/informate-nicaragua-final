# NICARAGUA INFORMATE — BLOCKED EXTERNAL ACCESS
## CEO Final Execution Mandate — Registro de Bloqueos Externos
### Fecha: 2026-08-16

---

## INSTRUCCIONES

Este documento registra todos los elementos que **no pueden verificarse desde el entorno de desarrollo** por falta de acceso a credenciales, dashboards o recursos externos. Cada ítem incluye:

1. Qué falta.
2. Por qué es necesario.
3. Qué ya fue preparado en código.
4. Comando exacto o acceso requerido.
5. Acción humana mínima necesaria.
6. Prueba que deberá ejecutarse después.

**Ningún ítem aquí es una excusa para detener el trabajo interno.** El código, contratos y tests continúan. Estos bloqueos solo impiden la verificación `VERIFIED_REAL`.

---

## 1. VERCEL PRODUCTION DEPLOYMENT

| Campo | Detalle |
|---|---|
| **Qué falta** | Sesión autenticada en Vercel CLI o acceso al Vercel Dashboard. |
| **Por qué es necesario** | Para verificar build real, Core Web Vitals, logs de funciones, crons y variables de entorno en producción. |
| **Qué está preparado** | `vercel.json`, `next.config.ts`, `npm run build`, `npm run type-check`, `npx vitest run` pasan. GitHub ya tiene los últimos commits. |
| **Comando exacto** | `npx vercel login` y luego `npx vercel --prod` en `E:\PROYECTO\informate-nicaragua-final`. |
| **Acción humana mínima** | El propietario debe autenticarse con su cuenta de Vercel y autorizar el proyecto. |
| **Prueba post-desbloqueo** | `npx vercel --prod` completa, la URL de producción responde 200, y el build log no muestra errores de TypeScript. |

---

## 2. GOOGLE SEARCH CONSOLE (GSC) — DATOS REALES

| Campo | Detalle |
|---|---|
| **Qué falta** | Credenciales de service account con acceso `siteOwner` a `sc-domain:nicaraguainformate.com`. |
| **Por qué es necesario** | Para re-verificar impresiones, clics, CTR, queries y posición real del período actual. |
| **Qué está preparado** | `lib/nios/collectors/gsc.ts` con manejo de estados `CONNECTED_WITH_DATA`, `CONNECTED_NO_DATA`, `NOT_CONFIGURED`, `ACCESS_DENIED`, `API_ERROR`. |
| **Comando exacto** | `node -e "require('./lib/nios/collectors/gsc').collectGscData({ days: 7 }).then(r => console.log(JSON.stringify(r, null, 2)))"` (requiere `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `NIOS_SITE_URL` en el entorno). |
| **Acción humana mínima** | Confirmar que la service account sigue activa y que `sc-domain:nicaraguainformate.com` tiene `siteOwner`. Si se rotaron credenciales, actualizar `FIREBASE_PRIVATE_KEY` en Vercel y localmente. |
| **Prueba post-desbloqueo** | `collectGscData` devuelve `dataStatus: 'CONNECTED_WITH_DATA'` con `totalImpressions > 0` o `CONNECTED_NO_DATA` si el período carece de volumen. |

---

## 3. GOOGLE ANALYTICS 4 (GA4) — DATOS REALES

| Campo | Detalle |
|---|---|
| **Qué falta** | Credenciales de service account con permisos de lectura en GA4 Property `properties/525672447` (`informate-instant-nicaragua`). |
| **Por qué es necesario** | Para re-verificar usuarios, sesiones, engagement time, fuentes de tráfico y páginas. |
| **Qué está preparado** | `lib/nios/collectors/ga4.ts` con estados limpios y métricas canónicas. |
| **Comando exacto** | `node -e "require('./lib/nios/collectors/ga4').collectGa4Data({ days: 7 }).then(r => console.log(JSON.stringify(r, null, 2)))"` (requiere `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `NIOS_GA4_PROPERTY_ID`). |
| **Acción humana mínima** | Confirmar permisos en la propiedad de GA4 para la service account. |
| **Prueba post-desbloqueo** | `collectGa4Data` devuelve `dataStatus: 'CONNECTED_WITH_DATA'` o `CONNECTED_NO_DATA` según el período. |

---

## 4. FIREBASE / FIRESTORE — DATOS REALES

| Campo | Detalle |
|---|---|
| **Qué falta** | Variables de entorno `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID`. No existe `.env` en el repo y no están seteadas en este shell. |
| **Por qué es necesario** | Para verificar número real de noticias, duplicados, slugs, `traffic_log`, TTL, índices y costo. |
| **Qué está preparado** | `firestore.rules`, `lib/observability/log.ts` con escritura a `nios_telemetry`, colectores que leen desde Firestore. |
| **Comando exacto** | Ejecutar cualquier script que inicialice Firebase Admin, por ejemplo `node scripts/audit-costs.mjs`. |
| **Acción humana mínima** | Proveer archivo `.env` local o exportar las variables. En producción deben estar en Vercel Dashboard. |
| **Prueba post-desbloqueo** | Script lee `noticias`, `traffic_log`, `nios_daily_snapshots` y devuelve conteos reales. |

---

## 5. FIREBASE CONSOLE — TTL E ÍNDICES

| Campo | Detalle |
|---|---|
| **Qué falta** | Acceso al Firebase Console con permisos de administrador. |
| **Por qué es necesario** | Para configurar políticas TTL reales en `traffic_log` y `nios_telemetry` y verificar índices existentes. |
| **Qué está preparado** | El campo `expiresAt` ya se escribe en `nios_telemetry` y `nios_audit_trail`. `firestore.rules` define colecciones. |
| **Comando exacto** | No hay CLI directo para TTL. Se requiere acceso web: `https://console.firebase.google.com/project/{projectId}/firestore/databases/-default-/documents`. |
| **Acción humana mínima** | Acceder al Firebase Console, ir a Firestore Database → Indexes / TTL policies, crear políticas TTL para los caminos documentados. |
| **Prueba post-desbloqueo** | Documento con captura de pantalla de la política TTL configurada y script de prueba de expiración. |

---

## 6. CORE WEB VITALS Y PERFORMANCE REAL

| Campo | Detalle |
|---|---|
| **Qué falta** | URL de producción y acceso a Lighthouse / Vercel Speed Insights. |
| **Por qué es necesario** | Para medir TTFB, LCP, INP, CLS con datos reales de usuarios nicaragüenses. |
| **Qué está preparado** | `next.config.ts` incluye `webVitalsAttribution: ['CLS', 'LCP', 'INP', 'FCP', 'TTFB']` y `@sentry/nextjs`. |
| **Comando exacto** | `npx lighthouse https://nicaraguainformate.com --chrome-flags="--headless" --output=json` o acceder a Vercel Speed Insights. |
| **Acción humana mínima** | Desplegar en Vercel y obtener la URL de producción. |
| **Prueba post-desbloqueo** | Lighthouse report con LCP < 2.5s, CLS < 0.1 en móvil. |

---

## 7. ADSENSE READINESS — EVIDENCIA REAL

| Campo | Detalle |
|---|---|
| **Qué falta** | Datos reales de tráfico, contenido indexado y revisión manual del sitio en producción. |
| **Por qué es necesario** | Para determinar `READY`, `NOT_READY` o `INSUFFICIENT_EVIDENCE`. |
| **Qué está preparado** | `lib/nios/revenue/adsense.ts` con auditoría de políticas y `lib/nios/revenue/sustainability.ts` con análisis por categoría. |
| **Comando exacto** | `node scripts/adsense-audit-live.mjs` o `npx vitest run tests/nios-revenue.test.ts` (este último solo prueba lógica, no producción real). |
| **Acción humana mínima** | Aprobar auditoría manual del contenido y confirmar que todas las páginas legales existen (`/nosotros`, `/contacto`, `/privacidad`, `/terminos`). |
| **Prueba post-desbloqueo** | Documento `ADSENSE_READINESS_EVIDENCE.md` con evidencia real y veredicto. |

---

## RESUMEN DE DESBLOQUEOS REQUERIDOS

| # | Bloqueo | Complejidad | Acción propietaria |
|---|---|---|---|
| 1 | Vercel login + deploy | Baja | `npx vercel login` y `npx vercel --prod` |
| 2 | GSC service account | Baja | Confirmar credenciales y permiso `siteOwner` |
| 3 | GA4 service account | Baja | Confirmar permisos en property `525672447` |
| 4 | Firebase env vars | Baja | Proveer `.env` o configurar en Vercel |
| 5 | Firebase Console TTL | Media | Configurar TTL e índices manualmente |
| 6 | Lighthouse / Speed Insights | Baja | Producir URL y ejecutar Lighthouse |
| 7 | AdSense manual audit | Media | Revisión de contenido y páginas legales |

---

**Mientras estos desbloqueos están pendientes, el trabajo interno continúa: contratos, tests, auditoría de código y consolidación de NIOS v2.**
