feat(contracts): Fase 2 — canonical data contracts module + tests

- lib/contracts/index.ts: single public surface for Noticia, NoticiaInput,
  MeniResult, SupervisorDecision, ArticleFusion, GSC/GA4 snapshots,
  DailySnapshot, RecoveryArticle and JourneyEvent.
- tests/data-contracts.test.ts: 5/5 PASS validating null semantics,
  Supervisor final authority, GSC explicit zero vs null, and no PII.
- tsc --noEmit PASS.

Generated with [Devin](https://cli.devin.ai/docs)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
