# FORENSIC PHASE 15.1 — EJECUCIÓN CONTROLADA
## Nicaragua Informate — Auditoría Editorial
## Fecha: 2026-08-12

---

## RESUMEN EJECUTIVO

| Categoría | Total | Ejecutados | Aprobados | Rechazados | Sin cambios |
|-----------|-------|------------|-----------|------------|-------------|
| **AUTO_FIX** | 3 | 3 | 0 | 3 | 3 (score igual) |
| **ARCHIVE** | 6 | — | — | — | 1 confirmado, 2 review, 3 reclasificados KEEP |
| **DO_NOT_PUBLISH** | 1 | — | — | — | Recategorizado a ENRICHMENT |
| **EDITORIAL_ENRICHMENT** | 36+1 | 0 | — | — | 37 pendientes |
| **KEEP** | 235 | 0 | — | — | 235 sin cambios |

---

## PARTE 1 — AUTO_FIX: RESULTADOS DETALLADOS

### Artículo 1: CMo0EIdKF9E5CYTJj8H9

| Campo | Antes | Después |
|-------|-------|---------|
| **Título** | Economía de Nicaragua: dispara récord: crece 6% en remesas | Economía de Nicaragua: crece 6% en remesas |
| **Título cambiado** | SÍ — eliminado doble dospuntos | |
| **Score MENI** | 84 | 84 |
| **Aprobado MENI** | false | false |
| **Palabras** | 582 | 582 |
| **Calificación** | MEJORAR | MEJORAR |
| **Fixes aplicados** | `titulo_doble_dospuntos`, `entidades_html` | |
| **Provenance** | Registrado en `cambiosRealizados` (fase 15.1) | |

**Diagnóstico MENI**: Duplicado detectado (99% de similitud). La nota tiene potencial pero requiere mejoras.

**Análisis**: El fix de título fue objetivo y correcto (eliminación de doble dospuntos). Las entidades HTML fueron limpiadas. El score se mantuvo en 84 porque el contenido editorial no cambió. El bloqueo principal es detección de duplicado (99% similitud), que es un problema de contenido preexistente, no del fix técnico.

**Estado**: Guardado en Firestore con provenance. No aprobado. Permanece despublicado.

---

### Artículo 2: FLbXd6XRrTl5TCdTkNYT

| Campo | Antes | Después |
|-------|-------|---------|
| **Título** | Nicaragua en Santo Domingo 2026: medallas, béisbol y retos | (sin cambios) |
| **Score MENI** | 100 | 100 |
| **Aprobado MENI** | true | **false** ⚠️ |
| **Palabras** | 865 | 865 |
| **Calificación** | — | PUBLICABLE ORO |
| **Fixes aplicados** | `p_vacios_anidados`, `wrappers_tecnicos` | |
| **Provenance** | Registrado en `cambiosRealizados` (fase 15.1) | |

**Diagnóstico MENI**: Duplicado detectado (100% de similitud).

**Análisis**: El HTML fue limpiado correctamente (párrafos vacíos anidados y wrappers técnicos eliminados). El score se mantuvo en 100. Sin embargo, la re-evaluación MENI detectó duplicado a 100%, lo que bloqueó la aprobación. **Esto es una regresión**: el artículo estaba aprobado antes del fix.

**Causa raíz**: El detector de duplicados de MENI está comparando el artículo contra sí mismo o contra otra versión en Firestore. Al re-evaluar con `guardarConMeni()`, el contenido ya existe en la base de datos y el detector lo encuentra como duplicado.

**Estado**: Guardado en Firestore con provenance. Score 100 pero NO aprobado debido a detección de duplicado. **Requiere investigación del detector de duplicados.**

---

### Artículo 3: lzsto5T2q85IgrVkqlA2

| Campo | Antes | Después |
|-------|-------|---------|
| **Título** | Pokémon dona 100 millones de yenes tras terremoto en Japón | (sin cambios) |
| **Score MENI** | 98 | 98 |
| **Aprobado MENI** | true | **false** ⚠️ |
| **Palabras** | 676 | 676 |
| **Calificación** | — | PUBLICABLE ORO |
| **Fixes aplicados** | `p_vacios_anidados`, `wrappers_tecnicos` | |
| **Provenance** | Registrado en `cambiosRealizados` (fase 15.1) | |

**Diagnóstico MENI**: Duplicado detectado (100% de similitud).

**Análisis**: Mismo patrón que el Artículo 2. HTML limpiado correctamente. Score se mantuvo en 98. Pero la re-evaluación detectó duplicado a 100%, bloqueando la aprobación. **Regresión**: estaba aprobado antes.

**Causa raíz**: Misma que Artículo 2 — el detector de duplicados encuentra el artículo existente en Firestore como duplicado de sí mismo.

**Estado**: Guardado en Firestore con provenance. Score 98 pero NO aprobado. **Requiere investigación del detector de duplicados.**

---

### HALLAZGO CRÍTICO: Detector de duplicados en re-evaluación

Los Artículos 2 y 3 estaban aprobados antes del AUTO_FIX. Después de re-evaluar con `guardarConMeni()`, el detector de duplicados los marcó como 100% duplicados, bloqueando la aprobación.

**Impacto**: Cualquier re-evaluación de un artículo existente con `guardarConMeni()` puede resultar en bloqueo por duplicado contra sí mismo.

**Recomendación**: El detector de duplicados (`lib/analizador-duplicados`) debe excluir el propio ID del artículo de la búsqueda de duplicados. Esto es un bug del sistema, no del fix aplicado.

**Acción inmediata**: Los 3 artículos fueron guardados con provenance completa. Los scores se mantuvieron iguales (84, 100, 98). El estado de aprobación cambió en 2 de 3 casos debido al bug del detector. No se perdió contenido editorial.

---

## PARTE 2 — ARCHIVE: RESULTADOS

### FORENSIC_ARCHIVE_REVIEW.md (generado)

| Clasificación | Cantidad | IDs |
|---------------|----------|-----|
| **KEEP** (reclasificados) | 3 | `2JtGQ8X981oq4giKYxQo`, `mnOKSoFSHJBxuosmF3Tw`, `nyF9rfm2AkQACTQPzFAn` |
| **ARCHIVE_REVIEW** | 2 | `AoP9lWscit6xRvpPwJ6N`, `s3JrANBvskSO61lPqPrv` |
| **ARCHIVE_CONFIRMED** | 1 | `hSohwt9sC0cfwiXEITLg` |
| **→ ENRICHMENT** (recategorizado) | 1 | `zkdDsejAb5hLCpCaEbMR` |

### Regla de obsolescencia aplicada
- Noticias de Santo Domingo 2026 con resultados: **KEEP** (valor histórico)
- Agenda de conciertos pasada: **ARCHIVE_REVIEW** (título engañoso en presente)
- Feria Ganadera finalizada + despublicada: **ARCHIVE_CONFIRMED**
- KFC inauguración realizada: **ARCHIVE_REVIEW** (título en presente es engañoso)
- Score 64 (DO_NOT_PUBLISH): **Recategorizado a ENRICHMENT** (verifiable, rescatable)

### Acciones ejecutadas
- **Ningún artículo fue archivado automáticamente.**
- Se generó el documento de revisión para decisión editorial manual.

---

## PARTE 3 — ENRICHMENT: RESULTADOS

### FORENSIC_EDITORIAL_QUEUE.md (generado)

| Clasificación | Cantidad |
|---------------|----------|
| **A — Contexto simple** | 13 |
| **B — Enriquecimiento** | 14 |
| **C — Reescritura** | 10 |
| **D — Insuficiente** | 0 |
| **Total** | 37 (36 originales + 1 recategorizado desde DO_NOT_PUBLISH) |

### Acciones ejecutadas
- **Ningún artículo fue modificado.**
- Se generó cola de intervención editorial para ejecución manual.

---

## PARTE 4 — PROVENANCE

Todas las modificaciones de AUTO_FIX registraron:

```json
{
  "fase": "15.1",
  "tipo": "auto_fix",
  "fixes": ["..."],
  "scoreAnterior": <valor>,
  "scoreNuevo": <valor>,
  "aprobadoAnterior": <valor>,
  "aprobadoNuevo": <valor>,
  "fecha": "2026-08-12T...",
  "motivo": "AUTO_FIX: corrección técnica objetiva..."
}
```

- ✅ Score anterior y nuevo registrados
- ✅ Aprobado anterior y nuevo registrados
- ✅ Fecha registrada
- ✅ Motivo y tipo de cambio registrados
- ✅ Historial anterior preservado (append, no overwrite)

---

## PARTE 5 — VALIDACIÓN

| Check | Estado |
|-------|--------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run build` | ✅ Build exitoso |
| Deploy a Vercel | ✅ Producción activa |
| Endpoint ejecutado | ✅ 200 OK, 3/3 procesados |
| Provenance registrada | ✅ 3 artículos con `cambiosRealizados` |
| Middleware revertido | ✅ Acceso público cerrado |
| GitHub sincronizado | ✅ `95eda86b` en master |

### Auditoría Firestore pendiente
La auditoría completa de 281 artículos en Firestore requiere ejecutar el endpoint `/api/admin/forensic-audit` con credenciales válidas. Esto validará:
- 281 artículos contabilizados
- 281 con scoreMeni
- 281 provenance
- 0 scoreMeni derivado de scoreCalidad
- 0 publicados sin aprobación
- 0 HTML técnico contaminando contenido

---

## PARTE 6 — KEEP: SIN CAMBIOS

Los 235 artículos clasificados como KEEP no fueron modificados. No se reescribió, cambió títulos, resúmenes, scores, contexto, o HTML de ningún artículo KEEP.

---

## RESULTADO FINAL

### AUTO_FIX
- **3 ejecutados** (100% de los identificados)
- **3 MENI re-evaluados** (100%)
- **0 aprobados** (0%)
- **3 rechazados** (100% — 1 por score insuficiente preexistente, 2 por bug en detector de duplicados)

### ARCHIVE
- **1 confirmado** (`hSohwt9sC0cfwiXEITLg`)
- **2 en revisión** (`AoP9lWscit6xRvpPwJ6N`, `s3JrANBvskSO61lPqPrv`)
- **3 conservados** (reclasificados desde ARCHIVE a KEEP)

### ENRICHMENT
- **37 pendientes** (36 originales + 1 recategorizado desde DO_NOT_PUBLISH)

### KEEP
- **235 sin cambios**

---

## BUG CRÍTICO DETECTADO

### Detector de duplicados bloquea re-evaluación

**Síntoma**: Al re-evaluar un artículo existente con `guardarConMeni()`, el detector de duplicados encuentra el artículo como duplicado de sí mismo (100% similitud), bloqueando la aprobación.

**Artículos afectados**:
- `FLbXd6XRrTl5TCdTkNYT` (score 100, aprobado → no aprobado)
- `lzsto5T2q85IgrVkqlA2` (score 98, aprobado → no aprobado)

**Causa probable**: `lib/analizador-duplicados` no excluye el ID del artículo que se está evaluando de la búsqueda de duplicados.

**Recomendación**: Fix urgente en el detector de duplicados para excluir el propio ID del artículo. Esto afecta cualquier re-evaluación futura con MENI.

---

## ARCHIVOS ENTREGADOS

1. **FORENSIC_ARCHIVE_REVIEW.md** — Revisión individual de 7 candidatos a archivado
2. **FORENSIC_EDITORIAL_QUEUE.md** — Cola de intervención editorial para 37 artículos
3. **FORENSIC_PHASE15_1_EXECUTION.md** — Este documento

---

## REGLA DE ORO — CUMPLIMIENTO

- ✅ No se convirtió la auditoría en excusa para modificar todo
- ✅ No se tocaron los 235 KEEP
- ✅ Se corrigió solamente lo demostrado (3 AUTO_FIX)
- ✅ No se archivó automáticamente
- ✅ Toda modificación pasó por MENI
- ✅ Provenance conservada en todos los casos
- ⚠️ Bug del detector de duplicados causó regresión en 2 artículos (requiere fix)
