# Línea base de la suite — fallos preexistentes

Última medición: **2026-10-10**, commit `fbe92034` (rama master).

Resultado: **1.376 passed / 26 failed / 2 skipped** — 108 archivos OK, 7 con
fallos.

## Archivos con fallos (26 tests)

| Archivo | Naturaleza del fallo |
|---|---|
| `tests/swiss-watch.test.ts` | fixtures sensibles a fecha/estado del tablero AdSense/NIOS |
| `tests/nios-intelligence.test.ts` | data-merger GSC/GA4 — `gscMatchStatus` undefined |
| `tests/nios-command-center.test.ts` | fixtures NIOS |
| `tests/mission7-data-status.test.ts` | mergeArticleData — expected length |
| `tests/mission10-diagnostics.test.ts` | `gscStatus` undefined |
| `tests/homepage-freshness.test.ts` | freshness homepage |
| `tests/meni-premerge-review.test.ts` | mock Firestore: `collection.where(...).where` no soportado por el fake |

## Clasificación

- Ninguno atribuible al fix MENI `fbe92034` ni al cleanup P0-8 — mismo patrón
  documentado en la auditoría P0-8 (26 fallos idénticos antes y después).
- Causas aparentes: fixtures dependientes de fecha, mocks de Firestore sin
  chaining `.where().where()`, y estado de datos que los tests no siembran.

## Plan de resolución

1. Crear issue por archivo (7 issues) con el error exacto.
2. Prioridad 1: `meni-premerge-review` (cubre la cadena de verdad editorial) —
   extender el fake con `.where()` encadenable.
3. Prioridad 2: `mission7/10`, `nios-intelligence` — sembrar fixtures completos
   (`gscStatus`, `gscMatchStatus`) en vez de depender de defaults.
4. Prioridad 3: `swiss-watch`, `homepage-freshness`, `nios-command-center` —
   congelar `NOW`/fechas en fixtures.
5. Cuando el contador llegue a 0: exigir el check `Unit & Integration Tests`
   como requerido en branch protection (`docs/gobernanza/branch-protection.md`).

## Regla

- Nunca silenciar estos fallos ni marcarlos como `continue-on-error` en CI.
- Toda nueva regresión se detecta comparando contra esta línea base: cualquier
  fallo adicional es atribuible al cambio y bloquea el merge.
