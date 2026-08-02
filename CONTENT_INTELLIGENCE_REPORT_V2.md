# Content Intelligence V2 — Reporte Técnico

## 1. Objetivo

Analizar diariamente todas las noticias para detectar patrones, oportunidades y problemas editoriales. No limitarse a estadísticas; generar acciones.

## 2. Detecciones implementadas

| Detección | Descripción |
|-----------|-------------|
| Noticias repetidas | Grupos con palabras clave muy similares. |
| Canibalización SEO | Misma keyword en más de 2 noticias. |
| Temas abandonados | Noticias con <10 vistas y >90 días. |
| Potencial evergreen | Temas de cómo/requisitos/pasos/costo. |
| Noticias para actualizar | >30 días y >20 vistas. |
| Sin enlaces internos | No tiene `related_links`. |
| Noticias con poco contexto | <200 palabras. |
| Demasiado cortas | <150 palabras. |
| Demasiado largas | >1200 palabras. |
| Pocas vistas | <5 vistas. |
| Creciendo | >30 vistas en 7 días. |
| Virales | >100 vistas. |
| Históricas | >1 año. |
| Candidatas a portada | Score combinado de categoría, calidad e imagen. |

## 3. Arquitectura

- **Módulo:** `lib/nios/content-intelligence/index.ts`
- **Entrada:** `Noticia[]` y `EvergreenArticle[]`
- **Salida:** `ContentIntelligence` con listas estructuradas.

## 4. Cálculo de portada

Score heurístico basado en:
- Categoría: +20 Nacionales, -15 Sucesos.
- Vistas: +1 por cada 10 vistas (hasta 30).
- Imagen: +10 si tiene imagen válida.
- Puntos clave: +10.
- MENI `scoreCalidad`: +20 si >=85.

## 5. Integración

- Usado por `copilot`, `mission-center` y `v3-report`.
- Renderizado en `NiosV3Dashboard` pestaña **Content Intelligence**.

## 6. Validación

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Aprobado |
| `npm run build` | ✅ Aprobado |
| `npm run test:merge` | ✅ Aprobado |

## 7. Reglas

- No se inventan datos de tráfico: se usan `vistas` de Firestore.
- Si un campo no está disponible (ej. `palabras`), se muestra vacío, no se asume.

## 8. Próximos pasos

- Comparar n-gramas para duplicados más precisos.
- Agregar detección de noticias sin seguimiento basada en entidades.
- Integrar `smart-links` para sugerir contexto faltante.
