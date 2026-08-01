# AUDITORÍA FORENSE DEL MOTOR MENI

Generado automáticamente por `scripts/auditar-motor-meni.ts`.

## FASE 1 — Localización del scoreFinal

- **Asignación a scoreFinal**: `lib/meni/core.ts` línea 162  `const scoreFinal = editorialDecision.score;`
- **Devuelve en MeniResult**: `lib/meni/core.ts` línea 200 dentro del objeto retornado.
- **evaluateMeni**: `lib/meni/core.ts` línea 49
- **runMeni**: `lib/meni/core.ts` línea 286
- **runMeniAsync**: `lib/meni/core.ts` línea 309
- **runEditorialBrain**: `lib/meni/editorial-brain/index.ts` línea 42
- **calcularScoreEjecutivo**: `lib/meni/editorial-brain/index.ts` línea 524
- **calcularEvaluacionCategoria**: `lib/meni/editorial-brain/index.ts` línea 467
- **computeEditorialDNA**: `lib/meni/editorial-dna/engine.ts` línea 52
- **adnNI**: `lib/meni/editorial-dna/engine.ts` línea 165

### Cadena de llamadas (scoreFinal)

```text
runMeniAsync()
  └─ runMeni()
       └─ evaluateMeni()
            └─ runEditorialBrain()
                 ├─ computeEditorialDNA()  → adnNI (NO es scoreFinal)
                 ├─ calcularEvaluacionCategoria()  → puntos perdidos
                 └─ calcularScoreEjecutivo()  → score que devuelve editorialDecision
            └─ editorialDecision.score asignado a scoreFinal
```

## FASE 2 — Mapa de puntajes

El scoreFinal **NO deriva** de los módulos secundarios. Estos devuelven valores informativos:

| Criterio | Función | Archivo | Origen del valor | Observación |
| --- | --- | --- | --- | --- |
| **Score final** | calcularScoreEjecutivo | lib/meni/editorial-brain/index.ts:524 | 100 − suma(puntos perdidos) | Único valor que llega a scoreFinal |
| **Originalidad (auditoría)** | audit | lib/meni/auditor.ts:4 | `result.valorEditorial.score` | No afecta scoreFinal |
| **Redacción / Profundidad (auditoría)** | audit | lib/meni/auditor.ts:4 | `(seo+eeat+forense)/3` | No afecta scoreFinal |
| **Utilidad (auditoría)** | audit | lib/meni/auditor.ts:4 | `result.valorEditorial.score` | No afecta scoreFinal |
| **EEAT** | analyzeEEAT | lib/meni/eeat.ts | `result.eeat.score` | Secundario, no pesa en scoreFinal |
| **SEO** | analyzeSEO | lib/meni/seo.ts | `result.seo.score` | Secundario |
| **Discover** | analyzeDiscover | lib/meni/discover.ts | `result.discover.score` | Secundario |
| **AdSense** | analyzeAdSense | lib/meni/adsense.ts | `result.adsense.score` | Secundario |
| **Forense** | analyzeForensic | lib/meni/forensic.ts | `result.forense.score` | Secundario |
| **Aporte propio** | buildValorEditorial | lib/meni/editor-chief.ts | `result.evidence.originality.tieneAportePropio` | No pesa en scoreFinal |
| **ADN NI** | computeEditorialDNA | lib/meni/editorial-dna/engine.ts:52 | Promedio ponderado de dimensiones | No pasa a scoreFinal |

### Pesos ADN NI (computeEditorialDNA)

| Variable | Peso | Máximo | Mínimo | Función |
| --- | --- | --- | --- | --- |
| exclusividad | 0.25 | 100 | 0 | computeEditorialDNA |

### Pesos Sello NI (computeEditorialDNA)

| Variable | Peso | Máximo | Mínimo | Función |
| --- | --- | --- | --- | --- |
| explica | 0.2 | 100 | 0 | computeEditorialDNA |

`MIN_APPROVED_SCORE`: `lib/meni/scoring.ts` línea 3; valor = `Number(process.env.MENI_MIN_APPROVED_SCORE || '90')`.

## FASE 3 — Trazabilidad

```text
runMeniAsync(input)
  └─ runMeni(input)
       └─ evaluateMeni(input)
            ├─ detectTier(input.titulo, contenido, categoria)
            ├─ getPerfilEditorial(...)
            ├─ runEditorialBrain({...input, tierThresholds})
            │    ├─ runNewsValueEngine
            │    ├─ runCompetitionEngine
            │    ├─ runNicaraguaInformateEngine
            │    ├─ runReaderQuestionsEngine
            │    ├─ runExplanationEngine
            │    ├─ runEditorialDifferenceEngine
            │    ├─ runPublicValueEngine
            │    ├─ runReaderRetentionEngine
            │    ├─ runStoryCompletenessEngine
            │    ├─ runIntelligenceEngine
            │    ├─ runStoryPlanner
            │    ├─ runAntiClickbait
            │    ├─ runReaderJourney
            │    ├─ runUtilityGate
            │    ├─ buildDiagnostico
            │    ├─ computeEditorialDNA (adnNI)
            │    ├─ calcularEvaluacionCategoria
            │    └─ calcularScoreEjecutivo → { score, puntosPerdidos }
            ├─ pipelineV4(input) → EvaluacionEditorial (secundaria)
            ├─ analyzeSEO, analyzeForensic, analyzeEEAT, analyzeDiscover, analyzeAdSense, buildValorEditorial, audit
            ├─ runQualityGate (bloqueos técnicos)
            ├─ scoreFinal = editorialDecision.score
            └─ return MeniResult
```

## FASE 4 — Dependencias detectadas

- **h2**: lib/meni/autocorrect.ts
- **strong**: lib/meni/autocorrect.ts
- **keywords**: lib/meni/autocorrect.ts, lib/meni/editor-autonomo/engine.ts, lib/meni/editor-jefe/correction-tracker.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-brain/types.ts, lib/meni/editorial-profiles.ts, lib/meni/intelligence/google-engine.ts, lib/meni/intelligence/types.ts, lib/meni/knowledge-base/entity-extractor.ts, lib/meni/seguimiento/case-detector.ts, lib/meni/seo.ts, lib/meni/types.ts, lib/meni/utils/keywords.ts
- **schema**: lib/meni/intelligence/google-engine.ts, lib/meni/intelligence/types.ts, lib/meni/registry/registry-types.ts, lib/meni/registry/registry.ts
- **autor**: lib/meni/anti-clickbait/index.ts, lib/meni/core.ts, lib/meni/diagnostics.ts, lib/meni/editor-autonomo/engine.ts, lib/meni/editorial-brain/competition-engine.ts, lib/meni/editorial-brain/explanation-engine.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-brain/profiles/medio-ambiente.ts, lib/meni/editorial-brain/profiles/salud.ts, lib/meni/editorial-brain/reader-questions-engine.ts, lib/meni/editorial-brain/story-completeness-engine.ts, lib/meni/editorial-contract.ts, lib/meni/editorial-profiles.ts, lib/meni/eeat.ts, lib/meni/intelligence/clarity-engine.ts, lib/meni/intelligence/structure-engine.ts, lib/meni/learning-engine/learning-adapter.ts, lib/meni/learning-engine/metrics-collector.ts, lib/meni/learning-engine/types.ts, lib/meni/learning-engine/weight-tuner.ts, lib/meni/modules/sucesos.ts, lib/meni/portada-intel/balance-analyzer.ts, lib/meni/portada-intel/conflict-detector.ts, lib/meni/portada-intel/strategy-engine.ts, lib/meni/portada-intel/types.ts, lib/meni/publication-pipeline.ts, lib/meni/quality-gate/rules.ts, lib/meni/reader-journey/index.ts, lib/meni/story-planner/index.ts, lib/meni/types.ts, lib/meni/utils/angles.ts
- **fuente**: lib/meni/autocorrect.ts, lib/meni/core.ts, lib/meni/diagnostics.ts, lib/meni/editor-autonomo/engine.ts, lib/meni/editor-autonomo/types.ts, lib/meni/editorial-brain/competition-engine.ts, lib/meni/editorial-brain/diagnostico.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-brain/nicaragua-informate-engine.ts, lib/meni/editorial-brain/types.ts, lib/meni/editorial-contract.ts, lib/meni/editorial-dna/engine.ts, lib/meni/editorial-profiles.ts, lib/meni/editorial-reason.ts, lib/meni/editorial-tiers.ts, lib/meni/eeat.ts, lib/meni/intelligence/google-engine.ts, lib/meni/intelligence/originality-engine.ts, lib/meni/intelligence/reader-value-engine.ts, lib/meni/intelligence/types.ts, lib/meni/learning-engine/insight-generator.ts, lib/meni/learning-engine/metrics-collector.ts, lib/meni/learning-engine/pattern-analyzer.ts, lib/meni/learning-engine/types.ts, lib/meni/modules/espectaculos.ts, lib/meni/modules/internacionales.ts, lib/meni/modules/sucesos.ts, lib/meni/modules/tecnologia.ts, lib/meni/quality-gate/editorScore.ts, lib/meni/quality-gate/quality-gate.ts, lib/meni/quality-gate/transcription-detector.ts, lib/meni/quality-gate/types.ts, lib/meni/quality-gate/validator.ts, lib/meni/reader-journey/types.ts, lib/meni/registry/registry-store.ts, lib/meni/story-planner/index.ts, lib/meni/story-planner/types.ts, lib/meni/types.ts
- **categoria**: lib/meni/autocorrect.ts, lib/meni/core.ts, lib/meni/diagnostics.ts, lib/meni/editor-autonomo/engine.ts, lib/meni/editor-autonomo/types.ts, lib/meni/editor-brain/index.ts, lib/meni/editor-brain/types.ts, lib/meni/editor-jefe/correction-tracker.ts, lib/meni/editor-jefe/editorial-memory.ts, lib/meni/editor-jefe/ranking.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-brain/news-value-engine.ts, lib/meni/editorial-brain/nicaragua-informate-engine.ts, lib/meni/editorial-brain/profiles/cultura.ts, lib/meni/editorial-brain/profiles/default.ts, lib/meni/editorial-brain/profiles/deportes-colectivos.ts, lib/meni/editorial-brain/profiles/deportes-individuales.ts, lib/meni/editorial-brain/profiles/deportes.ts, lib/meni/editorial-brain/profiles/economia.ts, lib/meni/editorial-brain/profiles/educacion.ts, lib/meni/editorial-brain/profiles/espectaculos.ts, lib/meni/editorial-brain/profiles/index.ts, lib/meni/editorial-brain/profiles/internacionales.ts, lib/meni/editorial-brain/profiles/medio-ambiente.ts, lib/meni/editorial-brain/profiles/nacionales.ts, lib/meni/editorial-brain/profiles/politica.ts, lib/meni/editorial-brain/profiles/salud.ts, lib/meni/editorial-brain/profiles/sucesos.ts, lib/meni/editorial-brain/profiles/tecnologia.ts, lib/meni/editorial-brain/profiles/types.ts, lib/meni/editorial-brain/reader-questions-engine.ts, lib/meni/editorial-brain/types.ts, lib/meni/editorial-contract.ts, lib/meni/editorial-dna/engine.ts, lib/meni/editorial-profiles.ts, lib/meni/editorial-reason.ts, lib/meni/editorial-tiers.ts, lib/meni/intelligence/angle-engine.ts, lib/meni/intelligence/background-engine.ts, lib/meni/intelligence/facebook-engine.ts, lib/meni/intelligence/google-engine.ts, lib/meni/intelligence/types.ts, lib/meni/knowledge-base/entity-extractor.ts, lib/meni/knowledge-base/relation-builder.ts, lib/meni/knowledge-base/types.ts, lib/meni/learning-engine/insight-generator.ts, lib/meni/learning-engine/metrics-collector.ts, lib/meni/learning-engine/pattern-analyzer.ts, lib/meni/learning-engine/types.ts, lib/meni/modules/index.ts, lib/meni/portada-intel/balance-analyzer.ts, lib/meni/portada-intel/conflict-detector.ts, lib/meni/portada-intel/index.ts, lib/meni/portada-intel/strategy-engine.ts, lib/meni/publication-pipeline.ts, lib/meni/quality-gate/autoFix.ts, lib/meni/quality-gate/editorScore.ts, lib/meni/quality-gate/quality-gate.ts, lib/meni/quality-gate/transcription-detector.ts, lib/meni/quality-gate/types.ts, lib/meni/quality-gate/validator.ts, lib/meni/reader-journey/types.ts, lib/meni/registry/registry.ts, lib/meni/scoring.ts, lib/meni/seo.ts, lib/meni/story-planner/index.ts, lib/meni/story-planner/types.ts, lib/meni/types.ts, lib/meni/utils/angles.ts
- **resumen**: lib/meni/autocorrect.ts, lib/meni/core.ts, lib/meni/editor-autonomo/engine.ts, lib/meni/editor-brain/index.ts, lib/meni/editorial-brain/competition-engine.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-reason.ts, lib/meni/knowledge-base/types.ts, lib/meni/learning-engine/metrics-collector.ts, lib/meni/learning-engine/pattern-analyzer.ts, lib/meni/learning-engine/types.ts, lib/meni/learning-engine/weight-tuner.ts, lib/meni/publication-pipeline.ts, lib/meni/seguimiento/types.ts, lib/meni/seo.ts, lib/meni/types.ts
- **lead**: lib/meni/diagnostics.ts, lib/meni/editorial-contract.ts, lib/meni/intelligence/structure-engine.ts, lib/meni/story-planner/index.ts
- **longitud**: lib/meni/adsense.ts, lib/meni/anti-clickbait/index.ts, lib/meni/architect.ts, lib/meni/autocorrect.ts, lib/meni/core.ts, lib/meni/diagnostics.ts, lib/meni/editor-autonomo/engine.ts, lib/meni/editor-brain/index.ts, lib/meni/editor-jefe/correction-tracker.ts, lib/meni/editor-jefe/editorial-memory.ts, lib/meni/editor-jefe/ranking.ts, lib/meni/editorial-brain/competition-engine.ts, lib/meni/editorial-brain/diagnostico.ts, lib/meni/editorial-brain/editorial-difference-engine.ts, lib/meni/editorial-brain/explanation-engine.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-brain/news-value-engine.ts, lib/meni/editorial-brain/nicaragua-informate-engine.ts, lib/meni/editorial-brain/reader-questions-engine.ts, lib/meni/editorial-brain/reader-retention-engine.ts, lib/meni/editorial-brain/story-completeness-engine.ts, lib/meni/editorial-brain/utility-gate.ts, lib/meni/editorial-brain/verification.ts, lib/meni/editorial-dna/engine.ts, lib/meni/editorial-profiles.ts, lib/meni/editorial-reason.ts, lib/meni/editorial-tiers.ts, lib/meni/intelligence/angle-engine.ts, lib/meni/intelligence/background-engine.ts, lib/meni/intelligence/clarity-engine.ts, lib/meni/intelligence/context-engine.ts, lib/meni/intelligence/facebook-engine.ts, lib/meni/intelligence/google-engine.ts, lib/meni/intelligence/index.ts, lib/meni/intelligence/originality-engine.ts, lib/meni/intelligence/reader-value-engine.ts, lib/meni/intelligence/structure-engine.ts, lib/meni/knowledge-base/entity-extractor.ts, lib/meni/knowledge-base/index.ts, lib/meni/knowledge-base/knowledge-query.ts, lib/meni/knowledge-base/relation-builder.ts, lib/meni/knowledge-base/timeline-builder.ts, lib/meni/learning-engine/index.ts, lib/meni/learning-engine/insight-generator.ts, lib/meni/learning-engine/metrics-collector.ts, lib/meni/learning-engine/pattern-analyzer.ts, lib/meni/learning-engine/types.ts, lib/meni/learning-engine/weight-tuner.ts, lib/meni/modules/deportes.ts, lib/meni/modules/nacionales.ts, lib/meni/modules/sucesos.ts, lib/meni/modules/tecnologia.ts, lib/meni/portada-intel/balance-analyzer.ts, lib/meni/portada-intel/conflict-detector.ts, lib/meni/portada-intel/index.ts, lib/meni/portada-intel/strategy-engine.ts, lib/meni/publication-pipeline.ts, lib/meni/quality-gate/autoFix.ts, lib/meni/quality-gate/editorScore.ts, lib/meni/quality-gate/quality-gate.ts, lib/meni/quality-gate/transcription-detector.ts, lib/meni/quality-gate/validator.ts, lib/meni/reader-journey/index.ts, lib/meni/registry/registry-store.ts, lib/meni/registry/registry-sync.ts, lib/meni/registry/registry.ts, lib/meni/seguimiento/case-linker.ts, lib/meni/seguimiento/case-manager.ts, lib/meni/seguimiento/index.ts, lib/meni/seo.ts, lib/meni/story-planner/index.ts, lib/meni/utils/helpers.ts, lib/meni/utils/keywords.ts
- **institucion**: lib/meni/autocorrect.ts, lib/meni/editor-autonomo/engine.ts, lib/meni/editor-brain/index.ts, lib/meni/editor-brain/types.ts, lib/meni/editorial-brain/diagnostico.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-brain/profiles/nacionales.ts, lib/meni/editorial-brain/profiles/politica.ts, lib/meni/editorial-brain/types.ts, lib/meni/intelligence/clarity-engine.ts, lib/meni/intelligence/context-engine.ts, lib/meni/intelligence/types.ts, lib/meni/knowledge-base/entity-extractor.ts, lib/meni/knowledge-base/knowledge-query.ts, lib/meni/knowledge-base/relation-builder.ts, lib/meni/knowledge-base/types.ts, lib/meni/modules/nacionales.ts, lib/meni/modules/tecnologia.ts, lib/meni/quality-gate/types.ts, lib/meni/quality-gate/validator.ts, lib/meni/reader-journey/index.ts, lib/meni/seguimiento/case-linker.ts, lib/meni/story-planner/index.ts, lib/meni/utils/angles.ts, lib/meni/utils/entities.ts
- **fecha**: lib/meni/auditor.ts, lib/meni/core.ts, lib/meni/diagnostics.ts, lib/meni/discover.ts, lib/meni/editor-autonomo/engine.ts, lib/meni/editor-jefe/correction-tracker.ts, lib/meni/editor-jefe/editorial-memory.ts, lib/meni/editor-jefe/ranking.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-brain/news-value-engine.ts, lib/meni/editorial-brain/types.ts, lib/meni/editorial-contract.ts, lib/meni/editorial-profiles.ts, lib/meni/intelligence/background-engine.ts, lib/meni/intelligence/context-engine.ts, lib/meni/intelligence/reader-value-engine.ts, lib/meni/intelligence/structure-engine.ts, lib/meni/intelligence/types.ts, lib/meni/learning-engine/metrics-collector.ts, lib/meni/learning-engine/pattern-analyzer.ts, lib/meni/learning-engine/types.ts, lib/meni/portada-intel/balance-analyzer.ts, lib/meni/portada-intel/conflict-detector.ts, lib/meni/portada-intel/strategy-engine.ts, lib/meni/publication-pipeline.ts, lib/meni/quality-gate/rules.ts, lib/meni/quality-gate/types.ts, lib/meni/quality-gate/validator.ts, lib/meni/seguimiento/alert-generator.ts, lib/meni/seguimiento/types.ts, lib/meni/story-planner/index.ts, lib/meni/types.ts, lib/meni/utils/angles.ts, lib/meni/utils/entities.ts
- **cifra**: lib/meni/anti-clickbait/index.ts, lib/meni/auditor.ts, lib/meni/editorial-brain/competition-engine.ts, lib/meni/editorial-brain/index.ts, lib/meni/editorial-brain/nicaragua-informate-engine.ts, lib/meni/editorial-brain/public-value-engine.ts, lib/meni/editorial-brain/story-completeness-engine.ts, lib/meni/editorial-profiles.ts, lib/meni/intelligence/context-engine.ts, lib/meni/intelligence/reader-value-engine.ts, lib/meni/intelligence/structure-engine.ts, lib/meni/intelligence/types.ts, lib/meni/story-planner/index.ts, lib/meni/utils/angles.ts, lib/meni/utils/entities.ts

## FASE 5 — Pesos reales

### Peso de los puntos perdidos (calcularScoreEjecutivo)

| Concepto | Puntos |
| --- | --- |
| Transcribir / copiar / plagiar / boletín | 10 |
| Sensacionalismo / clickbait / prohibida | 8 |
| Dato / cifra / nombre / fuente | 4 |
| Longitud / extensión / relleno / redacción | 3 |
| No enseña nada nuevo al lector | 25 |
| No aporta razón para leerla en Nicaragua Informate | 25 |
| Aporte editorial inválido (SEO/redacción no son valor) | 15 |
| Términos faltantes de la matriz de categoría | 2 |

### Puntos por categoría (calcularEvaluacionCategoria)

- Cada intención de contexto, explicación y servicio: **2 puntos**.
- Score de categoría = `100 - (perdidos / total) * 100`.
- Los términos se buscan en `titulo + contenido + resumen`, normalizados (minúsculas, sin tildes).

## FASE 6 — Saturación

Funciones / líneas donde se detectan techos o saturaciones:

| Archivo | Línea | Código |
| --- | --- | --- |
| lib/meni/anti-clickbait/index.ts | 110 | `let score = 100;` |
| lib/meni/editorial-brain/index.ts | 379 | `confianza = Math.max(0, Math.min(100, Math.round(confianza)));` |
| lib/meni/editorial-brain/index.ts | 560 | `let score = 100 - puntosPerdidos.reduce((s, p) => s + p.puntos, 0);` |
| lib/meni/editorial-brain/index.ts | 563 | `score = Math.max(0, Math.min(100, Math.round(score)));` |
| lib/meni/editorial-brain/story-completeness-engine.ts | 85 | `let score = 100;` |
| lib/meni/editorial-brain/utility-gate.ts | 88 | `const score = Math.max(0, Math.min(100, baseScore + bonusServicio + bonusConocimiento - penalty));` |
| lib/meni/editorial-dna/engine.ts | 27 | `function clamp(n: number, min = 0, max = 100): number {` |
| lib/meni/editorial-dna/engine.ts | 27 | `function clamp(n: number, min = 0, max = 100): number {` |
| lib/meni/editorial-dna/engine.ts | 122 | `let transcripcionScore = 100;` |
| lib/meni/editorial-dna/engine.ts | 127 | `transcripcionScore = clamp(Math.round(originality * 0.6 + (100 - transcription) * 0.4));` |
| lib/meni/editorial-dna/engine.ts | 143 | `const memoriaScore = clamp(60 + total * 10); // Sin artículos = 60 (no penaliza), 1 = 70, 3 = 90, 4+ = 100` |
| lib/meni/intelligence/facebook-engine.ts | 55 | `if (copy.length >= 100 && copy.length <= 500) score += 20;` |
| lib/meni/intelligence/originality-engine.ts | 131 | `if (explicacion >= 70 && contexto >= 60) score = 100;` |
| lib/meni/quality-gate/editorScore.ts | 52 | `const reescritura = 100 - porcentajeTranscripcion;` |
| lib/meni/quality-gate/editorScore.ts | 90 | `let score = 100;` |
| lib/meni/seguimiento/case-manager.ts | 154 | `export async function getAllCases(db: Firestore, limit = 100): Promise<TrackingCase[]> {` |
| lib/meni/utils/helpers.ts | 28 | `export function clamp(value: number, min = 0, max = 100): number {` |
| lib/meni/utils/helpers.ts | 28 | `export function clamp(value: number, min = 0, max = 100): number {` |

## FASE 7 — Explicación de los Δ = 0

### Causa matemática

1. El único valor que llega a `scoreFinal` es `editorialDecision.score`, generado por `calcularScoreEjecutivo`.
2. `calcularScoreEjecutivo` no suma puntos. Parte de 100 y **resta** por cada problema.
3. Los problemas se dividen en:
   - **puntosCategoria**: términos del contrato editorial que faltan en `titulo + contenido + resumen`.
   - **acciones**: recomendaciones de los sub-motores cuyo texto contiene palabras clave.
   - **readerLearning / editorialContribution**: penalizaciones si no responde a `>10` caracteres o si el aporte es SEO/redacción.
4. Ninguno de los 10 experimentos agregó los **sinónimos exactos** que el contrato busca, por lo que `puntosPerdidos` no cambió.
5. Los módulos secundarios (`analyzeSEO`, `analyzeEEAT`, `audit`, etc.) ya devolvían 100 antes de los experimentos y no participan en `scoreFinal`.

### Función que impide el aumento

`calcularScoreEjecutivo` en `lib/meni/editorial-brain/index.ts` es una resta decreciente. Aunque el HTML mejore la estructura, si no se cubren los términos de la matriz de categoría y no desaparecen las acciones/penalizaciones, el score no puede subir.

### Por qué reorganizar no tiene efecto

- `calcularEvaluacionCategoria` hace `texto = titulo + contenido + resumen`, normalizado, y busca substrings.
- No evalúa jerarquía HTML, H2, párrafos ni secciones. Sólo importa si el texto contiene los sinónimos.
- `calcularScoreEjecutivo` y `calcularEvaluacionCategoria` son insensibles a cambios estructurales puros.

## FASE 8 — Recomendaciones (sin modificar código)

Para que MENI premie antecedentes, contexto, impacto ciudadano, cronología, marco legal o explicación práctica, habría que modificar:

- `lib/meni/editorial-brain/index.ts` → `calcularScoreEjecutivo` para cambiar la fórmula de 100 − X a una que sume bonificaciones.
- `lib/meni/editorial-brain/index.ts` → `calcularEvaluacionCategoria` para reconocer secciones estructurales (H2) como cumplimiento, no sólo substrings.
- `lib/meni/editorial-dna/engine.ts` → `computeEditorialDNA` para que `adnNI` influya en el score final.
- `lib/meni/core.ts` → `evaluateMeni` para usar `editorialDna.adnNI` o una combinación con `editorialDecision.score`.
- `lib/meni/editorial-contract.ts` → `CONTRATO_GLOBAL` para ampliar sinónimos de contexto/explicación/servicio.
- `lib/meni/auditor.ts` → `audit` si se desea que `originalidad`, `utilidad`, `redaccion` aporten al score.
