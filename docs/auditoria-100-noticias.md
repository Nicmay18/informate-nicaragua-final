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

## Resultados — ejecución 2026-10-10 (commit fbe92034; re-ejecutado y reconciliado en 91b6f144)

- Muestra: **100 notas** (Sucesos 29, Nacionales 30, Internacionales 18,
  Deportes 13, Tecnología 5, Espectáculos 5).
- Errores de evaluación: 0.
- Aprobadas (`aprobado=true`): **86**.

Matriz `aprobado` × decisión (suma = 100):

| | PUBLICAR | PUBLICAR_CON_CAMBIOS | REVISAR | BLOQUEAR | Total |
|---|---|---|---|---|---|
| `aprobado=true` | 76 | 0 | 10 | 0 | **86** |
| `aprobado=false` | 0 | 11 | 2 | 1 | **14** |
| **Total** | **76** | **11** | **12** | **1** | **100** |

Reconciliación: las 86 aprobadas = 76 `PUBLICAR` + 10 `REVISAR` (aprobada pero
con WARNING → revisión humana). Los 11 `PUBLICAR_CON_CAMBIOS` son todas
notas no aprobadas (score 88–89). No hay discrepancia: una versión anterior
de este informe sumaba 76+11 como si ambas fueran "aprobadas" — incorrecto.

### Hallazgos frecuentes

| Código | N/100 | Naturaleza |
|---|---|---|
| FALTAN_KEYWORDS | 86 | **Estructural**: 0/100 notas persisten `palabrasClave` ni `keywords` — la ruta de guardado nunca puebla el campo. La deducción (−2 pts, módulo SEO) se emite como RECOMMENDATION en las 86 notas evaluadas tal cual se guardaron. Las 14 restantes NO lo muestran porque `runMeni` re-evalúa las notas no aprobadas tras `autoCorrectNoticia`, que **autogenera `palabrasClave`/`keywords`** (`lib/meni/autocorrect.ts` ~L191): en la segunda evaluación el hallazgo ya no existe. Corolario: la autocorrección arregla el hueco en memoria pero no persiste el campo (0/100 persistidas). |
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
