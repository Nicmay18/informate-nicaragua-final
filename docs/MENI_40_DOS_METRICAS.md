# MENI 4.0 — Las dos métricas: score editorial y puntosPerdidos

Documento de referencia sobre por qué MENI 4.0 mantiene, temporalmente,
dos métricas numéricas que no son intercambiables y cómo se evita que
contradigan el veredicto final.

## 1. Qué mide cada métrica

### Score editorial (ADN — `editorialDna.adnNI` → `scoreFinal`)

Mide la **calidad editorial integrada** de la nota, 0–100. Es la métrica
de decisión: alimenta `scoreFinal` y el veredicto ejecutivo.

Se calcula ponderando las dimensiones del DNA editorial (precisión
informativa, exclusividad/contexto, claridad, valor para el lector,
transcripción/originalidad, SEO, EEAT) con los pesos del perfil de
categoría activo (Sucesos, Nacional, Deportes, etc.).

Contesta la pregunta: *¿qué tan buena es esta pieza como periodismo?*

### `puntosPerdidos`

Es un **desglose diagnóstico** de conceptos y acciones que explican las
deducciones: elementos del contrato de categoría no cumplidos, preguntas
del lector sin respuesta, observaciones de los motores. En MENI 4.0 se
deduplica por concepto (`dedupeCriteria`) — antes una misma omisión
podía aparecer hasta 11 veces.

Contesta la pregunta: *¿qué le falta o qué puede mejorar esta nota?*

## 2. Por qué no son intercambiables

- El score responde una **evaluación agregada**; `puntosPerdidos` es una
  **lista de hallazgos**, no un porcentaje. 20 puntos perdidos no implica
  score 80: el score se deriva de las dimensiones del DNA, no restando
  el checklist.
- Un hallazgo puede costar poco score pero ser importante para el editor
  (p. ej. una fuente imprecisa que conviene verificar).
- La suma de `puntosPerdidos` nunca debe leerse como "la nota vale 100−X".

## 3. Quién decide la publicación

**Ni el score ni `puntosPerdidos` deciden solos.** La autoridad final es
`reconcileMeniResult` (`lib/meni/result-consistency.ts`), que reconcilia:

1. **Señales factuales CRITICAL** (contradicciones demostradas, p. ej.
   marcador del titular incompatible con el acta citada) → `BLOQUEAR`,
   `aprobado=false`, sin importar el score. Un score alto nunca compensa
   un bloqueante factual.
2. **Señales IMPORTANT** (falta de atribución, discrepancia de resultado,
   evidencia insuficiente) → `REVISAR`: impide la recomendación
   incondicional de publicar, pero no demuestra falsedad.
3. **Score ≥ 90** sin bloqueos → `APROBADO`/`PUBLICAR`.
4. Observaciones de estilo → `SUGERENCIA`: visibles al editor, no afectan
   el veredicto.

Así, una nota puede tener score 92 y `NO_PUBLICAR` (contradicción
factual grave), o score 83 y `REVISAR` (copia expresiva sustancial de la
fuente). No hay contradicción: el score mide calidad, el veredicto mide
riesgo de publicación, y la reconciliación garantiza una sola salida
coherente (`aprobado`, `estadoFinal`, `calificacion`, `riesgo`).

## 4. Decisión conservada (temporal)

Se mantienen ambas métricas visibles porque cumplen funciones distintas:
el score para la decisión automática, `puntosPerdidos` como checklist
accionable para el periodista. Una consolidación futura (p. ej. derivar
`puntosPerdidos` directamente del desglose del DNA) requiere tests de
equivalencia y no se hará sin demostrar que no pierde información.
