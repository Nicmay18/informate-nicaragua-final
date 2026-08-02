# Knowledge Graph — Reporte Técnico

## 1. Objetivo

Crear un grafo interno de entidades sobre Firestore sin Neo4j, extraído automáticamente del texto de noticias y guías. Sirve como columna vertebral para Memoria Editorial, Timeline y Enlaces Inteligentes.

## 2. Entidades soportadas

- Persona, Institución, Hospital, Ministerio
- Ciudad, Departamento, Municipio, País
- Equipo deportivo, Evento, Empresa
- Volcán, Universidad, Programa gubernamental
- Otro (detectado por nombres propios)

## 3. Campos almacenados por entidad

```
NiosEntity {
  id, name, type,
  count, firstSeen, lastSeen,
  categories[], news[], guides[],
  mainAuthor, totalViews
}
```

## 4. Método de extracción

- Diccionario de entidades conocidas con tipo fijo (Hospital Bertha Calderón, MINSA, Asamblea Nacional, etc.).
- Patrones de tipo (hospital, ministerio, volcán, ciudad, país, etc.).
- Extracción de nombres propios con expresión regular sobre `titulo` y `resumen`.
- Normalización y deduplicación por slug del nombre.

## 5. Archivos

- `lib/nios/knowledge-graph/index.ts` — motor del grafo.
- `app/admin/entities/page.tsx` — página administrativa.
- `components/nios/EntitiesClient.tsx` — buscador y detalle.

## 6. Página /admin/entities

- Carga noticias y guías, computa el grafo en servidor.
- Buscador en tiempo real por nombre, tipo o categoría.
- Panel de detalle con noticias, guías, autor, vistas, primer y último registro.

## 7. Integración

- `buildKnowledgeGraph` se usa en `content-intelligence`, `editorial-memory`, `editorial-timeline` y `smart-links`.
- El grafo se expone en el dashboard V3 en la pestaña **Entidades**.

## 8. Validación

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Aprobado |
| `npm run build` | ✅ Aprobado |
| `npm run test:merge` | ✅ Aprobado |

## 9. Rendimiento

- El grafo se calcula sobre las 500 noticias en memoria sin persistir en Firestore.
- No agrega consultas adicionales por entidad; reutiliza el mismo `Noticia[]`.
- Futura mejora: cachear el grafo con `unstable_cache` o ISR para el panel.

## 10. Próximos pasos

- Entrenar listas de entidades conocidas con retroalimentación del editor.
- Agregar visualización de red entre entidades.
- Persistir el grafo en Firestore si crece más allá de 1.000 entidades.
