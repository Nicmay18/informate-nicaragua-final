# SECURITY AUDIT — NIOS CEO v1

| Campo | Valor |
|-------|-------|
| Estado | COMPLETADO (P0) |
| Riesgo más alto | Tokens por query string en `/api/cron/nios-collect` |
| Score | 8.5/10 |
| Última revisión | 2026-08-30 |

## Hallazgos confirmados

1. **Autenticación robusta**: `lib/auth.ts` usa `timingSafeCompare` para comparar `ADMIN_API_KEY` y `CRON_SECRET`. No se encontró comparación directa `===`.
2. **Sin secretos hardcodeados**: búsqueda de `CRON_SECRET` y `ADMIN_API_KEY` no devuelve valores en el repo.
3. **Token en query string**: `app/api/cron/nios-collect/route.ts` acepta `?token=`. Esto expone el token en logs de URL, cache y proxies.
4. **Middleware**: la autenticación de admin usa headers (`x-admin-token`, `x-admin-key`), no query string.
5. **Imágenes**: subida a GitHub por admin, descarga por `public/images/` local. No se detectan credenciales hardcodeadas.

## Decisiones y acciones

- **P0 — MONITORAR**: Dejar soporte de query `token` por compatibilidad Vercel Cron, pero documentar como riesgo conocido. Recomendación futura: migrar a `Authorization: Bearer` y cabecera `x-cron-secret`.
- **P1 — VERIFICAR**: Revisar `.env` en producción para `CRON_SECRET`, `ADMIN_API_KEY` y `NIOS_GSC_*`.
- **P2 — AUDITAR**: logs (`lib/logger.ts`) deben redactar `token` y `authorization` antes de escribir.

## Evidencia

- `lib/auth.ts` líneas 8–43.
- `app/api/cron/nios-collect/route.ts` líneas 15–22.
- `vercel.json` líneas 1–37.

## Verificación

- `npm run build` OK.
- `npm run type-check` OK.
- `npm run lint` OK.
