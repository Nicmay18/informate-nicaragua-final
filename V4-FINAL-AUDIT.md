# V4-FINAL-AUDIT.md — Auditoría Final Release Candidate

**Fecha:** 17 de julio, 2026  
**Sistema:** Editor IA V4 — EditorJefeEngine  
**Estado:** Release Candidate (congelada)  
**Veredicto:** APROBADA PARA VALIDACIÓN EDITORIAL EN PRODUCCIÓN

---

## 1. Arquitectura

### 1.1 Árbol de dependencias

```
pipeline.ts
├── extractor.ts
│   ├── category-detector.ts
│   └── types.ts
├── normalizador.ts
│   └── types.ts
├── consistency-engine.ts
│   └── types.ts
├── profile-loader.ts
│   ├── profiles/sucesos.ts
│   ├── profiles/nacionales.ts
│   ├── profiles/internacionales.ts
│   ├── profiles/clima.ts
│   ├── profiles/economia.ts
│   ├── profiles/politica.ts
│   ├── profiles/tecnologia.ts
│   ├── profiles/deportes.ts
│   ├── profiles/salud.ts
│   ├── profiles/servicio.ts
│   ├── profiles/espectaculos.ts
│   └── types.ts
├── engine.ts
│   ├── explainability.ts
│   │   └── types.ts
│   ├── consistency-engine.ts (validateVerdicto)
│   └── types.ts
└── types.ts
    └── analizador-noticias.ts (NoticiaInput)

parallel-runner.ts
├── pipeline.ts
├── types.ts
└── analizador-noticias.ts

shadow-logger.ts
├── firebase-admin.ts
├── analizador-noticias.ts
├── types.ts
└── parallel-runner.ts

metrics.ts
└── shadow-logger.ts

mapper-v3.ts
├── types.ts
└── analizador-noticias.ts

explainability-validator.ts
└── types.ts

stability-tester.ts
├── pipeline.ts
├── types.ts
└── analizador-noticias.ts

index.ts (barrel)
└── (re-exports todos los módulos)
```

### 1.2 Verificación

| Check | Estado | Observaciones |
|-------|--------|---------------|
| Módulos duplicados | ✅ OK | No existen. V3 (`lib/editor-jefe/`) y V4 (`lib/editor-jefe-v4/`) son sistemas independientes. V3 no se importa desde V4 ni viceversa (excepto `NoticiaInput`/`ResultadoAnalisis` que son tipos compartidos) |
| Motores paralelos | ✅ OK | Un único motor de decisión: `engine.ts`. El `parallel-runner.ts` no es un motor; es un comparador que ejecuta V3 y V4 por separado |
| Reglas repetidas | ✅ OK | Las reglas viven en los perfiles declarativos. No hay lógica de reglas en el engine. Cada perfil define sus propias `requiredEvidence`, `requiredContext`, `requiredUtility` |
| Penalizaciones múltiples | ✅ OK | REGLA 9 implementada en `normalizador.ts:deduplicarPenalizaciones()`. Una causa = una penalización |
| Dependencias circulares | ✅ OK | Flujo estrictamente secuencial: Extractor → Normalizador → Consistency → Profile → Engine. Ningún módulo importa a un módulo downstream |
| Perfiles sin utilizar | ✅ OK | Los 11 perfiles están registrados en `profile-loader.ts` y todos son alcanzables via `loadProfile()` |

### 1.3 Nota sobre V3

El sistema V3 (`lib/editor-jefe/`) sigue presente y funcional. No hay imports cruzados entre V3 y V4 más allá de tipos compartidos (`NoticiaInput`, `ResultadoAnalisis`). V3 se ejecuta independientemente en `/api/admin/analizar`. Esto es correcto para Shadow Mode.

---

## 2. Código muerto

### 2.1 Archivos nunca usados

| Archivo | Estado | Recomendación |
|---------|--------|---------------|
| `lib/editor-jefe-v4/index.ts` | ⚠️ Parcialmente usado | El barrel export existe pero la mayoría de consumidores importan directamente de los módulos (no del barrel). No es código muerto pero el patrón es inconsistente |

### 2.2 Funciones/exports nunca llamados externamente

| Export | Usado en | Estado |
|--------|----------|--------|
| `extract()` | `pipeline.ts` | ✅ Usado |
| `normalize()` | `pipeline.ts` | ✅ Usado |
| `check()` | `pipeline.ts` | ✅ Usado |
| `validateVerdicto()` | `engine.ts` | ✅ Usado |
| `loadProfile()` | `pipeline.ts` | ✅ Usado |
| `getAvailableCategories()` | Nadie | ⚠️ No usado (útil para futura UI) |
| `evaluate()` | `pipeline.ts` | ✅ Usado |
| `generateExplainability()` | `engine.ts` | ✅ Usado |
| `detectCategory()` | `extractor.ts` | ✅ Usado |
| `mapV4ToV3()` | `analizar-v4/route.ts`, `analizar-paralelo/route.ts` | ✅ Usado |
| `logShadowRun()` | `analizar-paralelo/route.ts` | ✅ Usado |
| `getShadowHistory()` | `dashboard-v4/route.ts` | ✅ Usado |
| `calcularMetricas()` | `dashboard-v4/route.ts` | ✅ Usado |
| `auditExplainability()` | `validation.test.ts` | ✅ Usado (tests) |
| `auditRelevanciaCategoria()` | `validation.test.ts` | ✅ Usado (tests) |
| `testStability()` | `validation.test.ts` | ✅ Usado (tests) |
| `runParallel()` | `analizar-paralelo/route.ts` | ✅ Usado |

### 2.3 Imports innecesarios

| Archivo | Import | Estado |
|---------|--------|--------|
| `explainability.ts` | `_results: NormalizedResults` | ⚠️ Parámetro prefijado con `_` pero nunca usado en el cuerpo. Conservar por firma de interfaz |

### 2.4 Interfaces sin uso directo

Todas las interfaces en `types.ts` son usadas por `extractor.ts` o `normalizador.ts`. No hay interfaces huérfanas.

### 2.5 Conclusión

**No hay código muerto eliminable.** El único export sin consumidor es `getAvailableCategories()`, que es una utilidad de API válida para futura uso. El parámetro `_results` en `explainability.ts` es un placeholder intencional.

---

## 3. Cobertura por categoría

### 3.1 Fixtures disponibles

| Categoría | Fixtures | Score promedio | Score min | Score max | Reglas usadas |
|-----------|----------|----------------|-----------|-----------|---------------|
| Sucesos | 20 | 68.5 | 46 | 81 | 12 |
| Nacionales | 16 | 67.4 | 47 | 86 | 11 |
| Internacionales | 20 | 51.4 | 27 | 76 | 12 |
| Deportes | 20 | 68.8 | 33 | 93 | 12 |
| Tecnología | 20 | 48.0 | 27 | 86 | 12 |
| Clima | 20 | 72.0 | 43 | 93 | 13 |
| Salud | 21 | 65.8 | 52 | 83 | 10 |
| Espectáculos | 20 | 64.5 | 46 | 80 | 12 |
| Economía | 2 | 66.0 | 50 | 82 | 8 |
| Política | 1 | 52.0 | 52 | 52 | 10 |
| Servicio | 0 | — | — | — | — |

### 3.2 Categorías con cobertura insuficiente

| Categoría | Estado | Acción requerida |
|-----------|--------|------------------|
| **Servicio** | ❌ CRÍTICO | 0 fixtures. No hay tests. El perfil existe pero no se ha validado |
| **Economía** | ⚠️ Insuficiente | 2 fixtures. Necesita mínimo 20 |
| **Política** | ⚠️ Insuficiente | 1 fixture. Necesita mínimo 20 |

### 3.3 Reglas nunca ejecutadas

Las siguientes reglas de explainability nunca se dispararon en los 160 fixtures:

- `eeat.atribucionesFalsas` — Ningún fixture contiene atribuciones falsas
- `forense.adjetivosEmocionales` — Ningún fixture supera el umbral de 3+ adjetivos
- `requiredContext` en Sucesos — El perfil de Sucesos no define `requiredContext` (es opcional)

### 3.4 Reglas más frecuentes

| Regla | Frecuencia | Observación |
|-------|------------|-------------|
| `adsense.palabraCount` | 160/160 | Se dispara en TODOS los fixtures. ⚠️ Verificar si el umbral de 300 palabras es correcto para fixtures de prueba |
| `discover.tieneImagen` | 160/160 | Se dispara en TODOS los fixtures. Los fixtures no incluyen `imagenDestacada` |
| `requiredUtility` | 124/160 | 77.5% de los artículos no responden las preguntas clave del perfil |
| `valorEditorial.parrafosSinDato` | 99/160 | 61.9% tienen párrafos sin datos verificables |
| `sources.numeroFuentes` | 87/160 | 54.4% no tienen fuentes oficiales detectadas |

---

## 4. Explainability

### 4.1 Métricas calculadas sobre 160 fixtures

| Métrica | Valor | Objetivo | Estado |
|---------|-------|----------|--------|
| Recomendaciones completas (qué/dónde/por qué/cómo) | 100.0% | 100% | ✅ |
| Recomendaciones ambiguas | 0.0% | 0% | ✅ |
| Recomendaciones inútiles (puntosPerdidos=0) | 0.0% | 0% | ✅ |
| Recomendaciones repetidas (mismo texto) | 90.0% | <20% | ❌ |

### 4.2 Problema detectado: Repetición masiva

**90% de las recomendaciones son idénticas entre artículos.** Esto ocurre porque:

1. `adsense.palabraCount` y `discover.tieneImagen` se disparan en todos los fixtures (no tienen imagen ni 300+ palabras)
2. El texto de la recomendación es estático (mismo `motivo` y `solucion` para la misma regla)

**Severidad:** Media. Las recomendaciones son correctas pero no son específicas al artículo individual. En producción, con artículos reales que tienen imágenes y 300+ palabras, la repetición será menor.

**Recomendación:** No modificar ahora. Observar en producción con artículos reales. Si la repetición persiste >50% con artículos reales, considerar personalizar el texto de `motivo` con datos del artículo.

---

## 5. Consistency

### 5.1 Resultado

**0 contradicciones detectadas** en 160 artículos analizados.

| Tipo de violación | Cantidad | Estado |
|-------------------|----------|--------|
| `EDITOR_INCONSISTENT` | 0 | ✅ |
| `SCORE_CONTRADICTORY` | 0 | ✅ |
| `PENALTY_DUPLICATED` | 0 | ✅ (detectadas pero no fatales) |

### 5.2 Casos verificados

- Forense 100 + Editor 30: **No ocurrió**. Cuando forense ≥95, el score final fue ≥45
- EEAT 100 + Fuentes insuficientes: **No ocurrió**. Cuando EEAT ≥95, siempre hubo fuentes detectadas
- Discover 100 + Título no apto: **No occurrió**. El detector de clickbait es consistente con Discover

---

## 6. Rendimiento

### 6.1 Métricas (50 ejecuciones)

| Métrica | Valor |
|---------|-------|
| Tiempo promedio | 0.63ms |
| Tiempo mínimo | 0.21ms |
| Tiempo máximo | 14.25ms (primera ejecución, JIT warmup) |
| Uso de memoria (delta) | 0.15MB |
| Complejidad | O(n) donde n = longitud del texto |

### 6.2 Evaluación

El motor V4 es **extremadamente rápido**. Sub-milisegundo en promedio. El tiempo máximo de 14ms corresponde a la primera ejecución (compilación JIT de regex). No degrada la experiencia del editor.

---

## 7. Calidad del código

### 7.1 Tamaño de archivos

| Archivo | Líneas | Estado |
|---------|--------|--------|
| `normalizador.ts` | 376 | ⚠️ Largo pero estructurado (6 evaluadores + deduplicador) |
| `extractor.ts` | 206 | ✅ Adecuado |
| `explainability.ts` | 200 | ✅ Adecuado |
| `types.ts` | 253 | ✅ Adecuado (todas las interfaces) |
| `engine.ts` | 114 | ✅ Conciso |
| `consistency-engine.ts` | 119 | ✅ Conciso |
| `metrics.ts` | 119 | ✅ Conciso |
| `shadow-logger.ts` | 103 | ✅ Conciso |
| Perfiles (cada uno) | 26-27 | ✅ Muy concisos |
| `pipeline.ts` | 32 | ✅ Mínimo |

### 7.2 Complejidad ciclomática

| Archivo | Complejidad estimada | Estado |
|---------|---------------------|--------|
| `engine.ts` | Baja (flujo lineal, sin switch/if por categoría) | ✅ |
| `normalizador.ts` | Media (6 evaluadores con if-else por señal) | ✅ Aceptable |
| `extractor.ts` | Media (múltiples regex, sin anidamiento) | ✅ Aceptable |
| `explainability.ts` | Media (8 checks secuenciales) | ✅ Aceptable |
| `consistency-engine.ts` | Baja | ✅ |

### 7.3 Duplicación

| Patrón | Estado |
|--------|--------|
| Regex `ADJETIVOS_EMOCIONALES` en `extractor.ts` | ✅ Único, no duplicado |
| Regex `PALABRAS_SENSIBLES` en `extractor.ts` | ✅ Único |
| Regex `ATRIBUCIONES_FALSAS` en `extractor.ts` | ✅ Único |
| Lógica de scoring | ✅ Centralizada en `engine.ts` |
| Lógica de perfiles | ✅ Declarativa en `profiles/*.ts` |

### 7.4 Deuda técnica

| Ítem | Severidad | Descripción |
|------|-----------|-------------|
| `_results` sin usar en `explainability.ts` | Baja | Parámetro conservado por firma de interfaz. No afecta funcionalidad |
| `getAvailableCategories()` sin consumidor | Baja | Utilidad de API lista para usar |
| `normalizador.ts` 376 líneas | Baja | Podría dividirse en archivos por módulo, pero la estructura actual es legible |
| Fixtures sin `imagenDestacada` | Media | Los fixtures de prueba no incluyen imágenes, causando que `discover.tieneImagen` se dispare en el 100% de casos |

---

## 8. Dashboard

### 8.1 Preguntas editoriales que DEBE responder

| Pregunta | ¿Responde? | Observaciones |
|----------|------------|---------------|
| ¿Por qué esta nota quedó en "Publicar breve"? | ⚠️ Parcialmente | El dashboard muestra score promedio y distribución de veredictos por categoría, pero NO permite hacer drill-down a un artículo específico para ver qué reglas lo bajaron |
| ¿Por qué otra quedó en "Portada"? | ⚠️ Parcialmente | Misma limitación. No hay vista por artículo individual |
| ¿Cuáles reglas la afectaron? | ❌ No | El dashboard muestra reglas que más penalizan globalmente, pero no por artículo individual |

### 8.2 Lo que el dashboard SÍ responde

- ✅ Distribución de artículos por categoría
- ✅ Score promedio por categoría
- ✅ Cantidad de artículos por veredicto (Portada, Cobertura especial, Publicar, No publicar)
- ✅ Reglas que más penalizan globalmente
- ✅ Número de inconsistencias detectadas
- ✅ Tiempo promedio de análisis
- ✅ Checklist FASE 9 (retirar V3)

### 8.3 Brecha

El dashboard actual es un **panel de métricas globales**. No es un panel de diagnóstico por artículo. Para responder "¿por qué esta nota quedó en breve?", se necesita:

1. Una vista de detalle por artículo (click en un log → ver explainability completo)
2. Una vista de "artículos borderline" (score 44-46, entre breve y no_publicar)

**Recomendación:** No agregar ahora (FASE 10: Congelación). Anotar como mejora post-validación.

---

## 9. Falsos positivos

### 9.1 Patrones detectados

| Patrón | Ubicación | Riesgo | Severidad |
|--------|-----------|--------|-----------|
| `grave` en `ADJETIVOS_EMOCIONALES` | `extractor.ts:29` | "Grave" no siempre es sensacionalismo. "Estado grave" en Sucesos/Salud es informativo | ⚠️ Media |
| `alerta` (no está en regex) | — | No se detecta como clickbait. ✅ Correcto | ✅ |
| `investigación` (no está en regex) | — | No se detecta como atribución. ✅ Correcto | ✅ |
| `preocupante` en `ADJETIVOS_EMOCIONALES` | `extractor.ts:29` | "Preocupante" puede ser valoración editorial legítima | ⚠️ Baja |
| `crítico` en `ADJETIVOS_EMOCIONALES` | `extractor.ts:29` | "Crítico" en Salud ("estado crítico") es informativo, no emocional | ⚠️ Media |
| `urgente` en `ADJETIVOS_EMOCIONALES` | `extractor.ts:29` | "Urgente" en Servicio (trámite urgente) es informativo | ⚠️ Baja |

### 9.2 Evaluación

El regex `ADJETIVOS_EMOCIONALES` incluye palabras que **pueden ser informativas según el contexto**:

- `grave` — Estado de salud, severidad de un incidente
- `crítico` — Estado de salud, nivel de riesgo climático
- `urgente` — Trámite de servicio, alerta climática

El umbral actual (3+ adjetivos para disparar la regla) mitiga el impacto: una sola mención de "grave" no penaliza. Pero un artículo de Sucesos que mencione "estado grave", "urgente" y "crítico" sería penalizado incorrectamente.

**Recomendación:** No modificar ahora (congelación). Observar en producción. Si se detectan falsos positivos reales, considerar:
1. Mover `grave`, `crítico`, `urgente` a una lista de excepciones por categoría
2. O reducir el peso de la penalización (actual: -10 puntos)

---

## 10. Informe final

### 10.1 Resumen

| Dimensión | Estado | Score |
|-----------|--------|-------|
| Arquitectura | ✅ Sólida | 10/10 |
| Código muerto | ✅ Limpio | 9/10 |
| Cobertura | ⚠️ 8/11 categorías con ≥20 fixtures | 6/10 |
| Explainability | ⚠️ 100% completa pero 90% repetida | 7/10 |
| Consistency | ✅ 0 contradicciones | 10/10 |
| Rendimiento | ✅ Sub-milisegundo | 10/10 |
| Calidad código | ✅ Baja deuda técnica | 8/10 |
| Dashboard | ⚠️ Métricas globales, sin drill-down | 6/10 |
| Falsos positivos | ⚠️ 3 palabras con riesgo contextual | 7/10 |

**Score global: 8.1/10**

### 10.2 Módulos eliminables

**No hay módulos eliminables.** Todos los archivos tienen un propósito y están en uso.

### 10.3 Recomendaciones (post-congelación)

1. **Agregar fixtures para Servicio (20), Economía (20), Política (20)** — Es la brecha de cobertura más crítica
2. **Drill-down en Dashboard** — Permitir click en un artículo para ver su explainability completo
3. **Revisar `grave`, `crítico`, `urgente`** después de 100+ artículos reales en producción
4. **Personalizar texto de explainability** si la repetición >50% persiste con artículos reales

### 10.4 Veredicto

**V4 RC1 APROBADA PARA VALIDACIÓN EDITORIAL EN PRODUCCIÓN.**

El sistema cumple con las 14 reglas obligatorias. La arquitectura es sólida. No hay contradicciones internas. El rendimiento es excelente. Las brechas detectadas (cobertura de 3 categorías, repetición de explainability, drill-down del dashboard) son mejoras post-validación, no bloqueantes.

**Próximo paso:** Congelar V4 durante un mínimo de 30 días. Usar el sistema todos los días para publicar noticias reales en modo paralelo (V3+V4). Observar el dashboard. Ajustar solo lo que la producción real revele.

---

*Auditoría realizada sin modificar código, sin agregar funciones, sin refactorizar. Solo observación.*
