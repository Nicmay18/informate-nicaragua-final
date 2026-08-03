# Knowledge Graph v2.0 — Reporte Final

## Resumen Ejecutivo

Nicaragua Informate ha evolucionado de un sitio de noticias a una **plataforma de conocimiento sobre Nicaragua**. Cada noticia publicada enriquece automáticamente el grafo de conocimiento acumulado del medio.

## Fases Implementadas

### Fase 1: Entity Engine
- **22 tipos de entidades** detectadas automáticamente: persona, institución, empresa, hospital, ciudad, departamento, ministerio, evento, equipo deportivo, organización, programa, ley, proyecto, infraestructura, universidad, volcán, río, carretera, festival, lugar, tema, categoría.
- Cada entidad tiene: nombre, slug, tipo, descripción, primera/última aparición, cantidad de noticias, categorías relacionadas, palabras clave, imagen.
- **Diccionarios especializados** para Nicaragua: hospitales, empresas, equipos deportivos, ríos, carreteras, festivales, infraestructura, proyectos, leyes.

### Fase 2: Entity Pages
- Páginas públicas en `/entidad/[slug]` con descripción, cronología, noticias relacionadas, entidades relacionadas, categorías, palabras clave.
- Índice público en `/entidad` con búsqueda y filtrado por tipo.
- Schema.org JSON-LD generado automáticamente según el tipo de entidad.

### Fase 3: Timeline Engine
- Cronología por entidad con fechas, títulos de noticias, resúmenes y enlaces.
- Display visual en las páginas de entidad con orden cronológico descendente.

### Fase 4: Smart Internal Linking
- Detección automática de entidades en el contenido del artículo.
- Enlaces internos a páginas de entidad (primera ocurrencia solo).
- API para aplicar enlaces al contenido HTML sin duplicar.

### Fase 5: Related Knowledge
- Artículos relacionados basados en **entidades compartidas** en lugar de solo categoría.
- Scoring por cantidad de entidades en común.
- Reemplaza el sistema anterior de `related_links` por categoría.

### Fase 6: Editorial Memory
- Panel interno pre-publicación que responde:
  - ¿Ya escribimos sobre este tema?
  - ¿Qué noticias similares existen?
  - ¿Qué cronología existe?
  - ¿Existe riesgo de canibalización SEO?
  - ¿Qué enlaces conviene agregar?
- API en `/api/admin/editorial-memory`.

### Fase 7: Knowledge Health
- Módulo visual en `/admin/knowledge-center` con 4 pestañas:
  - **Resumen**: stats generales, entidades por tipo, temas creciendo/olvidados.
  - **Entidades**: top entidades, entidades huérfanas.
  - **Cobertura**: por departamento, institución, persona.
  - **Oportunidades**: detección de temas para especiales editoriales.

### Fase 8: SEO Knowledge
- JSON-LD automático: Person, Organization, Place, Event, Hospital, SportsTeam, CollegeOrUniversity, Legislation, Project, Thing.
- Compatible con Google Search, Google News y Google Discover.

### Fase 9: Auto Enrichment
- Al publicar una noticia, `ingestArticle` actualiza automáticamente:
  - Cronología de cada entidad detectada.
  - Contador de noticias por entidad.
  - Primera/última aparición.
  - Categorías relacionadas y palabras clave.
  - Relaciones entre entidades co-ocurrentes.

### Fase 10: Business Value
- Detección automática de temas con suficiente contenido para:
  - **Micrositio** (20+ noticias)
  - **Especial editorial** (15+ noticias)
  - **Serie editorial** (10+ noticias)
  - **Guía premium** (7+ noticias)
  - **Cobertura permanente** (5+ noticias)

## Archivos Creados

### Lógica (lib/)
- `lib/meni/knowledge-base/types.ts` — Tipos expandidos (22 EntityType, campos nuevos)
- `lib/meni/knowledge-base/entity-extractor.ts` — Detección de 22 tipos de entidades
- `lib/meni/knowledge-base/entity-page.ts` — Cargador de páginas de entidad + Schema.org
- `lib/meni/knowledge-base/internal-linking.ts` — Smart Internal Linking
- `lib/meni/knowledge-base/related-knowledge.ts` — Artículos relacionados por entidades
- `lib/meni/knowledge-base/editorial-memory.ts` — Memoria editorial pre-publicación
- `lib/meni/knowledge-base/knowledge-health.ts` — Estadísticas de salud del grafo
- `lib/meni/knowledge-base/business-value.ts` — Detección de oportunidades editoriales

### Páginas Públicas (app/)
- `app/entidad/page.tsx` — Índice de entidades
- `app/entidad/[slug]/page.tsx` — Página de entidad individual

### Admin (app/admin/)
- `app/admin/knowledge-center/page.tsx` — Knowledge Center visual

### API Routes (app/api/)
- `app/api/entity/route.ts` — API pública de entidades
- `app/api/admin/editorial-memory/route.ts` — Memoria editorial
- `app/api/admin/knowledge-health/route.ts` — Health + opportunities
- `app/api/admin/knowledge-linking/route.ts` — Internal links + related links

### Componentes (components/)
- `components/knowledge-graph/EntityPageClient.tsx` — UI de página de entidad
- `components/knowledge-graph/EntityIndexClient.tsx` — UI de índice de entidades
- `components/knowledge-graph/KnowledgeCenterClient.tsx` — UI del Knowledge Center

## Colecciones Firestore

- `kb_entities` — Entidades del grafo
- `kb_relations` — Relaciones entre entidades
- `kb_timeline` — Entradas de cronología por entidad

## Estado

- **No se modificó**: MENI V3.2, EOS, NIOS, Home Ranking, Authority Engine, Business Command Center, SEO existente.
- **Nueva capa de conocimiento** integrada sobre la arquitectura existente.
- **Escalable**: de cientos a decenas de miles de noticias.
