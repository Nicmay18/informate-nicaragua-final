# FORENSIC_CEO_AUDIT.md

**Auditor:** Principal Software Architect + CTO + Chief Editorial Product Engineer  
**Fecha:** 2026-08-22  
**Ambiente:** Local con `.env.local` real (Firestore accesible, GSC/GA4 bloqueados)  
**Restricción aplicada:** No se modificó MENI core, editorial core, canonical, taxonomy, sitemap, robots, categorías públicas, sitemap/robots.  
**Método:** Inspección de código + ejecución de consultas reales contra Firestore (sin simulación).

---

## 1. RESUMEN EJECUTIVO DEL DIAGNÓSTICO

El CEO Agent ya tiene una arquitectura correcta a nivel de concepto: **no es un dashboard, es un decisor editorial**. Sin embargo, en el camino de los datos crudos → evidencia → decisión existen **fugas de verdad** que convierten `NO_DATA`/`0` en números sólidos y mezclan semánticas de tráfico. El resto del sistema (NIOS Command Center, scores de salud, inteligencias de audiencia/distribución/negocio) produce **recomendaciones estáticas o genéricas** en lugar de acciones event-driven con evidencia.

### Veredicto preliminar
- **CEO Agent lógica:** 70 % útil, con P0/P1 que deben corregirse antes de declararlo operativo.
- **Tráfico / Analytics:** P0 en la frontera entre `traffic_log` (eventos 24h) y `traffic_daily` (agregado día calendario) y en conversiones silenciosas de `undefined` → `0`.
- **NIOS Command Center:** duplica metas del CEO con scores sin acción; puede simplificarse/consolidarse.
- **MENI core:** no se encontró defecto reproducible; NO se toca.
- **Producción-ready:** **NO**. Faltan correcciones P0/P1 y pruebas reales con flujo de noticia nueva.

---

## 2. DATOS REALES VERIFICADOS

Se ejecutó un script temporal (`__audit-real.ts`, ya eliminado) con `npx tsx` contra Firestore real. Los números son del ambiente real, no simulados.

### 2.1. Noticias publicadas (`noticias` — `estado == 'publicado'`)
- **Total artículos:** 277
- **Total vistas acumuladas (`vistas`):** 22,486
- Distribución por categoría:
  - `Sucesos` — 85 artículos, 12,857 vistas
  - `Nacionales` — 94 artículos, 6,600 vistas
  - `Deportes` — 39 artículos, 1,320 vistas
  - `Internacionales` — 33 artículos, 1,185 vistas
  - `Espectáculos` — 13 artículos, 298 vistas
  - `Tecnología` — 13 artículos, 226 vistas
- **Nota:** la cifra de 23,952 reportada por el usuario no coincide con el campo `vistas` de 277 artículos publicados. La diferencia requiere aclarar si incluye borradores, artículos archivados, otro campo (`vistas` vs `vistasTotales`) o ruido histórico.

### 2.2. Tráfico últimas 24 horas (`traffic_log` — rolling 24h)
- **Eventos totales (`count()`):** 922
- **Suma por `source` (sample limit 5000):** 922 (coincide con `count()` en este caso)
- Fuentes observadas:
  - `facebook`: 855
  - `directo`: 32
  - `google`: 13
  - `otro`: 10
  - `whatsapp`: 4
  - `telegram`: 8
- **Problema P0:** la taxonomía de fuentes no es la canónica del prompt (`GOOGLE_SEARCH`, `GOOGLE_DISCOVER`, `FACEBOOK`, `TELEGRAM`, `WHATSAPP`, `DIRECT`, `REFERRAL`, `OTHER`, `UNKNOWN`). `google` no diferencia Search/Discover; `directo` no es `DIRECT`; `otro` no es `UNKNOWN`.

### 2.3. `traffic_daily` — hoy (UTC 2026-08-22)
- **Artículos con resumen diario:** 26
- **Vistas totales agregadas:** 695
- Top 5:
  1. `feria-de-vivienda-en-managua-bonos-precios-y-requisitos` — 535
  2. `kfc-abre-su-tercera-sucursal-en-nicaragua-y-anuncia-otra` — 94
  3. `inss-que-familiares-tienen-cobertura-por-fallecimiento` — 12
  4. `dia-del-folklore-las-tradiciones-que-cuentan-la-historia-de-nicaragua` — 8
  5. `sepultan-a-nina-de-4-anos-investigan-muerte-en` — 8

### 2.4. Discrepancia 24h vs día calendario
- `traffic_log` 24h rolling = 922 eventos.
- `traffic_daily` día calendario = 695 vistas en 26 artículos.
- La diferencia es **legítima si se entiende la semántica**: `traffic_log` es ventana deslizante 24h; `traffic_daily` es fecha UTC fija. Pero el sistema no documenta esto y los endpoints lo mezclan, lo que puede confundir a un editor.

### 2.5. Google Search Console y GA4
- No se encontraron credenciales operativas en `.env.local`.
- Estado esperado: `ACCESS_BLOCKED`.
- No se ejecutó GSC/GA4 real; reportar como `BLOCKED` con causa.

---

## 3. HALLAZGOS POR PRIORIDAD

### 3.1. P0 — FUGA DE DATOS: `NO_DATA`/`undefined` se convierte en `0` en el CEO Agent

| Campo | Archivo | Línea | Causa | Impacto | Evidencia | Corrección propuesta |
|-------|---------|-------|-------|---------|-----------|----------------------|
| `totalViews` forzado a `0` | `lib/ceo-agent.ts` | 325 | `const totalViews = article.vistas ?? 0;` | Una noticia sin `vistas` pasa a "0 vistas" en lugar de `NO_DATA`, falseando decisión. | Si `vistas` es `undefined`, `formatNumber(0)` devuelve `"0"`, no `"NO_DATA"`. | Usar `article.vistas` tal cual; tratar `undefined` como `NO_DATA`; solo comparar cuando `typeof === 'number'`. |
| `recentViews` forzado a `0` | `lib/ceo-agent.ts` | 326 | `const recentViews = traffic?.viewsRecent ?? 0;` | `viewsRecent` ausente se convierte en `0`, lo que el threshold interpreta como "bajo tráfico" en vez de "sin datos recientes". | `?? 0` en señal `viewsRecent` cuando `traffic` existe pero `viewsRecent` es `undefined`. | Usar `traffic?.viewsRecent` y dejar `undefined` para `NO_DATA`; separar "sin tráfico" de "sin datos". |
| `effective` confunde `0` reciente con histórico | `lib/ceo-agent.ts` | 327 | `const effective = traffic ? (recentViews \|\| totalViews) : totalViews;` | Si `viewsRecent === 0` (real) y `totalViews` es alto, el CEO usa el histórico y puede decidir `PUBLISH` por tráfico viejo. | Artículo con 0 vistas recientes y 1.000 históricas se clasifica como `MEDIUM`/`HIGH`. | Cambiar a `recentViews ?? totalViews` solo si `recentViews` es `undefined`; si es `0`, usar `0`. |
| `articleViews` oculta `0` reciente | `lib/ceo-agent.ts` | 708 | `return traffic?.viewsRecent ?? a.vistas ?? 0;` | Daily brief toma histórico si `viewsRecent` es `0`, falseando priorización. | `??` convierte `0` en fallback. | Usar `traffic?.viewsRecent ?? a.vistas ?? undefined` y propagar `NO_DATA`. |
| `getGrowthMetrics` convierte `vistas` undefined | `lib/growth.ts` | 31 | `vistas: typeof d.data().vistas === 'number' ? d.data().vistas : 0` | Total de vistas acumuladas puede incluir ceros por datos faltantes. | 277 artículos publicados suman 22,486; los sin `vistas` se cuentan como 0. | Distinguir `undefined` de `0`; reportar cuántos faltan. |

**Evidencia ejecutada:** consulta real a Firestore arrojó 277 noticias / 22,486 vistas; `traffic_log` 24h = 922 eventos; `traffic_daily` hoy = 695 vistas.

### 3.2. P0 — TRÁFICO: SEMÁNTICA NO DOCUMENTADA Y FUENTES MAL NOMBRADAS

| Campo | Archivo | Línea | Causa | Impacto | Evidencia | Corrección propuesta |
|-------|---------|-------|-------|---------|-----------|----------------------|
| Fuente `google` sin separar Search/Discover | `lib/analytics/traffic-aggregator.ts` | 96 | `const source = data.source || 'directo';` no normaliza. | No se puede diferenciar `GOOGLE_SEARCH` vs `GOOGLE_DISCOVER`; se confunde con el `1` de Discover del panel. | Fuente observada: `"google": 13`. | Crear normalizador canónico de fuentes en `traffic-aggregator`; guardar `source`, `medium`, `campaign` estandarizados. |
| Fuente `directo`/`otro` sin semántica clara | `lib/analytics/traffic-aggregator.ts` | 96 | Idem. | `directo` puede ser real directo, falta de referrer o fallo de atribución; `otro` es un cajón de sastre. | Fuentes: `directo`, `otro`. | Mapa canónico: `UNKNOWN` cuando no hay referrer; `DIRECT` con criterio explícito; `OTHER` para fuentes identificadas pero no prioritarias. |
| `traffic_log` 24h vs `traffic_daily` día calendario | `lib/analytics/traffic-reader.ts` | 97-103 | `getTrafficForDate` lee `traffic_daily/YYYY-MM-DD/articles`; `getTrafficPerformance` lee 7 días y mezcla. | El "total de hoy" depende de la colección usada y de si el agregador diario ya corrió. | 922 eventos rolling vs 695 vistas diarias. | Documentar semántica en contrato de datos; API debe exponer `periodo` y `colección`. |

### 3.3. P1 — CEO AGENT NO ESTÁ CONECTADO AL FLUJO DE NUEVA NOTICIA

| Campo | Archivo | Línea | Causa | Impacto | Evidencia | Corrección propuesta |
|-------|---------|-------|-------|---------|-----------|----------------------|
| CEO Agent solo reacciona a slug manual | `app/admin/ceo-agent/page.tsx` | 55-92 | El usuario debe pegar slug y presionar "Analizar". | No es un preflight editorial automático. | UI manual. | Disparar `analyzeForPublication` en el pipeline de guardado/publicación (`app/api/admin/guardar-directo/route.ts`) cuando `estado` cambia a revisión/publicación. |
| API `/api/admin/ceo-agent/analyze` no se consume en el flujo editorial | `app/api/admin/ceo-agent/analyze/route.ts` | 82-125 | Endpoint aislado. | MENI decide calidad, CEO decide oportunidad/tráfico, pero no se unen en el mismo flujo. | Ruta no importada por `guardar-directo` ni `publicar`. | Añadir decisión CEO a `ResultadoEditorial` / pipeline de publicación como señal adicional, no reemplazo de MENI. |

### 3.4. P1 — TRÁFICO: MUESTRA LIMITADA PUEDE FALSEAR FUENTES

| Campo | Archivo | Línea | Causa | Impacto | Evidencia | Corrección propuesta |
|-------|---------|-------|-------|---------|-----------|----------------------|
| `getGrowthMetrics` usa `limit(500)` para fuentes | `lib/growth.ts` | 70 | `sourceSnap` limitado a 500 docs. | Si hay >500 eventos en 24h, la suma de fuentes no coincidirá con `recentVisits` del `count()`. | Código: `.select('source').limit(500)`. | Usar agregación por `source` con `count()` o `traffic_daily` pre-agrupado en lugar de sample. |
| `getTrafficPerformance` mezcla 7 días con "hoy" | `lib/analytics/traffic-reader.ts` | 118-143 | `views` suma `performance.topArticles` (7 días) y fallback a `todayRead.views` (hoy). | Retorna `views` que representan distintas ventanas según haya datos. | `views: performance.topArticles.reduce(...) \|\| todayRead.views`. | Separar `views24h`, `views7d`; no devolver un campo `views` ambiguo. |
| `logger.error` en rutas normales | `lib/analytics/traffic-reader.ts` | 60,65,80 | Logs de `error` para lecturas exitosas. | Sentry/observabilidad se satura de falsos errores. | `logger.error('[traffic-reader] fetchTrafficForDate', ...)` en path normal. | Cambiar a `logger.info`/`logger.debug` cuando no hay error real. |

### 3.5. P1 — NIOS COMMAND CENTER PRODUCE SCORES SIN ACCIÓN DIRECTA

| Campo | Archivo | Línea | Causa | Impacto | Evidencia | Corrección propuesta |
|-------|---------|-------|-------|---------|-----------|----------------------|
| `buildMediaHealth` genera `score/100` sin acción concreta | `lib/nios/command-center/ceo-view.ts` | 40-81 | Pondera 7 pilares y genera un score. | El usuario pidió: "Toda puntuación debe responder qué hacer". | `score`, `level`, `diagnostico` genérico. | Reemplazar score por alerta/action cards con causante, evidencia y acción; o marcar para eliminación. |
| `buildCeoCards` recomienda acciones genéricas | `lib/nios/command-center/ceo-view.ts` | 120-269 | Usa `cc.distribution.plans[0]`, `cc.hunter.items[0]`, etc., sin evento real. | Recomendaciones del tipo "Crear guía X" sin prueba de que el evento ocurrió hoy. | Cards fijas crecer/google/negocio/marca. | Transformar a event-driven: solo mostrar card si hay trigger real (nueva noticia, spike, caída, gap GSC). |
| `buildCeoBriefing` genera frases motivacionales | `lib/nios/command-center/ceo-view.ts` | 83-118 | `greeting`, `state`, `bestYesterday`, etc. | No son decisiones ejecutables. | Texto: "Buenos días. El medio se encuentra..." | Sustituir por máximo 5 decisiones con `decision/confidence/reason/evidence/risk/recommendedActions`. |
| `buildCeoDecisions` no tiene `confidence` ni `evidence` | `lib/nios/command-center/ceo-decisions.ts` | 26-169 | Las decisiones incluyen `headline`, `action`, `why`, pero no `confidence`, `evidence[]`, `risk`. | No cumple el contrato pedido de decisión estructurada. | `CeoDecision` sin `confidence` ni `evidence`. | Alinear `CeoDecision` con el contrato `PUBLISH/HOLD/UPDATE_EXISTING/...` del CEO Agent. |

### 3.6. P2 — SCORES DE SALUD Y OTROS DASHBOARDS DECORATIVOS

| Campo | Archivo | Línea | Causa | Impacto | Evidencia | Corrección propuesta |
|-------|---------|-------|-------|---------|-----------|----------------------|
| `calculateHealthScore` produce `score/100` sin acción | `lib/nios/intelligence/health-score.ts` | 25-103 | Suma 4 dimensiones en 0-100. | "Health Score sin acción" exactamente lo que el usuario rechazó. | `score`, `level`, `breakdown`. | Convertir cada dimensión con advertencia en una decisión `P0/P1/P2` con acción; o eliminar. |
| `analyzeAudience` usa umbrales arbitrarios | `lib/audience-intelligence.ts` | 29-37 | Hardcoded: `views > 200`, `quality >= 90`, etc. | Segmentos sin evidencia de causalidad. | `views > 200 && age <= 7` = "viral". | Reemplazar por análisis aprendido de TOP/BOTTOM 20 con datos reales o deprecar. |
| `recommendDistribution` usa reglas estáticas | `lib/distribution-intelligence.ts` | 21-64 | Categoría + vistas + scoreMeni con reglas fijas. | No aprende de rendimiento histórico por canal. | Reglas como `categoria === 'Tecnología'` → Facebook. | Entrenar con histórico real de clicks/alcance por canal o convertir a heurísticas documentadas. |
| `buildEditorJefeView` contiene simulaciones de anunciantes hardcodeadas | `lib/nios/command-center/ceo-view.ts` | 409-426 | `anuncianteBrands` = `['Claro','Banco LAFISE','Universidad']`. | Datos inventados/hardcodeados en el motor editorial. | Lista fija de marcas y keywords. | Eliminar simulación; reemplazar por datos reales de patrocinadores si existen, o quitar. |

### 3.7. P2 — CÁLCULOS DE TRÁFICO INCORRECTOS

| Campo | Archivo | Línea | Causa | Impacto | Evidencia | Corrección propuesta |
|-------|---------|-------|-------|---------|-----------|----------------------|
| `weeklyTrend` no es semana ISO | `lib/analytics/traffic-aggregator.ts` | 218-224 | `Math.ceil(d.getDate() / 7)` agrupa días del mes, no semanas. | Las "semanas" son ficticias. | Cálculo: `` `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}` ``. | Usar función ISO week o librería `date-fns`. |
| `scoreMeni ?? 70` en audiencia | `lib/audience-intelligence.ts` | 24 | Default 70 si MENI no evaluó. | Asume calidad sin evidencia. | `const quality = n.scoreMeni ?? 70;` | Tratar `undefined` como `NO_DATA`; no asumir 70. |
| `findRelatedArticles` sin peso semántico real | `lib/ceo-agent.ts` | 266-289 | Puntúa por tokens >3 caracteres y tags. | Puede recomendar artículos débilmente relacionados con la misma categoría. | `reason: 'Misma categoría y temas relacionados.'` para todos. | Incluir entidades, fecha y similaridad de contenido; dejar `reason` específico. |

### 3.8. P3 — DEUDA MENOR

| Campo | Archivo | Línea | Causa | Impacto | Evidencia | Corrección propuesta |
|-------|---------|-------|-------|---------|-----------|----------------------|
| `console.log` en API | `app/api/revalidate/route.ts`, `api/admin/guardar-directo/route.ts`, `api/admin/distribuir/route.ts` | 87, 298, 351, etc. | Logs de desarrollo en producción. | Ruido en logs; posible fuga de datos. | `console.log` directo. | Usar `logger` unificado. |
| `view-counter.ts` usa `logger.error` para batch normal | `lib/view-counter.ts` | 76 | `logger.error` en catch de reintentar. | Bien intencionado, pero `logger.warn` es suficiente. | Catch con `error`. | Cambiar a `logger.warn` si no es crítico. |

---

## 4. MAPA DE BLOQUEOS DE DATOS

| Fuente | Estado real | Causa | Impacto | Decisión correcta |
|--------|-------------|-------|---------|-------------------|
| Firestore `noticias` | REAL | Credenciales operativas. | CEO tiene artículos reales. | Usar. |
| `traffic_log` | REAL | Logs de eventos presentes. | Puede usarse para fuentes y 24h. | Usar con semántica clara. |
| `traffic_daily` | REAL (parcial) | Agregación diaria presente (26 artículos hoy). | Cubre artículos con tráfico; no todos. | Usar como resumen, documentar fallback. |
| GSC | ACCESS_BLOCKED | Sin credenciales GSC en `.env.local`. | No se generan oportunidades reales de Google. | Reportar `ACCESS_BLOCKED`; no inventar. |
| GA4 | ACCESS_BLOCKED | Sin credenciales GA4 en `.env.local`. | No hay datos de sesiones/usuarios. | Reportar `ACCESS_BLOCKED`; no inventar. |
| `indexing_log` | NO_DATA (real) | No hay registros para las URLs probadas. | CEO no puede saber estado de indexación. | Reportar `NO_DATA`; no asumir. |

---

## 5. PRUEBAS REALES EJECUTADAS

| Prueba | Comando / método | Resultado | Notas |
|--------|------------------|-----------|-------|
| Consulta real Firestore — noticias + tráfico | `npx tsx __audit-real.ts` | ✅ Datos reales obtenidos (277 noticias, 22,486 vistas, 922 eventos 24h, 695 vistas diarias) | Script temporal eliminado después. |
| CEO API daily real | `GET /api/admin/ceo-agent/daily` | ✅ 2 acciones reales: `ADD_SERVICE_INFORMATION` (Feria Vivienda, 535 vistas) y `WRITE_FOLLOWUP` (profesor Boaco) | Realizado en sesión anterior; GSC = `ACCESS_BLOCKED`. |
| CEO API analyze 8 artículos reales | `POST /api/admin/ceo-agent/analyze` | ✅ Decisiones obtenidas; 1 `PUBLISH`, 7 `MONITOR` | Basado en `traffic_daily` real. |
| `type-check` | `npm run type-check` | ✅ Exit 0 | Sin errores. |
| `lint` | `npm run lint` | ✅ Exit 0 | Sin advertencias bloqueantes. |
| `lib/ceo-agent.test.ts` | `npx vitest run lib/ceo-agent.test.ts` | ✅ 28/28 tests PASS | Cubre escenarios de decisión editoriales, pero no los P0 de tráfico mencionados arriba. |
| `build` | `npm run build` | ✅ Exit 0 | Build exitoso. |

---

## 6. COSAS QUE FUNCIONAN (NO TOCAR)

- **MENI core** (`lib/meni/core.ts`, `lib/editorial/core/`): estable y probado con 176 noticias; no se detectó defecto reproducible.
- **Canonical / taxonomy / public category** (`lib/editorial/canonical.ts`): resuelve categorías públicas sin invención.
- **Portada** (`app/admin/portada`): desacoplada, solo guarda configuración visual.
- **CEO Agent concepto base**: devuelve `decision/urgency/evidence/whatToDo/whatNotToDo/alert/dataStatus`; cumple el contrato pedido.
- **Autenticación admin** (`lib/auth.ts`, `lib/admin-auth.ts`): headers y tokens bien aislados.

---

## 7. PRÓXIMOS PASOS RECOMENDADOS (PENDIENTE AUTORIZACIÓN)

1. **Corregir P0/P1 en tráfico y CEO** (`lib/ceo-agent.ts`, `lib/analytics/traffic-reader.ts`, `lib/analytics/traffic-aggregator.ts`, `lib/growth.ts`) sin tocar MENI.
2. **Definir e implementar contrato canónico de fuentes** (`GOOGLE_SEARCH`, `GOOGLE_DISCOVER`, `FACEBOOK`, `TELEGRAM`, `WHATSAPP`, `DIRECT`, `REFERRAL`, `OTHER`, `UNKNOWN`).
3. **Conectar CEO Agent al flujo de nueva noticia** (`app/api/admin/guardar-directo/route.ts` / pipeline de publicación) como `preflight` editorial.
4. **Simplificar NIOS Command Center**: convertir `buildCeoCards`/`buildCeoBriefing` en decisiones event-driven con el contrato del CEO Agent.
5. **Añadir pruebas de regresión** para los bugs P0 (NO_DATA → 0, reciente 0 vs histórico, semántica de fuentes).
6. **Ejecutar prueba real con una noticia nueva**: guardar, observar decisión CEO, ajustar, publicar.

---

## 8. CONDICIÓN DE PRODUCCIÓN

**NO se declara `PRODUCTION_READY`.** Faltan:
- Corrección de conversiones `NO_DATA` → `0` en CEO.
- Taxonomía de fuentes real.
- Conexión del CEO al flujo de noticia nueva.
- Prueba real end-to-end de una noticia desde creación hasta decisión.
- Limpieza de scores/dashboards decorativos que no producen acciones.

Hasta entonces, el estado es: **AUDIT COMPLETE — P0/P1 PENDIENTES DE CORRECCIÓN**.
