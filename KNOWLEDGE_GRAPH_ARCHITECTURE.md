# Knowledge Graph — Arquitectura

## Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLICACIÓN DE NOTICIA                     │
│              (app/api/admin/guardar-directo)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     ingestArticle()                          │
│              lib/meni/knowledge-base/index.ts                │
├─────────────────────────────────────────────────────────────┤
│  1. extractEntities()     → detecta 22 tipos de entidades   │
│  2. buildKnowledgeEntities() → construye/actualiza entidades│
│  3. buildRelations()      → infiere relaciones              │
│  4. buildTimelineEntries()→ agrega a cronologías            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       FIRESTORE                              │
│   kb_entities  │  kb_relations  │  kb_timeline               │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Entity Pages │  │  Knowledge   │  │ Editorial Memory │
│ /entidad/*   │  │  Center      │  │ (pre-publicación)│
│ + Schema.org │  │ /admin/      │  │                  │
│              │  │ knowledge-   │  │                  │
│              │  │ center       │  │                  │
└──────────────┘  └──────────────┘  └──────────────────┘
```

## Módulos

### 1. Entity Extractor (`entity-extractor.ts`)
- **Entrada**: título + contenido + categoría de una noticia.
- **Salida**: lista de `ExtractedEntity` con id, slug, tipo, keywords.
- **Detección**:
  - Personas: patrones de cargos (presidente X, doctora Y) y verbos declarativos.
  - Lugares: diccionario de departamentos/municipios + patrones (barrio X, carretera Y).
  - Instituciones/hospitales/empresas/equipos/ríos/carreteras/festivales/infraestructura/proyectos/leyes: diccionarios especializados de Nicaragua.
  - Temas: keywords por tema (accidentes, volcanes, salud pública, etc.).

### 2. Knowledge Base Orchestrator (`index.ts`)
- `ingestArticle(db, input)`: procesa noticia publicada → actualiza grafo.
- `loadGraph(db)`: carga grafo completo con caché en memoria (TTL 5 min).
- `queryKnowledgeForArticle(db, ...)`: contexto histórico para una noticia nueva.

### 3. Entity Page Loader (`entity-page.ts`)
- `loadEntityPage(db, slug)`: entidad + timeline + relacionadas + noticias.
- `listAllEntities(db, limit)`: índice ordenado por articleCount.
- `generateEntitySchema(entity)`: JSON-LD según tipo (Person, Organization, Place, Event, Hospital, SportsTeam, etc.).

### 4. Internal Linking (`internal-linking.ts`)
- `generateInternalLinks(...)`: detecta entidades → propone enlaces (máx. 8).
- `applyInternalLinks(content, links)`: aplica enlaces al HTML sin duplicar y sin romper etiquetas `<a>` existentes.

### 5. Related Knowledge (`related-knowledge.ts`)
- `findRelatedByEntities(...)`: scoring por entidades compartidas.
- `generateRelatedLinks(...)`: formato compatible con `related_links` de Firestore.

### 6. Editorial Memory (`editorial-memory.ts`)
- `checkEditorialMemory(...)`: antes de publicar responde si ya se cubrió el tema, similares, cronología, riesgo de canibalización y enlaces sugeridos.

### 7. Knowledge Health (`knowledge-health.ts`)
- `getKnowledgeHealth(db)`: métricas de salud del grafo (entidades, huérfanas, cobertura, temas creciendo/olvidados).

### 8. Business Value (`business-value.ts`)
- `detectBusinessOpportunities(db)`: temas con suficiente contenido → micrositio/especial/serie/guía.

## Rutas

| Ruta | Tipo | Función |
|------|------|---------|
| `/entidad` | Pública | Índice de entidades con búsqueda |
| `/entidad/[slug]` | Pública | Página de entidad + Schema.org |
| `/admin/knowledge-center` | Admin | Centro de inteligencia visual |
| `/api/entity` | API pública | GET entidad o listado |
| `/api/admin/editorial-memory` | API admin | POST memoria editorial |
| `/api/admin/knowledge-health` | API admin | GET salud + oportunidades |
| `/api/admin/knowledge-linking` | API admin | POST internal/related links |
| `/api/admin/knowledge` | API admin | POST ingest/query (existente) |

## Modelo de Datos

### kb_entities
```typescript
{
  id: "hospital:hospitalberthacalderon",
  name: "Hospital Bertha Calderón",
  slug: "hospitalberthacalderon",
  type: "hospital",
  normalizedName: "hospitalberthacalderon",
  description: "Hospital materno infantil más grande de Nicaragua",
  articleCount: 12,
  firstSeen: "2025-03-01T...",
  lastSeen: "2026-08-01T...",
  keywords: ["hospital bertha calderón"],
  categoriasRelacionadas: ["Salud", "Nacionales"],
  metadata: { descripcion: "..." }
}
```

### kb_relations
```typescript
{
  id: "sourceId__targetId__type",
  sourceId: "persona:nestorpavon",
  targetId: "hospital:hospitalberthacalderon",
  type: "pertenece_a",
  strength: 5,
  articleIds: ["abc123", ...],
  lastSeen: "2026-08-01T..."
}
```

### kb_timeline
```typescript
{
  id: "entityId__articleId",
  entityId: "hospital:hospitalberthacalderon",
  articleId: "abc123",
  articleTitle: "...",
  articleSlug: "...",
  date: "2026-08-01T...",
  category: "Salud",
  summary: "..."
}
```

## Escalabilidad

- Caché en memoria del grafo (5 min TTL) evita lecturas repetidas.
- Consultas por entityId indexadas en Firestore.
- Timeline limitado a 30 entradas por página de entidad.
- Relaciones limitadas a 50 articleIds por relación.
- Diseño soporta decenas de miles de noticias sin degradación.
