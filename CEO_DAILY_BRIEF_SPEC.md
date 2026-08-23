# CEO Daily Brief — Especificación y decisiones

## Base de datos
- Muestra: 279 artículos.
- Vistas totales: 18.567.
- Mediana de vistas: 24.
- Variables bloqueadas: tráfico por fuente (Facebook/Google/Telegram), velocidad inicial, enlaces internos, tiempo hasta primera visita → `NO_DATA`.

## Decisiones (máximo 5)

### 1. Concentración de audiencia en Sucesos
- **priority:** P0
- **observation:** Sucesos concentra el mayor volumen de vistas.
- **evidence:** 84 artículos aportan 11.640 vistas (62.7% del total).
- **diagnosis:** Existe una clara concentración de audiencia, pero no hay evidencia suficiente para afirmar que la categoría sea la causa del tráfico. Pueden actuar autor, momento o distribución.
- **action:** Antes de aumentar producción en Sucesos, ejecutar un experimento controlado que compare rendimiento por categoría a igualdad de condiciones.
- **confidence:** EVIDENCE_BACKED

### 2. El TOP 20 sostiene una proporción desproporcionada del tráfico
- **priority:** P0
- **observation:** Pocos artículos acumulan la mayor parte de las vistas.
- **evidence:** 20 artículos (el 7.2% del total) suman 9786 vistas, el 52.7% del total.
- **diagnosis:** El inventario depende de un número reducido de éxitos. Este riesgo de concentración es alto para la sostenibilidad del tráfico.
- **action:** Identificar qué características comparten esos 20 artículos (categoría, palabras, título, fecha) y replicarlas con control.
- **confidence:** EVIDENCE_BACKED

### 3. Bajo rendimiento de 20 artículos
- **priority:** P1
- **observation:** Existe un conjunto de artículos con vistas cercanas a cero.
- **evidence:** 0 artículos tienen 0 vistas y el BOTTOM 20 suma solo 108 vistas.
- **diagnosis:** Contenido publicado sin tracción. Puede deberse a antigüedad, competencia temática o falta de distribución.
- **action:** Auditar el BOTTOM 20 para archivar, fusionar con artículos relacionados o actualizar si aún son relevantes.
- **confidence:** EVIDENCE_BACKED

### 4. Aprobación MENI no asegura tráfico
- **priority:** P1
- **observation:** Artículos con alta calificación MENI pueden tener pocas vistas.
- **evidence:** 24 artículos con scoreMeni ≥ 95 están por debajo de la mediana (24 vistas).
- **diagnosis:** MENI mide calidad editorial, no alcanza ni viralidad. El paso de calidad es necesario pero no suficiente para tráfico.
- **action:** Revisar SEO de título y meta descripción, y evaluar canales de distribución para los aprobados con bajo rendimiento.
- **confidence: HEURISTIC**

### 5. No usar longitud de artículo como proxy de calidad
- **priority:** P2
- **observation:** El promedio de palabras del TOP 20 y del BOTTOM 20 es comparable.
- **evidence:** TOP 20 promedio 615 palabras; BOTTOM 20 promedio 642 palabras.
- **diagnosis:** No existe evidencia de que artículos más largos obtengan más vistas en esta muestra.
- **action:** Eliminar cualquier regla o incentivo de longitud mínima hasta disponer de un análisis causal controlado.
- **confidence: INSUFFICIENT_DATA**

## Estados de datos respetados
- `NO_DATA`: tráfico por fuente, velocidad inicial, tiempo hasta primera visita, enlaces internos.
- `INSUFFICIENT_DATA`: correlación entre longitud y vistas, causalidad de categoría sobre vistas.
- `EVIDENCE_BACKED`: concentración del tráfico, liderazgo de Sucesos, existencia de bajo rendimiento.

## Validación Misión 5
| Decisión | Reclasificación | Razón |
| --- | --- | --- |
| 1. Concentración Sucesos | HEURISTIC | Valida para el snapshot 281; no demuestra causalidad ni extrapolación a 307. |
| 2. TOP 20 concentración | HEURISTIC | EVIDENCE_BACKED para 281, pero depende de que 281 sea representativo. |
| 3. Bajo rendimiento | EVIDENCE_BACKED | Existe en el dataset. |
| 4. MENI ≠ tráfico | HEURISTIC | Relación observada en 281; sin experimento no es causal. |
| 5. Longitud no es proxy | INSUFFICIENT_DATA | Diferencia pequeña; faltan controles. |
- `UNIVERSE_307 = NOT_VERIFIED`.

## Corrección Misión 6 — Universos de datos
| Regla anterior | Corrección |
| --- | --- |
| 23,952 como total del sitio | `23,952 = FACEBOOK_VIEWS` |
| 6.8k / 4.3k / 678 como vistas | `GA4_ACTIVE_USERS_30D / 7D / 1D` |
| GSC 0 impresiones | `GSC — ACCESS_BLOCKED; no se puede determinar` |
| Decisiones P0 basadas en 23,952 | Invalidadas; requieren fuente correcta |
- Ninguna decisión del CEO Daily Brief puede mezclar `FACEBOOK_VIEWS`, `GA4_ACTIVE_USERS` y `ARTICLE_VIEWS` como si fueran la misma métrica.