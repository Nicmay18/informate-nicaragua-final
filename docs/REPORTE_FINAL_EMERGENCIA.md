# Reporte Final — Misión de Emergencia Estabilización Financiera

**Fecha:** 2026-11-21 · **Rama:** `audit/costos-firestore` → `master`

## 1. Causa raíz comprobada

Firestore facturaba **US$19.58 reads + US$19.36 egress en 19 días** por:

- `contenido` (HTML ~10 KB/doc, 90% del peso) proyectado en **todas** las consultas de listado.
- TTL de portada 60 s → ~1,000–1,500 regeneraciones/día bajo crawlers × ~15–25 queries × ~750 docs × 10 KB ≈ **9 GiB/día** — cuadra con los 171 GiB facturados.
- `getNews(count)` con cachés separadas por cada `count` → mismo corpus leído 5–6 veces por ciclo.
- `getCanonicalArticleMetrics` descargaba doc completo por **cada pageview** para leer `vistas`.

**Descartado con evidencia**: corpus pequeño (8 MB), no hay onSnapshot, NIOS/departamento acotados, no hay Cloud Functions.

## 2. Cambios realizados

### PR #41 → merge `4c706252` (squash de 19 commits)
- **`606c887d`**: `contenido` fuera de listados; proxy `palabras`; pool único `getNews`; TTLs 60→300/900 s; `select('vistas')` en métricas; `/api/entity` admin-only; `/negocios*` y `/correcciones` cacheados; NIOS sin `contenido`; `tests/costos-firestore.test.ts`.
- **`e55ffd81`**: `lib/cost-guard.ts` — modo economy vía `config/cost_guard` (fail-open), cableado en 6 crons + etapas NIOS; snapshot diario `cost_daily`; `tests/cost-guard.test.ts`.
- Incluye trabajo previo auditado: MENI integral (`4fca147c`), SEO crecimiento (`49af2a3c`), Telegram idempotente (`4d3248e0`), fixes NIOS/departamento/monetización.
- Fixes adicionales en el camino: fixture E2E sin `palabras`; invalidación de caché `/negocios` tras mutaciones.

### PR #42 → merge `d330ee2a` — resiliencia de build
- `lib/data.ts`: en `phase-production-build`, `fetchPublishedDocs` devuelve `[]` cuando TODAS las queries fallan (antes lanzaba `FirestoreOutageError` y `next build` moría con exit 1). Las páginas ISR se prerenderizan vacías y se regeneran en runtime. **En runtime el error sigue propagándose** — no se enmascara ningún apagón real.

## 3. Deploy — línea de tiempo real

| Evento | Resultado |
|---|---|
| PR #41 merge → `4c706252` | Vercel build **FAILED**: `FirestoreOutageError` en prerender `/` (quota Firestore agotada durante el build) |
| Fix build-phase + build local de verificación | **99/99 páginas generadas con Firestore 100% caído** — reproducción exacta del fallo de Vercel |
| PR #42 merge → `d330ee2a` | Vercel production deploy **SUCCESS** — https://informate-nicaragua-nextjs-lajeik70e-nicmay18s-projects.vercel.app |

**SHA en producción: `d330ee2a`** · URL: https://nicaraguainformate.com

## 4. 🔴 Incidente activo: quota Firestore agotada (RESOURCE_EXHAUSTED)

Desde ~19:00 UTC del 2026-11-21, **toda** query a Firestore devuelve `8 RESOURCE_EXHAUSTED: Quota exceeded` — incluso `limit(1)`. Verificado desde local (bypassea Vercel) → el límite está en la cuenta/proyecto GCP, no en el código ni en Vercel.

**Duración >2 h sostenidas** → no es un pico de rate-limit por minuto; probablemente:
- cuota manual ajustada en APIs & Services → Quotas, o
- presupuesto de billing con acción de corte, o
- throttling sostenido de Google por el volumen histórico del proyecto.

**Consecuencia en producción (estado actual):**
- `/` y páginas ISR: sirven el prerender **vacío** del build (sin artículos) hasta que Firestore responda; ISR regenera solo (revalidate 300 s + tag `noticias`).
- `/noticias`, feeds dinámicos: 504/vacíos mientras Firestore esté caído.
- `/categoria/nacionales`: aún muestra artículos reales (entradas `unstable_cache` heredadas del deployment anterior, expiran en ~5 min).
- **Auto-recuperación**: en cuanto la quota vuelva, todo se rellena en ≤5 min sin intervención.

### Acción requerida del propietario (única vía de desbloqueo)
1. GCP Console → **APIs & Services → Firestore API → Quotas** → ¿hay quota en 0/excedida?
2. GCP Console → **Billing → Budgets** → ¿hay presupuesto con acción de suspensión?
3. GCP Console → **IAM → Service Accounts** → la cuenta de servicio de Firebase Admin, ¿sigue activa?
4. Si nada aparece: esperar ~24 h (throttling de Google decae) o abrir ticket de soporte GCP.

## 5. Pruebas ejecutadas

- Suite completa tras optimizaciones: **141 archivos, 1,958 tests verdes**.
- Post-PR#41: E2E Playwright verde, Lighthouse verde, Build verde (CI).
- Post-fix build: `npm run build` local 99/99 páginas **con Firestore caído**; `tsc` limpio; cost-guard + costos-firestore 9/9.
- Smoke tests producción (post-deploy `d330ee2a`): ver §6.

## 6. Smoke tests post-deploy (2026-11-21 ~20:15 UTC)

| Ruta | Resultado | Nota |
|---|---|---|
| `/` | 200 | HTML shell OK, **0 artículos** (Firestore caído al prerender) |
| `/noticias` | 504 | Dinámica; timeout contra Firestore muerto |
| `/categoria/nacionales` | 200 | Artículos reales (cache heredado, expira ~5 min) |
| `/feed.json`, `/rss`, `/api/feed-xml` | 200 | Válidos pero **0 items** (diseño: feed vacío si Firebase cae) |
| `/feed` | 504 | Ídem `/noticias` |
| `/sitemap.xml`, `/news-sitemap.xml` | 504 | **Pre-existente** (ya fallaba antes del deploy; `force-dynamic` + timeout). Re-test cuando Firestore vuelva |
| `/guia/apostillar-documentos-nicaragua-2026` | 200 | Contenido local, no depende de Firestore |

## 7. Ahorro

| | Antes | Después (proyección) |
|---|---|---|
| Firestore reads/día | ~1.77M | ~350–550K |
| Firestore egress/día | ~9 GiB | ~2.5–3.5 GiB |
| Firestore/mes | ~US$64 | **~US$20–25** |

**Ahorro real: pendiente de factura** — no declarar hasta medir el próximo ciclo en Billing.

## 8. Gastos que siguen activos / requieren propietario

- **US$15 no identificados** → revisar Vercel Usage + GCP Billing por SKU.
- **Zonal Backup 43.99 GiB-mo** → inventario en Firebase Console → Backups (no explicado por corpus).
- **Quota Firestore RESOURCE_EXHAUSTED activa** → §4, acción de consola requerida.
- **Presupuestos/alertas GCP** → solo configurables en consola (pasos en `PLAN_PROTECCION_FINANCIERA.md`).
- **Migración `fecha`** → evaluada y **descartada**: ahorro ~0 con facturación por docs devueltos (ver `PLAN_RECUPERACION_Y_ROLLBACK.md` §4).

## 9. Pendientes del propietario

1. **URGENTE**: revisar quota/billing GCP (§4) — el sitio no puede mostrar noticias hasta que Firestore responda.
2. Configurar budget GCP US$10/mes con alertas 50/75/90/100% + verificar contactos de billing (por eso no hubo avisos previos).
3. Revisar Vercel plan y Usage del ciclo (los ~US$15).
4. Inventariar backups Firestore (sospecha: subcolecciones NIOS).
5. Los **8 titulares** de `PENDIENTES_PROPIETARIO.md` siguen autorizados sin aplicar — script listo.
6. Verificar que `config/cost_guard` queda en `normal` (o no existe = normal).

## 10. Criterio de éxito — estado

| Criterio | Estado |
|---|---|
| Causas identificadas | ✅ Comprobadas con código + facturación + datos prod |
| Optimizaciones en producción | ✅ `d330ee2a` desplegado |
| NIOS sin consultas innecesarias | ✅ Verificado + mejorado |
| Sin `contenido` innecesario | ✅ |
| Vercel sin ejecuciones evitables | ✅ TTLs + ISR + build resiliente |
| Mecanismos de protección | ✅ cost_guard + cost_daily + guía budgets |
| Sitio funciona / Google rastrea | ⚠️ Deploy OK pero **contenido vacío por quota Firestore** — pendiente §4 |
| Sitemap operativo | ❌ 504 pre-existente — re-test post-quota |
| Costos medibles diariamente | ✅ cost_daily + guía billing |
| Propietario sabe qué paga | ✅ Docs entregados |
