# Línea base de la suite — estado resuelto

Última medición: **2026-10-11**, commit `1cdd9e81` (merge PR #5 en master).

Resultado actual: **1.410 passed / 0 failed / 2 skipped** — 116 archivos OK.
El job `Unit & Integration Tests` de CI está en verde en `master`.

## Resolución de los 26 fallos históricos

Los 26 fallos de la línea base anterior (medida en `fbe92034`) fueron
resueltos en el PR #5. Causa raíz común: los fixtures no cumplían el
contrato canónico `isPublishedArticle` (`publicado===true &&
estado==='publicado'`, introducido en P0.2) y el mock de Firestore no
soportaba `.where()` encadenado.

| Archivo | Corrección aplicada |
|---|---|
| `tests/nios-intelligence.test.ts` | fixtures con `publicado: true`; test M15 reescrito a la semántica canónica |
| `tests/nios-command-center.test.ts` | fixtures con `publicado: true` |
| `tests/swiss-watch.test.ts` | fixtures con `publicado: true` |
| `tests/mission7-data-status.test.ts` | fixtures con `publicado: true` |
| `tests/mission10-diagnostics.test.ts` | fixtures con `publicado: true` |
| `tests/homepage-freshness.test.ts` | fixture con título/contenido renderizable (`isRenderableArticle`) |
| `tests/meni-premerge-review.test.ts` | mock Firestore con `.where()`/`.orderBy()`/`.limit()` encadenables |

## Regla

- Nunca silenciar fallos ni marcarlos como `continue-on-error` en CI.
- Toda nueva regresión se detecta comparando contra esta línea base
  (0 fallos): cualquier fallo es atribuible al cambio y bloquea el merge.

## Histórico (línea base `fbe92034`, 2026-10-10)

Medición original: 1.376 passed / 26 failed / 2 skipped — los 7 archivos
listados arriba. Resueltos por PR #5 (`cbd570b4`).
