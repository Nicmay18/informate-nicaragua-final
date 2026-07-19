# Arquitectura del motor editorial determinístico

## Principio rector

Cada criterio se calcula exactamente una vez por un único módulo. Ningún otro módulo lo recalcula; consume el resultado ya calculado. Esto hace que las contradicciones sean matemáticamente imposibles si los invariantes se cumplen.

## Capas

1. **Extracción** — `lib/editorial/extractor.ts` lee el HTML/texto una sola vez y produce `ArticleEvidence`.
2. **Tipos unificados** — `lib/editorial/core/types.ts` contiene todos los tipos del motor.
3. **Calidad** — `lib/editorial/core/scorer.ts` calcula SEO, EEAT, Discover, AdSense y Valor Editorial.
4. **Riesgo** — `lib/editorial/core/risk-engine.ts` calcula Forense y AdSense safety.
5. **Decisión** — `lib/editorial/core/decision-engine.ts` aplica gates secuenciales y promedio ponderado.
6. **Explainability** — `lib/editorial/core/explainability.ts` genera un ítem exacto por penalización.
7. **Integrity** — `lib/editorial/core/integrity-engine.ts` verifica invariantes y falla ante contradicciones.
8. **Pipeline** — `lib/editorial/core/pipeline.ts` orquesta la ejecución.
9. **Compatibilidad V3** — `lib/editorial/core/mapper-v3.ts` mapea a `ResultadoAnalisis` sin recalcular.

## Flujo

```
NoticiaInput
    │
    ▼
extract()  ──►  ArticleEvidence  ──►  scoreCalidad()
                                          │
                                          ▼
                                 CalidadModules (SEO, EEAT, Discover, Adsense, ValorEditorial)
                                          │
                                          ▼
                              evaluateRisk()
                                          │
                                          ▼
                         { forense, adsense: { seguro, motivo } }
                                          │
                                          ▼
                               decide(CalidadModules, profile, seguro)
                                          │
                                          ▼
                         { scoreFinal, veredicto, calidad }
                                          │
                                          ▼
                      buildExplainability(módulos)
                                          │
                                          ▼
                         verifyIntegrity(EvaluacionEditorial)
                                          │
                                          ▼
                              EvaluacionEditorial
```

## Decision engine: gates

- **Gate EEAT**: si `eeat.score < profile.gates.eeatMinimo` → `no_publicar`.
- **Gate AdSense**: si `adsense.seguro === false` → el veredicto se capa a `publicar_estandar` como máximo.
- **Promedio ponderado**: `scoreFinal = Σ(score_i * peso_i) / Σ(pesos_i)`.
- **Veredicto**: se elige el primer umbral en `editorialThreshold` que supere `scoreFinal`.

## Integrity engine (invariantes)

- Cada `score` está en `[0,100]`.
- Cada traza inicia en 100 y `trace.end === score`.
- `scoreFinal` coincide con el promedio ponderado de los módulos de calidad.
- `scoreFinal` está entre el mínimo y máximo de los módulos de calidad.
- `explainability` tiene exactamente una entrada por penalización.
- La suma de `puntosPerdidos` por módulo explica `100 - score`.
- Si todos los módulos de calidad >= 95 y riesgo seguro, el veredicto mínimo es `publicar_destacado`.
- Forense 100 implica riesgo bajo y sin advertencias.
- AdSense seguro implica `palabrasSensibles` vacías en evidencia.

## Archivos eliminados / archivados

Los motores heredados se movieron a `removed/`:

- `lib/analizador-noticias.ts`
- `lib/generador-meta.ts`
- `lib/adsense-guard.ts`
- `lib/editor-jefe/`
- `lib/editor-jefe-v4/`
- `app/admin/dashboard-v4/`
- `app/api/admin/dashboard-v4/`
- `app/api/admin/shadow-detail/`
- `components/admin/EditorDebugPanel.tsx`

## Archivos creados / activos

- `lib/editorial/core/types.ts`
- `lib/editorial/core/score-tracer.ts`
- `lib/editorial/core/scorer.ts`
- `lib/editorial/core/risk-engine.ts`
- `lib/editorial/core/decision-engine.ts`
- `lib/editorial/core/explainability.ts`
- `lib/editorial/core/integrity-engine.ts`
- `lib/editorial/core/pipeline.ts`
- `lib/editorial/core/mapper-v3.ts`
- `lib/editorial/core/profile-loader.ts`
- `lib/editorial/meta.ts`
- `lib/editorial/adsense-safety.ts`
- `lib/editorial/index.ts` (única entrada pública)
- `tests/editorial-invariants.test.ts`

## Consumidores actualizados

- `app/api/admin/analizar/route.ts`
- `app/api/admin/analizar-v4/route.ts`
- `app/api/admin/analizar-forense/route.ts`
- `app/api/admin/analizar-paralelo/route.ts`
- `app/api/admin/guardar-directo/route.ts`
- `app/api/admin/portada/route.ts`
- `components/admin/portada/PortadaCard.tsx`
- `components/admin/AnalizadorPanel.tsx`
- `lib/portada/types.ts`
- `lib/portada/helpers.ts`
- `hooks/useThirdPartyScripts.ts`

## Verificación

```bash
npm run type-check
npx vitest run tests/editorial-invariants.test.ts
```

Ambos pasan. El motor es determinista: mismas entradas producen mismos scores y veredictos. Cada criterio se calcula una sola vez y los invariantes impiden contradicciones.
