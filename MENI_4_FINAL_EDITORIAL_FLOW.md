# MENI 4 Final — Flujo Editorial Unificado

Fecha: 2026-10-02
Alcance: consolidación de la experiencia editorial — UNA fuente de verdad para
hallazgos, severidades y decisión del Editor Jefe. Sin cerebros nuevos, sin capas
de reglas nuevas: se consolidó lo que ya existía.

## 1. Flujo real

```
PERIODISTA escribe
  → MENI evalúa (scorer V4 + Quality Gate + Forense + valorEditorial)
      cada deducción del scorer (EVIDENCIA_REQUERIDA, SIN_CITAS, …)
      se convierte en hallazgo RECOMMENDATION — nunca bloquea
  → Quality Gate: defectos mecánicos/estructura/integridad
      BLOCKER | WARNING | INFO (los únicos BLOCKER técnicos)
  → Duplicados (dos fases: metadatos → contenido solo de candidatos)
      DUPLICATE_CONTENT = BLOCKER si similitud > 55%
  → Factualidad + Confianza (guardarConMeni)
      señal CRITICAL → BLOCKER · IMPORTANT → WARNING (revisión, no bloqueo)
  → SUPERVISOR = Editor Jefe (veto: BLOQUEAR/NO_PUBLICAR siempre gana)
  → editorialVerdict: PUBLICAR | PUBLICAR_CON_CAMBIOS | REVISAR | BLOQUEAR
  → Publicación
```

## 2. Reglas de decisión (inequívocas)

| Estado | Condición |
|---|---|
| 🟢 PUBLICAR | 0 blockers, 0 warnings, MENI aprobado, Supervisor PUBLICAR |
| 🟡 PUBLICAR_CON_CAMBIOS | solo RECOMMENDATIONs/INFO (no impiden publicar) |
| 🟠 REVISAR | ≥1 WARNING, o score < umbral sin bloqueo duro, o Supervisor pide revisión |
| 🔴 BLOQUEAR | ≥1 BLOCKER, o veto del Supervisor (BLOQUEAR/NO_PUBLICAR/ARCHIVAR) |

**Regla de oro**: una RECOMMENDATION jamás impide publicar. Un WARNING exige
revisión humana, no reescritura. Solo BLOCKER bloquea.

## 3. Una sola fuente de verdad — `editorialVerdict`

`lib/meni/editorial-verdict.ts` consolida en `EditorialFinding`:

```ts
{ code, severity: BLOCKER|WARNING|RECOMMENDATION|INFO,
  module, title, description, howToFix, bloquea,
  location?: { parrafo, cita } }
```

El veredicto se construye en 3 etapas, todas sobre el mismo hallazgo unificado:

1. `evaluateMeni` → hallazgos de scorer (explainability), quality gate,
   blockingIssues, warnings, recomendaciones → veredicto provisional.
2. `runMeniAsync` → + hallazgo de duplicado → re-computa.
3. `guardarConMeni` → + factualidad + confianza + Supervisor →
   **veredicto final**, persistido en `noticias.editorVerdict` y adjunto
   a `meni_decision_log` vía el objeto MENI.

## 4. EVIDENCIA_REQUERIDA — corrección de experiencia

Las tres alertas (`cifras`, `quién lo dijo`, `qué cambia`) siguen saliendo de
`scorer.ts` vía `profile.requiredEvidence` y restan 3 pts **dentro del score**.
El cambio: ahora se clasifican como `RECOMMENDATION` con `bloquea: false` y la
UI las muestra como **"RECOMENDACIÓN — NO BLOQUEA PUBLICACIÓN"**. Ya no aparecen
en la lista de "acciones requeridas" del Editor Jefe como si fueran obligaciones.

## 5. MENI habla como editor

Cada hallazgo lleva: qué está mal (`title`), por qué (`description`), dónde
(`location.parrafo`/`location.cita`, localización por mejor esfuerzo sobre la
evidencia), cómo corregirlo (`howToFix`) y si es obligatorio (`bloquea`). Si el
sistema no puede proponer corrección segura, dice **VERIFICAR** — nunca inventa
fuentes, cifras, nombres, fechas ni citas.

Los `aciertos` (evidencias forenses OK: fecha, institución, ubicación, cifras)
se muestran aparte para que el periodista vea también lo que está bien.

## 6. Pipeline seguro de auto-corrección

`runMeni` ahora valida la auto-corrección mecánica:

```
texto original → evalúa (snapshot A)
              → autoCorrectNoticia propone correcciones
              → re-evalúa texto corregido (snapshot B)
              → si B introduce defectos mecánicos que A no tenía
                → REVERTIR a A y reportar; la corrección se descarta
```

Nunca más: texto → auto-corrección defectuosa → el detector encuentra su propio
defecto → bloqueo sin admisión de causa. Además, la memoria de defectos
auto-inducidos (`meni_false_positives`) sigue anotándose como WARNING contextual
— sin silenciar el Quality Gate.

## 7. Duplicados — dos fases, mismo resultado

`detectarDuplicadoAdmin` ya no descarga el HTML completo de hasta 2.000 notas:

- **Fase 1 (criba)**: lee solo `titulo, resumen, slug, estado` (~200-500 B/doc
  en vez de ~5-30 KB). Candidatos = metaScore ≥ 0.10, o top-10 con score > 0.
- **Fase 2 (confirmación)**: `getAll` de ≤ 20 candidatos; mismo Jaccard sobre
  `titulo+contenido` y mismo umbral que antes. Precisión final idéntica.

Lecturas por evaluación: iguales (~500-2000), **transferencia ~95% menor**.

## 8. Costos de tráfico admin

`/api/admin/traffic`: los agregados de 24h (horas, ventanas, fuentes) ahora se
sirven de un `unstable_cache` de 5 min (antes: hasta 5.000 docs por poll de 60s).
Lo vivo (realtime 15min + últimos eventos) sale de una lectura fresca de 200 docs.
Costo del polling: ~200 lecturas/min + scan amortizado, en vez del scan completo
por minuto. El panel no cambia visualmente; frescura de agregados ≤5 min.

## 9. Inventario de módulos

| Módulo | Clase | Rol |
|---|---|---|
| `lib/meni/core.ts` (evaluateMeni/runMeni/runMeniAsync) | ACTIVE | pipeline de evaluación |
| `lib/editorial/core/*` (pipeline V4, scorer, explainability) | ACTIVE | scoring + trazabilidad de deducciones |
| `lib/meni/quality-gate/*` | ACTIVE | defectos mecánicos/estructura/integridad |
| `lib/meni/editorial-verdict.ts` | ACTIVE | **única fuente de verdad de severidad/decisión** |
| `lib/editorial/factuality-signals.ts`, `lib/editorial/trust.ts` | ACTIVE | señales factuales y de confianza |
| `lib/supervisor/*` | ACTIVE | autoridad final de publicación |
| `lib/analizador-duplicados.ts` | ACTIVE | duplicados (2 fases) |
| `lib/meni/editorial-brain/*` | ACTIVE | recomendaciones editoriales de contexto |
| `lib/meni/editor-jefe/*` (correction-tracker) | MEMORY | aprendizaje de correcciones humanas |
| `lib/meni/learning-engine/*` | MEMORY | predicciones validadas, falsos positivos |
| `lib/meni/knowledge-base/*` | MEMORY | entidades/relaciones/timeline histórico |
| `lib/meni/editor-brain/*` | SUPPORT | cerebro editorial asíncrono (opcional) |
| `lib/meni/autocorrect.ts` | ACTIVE (mechanical-only + validado) | correcciones mecánicas inequívocas |
| `components/DeferredAnalytics.tsx`, `components/Analytics.tsx` | DEAD | sin consumidores (no montados) |

## 10. Matriz hallazgo → severidad → decisión

| Hallazgo | Origen | Severidad | Bloquea | Mensaje al periodista | Decisión |
|---|---|---|---|---|---|
| Defecto mecánico (CONCAT_MOTOCICLETA…) | quality-gate | BLOCKER | Sí | Qué + dónde + corrección | BLOQUEAR |
| Duplicado >55% | duplicados | BLOCKER | Sí | Similitud + nota coincidente | BLOQUEAR |
| Factualidad CRITICAL (extraordinaria sin fuente, artefacto IA) | factualidad | BLOCKER | Sí | Evidencia + VERIFICAR | BLOQUEAR |
| Veto Supervisor (BLOQUEAR/NO_PUBLICAR) | supervisor | BLOCKER | Sí | Razón del Supervisor | BLOQUEAR |
| Factualidad IMPORTANT (cifra sin atribución, atribución vaga) | factualidad | WARNING | No | Qué cifra + indicar fuente | REVISAR |
| Issues Supervisor (dominios no factuales) | supervisor | WARNING/REC | No | Problema + acción | REVISAR / P.C.C. |
| EVIDENCIA_REQUERIDA / deducciones scorer | score:modulo | RECOMMENDATION | **No** | Motivo + solución + "no impide publicar" | P.C.C. |
| Recomendaciones contextuales | editorial | RECOMMENDATION | No | Sugerencia concreta | P.C.C. |
| Issues QG severidad info | quality-gate | INFO | No | Contexto | PUBLICAR |

## 11. Filosofía

MENI protege exactitud, atribución, evidencia, claridad e integridad.
No es censor de estilo: una nota breve, sencilla y directa puede ser
válida. Si no hay problema real, la nota publica.
