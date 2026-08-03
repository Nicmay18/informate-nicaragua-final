# ARCHITECTURE_STATUS.md
## FASE 1 — Arquitectura MENI

Flujo confirmado:

```
Editor
  ↓
API / Server Action
  ↓
runMeni() | runMeniAsync()
  ↓
profile-detector.ts  → perfil detectado
  ↓
core.ts → evaluateMeni()
  ↓
pipelineV4 (técnico)
  ↓
runEditorialBrain (única fuente de verdad)
  ↓
runQualityGate (chequeo factual/técnico)
  ↓
MeniResult (finalEditorialScore, estadoFinal, contextScore, articleHash, etc.)
  ↓
Dashboard
```

- **Fuente única de verdad:** `runEditorialBrain` produce `scoreFinal`, `finalEditorialScore`, `estadoFinal`.
- **Duplicaciones:** 0 funciones de evaluación duplicadas.
- **Lógica MENI V3/V3.2:** Los tests `meni-v3-dimensions.test.ts` y `meni-v3-2-penalizacion.test.ts` siguen pasando; MENI v2.1 es el pipeline activo en producción.
- **Variables sin uso:** 0 advertencias de ESLint (`--max-warnings 0`).
- **Código muerto:** No se detectaron funciones no referenciadas en `lib/meni`.
- **Rutas críticas:** OK (no redirecciones rotas, build exitoso).
