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

---

## Ejecución final controlada — 24-oct (lotes A–E)

### Escrituras Firestore aplicadas este turno (Firestore real, colección `noticias`)

| Lote | Detectados | Aplicados | Verificados post-lectura | Drift | Fallidos | Backup |
|---|---|---|---|---|---|---|
| A — 18 títulos truncados "…" | 18 | 18 | **18/18 APLICADO+VERIFICADO** | 0 | 0 | `.audit/repair-titulos-truncados-backup.json` |
| B — dedup 3 artículos E (párrafo ×42 + oraciones rep.) | 3 | 3 | **3/3 APLICADO+VERIFICADO** (idempotente vía `dedupE.aplicado`) | 0 | 0 | `.audit/repair-dedup-e-backup.json` |
| D — enlaces/bloques "Te puede interesar" rotos (21 sin destino + 7 redirecciones + li con slug en crudo) | 69 docs | 69 | **69/69 APLICADO+VERIFICADO** | 0 | 0 | `.audit/repair-enlaces-404-backup.json` |
| E — limpieza bloques relacionados vacíos (h3+ul huérfanos) | 2 | 2 | verificado post-lectura | 0 | 0 | dentro del backup de D |

Detalles Lote D: 21 `li` sin destino confirmado eliminados (404 real en producción); 7 `li` reescritos a slugs sucesores confirmados con título canónico actual (primeros-bebes ×2, como-anular-record ×2, accidentes-viales fallecidos ×2, toy-story-5); `larreynaga` retirado (sucesor sería artículo semánticamente distinto). Cero pérdida factual verificada por comparación de conjuntos de párrafos únicos en lotes B/D.

### Código (commit en `audit/afectado-p2-evidencia`, pendiente de deploy)

- `app/noticias/[slug]/page.tsx` — `generateMetadata` ya no corta `<title>` a 57 chars dejando palabras de función colgadas ("…termina con un…"); corte a ≤65 en límite de palabra + strip de conectores finales. **Causa raíz confirmada** del desajuste h1-OK/title-truncado observado en producción: era truncado *en render*, no caché.
- `scripts/repair-titulos-truncados.mjs`, `repair-dedup-e.mjs`, `repair-enlaces-404.mjs` — protocolo completo: fingerprint por doc, whitelist, anti-doble, backup, simulación previa, post-lectura.
- `MATRIZ_TITULOS_TRUNCADOS.csv` (18/18 ALTA — Rosita resuelta con evidencia de gastronomía en resumen+cuerpo), `MATRIZ_ENLACES_404.json`, `MATRIZ_LOTE3.csv`.

### Pruebas este turno

| Prueba | Resultado |
|---|---|
| `tsc --noEmit` | PASS (TSC_CLEAN) |
| Vitest suite completa | PASS — 117/117 archivos, **1454/1454 tests** (un flake puntual en primera corrida, verde en rerun) |
| Lint / build / E2E / Lighthouse / axe | NO VERIFICADO |

### Lote C — estado

`MATRIZ_LOTE3.csv` generada con estado **post-LOTE B/D fresco**: 114 ocurrencias en 18 docs → 42 HERIDO CONFIRMADO · 13 MUERTE CONFIRMADA · 41 MANTENER · 8 MEZCLA · 10 BLOQUE_RELACIONADOS (ya cubiertos por D). **PREPARADO — NO APLICADO**: sustituciones semánticas herido/fallecido/damnificado requieren aprobación editorial por ocurrencia.

### Visibilidad pública — NO VERIFICADO AÚN

Reparaciones en DB correctas y verificadas por lectura directa. Producción: `<h1>` de Quilalí ya muestra título completo (Firestore visible tras TTL); `<title>` seguirá truncado en render hasta desplegar el fix de `page.tsx` (código, no caché). Purga CF y deploy siguen pendientes de autorización.
