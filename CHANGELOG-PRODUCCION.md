# CHANGELOG — MISIÓN FINAL PRODUCCIÓN

## Estado de la entrega

- `npm run build`: ✅ EXITO
- `npx tsc --noEmit`: ✅ EXITO
- `npx vitest run`: ✅ 71/71 tests OK
- `npm run lint`: ✅ OK

## Commits realizados en esta misión

| Hash | Mensaje | Módulo |
|---|---|---|
| `e6f54c5` | `refactor(components): elimina componentes huérfanos duplicados (HomePageRedesign, Sidebar, SidebarPro, ImageSkeleton, LutoImage)` | components |
| `3d96934` | `feat(app): agrega loading.tsx para streaming entre rutas` | app |
| `bb0192f` | `fix(seo): agrega canonical global a layout` | seo |

## Archivos modificados / eliminados

- **Eliminados** (`components`):
  - `components/HomePageRedesign.tsx`
  - `components/Sidebar.tsx`
  - `components/pro/SidebarPro.tsx`
  - `components/ImageSkeleton.tsx`
  - `components/LutoImage.tsx`

- **Agregados** (`app`):
  - `app/loading.tsx`

- **Modificados** (`seo`):
  - `app/layout.tsx` (canonical global)

## MENI V3.2

- Congelado. Sin cambios en score, pesos, blend, utilidad, profundidad, EEAT, penalización ni editor.

## Notas

- Build de producción exitoso con `NODE_OPTIONS=--max-old-space-size=4096` (ver `package.json`).
- La caché de Firestore mantiene TTL de 1 hora (`lib/db/cached-firestore.mjs`).
