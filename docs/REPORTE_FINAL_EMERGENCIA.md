# Reporte Final — Misión de Emergencia Estabilización Financiera

**Fecha:** 2026-11-21 · **Rama:** `audit/costos-firestore` → merge a `master`

## 1. Causa raíz comprobada

Firestore facturaba **US$19.58 reads + US$19.36 egress en 19 días** por:

- `contenido` (HTML ~10 KB/doc, 90% del peso) proyectado en **todas** las consultas de listado.
- TTL de portada 60 s → ~1,000–1,500 regeneraciones/día bajo crawlers × ~15–25 queries × ~750 docs × 10 KB ≈ **9 GiB/día** — cuadra con los 171 GiB facturados.
- `getNews(count)` con cachés separadas por cada `count` → mismo corpus leído 5–6 veces por ciclo.
- `getCanonicalArticleMetrics` descargaba doc completo por **cada pageview** para leer `vistas`.

**Descartado con evidencia**: corpus pequeño (8 MB), no hay onSnapshot, NIOS/departamento acotados, no hay Cloud Functions.

## 2. Cambios realizados

### Commit `606c887d` — optimizaciones Firestore
- `LIST_FIELDS` sin `contenido`; proxy `palabras` para renderabilidad.
- Pool único `getNews`; TTLs 60→300 s y →900 s (tags invalidan al instante al publicar).
- `fetchPublishedDocs` rama `publishedAt` acotada a 100.
- Métricas por pageview con `select('vistas')`.
- `/api/entity` admin-only; `/api/list-empty`, `/api/list-all` protegidos/proyectados.
- `/negocios*`, `/correcciones` cacheados.
- NIOS data-merger/operational-loop sin `contenido`; metrics-collector con `select()`.
- 4 docs de auditoría + `tests/costos-firestore.test.ts`.

### Commit `e55ffd81` — protección financiera
- `lib/cost-guard.ts`: modo economy vía `config/cost_guard` sin deploy, fail-open.
- Cableado en 6 crons + 4 etapas NIOS (skipped honesto y auditable).
- `cost_daily/{fecha}`: snapshot diario con `count()` + deltas (vía traffic-cleanup).
- `tests/cost-guard.test.ts`.

### Commits previos en la rama (ya auditados)
- `4fca147c` MENI integral, `49af2a3c` SEO crecimiento, `4d3248e0` Telegram, monetización AdSense, fixes NIOS/departamento — **18 commits ahead of master** que nunca se desplegaron.

## 3. Pruebas ejecutadas

- Suite completa: **139 archivos, 1,927 tests verdes** (previo al cost-guard).
- Post-cost-guard: `cost-guard` 3/3, `costos-firestore` 6/6, `nios-collect-route` + `distribuciones-retry` 14/14.
- `tsc --noEmit` limpio · ESLint limpio.

## 4. Deploy

- Merge a `master` (fast-forward, 19 commits) → push → CI (`lint+typecheck`, `test`) → Vercel auto-deploy.
- SHA final: ver `git log` post-merge.
- URL producción: https://nicaraguainformate.com

## 5. Ahorro

| | Antes | Después (proyección) |
|---|---|---|
| Firestore reads/día | ~1.77M | ~350–550K |
| Firestore egress/día | ~9 GiB | ~2.5–3.5 GiB |
| Firestore/mes | ~US$64 | **~US$20–25** |

**Ahorro real: pendiente de factura** — no declarar hasta medir el próximo ciclo.

## 6. Gastos que siguen activos / requieren propietario

- **US$15 no identificados** → revisar Vercel Usage + GCP Billing por SKU.
- **Zonal Backup 43.99 GiB-mo** → inventario en Firebase Console → Backups (no explicado por corpus).
- **Presupuestos/alertas GCP** → solo configurables en consola (pasos en `PLAN_PROTECCION_FINANCIERA.md`).
- **Migración `fecha`** → evaluada y **descartada**: ahorro ~0 con facturación por docs devueltos (ver `PLAN_RECUPERACION_Y_ROLLBACK.md` §4).

## 7. Pendientes del propietario

1. Configurar budget GCP US$10/mes con alertas 50/75/90/100% + verificar rol Billing Account Administrator.
2. Revisar Vercel plan y Usage del ciclo.
3. Inventariar backups Firestore (sospecha: subcolecciones NIOS).
4. Los **8 titulares** de `PENDIENTES_PROPIETARIO.md` siguen autorizados sin aplicar — script listo.
5. Verificar que `config/cost_guard` queda en `normal` (o no existe = normal).

## 8. Criterio de éxito — estado

| Criterio | Estado |
|---|---|
| Causas identificadas | ✅ Comprobadas con código + facturación + datos prod |
| Optimizaciones en producción | ⏳ Merge+deploy en curso |
| NIOS sin consultas innecesarias | ✅ Verificado + mejorado |
| Sin `contenido` innecesario | ✅ |
| Vercel sin ejecuciones evitables | ✅ TTLs + ISR correctos |
| Mecanismos de protección | ✅ cost_guard + cost_daily + guía budgets |
| Sitio funciona / Google rastrea | ⏳ Smoke tests post-deploy |
| Costos medibles diariamente | ✅ cost_daily + guía billing |
| Propietario sabe qué paga | ✅ Docs entregados |
