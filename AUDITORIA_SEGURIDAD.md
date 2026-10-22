# AUDITORIA_SEGURIDAD.md — riesgos y cambios

## Hallazgos y resolución

| # | Riesgo | Evidencia | Estado |
|---|---|---|---|
| S1 | `panel.html` servía sin headers anti-clickjacking/anti-MIME-sniffing | ausencia de X-Frame-Options/CSP en ruta estática | CORREGIDO (rama `fix/estabilizacion-forense`), PENDIENTE DE DESPLIEGUE |
| S2 | `/api/telemetry/ads` era mutador abierto sin límite — inflación de contadores comerciales | código sin rate-limit | CORREGIDO (commit en PR #10), PENDIENTE DE DESPLIEGUE |
| S3 | `panel.html` escribía directo a Firestore fabricando contenido (bypass editorial) | `updateDoc` con texto inyectado | CORREGIDO (rama) — bypass eliminado |
| S4 | Workflow crecimiento-diario llamaba `/api/admin/crecimiento` sin auth → 401 diario + vía potencial de bypass | workflow sin header | CORREGIDO (rama `fix/ci-e2e-gate`) |
| S5 | `isPublicArticle` débil (no exige `supervisorApproved`/`contentHash`) | 254/261 docs sin esos campos | NO APLICADO — endurecerlo oculta ~43% del corpus; requiere backfill (BLOQUEADO) |
| S6 | Cookie admin opaca | PR #13 | PENDIENTE DE REVISIÓN (PR abierta del proyecto) |
| S7 | Secretos en query params / logs | revisión de rutas | sin exposición confirmada en esta sesión — mantener vigilancia |
| S8 | Reglas de Firestore | sin cambios realizados | Sin propuesta de despliegue; análisis pendiente si se autoriza |

## Residual / por verificar

- Superficie de `/api/admin/*` depende de middleware + `ADMIN_API_KEY`/`admin_session`/`cron` — endpoints concretos (sitemap-refresh, rebuild) deben verificarse uno a uno si se autoriza auditoría de handlers (parcialmente cubierto en sesiones previas).
- Dependencias: PR #14 (`fix/deps-audit`) abierta con parches semver-seguros — pendiente de revisión.
- Ningún secreto se escribió en commits, informes ni logs en esta misión.

## Verificaciones no ejecutables

- Penetración real de endpoints, revocación de sesiones y reglas Firestore en producción — requieren acceso/entorno autorizado: NO VERIFICADO.
