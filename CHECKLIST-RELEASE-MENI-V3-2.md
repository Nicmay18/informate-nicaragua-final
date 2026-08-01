# Checklist de release — MENI V3.2 editorial engine

Fecha: 2026-08-01T17:36:00.000Z
Tipo: auditoría de preparación para producción

## Estado del repositorio

- [x] Archivos temporales de auditoría eliminados del árbol de trabajo.
- [x] `git status` limpio (sin cambios pendientes de la edición editorial).
- [ ] Todos los tests pasan.
- [x] No se modificó lógica de MENI, editor, pesos ni fórmulas en este paso.

## Integración de MENI V3.2

- [x] Motor `lib/meni/` presente (`profundidad`, `eeat`, `utilidad`, `editorial-brain`, etc.).
- [x] Motor `lib/editorial/` presente (`pipelineV4`, `editorialEnhancer`, etc.).
- [x] Editor autónomo `lib/meni/editor-autonomo/` presente.
- [x] API de corrección `app/api/admin/corregir-titulo` y `corregir-titulos-masivo` vinculada.
- [x] Script `scripts/informe-pulido-editorial-adsense.ts` en estado actual.

## Verificación de calidad

| Verificación | Resultado |
|---|---|
| `npx tsc --noEmit` | **OK** (sin errores de tipo) |
| `npx vitest run` | **3 archivos fallan** (4 tests) |

## Tests fallidos

1. `tests/normalize-keywords.test.ts`
   - Caso: `keywords.length === 0 dispara FALTAN_KEYWORDS`
   - Error: `expected undefined to be defined` en `result.explainability.find(e => e.regla === 'FALTAN_KEYWORDS')`.
   - Relevancia: MENI / SEO. Requiere revisión de la regla `FALTAN_KEYWORDS`.

2. `tests/editorial-regression.test.ts`
   - Caso: `Auditoría de regresión del Motor Editorial Determinístico`
   - Error: `Invariant: incrementalCache missing in unstable_cache` en `lib/data.ts:179`.
   - Relevancia: entorno de Next.js; `unstable_cache` no está disponible fuera del runtime de Next.

3. `tests/components/HomePagePro.test.tsx`
   - Casos: `renders editorial sections...` y `makes reveal sections visible...`
   - Error: no se encuentra el texto `lo destacado` porque el componente muestra el fallback "No hay noticias disponibles".
   - Relevancia: UI, no MENI.

## Recomendación

No realizar el commit/tag de release hasta que:

- El test `normalize-keywords.test.ts` pase, o
- Se acepte explícitamente liberar con este test fallido y se documente como excepción.

Los otros dos archivos (`editorial-regression` y `HomePagePro`) fallan por entorno/UI y no por la lógica de MENI, pero aún así bloquean un release limpio.

## Acciones pendientes

- [ ] Decisión del usuario: ¿proceder con `git commit`, `git tag meni-v3.2-production` y `git push` a pesar de los tests fallidos, o detener la release?
- [ ] Si se detiene: corregir `FALTAN_KEYWORDS` y re-ejecutar `npx vitest run`.
