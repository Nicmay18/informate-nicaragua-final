# Control de Gastos NIOS — auditoría profunda

## Veredicto

NIOS **no es el driver del costo**. Todas sus consultas están acotadas y sus colecciones son pequeñas. Aun así se verificó y se añadieron controles.

## Inventario de lecturas NIOS (verificado en código)

| Proceso | Colección | Límite | Frecuencia |
|---|---|---|---|
| `nios-collect` collect | `noticias` (via data-merger) | `limit(500)` + `select()` sin `contenido` | diario 08:00 UTC |
| analyze | `nios_runs/{fecha}` subcolecciones | `limit(600)` por subcolección | diario 08:30 |
| ceo stage + `nios-ceo-loop` | `nios_memory`, `nios_actions`, snapshots | `limit(20–500)` por query | diario 02:00 y 09:00 |
| `departamento-central` scheduler | `depto_jobs` | paginado `PAGE=500, MAX_PAGES=6` | cada hora 00:00 UTC |
| workers | `noticias` doc individual | 1 doc por job | por job |
| watchdog | `depto_jobs`, `depto_heartbeat` | `count()` + `limit` | diario 01:00 |
| operational-loop | `nios_operational` | `limit(200–300)` por kind | por ciclo CEO |
| MENI learning cycle | `noticias` | `select()` campos métricos | semanal domingo 06:00 |

## Hallazgos

1. **`store.ts` assembleSnapshot** — fallback que lee subcolecciones `articles`/`reports` completas de un snapshot viejo sin `articlesFused` inline. Solo afecta snapshots legacy; los nuevos guardan todo inline. No se tocó (cambiarlo corrompería la reconstrucción).
2. **`getHistoricalSnapshots`** ya devuelve solo metadata inline — correcto.
3. **`getHistoricalDataDays`** usa `count()` — correcto (evita descargar ~96 snapshots de ~100 KB).
4. **Idempotencia ya implementada**: etapas NIOS reanudables con locks (`lockedUntil`), `nios_actions` con dedup por `opportunityId`, claims atómicos en distribuciones, `departamento` con `hasOpenJob`/`hasRecentJob`.
5. **Limpieza existente**: `cleanupPipelineState` borra artículos intermedios tras analyze; `traffic-cleanup` aplica TTL a `traffic_log`.

## Cambios aplicados en esta misión

- `lib/nios/intelligence/data-merger.ts`: `loadNoticiasFromFirestore` ya no descarga `contenido` (antes ~500 docs × 10 KB = ~5 MB por ejecución → ahora ~500 KB). Flag `includeContenido` solo para el forense de 3 docs.
- `lib/nios/operational-loop.ts`: `loadNoticiasAsInputs` usa el loader optimizado.
- `lib/meni/learning-engine/metrics-collector.ts`: `.select()` con solo campos de métricas (antes `db.collection('noticias').get()` completo — ~7.5 MB semanal → ahora ~500 KB).
- `lib/cost-guard.ts`: modo economy puede omitir etapas `ceo`/`finalize` y crons pesados sin deploy.

## Costo estimado por ejecución NIOS (después)

| Etapa | Reads aprox | Duración |
|---|---|---|
| collect | ~500 (artículos) + GSC/GA4 docs | ~35 s |
| analyze | ~600×N subcolecciones + snapshots | ~40 s |
| ceo | ~200–800 docs operativos | ~53 s |
| finalize | ~50 docs | ~21 s |
| **Total diario** | **~3,000–6,000 reads + ~1 MB** | ~150 s en 4 invocaciones |

**Conclusión**: NIOS completo cuesta <US$0.01/día en Firestore. No justifica reducción de frecuencia — sus funciones editoriales son el producto.
