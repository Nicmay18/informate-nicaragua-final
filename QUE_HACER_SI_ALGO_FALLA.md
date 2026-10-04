# QUÉ HACER SI ALGO FALLA — runbook

## La nota no se deja publicar

| Síntoma | Causa | Acción |
|---|---|---|
| 🟠 REVISAR | revisión editorial pendiente (no es bloqueo) | «Confirmar como Editor Jefe» o corregir el hallazgo |
| 🔴 BLOQUEAR + issue CRITICAL | defecto real (fuente faltante, integridad) | corregir el defecto; nunca bajar umbrales |
| Issue IMPORTANT aparece como "bloqueante" | (corregido) — ahora se separa por severidad | si vuelve a pasar, revisar `normalizarDiagnosticoBloqueo` en panel.html |
| "SUPERVISOR_BLOCKED" sin opción de confirmar | veredicto fue BLOQUEAR, no REVISAR | corregir el defecto real que lo causó |
| Fallo técnico (Firestore/red/auth) | error de infraestructura | reintentar; verificar ADMIN_API_KEY; ver logs Vercel |

## Una nota no aparece en el sitio

1. Verificar `estado:'publicado'` / `publicado:true` en Firestore.
2. Esperar 60-120s (ISR del home) — o forzar: `POST /api/revalidate` con secret.
3. Verificar que el slug existe y no hay typo.
4. Revisar que no quedó `noindex` por error (entidades thin sí llevan noindex por diseño).

## El resumen de las 6 a.m. no llegó

1. Verificar doc `resumenes_diarios/{fecha}` — si existe, se envió (o se forzó).
2. Si no existe: `GET /api/cron/resumen-diario?secret=<ADMIN>&force=1`.
3. Si responde "No hay noticias recientes" → hubo <30h sin artículos, o el query vuelve a estar roto (verificar `orderBy('fecha','desc')` — fue la causa real del fallo).
4. Verificar credenciales Telegram en Firestore `config/admin` o env `TG_TOKEN`/`TG_CHAT_ID`.
5. Vercel crons: dashboard → Logs → cron resumen-diario → ¿se ejecutó? ¿401? (auth) ¿500? (error)

## No se distribuyó a un canal

- **Telegram**: colección `distribuciones_envios/telegram_{slug}` — si está `failed`, el cron de retry lo reintenta; si `sent`, se envió.
- **Facebook**: `distribuciones` resultados.facebook — error 'Faltan credenciales' → configurar `FB_PAGE_ACCESS_TOKEN` + `FB_PAGE_ID`.
- **Push/Twitter**: skipped sin credenciales (mensaje claro de error).
- **WhatsApp**: es copy-paste manual — usar el texto del panel (Copy Social).

## El panel no carga / no autentica

- Verificar `ADMIN_API_KEY` en env del deploy y el token guardado en el panel.
- `app/login/page.tsx` es la puerta; `/api/admin/session` valida.

## MENI da un resultado raro

1. Reproducir con `tests/meni-lluvias-repro.test.ts` (traza señales→MENI→Supervisor→gate).
2. Verificar que el veredicto mostrado es el unificado (`EDITOR JEFE — <decisión>`), no un componente viejo.
3. Si una métrica congela (p.ej. 67% siempre) → sospechar caché o que todas las capas no evalúan el mismo cuerpo — ver F5 de AUDITORIA_FORENSE_FINAL.md.

## Un cron no corre

- Vercel: Project → Crons → ¿está listado? ¿último run?
- Auth: el cron necesita `CRON_SECRET`/`CRON_SECRET_TOKEN` o `ADMIN_API_KEY` configurados en env de producción.
- Ruta existe bajo `app/api/cron/<name>/route.ts`.

## El sitio se ve roto / caché viejo

- `POST /api/revalidate` o redeploy.
- Vercel a veces sirve ISR/CDN con `age` alto — esperar 1-2 min y hard-refresh (Ctrl+F5).
