# AUDITORÍA FORENSE MENI / EDITOR IA — CAUSA RAÍZ

Fecha: 2026-10-10 · Rama: `master` · Estado: **LOCAL — sin commit, sin deploy**

## VEREDICTO

**CAUSA RAÍZ ENCONTRADA Y CORREGIDA.**

## CAUSA RAÍZ

`decideFromFindings` en `lib/meni/editorial-verdict.ts` degradaba **toda** nota con
cualquier hallazgo `RECOMMENDATION` a `PUBLICAR_CON_CAMBIOS`, sin distinguir si la
nota estaba aprobada (`aprobado=true`, score ≥ 90) o no.

Como el scorer emite deducciones prácticamente inevitables en cada nota —
`FALTAN_KEYWORDS` dispara en el 100 % de las notas porque la ruta
`POST /api/admin/news` nunca envía `palabrasClave`/`keywords` en `noticiaInput` —
toda nota aprobada recibía `PUBLICAR_CON_CAMBIOS`. El score ya incorporaba la
penalización (−2 pts); el veredicto la castigaba **dos veces**.

Resultado operativo: el estado `PUBLICAR` era inalcanzable salvo en el caso
imposible de cero deducciones; la redacción perseguía recomendaciones que no
podían satisfacerse (el campo keywords no existe en el input del editor) o que
eran opcionales por diseño.

## EVIDENCIA

### Producción (Firestore real, colección `noticias`)

| Nota | Score | aprobado | Veredicto persistido | Único hallazgo |
|---|---|---|---|---|
| Terremoto 7.6 Panamá (Internacionales) | 93 | true | PUBLICAR_CON_CAMBIOS | ANTI_CLICKBAIT + SUPERVISOR_TITULO |
| Final Pomares 2026 (Deportes) | 91 | true | PUBLICAR_CON_CAMBIOS | FALTAN_KEYWORDS |
| Inscripciones MINED (Nacionales) | 92 | true | PUBLICAR_CON_CAMBIOS | FALTAN_KEYWORDS + … |

`meni_decision_log` muestra la misma nota evaluada **6 veces consecutivas**
con `aprobado` alternando false→true — el ciclo corregir→evaluar→corregir.

### Traza local con 5 notas reales publicadas (golden set)

Antes del fix — todas aprobadas (score 90–93), todas `PUBLICAR_CON_CAMBIOS`
únicamente por `FALTAN_KEYWORDS`, `SIN_IMAGEN`*, `SIN_FECHA_PUBLICACION`*,
`AUTOR_GENERICO`, `ANTI_CLICKBAIT_TITULO`:

```
Espectáculos    score=90 ap=true → PUBLICAR_CON_CAMBIOS (3 recs)
Internacionales score=93 ap=true → PUBLICAR_CON_CAMBIOS (5 recs)
Deportes        score=90 ap=true → PUBLICAR_CON_CAMBIOS (4 recs)
Sucesos         score=92 ap=true → PUBLICAR_CON_CAMBIOS (4 recs)
Nacionales      score=92 ap=true → PUBLICAR_CON_CAMBIOS (4 recs)
```

\* `SIN_IMAGEN`/`SIN_FECHA` en la traza local son artefactos del input mínimo de
prueba (la ruta real sí envía `imagen`/`fecha`); `FALTAN_KEYWORDS` sí es real en
producción — confirmado en veredictos persistidos.

Después del fix — las mismas 5 notas, mismos hallazgos preservados:

```
Espectáculos    PUBLICAR(s=90,ap=true,b=0,w=0,r=3) | estable=true ×3
Internacionales PUBLICAR(s=93,ap=true,b=0,w=0,r=5) | estable=true ×3
Deportes        PUBLICAR(s=90,ap=true,b=0,w=0,r=4) | estable=true ×3
Sucesos         PUBLICAR(s=92,ap=true,b=0,w=0,r=4) | estable=true ×3
Nacionales      PUBLICAR(s=92,ap=true,b=0,w=0,r=4) | estable=true ×3
```

Las recomendaciones **no se ocultan**: siguen en `hallazgos` con severidad
`RECOMMENDATION` y `bloquea=false` — solo dejan de degradar el veredicto de una
nota ya aprobada.

## PIPELINE (antes)

```
input → pipelineV4 → scorer (tracer.sub → explainability)
      → Editorial Brain (12 motores → adnNI → scoreFinal)
      → buildEditorialVerdict:
          explainability → RECOMMENDATION
          acciones (!aprobado) → RECOMMENDATION
          antiClickbait advertencia → RECOMMENDATION
      → decideFromFindings:
          recs > 0 → PUBLICAR_CON_CAMBIOS   ← defecto, ignora `aprobado`
      → editorVerdict persistido → panel → editor itera 20–30 min
```

## DEFECTO

- `lib/meni/editorial-verdict.ts` → `decideFromFindings`, rama
  `counts.recommendations > 0` → `PUBLICAR_CON_CAMBIOS` incondicional,
  contradiciendo el propio contrato documentado ("una RECOMMENDATION jamás
  puede impedir publicación") y produciendo doble penalización
  (deducción en score + degradación de veredicto por la misma causa).

- Secundario documentado (no corregido, fuera del mínimo necesario):
  `FALTAN_KEYWORDS` es estructuralmente inevitable — `NoticiaInput` declara
  `palabrasClave`/`keywords`, pero `app/api/admin/news/route.ts` no los envía y
  el autocorrector solo los genera cuando `!aprobado`. La deducción (−2) es
  legítima como métrica; el problema era su conversión en veredicto amarillo.

## FIX

Cambio mínimo y estructural en `decideFromFindings`:

- `aprobado=true` + solo RECOMMENDATION/INFO → **PUBLICAR**
  (resumen reporta las sugerencias opcionales; `hallazgos` intactos).
- `aprobado=false` + RECOMMENDATIONs → **PUBLICAR_CON_CAMBIOS**
  (la nota realmente necesita cambios para llegar al umbral — semántica correcta).
- BLOCKER/veto Supervisor → BLOQUEAR; WARNING → REVISAR — sin cambios.
- 0 hallazgos → PUBLICAR (contrato 2.1.1-PROD preservado).

No se tocó ninguna regla de scoring, ningún threshold, ningún prompt, ningún
motor. Las recomendaciones se siguen generando, filtrando y mostrando igual.

## IMPACTO

- Nota aprobada (score ≥ 90, sin blockers/warnings) → `PUBLICAR`.
  Fin del ciclo evaluar→corregir→evaluar sobre notas que ya pasaban el gate.
- Nota bajo el umbral con recomendaciones accionables → `PUBLICAR_CON_CAMBIOS`
  (ahora el estado significa lo que dice: faltan cambios para aprobar).
- `aprobado=false` sigue rechazando a nivel API (`!meniOk` → 400) — la barrera
  de seguridad no cambia.

## TESTS

Antes → después:

- `aprobado:true` + 1 RECOMMENDATION → PCC → **PUBLICAR** (tests L, D2, matriz K,
  meni-repro-hoy TEST 8 actualizados al contrato corregido).
- `aprobado:false` + RECOMMENDATION → PCC → **PCC** (nuevo test L3).
- `aprobado:false` + 0 hallazgos + score válido → PUBLICAR (contrato preservado,
  nuevo test L4).
- BLOCKER → BLOQUEAR; WARNING → REVISAR; veto Supervisor → BLOQUEAR — intactos.

Resultados: `meni-editorial-verdict` 37/37, `meni-repro-hoy` 15/15,
`meni-gate-regression` + `pipeline-contracts` + `calibration` +
`adversarial-scoring-audit` + `quality-audit-corpus` 42/42. **94/94 verdes.**

## GOLDEN SET

5 notas reales publicadas en producción (Sucesos, Nacionales, Deportes,
Internacionales, Espectáculos), evaluadas con `runMeni` local:
antes 0/5 PUBLICAR → después 5/5 PUBLICAR, con sus sugerencias visibles.

## FALSOS POSITIVOS

- `PUBLICAR_CON_CAMBIOS` sobre nota aprobada: **5/5 antes → 0/5 después**.
- La deducción `FALTAN_KEYWORDS` sigue existiendo como hallazgo informativo
  (legítimo: el input sí carece de keywords); ya no produce falso "con cambios".

## FALSOS NEGATIVOS

- Nota deliberadamente incompleta ("Algo pasó", 1 línea, sin fuentes/H2/imagen):
  score 83, `aprobado=false` → `PUBLICAR_CON_CAMBIOS` + rechazo a nivel API.
  El gate sigue detectando contenido insuficiente.
- Defecto mecánico (`motocicletacicletas`) → BLOQUEAR — intacto.
- Afirmación extraordinaria sin fuente → BLOQUEAR — intacto.
- Cifra sin atribución (WARNING) → REVISAR — intacto.

## ESTABILIDAD

3 ejecuciones consecutivas por nota del golden set: idénticas
(decisión, score, counts). El evaluador es determinista (sin LLM en el veredicto);
el flapping `aprobado` observado en `meni_decision_log` responde a ediciones del
contenido entre intentos, no a no-determinismo.

## LIMITACIONES

- `FALTAN_KEYWORDS` sigue deduciendo 2 pts en SEO en toda nota porque el input
  del editor no incluye keywords. Es una deducción menor y ahora inofensiva para
  el veredicto; poblar `palabrasClave` en la ruta de guardado (o aceptar las
  auto-generadas como evidencia) es mejora futura, no requerida para esta causa.
- `acciones` del Editorial Brain usan plantillas genéricas por categoría (un
  obituario recibe preguntas de "¿cuánto cuesta asistir?"). Solo se muestran
  cuando `!aprobado`; revisar su pertinencia por tipo de nota es mejora futura.
- No se auditó el editor-autónomo (LLM) — el veredicto MENI es determinista y
  la causa raíz no involucra prompts ni modelos.
