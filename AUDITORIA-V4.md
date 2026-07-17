# AUDITORÍA COMPLETA — ARQUITECTURA EDITOR IA V4

> **Estado:** APROBADO con reglas obligatorias (13 reglas + ejecución paralela V3/V4)
> **Fecha:** Julio 2026

---

## 1. MAPA DE MÓDULOS ACTUALES

### Pipeline de ejecución

```
NoticiaInput
    │
    ▼
analizarNoticia()                         ← analizador-noticias.ts:583
    │
    ├── evaluarEditorJefeV2()             ← editor-jefe/engine.ts
    │   ├── evaluarEvidencia()            11 dimensiones (0-100)
    │   ├── clasificarTipoNotaV2()        8 tipos de nota
    │   ├── decidirEditorialV2()          ÚNICA decisión editorial
    │   ├── detectarContextoNicaragua()
    │   ├── generarSugerenciasV2()        switch de 15 temas
    │   └── verificarConsistencia()       no-op
    │
    ├── 7 FILTROS INDEPENDIENTES:
    │   ├── analizarFiltroOro()           estructura, lead, fuentes, adjetivos
    │   ├── analizarFiltroAdSense()       thin content, clickbait, valor añadido
    │   ├── analizarFiltroDiscover()      imagen, título, frescura
    │   ├── analizarFiltroNews()          schema, autor, fechas, categoría
    │   ├── analizarFiltroSEO()           longitud título, meta, keywords
    │   ├── analizarFiltroEEAT()          autor, fuentes, atribuciones falsas
    │   └── analizarFiltroValorEditorial() origen, fuente real, datos inventados
    │
    ├── analizarForenseV1()               19 fases (fase0 a fase18)
    ├── sincronizarForenseConEditorJefe() parche anti-contradicción
    │
    ├── evaluarPorVertical()              ← despachador.ts: switch(vertical)
    │   └── 10 módulos verticales que SOBRESCRIBEN utilidad, originalidad, sugerencias
    │
    ├── mapearReporteEditorJefe()         ← mapper.ts
    ├── calcularMatrizConfianza()         ← confianza.ts (recalcula 5 dimensiones)
    ├── generarBenchmark()                ← confianza.ts (compara con TN8/La Prensa)
    ├── detectarDerivaEditorial()         ← deriva.ts (vigilancia temporal)
    └── modoAuditor()                     ← auditor.ts (explica puntos perdidos)
```

### Módulos auxiliares (no evaluativos)

- `adsense-guard.ts` — bloquea slugs, no evalúa
- `seo-toxic.ts` — lista de slugs tóxicos
- `editorial-fix.ts` — corrige al guardar
- `analizador-duplicados.ts` — detecta duplicados

---

## 2. QUÉ EVALÚA CADA MÓDULO

### Editor Jefe V2 (engine.ts)

| Dimensión | Escala | Qué mide |
|-----------|--------|----------|
| fuenteIdentificada | 0-100 | Fuente oficial o medio nacional |
| documentoOficial | 0-100 | Documento, comunicado, informe |
| dosFuentes | 0-100 | ≥2 fuentes independientes |
| trabajoDeCampo | 0-100 | Evidencia verificable |
| datosConcretos | 0-100 | Fechas, cifras, cantidades |
| contexto | 0-100 | Marco legal, histórico |
| utilidad | 0-100 | Qué hace el lector con la info |
| servicio | 0-100 | Guía práctica |
| originalidad | 0-100 | 8 ítems x 10 + 20 exclusividad |
| aportePropio | 0-25 | 7 ítems binarios |
| alucinacionInstitucional | 0-100 | 8 ítems: ¿cita tiene respaldo? |

**Decisión:** promedio de 7 dimensiones → +aportePropio → penalización alucinación → techo por tipo → acción.

### 7 Filtros (analizador-noticias.ts)

| Filtro | Checks | Qué evalúa |
|--------|--------|------------|
| Oro | 7 | Extensión, lead, adjetivos, transiciones IA, fuentes, h2, strong |
| AdSense | 3+VE | Thin content, clickbait, valor añadido |
| Discover | 3 | Imagen, título, frescura |
| News | 4 | Schema, autor, fechas, categoría |
| SEO | 4 | Longitud título, meta, keywords |
| EEAT | 3 | Autor, fuentes, anti-atribuciones falsas |
| ValorEditorial | 4 | Origen, fuente real, extensión, datos inventados |

**Puntuación global:** promedio simple de los 7 filtros.

### Forense V1 — 19 fases

| Fase | Qué hace | Duplica a |
|------|----------|-----------|
| fase0 | Identifica tipo y riesgo | Editor Jefe Fase 2 |
| fase1 | Triage | Editor Jefe: fuente, dosFuentes, datos |
| fase2 | Autopsia documental | Editor Jefe: documentoOficial |
| fase3 | Necropsia evidencia | Editor Jefe: trabajoDeCampo |
| fase4 | Cadena custodia | Filtro Oro + EEAT |
| fase5 | Contaminación | Filtro Oro: adjetivos + IA |
| fase6 | Estructura | Filtro Oro: h2, strong |
| fase7 | Hemorragia | ÚNICO no duplicado |
| fase8 | SEO | Filtro SEO |
| fase9 | EEAT | Filtro EEAT |
| fase10 | Legal | ÚNICO no duplicado |
| fase11 | AdSense | Filtro AdSense |
| fase12 | Facebook | Parcialmente único |
| fase13 | Discover | Filtro Discover + Editor Jefe |
| fase14 | Utilidad | Editor Jefe: utilidad, servicio |
| fase15 | Diferenciador | Editor Jefe: originalidad, aportePropio |
| fase16 | Portada | No-op |
| fase17 | Facebook prob. | Duplica fase12 |
| fase18 | Google | Duplica fase9 + fase15 |

### Módulos Verticales (modulos/)

Cada vertical **sobrescribe** 3 valores del engine: `utilidad`, `originalidad`, `sugerencias`. Añade `diferenciadorNI`, `prioridadEditorial`, `valorAgregado`.

### Confianza (confianza.ts)

Recalcula 5 dimensiones desde el reporte mapeado. **Subconjunto redundante** del engine.

---

## 3. DUPLICACIONES IDENTIFICADAS

### Duplicaciones críticas

| Concepto | Evaluado por | Veces |
|----------|-------------|-------|
| Fuente identificada | Engine, Oro, EEAT, ValorEditorial, Forense fase1+4 | 5 |
| Documento oficial | Engine, Forense fase2 | 2 |
| Dos fuentes | Engine, Oro, Forense fase1 | 3 |
| Datos concretos | Engine, Oro, Forense fase1 | 3 |
| Contexto | Engine, Forense fase13+15 | 3 |
| Utilidad | Engine, Vertical, Forense fase14, Confianza | 4 |
| Originalidad | Engine, Vertical, Confianza, Forense fase15 | 4 |
| Adjetivos emocionales | Oro, Forense fase5 | 2 |
| Transiciones IA | Oro, Forense fase5 | 2 |
| Estructura h2/strong | Oro, Forense fase6 | 2 |
| SEO | Filtro SEO, Forense fase8 | 2 |
| EEAT | Filtro EEAT, Forense fase9+18 | 3 |
| AdSense | Filtro AdSense, Forense fase11 | 2 |
| Clickbait | AdSense, Discover, Forense fase12 | 3 |
| Aporte propio | Engine (originalidad+aporte), Vertical, Forense fase15 | 3 |

**Total: 15 conceptos duplicados, algunos hasta 5 veces.**

### Contradicciones

| Contradicción | Detalle |
|---------------|---------|
| Utilidad sobreescrita | Engine calcula, vertical reemplaza sin usar el valor |
| Originalidad sobreescrita | Igual: engine calcula, vertical descarta |
| Forense vs Editor Jefe | `sincronizarForenseConEditorJefe()` es un parche |
| Score global vs Decisión | 2 sistemas paralelos: promedio filtros vs decisión engine |
| Nivel vs Score | `nivel` usa checksOK, no scoreTotal. 3er sistema |

---

## 4. DEPENDENCIAS

```
engine.ts (sin deps) → Forense V1 (depende de V2)
                      → sincronizarForense (depende de Forense + V2 + filtros)
                      → evaluarPorVertical (depende de V2, sobrescribe)
                      → mapper (depende de V2 + observaciones Forense)
                      → confianza (depende de reporte mapeado)
                      → auditor (depende de ResultadoAnalisis)
```

**6 pasadas sobre los mismos datos.**

---

## 5. CÓDIGO ELIMINABLE

| Módulo | Líneas aprox. | Razón |
|--------|---------------|-------|
| `analizarForenseV1()` + sync | ~500 | 17/19 fases duplican otros |
| 7 filtros | ~500 | Reemplazados por perfiles |
| `calcularMatrizConfianza()` | ~145 | Redundante con engine |
| `generarBenchmark()` | ~40 | Integrado a perfiles |
| 10 módulos verticales | ~1500 | Reemplazados por perfiles |
| `despachador.ts` | ~70 | Eliminado switch |
| `perfiles.ts` actual | ~1100 | Reemplazado por perfiles nuevos |

**Total eliminable: ~3,900 líneas.**

### Se conserva (refactorizado)

- `engine.ts` → `EditorJefeEngine` (motor único)
- `mapper.ts` → simplificado
- `auditor.ts` → se conserva
- `deriva.ts` → se conserva

---

## 6. ARQUITECTURA DEFINITIVA — EDITOR JEFE V4

### 6.1 Reglas obligatorias (13 reglas + ejecución paralela)

#### REGLA 1 — El Editor Jefe nunca vuelve a leer el artículo

El artículo se analiza **una sola vez**. La extracción produce un objeto estructurado `ArticleEvidence`. El Editor Jefe únicamente consume este objeto. Nunca vuelve a escanear HTML, detectar contexto, cronología ni fuentes.

```typescript
interface ArticleEvidence {
  // Datos crudos extraídos en la única pasada
  seo: SeoEvidence;
  eeat: EeatEvidence;
  discover: DiscoverEvidence;
  adsense: AdsenseEvidence;
  valorEditorial: ValorEditorialEvidence;
  forense: ForenseEvidence;

  // Datos estructurados para el Editor Jefe
  context: ContextEvidence;
  chronology: ChronologyEvidence;
  utility: UtilityEvidence;
  originality: OriginalityEvidence;
  evidence: EvidenceSignals;
  followUp: FollowUpEvidence;
  sources: SourceEvidence;
  risk: RiskEvidence;
  category: string;
}
```

#### REGLA 2 — Pipeline único secuencial

```
Artículo
    ↓
Extractor (única lectura del artículo)
    ↓
ArticleEvidence
    ↓
SEO → EEAT → FORENSE → ADSENSE → DISCOVER → VALOR EDITORIAL
    ↓
Normalizador (convierte todo a EvaluationResult uniforme)
    ↓
Consistency Engine (verifica coherencia entre módulos)
    ↓
Editor Jefe (consume ArticleEvidence + EvaluationResults normalizados)
    ↓
Veredicto
```

No se permiten rutas paralelas. Todo pasa secuencialmente.

#### REGLA 3 — Normalizador obligatorio

Todos los módulos devuelven exactamente el mismo formato:

```typescript
interface EvaluationResult {
  score: number;           // 0-100
  signals: string[];       // señales positivas detectadas
  warnings: string[];      // advertencias
  errors: string[];        // errores críticos
  evidence: Record<string, unknown>;  // evidencia estructurada
  recommendations: string[];          // recomendaciones
}
```

Queda prohibido que un módulo devuelva texto libre y otro JSON.

#### REGLA 4 — Consistency Engine obligatorio

Se ejecuta **antes** del Editor Jefe. Reglas mínimas:

```
SI SEO > 95 AND EEAT > 95 AND FORENSE > 95 AND VALOR > 95
    ↓
EditorJefe NUNCA puede devolver:
    - publicar_breve
    - no_publicar
    - score < 90

SI ocurre → generar EDITOR_INCONSISTENT y detener el análisis.
```

#### REGLA 5 — Los perfiles NO contienen lógica

Cada perfil es únicamente declarativo:

**Correcto:** `requiredEvidence`, `requiredContext`, `requiredUtility`, `allowedSources`, `weights`, `thresholds`, `forbiddenRecommendations`

**Incorrecto:** Funciones, ifs, switch, algoritmos.

#### REGLA 6 — CategoryDetector independiente

No mezclar con el Editor. Flujo:

```
CategoryDetector → Sucesos | Clima | Tecnología | ...
    ↓
ProfileLoader
    ↓
EditorJefeEngine
```

#### REGLA 7 — Categoría CLIMA agregada

No se mezcla con Nacionales. Lista definitiva de categorías:

1. Sucesos
2. Nacionales
3. Internacionales
4. Clima
5. Economía
6. Política
7. Tecnología
8. Deportes
9. Salud
10. Servicio
11. Espectáculos

#### REGLA 8 — Cada perfil tiene preguntas propias

| Categoría | Debe preguntar | Nunca |
|-----------|---------------|-------|
| Sucesos | qué ocurrió, dónde, cuándo, seguimiento, estado actual | ley, decreto, trámite |
| Clima | municipios, lluvias, ríos, comunidades, seguimiento, recomendaciones | marco jurídico |
| Tecnología | precio, especificaciones, qué cambia, compatibilidad | marco legal |
| Deportes | resultado, tabla, estadísticas, próximo partido | ley, contexto jurídico |

#### REGLA 9 — Eliminar penalización duplicada

Una causa = una pérdida. Nunca tres módulos restando puntos por el mismo motivo.

#### REGLA 10 — Explainability obligatoria

Cada punto perdido debe decir: **regla, párrafo, motivo, cómo solucionarlo**.

Nunca: "Falta contexto."
Debe decir: "No se encontró explicación del origen del fenómeno entre los párrafos 2 y 4."

#### REGLA 11 — Tests antes del código

Crear `tests/editor-v4/` con al menos:
- 20 sucesos, 20 nacionales, 20 internacionales, 20 deportes
- 20 tecnología, 20 clima, 20 salud, 20 espectáculos

No comenzar el refactor sin estas pruebas.

#### REGLA 12 — Mantener compatibilidad

Durante el desarrollo no se rompe: SEO, EEAT, Discover, Forense, AdSense, Valor Editorial. Solo cambia el Editor Jefe.

#### REGLA 13 — Veredicto único coherente

Un mismo artículo siempre debe producir un único veredicto coherente. Nunca podrá ocurrir:

```
FORENSE 100 + EEAT 100 + SEO 100 + VALOR 100 → PUBLICAR BREVE (30)
```

Eso es un error de arquitectura. Debe ser imposible.

#### REGLA 14 — Ejecución paralela V3 + V4

No eliminar el sistema actual hasta que el V4 pase una batería de pruebas con noticias reales. Ejecutar ambos motores en paralelo, comparar resultados, y solo retirar V3 cuando V4 demuestre consistencia y estabilidad.

### 6.2 Estructura de archivos V4

```
lib/editor-jefe-v4/
├── types.ts                  ← ArticleEvidence, EvaluationResult, EditorialProfile, etc
├── extractor.ts              ← Única lectura del artículo → ArticleEvidence
├── category-detector.ts      ← Detecta categoría (independiente del engine)
├── profile-loader.ts         ← Carga perfil según categoría
├── normalizador.ts           ← Convierte outputs de módulos a EvaluationResult
├── consistency-engine.ts     ← Verifica coherencia antes del Editor Jefe
├── engine.ts                 ← EditorJefeEngine (consume ArticleEvidence, sin ifs)
├── explainability.ts         ← Regla, párrafo, motivo, solución
├── pipeline.ts               ← Orquestador secuencial
├── parallel-runner.ts        ← Ejecuta V3 y V4 en paralelo para comparación
├── mapper.ts                 ← Convierte ResultadoEditorial a reporte UI
├── auditor.ts                ← Explica puntos perdidos (se conserva)
├── deriva.ts                 ← Vigilancia temporal (se conserva)
└── profiles/                 ← SOLO reglas declarativas
    ├── sucesos.ts
    ├── nacionales.ts
    ├── internacionales.ts
    ├── clima.ts
    ├── economia.ts
    ├── politica.ts
    ├── tecnologia.ts
    ├── deportes.ts
    ├── salud.ts
    ├── servicio.ts
    └── espectaculos.ts

tests/editor-v4/
├── sucesos.test.ts           ← 20 casos
├── nacionales.test.ts        ← 20 casos
├── internacionales.test.ts   ← 20 casos
├── deportes.test.ts          ← 20 casos
├── tecnologia.test.ts        ← 20 casos
├── clima.test.ts             ← 20 casos
├── salud.test.ts             ← 20 casos
├── espectaculos.test.ts      ← 20 casos
└── consistency.test.ts       ← Tests del Consistency Engine
```

### 6.3 Pipeline V4 detallado

```
NoticiaInput
    │
    ▼
Extractor.extract(noticia)
    │  Única lectura del HTML. Extrae TODO:
    │  - SEO signals (título, meta, h2, strong, keywords)
    │  - EEAT signals (autor, fuentes, atribuciones)
    │  - Discover signals (imagen, título, frescura)
    │  - AdSense signals (thin content, clickbait, palabras sensibles)
    │  - Valor Editorial signals (origen, fuente real, datos inventados)
    │  - Forense signals (estructura, contaminación, hemorragia, legal)
    │  - Contexto, cronología, utilidad, originalidad
    │  - Sources, risk, followUp
    │  - Categoría detectada
    │
    ▼
ArticleEvidence (objeto estructurado inmutable)
    │
    ▼
Módulos de evaluación (cada uno lee ArticleEvidence, NO el artículo):
    ├── SEO.evaluate(evidence)          → EvaluationResult
    ├── EEAT.evaluate(evidence)         → EvaluationResult
    ├── Forense.evaluate(evidence)      → EvaluationResult
    ├── AdSense.evaluate(evidence)      → EvaluationResult
    ├── Discover.evaluate(evidence)     → EvaluationResult
    ├── ValorEditorial.evaluate(evidence) → EvaluationResult
    │
    ▼
Normalizador.normalize(allResults) → NormalizedResults
    │  Garantiza formato uniforme EvaluationResult
    │  Elimina duplicaciones (una causa = una penalización)
    │
    ▼
ConsistencyEngine.check(normalizedResults)
    │  Si SEO>95 AND EEAT>95 AND FORENSE>95 AND VALOR>95
    │  → Editor Jefe no puede devolver breve/no_publicar/score<90
    │  Si violación → EDITOR_INCONSISTENT (detener)
    │
    ▼
CategoryDetector.detect(evidence) → "Sucesos"
    │
    ▼
ProfileLoader.load("Sucesos") → EditorialProfile
    │
    ▼
EditorJefeEngine.evaluate(evidence, profile, normalizedResults)
    │  Lee ArticleEvidence + EvaluationResults + Profile
    │  Calcula score ponderado con pesos del perfil
    │  Aplica umbrales del perfil
    │  Genera veredicto
    │  Genera explainability (regla, párrafo, motivo, solución)
    │
    ▼
ResultadoEditorial {
  categoria, perfilUsado,
  scores: { seo, eeat, forense, adsense, discover, valorEditorial,
            evidencia, fuente, contexto, utilidad, originalidad, final },
  veredicto,
  explainability: [{ regla, parrafo, motivo, solucion }],
  sugerencias,
  consistencia: { ok, violaciones }
}
```

### 6.4 Interface del perfil (declarativo, sin lógica)

```typescript
interface EditorialProfile {
  categoria: string;

  requiredEvidence: Record<string, RegExp>;
  requiredContext: { tipo: string; patrones: RegExp[] };
  requiredUtility: { preguntas: string[] };
  forbiddenQuestions: string[];
  forbiddenRecommendations: string[];

  scoreWeights: {
    evidencia: number;
    fuente: number;
    contexto: number;
    utilidad: number;
    originalidad: number;
  };

  editorialThreshold: {
    no_publicar: number;
    publicar_breve: number;
    publicar_estandar: number;
    publicar_destacado: number;
    portada: number;
    cobertura_especial: number;
  };

  allowedSources: string[];
  sugerenciasBase: {
    oportunidades: string[];
    convertirReferencia: string[];
    nivel10: string[];
  };
}
```

### 6.5 El motor nunca tiene ifs por categoría

```typescript
// EditorJefeEngine — consume ArticleEvidence, nunca lee el artículo
function evaluate(
  evidence: ArticleEvidence,
  profile: EditorialProfile,
  results: NormalizedResults
): ResultadoEditorial {

  // 1. Evidencia — recorre las regex del perfil sobre evidence ya extraída
  const evidencia = checkEvidence(evidence, profile.requiredEvidence);

  // 2. Score ponderado con pesos del perfil
  const score = calculateScore(evidencia, evidence, profile.scoreWeights);

  // 3. Decisión — umbrales del perfil
  const veredicto = decide(score, profile.editorialThreshold);

  // 4. Consistency Engine ya validó antes de llegar aquí
  // 5. Explainability detallada
  const explainability = generateExplainability(evidence, results, profile);

  return { categoria: profile.categoria, scores, veredicto, explainability, ... };
}
```

**El motor no sabe si es Sucesos, Deportes o Clima. Solo lee el perfil.**

### 6.6 Beneficio: crecimiento infinito

Nueva categoría: `Turismo` → agregar `profiles/turismo.ts`. No se toca el motor.

---

## 7. RESUMEN DE CAMBIOS V4

| Aspecto | V3 (actual) | V4 (propuesto) |
|---------|-------------|----------------|
| Motores | 3 paralelos (engine + filtros + forense) | 1 solo motor |
| Evaluaciones | 15 conceptos duplicados hasta 5x | 1 evaluación por concepto |
| Categorías | switch + 10 módulos con lógica | Perfiles declarativos |
| Ifs por categoría | ~50+ en engine + verticales | 0 |
| Líneas de código | ~5,500 | ~1,600 |
| Pasadas sobre datos | 6 | 1 |
| Nueva categoría | Reescribir engine + vertical + forense | Agregar 1 archivo |
| Scores | 3 sistemas paralelos | 1 escala 0-100 |
| Forense V1 | 19 fases (17 duplicadas) | Eliminado |
| Sincronización anti-contradicción | Necesaria | No necesaria |

---

## 8. PLAN DE MIGRACIÓN (post-aprobación)

### Fase 0 — Tests antes del código (REGLA 11)

1. Crear `tests/editor-v4/` con 160+ casos de noticias reales
2. Cada test verifica: categoría detectada, score, veredicto, consistencia
3. No comenzar refactor sin tests aprobados

### Fase 1 — Construcción V4 (sin tocar V3)

1. Crear `lib/editor-jefe-v4/types.ts`
2. Crear `lib/editor-jefe-v4/extractor.ts` (única lectura)
3. Crear `lib/editor-jefe-v4/category-detector.ts`
4. Crear `lib/editor-jefe-v4/normalizador.ts`
5. Crear `lib/editor-jefe-v4/consistency-engine.ts`
6. Crear 11 perfiles en `lib/editor-jefe-v4/profiles/`
7. Crear `lib/editor-jefe-v4/profile-loader.ts`
8. Crear `lib/editor-jefe-v4/engine.ts` (EditorJefeEngine)
9. Crear `lib/editor-jefe-v4/explainability.ts`
10. Crear `lib/editor-jefe-v4/pipeline.ts`
11. Crear `lib/editor-jefe-v4/mapper.ts`

### Fase 2 — Ejecución paralela (REGLA 14)

1. Crear `lib/editor-jefe-v4/parallel-runner.ts`
2. Ejecutar V3 y V4 en paralelo en el API
3. Comparar resultados con noticias reales
4. Solo retirar V3 cuando V4 demuestre consistencia

### Fase 3 — Retiro de V3

1. Eliminar: Forense V1, 7 filtros, 10 verticales, despachador, perfiles.ts actual
2. Conservar: `auditor.ts`, `deriva.ts` (adaptados a V4)
3. Actualizar API routes para usar solo V4

---

**DOCUMENTO APROBADO. INICIO REFACTOR.**
