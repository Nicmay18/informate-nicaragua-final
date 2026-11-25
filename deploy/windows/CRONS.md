# Inventario de crons — vercel.json (master post-PR #54)

Vercel ejecuta en **UTC**. Nicaragua es **UTC-6 fijo** (sin DST) → el script
`Install-Crontasks.ps1` convierte automáticamente a hora local de la máquina.
Autenticación: `Authorization: Bearer $CRON_SECRET` (o `x-cron-secret`).

**Estado real en Firestore `config/cost_guard` (verificado 24-nov-2026):**
`mode=economy` con `disabledStages=[collect,analyze,ceo,finalize]` y
`disabledCrons=[nios-ceo-loop, supervisor-watch, meni-learning-cycle,
departamento-central, departamento-daily]`.

| # | Endpoint | Cron UTC | Equiv. local (UTC-6) | Estado | Efectos / idempotencia |
|---|----------|----------|----------------------|--------|------------------------|
| 1 | `/api/cron/nios-collect?stage=collect` | `0 8 * * *` | 02:00 diario | ⏸️ OFF | Recolecta fuentes → `nios_runs`. Pausada: devuelve `skipped`. |
| 2 | `/api/cron/nios-collect?stage=analyze` | `30 8 * * *` | 02:30 diario | ⏸️ OFF | Análisis LLM → `nios_runs`. Pausada. |
| 3 | `/api/cron/nios-collect?stage=ceo` | `0 9 * * *` | 03:00 diario | ⏸️ OFF | Decisión CEO → `nios_actions`. Pausada. |
| 4 | `/api/cron/nios-collect?stage=finalize` | `30 9 * * *` | 03:30 diario | ⏸️ OFF | Publica acciones aprobadas. Pausada — **única etapa que escribe noticias**; si se reactiva, revisar duplicados (tiene claim por `nios_actions`). |
| 5 | `/api/cron/resumen-diario` | `0 12 * * *` | 06:00 diario | ✅ ON | Resumen Telegram diario. Claim atómico (`status:'sending'`) → **no duplica** aunque se solape. |
| 6 | `/api/cron/departamento-central` | `0 0 * * *` | 18:00 diario | ⏸️ OFF | Orquesta departamentos → `depto_jobs`. Pausada. |
| 7 | `/api/cron/departamento-daily` | `0 6 * * *` | 00:00 diario | ⏸️ OFF | Procesa `depto_jobs`. Pausada. |
| 8 | `/api/cron/departamento-watchdog` | `0 1 * * *` | 19:00 diario | ✅ ON | Detecta jobs atascados; heartbeat en Firestore. Idempotente. |
| 9 | `/api/cron/nios-ceo-loop` | `0 2 * * *` | 20:00 diario | ⏸️ OFF | Loop CEO autónomo. Pausada. |
| 10 | `/api/cron/supervisor-watch` | `0 4 * * *` | 22:00 diario | ⏸️ OFF | Supervisión de calidad. Pausada. |
| 11 | `/api/cron/traffic-cleanup` | `0 3 * * *` | 21:00 diario | ✅ ON | Limpia `traffic_log` + snapshot `cost_daily` por fecha. **Idempotente** (doc por día, merge). |
| 12 | `/api/cron/distribuciones-retry` | `15 5 * * *` | 23:15 diario | ✅ ON | Reintenta distribuciones fallidas con estados terminales (`fallo_definitivo`) → **no reenvía** las exitosas. |
| 13 | `/api/cron/meni-learning-cycle` | `0 6 * * 0` | **sáb 00:00** semanal | ⏸️ OFF | Ciclo de aprendizaje MENI. OJO: domingo 06:00 UTC = sábado 00:00 local — el instalador usa trigger **semanal** correcto. |

## Notas de operación

- **Activar una pausada** requiere DOS pasos: (a) quitarla de `disabledCrons`/`disabledStages` en `config/cost_guard` (Firestore) con justificación, y (b) `Enable-ScheduledTask` en la tarea `InformateCron-*` correspondiente. No hacer (b) sin (a) — el endpoint respondería `skipped` igualmente (inofensivo, pero confuso).
- **Anti-solapamiento**: `MultipleInstances IgnoreNew` + timeout 30 min por tarea. Si una tarea excede 30 min Task Scheduler la mata; el endpoint sigue siendo idempotente al reintentar al día siguiente.
- **Reintentos**: Task Scheduler no reintenta por defecto; `-StartWhenAvailable` recupera ejecuciones perdidas por PC apagada (dentro de la ventana del disparador). Para reintentos extra usar `New-ScheduledTaskSettingsSet -RestartCount`.
- **Verificación**: `Get-ScheduledTask -TaskName 'InformateCron-*' | Select TaskName,State` y `logs\crons.log`.
