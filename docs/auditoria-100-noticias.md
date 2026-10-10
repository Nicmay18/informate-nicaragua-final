# Auditoría de 100 noticias reales — MENI

Procedimiento reproducible exigido por el congelamiento **Editor IA V4.1 LTS**
(README § "Editor IA V4.1 LTS — Motor congelado"). Antes de declarar el motor
estable se audita una muestra real de 100 notas publicadas.

## Procedimiento

1. Selección: `noticias` con `estado == 'publicado'`, ordenadas por `fecha` desc,
   `limit(100)` — muestra real de producción, sin inventar noticias.
2. Campos evaluados: `titulo`, `resumen`, `contenido`, `categoria`, `autor`,
   `fecha`, `slug`, `imagen`, `palabrasClave`.
3. Cada nota se evalúa con `runMeni` (misma función de producción).
4. Se registra: score, `aprobado`, decisión del `editorialVerdict`, severidades
   y códigos de hallazgos.
5. Clasificación: decisiones vs resultado esperado editorialmente; falsos
   positivos/negativos marcados para revisión humana.

## Resultados — ejecución 2026-10-10 (commit fbe92034)

- Muestra: **100 notas** (Sucesos 29, Nacionales 30, Internacionales 18,
  Deportes 13, Tecnología 5, Espectáculos 5).
- Errores de evaluación: 0.
- Aprobadas (score ≥ 90): **86**.

| Decisión | N | Interpretación |
|---|---|---|
| PUBLICAR | 76 | aprobadas sin WARNING/BLOCKER |
| PUBLICAR_CON_CAMBIOS | 11 | no aprobadas con recomendaciones accionables |
| REVISAR | 12 | WARNINGs reales que exigen revisión humana |
| BLOQUEAR | 1 | defecto mecánico real en nota publicada |

### Hallazgos frecuentes

| Código | N/100 | Naturaleza |
|---|---|---|
| FALTAN_KEYWORDS | 86 | **Estructural**: 0/100 notas persisten `palabrasClave` — el campo no se puebla en la ruta de guardado. Deducción de −2 pts informativa; ya no degrada veredicto. |
| ANTI_CLICKBAIT_TITULO | 60 | Heurística de advertencia; tasa de falso positivo alta sobre títulos publicados. Candidata a revisión editorial (no silenciar). |
| RECOMENDACION_EDITORIAL | 45 | Acciones del brain en notas no aprobadas |
| EVIDENCIA_REQUERIDA | 18 | Perfil: evidencia esperada por categoría |
| MENI_SCORE_THRESHOLD | 13 | Banda 80–89 informativa (INFO, no bloquea) |
| QUALITY_GATE_* | ~15 | Defectos mecánicos/contradicción/sensacionalismo — WARNINGs reales |

### Casos para revisión humana (WARNING real)

- 12 notas `REVISAR`: sensacionalismo en Sucesos (títulos con "muere"), defectos
  mecánicos, contradicciones factuales — corresponde a editor humano validar si
  son verdaderos positivos (clasificación FP/FN pendiente de revisión).
- 1 nota `BLOQUEAR`: "Camilo Zapata y Otto de la Rocha, dos voces de Nicaragua"
  — defecto mecánico real en contenido publicado.

## Estado

- Ejecución local sobre datos reales de producción (solo lectura).
- La clasificación definitiva FP/FN de los WARNINGs requiere revisión humana
  del equipo editorial — pendiente por definición.
- Re-ejecutar tras cualquier cambio al motor LTS; adjuntar resultados a la
  excepción LTS correspondiente.
