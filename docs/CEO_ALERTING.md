# CEO ALERTING — NIOS CEO v1

| Campo | Valor |
|-------|-------|
| Estado | OPERATIVO (P0) |
| Última revisión | 2026-08-30 |
| Ruta de alerta | `app/api/cron/nios-collect` |

## Componentes

1. `lib/nios/ceo-loop.ts` — ciclo autónomo OBSERVE → MEMORY.
2. `lib/nios/ceo-daily-brief.ts` — resumen ejecutivo a partir del `CEOLoopResult`.
3. `lib/observability/brief.ts` — brief matutino con `BriefPoint[]` y severidades.
4. `lib/nios/executive/morning-brief.ts` — brief con `GSCSnapshot`, `GA4Snapshot` y prioridades.
5. `app/admin/nios/page.tsx` — panel para lectura humana.

## Niveles de severidad

- `alert`: fallo crítico, autonomía degradada, decisión `CANCEL` o reparación fallida.
- `warning`: requiere aprobación humana, datos ausentes, oportunidad no aprovechada.
- `ok`: ciclo completo, métricas dentro de rangos.
- `opportunity`: hallazgo de crecimiento o contenido recuperable.

## Contratos de salida

### `/api/cron/nios-collect` (GET)

- `success`, `date`, `summary`, `errors`
- `ceo.mode`, `ceo.autonomyScore`, `ceo.autonomyReport`
- `ceo.dailyBrief` — nuevo campo con `overallStatus`, `points`, `humanQueue`, `autoActions`, `learnings`
- `ceo.whatISaw`, `ceo.whatIDecided`, `ceo.whatIDid`, `ceo.whatILearned`, `ceo.business`

### `CEODailyBrief`

```ts
{
  generatedAt: string;
  date: string;
  overallStatus: 'ok' | 'warning' | 'alert';
  autonomyScore: string;
  autonomyReport: Record<string, 'REAL' | 'PARTIAL' | 'DEAD'>;
  points: CEOBriefPoint[];
  humanQueue: { id: string; reason: string }[];
  autoActions: { id: string; result: string }[];
  learnings: { pattern: string; confidence: number }[];
}
```

## Reglas

- No se inventan métricas; los campos sin datos se marcan `DATA_EMPTY`.
- El `dailyBrief` se genera a partir del `CEOLoopResult`, no del pipeline directo.
- Las decisiones `QUEUE_FOR_HUMAN` alimentan `humanQueue`.
- Las reparaciones en `record.repaired` alimentan `autoActions`.
