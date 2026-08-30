# ARCHITECTURE AUDIT — NIOS CEO v1

| Campo | Valor |
|-------|-------|
| Estado | COMPLETADO (P0) |
| Score | 8/10 |
| Última revisión | 2026-08-30 |

## Inventario

- `docs/SYSTEM_REGISTRY.md`: 1,420 archivos.
- `docs/HEALTH_MATRIX.md`: 1,420 estados derivados de uso, tests y clasificación.

## Capas identificadas

1. **Reader layer**: `app/`, `components/`, `public/`
2. **API / cron layer**: `app/api/cron/`, `app/api/admin/`, `middleware.ts`
3. **Intelligence layer**: `lib/nios/intelligence/`, `lib/nios/command-center/`, `lib/nios/ceo-*`
4. **Editorial layer**: `lib/editor-jefe-v4/`, `lib/editorial/core/`
5. **Data / analytics**: `lib/data.ts`, `lib/analytics/`, `lib/firebase-admin.ts`
6. **Observability**: `lib/observability/`, `lib/logger.ts`

## Decisiones clave

- `lib/nios/ceo-daily-brief.ts` creado para desacoplar el resumen ejecutivo del motor de recolección.
- `app/api/cron/nios-collect/route.ts` ahora expone `dailyBrief` sin tocar el pipeline.
- `lib/nios/ceo-learning.ts` evita índice compuesto en Firestore ordenando en memoria.

## Riesgos arquitectónicos

| Riesgo | Fase | Archivos | Mitigación |
|--------|------|----------|------------|
| Coupling fuerte con Firestore IDs | Data | `lib/data.ts` | Usar `unstable_cache` |
| Query `token` en cron | Seguridad | `app/api/cron/nios-collect/route.ts` | Documentar, migrar a headers |
| Funciones > 400 líneas sin test | Legacy | `lib/nios/command-center/ceo-view.ts` | Refactor progresivo P2 |

## Verificación

- `npm run type-check` OK.
- `npm run build` OK.
- `npm run lint` OK.
