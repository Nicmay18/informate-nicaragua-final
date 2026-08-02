# CHANGELOG — MISIÓN FINAL PRODUCCIÓN

## Estado de la entrega

- `npm run build`: ✅ EXITO
- `npx tsc --noEmit`: ✅ EXITO (dentro de `npm run test:merge`)
- `npm run test:merge`: ✅ 71/71 tests OK, 0 warnings
- `npm run lint`: ✅ OK
- `npm run test:all`: no ejecutado — requiere entorno con Playwright
- Lighthouse: no ejecutado — requiere Chrome/entorno de escritorio

## Commits realizados en esta misión

| Hash | Mensaje | Módulo |
|---|---|---|
| `07866be` | `fix(code): mejora calidad general` | calidad |
| `2eed1ed` | `perf(css): optimiza estilos` | css |
| `98fd01c` | `perf(core): mejora rendimiento general` | performance |
| `6948646` | `fix(seo): corrige errores tecnicos SEO` | seo |
| `aae6a88` | `perf(home): mejora portada y carga inicial` | homepage |
| `2fb07de` | `perf(firebase): optimiza lecturas y cache` | firebase |
| `3f7c1fa` | `perf(router): optimiza rutas y renderizado` | router |
| `527308e` | `refactor(ui): mejora componentes y rendimiento` | components |

## Archivos modificados / eliminados

- **Modificados** (`components`):
  - `components/NewsCard.tsx` (memo + useMemo tiempos relativos)
  - `components/Header.tsx` (memo)
- **Modificados** (`app/router/layout`):
  - `app/layout.tsx` (Suspense alrededor de CookieBanner)
  - `app/page.tsx` (40 noticias en portada vs 80)
- **Modificados** (`firebase/db`):
  - `lib/db/homepage.ts` (100 noticias para tendencias vs 200)
- **Modificados** (`seo`):
  - `app/sitemap.ts` (exporta `safeDate`)
  - `app/news-sitemap.xml/route.ts` (`safeDate`, filtro toxic/archivado, logger)
- **Modificados** (`css`):
  - `app/styles/clock-widget.css` (elimina keyframe duplicado)
- **Modificados** (`calidad`):
  - `app/actions/track-view.ts` (catch tipado unknown)

## MENI V3.2

- Congelado. Sin cambios en score, pesos, blend, utilidad, profundidad, EEAT, penalización ni editor.

## Notas

- Build de producción exitoso con `NODE_OPTIONS=--max-old-space-size=4096` (ver `package.json`).
- La caché de Firestore mantiene TTL de 1 hora (`lib/db/cached-firestore.mjs`).
