# Informe Forense — CEO Agent Editorial Executive

## 1. Objetivo
Convertir el CEO Agent de un panel de métricas en un **agente ejecutivo editorial** que interpreta datos existentes (MENI, tráfico, GSC, GA4, Facebook, indexing) y emite decisiones accionables con urgencia, evidencia y alertas, sin inventar datos ni crear infraestructura nueva.

## 2. Diagnóstico forense del estado anterior
- `lib/ceo-agent.ts` mezclaba análisis de tráfico con decisiones editoriales sin separar claramente la **calidad editorial** del **interés del lector**.
- Existían métricas decorativas (score compuesto, listas de métricas sin acción) que no llevaban a una decisión concreta.
- El UI anterior (`app/admin/ceo-agent/page.tsx`) priorizaba mostrar datos en lugar de responder: *"¿qué hacemos con esta nota?"*.
- La API `/api/admin/ceo-agent/daily` entregaba un resumen de tráfico sin priorizar acciones.

## 3. Rediseño ejecutado

### 3.1 Motor de decisiones (`lib/ceo-agent.ts`)
- Nuevos tipos: `CEOAction`, `CEOUrgency`, `DataAvailability`, `ReaderInterest`, `CEORisk`, `CEOAnalysis`, `CEOAlert`, `CEOBriefAction`, `CEOBriefContext`.
- `analyzeForPublication(article, context)` ahora devuelve:
  - `action` (PUBLISH, IMPROVE_BEFORE_PUBLISH, REWRITE, UPDATE_EXISTING, DO_NOT_PUBLISH, etc.)
  - `urgency` (CRITICAL, HIGH, MEDIUM, LOW)
  - `summary`, `whatIsHappening`, `whyItMatters`, `whatToDo`, `whatNotToDo`
  - `evidence`, `risk`, `alert`, `relatedArticles`, `existingArticle`, `dataStatus`
- Reglas clave:
  - MENI es autoridad editorial; el CEO la respeta (`aprobadoMeni`, `scoreMeni`).
  - Tráfico real se lee de `traffic_daily` / `traffic_log`.
  - GSC se usa solo cuando hay datos reales.
  - Nunca se inventan queries, impresiones ni clics.
  - Decisión de contenido caído: edad > 30 días, vistas históricas altas, vistas recientes bajas → `UPDATE_EXISTING`.

### 3.2 Brief diario (`getCEODailyBrief`)
- Genera máximo 5 acciones priorizadas.
- Detecta:
  - Contenido de servicio con tráfico real → `ADD_SERVICE_INFORMATION`.
  - Titular con alto impresiones y bajo CTR → `IMPROVE_HEADLINE`.
  - Artículos de servicio antiguos con muchas vistas → `UPDATE_EXISTING`.
  - Eventos con alto interés reciente → `WRITE_FOLLOWUP`.
  - Artículo más visto sin sugerencias previas → `RECIRCULATE`.

### 3.3 UI ejecutiva (`app/admin/ceo-agent/page.tsx`)
- Reemplazó el dashboard de métricas por:
  - Lista de acciones de hoy con urgencia y evidencia.
  - Sección de alertas críticas.
  - Oportunidades.
  - Selector de artículos y análisis con explicación ejecutiva.
- Muestra `whatToDo` / `whatNotToDo`, alertas, artículo existente, estado de datos.

### 3.4 APIs
- `POST /api/admin/ceo-agent/analyze` devuelve `CEOAnalysis` (sin cambios estructurales, compatibles con el nuevo motor).
- `GET /api/admin/ceo-agent/daily` devuelve `{ actions, articles, dataStatus }` basado en el brief diario.

## 4. Cobertura de pruebas (`lib/ceo-agent.test.ts`)
- 28 tests, todos pasan.
- Casos cubiertos:
  - Artículo excelente, débil, sin valor, duplicado, funcionando, cayendo.
  - GSC con alto CTR, bajo CTR, sin datos.
  - Contenido de servicio, titular largo, MENI rechazado / no aprobado.
  - Sin datos y acceso bloqueado.
  - `findRelatedArticles`, `detectGoogleOpportunities`, `getCEODailyBrief`.
  - Integración real con Firestore (omitida si no hay credenciales).

## 5. Verificación técnica
| Paso | Resultado |
|------|-----------|
| `npm run type-check` | OK |
| `npm run lint` | OK |
| `npx vitest run lib/ceo-agent.test.ts` | 28/28 |
| `npm run build` | OK |

## 6. Límites respetados
- No se tocó MENI, editorial core, canónico, taxonomía ni pipeline de publicación.
- No se crearon nuevas colecciones, cron jobs, workers ni dependencias.
- No se duplicó GSC, GA4, tráfico ni MENI.
- No se hicieron `git add`, `commit` ni `push`.

## 7. Recomendaciones de uso
1. El panel `/admin/ceo-agent` debe revisarse todas las mañanas para ejecutar las 5 acciones del brief.
2. Si una nota recibe `DO_NOT_PUBLISH` con urgencia `CRITICAL`, descartar o reescribir; no maquillar.
3. Para notas `UPDATE_EXISTING`, actualizar datos y contexto antes de recircular.
4. Las alertas de GSC requieren confirmar que los datos GSC sean reales; el agente no inventa señales.

## 8. Conclusión
El CEO Agent ahora opera como una capa ejecutiva editorial: consume datos existentes, emite decisiones con evidencia y urgencia, y presenta un UI que impulsa la acción en lugar de la observación. Todos los controles de calidad (type-check, lint, tests, build) pasan en producción.
