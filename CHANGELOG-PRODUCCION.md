# CHANGELOG — MISIÓN FINAL PRODUCCIÓN

## Estado de la entrega

- `npm run build`: ✅ EXITO
- `npx tsc --noEmit`: ✅ EXITO (dentro de `npm run test:merge`)
- `npm run test:merge`: ✅ 71/71 tests OK, 0 warnings
- `npm run lint`: ✅ OK
- Lighthouse: no ejecutado — requiere Chrome/entorno de escritorio

## Commits realizados en esta misión

| Hash | Mensaje | Módulo |
|---|---|---|
| `b475d87` | `fix(article): corrige schema Speakable, elimina JSON-LD duplicado y mejora tipado` | article |

## Archivos modificados / eliminados

- **Modificados** (`components`):
  - `components/ArticlePage.tsx` (clase `article-headline` para `Speakable`, JSON-LD duplicado eliminado, catch tipado `unknown`)

## MENI V3.2

- Congelado. Sin cambios en score, pesos, blend, utilidad, profundidad, EEAT, penalización ni editor.

## Notas

- Build de producción exitoso con `NODE_OPTIONS=--max-old-space-size=4096` (ver `package.json`).
- La caché de Firestore mantiene TTL de 1 hora (`lib/db/cached-firestore.mjs`).
