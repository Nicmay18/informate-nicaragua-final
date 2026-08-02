# NIOS AI Copilot — Reporte Técnico

## 1. Objetivo

Convertir NIOS en un Copiloto Editorial que responda 11 preguntas operativas de forma automática, usando solo reglas internas y datos del repositorio. No se utilizan servicios externos de IA.

## 2. Preguntas cubiertas

1. ¿Qué noticia merece portada?
2. ¿Qué noticia debe impulsarse nuevamente?
3. ¿Qué noticia necesita seguimiento?
4. ¿Qué noticia debe convertirse en guía?
5. ¿Qué categoría está debilitándose?
6. ¿Qué tema está creciendo?
7. ¿Qué autor obtiene mejores resultados?
8. ¿Qué contenido conviene actualizar?
9. ¿Qué noticias deben enlazarse entre sí?
10. ¿Qué contenido debería publicarse hoy?
11. ¿Cuál es el Editorial Score general?

## 3. Arquitectura

- **Módulo:** `lib/nios/copilot/index.ts`
- **Entrada:** `Noticia[]` y `EvergreenArticle[]`
- **Mecanismo:** reglas que consultan otros módulos V3:
  - `content-intelligence` para portada, impulso, actualización y evergreen.
  - `business` para temas crecientes y autores top.
  - `editorial-memory` para seguimientos.
  - `category-health` para categorías débiles.
  - `smart-links` para enlaces internos.
  - `editorial-score` para salud general.
- **Salida:** `CopilotRecommendation[]` con `question`, `answer`, `slug`, `title`, `action` y `priority`.

## 4. Criterios de prioridad

- `critical`: categoría debilitándose o score < 60.
- `high`: portada, impulso, plan diario.
- `medium`: guía, seguimiento, actualización.
- `low`: autor, enlaces.

## 5. Integración

- `buildV3Report` en `lib/nios/v3-report.ts` invoca `runCopilot`.
- `daily-editor.ts` incluye `v3` en `DailyEditorReport`.
- `/admin/nios` muestra las recomendaciones en la pestaña **AI Copilot** del `NiosV3Dashboard`.

## 6. Validación

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Aprobado |
| `npm run build` | ✅ Aprobado |
| `npm run test:merge` | ✅ Aprobado (71 tests + lint) |

## 7. Reglas clave

- No inventar datos: si no hay noticias con tráfico o relaciones, el copiloto omite la recomendación.
- Toda recomendación debe vincularse a un `slug` o categoría real del repositorio.
- Las acciones son ejecutables: "Fijar en portada", "Volver a distribuir", "Crear guía evergreen", "Planificar nota", "Actualizar noticia", "Agregar enlace interno".

## 8. Próximos pasos

- Conectar los botones de acción con endpoints reales de publicación/actualización.
- Agregar ponderación de frescura y MENI score en la selección de portada.
- Permitir al editor marcar recomendaciones como "aplicadas" para aprender del feedback.
