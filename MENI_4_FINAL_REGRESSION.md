# MENI 4 Final — Regresiones y Medición

Fecha: 2026-10-02

## Suite nueva: `tests/meni-editorial-verdict.test.ts` (20 tests)

| # | Caso | Resultado |
|---|---|---|
| A | Nota larga y documentada → `editorialVerdict` definido, 0 blockers, jamás BLOQUEAR | ✅ |
| B | Deducciones del scorer → RECOMMENDATION con `bloquea=false` | ✅ |
| C | Factualidad CRITICAL → BLOQUEAR; IMPORTANT → WARNING→REVISAR; veto Supervisor NO_PUBLICAR → BLOQUEAR | ✅ |
| D | `EVIDENCIA_REQUERIDA:*` (reportaje real de 708 palabras, INVESTIGACION, 5 fuentes) → RECOMMENDATION que no bloquea; mapper determinista | ✅ |
| E | `motocicleta/motociclista` en texto correcto → 0 defectos mecánicos, 0 hallazgos `QG_DEFECTO_MECANICO` | ✅ |
| F | `motocicletacicletas` → defecto mecánico BLOCKER → BLOQUEAR | ✅ |
| G | Nota casi idéntica a publicada → `DUPLICATE_CONTENT` BLOCKER → BLOQUEAR, `aprobado=false` | ✅ |
| H | Nota original vs corpus sembrado → sin hallazgo de duplicado | ✅ |
| I | Auto-corrección que introduce `motocicletacicletas` → revertida (`autoCorrected=false`), sin bloqueo por defecto propio | ✅ |
| J | Falso positivo en memoria (`meni_false_positives`) → se anota WARNING contextual; el defecto real sigue BLOQUEANDO | ✅ |
| K | Matriz de decisión: BLOCKER→BLOQUEAR, WARNING→REVISAR, RECOMMENDATION→PUBLICAR_CON_CAMBIOS, INFO→PUBLICAR, no-aprobado→REVISAR, veto→BLOQUEAR; orden por severidad | ✅ |
| L | Sin blockers → nunca BLOQUEAR; veredicto persistido en `updateData.editorVerdict` coherente con `meni.editorialVerdict` | ✅ |
| + | `locateEvidence` ubica párrafo y cita exacta; undefined cuando no está | ✅ |
| + | Integración `guardarConMeni` con Supervisor real → veredicto final integrado | ✅ |

## Suite completa

- **1220/1222 tests verdes** (vitest).
- Las 2 fallas son tests de **red real** (`mission9-real-sources`, `nios-operating-mode`)
  que llaman a GSC/GA4 con `gaxios` → `AbortSignal` type error en Node 24.
  Pre-existente, ambiental; ningún archivo de esas rutas fue modificado.
- `tsc --noEmit` limpio. `eslint` limpio en todos los archivos tocados.

## Medición antes / después

### `detectarDuplicadoAdmin`

| | Antes | Después |
|---|---|---|
| Lecturas Firestore | hasta 2.000 docs | hasta 2.000 (fase 1) + ≤20 (fase 2) |
| Datos transferidos | ~5–30 KB/doc → **~10–60 MB por evaluación** | ~0.3–0.5 KB/doc + ≤20 docs completos → **~0.5–1 MB** |
| Llamadas RPC | 1 | 2 (query + getAll) |
| Precisión | Jaccard sobre contenido | **idéntica** (fase 2 usa el mismo comparador) |

### `/api/admin/traffic` (polling 60s del panel)

| | Antes | Después |
|---|---|---|
| Scan `traffic_log` 24h | hasta 5.000 docs **por request** | cacheado 5 min (`unstable_cache`) |
| Lectura fresca | — | 200 docs/request (realtime + últimos eventos) |
| Costo típico por poll | ~600–1.300 lecturas + agregados | ~200 lecturas + scan amortizado/5min |
| Frescura visible | 60s | agregados ≤5min, eventos recientes ≤60s |

### Evaluación MENI

- Sin cambios de latencia: el veredicto es puro (mapas/regex sobre texto ya en memoria).
- `runMeni` ejecuta una re-evaluación extra **solo cuando hubo auto-correcciones**
  (antes también la hacía; ahora además valida su resultado — costo idéntico).

### Falsos positivos / bloqueos

- `EVIDENCIA_REQUERIDA:*`: antes eran warnings de −3 pts que la UI mostraba como
  "acciones requeridas" → ahora `RECOMMENDATION` con `bloquea:false` y etiqueta
  explícita "NO BLOQUEA PUBLICACIÓN". El score no cambia (sigue −3 en el scorer);
  lo que cambia es la semántica y la presentación.
- Auto-corrección: defecto auto-inducido ya no puede llegar a bloqueo sin que el
  sistema lo haya detectado (revert) y anotado en memoria FP.

## Invariantes garantizadas bajo prueba

1. Solo BLOCKER bloquea; RECOMMENDATION jamás; WARNING exige revisión humana.
2. Veto del Supervisor siempre gana (BLOQUEAR/NO_PUBLICAR → BLOQUEAR).
3. La auto-corrección mecánica se valida; si introduce defecto nuevo, se revierte.
4. Learning 4.0 aporta contexto; nunca silencia el Quality Gate ni mueve el score.
5. Un hallazgo → una severidad → una razón → una decisión (una sola fuente).
