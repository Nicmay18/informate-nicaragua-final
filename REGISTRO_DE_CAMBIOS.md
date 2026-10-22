# REGISTRO_DE_CAMBIOS.md — cambios, commits, PR, pruebas y estado de despliegue

## Escrituras en Firestore (producción — datos)

| Fecha | Lote | Docs | Cambios | Verificación | Backup |
|---|---|---|---|---|---|
| 21-oct | fase-1 eufemismo (HIGH) | 23 | 36 | lectura directa DB | `.audit/repair-afectado-log.json` |
| 21-oct | rectificaciones propias | 2 | 2 | lectura directa | `.audit/repair-rectificacion-log.json` |
| 22-oct | fase-2 (47 ocurrencias + extras confirmados) | 22 | 56 | **post-apply re-lectura: 22/22 APLICADO+VERIFICADO** | `.audit/repair-afectado-p2-backup.json` |

Todas con `reparacionForense`/`requiresReevaluation` y fingerprint. Reversión: `PLAN_DE_REVERSIÓN.md`.
**Visibilidad pública**: pendiente (caché CF sirve HTML previo — verificado 22-oct, Diriomo aún muestra "afectado" en H1).

## Código — ramas y commits

| Rama | Commits | Contenido | PR | Estado |
|---|---|---|---|---|
| `feat/auspiciadores-directos` | +rate-limit telemetría (`ebf9ade`) | mutador con tope 60/min, logs | #10 (actualizada) | CORREGIDO, PENDIENTE DE DESPLIEGUE |
| `fix/estabilizacion-forense` | `c8e85ba`, `f040cb2` | panel sin fabricación, headers, canonical, 404s, docs auditoría | por crear | CORREGIDO, PENDIENTE DE DESPLIEGUE |
| `fix/ci-e2e-gate` | `a032298` | E2E sin continue-on-error, auth cron crecimiento, deploy-staging muerto | por crear | CORREGIDO, PENDIENTE DE DESPLIEGUE |
| `audit/afectado-p2-evidencia` | `ac60072`, `067dd0a`, `e33960f` | matriz 47, simulador, backups, rollback, diff exacto | por crear | VERIFICADO (usado para apply) |

## PRs de terceros/previos abiertos (sin acción)

#2 runtime errors, #4 meni evidence, #10 auspiciadores (solapa #15), #11 depto jobs, #12 seo títulos, #13 cookie admin, #14 deps-audit, #15 negocios-mvp. Reutilizar en vez de duplicar.

## Verificación de despliegue

- Producción = master `5fa19c6`. Nada desplegado por esta misión.
- 784 URLs sondadas: 0 errores. Reparaciones DB no visibles aún por caché CF (pendiente de purga o TTL).
