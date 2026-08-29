# NIOS — FINAL CHECKLIST

## Criterio de terminación

Marcar con `[x]` solo lo que se ha verificado con evidencia. No marcar por expectativa.

### Calidad de código

- [x] `npx tsc --noEmit` pasa sin errores
- [x] `npm run lint` pasa sin advertencias
- [x] `npm run test:merge` pasa (61/61 archivos, 622/622 tests)
- [x] `npm run build` pasa (build de producción exitoso)

### Arquitectura y datos

- [x] `traffic_log` escribe campo `expiresAt` en cada registro (TTL)
- [x] Existe endpoint `/api/cron/traffic-cleanup` para limpieza programada
- [x] `vercel.json` incluye cron de limpieza
- [x] `data-merger.load` usa `select()` para leer solo campos necesarios
- [x] `firebase-health.ts` detecta `CREDENTIALS_MISSING`, `AUTH_FAILED`, `READ_FAILED`
- [ ] Firebase/Firestore conectado con datos reales (requiere `.env.local`)
- [ ] GSC conectado y retornando `REAL` (requiere service account + propiedad)
- [ ] GA4 conectado y retornando `REAL` (requiere property ID + service account)
- [ ] Meta/OneSignal/Telegram configurados y operativos

### Fuentes externas — estados semánticos correctos

- [x] GSC distingue `REAL` / `CONFIG_REQUIRED` / `INVALID_CONFIGURATION` / `ACCESS_BLOCKED` / `TIMEOUT` / `NETWORK_ERROR`
- [x] GA4 distingue `REAL` / `CONFIG_REQUIRED` / `INVALID_CONFIGURATION` / `ACCESS_BLOCKED` / `TIMEOUT` / `NETWORK_ERROR`
- [ ] Meta (Facebook) entrega `REAL` o `NOT_CONFIGURED` sin inventar atribución

### Inteligencia

- [x] MENI implementado y probado
- [x] Article momentum (SILENT / INFORMATIONAL / ACTIONABLE) implementado
- [x] Alert engine con deduplicación, cooldown, fingerprint
- [x] Notification forensics (INTERNAL / EXTERNAL / UNKNOWN)
- [x] CEO / CEO Agent con veredicto estructurado
- [x] Operating mode (HEALTHY / DEGRADED / BLOCKED / WAITING_HUMAN)
- [x] Metric truth y canonical metrics implementados
- [x] Trust / thin content separa OBSERVADO / INFERIDO / HIPOTESIS

### Seguridad

- [x] No secrets hardcodeados en el diff
- [x] `.env.local` no trackeado
- [x] Credenciales leídas desde `process.env`
- [ ] Headers de seguridad revisados en Vercel / Next.js
- [ ] CSP, HSTS, X-Frame-Options configurados

### Performance

- [x] `data-merger` optimizado con select
- [x] `traffic_log` TTL implementado
- [ ] Pipeline <15s en producción con credenciales reales
- [ ] LCP <2.5s, INP <200ms, CLS <0.1, TTFB <600ms (requiere device real)

### SEO

- [x] Sitemap y RSS generados
- [x] Robots.txt, canonical, Open Graph presentes
- [ ] Schema.org NewsArticle validado con datos reales
- [ ] Lighthouse/Mobile scores >90

### Documentación

- [x] `NIOS-FINAL-HANDOVER.md` creado
- [x] `NIOS-FINAL-CHECKLIST.md` creado

### Git

- [ ] `git status` revisado
- [ ] `git diff` revisado
- [ ] Sin `.env.local`, secrets, logs, `.next` o `node_modules` trackeados
- [ ] No commits/push ejecutados sin autorización

## Última actualización

- Fecha: 2026-08-29
- Commit: no ejecutado
- Tests: 622/622 PASS
- Lint: PASS
- Type-check: PASS
- Build: ver `NIOS-FINAL-HANDOVER.md`
