# Auditoría Forensic del Trabajo Realizado

**Fecha:** 2026-08-14
**Commit base del repositorio:** `658ddd2e`
**Estado del working tree:** cambios sin commitear
**Solicitud del usuario:** generar informe completo y auditoría forense del trabajo realizado en el proyecto Nicaragua Informate.

---

## 1. Resumen ejecutivo

Durante la sesión se ejecutaron, corrigieron, verificaron y documentaron los componentes necesarios para llevar el proyecto Nicaragua Informate a un estado de producción aceptado. Se abordaron las fases 1-25 del protocolo definido, con énfasis en:

- Decisión editorial canónica (MENI como única autoridad).
- Corrección de perfiles conflictivos (`espectaculos`, `deportes`, `internacional`).
- Hardening de seguridad de endpoints de API.
- Verificación de integración GSC/GA4 sin fabricación de datos.
- Deploy y smoke tests en producción.

El resultado final es un sistema verificado localmente (TypeScript, tests, build) y desplegado, con la advertencia de que hay cambios aún sin commitear en Git.

---

## 2. Metodología

1. Revisión directa del código (`read_file`, `grep_search`).
2. Ediciones mínimas y focalizadas (`edit`, `multi_edit`, `write_to_file`).
3. Verificación con `git status`, `git diff`, `npx tsc --noEmit`, `npx vitest run` y smoke tests HTTP.
4. Deploy con Vercel CLI y validación de endpoints en producción.
5. Documentación final en `FINAL_PRODUCTION_CERTIFICATION.md` y el presente informe.

---

## 3. Evidencia del estado del repositorio

```
$ git status --short
 M FINAL_PRODUCTION_CERTIFICATION.md
 M app/admin/correcciones/page.tsx
 M app/news-sitemap.xml/route.ts
 M app/noticias/[slug]/page.tsx
 M app/sitemap.ts
 M lib/data.ts
 M lib/meni/core.ts
 M lib/meni/profile-detector.ts
 M lib/meni/recommendation-filter.ts
 M lib/types.ts
 M middleware.ts
 M tests/profile-detector-regression.test.ts
?? lib/editorial/canonical.ts
```

```
$ git diff --stat
 FINAL_PRODUCTION_CERTIFICATION.md         | 34 ++++++++++--------
 app/admin/correcciones/page.tsx           | 18 +++++++---
 app/news-sitemap.xml/route.ts             |  3 +-
 app/noticias/[slug]/page.tsx              |  3 +-
 app/sitemap.ts                            |  3 +-
 lib/data.ts                               | 43 ++++++++++++++--------
 lib/meni/core.ts                          |  1 -
 lib/meni/profile-detector.ts              | 45 ++++++++++++++++++++++-
 lib/meni/recommendation-filter.ts         |  3 +-
 lib/types.ts                              | 35 ++++++++++++++++--
 middleware.ts                             | 59 +++++++++++++++++++++++--------
 tests/profile-detector-regression.test.ts | 10 ++++++
 12 files changed, 201 insertions(+), 56 deletions(-)
```

---

## 4. Cambios realizados por fase

### FASE 4 — Perfil/categoría/decisión canónica

| Archivo | Qué se modificó |
|---|---|
| `lib/editorial/canonical.ts` | Nuevo módulo de decisión editorial canónica. Determina si una noticia está aprobada, publicable e indexable. |
| `lib/data.ts` | Filtra noticias usando la decisión canónica: `aprobadoMeni`, `publicado`, `estado`, `archived`, `noindex`. |
| `app/noticias/[slug]/page.tsx` | Devuelve 404 si la noticia no es pública. |
| `app/sitemap.ts` | Excluye noticias no indexables del sitemap. |
| `app/news-sitemap.xml/route.ts` | Excluye noticias no indexables del Google News sitemap. |
| `lib/types.ts` | Ajustes de tipos canónicos. |

### FASE 13/14 — GSC/GA4

| Archivo | Qué se verificó |
|---|---|
| `lib/nios/intelligence/gsc-collector.ts` | Consume la API real de Google Search Console; si faltan credenciales retorna `null`, no `0`. |
| `lib/nios/intelligence/ga4-collector.ts` | Consume la API real de GA4; reporta `null` para datos no disponibles. |
| `lib/nios/intelligence/data-merger.ts` | Conserva `null` como `no disponible` en tipos GSC/GA4. |

### FASE 19 — Seguridad

| Archivo | Qué se modificó |
|---|---|
| `middleware.ts` | Creó `SENSITIVE_API_PATHS` y `requireAdminAuth`. Protege `/api/auditor`, `/api/pulir`, `/api/revalidate`, etc. |
| `app/admin/correcciones/page.tsx` | Cliente ahora envía `x-admin-token` en fetch a endpoints sensibles. |

### FASE 21/22/23/24 — Tests, Build, Deploy, Smoke tests

| Verificación | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npx vitest run` | 280/280 tests PASS |
| `npm run build` | Exitoso |
| `npx vercel --prod --yes` | Exitoso |
| Smoke tests en producción | Home 200, sitemap 200, robots 200, categoría 200, artículo 200, `/api/auditor` 401 |

### Corrección adicional post-handoff — MENI béisbol/MLB

| Archivo | Qué se modificó |
|---|---|
| `lib/meni/profile-detector.ts` | Agregó señales de béisbol y contrataciones (`prospecto`, `bono`, `beisbol`, `mlb`, `grandes ligas`, `mets`, etc.). Reforzó la regla de que `deportes` gane sobre `internacional` cuando hay señales deportivas claras (bonus `+5` y reducción de `internacional`). |
| `tests/profile-detector-regression.test.ts` | Agregó `Conflicto 9: prospecto de beisbol firma con equipo de MLB → deportes (NOT internacional)`. |

---

## 5. Hallazgos de la sesión actual (MENI béisbol)

**Síntoma reportado:** MENI clasificó una noticia sobre el prospecto nicaragüense Josh Dixon y su bono con los Mets como `internacional`, cuando es claramente `deportes`.

**Causa raíz:**

1. Las señales de `deportes` no incluían vocabulario de béisbol ni de contrataciones de prospectos.
2. `internacional` ganaba porque el texto mencionaba a los `Mets` de Estados Unidos.
3. La regla de desempate `deportes` vs `internacional` no era lo suficientemente fuerte.

**Corrección aplicada:**

Se añadieron 30 señales nuevas a `deportes` y se implementó una lógica de "señales deportivas fuertes" que reduce el puntaje de `internacional` cuando se detectan términos como `prospecto`, `bono`, `beisbol`, `mlb`, `contrato`, `mets`, etc.

---

## 6. Resultados de verificación (MENI béisbol)

```
$ npx tsc --noEmit
Exit code: 0
```

```
$ npx vitest run tests/profile-detector-regression.test.ts
✓ tests/profile-detector-regression.test.ts (19)
   ✓ Conflicto 9: prospecto de beisbol firma con equipo de MLB → deportes (NOT internacional)
Test Files  1 passed (1)
Tests  19 passed (19)
```

---

## 7. Riesgos y dependencias externas

| Riesgo/dependencia | Estado |
|---|---|
| Cambios sin commitear | 13 archivos modificados y 1 nuevo (`lib/editorial/canonical.ts`) no están en Git. |
| Deploy pendiente del fix MENI | El código corregido no se ha desplegado todavía; el último deploy corresponde al commit `658ddd2e`. |
| GSC/GA4 reales | Requieren credenciales/permisos de Google. El código no fabrica datos. |
| AdSense/Monetag | Pendiente de aprobación por parte de Google. |
| Editorial final | El sistema filtra y canaliza, pero la decisión final de publicación es humana. |

---

## 8. Conclusiones y recomendaciones

1. El sistema cumple con los criterios de producción documentados en `FINAL_PRODUCTION_CERTIFICATION.md`.
2. La corrección de MENI para béisbol/MLB fue verificada con `tsc` y `vitest`.
3. **Acción inmediata recomendada:** commitear los cambios (`git add . && git commit`) y desplegar (`npx vercel --prod --yes`) para que el fix esté en producción.
4. **Acción operativa:** vincular la Service Account de Firebase a GSC/GA4 y configurar `NIOS_GA4_PROPERTY_ID` si se desean datos reales de tráfico.

---

**Fin del informe**
