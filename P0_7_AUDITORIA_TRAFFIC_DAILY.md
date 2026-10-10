# P0-7 — Auditoría forense y corrección de `traffic_daily`

## Estado

**CERRADA — CORREGIDA Y VALIDADA (código)** + verificación post-deploy pendiente (consulta de solo lectura).

> Nota de alcance: el stack real es **Firestore** (firebase-admin 12.x), no
> PostgreSQL/Supabase. `traffic_log` y `traffic_daily` son colecciones
> Firestore. Toda la auditoría se ejecutó sobre ese stack.

---

## 1. Causa raíz

`traffic_daily` aparece vacío porque **sus documentos padre `traffic_daily/{YYYY-MM-DD}` nunca se materializan**: el único escritor (`incrementTrafficDaily`, dual-write en `lib/db/homepage.ts`) escribe exclusivamente `traffic_daily/{date}/articles/{slug}` y deja a los padres como **documentos fantasma** (sin campos, sin existencia propia — solo contenedores de subcolección).

Consecuencia medida y reproducible en Firestore:

- `db.collection('traffic_daily').get()` devuelve **0 documentos siempre**, aunque la subcolección `articles` esté poblada (Firestore omite padres inexistentes en los resultados de colección).
- Queries por campos sobre la raíz (`orderBy('date')`, `where`, etc.) también devuelven 0 — el padre no tiene campos.
- En Firebase Console la colección se ve con IDs en itálica = "sin datos" a primera vista.
- El propio diagnóstico del repo (`m18-probe.ts:84`) usaba exactamente esa lectura errada: `collection('traffic_daily').orderBy('date','desc').limit(14).get()` → `[]` incondicional, independientemente de los datos reales.

El schema **diseñado** ya contemplaba el doc padre: `firestore.rules:152-156` permite `create/update` en `traffic_daily/{date}` solo con `hasOnly(['updatedAt'])` — regla que solo tiene sentido si el padre existe con ese campo. El writer omitió esa escritura desde su creación (commit `dfb283ad`, 2026-08-06).

## 2. Evidencia

### Pipeline real mapeado (no hay cron agregador)

```
ArticlePage.tsx (useEffect, cliente)
  → trackViewAction (app/actions/track-view.ts, server action)
    → incrementViewsBySlug (lib/db/homepage.ts:55)
        1. db.collection('traffic_log').add({slug, source, timestamp: serverTimestamp, expiresAt, ...})
        2. incrementTrafficDaily(db, slug, source, device)          ← único escritor de traffic_daily
            → traffic_daily/{UTC-date}/articles/{slug}  (set merge + FieldValue.increment)
```

Lectores correctos (subcolección): `getTrafficDailySummary`, `fetchTrafficForDate`,
`_cachedDailyTotals` (usa `listDocuments()` — incluye fantasmas), `generateTrafficPerformance`.
Crons (`vercel.json`): solo `traffic-cleanup` (borra `traffic_log` >30d). **Ningún proceso borra `traffic_daily`.**

### Datos históricos verificados (auditorías previas del repo)

- `PRODUCTION_REALITY_AUDIT_2026-10-02.md:32` — últimos 7d: **1.029 · 594 · 858 · 1.213 · 1.272 · 464 · 417** vistas, medidas vía subcolección `articles` (método correcto).
- `66be5212` (2026-09-30) — heatmap documenta **56 días reales** de cobertura en `traffic_daily`.
- `FORENSIC_CEO_AUDIT.md:52-56` — 2026-08-22: 695 vistas en 26 artículos.

El writer funcionó desde el 6-ago hasta al menos el 2-oct. Ningún commit posterior tocó la ruta de escritura (`git log --since=2026-10-02 -- lib/db/homepage.ts lib/analytics` → solo cambios de lectura/UI).

### Producción verificada vía Vercel CLI (autenticado, solo lectura)

- Deploy de producción = `dpl_B6AHceM37fhjGmPzDwyKn3iXdpeu`, creado 2026-10-09 17:36 → **commit `ef0e3068` = HEAD local** (el código del dual-write está en prod).
- Request logs últimas horas: `POST /noticias/<slug> 200` continuos = `trackViewAction` ejecutándose con tráfico real; `logs[]` de esas invocaciones **sin console.error** → `incrementViewsBySlug` no llega a sus ramas de error → ambos escritores se ejecutan.
- `vercel env pull` (prod y dev): todos los secretos (`FIREBASE_*`, `ADMIN_*`, `CRON_*`) marcados **sensitive** → no recuperables por CLI. `.env.local` y el JSON de service account (`G:\RESPALDO\...`) no existen localmente → **acceso directo a Firestore prod no disponible desde este entorno** (limitación externa documentada).

### Por qué el fallo era invisible además de falso-positivo

`incrementTrafficDaily` capturaba su error con `logger.warn` — y `logger.warn` está **silenciado en producción** (`lib/logger.ts:11-12,43`: `isSilent = isProd`). Si el write hubiera fallado realmente en prod, no dejaba rastro ni en consola ni en Sentry. Corregido a `logger.error`.

## 3. Corrección (archivos modificados)

| Archivo | Cambio |
|---|---|
| `lib/analytics/traffic-aggregator.ts` | `incrementTrafficDaily` y `saveTrafficDailySummary` ahora escriben en **batch** el doc padre `traffic_daily/{date}` = `{updatedAt}` (merge) junto al doc de artículo. `logger.warn`→`logger.error` en el catch del incremento. |
| `m18-probe.ts` | La query de `traffic_daily` ya no usa `collection.get()` (siempre vacío con padres fantasma) → `listDocuments()` + lectura de `articles` por día. |
| `tests/traffic-daily-writer.test.ts` | **Nuevo.** Stub Firestore fiel (padres fantasma, `set`+merge, dot-paths, `increment`, `batch`, `get` vs `listDocuments`). 4 casos. |
| `scripts/p0-7-traffic-daily-probe.mjs` | **Nuevo.** Sonda de solo lectura: `listDocuments`, conteo/vistas por día, muestra de `traffic_log`, matriz de cobertura log↔daily. |
| `scripts/p0-7-materialize-parents.mjs` | **Nuevo.** Backfill no destructivo e idempotente: materializa `{updatedAt}` solo en padres fantasma que ya tienen `articles`. `--dry-run` disponible. |

Sin cambios en `traffic_log`, GA4, consentimiento, tracking, frontend ni schema de `articles`.

## 4. Validación

- **Tests**: `vitest run` sobre `traffic-daily-writer` + `traffic-intelligence` + `traffic-reader` → **15/15 verdes**. Incluye: materialización del padre con solo `updatedAt`; raíz deja de reportar vacío tras el incremento; incrementos repetidos acumulan (views 1→3, sources/devices correctos) sin duplicar docs; `saveTrafficDailySummary` idem; `getTrafficDailySummary` lee lo escrito.
- **TypeScript**: `tsc --noEmit` → 0 errores.
- **ESLint** (archivos tocados): limpio, 0 warnings.
- **Idempotencia**: `set`+`merge` con `FieldValue.increment` es atómico server-side; repetir la acción incrementa el contador sin crear docs duplicados (verificado en test). El backfill de padres es idempotente por definición (solo escribe si `!doc.exists`).
- **Cron/deploy**: no hay dependencia de cron para `traffic_daily`; el mecanismo automático es el dual-write por request — verificado activo en prod (POST `/noticias/*` → 200).
- **Build**: `npm run build` → compilado en 4.6min, 103/103 páginas estáticas, 0 errores.

## 5. Datos

- **Rango histórico disponible**: última medición confirmada cubre desde ~2026-08-06 (56 días al 30-sep; ~5.800 vistas/7d al 2-oct). No hay evidencia de borrado — ningún código del repo elimina `traffic_daily` y los docs de `articles` no tienen campos timestamp sobre los que una política TTL pudiera actuar (`updatedAt` es string).
- **Backfill**: NO se recalcularon artículos desde `traffic_log` (duplicaría conteos — `traffic_log` es el mismo origen del dual-write). El único backfill aplicable es la materialización de padres fantasma → `scripts/p0-7-materialize-parents.mjs` (pendiente de ejecutar donde haya credenciales; `--dry-run` primero).

## 6. Producción

- **Deploy realizado**: NO (corrección local, sin push).
- **Commit**: pendiente — cambios en working tree (`lib/analytics/traffic-aggregator.ts`, `m18-probe.ts`, `tests/traffic-daily-writer.test.ts`, `scripts/p0-7-*`, este documento).
- **Pendiente post-deploy**:
  1. Deploy normal → el dual-write materializa padres desde la primera vista.
  2. Ejecutar `scripts/p0-7-materialize-parents.mjs --dry-run` y luego real, con credenciales admin (cubre los ~56+ días históricos).
  3. Verificación de solo lectura definitiva: `db.collection('traffic_daily').listDocuments()` (días presentes) + `…/articles.get()` por día + `collection('traffic_daily').get()` — tras el fix, la raíz debe devolver docs reales.
  4. Confirmar en el panel `/api/admin/traffic` → `meta.dailyCoverage` y `source: 'traffic_daily'`.

## 7. Limitación externa (declarada)

No se pudo leer Firestore de producción directamente: las credenciales Firebase no están disponibles localmente (`.env.local` vacío, service-account JSON ausente, secretos de Vercel marcados `sensitive`). La conclusión se sostiene en: (a) semántica documentada y reproducida de Firestore sobre padres fantasma, (b) evidencia histórica del repo de que `articles` estaba poblado al 2-oct, (c) el writer desplegado y ejecutándose en prod ahora mismo, (d) la propia sonda del repo midiendo con la query errada. La verificación definitiva queda acotada a 3 consultas de solo lectura (§6.3).
