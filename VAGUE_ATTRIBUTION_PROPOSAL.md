# VAGUE_ATTRIBUTION — Propuesta (NO implementada)

**Origen:** caso real `tres-dias-siete-muertos-el-saldo-de-los-accidentes-de-transito` — `confianza: BAJA`, `fuentes: []`, 48 afirmaciones/8 atribuidas, score 93 → PUBLICAR. `factuality.signals` vacío porque `ATTRIBUTION_RE` casa "de acuerdo con reportes de medios locales" → `hasAttribution=true` suprime todas las señales.

## A. Atribución CONCRETA (debe contar como evidencia)

Fuente identificable por nombre, institución o persona:

- `según la Policía Nacional` / `informó el Ministerio de Salud`
- `de acuerdo con el BCN` / `según INETER`
- `según declaraciones de Juan Pérez, alcalde de…`
- `reportó La Prensa` / `agencia EFE` / `según AP`
- `en un comunicado del MINSA` / `documento del INSS`
- `confirmó el juez…` / `dijo la fiscal…`

## B. Atribución VAGA (no debe satisfacer el gate sola)

Colectiva/anónima — no se puede verificar contra una fuente:

- `según medios locales` · `de acuerdo con reportes` · `según versiones`
- `trascendió` · `se conoció` · `se informó` · `fuentes cercanas` (sin nombre)
- `las autoridades` (sin institución) · `testigos` (sin nombre ni contexto)
- `reportes de medios` · `informaciones preliminares`

**Regla de conteo:** `hasConcreteAttribution = ATTRIBUTION_RE && ≥1 fuente nombrada (RE_FUENTE de trust.ts o nombre propio tras el marcador)`.

## C. Comportamiento propuesto (a decidir)

| Opción | Efecto | Riesgo |
|---|---|---|
| `BLOQUEAR` | señal CRITICAL → REVISION_HUMANA | Alto FP en agregados legítimos (sucesos compilados de varios medios) |
| `REQUIERE_REVISION` (INVESTIGAR_MAS) | IMPORTANT → Supervisor pide verificar antes de publicar | Medio — flujo ya existe |
| `DEGRADAR_SCORE` | −N puntos | Opaco, rompe determinismo del score |
| `SOLO_ADVERTIR` | warning en panel, sin gate | Cero riesgo, cero protección |

**Recomendación: REQUIERE_REVISION** combinado con `confianza` (ver abajo). SOLO_ADVERTIR como primera iteración si se quiere observar volumen antes de gating.

**Condición de disparo propuesta:** dispara SOLO si `hasAttribution=true` PERO `fuentes.size===0` Y hay ≥2 afirmaciones materiales sin fuente nombrada. No dispara en: notas de servicio/contexto propio, opinión, contenido oficial republicado con atribución institucional.

## D. Falsos positivos a probar antes de implementar

| Caso | Esperado |
|---|---|
| "según la Policía Nacional de Managua" | NO dispara (fuente concreta) |
| "informó el periodista Mario López de TN8" | NO dispara (periodista + medio) |
| "según EFE" / "agencia AFP" | NO dispara |
| Nota oficial MINSA republicada con cita institucional | NO dispara |
| "de acuerdo con reportes de medios locales" solo | DISPARA |
| "trascendió que…" sin más | DISPARA |
| Resumen de efemérides/contexto propio | NO dispara (no hay claims materiales nuevos) |

## E. `confianza` — diagnóstico y recomendación

**Cadena real:** `analyzeTrust` (`lib/editorial/trust.ts`) corre **post-guardado** en `guardar-directo` (~l.418) y `news/[id]` PUT — escribe `confianza{nivel,riesgos,factores,queFalta,requiereRevisionHumana}` en el doc. Quién lo lee: solo `app/api/admin/nota-trust` (diagnóstico). **Nadie lo consume en la decisión** — corre DESPUÉS de publicar, es anotación observacional.

**Recomendación: INTEGRATE.** `analyzeTrust` es determinista y rico (factores causales, provisionales sin fuente, contradicciones). Moverlo dentro de `guardarConMeni` (pre-Supervisor) y pasar a `makeEditorialDecision`:
- `factores` → señales `IMPORTANT` (SOURCE_MISSING, PROVISIONAL_CLAIM, CONTRADICTION→CRITICAL ya existe como INTERNAL_CONTRADICTION en factuality)
- `requiereRevisionHumana` → eleva a INVESTIGAR_MAS cuando hay material claims sin fuente nombrada

**No REMOVE** (tiene datos únicos que factuality-signals no cubre: provisionales, no-disponibles, queFalta accionable para el editor). **No KEEP-as-is** (huérfano = código que trabaja y nadie escucha).
