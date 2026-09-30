# CURRENT SYSTEM TRUTH — Nicaragua Informate

> Documento canónico de cómo funciona el sistema HOY. Si el código cambia, este
> documento debe cambiar con él. Última actualización: auditoría forense final 4.0.

## 1. Flujo editorial (canónico)

```
Editor/API → guardarConMeni() → runMeniAsync() → MENI (score, QG, ADN NI)
           → detectFactualitySignals() [+ VAGUE_ATTRIBUTION]
           → analyzeTrust() → señales TRUST_*
           → makeEditorialDecision() (SUPERVISOR — única autoridad)
           → updateData canónico → Firestore `noticias`
           → runPublicationPipeline() → Telegram/FB/IndexNow/Push
           → meni_decision_log (SIEMPRE, incluso en rechazo)
```

| Etapa | Archivo | Función |
|---|---|---|
| Entrada admin | `app/api/admin/guardar-directo/route.ts`, `app/api/admin/news/route.ts`, `app/api/admin/news/[id]/route.ts`, `app/api/articles/route.ts` | POST/PUT |
| Gate editorial | `lib/editorial/guardar-con-meni.ts` | `guardarConMeni` |
| Score | `lib/meni/core.ts` | `runMeniAsync` |
| Señales factuales | `lib/editorial/factuality-signals.ts` | `detectFactualitySignals` |
| Confianza | `lib/editorial/trust.ts` | `analyzeTrust` |
| Autoridad | `lib/supervisor/editorial-supervisor.ts` | `makeEditorialDecision` |
| Bitácora | `lib/editorial/decision-log.ts` | `writeDecisionLog` → `meni_decision_log` |
| Distribución | `lib/meni/publication-pipeline.ts` → `lib/distribution/channels.ts` | `runPublicationPipeline` → senders únicos |
| Reintentos | `app/api/cron/distribuciones-retry/route.ts` | cron `*/30 * * * *` |

## 2. Autoridad editorial — reglas que NO deben revertirse

- **El Supervisor es la única autoridad.** MENI es subordinado: su score informa,
  no decide. Ninguna ruta puede sobrescribir `supervisorDecision`.
- **`PUBLICAR_CON_CAMBIOS` es aprobado** (`supervisorApproved=true`).
- `aprobadoMeni` se calcula una sola vez en MENI; las rutas no lo mutan.
- **Señales → Supervisor:** `CRITICAL` → `REVISION_HUMANA`; `IMPORTANT` →
  `INVESTIGAR_MAS`. La confianza baja nunca es bloqueo duro; es revisión.
- **Contenido canónico:** `updateData.contenido/resumen` son la única versión que
  puede persistirse; las rutas no escriben el input crudo por encima.
- `sanitizeForFirestore` preserva sentinelas `FieldValue` — no "arreglar" eso.

## 3. Seguridad / acceso

- `/api/admin/*` requiere `admin_session` cookie o `x-admin-token` =
  `ADMIN_API_KEY`, o `x-cron-secret` = `CRON_SECRET_TOKEN`/`CRON_SECRET`
  (comparación timing-safe en `middleware.ts`).
- `SENSITIVE_API_PATHS` en middleware también exige auth: `transform`,
  `revalidate`, `indexnow`, `nios`, etc.
- **Firestore:** lectura pública de `noticias` SOLO si `publicado==true`;
  `list` requiere sesión. Resto de colecciones: sin acceso público.
- `/api/support/track`: rate-limit 20/min·IP, body ≤2KB, whitelist de eventos.
- `/api/transform`: allowlist de hosts + bloqueo IPs privadas/redirects (SSRF).

## 4. Datos — retención

| Colección | Propósito | Retención actual |
|---|---|---|
| `noticias` | Contenido | Permanente |
| `meni_decision_log` | Trazabilidad de decisiones | Sin TTL (crece — evaluar 90d) |
| `traffic_log` | Analytics | `expiresAt` 30d + cron cleanup 500/día |
| `google_learning_patterns` | Aprendizaje NIOS | Sin TTL (pruner existe, no agendado) |
| `distribuciones` | Log de envíos | Permanente |
| `distribuciones_pendientes` | Cola retry | Consumidor cron; docs >7d = `legacy` |
| `support_analytics` | Métricas support widget | Sin TTL |
| `nios_memory` | Memoria NIOS | Permanente |

## 5. Comandos

```bash
npm run build          # Next.js build
npx tsc --noEmit       # typecheck
npx vitest run         # suite completa
firebase deploy --only firestore:rules   # reglas (requiere auth firebase)
```

## 6. Deploy / rollback

- Hosting: Vercel (`informate-nicaragua-nextjs`), dominio `nicaraguainformate.com`.
- Deploy: push a `master` → Vercel auto-deploy. Rollback: `git revert` + push,
  o "Redeploy" de un deployment anterior en el dashboard de Vercel.
- Reglas Firestore: `firebase deploy --only firestore:rules` (no va con Vercel).
- Crons: declarados en `vercel.json` — `DECLARED_CRONS` en
  `lib/nios/swiss-watch/board.ts` debe estar sincronizado (hay test que lo exige).
