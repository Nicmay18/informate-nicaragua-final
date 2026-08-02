# NIOS Executive Dashboard — Rediseño del Panel de Directorio

**Fecha:** auto-generado con el reporte diario
**Rama:** master
**Versión:** NIOS v2.0 Executive

## 1. Objetivo

Transformar el panel técnico del `Daily Editor` de NIOS en un **Centro de Control Ejecutivo** estilo consola de Directorio: visual, card-based, con KPIs, semáforos, acciones priorizadas y decisiones claras. El dashboard responde a las cuatro preguntas operativas:

- ¿Qué debo hacer?
- ¿Por qué?
- ¿Cuánto gano si lo hago?
- ¿Cuánto pierdo si lo dejo pasar?

## 2. Módulos entregados

| # | Módulo | Función principal |
|---|--------|-------------------|
| 1 | **CEO Dashboard** | KPIs de tráfico, producción, categorías, guías y salud editorial en tarjetas visuales. |
| 2 | **Centro de Prioridades** | Top 5 tareas accionables con estrellas, impacto y botón de acción. |
| 3 | **Google Radar** | Semáforos de salud para Discover, News, Search Console, SEO, EEAT, Schema, Indexación, Imágenes y CWV. |
| 4 | **Sala de Redacción** | Estado de noticias hoy, programadas, sin revisar, sin imagen/meta/keyword, con auditoría por artículo. |
| 5 | **Centro de Oportunidades** | Top 5 oportunidades SEO/negocio con demanda, competencia, ganancia SEO y tiempo estimado. |
| 6 | **Mapa de Categorías** | Barras visuales de volumen, vistas, crecimiento y nivel de salud por categoría. |
| 7 | **Auditoría Automática de Noticias** | Estado por artículo (excellent/good/needs/critical) y lista de elementos faltantes. |
| 8 | **Inteligencia de Negocio** | Categorías rentables, guías, temas recurrentes y contenido a actualizar/convertir. |
| 9 | **Centro de Distribución** | Canales sociales (Facebook, Telegram, WhatsApp, Newsletter, Push, X) con conteo publicado/pendiente/programado. |
| 10 | **CEO Report** | Resumen diario con Health Score, acciones recomendadas y proyección de tráfico. |

## 3. Archivos creados o modificados

### Creados
- `lib/nios/executive-report.ts` — Motor de cálculo del dashboard ejecutivo.
- `components/nios/NiosExecutiveDashboard.tsx` — Componente visual del dashboard.

### Modificados
- `lib/nios/daily-editor.ts` — Añade el campo `executive: ExecutiveDashboard` al `DailyEditorReport` y lo computa con `buildExecutiveDashboard`.
- `app/admin/nios/page.tsx` — Renderiza `NiosExecutiveDashboard` en lugar del `DailyEditorPanel` heredado.

## 4. Datos reales y gracia ante fallas

- Todos los KPIs se computan desde `Noticia[]` (Firestore), guías evergreen y los módulos NIOS existentes.
- No se inventan datos de tráfico: los campos sin soporte (`clics`, `tiempo promedio de lectura`, `vistas 24h exactas`, `Core Web Vitals`) se muestran como `—` o en gris, nunca con valores falsos.
- Si Firestore falla, `daily-editor.ts` recolecta los errores y `NiosExecutiveDashboard` muestra un estado `Datos no disponibles`.

## 5. Diseño visual

- Tarjetas con bordes redondeados, sombras sutiles y color semántico.
- Navegación por pestañas: **CEO Dashboard**, **Google Radar**, **Sala de Redacción**, **Centro de Distribución**.
- Iconografía con `lucide-react`.
- Score rings para Health, Google Readiness, Revenue, EEAT y Discover.
- Barras de progreso para el mapa de categorías.
- Totalmente responsivo con Tailwind CSS.

## 6. Principio: decisiones, no datos

Cada tarjeta prioritaria incluye:
- **Qué hacer** (título).
- **Sobre qué** (target).
- **Impacto** (lectores, CTR, equilibrio de portada, etc.).
- **Botón de acción** (Revisar ahora, Distribuir, Crear guía, Planificar nota, Actualizar).

## 7. Validaciones finales

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Aprobado |
| `npm run build` | ✅ Aprobado |
| `npm run test:merge` | ✅ Aprobado (type-check + 71 tests + lint) |

## 8. Consideraciones

- El componente heredado `DailyEditorPanel.tsx` sigue en el repositorio; la nueva página lo reemplaza para evitar romper referencias.
- Ningún motor core (MENI, EOS, Home Ranking, SEO, frontend público) fue modificado.
- El dashboard consume solo los datos que NIOS ya tiene; no agrega persistencia ni arquitectura nueva.

## 9. Próximos pasos sugeridos

- Conectar métricas reales de Search Console para CWV, CTR y vistas 24h.
- Agregar endpoints de publicación social para que los botones de distribución ejecuten acciones reales.
- Tomar capturas del dashboard en `/admin/nios` y añadirlas a este reporte.
