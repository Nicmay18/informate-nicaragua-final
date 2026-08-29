# FINAL — Nicaragua Informate Checklist

Criterio: marcar `[x]` solo lo verificado con evidencia. No marcar por expectativa.

## Código y build

- [x] `npm run type-check` pasa sin errores
- [x] `npm run lint` pasa sin advertencias
- [x] `npm run test:merge` pasa (type-check + 61/61 test files + lint)
- [x] `npm run build` pasa (producción exitoso)

## Arquitectura y dependencias

- [x] Inventario completo del repositorio realizado
- [ ] Mapa de dependencias actualizado (usar `NIOS-FINAL-HANDOVER.md`)

## Firebase / Firestore

- [x] `traffic_log` escribe `expiresAt` en cada registro
- [x] Reglas de Firestore actualizadas para `traffic_log` y `traffic_daily`
- [x] `firestore.indexes.json` incluye índices para `traffic_log` (timestamp, expiresAt)
- [ ] TTL de `traffic_log` activado en Firebase Console (manual)
- [ ] Credenciales de Firebase configuradas en `.env.local`

## Vercel / Cron

- [x] `vercel.json` registra `/api/cron/nios-collect`
- [x] `vercel.json` registra `/api/cron/supervisor-watch`
- [x] `vercel.json` registra `/api/cron/resumen-diario`
- [x] `vercel.json` registra `/api/cron/traffic-cleanup`
- [ ] Variables de entorno configuradas en Vercel

## SEO

- [x] `sitemap.xml` y `news-sitemap.xml` presentes
- [x] `robots.ts` presente
- [x] `rss.xml` y `feed.json` presentes
- [x] Schema `NewsArticle`, `Organization`, `BreadcrumbList` implementados
- [x] Canonical y Open Graph presentes
- [ ] Validación real con Google Rich Results Test (requiere deploy)

## Seguridad

- [x] No secrets hardcodeados en el diff
- [ ] `.env.local` no trackeado
- [x] `newsletter_subscribers` ya no permite update/delete a cualquier usuario autenticado
- [x] Headers de seguridad (HSTS, CSP, X-Frame, Referrer, Permissions) en `next.config.ts`
- [ ] CSP explícita sin `'unsafe-inline'` (evaluación real)

## Performance

- [x] `data-merger` optimizado con `select()`
- [x] Imágenes con `sharp` y loader personalizado
- [x] `removeConsole` activo en producción
- [ ] LCP, INP, CLS, TTFB medidos con tráfico real

## UX / Mobile

- [x] `viewport` configurado
- [ ] Auditoría manual de 15 artículos en móvil (no automatizable sin deploy)
- [ ] Sin overflow horizontal, botones >=44px, fuentes legibles

## NIOS / Inteligencia

- [x] GSC/GA4 retornan `CONFIG_REQUIRED` si faltan credenciales
- [x] `traffic_log` TTL implementado y limpieza automatizada
- [x] Article momentum distingue `SILENT / INFORMATIONAL / ACTIONABLE`
- [x] Alert engine con deduplicación, cooldown, fingerprint
- [x] `ceo-verdict` no inventa datos de Google
- [ ] Datos reales de GSC/GA4/Firebase (requiere credenciales)

## Fuentes externas

- [ ] Firebase: `NOT_CONFIGURED` → configurar `.env.local`
- [ ] GSC: `NOT_CONFIGURED` → agregar service account como propietario
- [ ] GA4: `CONFIG_REQUIRED` → configurar `NIOS_GA4_PROPERTY_ID`
- [ ] Meta/OneSignal/Telegram: `NOT_CONFIGURED` → tokens reales
- [ ] AdSense: `NOT_CONFIGURED` → cuenta aprobada y `ads.txt`

## Lenguaje y semántica

- [x] Textos de `Google penaliza` / `AdSense rechazó` convertidos a riesgo interno
- [x] `readiness.ts` no asume rechazo de Google
- [x] `adsense-recovery.ts` no afirma rechazo oficial
- [x] `editor-ceo-report.ts` distingue thin content interno

## Git

- [ ] `git status` revisado
- [ ] `git diff` revisado
- [ ] Sin archivos temporales, logs o secrets trackeados
- [ ] No commit/push sin autorización

## Documentación

- [ ] `FINAL-NICARAGUA-INFORMATE-HANDOVER.md` creado
- [x] `FINAL-NICARAGUA-INFORMATE-CHECKLIST.md` creado

## Última validación

- Fecha: 2026-08-29
- `test:merge`: 622/622 PASS
- `type-check`: PASS
- `lint`: PASS
- `build`: ver `FINAL-NICARAGUA-INFORMATE-HANDOVER.md`
