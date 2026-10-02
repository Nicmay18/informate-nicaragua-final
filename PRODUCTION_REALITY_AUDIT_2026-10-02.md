# PRODUCTION REALITY AUDIT — 2026-10-02

**Tipo:** auditoría de solo lectura. **Cero cambios** de código, Firestore, billing, MENI o analytics.
**Método:** inspección de código + consultas directas a Firestore de producción (service account, lectura) + GA4 Data API (oficial) + fetch de producción.
**Evidencia cruda:** `.audit/reality-census.json`, `.audit/ga4-probe.ts`.

---

## RESUMEN EJECUTIVO

| Pregunta | Respuesta |
|---|---|
| ¿Hay tráfico real? | **SÍ.** 542 eventos/24h, 6.029/7d, 24.372/30d en `traffic_log`. GA4 confirma 15.957 usuarios / 21.567 pageviews en 30d. |
| ¿Tracking interno mide bien? | **SÍ, con sesgo conocido:** cuenta bots (~9% Googlebot) y usuarios sin consentimiento que GA4 excluye. |
| ¿Firebase/GA4 mide bien? | **SÍ.** El "1 usuario activo últimos 30 min" es normal: ~600–800 visitas/día dispersas ≈ <1–2 concurrentes. No es un fallo. |
| ¿El correo de Google es consumo anormal? | **NO.** Presupuesto configurado $1 → 50% = **$0.50 acumulado**. Es umbral de presupuesto, no billing anómalo. Sept real: $10.84. |
| ¿MENI bloquea notas documentadas? | **NO directamente.** `EVIDENCIA_REQUERIDA:*` son warnings de −3 pts, no bloqueos. Los 17 REJECTED reales son todos por FACTUALIDAD (fuentes/atribución), no por evidencia editorial. |

---

## 1. TRÁFICO REAL — números de producción

### Datos observados (Firestore + GA4, 2026-10-02 ~19:10 UTC)

| Métrica | Valor | Fuente |
|---|---|---|
| Eventos `traffic_log` últimas 24h | **542** | count() directo |
| Eventos últimos 7d | **6.029** | count() directo |
| Eventos últimos 30d | **24.372** | count() directo |
| Total acumulado `traffic_log` | 25.071 docs | count() directo |
| `noticias.vistas` acumulado (toda la colección) | **55.554** en 523 docs | select('vistas') |
| Vistas diarias (`traffic_daily`, últimos 7d) | 1.029 · 594 · 858 · 1.213 · 1.272 · 464 · 417 | subcolección `articles` |
| GA4 30d | **15.957 users / 18.927 sessions / 21.567 pageviews** | GA4 Data API, status REAL |
| GA4 engagement rate | 67.2% | GA4 Data API |
| `analytics_traffic` (clics links cortos) | 937 | count() |
| `support_analytics` | 3.078 | count() |
| `nios_telemetry` (JourneyTracker) | **47** — prácticamente sin uso | count() |

### Origen del tráfico (24h interno vs 30d GA4)

| Fuente | Interno 24h | GA4 30d (users) |
|---|---|---|
| Facebook | 214 (39%) | 13.392 + 397 lm.fb + 174 fb.com + 146 m.fb ≈ **88%** |
| Directo | 304 (56%) | 845 |
| Google | 17 (3%) | 582 |
| WhatsApp | 2 | 187 |
| Telegram | 2 | 110 |
| Bing | — | 264 |
| chatgpt.com | — | 28 |

El "directo" interno alto es esperable: cualquier request sin `Referer` (apps, previews, crawlers JS) cae en `directo` en `detectarFuente`.

### Bots confirmados en tracking interno (24h)

- `Nexus 5X` (Googlebot smartphone, renderiza JS): **47 eventos ≈ 9%**
- `Mozilla/5.0 ... compatible` genérico (crawler tipo Bing/otros): 44 eventos ≈ 8%
- **~17% del tráfico interno 24h es crawler/bot**, porque Googlebot ejecuta JS → dispara `trackViewAction`.

### Cadena FUENTE → COLECCIÓN → API → COMPONENTE → DASHBOARD

```
VISITA AL ARTÍCULO
├─ components/ArticlePage.tsx:96-120 (useEffect)
│   → dedup: sessionStorage `viewed_${slug}` (1 vista/sesión/slug)
│   → trackViewAction(slug, referrer, utmSource, userAgent, sessionId)
├─ app/actions/track-view.ts (server action)
│   → rate limit 5 vistas/min por IP+slug
│   → incrementViewsBySlug()
├─ lib/db/homepage.ts
│   → noticias.vistas (batched 30s, lib/view-counter.ts)
│   → INSERT traffic_log {slug, source, referrer, utmSource, userAgent, sessionId?, expiresAt}
│   → MERGE traffic_daily/{UTC-date}/articles/{slug}
│   → detectarFuente(): UTM > UA > referrer > directo
├─ app/api/admin/traffic/route.ts (auth admin, lee ≤5.000 eventos + ≤70 días daily)
└─ public/panel.html línea 6327 → setInterval 60s → fetch /api/admin/traffic (POST)
```

Canales paralelos independientes:
- **Links cortos:** `/api/l/[id]` → `analytics_traffic` + `links_cortos.clicks` + redirect con UTM (server-side, sin JS ni consentimiento).
- **Support widget:** `POST /api/support/track` → `support_analytics` (impresiones/clics, no pageviews).
- **JourneyTracker:** `POST /api/telemetry/journey` → `nios_telemetry` — **solo 47 docs: no es una fuente de métricas confiable hoy.**

### Noticias más visitadas (interno 24h)

1. `tres-miembros-de-una-familia-mueren-tras-deslave-en-siuna` — 66 (la página pública muestra "66 vistas": **el contador interno coincide con lo que ve el lector**)
2. `dos-mujeres-mueren-en-hechos-violentos-en-managua-y-chontales` — 61
3. `centro-nacional-de-neurocirugia-alcanza-10-de-avance-en` — 35
4. `pagas-seguro-facultativo-conoce-tus-beneficios` — 25

---

## 2. TRACKING INTERNO vs FIREBASE/GA4 — la discrepancia explicada

### Configuración GA4 real en producción

- Único loader activo: `app/layout.tsx:153-181` — `gtag/js?id=G-W1B5J61WEP`, `afterInteractive`.
- `components/Analytics.tsx` y `components/DeferredAnalytics.tsx`: **DEAD CODE** (documentado en `SYSTEM_REGISTRY.md`, sin imports — confirma 0 doble-conteo).
- Eventos: `page_view` automático vía `gtag('config')` + `WebVitalsReporter` envía métricas de performance.
- **Firebase client SDK (`NEXT_PUBLIC_FIREBASE_*`): VACÍAS en producción** (documentado en `FORENSIC_CLOSURE_REPORT.md:409-414`). No hay `firebase/analytics` del SDK; todo GA4 va por gtag. El panel "Firebase" muestra la propiedad GA4 vinculada `G-W1B5J61WEP` / propiedad `525672447`.

### Por qué GA4 muestra "1 usuario activo últimos 30 min"

1. Es métrica **realtime de usuarios distintos**, no pageviews acumulados.
2. ~600–800 visitas/día repartidas en 24h ≈ **0.5–1.5 usuarios concurrentes promedio** fuera de picos → "1" es consistente, no roto.
3. `consent default`: `analytics_storage: denied` salvo opt-in en `ni_cookie_preferences` (`layout.tsx:166-176`). Con consent denied, GA4 usa pings cookieless → subestima usuarios recurrentes en realtime, aunque **sí registra** (los 15.957 users/30d lo demuestran).
4. El interno cuenta bots (~17%); GA4 los filtra → siempre habrá delta.

**Veredicto:** ambos sistemas miden **cosas distintas y coherentes**: interno = pageviews (con bots), GA4 = usuarios/sesiones consentidos y filtrados. 24.372 vs 21.567 en 30d = delta de ~12%, totalmente explicado por bots + consent denied + rate limit.

### Prueba controlada de producción

- `GET https://nicaraguainformate.com/noticias/tres-miembros-de-una-familia-mueren-tras-deslave-en-siuna` → **200, contenido completo renderizado**, muestra "66 vistas".
- El fetch sin JS **no** generó `traffic_log` (el evento requiere que el cliente ejecute la server action) — lo que confirma que solo clientes con JS cuentan… y que los crawlers que sí renderizan (Googlebot) **sí** cuentan.
- Mientras se auditaba, `traffic_log` creció +13 docs en minutos → **escritura en vivo confirmada**.

Cadena browser→Firestore: **funciona de punta a punta.** El único "punto de pérdida" es intencional: dedup por sesión y rate limit.

---

## 3. GOOGLE CLOUD / FIRESTORE — presupuesto vs billing

| Dato | Valor | Estado |
|---|---|---|
| Presupuesto configurado | $1 | correo del usuario |
| Umbral alcanzado | 50% = **$0.50** | correo del usuario |
| Costo real septiembre | ~$10.84 (12,18M lecturas, 42,7 GiB egress) | `.audit/CLOUD_COST_FORENSIC_AUDIT_2026-10.md` |
| Costo 1/oct (primer día auditado) | ~$0.08 | mismo informe |
| Costo acumulado octubre a hoy | **~$0.50** (inferido del umbral — NO hay API de billing disponible desde aquí) | **inferencia declarada** |

**Conclusión:** el correo es un **alert de umbral de presupuesto trivialmente bajo ($1)**, no un consumo anómalo. Con ~$10/mes de gasto real, cualquier presupuesto de $1 dispara alerts todo el mes. Sin acceso a Cloud Billing API: no puedo dar el número exacto de octubre; el 50% × $1 acota el máximo a **$0.50**.

### Top generadores de lecturas Firestore (evidencia de código + volumen)

| # | Operación | Colección | Lecturas/op. | Frecuencia | Transferencia | Motivo |
|---|---|---|---|---|---|---|
| 1 | **Panel admin tráfico** | `traffic_log` + `traffic_daily` | hasta **5.000** eventos + ~70 docs diarios | **cada 60s** mientras `/panel.html` abierto | ~5-15 MB/call | dashboard realtime con polling |
| 2 | **detectarDuplicadoAdmin** | `noticias` | hasta **2.000 docs** | por cada evaluación MENI con `checkDuplicates` (default ON) y cada guardado | **~20-100 MB** (contenido HTML completo) | detección de duplicados — ver §5 |
| 3 | **NIOS/GSC learning** | `google_learning_patterns` (17.019 docs) | cientos-miles según query | cron `nios-collect` diario + `departamento-*` ×4/día | variable | patrones GSC |
| 4 | Homepage ISR | `noticias` + agregados | ~30-80 reads | cada 300s ≈ 288/día | bajo | regen ISR |
| 5 | Tracking de vista | `noticias`,`traffic_log`,`traffic_daily` | ~3-4 | por cada pageview (~800/día) | bajo | contador + log |
| 6 | MENI eval (KB scoped) | `kb_*` | ~200-600 | por eval | bajo | contexto aprendido (post-5cf28f4a, acotado) |
| 7 | `getArticleMetricsAction` | `noticias` | 1-2 | por pageview | mínimo | vistas SSR→cliente |
| 8 | traffic-cleanup cron | `traffic_log` | N docs expirados | diario 03:00 | bajo | TTL manual |
| 9 | Admin news list | `noticias` | ~500 | por apertura de panel | medio (contenido completo) | listado editorial |
| 10 | Sitemap/feeds | `noticias` | ~523 | por request/bot crawl | medio (contenido) | SEO |

La lectura masiva de septiembre (12,18M) **no viene del tráfico público** (~800 vistas/día ≈ 3K lecturas); viene de admin/MENI/crons.

---

## 4. `detectarDuplicadoAdmin` — medición

- **Implementación:** `lib/analizador-duplicados.ts:101-114` → `collection('noticias').select('titulo','contenido','slug','estado').limit(2000).get()` — **descarga el contenido HTML completo de hasta 2.000 noticias**.
- **Callers:** `lib/meni/core.ts` (vía `runMeniAsync` salvo `skipDuplicateCheck`); rutas que invocan evaluación/guardado: `app/api/admin/meni/evaluar` (**`checkDuplicates` default `true`** → corre en toda evaluación admin), `guardar-directo`, `news`, `news/[id]`.
- **Frecuencia real:** decision_log muestra solo 59 evaluaciones totales → ejecución esporádica, no por pageview. Riesgo: cada eval admin sin checkbox desmarcado = ~2K lecturas + tens of MB egress.
- **Costo estimado por ejecución:** 2.000 reads (~$0.07) + egress ~20-100 MB (~$2-12 si cruza región/internet). Es el **segundo mayor consumidor puntual** del sistema.
- Ticket completo: `.audit/TICKET_detectarDuplicadoAdmin_costo.md`. **No corregido** (instrucción).

---

## 5. Cadena `EVIDENCIA_REQUERIDA` — trazada completa

| Paso | Evidencia |
|---|---|
| Generador | `lib/editorial/core/scorer.ts:328-335` — `evaluarValorEditorial()` |
| Disparador | `for [key,regex] of profile.requiredEvidence` → regex no matchea `textoPlano` → warning + `tracer.sub(3)` |
| Solo si | `esLargo` (nota larga — notas cortas de actualidad están exentas) |
| Perfil usado | **`Nacionales`** — `category-intelligence.ts:210-224` define `requiredEvidence`: `qué anunció el gobierno`, `cifras`, `dónde aplica`, `quién lo dijo`, `qué cambia` |
| Por qué "educacion" | `profile-detector.ts` clasifica el contenido como `educacion` (palabras MINED/escuela/calendario → peso +2 sobre nacionales, línea 571-572); `lib/editorial/canonical.ts:64` mapea **`educacion → Nacionales`** (publicación canónica). El mismatch categoría=Nacionales / perfil=educacion es **by design**, no bug. |
| Herencia | El perfil que se evalúa es el de la **categoría canónica** (Nacionales), no el perfil detectado — de ahí que pida "quién lo dijo / qué cambia" de notas de gobierno. |

### ¿Bloquean? — **NO.**

```
EVIDENCIA_REQUERIDA:*  → warnings[] + recomendación + −3 pts c/u (VALOR_EDITORIAL)
                        ↳ nunca entran a blockingIssues
                        ↳ no aparecen en meni_decision_log (verificado: 0 matches en últimos 60)
BLOQUEO REAL           → factuality IMPORTANT (TRUST_SOURCE_MISSING, VAGUE_ATTRIBUTION,
                         UNSOURCED_MATERIAL_FIGURES, PROVISIONAL_CLAIM) → Supervisor REJECTED
```

Los 17 REJECTED reales en `meni_decision_log` — todos por FACTUALIDAD:
`capa de confianza: SOURCE_MISSING` ×3 · `afirmaciones atribuidas solo a fuentes [vagas]` ×6 · `2 cifras materiales sin atribución` ×2 · `reporting de [campo]` ×1 · `PROVISIONAL_CLAIM` ×1 · warnings de título ×4.

### La fricción real con la nota de 97.3

- Gate de publicación: `aprobadoMeni && score ≥ MIN_APPROVED_SCORE(90)` (`editorial-supervisor.ts:145-154`).
- Con Valor Editorial 97.3 **aprobado**, las 3 EVIDENCIA warnings **no bloquean** — son recomendaciones que el admin UI muestra como checklist. La "obligación de reescribir" que percibe el periodista viene de la **UI de recomendaciones + el umbral de 90 puntos para auto-aprobación**, no de un bloqueo técnico. Si el score global cae <90 por otros módulos, pasa a `REVIEW_REQUIRED` humano — eso sí frena, pero es Supervisor, no EVIDENCIA.

**Módulo que genera fricción visible:** el checklist editorial del admin que renderiza `warnings[]+recommendations[]` como pendientes — autoridad de UX, no de gate.

---

## 6. FRICCIÓN EDITORIAL — qué se puede medir hoy

| Métrica | ¿Medible? | Dato real |
|---|---|---|
| Evaluaciones por nota | Parcial | `meni_decision_log` = 59 eventos (38 EVALUATED / 17 REJECTED / 4 SAVED); max 8 re-evaluaciones (nota del deslave) |
| Veces que se guarda/edita | Sí | `mutationLog`: 42 artículos editados; máx 5 mutaciones |
| Recomendaciones antes de publicar | **NO** | warnings no se persisten en decision_log |
| Score previo a publicación | Parcial | 493/523 ≥90 · 29 entre 70-89 · 1 <70 |
| Cadena eval→edit→re-eval | **NO** | los 38 EVALUATED no llevan slug (pre-save) — no se puede reconstruir el funnel por nota |
| `meniEvaluation` en `noticias` | **NO existe** (0/523 docs) — el resultado de eval no se persiste en el artículo | |

**Fricción real observada:** baja. ~8 re-evaluaciones máx., mayoría aprueba ≥90 en primeras evaluaciones. La fricción es **perceptual** (checklist de warnings), no sistémica.

---

## 7. TABLA DE ESTADO REAL

| Área | Estado real | Evidencia | Riesgo |
|---|---|---|---|
| Producción | **FUNCIONANDO** | Artículo real sirve 200 OK, vistas incrementan, ISR activo | — |
| MENI | **FUNCIONANDO** | 59 decisiones logueadas; 493/523 ≥90; EVIDENCIA = warning no bloqueo | warnings percibidos como obligación en UI |
| Learning | **FUNCIONANDO CON LIMITACIÓN** | KB 421 entidades pobladas; `editor_corrections`=0, `editor_patterns`=0 — sin datos humanos históricos que aprender | aprendizaje vacío hasta que haya correcciones reales |
| Forense | **FUNCIONANDO** | 17 REJECTED todos por factuality real (sources/attribution) | puede ser la fricción que el usuario percibe como "MENI" |
| Supervisor | **FUNCIONANDO** | Gate `score≥90 + aprobadoMeni` en `editorial-supervisor.ts:145` | REVIEW_REQUIRED humano en <90 |
| Tracking interno | **FUNCIONANDO CON LIMITACIÓN** | 24.372 eventos/30d; incluye ~17% bots; dedup por sesión | sobre-cuenta vs humanos reales |
| Firebase Analytics (GA4) | **FUNCIONANDO** | Data API REAL: 15.957 users/30d | consent denied → subestima recurrentes en realtime |
| Firestore | **FUNCIONANDO** | writes en vivo confirmadas | lecturas masivas de admin/dup-check (punto 3-4) |
| Vercel | **FUNCIONANDO** | ISR 300s, 10 crons declarados | polling admin 60s |
| Google indexing | **FUNCIONANDO CON LIMITACIÓN** | GA4 muestra google/bing/discover activo; Googlebot renderiza y cuenta | — |
| Costos | **FUNCIONANDO CON LIMITACIÓN** | ~$10.84/mes real; alert = presupuesto $1 no billing; dup-check ~2K reads×contenido por eval | el mayor riesgo de costo es `detectarDuplicadoAdmin` + polling del panel |

---

## LIMITACIONES DECLARADAS

1. **No hay acceso a Cloud Billing API** — el costo exacto de octubre no es consultable desde aquí; el 50%×$1 lo acota a ≤$0.50.
2. **`meniEvaluation` no persiste en `noticias`** — el funnel eval→publish no es reconstruible por artículo.
3. **Warnings EVIDENCIA no se guardan** en `meni_decision_log` — no hay histórico de cuántas veces se repitieron.
4. **JourneyTracker apenas usado** (47 docs) — las "sesiones" internas no son métrica confiable; usar GA4 sessions (18.927/30d) como fuente.
5. La prueba controlada fue fetch HTTP (sin browser real con cookies) — el evento `traffic_log` de mi visita no se generó, lo cual es evidencia del dedup+JS requirement, no de fallo.
