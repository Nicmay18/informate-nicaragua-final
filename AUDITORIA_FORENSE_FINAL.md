# AUDITORÍA FORENSE FINAL — Nicaragua Informate
Fecha: 2026-10 · Evidencia: código + producción + tests reproducidos

## 1. CLASIFICACIÓN DE SUBSISTEMAS

| Subsistema | Estado | Evidencia |
|---|---|---|
| **Next.js App Router** (app/) | ACTIVE | Producción sirve todas las rutas |
| **MENI core** (lib/meni/) | ACTIVE | runMeni llamado por guardar-directo + evaluar; 152 archivos, pipeline brain→DNA→QG→diagnostics→supervisor |
| **Editorial** (lib/editorial/) | ACTIVE | factuality-signals, trust, extractor, profiles — llamados en el flujo de guardado |
| **Supervisor** (lib/supervisor/ + lib/meni/supervisor) | ACTIVE | veredicto final PUBLICAR/REVISAR/BLOQUEAR |
| **Quality Gate** (lib/meni/quality-gate/) | ACTIVE | métricas dentro de runMeni |
| **Distribución** (lib/distribution/, /api/admin/distribuir) | ACTIVE | telegram sender endurecido, FB sender, idempotencia distribuciones_envios |
| **NIOS** (lib/nios/ — 143 archivos) | ACTIVE/MEMORY mixto | crons nios-collect + nios-ceo-loop activos; partes MEMORY (growth, mission-center con pocos callers) |
| **Departamento Central** (lib/departamento-central/) | ACTIVE | 3 crons + heartbeat/recordCronHeartbeat usado por resumen-diario |
| **Panel admin** (public/panel.html — ~9k líneas) | ACTIVE | usa 38 endpoints; override REVISAR implementado |
| **Analytics** (/api/admin/traffic, metricas, NIOS collectors) | ACTIVE | panel + crons |
| **Caché/revalidación** (unstable_cache, ISR, /api/revalidate) | ACTIVE | producción |
| **AdSense** | ACTIVE | ads.txt pub-4115…, componentes de slots |
| **Firestire** | ACTIVE | noticias, distribuciones, distribuciones_envios, resumenes_diarios, config |

## 2. MAPA DE RUTAS API (114 rutas)

| Clasificación | Nº | Detalle |
|---|---|---|
| CRON (vercel.json) | 10 | nios-collect, resumen-diario, departamento-central/-daily/-watchdog, nios-ceo-loop, supervisor-watch, traffic-cleanup, distribuciones-retry, meni-learning-cycle |
| PANEL | 31 | guardar-directo, analizar, meni/evaluar, distribuir, copy-social, config, traffic, metricas, upload-image, session… |
| PÚBLICA | 5 | /api/articles, /api/rss, /api/feed-xml, /api/top-noticias, /api/admin/clean-backlog* |
| INTERNA | 16 | llamadas por componentes (Header, EconomicBar, WeatherWidget…) u otras rutas |
| SIN REFERENCIA (verificar) | 52 | ver §4 |

\* `/api/admin/clean-backlog` marcada pública solo por match de nombre — revisar auth.

## 3. HALLAZGOS CONFIRMADOS (con corrección aplicada)

### F1 — Cron 6 a.m. (resumen-diario) — CAUSA REAL
`app/api/cron/resumen-diario/route.ts` leía `db.collection('noticias').limit(120)` **sin orderBy** → Firestore devuelve los primeros 120 docs por orden de inserción (los más viejos). Con 400+ artículos, ninguno caía en 30h → `skipped: 'No hay noticias recientes'` permanente. **No era auth ni schedule** — era la query.
✅ Fix: `orderBy('fecha','desc').limit(120)` aplicado.

### F2 — Nota lluvias — cadena real reproducida en test
`tests/meni-lluvias-repro.test.ts` (queda como regresión):
- MENI: `aprobado:true`, score 90, `PUBLICAR_CON_CAMBIOS`, 0 bloqueantes
- Supervisor: `INVESTIGAR_MAS` por `NO_ATTRIBUTION` — la nota reporta "14 viviendas afectadas" sin nombrar ninguna fuente. **Revisión legítima, no falso positivo**
- Compuerta: `SUPERVISOR_BLOCKED` + `needsEditorConfirm` → el panel ya ofrece «Confirmar como Editor Jefe» (`confirmarPublicacionEditor`, panel.html:7009)
- **Defecto real**: `normalizarDiagnosticoBloqueo` aplanaba TODOS los issues del Supervisor en `blockingIssues` → se mostraban bajo "🔴 BLOQUEANTES" aunque fuesen IMPORTANT/WARNING.
✅ Fix: separación por severidad (CRITICAL→bloqueantes, IMPORTANT/WARNING→advertencias, resto→recomendaciones).

### F3 — Distribución por canal — textos débiles
`lib/distribution.ts` generaba textos casi idénticos por canal ("Leer más:", "👉 url"). El envío automático real usa senders endurecidos (telegram.ts con caption propio, channels.ts para FB) — esos están bien.
✅ Fix: `generateDistribution` ahora produce voz editorial por canal (FB=hook+CTA engagement, WA=formato comunidad, newsletter=HTML jerárquico, push=alerta ≤90c). Determinista, nunca inventa.

### F4 — Contrato keywords panel↔API
El panel envía `keywords`; `guardar-directo` lee `body.palabrasClave || []` → "No se definieron keywords" falso positivo en algunas notas. El extractor ya acepta ambos; la ruta no normalizaba. **Verificar y normalizar en la ruta** (pendiente FASE 3).

### F5 — Métricas Originalidad/Diferencia/Transcripción (de auditoría anterior, ya corregido)
- `sourceOfTruth.originalidad` venía de Editorial Difference (mislabeling)
- Quality Gate no recibía `fuenteOriginal` → transcripción real no medida
- DNA transcription caía a fallback de Editorial Difference
**Verificado en código** — quedó la mejora aplicada en sesiones previas; el test lluvias muestra `transc:100` (sin fuente = no-transcribida por diseño).

## 4. CANDIDATOS A DEAD — REQUIEREN VERIFICACIÓN ANTES DE BORRAR

52 rutas sin referrer en código. NO borrar automáticamente:

| Ruta | Probable estado | Razón |
|---|---|---|
| /api/l/[id] | ACTIVE | shortlinks en mensajes distribuidos (caller externo) |
| /api/telegram, /api/whatsapp, /api/facebook | ACTIVE? | webhooks externos |
| /api/onesignal-sw | ACTIVE | service worker push |
| /api/indexnow | LEGACY | canal indexación alternativo |
| /api/admin/kb-backfill, repair-fechas, redistribuir-autores, rescribir-sucesos | SUPPORT | herramientas one-off de mantenimiento |
| /api/admin/meni-learning, /api/admin/meni/registry*, /api/admin/meni/arquitectura | EXPERIMENTAL? | dashboards MENI alternos |
| /api/nios/brief, /api/nios/growth, /api/nios/journey, /api/nios/lifecycle, /api/nios/swiss-watch | EXPERIMENTAL/MEMORY | endpoints NIOS sin UI |
| /api/transform, /api/expandir-7, /api/auditor-wordcount, /api/check-content, /api/count-news, /api/list-empty, /api/listar-categoria, /api/entity, /api/panel, /api/radio-proxy | LEGACY? | utilidades sueltas |
| /api/admin/auditor-*, auditoria-taxonomia, ceo-agent/*, departamento/*, health, linkedin, medium, nota-trust, portada-intel, push-notificar, research, social-conversion, stats, story, trafico, twitter, watch, whatsapp | VERIFICAR | mezcla de tools internos y experimentos |
| /api/webhooks/departamento | ACTIVE? | webhook interno dept-central |

### Directorios raíz (clasificación)
| Dir | Estado | Nota |
|---|---|---|
| appx/ | LEGACY — candidato a archivo | ¿duplicado de app/? verificar |
| articulos-generados/, articulos-seo/, revisadas/ | MEMORY | outputs históricos |
| meni-output/ | MEMORY | salidas de evaluaciones |
| reports/, docs/ (auditorías viejas) | MEMORY | ~20 docs de auditorías históricas — conservar pero separar de docs operativos |
| scripts/ | SUPPORT | mantenimiento one-off |
| test-results/, playwright-report/ | DEAD-candidate | artefactos de CI regenerables |
| assets/, content/, data/, locales/, policies/, types/, utils/, browser/, bigquery/, bin/ | VERIFICAR | mezcla memory/support/dead |
| .audit/, .agents/, .devin/ | SUPPORT | configs de agente |

## 5. LO QUE FUNCIONA BIEN (no tocar)
- Cadena MENI→Supervisor→Editor Jefe con override REVISAR — correcta por diseño
- Idempotencia distribución (claim atómico distribuciones_envios)
- Idempotencia resumen-diario (doc por día)
- Escape HTML Telegram + resumen con fallback determinista
- recordCronHeartbeat → observabilidad de crons
- Severidades unificadas en editorialVerdict.hallazgos (BLOCKER/WARNING/RECOMMENDATION/INFO con badges correctos)

## 6. DEUDAS REALES (prioridad)
1. 52 rutas sin referrer → verificar cada una vs logs/externals antes de borrar (FASE 2)
2. appx/ y duplicaciones por confirmar (FASE 2)
3. keywords panel→route (FASE 3, §F4)
4. Costos: 10 crons diarios + NIOS 143 archivos + analytics — medir invocaciones/reads reales (FASE 6)
5. Docs históricos en raíz confunden — separar operativos de auditorías viejas (FASE 2)

## 7. DOCTRINA CONFIRMADA EN CÓDIGO
- `!meniOk` sin override → bloqueo duro (correcto: menores de auto-aprobación)
- `REVISAR` + `editorOverride` → publica (Editor Jefe humano decide)
- `BLOQUEAR` → nunca publica
- Recomendaciones nunca bloquean (`NO BLOQUEA PUBLICACIÓN` badge)
