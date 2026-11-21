# Dashboard de Métricas y Metas — Seguimiento Semanal

## Cómo se alimenta (sin trabajo manual)

NIOS ya recolecta diariamente en `nios_daily_snapshots/{fecha}`:
- `gsc`: impresiones, clics, CTR, posición, páginas, queries, países, dispositivos (API oficial de Search Console).
- `ga4`: usuarios, sesiones, pageviews, engagement, páginas, fuentes, dispositivos (API oficial GA4, propiedad `525672447`).

**Para ver el tablero:** panel admin → card "Google: Analytics + Search Console" (`/api/admin/nios-intelligence?action=dashboard`), o leer el snapshot directamente en Firestore.

**Lo que falta para completar el dashboard:** AdSense (ingresos, RPM) — requiere vinculación GA4↔AdSense por el propietario.

---

## Línea base — últimos 7 días (2026-11-10 → 17)

### Search Console
| Métrica | Valor |
|---|---|
| Impresiones | 16,868 |
| Clics | 345 |
| CTR | 2.05% |
| Posición media | 7.3 |
| Páginas con impresiones | 411 |
| Consultas | 903 |

### GA4
| Métrica | Valor |
|---|---|
| Usuarios | 220 |
| Sesiones | 286 |
| Pageviews | 436 |
| Engagement medio | 97.9 s |
| Engagement rate | 83.9% |

### Fuentes GA4 (usuarios)
| Fuente | Usuarios | Pageviews |
|---|---|---|
| google | 92 | 178 |
| facebook | 83 | 107 |
| (direct) | 20 | 114 |
| bing | 12 | 18 |
| chatgpt.com | 8 | 9 |

### Dispositivo
- GSC: 82% móvil · GA4: 86% móvil

---

## Comparación 28 días (pendiente de 2 snapshots más)

El snapshot NIOS es diario; para la comparación 28d vs 28d anterior hay que agregar los últimos 28 snapshots. **Próxima acción:** script `.audit/gsc-28d.cjs` que lea `nios_daily_snapshots` de los últimos 28 días y sume `gsc.totalImpressions/totalClicks` y `ga4.totalUsers/totalPageviews`. Se ejecuta cuando haya ≥28 días de historia continua (los snapshots existen desde ~octubre; verificar cobertura).

---

## Objetivos

| Métrica | Línea base (7d) | Día 30 | Día 60 | Día 90 |
|---|---|---|---|---|
| Impresiones GSC | 16,868 | ~20,000 | ~24,000 | ~28,000 |
| Clics GSC | 345 | ~500 | ~650 | ~800 |
| CTR | 2.05% | 2.5% | 2.7% | 3.0% |
| Posición media | 7.3 | 7.0 | 6.8 | 6.5 |
| Usuarios GA4 | 220 | ~300 | ~380 | ~450 |
| Pageviews GA4 | 436 | ~600 | ~750 | ~900 |
| Páginas con >100imp & >1%CTR | ~15 | ~25 | ~32 | ~40 |
| Ingresos AdSense/mes | ? (sin datos) | línea base | +20% | +50% |

*Proyecciones, no promesas. Revisar mensualmente y ajustar.*

---

## Qué revisar cada lunes (checklist semanal)

1. **GSC snapshot** (`nios_daily_snapshots` más reciente):
   - ¿Subieron impresiones/clics vs semana anterior?
   - ¿Aparecieron queries nuevas en `gsc.queries`? (oportunidades de contenido)
   - ¿Alguna página top-10 cayó de posición?
2. **CTR de las 3 guías top:** apostillar, salario-minimo, anular-recurso.
   - Si salario-minimo sigue <1.5% tras el cambio de título → iterar description.
3. **Páginas con >100 imp y 0 clics:** nueva lista cada semana → candidatas a reescritura de titular (Firestore, con autorización).
4. **GA4 fuentes:** ¿creció chatgpt.com? ¿facebook sigue parejo con google?
5. **AdSense** (cuando esté vinculado): ingresos/semana, RPM por página top-5.
6. **Core Web Vitals:** correr Lighthouse semanal en homepage + guía top + noticia top (LCP<2.5s, CLS<0.1, INP<200ms).

---

## Alertas automáticas ya existentes

- NIOS recolecta GSC/GA4 diariamente vía cron (`nios-collect` por etapas).
- `ceo-observatory` ya genera observaciones cuando GSC/GA4 no son REAL.
- Panel muestra estado REAL/NO_DATA honestamente.

## Lo que falta instrumentar (propuesta)

- Script de comparación 28d-vs-28d automático en el snapshot (agregar `gscPrev28`/`ga4Prev28` al payload).
- Alerta si CTR de una página top-10 cae >30% semana a semana.
- Dashboard visual en el panel con sparkline de impresiones/clics (hoy solo muestra el último snapshot).
