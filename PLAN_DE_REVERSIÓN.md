# PLAN_DE_REVERSIÓN.md — cómo revertir cada cambio

## Escrituras editoriales en Firestore

### Fase 2 — "afectado" CONFIRMADO (22 docs, 56 reemplazos, 22-oct-2026)
- **Backup**: `.audit/repair-afectado-p2-backup.json` — por doc: `shaAntes`, `shaDespues`, valores originales completos de titulo/resumen/contenido, `reparacionForense` previo.
- **Revertir**: `node scripts/rollback-afectado-p2.mjs` (dry-run) / `--apply`.
- **Seguro**: restaura solo los 3 campos y solo si `shaDespues` coincide con el estado actual del doc — si el doc fue editado después, lo omite y marca CONFLICTO (no borra trabajo posterior). Reversión manual en ese caso: valores originales están en el backup.

### Fase 1 — "afectado" HIGH (23 docs, 36 reemplazos) + 2 rectificaciones
- **Backup**: `.audit/repair-afectado-log.json` (antes/después por frase) y `.audit/repair-rectificacion-log.json`.
- **Revertir**: inversión manual guiada por los pares `antes`/`despues` del log (los docs fueron editados post-reparación; restaurar selectivamente por frase, no por doc completo, salvo que `sha` coincida).

### Convención
- Ninguna reparación editorial se aplicó sin backup de valores originales + fingerprint.
- `reparacionForense.fase2` y `requiresReevaluation` marcan los docs tocados por fase 2.

## Cambios de código (git — reversibles por commit/rama)

| Cambio | Rama | Revertir con |
|---|---|---|
| panel.html sin fabricación/anti-palabras | `fix/estabilizacion-forense` | `git revert` del commit o no mergear |
| Headers seguridad /panel.html | `fix/estabilizacion-forense` | revert |
| Canonical /categoria | `fix/estabilizacion-forense` | revert |
| 404 real /tema, /entidad | `fix/estabilizacion-forense` | revert |
| Rate limit telemetry/ads | `feat/auspiciadores-directos` (PR #10) | revert del commit en la rama |
| E2E como gate + auth crecimiento | `fix/ci-e2e-gate` | revert / no mergear |

## Operaciones en producción

- **Purga de caché CF** (si se autoriza): irreversible como operación pero segura — el contenido se regenera desde origen. Rollback = ninguno necesario.
- **Reglas de Firestore**: ningún cambio realizado ni propuesto aún.
- **Despliegues**: ninguno ejecutado en esta misión.

## Artefactos de auditoría

Archivos `.audit/*.json` (corpus, snapshots, backups, diffs, logs) — conservar para trazabilidad. Eliminables tras confirmar reversión final si se desea.
