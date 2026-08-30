# Prioridades — NIOS CEO v2

P0, P1 y P2 identificados en la auditoría v2.

## P0 — Reparar ahora

| ID | Problema | Archivo(s) | Impacto | Estado | Decisión |
|----|----------|------------|---------|--------|----------|
| P0-UX | "También te puede interesar" usaba estilos inline y no diferenciaba enlaces del texto normal. | `lib/article-links.ts`, `app/article-page.css`, `app/api/admin/enrich-links/route.ts` | Baja retención, confusión de navegación. | ✅ REPARADO | Clases semánticas `.ni-related*` y builder compartido. |
| P0-DATA | `lib/analytics/traffic-reader.ts` carecía de validación de consistencia de datos de tráfico. | `lib/analytics/traffic-reader.ts`, `app/api/cron/nios-collect/route.ts` | Decisiones de negocio sobre datos no confiables. | ✅ REPARADO | `validateTrafficReader` con 3 corridas; log `TRAFFIC_DATA_UNTRUSTED`. |
| P0-SEC | Cron Vercer transporta token de autorización en query string (`?token=`). | `app/api/cron/nios-collect/route.ts`, `vercel.json` | Exposición de secreto en logs/proxies. | ⏸️ HUMAN_APPROVAL | No eliminar sin configurar Vercel `Authorization` u otro mecanismo. |

## P1 — Mejorar en 24-72 h

| ID | Problema | Archivo(s) | Impacto | Decisión |
|----|----------|------------|---------|----------|
| P1-DEAD | 537 archivos clasificados como `DEAD` consumen espacio y confunden el análisis. | `scripts/build-system-registry.py` | Ruido en auditorías, cobertura de tests baja. | Programar limpieza con `HUMAN_APPROVAL` antes de borrar. |
| P1-REPAIR | 658 archivos `NEEDS_REPAIR` (sobre todo `.audit/*`, `.devin/*`, raíz markdown). | `docs/HEALTH_MATRIX.md` | Deuda técnica acumulada. | Clasificar en lotes de 50. |
| P1-DEP | `lib/logger.ts` (129), `lib/types.ts` (121), `lib/firebase-admin.ts` (108) tienen alto acoplamiento. | `lib/logger.ts`, `lib/types.ts`, `lib/firebase-admin.ts` | Cambios en librerías core generan regressiones. | Diseñar interfaces más pequeñas. |
| P1-SEO | Integrar GSC/GA4 para métricas reales de tráfico e indexación. | `lib/nios/intelligence/*` | CEO sin datos reales es ciego. | Requiere credenciales y aprobación. |

## P2 — Optimización y deuda técnica

| ID | Problema | Archivo(s) | Decisión |
|----|----------|------------|----------|
| P2-DOCS | Completar `CEO_COUNCIL.md`, `BUSINESS_INTELLIGENCE.md`, `NOTIFICATION_ARCHITECTURE.md`, `CONTENT_DECAY.md`, `CONTENT_OPPORTUNITY.md`. | `docs/*` | Generar en siguiente ciclo. |
| P2-MEMORY | Persistir aprendizajes del CEO en `nios_memory`. | `lib/nios/ceo-loop.ts`, `lib/nios/ceo-memory.ts` | Añadir `create_memory` automático al final del ciclo. |
| P2-ALERT | Arquitectura de notificaciones 24/7 (email/Telegram). | `app/api/notifications/*` | Diseñar con webhook y guardrails. |

## Reglas de escalación

- P0 puede auto-repararse si el riesgo es bajo y las pruebas pasan.
- P0-SEC nunca se auto-repara sin aprobación humana.
- P1 requiere aprobación humana si es destructivo.
- P2 se encola en el backlog del CEO.

