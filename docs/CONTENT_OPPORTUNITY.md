# Motor de Oportunidades de Contenido — NIOS CEO v2

Genera ideas de contenido basadas en datos de tráfico, SEO y actualidad.

## Fuentes de oportunidad

| Fuente | Dato | Oportunidad |
|--------|------|-------------|
| GSC | Query con impresiones altas y CTR bajo | Artículo de aterrizaje optimizado. |
| GSC | Query sin contenido propio | Nuevo artículo de búsqueda. |
| GA4 | Recirculación baja | Mejorar bloques "También te puede interesar". |
| Firestore `noticias` | Categoría con baja cobertura | Llenar vacío editorial. |
| Fechas | Eventos recurrentes próximos | Contenido programado (seasonal). |
| Competidores (RSS) | Tema no cubierto | Detectar ángulo diferencial. |

## Fórmula de prioridad

```
priorityScore = (
  searchDemand * 0.30 +
  businessRelevance * 0.25 +
  editorialFit * 0.20 +
  competitionGap * 0.15 +
  revenuePotential * 0.10
) * 100
```

`businessRelevance` = impacto para nicaragüenses.  
`editorialFit` = alineación con MENI v1.1.  
`competitionGap` = 1 - (contenido existente / demanda).  
`revenuePotential` = CPM/AdSense estimado.

## Implementación propuesta

- Archivo: `lib/nios/intelligence/content-opportunity.ts`
- Consume `lib/analytics/traffic-reader.ts`, GSC (cuando esté conectado) y `lib/nios/intelligence/competitor-monitor.ts`.
- Devuelve `ContentOpportunity[]` con `title`, `angle`, `priorityScore`, `category`, `module`.
- Integrar en `/panel/nios/editorial-strategy` y en el `dailyBrief.hoy`.

## Guardias

- No inventar datos.
- No crear contenido sensacionalista.
- Cada propuesta debe incluir `source`, `confidence` y `expectedImpact`.

