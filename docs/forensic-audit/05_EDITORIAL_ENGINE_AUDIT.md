# 05 — EDITORIAL ENGINE AUDIT (MENI + NIOS + Editor V4)

**Auditor:** Editor en Jefe + Content Architect
**Fecha:** 2026-08-03

---

## 1. MAPA DEL MOTOR EDITORIAL

```
lib/editorial/     → 33 módulos (Motor core V4 — ESTABLE v1.0.0)
lib/meni/          → 141 módulos (MENI v2.1 — Scoring editorial)
lib/nios/          → 54 módulos (NIOS v5 — Sistema operativo editorial)
lib/editor-jefe-v4/ → (dentro de editorial/)
```

### Motor Editorial V4 (`lib/editorial/core/`)
- **Tag:** `v1.0.0-editorial-engine-stable`
- **Estado:** CONGELADO — prohibido tocar salvo bugs críticos
- **Función:** `evaluate(noticia)` → retorna `ResultadoEditorial` con scores por dimensión
- **Dimensiones:** AdSense, EEAT, Forense, SEO, Valor Editorial, Riesgo
- **Niveles:** ORO, FORENSE, PLATA, BRONCE, RECHAZADO

### MENI v2.1 (`lib/meni/`)
- **Función:** Pipeline editorial de 11 fases (0-10)
- **Sub-módulos:**
  - `contextualiza.ts` — Score de contextualización (7 sub-métricas)
  - `profile-detector.ts` — Detección de perfil editorial
  - `editorial-profiles.ts` — Perfiles especializados (sucesos, internacionales, etc.)
  - `editorial-dna/` — ADN editorial del Sello NI
  - `quality-gate/` — Puerta de calidad
  - `knowledge-base/` — Base de conocimiento
  - `learning-engine/` — Motor de aprendizaje
  - `anti-clickbait/` — Anti-clickbait
  - `modules/` — Módulos especializados por categoría

### NIOS v5 (`lib/nios/`)
- **Función:** Sistema operativo editorial ejecutivo
- **Sub-módulos:**
  - `command-center/` — Centro de mando (14 items)
  - `business/` — Inteligencia de negocio
  - `copilot/` — Copiloto editorial
  - `distribution-agent/` — Agente de distribución
  - `editorial-memory/` — Memoria editorial
  - `entity-brain/` — Cerebro de entidades
  - `mission-engine/` — Motor de misiones
  - `watcher/` — Vigilancia

## 2. HALLAZGOS

### H-EDI-01: Motor editorial core V4 estable y probado
- **Evidencia:** Tag `v1.0.0-editorial-engine-stable`, 176 noticias reales verificadas con 0 anomalías
- **Evidencia:** `tests/seo-effective.test.ts` — 10 tests de paridad SEO
- **Evidencia:** `tests/meni-calibration.test.ts` — tests de calibración
- **Impacto:** Positivo — motor confiable
- **Riesgo:** N/A
- **Prioridad:** N/A

### H-EDI-02: `computeContextScore` ampliado semánticamente
- **Evidencia:** `lib/meni/contextualiza.ts:107-188` — señales expandidas con sinónimos periodísticos
- **Evidencia:** `normalize()` ahora limpia HTML tags
- **Impacto:** Positivo — mejor detección de evidencia
- **Riesgo:** N/A

### H-EDI-03: 141 módulos en `lib/meni/` — posible sobre-ingeniería
- **Evidencia:** `lib/meni/` tiene 141 items incluyendo subdirectorios con 2-12 items cada uno
- **Impacto:** Complejidad de mantenimiento
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Documentar qué módulos están activos vs deprecated

### H-EDI-04: NIOS v5 con 54 módulos — sistema operativo editorial pesado
- **Evidencia:** `lib/nios/` tiene 54 items, `command-center/` solo tiene 14 items
- **Impacto:** Mucha lógica ejecutiva que puede no estar en uso activo
- **Riesgo:** MEDIO
- **Prioridad:** P2

### H-EDI-05: `editorial-contract.ts` tiene 35KB
- **Evidencia:** `lib/meni/editorial-contract.ts` = 35,659 bytes
- **Impacto:** Archivo monolítico que define contratos editoriales
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-EDI-06: `publication-pipeline.ts` tiene 14KB
- **Evidencia:** `lib/meni/publication-pipeline.ts` = 14,012 bytes
- **Impacto:** Pipeline de publicación complejo
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-EDI-07: Tests de calibración pasan correctamente
- **Evidencia:** `npm run test:merge` → 125 tests pasados, 0 fallos
- **Evidencia:** Tests cubren: calibración MENI, normalización keywords, SEO efectivo, env validation, content war room, CEO daily decision, business health, command center
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-EDI-08: Perfiles editoriales especializados por categoría
- **Evidencia:** `lib/meni/editorial-profiles.ts` = 13,117 bytes — define perfiles para sucesos, internacionales, nacionales, deportes, espectáculos, tecnología
- **Evidencia:** `lib/meni/modules/` — 8 módulos especializados
- **Impacto:** Positivo — especialización editorial
- **Riesgo:** N/A

### H-EDI-09: `editorial-dna/engine.ts` integra contextualización con Sello NI
- **Evidencia:** `lib/meni/editorial-dna/engine.ts` — `selloNI.contextualiza` derivado de `storyCompleteness.score` o `evaluacion?.discover?.score`
- **Impacto:** Positivo — trazabilidad editorial
- **Riesgo:** N/A

### H-EDI-10: Sistema de recomendaciones filtrado por perfil
- **Evidencia:** Commit `8bd673a` — "UI usa recomendacionesContextuales filtradas + muestra profile_used y meniVersion en diagnostico"
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-EDI-11: Debug trace implementado en Editor V4.1
- **Evidencia:** `lib/editor-jefe-v4/score-tracer.ts` — traza inicio, suma ponderada, pisos, bonificaciones, penalizaciones
- **Evidencia:** `EditorDebugPanel.tsx` — muestra tablas de trazabilidad
- **Impacto:** Positivo — transparencia del scoring
- **Riesgo:** N/A

### H-EDI-12: Separación de sugerencias de estilo vs penalizaciones
- **Evidencia:** Commit `60f30f2` — "FORENSE ya no resta puntos por adjetivos emocionales, transiciones IA, redundancia, riesgos legales"
- **Impacto:** Positivo — no penaliza estilo, solo registra
- **Riesgo:** N/A

## 3. COBERTURA DE TESTS

| Suite | Tests | Estado |
|---|---|---|
| `meni-calibration.test.ts` | ~15 | ✅ |
| `meni-closing.test.ts` | ~10 | ✅ |
| `seo-effective.test.ts` | 10 | ✅ |
| `normalize-keywords.test.ts` | 9 | ✅ |
| `env.test.ts` | 4 | ✅ |
| Command Center integration | 4 | ✅ |
| CEO Daily Decision | 5 | ✅ |
| Content War Room | 2 | ✅ |
| Business Health | 2 | ✅ |
| **Total** | **125** | **All pass** |

**Cobertura faltante:**
- No hay tests E2E de Playwright en CI (config existe pero no ejecutado)
- No hay tests del NIOS command-center automatizados
- No hay tests de los 67+ API routes admin

## 4. SCORE

| Dimensión | Score |
|---|---|
| Motor core V4 | 9/10 |
| MENI v2.1 | 7/10 |
| NIOS v5 | 6/10 |
| Tests | 7/10 |
| Mantenibilidad | 5/10 |
| Documentación | 6/10 |
| **Total** | **6.7/10** |
