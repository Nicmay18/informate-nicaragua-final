# ARTICLE REVIVAL ENGINE — NIOS CEO v1

| Campo | Valor |
|-------|-------|
| Estado | OPERATIVO (P0) |
| Última revisión | 2026-08-30 |

## Módulos

1. `lib/nios/intelligence/adsense-recovery.ts` — detecta artículos sin cumplimiento AdSense.
2. `lib/nios/intelligence/content-recovery.ts` — propone recuperación de contenido thin.
3. `lib/nios/intelligence/opportunity-hunter.ts` — oportunidades de crecimiento.
4. `lib/nios/lifecycle/tracker.ts` — seguimiento del ciclo de vida de cada noticia.

## Tipos

- `LifecycleInsight` con `stage`, `substance`, `priority`.
- `ContentRecoveryReport` con artículos recuperables.
- `ImprovementRecommendation` con acciones canónicas.

## Funcionamiento

1. El pipeline carga noticias desde Firestore.
2. `buildLifecycleInsights` clasifica cada noticia en `OBSERVED`, `LEARNING`, `UPDATE_REQUIRED`.
3. `generateAdSenseRecovery` y `generateContentRecovery` producen listas de mejora.
4. El CEO loop convierte insights en `observations` y `decisions`.
5. Las decisiones `QUEUE_FOR_HUMAN` entran al `humanQueue` del `dailyBrief`.

## Verificación

- Tests: `tests/ceo-agent-final.test.ts`, `tests/nios-executive.test.ts`.
- `npm run build` OK.
