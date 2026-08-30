# Arquitectura de Notificaciones 24/7 — NIOS CEO v2

Sistema de alertas y verificación continua para el CEO autónomo.

## Fuentes de eventos

| Origen | Frecuencia | Ejemplo |
|--------|------------|---------|
| Vercel Cron | 08:00 UTC | `/api/cron/nios-collect` |
| Vercel Cron | cada 30 min | `/api/cron/supervisor-watch` |
| API webhooks | bajo demanda | `/api/support/track`, `/api/telemetry/journey` |
| Runtime errors | inmediata | `logger.error` en Edge/Node |

## Canales de salida

1. **Telegram** (`app/api/telegram/route.ts` o similar)
   - Ideal para alertas urgentes (`TRAFFIC_DATA_UNTRUSTED`, `CRITICAL` mode).
   - Limitar a 1 mensaje por evento y 1 resumen diario.
2. **Email** (SMTP o servicio transaccional)
   - Brief diario y cola de aprobación humana.
3. **Panel `/panel/nios`**
   - Estado del CEO, cola humana, observaciones.
4. **Firestore `nios_memory`**
   - Persistencia de decisiones y aprendizajes.

## Reglas de guardia

- Nunca exponer secretos en logs o mensajes.
- No enviar spam: 1 diario + 1 urgente por categoría.
- Confirmar `expectedImpact` antes de auto-enviar.
- `HUMAN_APPROVAL` → pausar acción destructiva hasta aprobación.

## Eventos críticos definidos

| Evento | Severidad | Canal | Acción |
|--------|-----------|-------|--------|
| `TRAFFIC_DATA_UNTRUSTED` | warning | Telegram + panel | Degradar confianza y notificar. |
| `SECURITY_TOKEN_QUERY_STRING` | warning | Email + panel | Requerir migración de cron. |
| `BUILD_FAILED` | alert | Telegram + email | Detener auto-deploy. |
| `CEO_LOOP_FAILED` | alert | Telegram + email | Abrir issue y notificar. |
| `HUMAN_APPROVAL_REQUIRED` | warning | Email + panel | Mostrar en `/panel/nios`. |

## Verificación 24/7

Ver `scripts/nios-24-7-verify.ps1`.

