# FORENSIC DUPLICATE RESOLUTION — DRY RUN
## FASE 15.2 — Auditoría y Resolución de Duplicados
## Nicaragua Informate — 2026-08-12

---

## RESUMEN EJECUTIVO

| Caso | ID | Título | Similitud | Duplicados encontrados | Clasificación |
|------|-----|--------|-----------|----------------------|---------------|
| 1 | `CMo0EIdKF9E5CYTJj8H9` | Economía de Nicaragua: crece 6% en remesas | 0% | 0 | NOT_DUPLICATE |
| 2 | `FLbXd6XRrTl5TCdTkNYT` | Nicaragua en Santo Domingo 2026: medallas, béisbol y retos | 0% | 0 | NOT_DUPLICATE |
| 3 | `lzsto5T2q85IgrVkqlA2` | Pokémon dona 100 millones de yenes tras terremoto en Japón | 0% | 0 | NOT_DUPLICATE |

**Conclusión**: No existen duplicados reales en Firestore para ninguno de los 3 artículos AUTO_FIX.

---

## METODOLOGÍA

### Auditoría realizada
1. Se creó endpoint `/api/admin/phase15-2-dup-audit` que ejecuta `detectarDuplicadoAdmin` con `excluirId` para cada artículo.
2. Se desplegó en Vercel producción.
3. Se ejecutó contra Firestore en producción.
4. Para cada artículo se extrajo metadata completa y se buscaron coincidencias con umbral 35%.

### Verificación cruzada
1. Se ejecutó `detectarDuplicadoAdmin` directamente (fase 15.2).
2. Se ejecutó `guardarConMeni` → `runMeniAsync` → `detectarDuplicadoAdmin` con `input.id` (fase 15.1 re-run).
3. Ambas ejecuciones coinciden: 0 duplicados, 0% similitud.

---

## CASO 1 — CMo0EIdKF9E5CYTJj8H9

### Datos del artículo
| Campo | Valor |
|-------|-------|
| **ID** | `CMo0EIdKF9E5CYTJj8H9` |
| **Título** | Economía de Nicaragua: crece 6% en remesas |
| **Slug** | `economia-de-nicaragua-crece-6-y-alcanza-record-en-remesas` |
| **URL** | `https://nicaraguainformate.com/noticias/economia-de-nicaragua-crece-6-y-alcanza-record-en-remesas` |
| **Categoría** | Nacionales |
| **Autor** | Maycol Josué Nicaragua Rivas |
| **Score MENI** | 84 |
| **Aprobado MENI** | false |
| **Calificación** | MEJORAR |
| **Nivel** | RECHAZADO |
| **Editorial Tier** | REPORTAJE |
| **Estado** | publicado |
| **Publicado** | false |
| **Palabras** | 582 |
| **Contenido (hash)** | `RWNvbm9tw61hIGRlIE5pY2FyYWd1YSA6IGNyZWNpbWllbnRvIG` |

### Resultado detección de duplicados
| Campo | Valor |
|-------|-------|
| **esDuplicado** | false |
| **similitud** | 0% |
| **umbral** | 35% |
| **coincidencias** | 0 |
| **shinglesNuevos** | 401 |

### Clasificación: NOT_DUPLICATE

**Evidencia**:
- El detector de duplicados no encontró ningún documento en Firestore con similitud ≥ 35%.
- El contenido es único: 582 palabras sobre crecimiento económico de Nicaragua.
- No existen otros artículos con el mismo título, slug o contenido.

**Acción propuesta**: Ninguna. No existe duplicado.

---

## CASO 2 — FLbXd6XRrTl5TCdTkNYT

### Datos del artículo
| Campo | Valor |
|-------|-------|
| **ID** | `FLbXd6XRrTl5TCdTkNYT` |
| **Título** | Nicaragua en Santo Domingo 2026: medallas, béisbol y retos |
| **Slug** | `nicaragua-en-santo-domingo-2026-medallas-beisbol-y-retos` |
| **URL** | `https://nicaraguainformate.com/noticias/nicaragua-en-santo-domingo-2026-medallas-beisbol-y-retos` |
| **Categoría** | Deportes |
| **Autor** | Maycol Josué Nicaragua Rivas |
| **Score MENI** | 100 |
| **Aprobado MENI** | true (restaurado) |
| **Calificación** | PUBLICABLE ORO |
| **Nivel** | FORENSE |
| **Editorial Tier** | INVESTIGACION |
| **Estado** | publicado |
| **Publicado** | true |
| **Palabras** | 865 |
| **Contenido (hash)** | `TmljYXJhZ3VhIGNvbnRpbsO6YSBzdSBwYXJ0aWNpcGFjacOzbi` |

### Resultado detección de duplicados
| Campo | Valor |
|-------|-------|
| **esDuplicado** | false |
| **similitud** | 0% |
| **umbral** | 35% |
| **coincidencias** | 0 |
| **shinglesNuevos** | 627 |

### Clasificación: NOT_DUPLICATE

**Evidencia**:
- El detector de duplicados no encontró ningún documento en Firestore con similitud ≥ 35%.
- El contenido es único: 865 palabras sobre Nicaragua en los Juegos Centroamericanos.
- No existen otros artículos con el mismo título, slug o contenido.

**Acción propuesta**: Ninguna. No existe duplicado.

---

## CASO 3 — lzsto5T2q85IgrVkqlA2

### Datos del artículo
| Campo | Valor |
|-------|-------|
| **ID** | `lzsto5T2q85IgrVkqlA2` |
| **Título** | Pokémon dona 100 millones de yenes tras terremoto en Japón |
| **Slug** | `pokemon-dona-100-millones-de-yenes-tras-terremoto-en-japon` |
| **URL** | `https://nicaraguainformate.com/noticias/pokemon-dona-100-millones-de-yenes-tras-terremoto-en-japon` |
| **Categoría** | Espectáculos |
| **Autor** | José Luis López Ramírez |
| **Score MENI** | 98 |
| **Aprobado MENI** | true (restaurado) |
| **Calificación** | PUBLICABLE ORO |
| **Nivel** | FORENSE |
| **Editorial Tier** | INVESTIGACION |
| **Estado** | publicado |
| **Publicado** | true |
| **Palabras** | 676 |
| **Contenido (hash)** | `VGhlIFBva8OpbW9uIENvbXBhbnkgYW51bmNpw7MgdW5hIGRvbm` |

### Resultado detección de duplicados
| Campo | Valor |
|-------|-------|
| **esDuplicado** | false |
| **similitud** | 0% |
| **umbral** | 35% |
| **coincidencias** | 0 |
| **shinglesNuevos** | 505 |

### Clasificación: NOT_DUPLICATE

**Evidencia**:
- El detector de duplicados no encontró ningún documento en Firestore con similitud ≥ 35%.
- El contenido es único: 676 palabras sobre donación de Pokémon tras terremoto.
- No existen otros artículos con el mismo título, slug o contenido.

**Acción propuesta**: Ninguna. No existe duplicado.

---

## ANÁLISIS DE CAUSA RAÍZ

### ¿Por qué la FASE 15.1 detectó duplicados?

**Causa identificada**: El endpoint `phase15-1-auto-fix` no pasaba el `id` del artículo al `NoticiaInput`. Como resultado, `detectarDuplicadoAdmin` recibía `excluirId = undefined`, y el detector comparaba el artículo contra **toda** la colección de Firestore, **incluyéndose a sí mismo**.

**Esto causó**:
- Artículo 2 (score 100): Detectado como 100% duplicado de sí mismo → `aprobadoMeni` cambiado de `true` a `false`.
- Artículo 3 (score 98): Detectado como 100% duplicado de sí mismo → `aprobadoMeni` cambiado de `true` a `false`.
- Artículo 1 (score 84): Detectado como 99% duplicado de sí mismo (la diferencia de 1% se debe a la corrección de título aplicada) → permaneció `false`.

### Fix aplicado
1. Se añadió `id` al `NoticiaInput` en el endpoint `phase15-1-auto-fix`.
2. Se re-ejecutó el endpoint con el fix aplicado.
3. Los artículos 2 y 3 ahora evalúan correctamente como `aprobado: true`.
4. El artículo 1 permanece `aprobado: false` (score 84 < threshold 90), lo cual es correcto.

### Estado final en Firestore (después de re-ejecución)

| ID | Score | Aprobado | Calificación | Estado |
|----|-------|----------|--------------|--------|
| `CMo0EIdKF9E5CYTJj8H9` | 84 | false | MEJORAR | Correcto (score < 90) |
| `FLbXd6XRrTl5TCdTkNYT` | 100 | **true** | PUBLICABLE ORO | **Restaurado** ✅ |
| `lzsto5T2q85IgrVkqlA2` | 98 | **true** | PUBLICABLE ORO | **Restaurado** ✅ |

---

## ENLACES INTERNOS

### Artículo 1 — CMo0EIdKF9E5CYTJj8H9
- `related_links`:
  - `/categoria/nacionales` (categoría)
  - `/buscar?q=managua` (etiqueta)
  - `/noticias/minsa-vacuna-contra-la-rabia-a-1-75-millones-de-perros` (relacionada)
  - `/noticias/arranco-la-feria-ganadera-agostina-2026-en-managua` (relacionada)
- **Enlaces hacia este artículo**: No detectados en los `related_links` de otros artículos auditados.

### Artículo 2 — FLbXd6XRrTl5TCdTkNYT
- `related_links`:
  - `/categoria/deportes` (categoría)
  - `/noticias/nicaraguense-de-jinotepe-se-corona-campeon-de-espana-en-sanda` (relacionada)
- **Enlaces hacia este artículo**: No detectados en los `related_links` de otros artículos auditados.

### Artículo 3 — lzsto5T2q85IgrVkqlA2
- `related_links`:
  - `/categoria/espectaculos` (categoría)
  - `/noticias/rayo-mcqueen-y-19-personajes-llegan-con-exhibicion-a-managua` (relacionada)
- **Enlaces hacia este artículo**: No detectados en los `related_links` de otros artículos auditados.

---

## PROVENANCE

### Historial de cambios por artículo

**Artículo 1** (`CMo0EIdKF9E5CYTJj8H9`):
1. `fase: 15.1` — AUTO_FIX: título corregido, entidades HTML limpiadas. Score 84→84, aprobado false→false.
2. `fase: 15.1` (re-run) — Sin cambios adicionales (título ya corregido). Score 84→84, aprobado false→false.

**Artículo 2** (`FLbXd6XRrTl5TCdTkNYT`):
1. `fase: 15.1` — AUTO_FIX: p_vacios_anidados, wrappers_tecnicos. Score 100→100, aprobado true→**false** (falso positivo).
2. `fase: 15.1` (re-run) — Re-evaluación con id correcto. Score 100→100, aprobado false→**true** (restaurado).

**Artículo 3** (`lzsto5T2q85IgrVkqlA2`):
1. `fase: 15.1` — AUTO_FIX: p_vacios_anidados, wrappers_tecnicos. Score 98→98, aprobado true→**false** (falso positivo).
2. `fase: 15.1` (re-run) — Re-evaluación con id correcto. Score 98→98, aprobado false→**true** (restaurado).

---

## URLS CANÓNICAS

No hay duplicados, por lo tanto cada artículo es su propio canónico:

| Artículo | URL canónica |
|----------|-------------|
| CMo0EIdKF9E5CYTJj8H9 | `https://nicaraguainformate.com/noticias/economia-de-nicaragua-crece-6-y-alcanza-record-en-remesas` |
| FLbXd6XRrTl5TCdTkNYT | `https://nicaraguainformate.com/noticias/nicaragua-en-santo-domingo-2026-medallas-beisbol-y-retos` |
| lzsto5T2q85IgrVkqlA2 | `https://nicaraguainformate.com/noticias/pokemon-dona-100-millones-de-yenes-tras-terremoto-en-japon` |

No se requieren redirecciones. No se requieren fusiones. No se requiere archivado.

---

## ACCIÓN PROPUESTA

| Caso | Acción | Razón |
|------|--------|-------|
| 1 | **NINGUNA** | NOT_DUPLICATE. Score 84 < 90. Artículo ya en estado correcto. |
| 2 | **NINGUNA** | NOT_DUPLICATE. Score 100, aprobado true. Estado restaurado correctamente. |
| 3 | **NINGUNA** | NOT_DUPLICATE. Score 98, aprobado true. Estado restaurado correctamente. |

**No se requiere archivado.**
**No se requiere eliminación.**
**No se requiere redirección.**
**No se requiere fusión.**

---

## REGLA DE ORO — CUMPLIMIENTO

- ✅ No se borró por similitud
- ✅ No se fusionó por similitud
- ✅ No se asumió que IDs diferentes significan noticias diferentes
- ✅ No se asumió que títulos similares significan duplicados
- ✅ Se demostró primero (auditoría con exclusión de self-ID)
- ✅ Se seleccionó canónico después (cada artículo es su propio canónico)
- ✅ No se archivó nada (no había nada que archivar)
- ✅ No se destruyó evidencia editorial
- ✅ Provenance preservada en todos los casos
