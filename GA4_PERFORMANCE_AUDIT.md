# GA4 Performance Audit

## 1. Datos proporcionados (evidencia de usuario)

| Métrica | Valor | Ventana | Unidad | Estado |
| --- | --- | --- | --- | --- |
| `GA4_ACTIVE_USERS_30D` | 6.8k | 30 días | usuarios activos | `USER_EVIDENCE` |
| `GA4_ACTIVE_USERS_7D` | 4.3k | 7 días | usuarios activos | `USER_EVIDENCE` |
| `GA4_ACTIVE_USERS_1D` | 678 | 1 día | usuarios activos | `USER_EVIDENCE` |

## 2. Estado del collector de NIOS

- El collector `lib/nios/intelligence/ga4-collector.ts` requiere `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PROJECT_ID` para autenticar.
- También requiere un `propertyId` (`GA4_PROPERTY_ID`) para consultar.
- `.env.local` no contiene estas credenciales de forma operativa (`FIREBASE_PRIVATE_KEY` incompleto, `GA4_PROPERTY_ID` sin confirmar).
- `FORENSIC_CEO_AUDIT.md` reporta `GA4 = ACCESS_BLOCKED`.

**Diagnóstico:**
- Para la UI de Google Analytics 4: datos disponibles (`USER_EVIDENCE`).
- Para el collector NIOS/API: `ACCESS_BLOCKED` por falta de credenciales.

## 3. Contradicción con NIOS

| NIOS dice | Evidencia real | Causa |
| --- | --- | --- |
| `GA4 sin datos` | Captura muestra 6.8k, 4.3k, 678 usuarios | `ACCESS_BLOCKED` del collector; snapshot posiblemente `STALE_DATA` del 20 ago 2026 |

La captura corresponde a GA4 UI (2026-08-22). El snapshot NIOS posiblemente se congeló el 2026-08-20. Sin credenciales no se puede actualizar automáticamente.

## 4. Semántica obligatoria

| Nombre prohibido | Nombre correcto |
| --- | --- |
| `GA4 views` | `GA4_ACTIVE_USERS_*` |
| `6.8k vistas` | `6.8k usuarios activos (30 días)` |
| `GA4 traffic` | `GA4_ACTIVE_USERS_30D` / `GA4_PAGE_VIEWS` / `GA4_SESSIONS` |

## 5. Datos no verificables localmente

| Métrica | Estado | Razón |
| --- | --- | --- |
| `GA4_PAGE_VIEWS` | `ACCESS_BLOCKED` | Collector sin credenciales |
| `GA4_SESSIONS` | `ACCESS_BLOCKED` | Collector sin credenciales |
| `GA4_ENGAGEMENT_TIME` | `ACCESS_BLOCKED` | Collector sin credenciales |
| `GA4 por artículo` | `ACCESS_BLOCKED` | Collector sin credenciales |

## 6. Acciones

1. Configurar `GA4_PROPERTY_ID` y credenciales de Firebase en `.env.local`.
2. Normalizar el collector para reportar métricas con `GA4_` prefijo y ventana.
3. Separar `ACTIVE_USERS`, `PAGE_VIEWS`, `SESSIONS` en la UI y API.
4. No permitir que NIOS diga `GA4 sin datos`; debe decir `GA4_ACCESS_BLOCKED` o `STALE_DATA`.
