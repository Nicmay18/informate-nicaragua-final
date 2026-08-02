# Editorial Memory — Reporte Técnico

## 1. Objetivo

Evitar que las noticias queden aisladas. Cuando se publique una noticia relacionada con otra anterior, NIOS la detecta, muestra la cronología y sugiere guías conexas.

## 2. Ejemplo operativo

**Hospital Bertha Calderón**
- 38 noticias acumuladas.
- Se muestra la cronología ordenada por fecha.
- Se enlazan guías relacionadas si existen.
- Se indica: "Existe cobertura previa. Relacionar automáticamente."

## 3. Arquitectura

- **Módulo:** `lib/nios/editorial-memory/index.ts`
- **Entrada:** `Noticia[]` y `EvergreenArticle[]`
- **Mecanismo:** usa `buildKnowledgeGraph` para agrupar noticias por entidad.
- **Salida:** `EditorialMemory` con `memories` y `orphanNews`.

## 4. Campos por memoria

- `entity`, `type`, `count`
- `chronology[]` con `slug`, `title`, `date`, `views`
- `guides[]` relacionadas
- `message` explicativo

## 5. Noticias huérfanas

Las noticias que no están vinculadas a ninguna entidad con ≥2 apariciones se marcan como huérfanas para revisión editorial.

## 6. Integración

- `buildEditorialMemory` se llama desde `copilot` y `v3-report`.
- Se muestra en `NiosV3Dashboard` pestaña **Memoria**.

## 7. Validación

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Aprobado |
| `npm run build` | ✅ Aprobado |
| `npm run test:merge` | ✅ Aprobado |

## 8. Próximos pasos

- Agregar sugerencias automáticas de "noticia de seguimiento" con entidades de alta aparición reciente.
- Permitir al editor aprobar relaciones y alimentar el grafo.
