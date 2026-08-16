feat(foundation): Bloque 1 - purga de endpoints obsoletos y politica TTL

- Elimina 12 endpoints obsoletos/deuda tecnica en app/api/admin/:
  - phase15-1-auto-fix, phase15-2-dup-audit, phase16-inventory
  - adsense-repair, adsense-repair-groq, adsense-repair-deepseek
  - quitar-emocional-simple, limpiar-emocional, limpiar-palabras-sensibles
  - rescribir-sucesos, revertir-sensacionalismo, expandir-thin-content
- lib/observability/log.ts: anade metadata expiresAt a eventos (30d) y
  audit logs (90d) para politica TTL de Firestore sin fuga de costos.
- Verificacion: tsc --noEmit 0 errores, vitest 38/38 PASS.

Generated with [Devin](https://cli.devin.ai/docs)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
