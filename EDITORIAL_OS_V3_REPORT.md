# Editorial Operating System v3.0 — Reporte de Implementación

## Resumen Ejecutivo

Se implementó la versión 3.0 del Editorial Operating System (EOS) para Nicaragua Informate. El trabajo fue **incremental y no destructivo**: se añadieron módulos por encima de MENI v3.2 y del motor de home existente, sin reemplazar la arquitectura ni modificar el motor editorial estable. La meta es convertir la plataforma en un medio explicativo, útil y confiable para el ciudadano nicaragüense.

## Validación

| Comando | Resultado |
|---|---|
| `npm run build` | ✅ OK |
| `npx tsc --noEmit` | ✅ OK |
| `npm run test:merge` | ✅ OK (71 tests, 0 advertencias) |

---

## 1. Editorial Intelligence Layer

### Objetivo
Añadir una capa de inteligencia editorial que evalúe noticias en 4 dimensiones sin intervenir MENI: **Claridad**, **Contexto**, **Utilidad** y **Confianza**.

### Implementación
- Archivo: `lib/editorial-intelligence/index.ts`
- Función principal: `evaluateEditorialIntelligence(noticia)`
- Detecta si el lector puede responder: **Qué**, **Quién**, **Cuándo**, **Dónde** y **Significado**.
- Evalúa presencia de antecedentes, explicación e impacto.
- Valora metadatos de confianza (autor, descripción, keywords, imagen, pie de foto, puntos clave).
- Retorna un `valorEditorial` (0-100), dimensiones, fortalezas y oportunidades.

### Decisión
Se mantuvo MENI inalterado; esta capa es un wrapper externo disponible para ranking, reportes admin y futuras APIs.

---

## 2. Formato "Te Explicamos"

### Objetivo
Soportar artículos de tipo explicador, guía y análisis, además de la noticia tradicional.

### Implementación
- `lib/types.ts`: se añadieron `ArticleType` y `ExplainerFields` a la interfaz `Noticia`.
- `lib/explainer.ts`: valida explicadores, genera teasers y etiquetas (`Te explicamos`, `Guía`, `Análisis`).
- Los campos `contexto`, `antecedentes`, `conceptosClave` y `faq` preparan la estructura para futuros artículos explicativos.

### Decisión
Se añadió soporte de tipos y utilidades sin cambiar la base de datos. Los artículos existentes siguen siendo `noticia` por defecto.

---

## 3. Home Editorial Balance v3.0

### Objetivo
Evitar saturación de categorías en la home, especialmente Sucesos. En el top 10, máximo 30% de una misma categoría.

### Implementación
- `lib/home-ranking.ts`: `applyCategoryCap` ahora usa `maxPerCategory = 3` para el top 10 (30%).
- `app/page.tsx`: integra `checkBrandHealth` para loguear alertas de salud de marca.
- `components/HomePagePro.tsx` y `lib/home-balance.ts` ya implementaban diversidad por sección (`en portada`, `última hora`, `recientes`).

### Decisión
Se ajustó el tope y se añadieron alertas; no se reescribió la lógica de MENI ni de ranking.

---

## 4. Nicaragua Informate Útil

### Objetivo
Crear un centro visible de contenido práctico (trámites, economía, vida diaria, turismo) que complemente las noticias.

### Implementación
- Nueva ruta: `app/util/page.tsx` (SSR).
- Agrupa guías de `lib/evergreen.ts` en secciones: Trámites, Economía, Vida diaria, Turismo.
- `components/pro/SidebarRedesign.tsx`: añadí un panel prominente con enlace a `/util`.

### Decisión
La página se genera estáticamente desde el build; usa los estilos existentes de `home-redesign.css`. Sirve como puente entre noticias y guías evergreen.

---

## 5. Ciclo de Vida del Contenido

### Objetivo
Clasificar contenido en etapas y detectar oportunidades de convertir noticias a guías o explicadores.

### Implementación
- Archivo: `lib/content-lifecycle.ts`
- Funciones: `classifyContentLifecycle` y `findConversionOpportunities`
- Etapas: `nuevo`, `creciendo`, `estable`, `actualizar`, `evergreen`.
- Detecta potencial evergreen por palabras clave y tráfico.
- Detecta potencial explicador por estructuras `qué es`, `cómo`, `por qué`.

### Decisión
Las reglas son heurísticas basadas en edad, vistas y temas. Se usan en reporting; no se hacen conversiones automáticas de contenido.

---

## 6. Distribución Inteligente por Canales

### Objetivo
Recomendar canales (Telegram, WhatsApp, Facebook, Newsletter) y adaptar el mensaje a cada uno.

### Implementación
- Archivo: `lib/distribution-intelligence.ts`
- `recommendDistribution(noticia)` prioriza canales según categoría, tráfico y calidad.
- Genera formatos distintos para cada canal (alerta corta para Telegram, mensaje compartible para WhatsApp, debate para Facebook, resumen para Newsletter).

---

## 7. Análisis de Audiencia

### Objetivo
Ir más allá de las vistas: detectar contenido que construye audiencia, contenido viral, recomendable y a revisar.

### Implementación
- Archivo: `lib/audience-intelligence.ts`
- `analyzeAudience(noticias)` devuelve 4 segmentos.
- `categoryHabitMetrics` ofrece conteo y promedio de vistas por categoría.

### Decisión
Los segmentos usan edad, vistas y palabras clave evergreen como proxy de fidelización.

---

## 8. Revenue Intelligence (Base)

### Objetivo
Detectar contenido con potencial comercial sin automatizar ventas.

### Implementación
- Archivo: `lib/revenue-intelligence.ts`
- `detectRevenueOpportunities` evalúa tráfico y calidad.
- Asocia categorías con verticales comerciales (trámites, turismo, economía, deportes, tecnología, salud, educación).

### Decisión
Solo detecta oportunidades y genera señales. No integra pasarelas ni envía propuestas.

---

## 9. Calidad de Marca y Alertas

### Objetivo
Proteger la identidad del medio, evitando que Sucesos o categorías negativas dominen la home.

### Implementación
- Archivo: `lib/brand-health.ts`
- `checkBrandHealth(homeNoticias)` evalúa el top 10.
- Alertas de advertencia si `Sucesos` >= 50% y crítica si >= 65%.
- Alerta si `Nacionales` es demasiado bajo.
- Integrado en `app/page.tsx` para auditoría en cada regeneración.

---

## Archivos Modificados

- `lib/types.ts` — `ArticleType`, `ExplainerFields`.
- `lib/home-ranking.ts` — `applyCategoryCap` a 3 noticias en top 10.
- `app/page.tsx` — importa `checkBrandHealth` y registra alertas.
- `components/pro/SidebarRedesign.tsx` — enlace a `/util`.

## Archivos Nuevos

- `lib/editorial-intelligence/index.ts`
- `lib/explainer.ts`
- `lib/content-lifecycle.ts`
- `lib/distribution-intelligence.ts`
- `lib/audience-intelligence.ts`
- `lib/revenue-intelligence.ts`
- `lib/brand-health.ts`
- `app/util/page.tsx`

## Riesgos Identificados

1. **Regresión en Home**: El tope de 3 noticias por categoría puede cambiar el orden. Mitigado: los tests canónicos y `test:merge` pasan.
2. **Páginas no vinculadas**: `/util` está vinculada desde el sidebar, pero aún no aparece en el menú principal. Se recomienda añadirla al header en el próximo sprint.
3. **Heurísticas abiertas**: La inteligencia editorial, ciclo de vida y revenue usan heurísticas. Requieren validación con datos reales en los próximos 30 días.
4. **Campos explainer vacíos**: Los artículos existentes no usan `articleType`. La UI de `Te explicamos` requiere flujo de admin para crearlos.

## Próximos Pasos Recomendados

1. Añadir `articleType` al formulario de creación/edición de noticias en el admin.
2. Diseñar el componente `ExplainerBadge` para mostrar etiquetas `Te explicamos` en tarjetas de noticias.
3. Correr `diagnose-homepage.mjs` con datos reales y ajustar umbrales de `brand-health.ts` si es necesario.
4. Exponer endpoints de reporting (`/api/admin/eos`) para que el equipo editorial consulte scores, ciclo de vida y oportunidades.
5. Integrar `recommendDistribution` con el cron de publicación en Telegram/WhatsApp/Newsletter.

## Conclusión

EOS v3.0 entrega una nueva capa de inteligencia editorial, un formato explicativo, una home más equilibrada, un centro de contenido útil, ciclo de vida, distribución, audiencia, revenue y alertas de marca. Todo quedó validado con build, type-check y tests; no se modificó MENI v3.2 ni se rompió funcionalidad existente.
