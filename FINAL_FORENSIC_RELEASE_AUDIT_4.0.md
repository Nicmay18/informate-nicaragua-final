# FINAL FORENSIC RELEASE AUDIT — NICARAGUA INFORMATE 4.0

> Auditoría de cierre total. Evidencia real; sin promesas.
> Commits de la cadena: `b6a25aec` (Fase A) → `461a9463` (Fase B) →
> `efc493ed` (Fase B1) → commit final de esta auditoría.

## A. Estado inicial congelado

- Branch: `master` (local). Sin merge, sin push, sin deploy en esta sesión.
- HEAD pre-auditoría: `efc493ed`.
- Working tree pre-auditoría: fix de números de emergencia sin commit
  (`EmergencyWidget`, `contacto`, `limpiar-sucesos`, `panel.html`) + artefactos
  `.audit/` (evidencia forense — se conservan en el commit final).
- `b03b22aa` y `7d10f5b6`: commits históricos de distribución social; su
  contenido funcional ya está integrado en master vía `channels.ts`.

## B. Problemas encontrados y corregidos en esta auditoría

| # | Problema | Causa | Corrección | Test que lo prueba |
|---|---|---|---|---|
| F-1 | `confianza` era campo huérfano: `analyzeTrust` corría post-guardado; nadie consumía `requiereRevisionHumana` | La capa Trust se añadió como diagnóstico, nunca se integró al gate | `analyzeTrust` corre **pre-decisión** en `guardarConMeni`; `trust.factores` → señales `TRUST_*` al Supervisor; `confianza` se persiste con la decisión | `factuality-barrier.test.ts` — "confianza BAJA + 0 fuentes ya no sale con PUBLICAR limpio" |
| F-2 | Atribución vaga ("según medios locales") satisfacía `hasAttribution` y suprimía TODAS las señales — el caso real `BAJA + 0 fuentes + score 93 → PUBLICAR` | `ATTRIBUTION_RE` no distinguía fuente concreta de colectiva | Nueva señal `VAGUE_ATTRIBUTION` (IMPORTANT → `INVESTIGAR_MAS`) en `factuality-signals.ts` con `CONCRETE_INSTITUTION_RE` + `CONCRETE_NAMED_RE` (case-sensitive a propósito) | 3 tests nuevos en `factuality-barrier.test.ts` |
| F-3 | 4 senders duplicados en `publication-pipeline.ts` vs `lib/distribution/channels.ts` | El pipeline creció con implementaciones inline antes de existir `channels.ts` | `sendTelegram`/`sendFacebook`/`sendIndexNow`/`sendPush` del pipeline ahora **delegan** a `channels.ts` — una implementación por canal | TSC + suite completa |
| F-4 | Fallback Telegram foto→texto solo en 2 descripciones de error → pérdida de distribución si fallaba la foto por otro motivo | Whitelist de errores demasiado estricta | `channels.enviarTelegram`: cualquier fallo de `sendPhoto` cae a `sendMessage` | Revisión de código; comportamiento solo-mejora |
| F-5 | `DECLARED_CRONS` desincronizado de `vercel.json` (faltaba `distribuciones-retry`) | Cron añadido en Fase B1 sin actualizar el board | `board.ts` declara los 9 crons | `swiss-watch.test.ts` — 47/47 |

## C. Verificaciones de seguridad (esta sesión)

| Superficie | Resultado |
|---|---|
| `/api/admin/*` | Auth middleware OK (cookie `admin_session` o `x-admin-token`, timing-safe) |
| `/api/revalidate`, `/api/indexnow`, `/api/transform` | En `SENSITIVE_API_PATHS` → 401 sin credenciales |
| `/api/transform` SSRF | Allowlist hosts + bloqueo IPs privadas + bloqueo redirects + límite 20MB |
| `/api/l/[id]` | GET público intencional (link shortener); POST→405; writes acotados a docs existentes |
| `/api/support/track` | Hardened Fase B (rate limit, tamaño, whitelist, sanitización) |
| Firestore `noticias` | `get` público solo si `publicado==true`; `list` requiere sesión — desplegado y probado E2E con SDK anónimo |
| `panel.html` legacy | Funciona con auth Firebase — `request.auth != null` |

## D. Riesgos restantes (honestos)

| Riesgo | Severidad | Por qué queda |
|---|---|---|
| `traffic_log` (~24k docs): cleanup 500/día tarda ~48d en ponerse al día | P2 | TTL nativo Firestore requiere consola; cron app-level existe |
| `google_learning_patterns` (~15k): pruner existe pero no agendado | P2 | Decisión de datos del dueño |
| Sitemaps >2MB no entran al cache de Next (warnings de build) | P2 | Requieren reestructurar sitemap (index/sharding) — riesgoso hoy |
| Rate-limiting in-memory no es global en serverless | P2 | Requeriría Redis/Upstash — cambio de infra |
| `panel.html` legacy convive con `/panel` | P2 | `panel.html` tiene herramientas únicas; no borrar sin confirmar uso |
| Sentry: falta `onRequestError` + config deprecada | P3 | Warnings de build, no funcionales |
| 3 tests sensibles a red/carga (GSC, Firestore real, mock timing) | — | EXTERNAL_NETWORK/FLAKY clasificados; todos pasan aislados |

## E. Matriz de release

| Área | Estado | Evidencia |
|---|---|---|
| MENI | PASS_WITH_NOTES | Score fresco por evaluación; `meni_decision_log` registra incluso rechazos |
| Supervisor | PASS | Única autoridad; consume señales factuality + trust |
| Trust | PASS | Integrado pre-decisión como señales, persistido como `confianza` |
| Factuality | PASS | +VAGUE_ATTRIBUTION; el caso real ya no sale PUBLICAR limpio |
| Distribution | PASS | Un sender por canal; cola retry con consumidor; legacy clasificado |
| Telegram | PASS | `channels.enviarTelegram` único; pipeline delega; fallback foto→texto |
| Firestore | PASS | Reglas desplegadas y probadas con SDK anónimo |
| Auth | PASS | Middleware timing-safe; admin + cron cubiertos |
| Security | PASS_WITH_NOTES | Rate-limit in-memory (ver D) |
| Admin | PASS | `/panel` Next = panel principal |
| SEO | PASS_WITH_NOTES | Sitemaps funcionan pero exceden cache 2MB |
| AdSense | READY_WITH_MINOR_RECOMMENDATIONS | Páginas legales existen; falta publisher id + aprobación Google (externo) |

## F. Decisiones que NO deben revertirse

1. Supervisor como única autoridad editorial.
2. `PUBLICAR_CON_CAMBIOS` cuenta como aprobado.
3. Contenido canónico (MENI-corregido) es el único persistible.
4. `meni_decision_log` se escribe SIEMPRE — también en rechazo.
5. Un sender por canal en `lib/distribution/channels.ts`.
6. Docs de `distribuciones_pendientes` >7 días = `legacy` (nunca reintentar).
7. `sanitizeForFirestore` preserva `FieldValue`.
8. Trust/VAGUE_ATTRIBUTION = revisión (IMPORTANT), nunca bloqueo duro.

## G. Branches relevantes

- `master` ← todo el trabajo; los demás son históricos/archivo:
  `fix/social-distribution`, `fix/nios-execution-004`, `fix/vercel-runtime-errors`,
  `audit/meni-forense-2026-09`, `ops/editorial-growth-live`, `backup/home-before-restore`.
