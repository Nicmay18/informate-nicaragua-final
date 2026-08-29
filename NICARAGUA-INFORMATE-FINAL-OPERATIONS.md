# Nicaragua Informate — Manual de Operación Sin Desarrollador

Este documento describe cómo operar y monitorear Nicaragua Informate una vez entregado, sin intervención de desarrollo.

## 1. Diario

### Mañana (5 min)

1. **Dashboard de calidad** (`/admin/dashboard-calidad`)
   - Verificar `scoreDominio` > 70.
   - Revisar alertas recientes.
2. **NIOS status** (`/api/admin/nios-intelligence` con `x-admin-token`)
   - Confirmar `mode` no sea `BLOCKED`.
3. **Cola de distribución** (`/api/admin/auditor-dashboard`)
   - Revisar `distribuciones_pendientes` sin crecer indefinidamente.

### Tarde (5 min)

1. **Google Search Console**
   - Verificar que no haya errores de rastreo.
2. **OneSignal**
   - Confirmar que no haya notificaciones encoladas con error.
3. **Firestore**
   - Revisar `nios_alerts`: debe haber `INFORMATIONAL`/`ACTIONABLE`, no spam.

## 2. Semanal

1. **Snapshot NIOS** (`nios_daily_snapshots`)
   - Comprobar `createdAt` reciente.
   - Comparar `snapshotCount` con dashboard.
2. **Traffic cleanup**
   - Verificar que `traffic_log` antiguo se elimina (TTL).
3. **GSC/GA4**
   - Revisar métricas reales en `/api/admin/nios-intelligence`.
4. **MENI learning**
   - Ver `meni_learning` para insights de categoría.

## 3. Si Firebase falla

1. Verificar `.env.local`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
2. Verificar `FIREBASE_DATABASE_URL` (si aplica).
3. Confirmar `firestore.rules` desplegadas.
4. Revisar cuota Firestore en consola Firebase.

## 4. Si GSC falla

1. Revisar `NIOS_GSC_SITE_URL` y `NIOS_SITE_URL`.
2. Verificar que la cuenta de servicio (`FIREBASE_CLIENT_EMAIL`) tenga permisos en GSC.
3. Revisar logs: `CONFIG_REQUIRED` → falta config; `ACCESS_BLOCKED` → falta permiso; `TIMEOUT` → red lenta.

## 5. Si GA4 falla

1. Revisar `NIOS_GA4_PROPERTY_ID`.
2. Verificar que la propiedad GA4 tenga añadida la cuenta de servicio.
3. Revisar logs: `CONFIG_REQUIRED`, `INVALID_CONFIGURATION`, `TIMEOUT`.

## 6. Si OneSignal falla

1. Revisar `ONESIGNAL_APP_ID` y `ONESIGNAL_REST_API_KEY`.
2. Verificar `NEXT_PUBLIC_ONESIGNAL_APP_ID` para el frontend.
3. Revisar logs: `skipped` indica falta config; `4xx` indica token inválido.

## 7. Si Telegram falla

1. Revisar `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.
2. Verificar que el bot sea admin del canal/grupo.
3. Revisar logs: `skipped` o `400/403`.

## 8. Si Twitter/X falla

1. Revisar `TWITTER_ACCESS_TOKEN` (OAuth 2.0).
2. Verificar permisos de escritura en Twitter Developer Portal.
3. Revisar logs: `skipped` indica token ausente.

## 9. Si el tráfico cae

1. Revisar `traffic_daily` últimos 7 días.
2. Revisar `nios_alerts` para `COLLAPSING`.
3. Revisar GSC (`gsc-collector`) por pérdida de impresiones.
4. Revisar robots y sitemap accesibles.
5. Revisar que ningún artículo tenga `noindex` accidental.

## 10. Si NIOS genera demasiadas alertas

1. Revisar `nios_alerts` con `level === 'ACTIONABLE'`.
2. Verificar `momentum` no esté basado en una sola vista.
3. Ajustar thresholds en `lib/nios/alert-engine` si es necesario (requiere deploy).

## 11. Si el pipeline supera timeout

1. `nios-collect` tiene `maxDuration` 300s.
2. `gsc-collector`/`ga4-collector` tienen timeout 15s interno.
3. Si cron supera 300s: desactivar colectores lentos o dividir en crons menores.

## 12. Credenciales que deben existir

### Obligatorias para producción básica

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CRON_SECRET`
- `NIOS_SITE_URL`

### Obligatorias para Firebase Admin

- `FIREBASE_DATABASE_URL` (si Realtime DB se usa)

### Para distribución

- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TWITTER_ACCESS_TOKEN`
- `FACEBOOK_PAGE_TOKEN`
- `FACEBOOK_PAGE_ID`

### Para inteligencia Google

- `NIOS_GSC_SITE_URL`
- `NIOS_GA4_PROPERTY_ID`

### Para monetización futura

- `GOOGLE_ADSENSE_CLIENT_ID` (aún no se usa)

## 13. Cómo saber si el sistema está sano

### Indicadores verdes

- `npm run test:merge` pasa.
- `/` carga < 3s en móvil.
- `/noticias` lista sin errores.
- `nios_daily_snapshots` actualizado en las últimas 24h.
- `distribuciones_pendientes` ≤ 10 sin retries viejos.
- `traffic_daily` crece consistente con `traffic_log`.

### Indicadores de alarma

- `test:merge` falla.
- `nios_alerts` con más de 5 `ACTIONABLE` por día.
- `distribuciones_pendientes` > 50 o con `intentos > 3`.
- `gsc-collector`/`ga4-collector` `TIMEOUT` continuamente.
- Build falla.

## 14. Comandos de verificación rápida

```bash
npm run type-check
npm run lint
npm run test:merge
npm run build
```

## 15. Quien toca qué

| Problema | Acción |
|---|---|
| Deploy | `git pull && npm i && npm run build` en Vercel |
| Credenciales | Editar `.env.local` y redeploy |
| Contenido | Panel `/admin` |
| Imágenes | Panel admin sube a `public/images/` vía GitHub API (hacer `git pull` primero) |
| Firestore rules/indexes | Desplegar desde consola Firebase o `firebase deploy` |
| Alertas NIOS | Revisar `/api/admin/nios-intelligence` |
