# TECHNICAL DEBT

Fecha: 2026-08-30
Fuente: `docs/SYSTEM_REGISTRY.md` + prueba de fuego real

## 1. Resumen del repositorio

```text
Total archivos escaneados: 907
```

| Clasificación | Cantidad |
|---------------|----------|
| EDITORIAL_CRITICAL | 176 |
| ACTIVE | 158 |
| SUPPORT | 145 |
| BUSINESS_CRITICAL | 134 |
| DEAD_CODE | 122 |
| TEST | 68 |
| SECURITY_SENSITIVE | 64 |
| ORPHAN | 19 |
| CORE | 11 |
| SEO_CRITICAL | 7 |
| PERFORMANCE_CRITICAL | 3 |

## 2. Deuda crítica (P0)

| Item | Estado | Impacto |
|------|--------|---------|
| `lib/nios/ceo-memory.ts` — MEMORY DEAD | FIXED | Se sanitiza el registro antes de escribir en Firestore. |
| `lib/nios/ceo-learning.ts` — índice compuesto | FIXED | Se ordena en memoria; ya no requiere índice compuesto. |

## 3. Bloqueos externos (P1)

| Item | Estado | Qué falta |
|------|--------|-----------|
| GSC | `ACCESS_BLOCKED` | Permisos del service account `firebase-adminsdk-fbsvc@informate-instant-nicaragua.iam.gserviceaccount.com`. |
| GA4 | `NO_DATA` | `NIOS_GA4_PROPERTY_ID` y permisos. |
| AdSense | `NOT_CONFIGURED` | `GOOGLE_ADSENSE_CLIENT_ID`. |

## 4. Candidatos a revisión

Según el registro, existen 122 archivos clasificados como `DEAD_CODE` y 19 como `ORPHAN`.

Ejemplos a auditar manualmente:

- `app/admin/layout.tsx` (marcado anteriormente; ahora es route, pero validar)
- Archivos en `lib/` sin importadores ni tests
- Scripts en `scripts/` que ya no se invocan
- Paneles admin que no tienen tráfico

## 5. Dependencias

Dependencias principales:

- `next`: 15.5.23
- `react`: 19.0.0
- `firebase-admin`: 12.7.0
- `@sentry/nextjs`: 10.70.0
- `tailwindcss`: 3.4.17

No se detectaron actualizaciones forzadas en esta ronda.

## 6. Recomendaciones

1. Revisar los 122 archivos `DEAD_CODE` antes del próximo deploy.
2. Conectar GSC, GA4 y AdSense para activar inteligencia de tráfico y monetización.
3. Verificar `traffic-reader` en 3 corridas consecutivas.
4. Mantener la suite de tests actual (636 tests pasan).
