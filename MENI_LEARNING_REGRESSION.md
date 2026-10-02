# MENI Learning 4.0 — Evidencia de regresión ("no daño")

**Fecha:** 2026-10-02 · **Suite:** vitest completa + evaluación real en producción

## 1. Suite automatizada

| Verificación | Resultado |
|---|---|
| `npx tsc --noEmit` | limpio |
| `eslint --max-warnings 0` | limpio |
| Suite completa vitest | **1,174/1,174 tests verdes** (100 archivos) |
| `npm run build` | exitoso (102 páginas) |
| `tests/meni-learning-4.0.test.ts` (nuevo) | **18/18** |

`tests/swiss-watch.test.ts` requería actualizar el espejo de crons
(`DECLARED_CRONS` 9→10 + `vercel.json`) — hecho; el guard de deriva
vuelve a verde.

## 2. Invariantes cubiertos por tests nuevos

- Filtro trivial: whitespace/HTML no es corrección; cambio real sí.
- `inferCorrectionKind` clasifica actor → kind correcto.
- Mutaciones del sistema (SUGERENCIA/AUTO) **no** fabrican patrones;
  solo `DECISION_HUMANA` cuenta como evidencia.
- `detectAndPersistPattern` requiere ≥3 correcciones humanas.
- Patrón ACTIVE → sugerencia con evidencia explícita (casos/confianza/versión).
- Patrón de otra categoría no se aplica (salvo `General`).
- **Invariante de score:** patrón ACTIVE + predicciones no cambian
  `score` ni `publicar` del brain.
- `loadEditorPatterns` solo devuelve `learningState === 'ACTIVE'`.
- `detectSelfInducedDefects` detecta la firma autofix→defecto nuevo.
- **CONCAT_MOTOCICLETA:** `motocicleta` correcto → sin defecto ni
  auto-inducido; `motocicletacicletas` → sigue bloqueando.
- FP registry: dedup por (code, contexto) con ocurrencias acumuladas.
- Prediction context: <3 validadas → `null` (evidencia insuficiente);
  ≥3 → tasa real; no validadas excluidas.

## 3. Regresión en producción (30 + 10 notas reales)

| Chequeo | Resultado |
|---|---|
| Score idéntico antes/después | 30/30 y 10/10 |
| Cambio en decisión de publicación | 0 |
| Nuevos blockingIssues del Quality Gate | 0 |
| Fuentes/factuality alteradas | ninguna (capas no tocadas) |
| Supervisor / Forense alterados | ninguno (no se modificaron) |
| Bloqueos falsos nuevos | 0 |
| Contexto de aprendizaje usado | 30/30 (pre-KB) y 10/10 (post-KB) |
| Trazabilidad presente | `aprendizaje.conocimientoVersion` + `noticia.meniLearning` |

## 4. Lo que NO se activó

- `ENABLE_MENI_LEARNING` sigue sin valor en `.env.local` →
  `loadActiveAdjustments` no corre → determinismo intacto.
- 0 patrones en estado `ACTIVE` (no hay evidencia humana suficiente aún).
- `meni_adjustments` = 0 — ningún ajuste de pesos activo.
- Weight tuning del learning cycle: propuestas persistidas, nunca aplicadas.

## 5. Comandos de verificación

```bash
npx tsc --noEmit
npx eslint . --ext .ts,.tsx --max-warnings 0
npm run test
npm run build
npx vitest run tests/meni-learning-4.0.test.ts
npx tsx .audit/meni-learning-4.0-circuit.ts   # evidencia prod (escribe solo en colecciones de aprendizaje)
```
