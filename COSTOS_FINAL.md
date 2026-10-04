# COSTOS FINAL — FUNCIÓN → CONSUMO → NECESIDAD → RIESGO → ACCIÓN

## Crons (10 configurados en vercel.json)

| Función | Frecuencia | Consumo | Necesidad | Riesgo | Acción |
|---|---|---|---|---|---|
| resumen-diario | diario 6am NI | 1 read noticias(120) + 1 write + 1 TG | ALTA — difusión matinal | que falle silencioso (ya pasó) | ✅ corregido orderBy; heartbeat |
| nios-collect | diario | reads analytics + writes | MEDIA — inteligencia | costo si hace scans grandes | medir; heartbeat |
| nios-ceo-loop | diario | loop inteligencia | MEDIA | costo si llama APIs | medir |
| departamento-central | diario 00:00 | ciclo orquestador | MEDIA | — | mantener |
| departamento-daily | diario 6:00 | tareas diarias | MEDIA | — | mantener |
| departamento-watchdog | diario 1:00 | chequeo | BAJA-MEDIA | — | mantener (detecta fallos) |
| supervisor-watch | diario 4:00 | chequeo notas | MEDIA | — | mantener |
| traffic-cleanup | diario 3:00 | limpieza analytics | BAJA-MEDIA | — | mantener |
| distribuciones-retry | diario 5:15 | reintenta envíos | MEDIA | solo si hay failures | mantener |
| meni-learning-cycle | domingo | ciclo aprendizaje | MEDIA-BAJA | costo si recorre colecciones grandes | medir |

## Firestore

| Consumo | Fuente | Riesgo | Acción |
|---|---|---|---|
| Reads en home/article/categoría | cada page render + ISR | alto volumen si no hay caché | ISR + unstable_cache activos — verificar cobertura |
| Writes por publicación | noticias + distribuciones + claims | bajo | normal |
| Colecciones analytics/traffic | NIOS + metricas | crecen sin TTL | traffic-cleanup ya corre — verificar retención |
| resumenes_diarios | 1/día | mínimo | — |
| noticias scans de 120 en crons | resumen-diario, limpieza | costo por scan | ya limitado a 120 |

## Vercel

| Consumo | Fuente | Acción |
|---|---|---|
| Serverless invocations | páginas + 114 rutas API | verificar que las 52 sin referrer no sean invocadas externamente (basura de bots cuesta) |
| ISR revalidation | revalidate en guardado | correcto |
| Cron calls | 10/día + 1 semanal | ~310 invocaciones/mes — dentro de cualquier plan |

## APIs externas

| API | Uso | Costo |
|---|---|---|
| Telegram Bot | envío + resumen | gratis |
| Facebook Graph | publicación | gratis (creds ya configuradas) |
| OneSignal | push | freemium — skipped sin creds |
| IndexNow | ping Bing/Yandex | gratis |
| Weather/exchange rates | widgets públicos | gratis |
| Google Search Console / GA4 | analytics | gratis |

## Riesgos de costo real

1. **ISR misses** — si el home re-renderiza por cada request → Firestore reads masivas. Verificar `revalidate` en app/page.tsx y caché efectiva.
2. **NIOS collectors** — 143 archivos; si alguno escanea colecciones completas por cron → costo. Medir cada collector.
3. **Rutas API públicas sin throttle** — bots invocando /api/* cuestan invocaciones. Vercel cuenta cada hit.
4. **Imágenes** — servir desde dominio propio vs proxy (weserv) — revisar tamaños.
