# CEO Agent — Informe de auditorías PENDIENTES

**Fecha:** 2026-08-22  
**Auditoría original:** `FORENSIC_CEO_AUDIT.md`  
**Estado de este informe:** lista de hallazgos que aún NO se han corregido tras las iteraciones P0/P1.

## P0/P1 ya corregidos en esta sesión (no son pendientes)

- `lib/ceo-agent.ts`: `NO_DATA` vs `0` en `vistas`, `viewsRecent`, `scoreMeni`, `effective`, `articleViews`.
- `lib/analytics/traffic-reader.ts`: ruido de logs `error` cambiado a `info`.
- `lib/analytics/traffic-aggregator.ts`: taxonomía canónica de fuentes de tráfico + semana ISO real.
- `lib/growth.ts` + UI (`app/admin/growth/page.tsx`) + `lib/nios/growth.ts`: `vistas` ausentes se distinguen de `0`, fuentes sin samplear.
- Flujo de noticia: `lib/ceo-agent-workflow.ts` y `app/api/admin/news/route.ts` ahora ejecutan el CEO Agent automáticamente al crear noticia.

---

## Hallazgos que SÍ siguen pendientes

### P1 — Semántica ambigua de vistas en `traffic-reader.ts`

| Archivo | Línea aprox. | Problema | Impacto |
|---------|--------------|----------|---------|
| `lib/analytics/traffic-reader.ts` | 118-143 | `getTrafficPerformance` retorna un campo `views` que mezcla `performance.topArticles` (7 días) con `todayRead.views` (hoy). | El consumidor no sabe si está leyendo 7 días o el día actual. |

**Acción propuesta:** separar la API en `views24h` / `views7d` y eliminar el campo `views` unificado.

### P2 — NIOS Command Center genera métricas sin acción

| Archivo | Línea aprox. | Problema | Impacto |
|---------|--------------|----------|---------|
| `lib/nios/intelligence/health-score.ts` | 25-103 | `calculateHealthScore` produce un `score/100` sin decisión ejecutable. | Score decorativo; contradice el requisito "toda puntuación responde qué hacer". |
| `lib/audience-intelligence.ts` | 24, 29-37 | `scoreMeni ?? 70` asume calidad; umbrales `views > 200`, `age <= 7`, etc., son arbitrarios. | Segmentación sin evidencia causal. |
| `lib/distribution-intelligence.ts` | 21-64 | `recommendDistribution` usa reglas estáticas por categoría. | No aprende del rendimiento real de cada canal. |
| `lib/nios/command-center/ceo-view.ts` | 409-426 | `buildEditorJefeView` contiene `anuncianteBrands` hardcodeado (`['Claro','Banco LAFISE','Universidad']`). | Datos inventados en motor editorial. |
| `lib/ceo-agent.ts` | 266-289 | `findRelatedArticles` puntúa por tokens >3 caracteres + tags, sin peso semántico real. | Recomendaciones débiles con `reason` genérico. |

**Acción propuesta:** convertir cada score/dashboard en un `decision/confidence/evidence/whatToDo` o deprecar; reemplazar simulaciones por datos reales; mejorar `findRelatedArticles` con entidades/similitud real.

### P2/P3 — Ruido de logs y desarrollo

| Archivo | Línea aprox. | Problema | Impacto |
|---------|--------------|----------|---------|
| `app/api/revalidate/route.ts`, `app/api/admin/guardar-directo/route.ts`, `app/api/admin/distribuir/route.ts` | varias | `console.log` directos en APIs. | Ruido en producción; posible fuga de datos. |
| `lib/view-counter.ts` | 76 | `logger.error` en catch de batch normal. | Genera falsos errores en observabilidad. |

**Acción propuesta:** reemplazar `console.log` por `logger` unificado; cambiar `logger.error` no crítico a `logger.warn`.

---

## Bloqueos de datos que no se resuelven con código

| Fuente | Estado | Causa | Acción requerida |
|--------|--------|-------|------------------|
| Google Search Console | `ACCESS_BLOCKED` | Sin credenciales en `.env.local` | Configurar `GSC_*` o archivo de clave. |
| Google Analytics 4 | `ACCESS_BLOCKED` | Sin credenciales en `.env.local` | Configurar `GA4_*` o archivo de clave. |
| `indexing_log` | `NO_DATA` | No hay registros para URLs probadas | Activar trackeo de `notifyGoogleIndexingDeduped`. |

---

## Prueba real end-to-end pendiente

Crear una noticia real desde `/api/admin/news` con `publicado=true` y verificar:

1. MENI aprobación pasa.
2. Supervisor editorial pasa.
3. `runCEODecisionForArticle` se ejecuta.
4. `ceo_decisions/{slug}` contiene decisión, urgencia, evidencia y `status: 'pending_review'`.
5. El panel `/admin/ceo-agent` refleja la decisión.

---

## Resumen

- **Cerrados en esta sesión:** P0/P1 de `lib/ceo-agent.ts`, `lib/analytics/*`, `lib/growth.ts` y conexión al flujo de noticia.
- **Pendientes:** P2/P3 de NIOS/audience/distribución/logs, corrección de `getTrafficPerformance`, y pruebas reales con credenciales GSC/GA4 + noticia end-to-end.
