feat(observability): Bloque 2 - Journey Tracking y observabilidad sin PII

- components/JourneyTracker.tsx: cliente ligero que registra navegacion,
  recirculacion, busquedas y sesiones anonimas en sessionStorage (30min idle).
- app/layout.tsx: integra JourneyTracker dentro de Suspense para SSR seguro.
- app/api/telemetry/journey/route.ts: endpoint de ingesta tolerante a fallos
  con sanitizacion estricta (sin IP, sin email, referrers limpios).
- lib/observability/log.ts: detector robusto de navegadores y dispositivos.
- tests/journey-tracking.test.ts: 4/4 tests verificando privacidad y TTL (30d).
- Suite total: 42/42 tests PASS, tsc --noEmit 0 errores.

Generated with [Devin](https://cli.devin.ai/docs)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
