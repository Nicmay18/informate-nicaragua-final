# AUDIENCE INTELLIGENCE — NIOS CEO v1

| Campo | Valor |
|-------|-------|
| Estado | OPERATIVO (P0) |
| Última revisión | 2026-08-30 |

## Módulos

1. `lib/observability/` — journey tracking, agregaciones y brief.
2. `lib/analytics/traffic-reader.ts` — lectura de tráfico desde Firestore.
3. `lib/analytics/traffic-aggregator.ts` — agregación temporal.
4. `lib/nios/audience/` — inteligencia de audiencia y recirculación.

## Métricas

- `users24h`, `sessions24h`, `avgEngagementSec`
- `singlePageRate`, `avgPagesPerSession`
- `totalViews24h`, `trafficArticles`

## Contratos

- `JourneyMetrics` con `dataStatus`, `period`, `sessions`, `pageViews`.
- `GrowthOpportunity` con `type`, `articleSlug`, `diagnosis`, `evidence`, `action`.

## Privacidad

- `buildJourneyEvent` sanitiza PII y referrers sensibles.
- Datos con TTL de 30 días.

## Verificación

- `tests/journey-tracking.test.ts` 4/4.
- `npm run build` OK.
