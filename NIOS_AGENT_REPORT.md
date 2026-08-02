# NIOS Agent — Reporte Técnico

## 1. Objetivo

Convertir NIOS en un Agente Editorial Operativo que vigila, prioriza, recomienda, recuerda y anticipa. No solo muestra datos: dice qué hacer, cuándo hacerlo y por qué.

## 2. Funciones del agente

| Función | Descripción | Fase |
|---------|-------------|------|
| Vigilar | Revisar contenido, categorías, tráfico, SEO y entidades. | Watcher |
| Automatizar | Generar briefing diario con acciones concretas. | Daily Automation |
| Misionar | Crear misiones diarias con impacto, dificultad y prioridad. | Mission Engine |
| Distribuir | Preparar cola de publicación por canal. | Distribution Agent |
| Reciclar | Detectar contenido con potencial de guía, especial o actualización. | Content Recycler |
| Recordar | Construir entidades con contexto y cronología. | Entity Brain |
| Aprender | Descubrir patrones de titulares, categorías, longitud y horario. | Learning System |
| Negociar | Detectar categorías y temas con potencial comercial. | Business Brain |
| Reportar | Generar morning report ejecutivo. | Morning Report |

## 3. Componentes del agente

- `lib/nios/watcher/index.ts` — detección de alertas críticas y medias.
- `lib/nios/daily-automation/index.ts` — briefing del día.
- `lib/nios/mission-engine/index.ts` — misiones con tareas accionables.
- `lib/nios/distribution-agent/index.ts` — cola de textos por canal.
- `lib/nios/content-recycler/index.ts` — sugerencias de reciclaje.
- `lib/nios/entity-brain/index.ts` — enriquecimiento de entidades.
- `lib/nios/learning-system/index.ts` — insights de rendimiento.
- `lib/nios/business-brain/index.ts` — señales de negocio con potencial.
- `lib/nios/morning-report/index.ts` — resumen ejecutivo diario.
- `lib/nios/v4-report.ts` — agregador del agente.
- `components/nios/NiosV4Dashboard.tsx` — UI con 8 pestañas.

## 4. Ciclo operativo

1. `getDailyEditorReport` carga noticias y guías.
2. `buildV4Report` ejecuta todos los módulos del agente.
3. El dashboard `/admin/nios` renderiza el Agente V4 con tabs.
4. El editor revisa Morning, Alertas, Misiones y ejecuta acciones.

## 5. Vigilancia 24 horas

El Watcher detecta:
- Tráfico desbalanceado por categoría.
- Categorías débiles.
- Noticias publicadas hoy sin distribución.
- Noticias con tráfico sin enlaces internos.
- Picos de noticias creciendo.
- Problemas SEO masivos.
- Entidades con cobertura creciente.

## 6. Criterio de éxito

Una sola persona puede operar Nicaragua Informate porque NIOS funge como asistente editorial permanente.

## 7. Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Aprobado |
| `npm run build` | ✅ Aprobado |
| `npm run test:merge` | ✅ Aprobado |

## 8. Próximos pasos

- Persistir la cola de distribución en Firestore.
- Conectar acciones del dashboard con endpoints ejecutables.
- Agregar notificaciones push del morning report.
- Permitir al editor aprobar o rechazar alertas del watcher.
