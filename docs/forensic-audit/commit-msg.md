docs(forensic): PASS Fase 1 y Fase 2

- FORENSIC_ARCHITECTURE.md: estado PASS, evidencia de tests.
- DATA_CONTRACTS.md: estado PASS, corrige NoticiaInput (extiende EditorialNoticiaInput,
  no es duplicacion), anade contrato canónico de TrafficEvent/JourneyEvent.

Evidencia:
- tests/supervisor.test.ts: 29/29 PASS
- tests/adversarial-scoring-audit.test.ts: 10/10 PASS
- tests/observability.test.ts: 4/4 PASS
- npm run type-check: tsc noEmit PASS

Generated with [Devin](https://cli.devin.ai/docs)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
