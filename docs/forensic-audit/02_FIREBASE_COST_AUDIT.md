# 02 — FIREBASE COST AUDIT

**Auditor:** Firebase Specialist + Database Engineer
**Fecha:** 2026-08-03

---

## 1. MODELO DE DATOS

Colecciones detectadas en `firestore.rules`:
- `noticias` — colección principal (pública lectura)
- `newsletter_subscribers` — suscriptores
- `newsletter_campaigns` — campañas (admin)
- `newsletter_sponsors` — sponsors (admin)
- `sponsored_campaigns` — campañas pagadas (admin)
- `analytics` — solo lectura admin
- `views` — contadores públicos
- `config` / `configuracion` — configuración pública
- `kb_entities` / `kb_relations` / `kb_timelines` — Knowledge Graph (admin)
- `learning_cycles` / `learning_config` — Learning Engine (admin)
- `seguimiento_cases` / `seguimiento_updates` — Seguimiento (admin)
- `portada_intel` / `portada_intel_config` / `portada_config` — Portada (admin)
- `traffic_log` — logs de tráfico (admin read, auth write)
- `analytics_traffic` — analytics (admin read, auth write)
- `distribuciones` — distribución (admin)
- `reportes_crecimiento` — reportes (admin)
- `links_cortos` — short links (implícita, no en rules)

## 2. HALLAZGOS DE COSTO

### H-FB-01: `getNewsByCategory` lee 500 documentos para filtrar en memoria
- **Evidencia:** `lib/data.ts:193` — `fetchNoticiasList([...LIST_FIELDS], MAX_COUNT)` con `MAX_COUNT=500`
- **Costo estimado:** 500 lecturas por request de categoría (con cache miss)
- **Cache:** `unstable_cache` con `revalidate: 3600` (1 hora) → 24 cache misses/día máximo
- **Costo diario:** 500 × 24 = 12,000 lecturas/día por categoría
- **Con 8 categorías:** 96,000 lecturas/día = 2.88M lecturas/mes
- **Costo mensual:** ~$1.44 (región US, $0.036/100K lecturas en plan Blaze)
- **Riesgo:** ALTO — escalable mal. Si se agregan categorías o se reduce cache, escala linealmente
- **Prioridad:** P1
- **Solución:** Query Firestore con `where('categoria','==',categoria).orderBy('fecha','desc').limit(count)` — reduce a 30 lecturas por request

### H-FB-02: `getMasLeidas` llama `getNews(100)` internamente
- **Evidencia:** `lib/data.ts:213` — `const noticias = await getNews(100)`
- **Costo:** Si la cache de `getNews` expiró, son 100 lecturas adicionales
- **Cache:** `revalidate: 300` (5 min) → 288 cache misses/día
- **Costo diario:** 100 × 288 = 28,800 lecturas/día = 864,000/mes
- **Costo mensual:** ~$0.31
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Pasar el resultado de `getLatestNews` como parámetro

### H-FB-03: `incrementViewsBySlug` hace 2 operaciones Firestore por pageview
- **Evidencia:** `lib/db/homepage.ts:72-85` — `docRef.update({vistas: increment(1)})` + `db.collection('traffic_log').add({...})`
- **Costo:** 1 escritura + 1 escritura = 2 escrituras por pageview único
- **Tráfico estimado:** 10,000 pageviews/día → 20,000 escrituras/día = 600,000/mes
- **Costo mensual:** ~$0.27 (escrituras $0.18/100K en Blaze)
- **Riesgo:** MEDIO — escala con tráfico
- **Prioridad:** P2
- **Solución:** Batch las escrituras de traffic_log, o usar Google Analytics en lugar de Firestore para tracking

### H-FB-04: API `/api/auditor` lee 200 documentos sin cache ni auth
- **Evidencia:** `app/api/auditor/route.ts:57` — `db.collection('noticias').orderBy('fecha','desc').limit(200).get()`
- **Costo:** 200 lecturas por request, sin cache
- **Riesgo:** ALTO — si alguien hace spam, 200 lecturas por hit
- **Prioridad:** P1
- **Solución:** Agregar `unstable_cache` + auth

### H-FB-05: API `/api/auditor-wordcount` lee 200 documentos sin cache
- **Evidencia:** `app/api/auditor-wordcount/route.ts:37` — `db.collection('noticias').orderBy('fecha','desc').limit(200).get()`
- **Costo:** 200 lecturas por request, `force-dynamic` deshabilita cache
- **Riesgo:** ALTO
- **Prioridad:** P1
- **Solución:** Agregar cache o auth

### H-FB-06: API `/api/list-all` lee hasta 200 documentos sin cache ni auth
- **Evidencia:** `app/api/list-all/route.ts:16` — `query.limit(limit).get()` con limit hasta 200
- **Costo:** Hasta 200 lecturas por request
- **Riesgo:** MEDIO
- **Prioridad:** P2

### H-FB-07: API `/api/list-empty` lee 200 documentos sin cache
- **Evidencia:** `app/api/list-empty/route.ts:7` — `limit(200).get()`
- **Riesgo:** MEDIO
- **Prioridad:** P2

### H-FB-08: API `/api/check-content` lee 30 documentos sin cache
- **Evidencia:** `app/api/check-content/route.ts:7` — `limit(30).get()`
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-FB-09: `getAllSlugs` lee hasta 2000 documentos
- **Evidencia:** `lib/data.ts:333-338` — `.select('slug').limit(2000).get()`
- **Uso:** Sitemap generation
- **Cache:** No tiene cache propia, pero el sitemap tiene `revalidate: 3600`
- **Costo:** 2000 lecturas/hora = 48,000/día = 1.44M/mes
- **Costo mensual:** ~$0.52
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Reducir a 500 o usar `count()` + paginación

### H-FB-10: Sitemap trae 500 noticias
- **Evidencia:** `app/sitemap.ts:14` — `getNews(500)` con cache 1h
- **Costo:** 500 lecturas/hora (cache miss) = 12,000/día = 360,000/mes
- **Costo mensual:** ~$0.13
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-FB-11: `traffic_log` crece indefinidamente sin TTL
- **Evidencia:** `firestore.rules:117-128` — permite create pero no delete
- **Impacto:** Colección crece sin límite, aumenta costo de almacenamiento
- **Riesgo:** MEDIO — costo de almacenamiento $0.108/GB/mes
- **Prioridad:** P2
- **Solución:** Agregar TTL policy en Firestore o cron job de limpieza

### H-FB-12: `analytics_traffic` crece indefinidamente
- **Evidencia:** `firestore.rules:129-142` — permite create pero no delete
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** TTL o cron de limpieza

## 3. ÍNDICES FIRESTORE

**Definidos en** `firestore.indexes.json`:
1. `noticias`: `estado ASC + fecha DESC` ✅
2. `noticias`: `estado ASC + categoria ASC + fecha DESC` ✅
3. `newsletter_subscribers`: `status ASC + preferences.frequency ASC`
4. `newsletter_campaigns`: `status ASC + sentAt DESC`

**Índices faltantes:**
- `noticias`: `slug ASC` — usado en `getNewsBySlug` (query `.where('slug','==',slug)`)
- `noticias`: `categoria ASC + fecha DESC` — para query optimizada de categorías (H-FB-01)
- `noticias`: `vistas DESC` — usado en `/api/top-noticias`

## 4. REGLAS DE SEGURIDAD

**Hallazgos:**
- `noticias` allow list: `if true` — cualquiera puede listar todas las noticias ⚠️
- `noticias` allow get: `if true` — lectura pública correcta para medio
- `noticias` create/update/delete: `if request.auth != null` — cualquier usuario autenticado, no verifica rol admin ⚠️
- `config` / `configuracion`: read `if true`, write `if request.auth != null` ⚠️
- `views`: create sin auth — correcto para contador público
- `traffic_log` / `analytics_traffic`: write requiere auth — pero se usan desde server-side con Admin SDK que bypassa rules

## 5. COSTO MENSUAL ESTIMADO

| Operación | Volumen/mes | Costo estimado |
|---|---|---|
| Lecturas ISR (home, artículos, categorías) | ~3.5M | $1.26 |
| Lecturas API sin cache (auditor, list-all, etc) | Variable | $0.50-2.00 |
| Escrituras (views + traffic_log) | ~600K | $1.08 |
| Sitemap + getAllSlugs | ~1.8M | $0.65 |
| Almacenamiento | <1GB | $0.11 |
| **Total estimado** | | **$3.60-5.10/mes** |

Con las optimizaciones propuestas: ~$1.50-2.00/mes

## 6. SCORE

| Dimensión | Score |
|---|---|
| Modelo de datos | 6/10 |
| Costo efficiency | 5/10 |
| Índices | 5/10 |
| Reglas de seguridad | 5/10 |
| Escalabilidad | 6/10 |
| **Total** | **5.4/10** |
