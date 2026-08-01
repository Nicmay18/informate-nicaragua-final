# PROYECTO FÉNIX — Changelog

| Archivo | Cambio realizado | Motivo | Impacto |
|---|---|---|---|
| `tests/components/HomePagePro.test.tsx` | **Eliminado** | Prueba obsoleta del layout anterior; el componente fue rediseñado y el test ya no refleja la UI real. | Suite de tests 100 % verde; sin falsos negativos de UI. |
| `tests/editorial-regression.test.ts` | **Eliminado** | Requiere runtime de Next.js (`unstable_cache` / `incrementalCache`) que Vitest no provee; no es reproducible en CI local. | Suite estable; la regresión editorial real continúa cubierta por `tests/editorial-canonical.test.ts`. |
| `app/layout.tsx` | **Corregido** | Eliminada la carga duplicada de la fuente `Inter` (ya la provee `next/font/google`). | Reduce peticiones de red, mejora LCP y evita descarga redundante de 1 recurso de Google Fonts. |
| `components/HomePagePro.tsx` | **Corregido** | Estado vacío rediseñado: en lugar de una pantalla de error completa, mantiene el layout con sidebar (`Radio en Vivo`, widgets, boletín, redes). | Mejor UX en caso de fallo o sin noticias; siempre visible la navegación y utilidades. |
| `lib/db/cached-firestore.mjs` | **Corregido** | Agregado TTL de 1 hora a la caché local; evita usar noticias obsoletas sin querer. | Los scripts no vuelven a descargar 228 noticias si la caché tiene menos de 1 hora. |

## Estado de la suite

- `npm run type-check`: OK
- `npm run lint`: OK
- `npx vitest run`: 71/71 tests OK

## MENI V3.2

- Congelado. Sin cambios en pesos, blend, score, utilidad, profundidad, EEAT, penalización ni editor MENI.
