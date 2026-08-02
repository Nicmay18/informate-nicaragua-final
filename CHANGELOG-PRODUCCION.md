# Nicaragua Informate v1.0.0 — Release Candidate Validation

## Estado de la entrega

- `npm run build`: ✅ EXITO
- `npx tsc --noEmit`: ✅ EXITO
- `npm run test:merge`: ✅ 71/71 tests OK, 0 warnings
- `npm run lint`: ✅ OK (dentro de `test:merge`)
- `npm run test:all`: ❌ FALLIDO — faltan navegadores Playwright instalados
- Lighthouse: ❌ NO EJECUTADO — no hay Chrome/Edge disponible en el entorno

## Estado final

**REQUIERE CORRECCIÓN**

Build, TypeScript y `test:merge` son estables. Sin embargo, `test:all` y Lighthouse no se pudieron completar por limitaciones del entorno de validación (faltan navegadores). No se realizaron cambios de código.

## Resumen de pruebas

### Pasaron

- `npm run build`
- `npx tsc --noEmit`
- `npm run test:merge` (71/71 tests, 0 warnings)

### Pendientes / bloqueados

- `npm run test:all` — requiere `npx playwright install` y un test e2e con aserción inválida: `tests/e2e/homepage.spec.ts` line 41 `expect(page.url()).not.toContain('/')` siempre falla
- Lighthouse Home/Artículo Mobile/Desktop — requiere Chrome/Edge

## MENI V3.2

- Congelado. Sin cambios en score, pesos, blend, utilidad, profundidad, EEAT, penalización ni editor.

## Notas

- Build de producción exitoso con `NODE_OPTIONS=--max-old-space-size=4096` (ver `package.json`).
- La caché de Firestore mantiene TTL de 1 hora (`lib/db/cached-firestore.mjs`).
