# REVENUE INTELLIGENCE — NIOS CEO v1

| Campo | Valor |
|-------|-------|
| Estado | OPERATIVO con dependencias externas (P1) |
| Última revisión | 2026-08-30 |

## Módulos

1. `lib/nios/revenue/` — análisis de oportunidades de monetización.
2. `lib/nios/intelligence/adsense.ts` — reporte de cumplimiento AdSense.
3. `lib/adsense.ts` — integración y helpers.
4. `lib/nios/business/` — inteligencia de negocio, categorías comerciales y sponsors.

## Métricas

- `adSenseCompliantPercent`
- `policyReviewCount`
- `technicalDefectCount`
- Categorías rentables, tópicos comerciales, candidatos de afiliados/sponsors.

## Fuentes

- Datos propios de Firestore.
- Reporte de inventario y calidad editorial.
- Métricas de tráfico y recirculación.

## Limitaciones

- AdSense requiere `ads.txt`, cuenta aprobada y `process.env.ADSENSE_*`.
- Sin credenciales, el sistema reporta `NO_DATA`.
- No se realizan pagos ni se accede a la API de pagos de Google.

## Verificación

- `tests/adsense-compliance.test.ts` (si existe).
- `npm run build` OK.
