# CONFIDENCE POLICY ANALYSIS — retrospectivo sobre 10 noticias reales

Fecha: 2026-09-25 · Fase 5 · OBJETIVO 5
**Estado: análisis documental. NO se cambia la política de producción en esta fase.**

## Qué es `confianza` hoy

El campo `confianza` en `noticias` es un objeto producido por un analizador de
afirmaciones/atribuciones (visible en todos los docs de la muestra):

```json
{
  "nivel": "ALTA|BAJA",
  "resumen": "N afirmaciones | M atribuidas | X sin confirmar | ... | fuentes: K",
  "requiereRevisionHumana": bool,
  "riesgos": [...], "factores": [...], "queFalta": [...], "fuentes": [...]
}
```

**Efecto actual: ninguno sobre la decisión de publicación.**
`requiereRevisionHumana:true` convive con `publicado:true`. El campo es
**OBSERVATIONAL_ONLY** — se escribe, se muestra, nadie lo consume.

## Retrospectivo: ¿qué habría pasado si BAJA → REVIEW_REQUIRED?

| Story | ID | nivel | revHum | verdict real | si BAJA→REVIEW |
|---|---|---|---|---|---|
| S1 accidente autobús | gh7lOQJo | **BAJA** | true | PUBLICAR | → revisión |
| S2 niña atropellada | eA53ptkM | ALTA | false | PUBLICAR | publica |
| S3 La Mascota | pAv7atGx | ALTA | false | PUBLICAR | publica |
| S4 controles viales | AQiSAE7C | ALTA | false | PUBLICAR | publica |
| S5 3 nicas EE.UU. | gPe3e3k6 | ALTA* | false | PUBLICAR_CON_CAMBIOS | publica |
| S6 tribunal migrantes | 51OIyVo7 | ALTA | false | PUBLICAR | publica |
| S7 Nisi Blass bronce | gE9P2rHV | ALTA | false | PUBLICAR | publica |
| S8 Pedro Dixon | EzMFBmEb | **BAJA** | true | PUBLICAR | → revisión |
| S9 **iPhone Duo** | ioylw52H | **ALTA*** | false | PUBLICAR_CON_CAMBIOS | **publica** |
| S10 Meta gafas | d1JwxltR | ALTA | false | PUBLICAR | publica |

*S5 y S9 tienen `factores:["SOURCE_MISSING"]` pero nivel ALTA — el factor existe
y no afecta el nivel.

## Análisis por caso

### S1 (BAJA → habría ido a revisión)
23 afirmaciones, solo 1 atribuida, 2 provisional-sin-fuente, 0 fuentes.
La nota era **editorialmente correcta** (accidente real, cifras del MINSA).
BAJA→REVIEW habría sido un **falso positivo de la política** — pero un falso
positivo *informativo*: la nota realmente tenía atribución débil persistida
(`fuente` genérica, `fuentesComplementarias:[]`).

### S8 (BAJA → habría ido a revisión)
Obituario sin causa de muerte ni fuente (SOURCE_MISSING + PROVISIONAL_CLAIM).
Revisión era **editorialmente razonable** — faltaba un dato material.
Esta habría sido una captura correcta (verdadero positivo).

### S9 iPhone Duo (ALTA → habría publicado igual)
40 afirmaciones, 4 "atribuidas" — pero `fuentes:[]`. El contador de
atribuciones cuenta *frases atributivas en el texto*, no fuentes reales:
el texto fabricado incluía lenguaje de atribución sin respaldo.
**BAJA→REVIEW no habría capturado el peor falso positivo del corpus.**
Lo que lo captura es la barrera de la Fase 5 (artefacto IA + afirmación
extraordinaria + entidad sin evidencia), no el nivel de confianza.

### S10 Meta (ALTA → publica)
Specs detalladas sin fuentes (`fuentes:[]`, 2 atribuidas de 39).
El nivel ALTA con 0 fuentes muestra que `confianza` no mide factualidad
real — mide *forma* de atribución.

## Conclusión del retrospectivo

| Hipótesis de política | Resultado |
|---|---|
| BAJA → REVIEW_REQUIRED bloquea basura | Captura S8 ✓, castiga S1 (FP parcial), **no captura S9** |
| BAJA es proxy de riesgo factual | **Falso** — S9 fue ALTA siendo fabricado |
| `confianza` mide atribución real | **No** — cuenta frases, no fuentes (`fuentes:[]` en 7/10 con ALTA) |

## Recomendación (documental, no implementada)

1. **No usar `nivel:BAJA` como gate de publicación.** Su tasa de falsos
   negativos contra el peor caso real (S9) es total, y genera falsos
   positivos sobre noticias correctas con atribución débil (S1).
2. Usar `factores` y `queFalta` como **señales** que alimenten la decisión
   del Supervisor (dominio FACTUALIDAD), no como bloqueo propio.
3. La barrera real contra fabricación es la combinación:
   `AI_PROVENANCE_ARTIFACT` + `EXTRAORDINARY_UNSOURCED_CLAIM` +
   `UNEVIDENCED_ENTITY` (implementada en `lib/editorial/factuality-signals.ts`
   en esta fase), que mira *evidencia disponible*, no forma del texto.
4. `requiereRevisionHumana` necesita un consumidor real o debe dejar de
   fingir que existe — decisión pendiente del humano.

## Decisión requerida

- ¿BAJA + `requiereRevisionHumana:true` debe añadirse como señal IMPORTANT al
  Supervisor (INVESTIGAR_MAS), mantenerse observacional, o eliminarse?
- ¿`fuentes:[]` en un artículo con afirmaciones materiales debe contar como
  evidencia negativa en la barrera factual? (actualmente `fuentesComplementarias`
  es el input — ambos suelen estar vacíos en la práctica).
