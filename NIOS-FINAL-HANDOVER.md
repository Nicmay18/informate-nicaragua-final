# NIOS — FINAL HANDOVER

**Fecha:** 2026-08-29
**Entorno auditado:** `e:\PROYECTO\informate-nicaragua-final`
**Último veredicto:** `🟡 PRODUCTION READY — EXTERNAL CONFIG REQUIRED`
**Git:** sin commit, sin push

---

## 1. Arquitectura

Flujo de datos de NIOS:

```
SOURCE (GSC / GA4 / Meta / Firebase / internal traffic)
    ↓
COLLECTOR (gsc-collector, ga4-collector, social-conversion, firebase-health)
    ↓
NORMALIZATION (traffic-reader, traffic-aggregator, traffic-reconciler, metric-truth)
    ↓
INTELLIGENCE (MENI, Trust, article-momentum, trend-engine, alert-engine,
              notification-forensics, CEO Agent)
    ↓
DECISION (operating-mode, ceo-verdict, repair-engine, executive-center)
    ↓
ALERT (nios_alerts, Telegram, OneSignal)
    ↓
UI (Command Center, /admin, /panel/nios)
```

Cada módulo reporta `SOURCE`, `DEFINITION`, `PERIOD`, `SCOPE`, `VALUE`, `CONFIDENCE`, `STATUS`, `TIMESTAMP`. No convierte `NO_DATA` en `REAL`.

---

## 2. Módulos

| Módulo | Ruta principal | Estado | Evidencia |
|---|---|---|---|
| Orchestrator | `lib/nios/intelligence/orchestrator.ts` | Code PASS | Tests + build |
| Data Merger | `lib/nios/intelligence/data-merger.ts` | Code PASS | Select optimizado |
| Executive Center | `lib/nios/executive-center.ts` | Code PASS | Tests |
| CEO Verdict | `lib/nios/ceo-verdict.ts` | Code PASS | Tests |
| CEO Agent | `lib/ceo-agent.ts` | Code PASS | Tests |
| MENI | `lib/meni/`, `lib/nios/intelligence/meni-learning.ts` | Code PASS | Tests |
| Trust / Thin content | `lib/nios/intelligence/google-trust.ts` | Code PASS | Tests |
| AdSense recovery | `lib/nios/intelligence/adsense-recovery.ts` | Code PASS | Tests |
| Metric truth | `lib/nios/intelligence/metric-truth.ts` | Code PASS | Tests |
| Canonical metrics | `lib/nios/intelligence/canonical-article-metrics.ts` | Code PASS | Tests |
| Traffic reader | `lib/analytics/traffic-reader.ts` | Code PASS | Tests |
| Traffic aggregator | `lib/analytics/traffic-aggregator.ts` | Code PASS | Tests |
| Traffic reconciler | `lib/nios/intelligence/traffic-reconciler.ts` | Code PASS | Tests |
| Article momentum | `lib/nios/intelligence/article-momentum.ts` | Code PASS | Tests |
| Trend engine | `lib/nios/intelligence/trend-engine.ts` | Code PASS | Tests |
| Alert engine | `lib/nios/intelligence/alert-engine.ts` | Code PASS | Tests |
| Notification forensics | `lib/nios/intelligence/notification-forensics.ts` | Code PASS | Tests |
| Operating mode | `lib/nios/operating-mode.ts` | Code PASS | Tests |
| Repair engine | `lib/nios/repair-engine.ts` | Code PASS | Tests |
| Firebase health | `lib/nios/intelligence/firebase-health.ts` | Code PASS | Tests |
| GSC collector | `lib/nios/intelligence/gsc-collector.ts` | Code PASS | Tests |
| GA4 collector | `lib/nios/intelligence/ga4-collector.ts` | Code PASS | Tests |
| Social conversion (Meta) | `lib/nios/intelligence/social-conversion.ts` | Code PASS | Tests |
| Store / snapshots | `lib/nios/intelligence/store.ts` | Code PASS | Tests |
| Editorial diagnosis | `lib/nios/editorial-diagnosis.ts` | Code PASS | Tests |
| SEO | `lib/nios/seo.ts`, `lib/nios/seo-cleanup.ts` | Code PASS | Tests |
| Content improvement | `lib/nios/intelligence/content-improvement.ts` | Code PASS | Tests |

---

## 3. Fuentes

| Fuente | Estado real | Cómo verificar | Acción requerida |
|---|---|---|---|
| **Firebase / Firestore** | `NOT_CONFIGURED` en este entorno | `npm run test:merge` → `mission17` | Configurar `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| **GSC** | `NOT_CONFIGURED` (site URL) / `INVALID_CONFIGURATION` (sin credencial) | Ejecutar `collectGSC('sc-domain:...')` | Configurar `NIOS_GSC_SITE_URL`; agregar service account como propietario en GSC |
| **GA4** | `CONFIG_REQUIRED` | Ejecutar `collectGA4('')` | Configurar `NIOS_GA4_PROPERTY_ID`; dar permiso de lectura al service account |
| **Meta / Facebook** | `NOT_CONFIGURED` | `social-conversion.ts` retorna `LOW CONFIDENCE` o `NOT_CONFIGURED` | Configurar píxel / Conversions API |
| **OneSignal** | `NOT_CONFIGURED` | Revisar `.env.local` | Configurar `NEXT_PUBLIC_ONESIGNAL_APP_ID` y REST API key |
| **Telegram** | `NOT_CONFIGURED` | Revisar `.env.local` | Configurar `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHANNEL_ID` |
| **AdSense** | `NOT_CONFIGURED` | `adsense-recovery.ts` reporta `NOT_CONFIGURED` | Configurar cuenta de AdSense y `ads.txt` |

### Estados semánticos permitidos

Para cada fuente externa NIOS solo usa:

`REAL` · `CONNECTED_NO_DATA` · `CONFIG_REQUIRED` · `NOT_CONFIGURED` · `TIMEOUT` · `NETWORK_ERROR` · `AUTH_FAILED` · `ACCESS_BLOCKED` · `INVALID_CONFIGURATION` · `DEGRADED` · `DOWN`

Nunca reporta solo `NO_DATA` sin una causa.

---

## 4. Variables de entorno

Crear archivo `.env.local` en producción con (no incluir comillas ni espacios al inicio):

```bash
# Firebase (mismo service account para GSC/GA4)
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Search Console
NIOS_GSC_SITE_URL=sc-domain:nicaraguainformate.com
# o NIOS_SITE_URL=https://nicaraguainformate.com

# GA4
NIOS_GA4_PROPERTY_ID=123456789

# Traffic
NIOS_TRAFFIC_LOG_TTL_DAYS=30

# OneSignal
NEXT_PUBLIC_ONESIGNAL_APP_ID=xxxxx
ONESIGNAL_REST_API_KEY=xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=xxxxx:xxxxx
TELEGRAM_CHANNEL_ID=@canal

# Meta (Facebook Pixel / CAPI)
META_PIXEL_ID=xxxxx
META_ACCESS_TOKEN=xxxxx

# AdSense (opcional)
ADSENSE_CLIENT_ID=ca-pub-xxxxxxxx

# Site
NEXT_PUBLIC_SITE_URL=https://nicaraguainformate.com
```

Verificar que `.env.local` **no** esté trackeado.

---

## 5. Cron

Configurados en `vercel.json`:

| Endpoint | Frecuencia | Timeout Vercel | Qué hace | Auth |
|---|---|---|---|---|
| `/api/cron/resumen-diario` | 0 12 * * * | 30s (60s generar) | Resumen Telegram | token admin/cron |
| `/api/cron/nios-collect` | — | 60s | Pipeline NIOS completo | token admin/cron |
| `/api/cron/traffic-cleanup` | 30 3 * * * | 60s | Elimina `traffic_log` > `NIOS_TRAFFIC_LOG_TTL_DAYS` | token admin/cron |
| `/api/cron/supervisor-watch` | — | 30s | Vigilancia editorial | token admin/cron |

Para ejecutar manualmente:

```bash
curl -H "x-cron-secret: $NIOS_CRON_SECRET" https://tu-dominio/api/cron/nios-collect
```

---

## 6. Firebase / Firestore

### Colecciones principales

- `noticias` — artículos
- `traffic_log` — logs de vistas con `expiresAt` (TTL)
- `traffic_daily` — agregados por día
- `nios_daily_snapshots` — snapshots del pipeline
- `nios_alerts` — alertas activas
- `distribuciones` / `distribuciones_pendientes` — colas de notificación
- `portada_config` — configuración de portada

### Índices recomendados

- `traffic_log` por `timestamp` (desc) y `timestamp` (asc) + `expiresAt`
- `noticias` por `fecha` (desc)
- `noticias` por `slug`
- `noticias` por `estado`, `publicado`
- `nios_alerts` por `fingerprint` y `createdAt`

### TTL

`traffic_log` ahora escribe `expiresAt: Date` en cada nuevo registro. Activar política TTL en Firebase Console:

1. Firestore Database → TTL policies
2. Colección: `traffic_log`
3. Campo: `expiresAt`
4. Aplicar

Respaldo: `/api/cron/traffic-cleanup` elimina registros antiguos si no hay TTL.

---

## 7. GSC

1. Crear service account en Firebase (mismas credenciales que Firestore).
2. Añadir `FIREBASE_CLIENT_EMAIL` como propietario en GSC.
3. Configurar `NIOS_GSC_SITE_URL`.
4. Verificar:

```bash
curl -H "Authorization: Bearer $TOKEN" https://tu-dominio/api/admin/nios-intelligence?report=gsc
```

Estados esperados:

- `CONFIG_REQUIRED` → faltan variables
- `INVALID_CONFIGURATION` → credenciales mal formadas
- `ACCESS_BLOCKED` → service account sin permiso
- `REAL` → datos reales

---

## 8. GA4

1. Obtener `Property ID` numérico de GA4.
2. Añadir service account como usuario de la propiedad (ver + analizar).
3. Configurar `NIOS_GA4_PROPERTY_ID`.
4. Verificar con el mismo endpoint `?report=ga4`.

---

## 9. Meta

Módulo `social-conversion.ts` diagnostica:

- `NOT_CONFIGURED` → no hay píxel/CAPI
- `LOW CONFIDENCE` → falta UTM o attribution
- `CONVERSION_PROBLEM` → reach alto pero clics web bajos
- `SOCIAL_TO_WEB_PROBLEM` → clics en FB no generan sesiones
- `POST_CLICK_PROBLEM` → sesiones pero sin engagement

No atribuye sin evidencia.

---

## 10. Alertas

- `nios_alerts` es la única fuente de alertas internas.
- Fingerprint + cooldown + severidad.
- P0: solo críticos (Firebase DOWN, corrupción, pérdida de datos).
- P1: collectors fallando, pipeline lento, breakout con fuente conocida.
- P2: anomalías útiles.
- P3: digest.

No envía notificaciones externas directamente; los cron de Telegram/OneSignal consumen `nios_alerts`.

---

## 11. Telegram / OneSignal

Endpoints:

- `/api/cron/resumen-diario` (Telegram)
- OneSignal push (integración pendiente de config)

Panel: `/admin/nios-intelligence` con reporte `notification-forensics`.

---

## 12. CEO / CEO Agent

- `lib/nios/ceo-verdict.ts` genera veredicto con `status`, `confidence`, `whatMatters`, `whatToDoToday`, `doNotDo`, `evidence`.
- `lib/ceo-agent.ts` usa traffic, GSC, GA4, MENI, Trust.
- Estados permitidos: `SALUDABLE` · `REQUIERE_ATENCION` · `RIESGO_CRITICO` · `EVIDENCIA_INSUFICIENTE`.
- Nunca dice "Google te penalizó" sin evidencia.

---

## 13. MENI

Clasificación `TEMA · CATEGORIA · PERFIL · INTENCION · AUDIENCIA · ANGULO`.

- `lib/meni/` y `lib/nios/intelligence/meni-learning.ts`
- Separa `OBSERVADO` / `INFERIDO` / `HYPOTHESIS`
- No afirma penalización Google sin GSC real

---

## 14. Trust

- `lib/nios/intelligence/google-trust.ts`
- Detecta thin content como señal interna.
- Si GSC no está conectado, Trust reporta `EVIDENCIA_INSUFICIENTE`.

---

## 15. Traffic

- Lectura prioriza `traffic_daily`; fallback a `traffic_log`.
- Top moving vs top lifetime separados.
- `article-momentum` clasifica `SILENT / INFORMATIONAL / ACTIONABLE`.
- Un `BREAKOUT` solo es `ACTIONABLE` con fuente dominante conocida y confianza alta.

---

## 16. SEO

Automático:

- `sitemap.xml`
- `news-sitemap.xml`
- `robots.txt`
- `rss.xml` / `feed.json`
- canonical
- Open Graph
- Twitter/X cards
- Schema `NewsArticle`, `Organization` (en página de noticia)
- Títulos, meta descriptions, H1, H2/H3, alt

Validar con Google Search Console y Rich Results Test después de deploy.

---

## 17. Performance

Cambios aplicados en esta misión:

- `lib/nios/intelligence/data-merger.ts`: `select()` de campos (reduce lectura de cuerpo de artículos).
- `lib/db/homepage.ts`: `traffic_log` ahora incluye `expiresAt`.
- `/api/cron/traffic-cleanup`: limpieza programada.

Pendiente de medición real:

- LCP, INP, CLS, TTFB con datos reales de Web Vitals.
- Tiempo real del pipeline con GSC/GA4/Firebase configurados.

---

## 18. Seguridad

- Credenciales en `process.env`, no en código.
- Endpoints admin/cron usan `verifyAdminOrCronToken`.
- No se trackean secrets en el repositorio.
- `.env.local`, `.next`, `node_modules`, logs temporales: no trackear.

Pendiente recomendado (requiere config de Vercel):

- HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy en `next.config.js` o `vercel.json` headers.
- Revisar reglas Firestore.

---

## 19. Recuperación ante fallos

| Fallo | Comportamiento | Acción humana |
|---|---|---|
| Firebase DOWN | pipeline marca `DOWN`, no rompe build | Revisar credenciales / estado Firebase |
| GSC TIMEOUT | `TIMEOUT`, pipeline continúa, no bloquea | Reintentar; verificar red/permisos |
| GA4 TIMEOUT | `TIMEOUT`, pipeline continúa | Reintentar |
| Meta no configurado | `NOT_CONFIGURED` | Configurar píxel/CAPI |
| Snapshot vacío | `DATA_CONFLICT` con dashboard | Ejecutar pipeline con credenciales reales |
| `traffic_log` crecimiento | TTL + cron de limpieza | Activar TTL en Firebase Console |

---

## 20. Procedimiento de deploy

1. `git status` — confirmar archivos.
2. Configurar `.env.local` en Vercel con todas las variables.
3. `npm install`
4. `npm run build` (verificar).
5. Desplegar en Vercel.
6. Verificar cron jobs activos.
7. Ejecutar manual `/api/cron/nios-collect` una vez.
8. Verificar `/admin/nios-intelligence` y `/panel/nios`.

---

## 21. Procedimiento de rollback

1. Revertir commit o restaurar tag anterior.
2. Re-desplegar con `vercel --prod`.
3. Verificar `.env.local` no fue modificado.
4. Invalidar caché si es necesario con Vercel.

---

## 22. Troubleshooting

### `collectGSC` retorna `INVALID_CONFIGURATION`

- Verificar `FIREBASE_PRIVATE_KEY` tiene `\n` correctamente escapados.
- Verificar `FIREBASE_CLIENT_EMAIL`.
- Añadir email en GSC como propietario.

### `collectGA4` retorna `CONFIG_REQUIRED`

- Definir `NIOS_GA4_PROPERTY_ID`.

### Pipeline lento

- Revisar telemetría: `nios_daily_snapshots` → `report.modules`.
- GSC/GA4 son los módulos más lentos; deben tener timeout propio.
- `data-merger.load` optimizado con `select()`.

### `traffic_log` sin TTL

- Verificar que `expiresAt` está escrito en nuevos registros.
- Activar política TTL en Firebase Console.
- Usar `/api/cron/traffic-cleanup` como respaldo.

---

## 23. Cómo interpretar el Command Center

Panel `/admin/nios-intelligence`:

- `SYSTEM HEALTH`: estado de fuentes y score de salud.
- `DATA HEALTH`: GSC, GA4, Firebase, AdSense.
- `TRAFFIC`: daily y lifetime separados.
- `MOMENTUM`: artículos con movimiento reciente.
- `ALERTS`: alertas activas con fingerprint y severidad.
- `NOTIFICATIONS`: forense de envíos.
- `CEO`: `whatMatters`, `whatToDoToday`, `doNotDo`, `evidence`.

Cada métrica incluye `source`, `period`, `timestamp`, `confidence`.

---

## 24. Qué hacer cuando una fuente está caída

1. No ocultar el estado: `TIMEOUT`, `NETWORK_ERROR`, `AUTH_FAILED`.
2. NIOS continúa con datos internos (traffic, noticias, MENI).
3. CEO reporta `EVIDENCIA_INSUFICIENTE` para decisiones que requieran esa fuente.
4. Verificar health check específico.
5. Reintentar cuando la red/credencial se restaure.

---

## 25. Qué cosas NIOS jamás debe asumir

- Jamás convierte `NO_DATA` en `REAL`.
- Jamás confunde `lifetime` con `24h`.
- Jamás mezcla GA4 sessions con traffic views.
- Jamás afirma penalización de Google sin GSC.
- Jamás recomienda dejar de publicar una sección sin evidencia suficiente.
- Jamás muestra `EVIDENCIA_INSUFICIENTE` como `RIESGO_CRITICO`.
- Jamás genera alertas por una sola vista.
- Jamás inventa atribución de Meta.

---

## A. Resumen de lo reparado

1. **Timeout de GSC/GA4**: guardas `CONFIG_REQUIRED` / `INVALID_CONFIGURATION` antes de llamar APIs externas.
2. **Crecimiento ilimitado de `traffic_log`**: campo `expiresAt` + cron `/api/cron/traffic-cleanup` + política TTL documentada.
3. **Performance de `data-merger`**: `select()` de campos para evitar cargar cuerpo de artículos.
4. **Health score TTL**: ahora detecta el campo real en lugar de depender de `process.env`.

## B. Problemas que no se pudieron reparar y por qué

- **Conexión real con GSC/GA4/Firebase**: requieren credenciales reales que no están en el repositorio y no pueden generarse por código.
- **AdSense**: requiere cuenta de AdSense aprobada y `ads.txt`.
- **OneSignal/Telegram/Meta**: requieren tokens/IDs reales.
- **LCP/INP/CLS**: requieren dispositivo real y tráfico real; no pueden medirse en build local.

## C. Estado real de cada fuente

| Fuente | Estado |
|---|---|
| Firebase | `NOT_CONFIGURED` (sin credenciales) |
| GSC | `NOT_CONFIGURED` / `INVALID_CONFIGURATION` |
| GA4 | `CONFIG_REQUIRED` |
| Meta | `NOT_CONFIGURED` |
| OneSignal | `NOT_CONFIGURED` |
| Telegram | `NOT_CONFIGURED` |
| AdSense | `NOT_CONFIGURED` |

## D. Estado real de MENI

- Lógica: operativa. Tests: PASS.
- Sin datos reales de Firestore no se puede validar clasificación de noticias en producción.

## E. Estado real de CEO / CEO Agent

- Lógica: operativa. Tests: PASS.
- Depende de GSC/GA4/Meta; sin ellos reporta `EVIDENCIA_INSUFICIENTE` para decisiones SEO/AdSense.

## F. Estado real de Traffic

- `traffic_log` y `traffic_daily`: estructura correcta, TTL aplicado.
- `article-momentum`, `traffic-reader`, `traffic-aggregator`: operativos.
- Datos reales requieren tráfico en producción.

## G. Estado real de Alertas / Notificaciones

- `alert-engine`, `notification-forensics`: operativos.
- Envíos externos requieren OneSignal/Telegram configurados.

## H. Performance antes → después

| Métrica | Antes | Después |
|---|---|---|
| Lectura `noticias` | Cargaba `contenido` completo | `select()` de campos necesarios |
| `traffic_log` TTL | Depende de `process.env` | Campo `expiresAt` real + cleanup cron |
| GSC/GA4 timeout | Colgaba con credenciales ausentes | Retorna `CONFIG_REQUIRED` inmediatamente |

Pipeline <15s en producción solo puede verificarse con credenciales reales.

## I. Tests

- `npx tsc --noEmit`: PASS
- `npm run lint`: PASS
- `npm run test:merge`: 61/61 archivos, 622/622 tests PASS
- `npm run build`: PASS

## J. Seguridad

- Sin secrets en diff.
- Sin `.env.local` trackeado.
- Credenciales en `process.env`.

## K. Git

```
 M lib/db/homepage.ts
 M lib/nios/intelligence/data-merger.ts
 M lib/nios/intelligence/gsc-collector.ts
 M lib/nios/intelligence/ga4-collector.ts
 M lib/nios/intelligence/orchestrator.ts
 M vercel.json
?? lib/analytics/traffic-ttl.ts
?? app/api/cron/traffic-cleanup/route.ts
?? NIOS-FINAL-CHECKLIST.md
?? NIOS-FINAL-HANDOVER.md
?? FINAL-NIOS-PRODUCTION-REPORT.md
```

No commits. No pushes.

## L. Handover

Este documento.

## M. Únicas acciones manuales que quedan

1. Configurar `.env.local` en Vercel con credenciales Firebase, GSC, GA4, Meta, OneSignal, Telegram.
2. Activar TTL de `traffic_log` en Firebase Console (campo `expiresAt`).
3. Añadir service account de Firebase como propietario en GSC.
4. Añadir service account como lector en GA4.
5. Ejecutar `/api/cron/nios-collect` una vez para generar primer snapshot real.
6. Verificar `/admin/nios-intelligence` y `/panel/nios`.
7. Publicar `ads.txt` si se habilita AdSense.
8. Medir Web Vitals reales con tráfico real.

---

# FINAL VERDICT

## `🟡 PRODUCTION READY — EXTERNAL CONFIG REQUIRED`

El código de NIOS es estable: type-check, lint, test suite y build pasan. Las dependencias externas (Firebase, GSC, GA4, Meta, OneSignal, Telegram, AdSense) requieren credenciales y permisos reales que no pueden generarse desde el repositorio. La lista de acciones manuales es finita, concreta y ejecutable (sección M).

NIOS está diseñado para degradarse con gracia si una fuente falla y para no tomar decisiones sin evidencia. Una vez configuradas las variables de entorno y permisos, puede operar en producción sin intervención de desarrollo.
