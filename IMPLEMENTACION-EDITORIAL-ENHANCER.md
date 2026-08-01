# IMPLEMENTACIÓN EDITORIAL ENHANCER MENI

## Archivos creados

- `lib/editorial/enhancer/editorialEnhancer.ts` — módulo principal.
- `scripts/test-editorial-enhancer.ts` — prueba con 3 noticias reales.
- `IMPLEMENTACION-EDITORIAL-ENHANCER.md` — este documento.

## Archivos modificados

Ninguno. MENI, `runMeniAsync`, `autoCorrectNoticia`, Firebase, esquemas y panel quedan intactos.

## Principio fundamental

`editorialEnhancer` nunca evalúa cantidad de palabras. Evalúa si el contenido existente aporta información nueva, contexto, antecedentes, consecuencias, impacto e instituciones. Una noticia de 400 palabras puede estar lista si cumple con valor real; una noticia de 800 palabras puede necesitar cirugía si repite hechos sin contexto.

## Arquitectura

```
Noticia original
    ↓
MENI analiza
    ↓
editorialEnhancer recibe resultado MENI + noticia
    ↓
Genera recomendaciones editoriales
    ↓
Editor humano decide
    ↓
MENI vuelve a medir
```

## Módulo editorialEnhancer

Recibe:

```json
{
  "titulo": string,
  "contenido": string,
  "categoria": string,
  "meniResult": MeniResult
}
```

Devuelve:

```json
{
  "preguntasSinResponder": string[],
  "informacionFaltante": string[],
  "seccionesRecomendadas": string[],
  "oportunidadesValor": string[],
  "riesgosEditoriales": string[],
  "prioridad": "Alta" | "Media" | "Baja",
  "resumenEditor": string
}
```

## Reglas por categoría

| Categoría | Preguntas clave |
| ---- | ---- |
| Sucesos | Cronología, actuación de autoridades, contexto social, prevención, marco legal. |
| Nacionales | Impacto ciudadano, antecedentes, instituciones, datos comparativos. |
| Internacionales | Conexión con Nicaragua, impacto regional, contexto internacional. |
| Deportes | Trayectoria, importancia histórica, datos del protagonista, significado para Nicaragua. |
| Cultura | Historia, significado, contexto local. |
| Tecnología | Utilidad práctica, cambios para usuarios, impacto. |

## Pruebas ejecutadas

### Caso 1: investigan-ataque-en-el-riguero-que-hirio-a-nino-de-10-ano

- **Categoría:** Sucesos
- **Score MENI:** 100
- **Entrada MENI:** título, contenido, resumen, categoría y autor.
- **Diagnóstico MENI:** 🟢 Publicable AdSense

**Resultado del enhancer:**

```json
{
  "preguntasSinResponder": [
    "Falta investigar: ¿Qué ley o normativa aplica?",
    "Pregunta abierta de MENI: ¿Qué necesita saber el lector que no encontraría en otro medio?"
  ],
  "informacionFaltante": [
    "Falta conseguir: Norma aplicable"
  ],
  "seccionesRecomendadas": [
    "Marco legal"
  ],
  "oportunidadesValor": [
    "Contextualizar las consecuencias jurídicas"
  ],
  "riesgosEditoriales": [
    "Si se agrega esta sección, evitar: No interpretar la ley sin asesoría ni fuente",
    "Recomendación MENI: Conectores IA/repetitivos detectados"
  ],
  "prioridad": "Media",
  "resumenEditor": "La noticia \"Investigan ataque en El Riguero que hirió a niño de 10 año.\" responde 3 de 5 preguntas editoriales clave para la categoría Sucesos. Prioridad: Media. Hace falta: Falta conseguir: Norma aplicable."
}
```

### Caso 2: parque-de-la-familia-en-esteli-reabre-tras-millonaria-inversion

- **Categoría:** Nacionales
- **Score MENI:** 98
- **Entrada MENI:** título, contenido, resumen, categoría y autor.
- **Diagnóstico MENI:** 🟢 Publicable AdSense

**Resultado del enhancer:**

```json
{
  "preguntasSinResponder": [
    "Pregunta abierta de MENI: ¿Qué necesita saber el lector que no encontraría en otro medio?"
  ],
  "informacionFaltante": [],
  "seccionesRecomendadas": [],
  "oportunidadesValor": [],
  "riesgosEditoriales": [],
  "prioridad": "Media",
  "resumenEditor": "La noticia \"Parque de la Familia en Estelí reabre tras millonaria inversión\" responde 3 de 4 preguntas editoriales clave para la categoría Nacionales. Prioridad: Media. Hace falta: ."
}
```

### Caso 3: noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de

- **Categoría:** Deportes
- **Score MENI:** 100
- **Entrada MENI:** título, contenido, resumen, categoría y autor.
- **Diagnóstico MENI:** 🟢 Publicable AdSense

**Resultado del enhancer:**

```json
{
  "preguntasSinResponder": [
    "Pregunta abierta de MENI: ¿Qué necesita saber el lector que no encontraría en otro medio?"
  ],
  "informacionFaltante": [],
  "seccionesRecomendadas": [],
  "oportunidadesValor": [],
  "riesgosEditoriales": [],
  "prioridad": "Media",
  "resumenEditor": "La noticia \"Noruega vuelve a octavos del Mundial tras 28 años de ausencia\" responde 3 de 4 preguntas editoriales clave para la categoría Deportes. Prioridad: Media. Hace falta: ."
}
```


## Criterio de no invención

`editorialEnhancer` nunca dice "agregar más palabras" ni "ampliar a X palabras". Dice "falta investigar X", "falta conseguir Y" o "agregar antecedentes/impacto/instituciones". El periodista humano decide si la información existe y cómo integrarla.
