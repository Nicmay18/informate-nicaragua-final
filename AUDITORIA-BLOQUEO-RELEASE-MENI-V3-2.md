# Auditoría de bloqueo de release — MENI V3.2

Fecha: 2026-08-01T17:38:00.000Z
Objetivo: determinar si los tests fallidos actuales bloquean la release a producción.
Regla: no se modificó código.

## Resumen

| Test | Causa raíz | Afecta MENI | Afecta producción | Clasificación |
|---|---|---|---|---|
| `normalize-keywords.test.ts` | Lógica de `scorer.ts` suprime `FALTAN_KEYWORDS` cuando el título genera keywords automáticas. | Sí (explainability SEO) | Sí, si se considera requisito que `FALTAN_KEYWORDS` aparezca si no hay keywords definidas | **BLOQUEA RELEASE** |
| `editorial-regression.test.ts` | `getLatestNews` usa `unstable_cache` de Next.js; Vitest no provee `incrementalCache`. | No | No (en producción Next.js sí provee la cache) | **NO BLOQUEA RELEASE** |
| `HomePagePro.test.tsx` | El componente renderiza fallback "No hay noticias disponibles" en lugar del texto "lo destacado". | No | No (es UI) | **NO BLOQUEA RELEASE** |

## Análisis detallado

### 1. `tests/normalize-keywords.test.ts`

**Fallo:** `keywords.length === 0 dispara FALTAN_KEYWORDS`
- `result.explainability.find(e => e.regla === 'FALTAN_KEYWORDS')` devuelve `undefined`.
- `result.evidence.seo.keywords` sí es `[]`, como espera el test.

**Causa:** En `lib/editorial/core/scorer.ts`, la regla `FALTAN_KEYWORDS` solo se registra cuando `ev.seo.keywords.length === 0` **y** el título no produce `autoKeywords`. El título de prueba produce varias palabras mayores a 4 caracteres, por lo que `autoKeywords.length > 0` y la rama de `tracer.sub(2, ..., 'FALTAN_KEYWORDS')` nunca se ejecuta.

**Archivo responsable:** `lib/editorial/core/scorer.ts` (función `evaluarSEO`).

**Impacto:**
- `scoring` directo: el test no valida el score, pero la falta de penalización implica que una noticia sin keywords definidas obtiene SEO 100 si el título tiene palabras clave auto-generables. Esto es una discrepancia con el test.
- `explainability`: el consumidor del resultado (auditoría, interfaz, checklist editorial) no recibe la regla `FALTAN_KEYWORDS`.

**Corrección mínima necesaria:**
```ts
// En lib/editorial/core/scorer.ts, rama else de ev.seo.keywords.length > 0
const autoKeywords = ...; // generar como hoy
if (autoKeywords.length > 0) {
  signals.push(`${autoKeywords.length} keywords auto-generadas del título`);
}
warnings.push('No se definieron keywords');
tracer.sub(2, warnings[warnings.length - 1], 'FALTAN_KEYWORDS');
recommendations.push('Definir palabras clave relevantes para la nota');
```
Es decir, registrar `FALTAN_KEYWORDS` siempre que no existan keywords explícitas, sin importar el fallback automático. La generación automática puede seguir publicándose como señal positiva, pero no debe ocultar la falta de keywords del usuario.

**Clasificación:** **BLOQUEA RELEASE**.

---

### 2. `tests/editorial-regression.test.ts`

**Fallo:** `Error: Invariant: incrementalCache missing in unstable_cache async (count) => fetchNoticiasList([...LIST_FIELDS], count)`
- Origen: `lib/data.ts:179` en `getNews`.

**Causa:** El test corre en entorno `@vitest-environment node`. La API `unstable_cache` de Next.js requiere el runtime de servidor de Next.js, que no está disponible en Vitest puro.

**Archivo responsable:** `lib/data.ts` (uso de `unstable_cache`).

**Impacto:**
- En producción, Next.js inyecta `incrementalCache` en `unstable_cache`; el error no se reproduce.
- Es un fallo de infraestructura de pruebas, no de lógica editorial.

**Corrección mínima necesaria (opcional):**
- Mockear `unstable_cache` en el test, o
- Detectar el entorno en `lib/data.ts` y saltar el cacheado cuando no haya `incrementalCache`, o
- Mover el test a un entorno de integración de Next.js.

**Clasificación:** **NO BLOQUEA RELEASE**.

---

### 3. `tests/components/HomePagePro.test.tsx`

**Fallo:** El componente no muestra `lo destacado` ni `nacionales` cuando se le pasan listas vacías; renderiza el fallback "No hay noticias disponibles".

**Causa:** El componente `HomePagePro` implementó un estado vacío/fallback que el test no anticipa.

**Archivo responsable:** `tests/components/HomePagePro.test.tsx` (test desactualizado) o `components/HomePagePro.tsx` (si el nuevo fallback es involuntario).

**Impacto:**
- Es una prueba de UI.
- No afecta MENI V3.2, scoring, SEO, EEAT ni lógica editorial.

**Corrección mínima necesaria (opcional):**
- Actualizar el test para esperar el fallback, o
- Ajustar el componente para que siempre muestre las secciones editoriales.

**Clasificación:** **NO BLOQUEA RELEASE**.

## Conclusión

- **1 test bloquea la release** (`normalize-keywords.test.ts`) porque indica una regresión en la explicabilidad de MENI V3.2.
- **2 tests no bloquean** porque son fallos de entorno o UI.
- Recomendación: no ejecutar `git commit`/`git tag`/`git push` hasta corregir el fallo de `normalize-keywords` y re-ejecutar `npx vitest run`.
