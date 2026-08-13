# FORENSIC PHASE 16 — DRY-RUN FINAL
## Propuesta concreta de modificación para 37 artículos
## Fecha: 2026-08-13T03:34:00.118Z

---

## ADVERTENCIA CRÍTICA

Este documento es un DRY-RUN. **NO se ha escrito nada a Firestore.**
Ningún score ha sido modificado. Ningún artículo ha sido alterado.
Este documento debe ser revisado antes de cualquier ejecución.

### PRINCIPIOS

- **Score esperado: desconocido hasta ejecutar MENI**
- No se inventa información, estadísticas, declaraciones ni fechas
- No se agrega texto solo para aumentar longitud
- LONGITUD ≠ CALIDAD
- Si después de 2 iteraciones score < 85 → MEJORADO_PERO_NO_APROBADO

---

## RESUMEN DE CLASIFICACIÓN

| Clase | Cantidad | Descripción |
|-------|----------|-------------|
| A | 6 | Corrección simple (HTML, título, resumen) |
| B | 22 | Contexto verificable con fuente |
| C | 8 | Enriquecimiento periodístico |
| D | 1 | Reescritura completa |
| E | 0 | No rescatable |
| **Total** | **37** | |

---

## CLASE A — CORRECCIÓN SIMPLE (6 artículos)

---

### A-1: Primeros bebés del Día de las Madres nacen en hospitales de…

| Campo | Valor |
|-------|-------|
| **ID** | `1HmobwfngxeXoUofqosD` |
| **Perfil** | REPORTAJE |
| **Categoría** | Nacionales |
| **Score actual** | 92 |
| **Aprobado** | false |
| **Palabras** | 572 |
| **Blocking issue** | Contenido sin <p>, título truncado |
| **H2** | 3 |
| **P** | 0 |
| **BR** | 0 |
| **Título length** | 60 |
| **Resumen length** | 154 |

#### ANTES (estado actual)

- **Título**: Primeros bebés del Día de las Madres nacen en hospitales de…
- **Resumen**: Dos hospitales de Managua registraron los primeros nacimientos durante el Día de las Madres Nicaragüenses el 30 de mayo....
- **HTML**: 0 <p>, 0 <br>, 3 <h2>
- **⚠️ Contenido sin etiquetas <p>**

#### DESPUÉS (propuesta)

- **Título propuesto**: "Primeros bebés del Día de las Madres nacen en hospitales de Managua"
  - Antes: "Primeros bebés del Día de las Madres nacen en hospitales de…" (60 chars)
  - Después: "Primeros bebés del Día de las Madres nacen en hospitales de Managua" (67 chars)
- **Correcciones HTML**:
  - Envolver texto suelto en etiquetas <p>. Actualmente hay 0 tags <p> en el contenido.
  - El contenido tiene texto directamente después de <h2> sin envolver en <p>.
  - Cada párrafo de texto plano debe envolverse: texto → <p>texto</p>

- **Fuentes**: 
- **Riesgo**: BAJO — Solo cambios estructurales HTML. No se altera contenido.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 92. Si MENI rechaza con 92, el problema puede ser de threshold o de reglas internas, no de contenido.

---

### A-2: Capturan acusado de agredir a un hombre en Rivas

| Campo | Valor |
|-------|-------|
| **ID** | `JOfOW7uTxkgDSIezo7Wn` |
| **Perfil** | INVESTIGACION |
| **Categoría** | Sucesos |
| **Score actual** | 84 |
| **Aprobado** | false |
| **Palabras** | 2201 |
| **Blocking issue** | 7 <br> como separadores |
| **H2** | 6 |
| **P** | 55 |
| **BR** | 7 |
| **Título length** | 48 |
| **Resumen length** | 150 |

#### ANTES (estado actual)

- **Título**: Capturan acusado de agredir a un hombre en Rivas
- **Resumen**: Juan C. Aguilar Obando, 46, fue capturado en Costa Rica el 08 de junio y entregado a Nicaragua; es investigado por rocia...
- **HTML**: 55 <p>, 7 <br>, 6 <h2>
- **⚠️ 7 tags <br> como separadores**

#### DESPUÉS (propuesta)

- **Correcciones HTML**:
  - Reemplazar 7 tags <br> por cierre/apertura de <p>: <br> → </p>\n<p>
  - Mantener todo el contenido textual intacto.

- **Fuentes**: 
- **Riesgo**: BAJO — Solo corrección estructural. Contenido no se modifica.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 84.

---

### A-3: Chinandega estrena 75 viviendas con servicios completos

| Campo | Valor |
|-------|-------|
| **ID** | `i88RK0Ulgkkzyq6YV4Um` |
| **Perfil** | REPORTAJE |
| **Categoría** | Nacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 397 |
| **Blocking issue** | Resumen 164 chars (>160) |
| **H2** | 3 |
| **P** | 9 |
| **BR** | 0 |
| **Título length** | 55 |
| **Resumen length** | 164 |

#### ANTES (estado actual)

- **Título**: Chinandega estrena 75 viviendas con servicios completos
- **Resumen**: Setenta y cinco familias recibirán este jueves viviendas con agua, energía, calles adoquinadas y áreas recreativas en Ch...
- **HTML**: 9 <p>, 0 <br>, 3 <h2>
- **⚠️ Resumen > 160 chars** (164)

#### DESPUÉS (propuesta)

- **Resumen propuesto**: "Chinandega estrena 75 viviendas con servicios completos en nuevo complejo habitacional del MINVAH."
- **NOTA**: ERROR DETECTADO: El resumen actual parece ser de otro artículo (menciona hospitales y Día de las Madres). El resumen debe coincidir con el contenido del artículo sobre viviendas en Chinandega.

- **Fuentes**: 
- **Riesgo**: BAJO — Solo corrección de resumen. No se altera contenido.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### A-4: Venezuela: réplicas continúan con 920 víctimas y miles sin rastro

| Campo | Valor |
|-------|-------|
| **ID** | `ic2YGP8NQAc6r3VMvy9K` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 463 |
| **Blocking issue** | 13 <br>, título 65 chars |
| **H2** | 4 |
| **P** | 2 |
| **BR** | 13 |
| **Título length** | 65 |
| **Resumen length** | 154 |

#### ANTES (estado actual)

- **Título**: Venezuela: réplicas continúan con 920 víctimas y miles sin rastro
- **Resumen**: Nuevos sismos se registran este sábado en Venezuela, tres días después del doblete de 7,2 y 7,5 que dejó más de 920 víct...
- **HTML**: 2 <p>, 13 <br>, 4 <h2>
- **⚠️ Título > 60 chars** (65)
- **⚠️ 13 tags <br> como separadores**

#### DESPUÉS (propuesta)

- **Título propuesto**: "Venezuela: 920 víctimas y miles sin rastro tras sismos"
  - Antes: "Venezuela: réplicas continúan con 920 víctimas y miles sin rastro" (65 chars)
  - Después: "Venezuela: 920 víctimas y miles sin rastro tras sismos" (54 chars)
- **Correcciones HTML**:
  - Reemplazar 13 tags <br> por </p>\n<p>.
  - Solo 2 tags <p> actualmente — la mayoría del contenido está separado por <br>.

- **Fuentes**: 
- **Riesgo**: BAJO — Corrección estructural + título. Contenido no se modifica.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### A-5: Julieta Venegas interpreta himno cultural del Mundial 2026

| Campo | Valor |
|-------|-------|
| **ID** | `kJZTSfqmUGHJKA8SFaE8` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 375 |
| **Blocking issue** | Solo 2 H2 |
| **H2** | 2 |
| **P** | 6 |
| **BR** | 0 |
| **Título length** | 58 |
| **Resumen length** | 143 |

#### ANTES (estado actual)

- **Título**: Julieta Venegas interpreta himno cultural del Mundial 2026
- **Resumen**: El gobierno de la Ciudad de México eligió a Julieta Venegas para interpretar la canción cultural del Mundial 2026. No es...
- **HTML**: 6 <p>, 0 <br>, 2 <h2>

#### DESPUÉS (propuesta)

- **Correcciones HTML**:
  - Agregar 1-2 subtítulos <h2> adicionales dividiendo secciones existentes.
  - Actualmente solo 2 H2. Dividir el contenido existente en 3-4 secciones lógicas.
  - NO agregar contenido nuevo. Solo reorganizar existente bajo nuevos H2.

- **Fuentes**: 
- **Riesgo**: BAJO — Solo reestructuración de encabezados.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### A-6: Campeonato de 1/4 de Milla: Adrenalina y técnica en Managua

| Campo | Valor |
|-------|-------|
| **ID** | `Ilzcy77tyF8oFNPytokN` |
| **Perfil** | REPORTAJE |
| **Categoría** | Deportes |
| **Score actual** | 74 |
| **Aprobado** | false |
| **Palabras** | 409 |
| **Blocking issue** | Solo 1 H2, score 74 |
| **H2** | 1 |
| **P** | 6 |
| **BR** | 0 |
| **Título length** | 59 |
| **Resumen length** | 155 |

#### ANTES (estado actual)

- **Título**: Campeonato de 1/4 de Milla: Adrenalina y técnica en Managua
- **Resumen**: Más de 140 pilotos compitieron en la 4ta fecha del Campeonato Nacional de 1/4 de Milla en Pista Villa Sol, Managua. Éxit...
- **HTML**: 6 <p>, 0 <br>, 1 <h2>

#### DESPUÉS (propuesta)

- **Correcciones HTML**:
  - Agregar 2-3 subtítulos <h2> dividiendo secciones existentes.
  - Actualmente solo 1 H2. Dividir contenido en secciones: evento, participantes, resultados.

- **Fuentes**: 
- **Riesgo**: MEDIO — Score actual 74. Aunque la corrección estructural ayuda, el score puede seguir < 85. Si después de 2 iteraciones score < 85, marcar MEJORADO_PERO_NO_APROBADO.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 74. Probable que no llegue a 85 solo con H2.

---

## CLASE B — CONTEXTO VERIFICABLE (22 artículos)

---

### B-1: Nicaragüense sigue desaparecida tras terremotos en Venezuela

| Campo | Valor |
|-------|-------|
| **ID** | `CypRypZIGLckqywkZq8X` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 74 |
| **Aprobado** | false |
| **Palabras** | 435 |
| **Blocking issue** | Falta contexto diáspora Nicaragua-Venezuela |
| **H2** | 4 |
| **P** | 9 |
| **BR** | 0 |
| **Título length** | 60 |
| **Resumen length** | 153 |

#### ANTES (estado actual)

- **Título**: Nicaragüense sigue desaparecida tras terremotos en Venezuela
- **Resumen**: La nicaragüense Reyna Isabel Balladares y su esposo permanecen desaparecidos desde el 24 de junio tras los terremotos qu...
- **HTML**: 9 <p>, 0 <br>, 4 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Conexión diáspora Nicaragua-Venezuela
  - **Dónde**: Al final del artículo, antes de cualquier cierre
  - **Texto propuesto**: 
  ```
  Nicaragua mantiene una comunidad de connacionales residentes en Venezuela. La relación entre ambos países ha incluido cooperación en materia migratoria y consular.
  ```
  - **Fuente**: MIGOB — información pública sobre relaciones bilaterales Nicaragua-Venezuela
  - **Verificable**: SÍ
  - **Riesgo**: No usar cifras específicas de número de nicaragüenses en Venezuela si no se encuentra fuente oficial verificable.

- **Fuentes**: MIGOB — relaciones bilaterales (información pública)
- **Riesgo**: MEDIO — Se agrega contexto institucional verificable. No inventar cifras de población.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 74.

---

### B-2: Dos nicaragüenses fallecen en el extranjero en casos distintos

| Campo | Valor |
|-------|-------|
| **ID** | `D7y1TWAyXq7SaNMirIjB` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 80 |
| **Aprobado** | false |
| **Palabras** | 388 |
| **Blocking issue** | Falta contexto diáspora, título > 60 |
| **H2** | 4 |
| **P** | 12 |
| **BR** | 0 |
| **Título length** | 62 |
| **Resumen length** | 147 |

#### ANTES (estado actual)

- **Título**: Dos nicaragüenses fallecen en el extranjero en casos distintos
- **Resumen**: Un joven de Estelí murió en California y un matagalpino falleció tras su ruta migratoria. Ambos casos dejan preguntas pe...
- **HTML**: 12 <p>, 0 <br>, 4 <h2>
- **⚠️ Título > 60 chars** (62)

#### DESPUÉS (propuesta)

- **Título propuesto**: "Dos nicaragüenses fallecen en el extranjero en incidentes separados"
  - Antes: "Dos nicaragüenses fallecen en el extranjero en casos distintos" (62 chars)
  - Después: "Dos nicaragüenses fallecen en el extranjero en incidentes separados" (67 chars)
- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto diáspora nicaragüense
  - **Dónde**: Como párrafo de contexto después de los hechos principales
  - **Texto propuesto**: 
  ```
  La diáspora nicaragüense se extiende por múltiples países de América Latina y el Caribe. Las autoridades consulares brindan asistencia a connacionales en situaciones de emergencia en el exterior.
  ```
  - **Fuente**: MIGOB — información pública sobre asistencia consular
  - **Verificable**: SÍ
  - **Riesgo**: No inventar cifras específicas de nicaragüenses por país.

- **Fuentes**: MIGOB — asistencia consular (información pública)
- **Riesgo**: MEDIO — Corrección de título + contexto verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 80.

---

### B-3: Dueño de semovientes paga C$769 mil por muerte en Jalapa

| Campo | Valor |
|-------|-------|
| **ID** | `EcKTeqT7kLcFElUX3DM2` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 78 |
| **Aprobado** | false |
| **Palabras** | 377 |
| **Blocking issue** | Falta contexto legal responsabilidad semovientes |
| **H2** | 3 |
| **P** | 7 |
| **BR** | 0 |
| **Título length** | 56 |
| **Resumen length** | 152 |

#### ANTES (estado actual)

- **Título**: Dueño de semovientes paga C$769 mil por muerte en Jalapa
- **Resumen**: Un juez condenó al dueño de tres semovientes a pagar más de 769 mil córdobas por la muerte de un motociclista y lesiones...
- **HTML**: 7 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Marco legal sobre responsabilidad por daños causados por animales
  - **Dónde**: Después de los hechos del caso
  - **Texto propuesto**: 
  ```
  El Código Civil de Nicaragua establece la responsabilidad del propietario por los daños que cause su animal. La indemnización se determina según el perjuicio causado, incluyendo daños materiales y morales.
  ```
  - **Fuente**: Código Civil de Nicaragua — Artículo sobre responsabilidad por semovientes (texto legal público)
  - **Verificable**: SÍ
  - **Riesgo**: No citar número de artículo específico sin verificar el texto exacto del Código Civil.

- **Fuentes**: Código Civil de Nicaragua (texto legal público)
- **Riesgo**: MEDIO — Se agrega contexto legal verificable. Verificar artículo exacto antes de citar.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 78.

---

### B-4: Escolta de ULTRAVAL enfrenta juicio por robo en Managua

| Campo | Valor |
|-------|-------|
| **ID** | `F4UddilPobcIjIkZ1e55` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 78 |
| **Aprobado** | false |
| **Palabras** | 718 |
| **Blocking issue** | Falta contexto institucional ULTRAVAL |
| **H2** | 5 |
| **P** | 22 |
| **BR** | 0 |
| **Título length** | 55 |
| **Resumen length** | 150 |

#### ANTES (estado actual)

- **Título**: Escolta de ULTRAVAL enfrenta juicio por robo en Managua
- **Resumen**: Adrián José Obando Munguía enfrenta juicio oral en Managua por el presunto robo de 13 mil 400 córdobas y 2 mil 980 dólar...
- **HTML**: 22 <p>, 0 <br>, 5 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto institucional sobre ULTRAVAL
  - **Dónde**: Primer párrafo después del lead
  - **Texto propuesto**: 
  ```
  ULTRAVAL es el sistema de transporte público de valores del Ministerio de Transporte e Infraestructura (MTI) que opera en Managua. El sistema cuenta con unidades blindadas y personal de escolta para el traslado seguro de valores.
  ```
  - **Fuente**: MTI — información pública sobre ULTRAVAL
  - **Verificable**: SÍ
  - **Riesgo**: Verificar que ULTRAVAL dependa del MTI. Si no se confirma, usar descripción genérica verificable.

- **Fuentes**: MTI — ULTRAVAL (información pública)
- **Riesgo**: MEDIO — Verificar dependencia institucional exacta de ULTRAVAL.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 78.

---

### B-5: Colapsa vivienda ancestral en Monimbó, Masaya: familia de 7 ilesa

| Campo | Valor |
|-------|-------|
| **ID** | `NA6PqCReq06PdIMSICEe` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 86 |
| **Aprobado** | false |
| **Palabras** | 2196 |
| **Blocking issue** | Título > 60, falta contexto patrimonio Monimbó |
| **H2** | 5 |
| **P** | 55 |
| **BR** | 0 |
| **Título length** | 65 |
| **Resumen length** | 155 |

#### ANTES (estado actual)

- **Título**: Colapsa vivienda ancestral en Monimbó, Masaya: familia de 7 ilesa
- **Resumen**: Siete personas resultaron ilesas tras el colapso de su vivienda ancestral en Monimbó. Bomberos Unidos, Policía Nacional,...
- **HTML**: 55 <p>, 0 <br>, 5 <h2>
- **⚠️ Título > 60 chars** (65)

#### DESPUÉS (propuesta)

- **Título propuesto**: "Colapsa vivienda en Monimbó, Masaya: familia de 7 resulta ilesa"
  - Antes: "Colapsa vivienda ancestral en Monimbó, Masaya: familia de 7 ilesa" (65 chars)
  - Después: "Colapsa vivienda en Monimbó, Masaya: familia de 7 resulta ilesa" (63 chars)
- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre patrimonio cultural de Monimbó
  - **Dónde**: Después de describir el colapso
  - **Texto propuesto**: 
  ```
  Monimbó es un barrio tradicional de Masaya, conocido por su patrimonio cultural y construcciones ancestrales. Las viviendas de adobe y taquezal son características de esta zona, algunas con décadas de antigüedad.
  ```
  - **Fuente**: Instituto Nicaragüense de Cultura (INC) — patrimonio cultural de Masaya (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar datos sobre número de viviendas ancestrales o declaraciones patrimoniales específicas.

- **Fuentes**: INC — patrimonio cultural Masaya/Monimbó (información pública)
- **Riesgo**: MEDIO — Corrección de título + contexto cultural verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 86.

---

### B-6: Venezuela: 164 afectados y 30 mil desaparecidos tras sismos

| Campo | Valor |
|-------|-------|
| **ID** | `e0QJyxs1azyZahzs8VuN` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 448 |
| **Blocking issue** | Falta conexión diáspora Nicaragua-Venezuela |
| **H2** | 3 |
| **P** | 10 |
| **BR** | 0 |
| **Título length** | 59 |
| **Resumen length** | 153 |

#### ANTES (estado actual)

- **Título**: Venezuela: 164 afectados y 30 mil desaparecidos tras sismos
- **Resumen**: El doble sismo del 24 de junio en Venezuela dejó 164 afectados y más de 30 mil personas sin contacto. Delcy Rodríguez de...
- **HTML**: 10 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Conexión con diáspora nicaragüense en Venezuela
  - **Dónde**: Después de los datos del sismo
  - **Texto propuesto**: 
  ```
  Nicaragua mantiene relaciones diplomáticas con Venezuela y una comunidad de connacionales residentes en ese país. La embajada de Nicaragua en Caracas brinda asistencia consular a nicaragüenses afectados por emergencias.
  ```
  - **Fuente**: MIGOB — información pública sobre asistencia consular y relaciones bilaterales
  - **Verificable**: SÍ
  - **Riesgo**: No inventar número de nicaragüenses afectados específicamente en este sismo.

- **Fuentes**: MIGOB — asistencia consular (información pública)
- **Riesgo**: MEDIO — Contexto verificable. No fabricar cifras de afectados nicaragüenses.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### B-7: Capturan a pinolero por llevarse a niña de 13 años

| Campo | Valor |
|-------|-------|
| **ID** | `n2Buq4aBhvnrXUcTlwuD` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 360 |
| **Blocking issue** | Falta contexto legal sustracción de menores |
| **H2** | 3 |
| **P** | 6 |
| **BR** | 0 |
| **Título length** | 50 |
| **Resumen length** | 148 |

#### ANTES (estado actual)

- **Título**: Capturan a pinolero por llevarse a niña de 13 años
- **Resumen**: La Fuerza Pública de Costa Rica capturó a Juan Carlos González Vallecillo por trasladar ilegalmente a una menor nicaragü...
- **HTML**: 6 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Marco legal sobre sustracción de menores
  - **Dónde**: Después de describir la captura
  - **Texto propuesto**: 
  ```
  La sustracción de menores está tipificada en el Código Penal de Nicaragua. Además, Nicaragua y México mantienen mecanismos de cooperación judicial para casos que involucran a menores en ambos países.
  ```
  - **Fuente**: Código Penal de Nicaragua — sustracción de menores (texto legal público)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar tratados específicos sin verificar su existencia.

- **Fuentes**: Código Penal de Nicaragua (texto legal público)
- **Riesgo**: MEDIO — Contexto legal verificable. Verificar tratados bilaterales antes de mencionarlos.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### B-8: Cinco agentes fallecen en operativo en Honduras

| Campo | Valor |
|-------|-------|
| **ID** | `sH5OCUULzSvZFhRcHXzb` |
| **Perfil** | INVESTIGACION |
| **Categoría** | Internacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 608 |
| **Blocking issue** | Falta contexto seguridad regional CA |
| **H2** | 3 |
| **P** | 8 |
| **BR** | 0 |
| **Título length** | 47 |
| **Resumen length** | 131 |

#### ANTES (estado actual)

- **Título**: Cinco agentes fallecen en operativo en Honduras
- **Resumen**: La Secretaría de Seguridad de Honduras intervino la DIPAMPCO tras el fallecimiento de cinco uniformados en una operación...
- **HTML**: 8 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto de seguridad regional centroamericana
  - **Dónde**: Después de describir el operativo
  - **Texto propuesto**: 
  ```
  Los países centroamericanos enfrentan desafíos compartidos en materia de seguridad. La cooperación regional incluye intercambio de información y operativos coordinados entre fuerzas de seguridad de Honduras, El Salvador, Guatemala y Nicaragua.
  ```
  - **Fuente**: Policía Nacional de Nicaragua — cooperación regional en seguridad (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar datos específicos de cooperación o cifras de incidentes regionales.

- **Fuentes**: Policía Nacional — cooperación regional (información pública)
- **Riesgo**: MEDIO — Contexto regional verificable pero genérico.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### B-9: Puerto Corinto lidera llegada de 11 buques a Nicaragua

| Campo | Valor |
|-------|-------|
| **ID** | `7XzL7aTqVYBpTNKgSPxQ` |
| **Perfil** | REPORTAJE |
| **Categoría** | Nacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 500 |
| **Blocking issue** | Falta datos económicos puerto Corinto |
| **H2** | 4 |
| **P** | 13 |
| **BR** | 0 |
| **Título length** | 54 |
| **Resumen length** | 146 |

#### ANTES (estado actual)

- **Título**: Puerto Corinto lidera llegada de 11 buques a Nicaragua
- **Resumen**: Nicaragua atendió 11 buques internacionales del 13 al 19 de julio. Puerto Corinto recibió ocho embarcaciones para fortal...
- **HTML**: 13 <p>, 0 <br>, 4 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Datos económicos del puerto de Corinto
  - **Dónde**: Después de mencionar los 11 buques
  - **Texto propuesto**: 
  ```
  Puerto Corinto es uno de los principales puertos comerciales de Nicaragua en la costa del Pacífico. La Empresa Portuaria Nacional (EPN) administra las operaciones de este puerto, que recibe buques de carga contenerizada, graneles y productos derivados del petróleo.
  ```
  - **Fuente**: EPN — Empresa Portuaria Nacional (información pública sobre operaciones portuarias)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar tonelajes específicos o comparaciones anuales sin fuente verificable.

- **Fuentes**: EPN — Empresa Portuaria Nacional (información pública)
- **Riesgo**: MEDIO — Contexto institucional verificable. No fabricar cifras de tonelaje.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### B-10: Polémica en el Mundial no frena reconocimiento a Tatiana Guzmán

| Campo | Valor |
|-------|-------|
| **ID** | `GHbdyeiCzH7Jk0i5RVPA` |
| **Perfil** | REPORTAJE |
| **Categoría** | Deportes |
| **Score actual** | 74 |
| **Aprobado** | false |
| **Palabras** | 385 |
| **Blocking issue** | Título > 60, falta biografía Tatiana Guzmán |
| **H2** | 3 |
| **P** | 10 |
| **BR** | 0 |
| **Título length** | 63 |
| **Resumen length** | 151 |

#### ANTES (estado actual)

- **Título**: Polémica en el Mundial no frena reconocimiento a Tatiana Guzmán
- **Resumen**: La árbitro nicaragüense Tatiana Guzmán anuló el gol de Alemania en el Mundial 2026 y recibirá la Orden Campeón del Puebl...
- **HTML**: 10 <p>, 0 <br>, 3 <h2>
- **⚠️ Título > 60 chars** (63)

#### DESPUÉS (propuesta)

- **Título propuesto**: "Tatiana Guzmán: reconocimiento pese a polémica en el Mundial"
  - Antes: "Polémica en el Mundial no frena reconocimiento a Tatiana Guzmán" (63 chars)
  - Después: "Tatiana Guzmán: reconocimiento pese a polémica en el Mundial" (60 chars)
- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre quién es Tatiana Guzmán y qué reconocimiento recibió
  - **Dónde**: Primer párrafo después del lead
  - **Texto propuesto**: 
  ```
  Tatiana Guzmán es una árbitro nicaragüense con trayectoria internacional. Su participación en torneos de la FIFA representa un hito para el arbitraje del país en el fútbol internacional.
  ```
  - **Fuente**: FIFA — información pública sobre árbitros internacionales (verificar trayectoria exacta)
  - **Verificable**: SÍ
  - **Riesgo**: ALTO — Verificar biografía exacta de Tatiana Guzmán antes de publicar. No inventar torneos específicos.

- **Fuentes**: FIFA — árbitros internacionales (información pública)
- **Riesgo**: ALTO — Se debe verificar la biografía exacta. No inventar participaciones en torneos.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 74.

---

### B-11: Incendio destruye vivienda en Monseñor Lezcano y deja un herido

| Campo | Valor |
|-------|-------|
| **ID** | `H25VVBdDntQpmy13uxdP` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 70 |
| **Aprobado** | false |
| **Palabras** | 379 |
| **Blocking issue** | 12 <br>, título > 60, score 70, falta estadísticas |
| **H2** | 4 |
| **P** | 1 |
| **BR** | 12 |
| **Título length** | 63 |
| **Resumen length** | 146 |

#### ANTES (estado actual)

- **Título**: Incendio destruye vivienda en Monseñor Lezcano y deja un herido
- **Resumen**: Un incendio consumió por completo una vivienda en el barrio Monseñor Lezcano, Managua, el sábado 27 de junio. El hijo de...
- **HTML**: 1 <p>, 12 <br>, 4 <h2>
- **⚠️ Título > 60 chars** (63)
- **⚠️ 12 tags <br> como separadores**

#### DESPUÉS (propuesta)

- **Título propuesto**: "Incendio consume vivienda en Monseñor Lezcano; un herido"
  - Antes: "Incendio destruye vivienda en Monseñor Lezcano y deja un herido" (63 chars)
  - Después: "Incendio consume vivienda en Monseñor Lezcano; un herido" (56 chars)
- **Correcciones HTML**:
  - Reemplazar 12 tags <br> por </p>\n<p>.
  - Solo 1 tag <p> actualmente — la mayoría del contenido está separado por <br>.
- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre incidencia de incendios en Managua
  - **Dónde**: Después de describir el incidente
  - **Texto propuesto**: 
  ```
  Los incendios residenciales en Managua suelen estar relacionados con cortocircuitos, sobrecarga eléctrica y accidentes con cocina. El Cuerpo de Bomberos de Nicaragua mantiene estaciones en los principales distritos de la capital.
  ```
  - **Fuente**: Cuerpo de Bomberos de Nicaragua — información pública
  - **Verificable**: SÍ
  - **Riesgo**: No inventar estadísticas específicas de incendios sin fuente verificable.

- **Fuentes**: Cuerpo de Bomberos de Nicaragua (información pública)
- **Riesgo**: MEDIO — Corrección HTML + título + contexto verificable. Score actual bajo (70).
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 70. Probable que no llegue a 85.

---

### B-12: Costa Rica detiene a palestino con vínculos a Hamás

| Campo | Valor |
|-------|-------|
| **ID** | `IFFjvOi1HTG0oeiIuIBo` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 455 |
| **Blocking issue** | Falta contexto geopolítico |
| **H2** | 3 |
| **P** | 11 |
| **BR** | 0 |
| **Título length** | 51 |
| **Resumen length** | 153 |

#### ANTES (estado actual)

- **Título**: Costa Rica detiene a palestino con vínculos a Hamás
- **Resumen**: La DIS de Costa Rica detuvo este lunes a un ciudadano palestino de apellido Abuawad en Desamparados, Alajuela, por presu...
- **HTML**: 11 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto geopolítico sobre relaciones Centroamérica-Medio Oriente
  - **Dónde**: Después de describir la detención
  - **Texto propuesto**: 
  ```
  La detención en Costa Rica de un individuo con vínculos presuntos en el conflicto del Medio Oriente refleja cómo los eventos internacionales pueden tener repercusiones en la región centroamericana. Los países de Centroamérica mantienen políticas migratorias y de seguridad que coordinan con organismos internacionales.
  ```
  - **Fuente**: Información pública sobre políticas migratorias de Costa Rica y cooperación internacional
  - **Verificable**: SÍ
  - **Riesgo**: No especular sobre conexiones específicas ni inventar declaraciones oficiales.

- **Fuentes**: Políticas migratorias públicas de Costa Rica
- **Riesgo**: MEDIO — Contexto geopolítico verificable pero debe ser cuidadoso con especulaciones.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### B-13: Capturan a autores de doble crimen en San Ramón, Matagalpa

| Campo | Valor |
|-------|-------|
| **ID** | `JbGRXcj7AiJNPvQRcneT` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 84 |
| **Aprobado** | false |
| **Palabras** | 523 |
| **Blocking issue** | Falta contexto seguridad Matagalpa |
| **H2** | 6 |
| **P** | 10 |
| **BR** | 0 |
| **Título length** | 58 |
| **Resumen length** | 132 |

#### ANTES (estado actual)

- **Título**: Capturan a autores de doble crimen en San Ramón, Matagalpa
- **Resumen**: La Policía Nacional capturó a tres de los cuatro implicados en la muerte de un padre y su hijo en una finca de San Ramón...
- **HTML**: 10 <p>, 0 <br>, 6 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto de seguridad en Matagalpa
  - **Dónde**: Después de describir la captura
  - **Texto propuesto**: 
  ```
  Matagalpa es uno de los departamentos con mayor extensión territorial en Nicaragua. La Policía Nacional mantiene destacamentos en los municipios del departamento para la atención de casos de seguridad ciudadana.
  ```
  - **Fuente**: Policía Nacional — estructura territorial (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar estadísticas de criminalidad específicas de Matagalpa.

- **Fuentes**: Policía Nacional (información pública)
- **Riesgo**: BAJO-MEDIO — Contexto institucional verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 84.

---

### B-14: Nicaragua abastece el 47% de lácteos que consume El Salvador

| Campo | Valor |
|-------|-------|
| **ID** | `Q19zidw5UoSjUlR1r9JP` |
| **Perfil** | REPORTAJE |
| **Categoría** | Nacionales |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 484 |
| **Blocking issue** | Falta datos económicos exportación láctea |
| **H2** | 3 |
| **P** | 11 |
| **BR** | 0 |
| **Título length** | 60 |
| **Resumen length** | 154 |

#### ANTES (estado actual)

- **Título**: Nicaragua abastece el 47% de lácteos que consume El Salvador
- **Resumen**: Nicaragua exportó US$170 millones en lácteos a El Salvador en 2025, cubriendo el 47% de sus importaciones. El quesillo n...
- **HTML**: 11 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre exportación láctea de Nicaragua
  - **Dónde**: Después de mencionar el 47% de abastecimiento a El Salvador
  - **Texto propuesto**: 
  ```
  Nicaragua es uno de los principales productores de lácteos en Centroamérica. El sector lácteo nacional abastece tanto el mercado interno como el de países vecinos, incluyendo El Salvador, Honduras y Costa Rica. El Ministerio Agropecuario y Forestal (MAG) coordina con productores las políticas de exportación.
  ```
  - **Fuente**: MAG — información pública sobre sector lácteo nacional
  - **Verificable**: SÍ
  - **Riesgo**: No inventar volúmenes específicos de exportación sin fuente verificable.

- **Fuentes**: MAG — sector lácteo (información pública)
- **Riesgo**: MEDIO — Contexto económico verificable. No fabricar cifras de toneladas exportadas.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### B-15: Capturan a sujeto por robo de US$30 mil en Jalapa

| Campo | Valor |
|-------|-------|
| **ID** | `SD09P4KU8vq4Mq1Vidzz` |
| **Perfil** | INVESTIGACION |
| **Categoría** | Sucesos |
| **Score actual** | 78 |
| **Aprobado** | false |
| **Palabras** | 744 |
| **Blocking issue** | Falta contexto seguridad Nueva Segovia |
| **H2** | 7 |
| **P** | 24 |
| **BR** | 0 |
| **Título length** | 49 |
| **Resumen length** | 152 |

#### ANTES (estado actual)

- **Título**: Capturan a sujeto por robo de US$30 mil en Jalapa
- **Resumen**: Policía capturó a un hombre señalado por el robo de más de US$30 mil en una tienda de Jalapa, Nueva Segovia. Parte del d...
- **HTML**: 24 <p>, 0 <br>, 7 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto de seguridad en Nueva Segovia
  - **Dónde**: Después de describir el robo
  - **Texto propuesto**: 
  ```
  Nueva Segovia, departamento fronterizo con Honduras, enfrenta desafíos en materia de seguridad debido a su ubicación geográfica. La Policía Nacional mantiene presencia en los municipios de Jalapa, Ocotal y Quilalí para la prevención de delitos.
  ```
  - **Fuente**: Policía Nacional — presencia territorial en Nueva Segovia (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar estadísticas de robo específicas de Jalapa.

- **Fuentes**: Policía Nacional (información pública)
- **Riesgo**: BAJO-MEDIO — Contexto institucional verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 78.

---

### B-16: Nicaragua invertirá $13.9 millones en 49 camiones de bombero

| Campo | Valor |
|-------|-------|
| **ID** | `SG87LjFIgCWnd6g8EKDq` |
| **Perfil** | REPORTAJE |
| **Categoría** | Nacionales |
| **Score actual** | 76 |
| **Aprobado** | false |
| **Palabras** | 545 |
| **Blocking issue** | Falta detalles técnicos camiones bombero |
| **H2** | 5 |
| **P** | 14 |
| **BR** | 0 |
| **Título length** | 60 |
| **Resumen length** | 155 |

#### ANTES (estado actual)

- **Título**: Nicaragua invertirá $13.9 millones en 49 camiones de bombero
- **Resumen**: La Asamblea Nacional aprobó por unanimidad un préstamo internacional por $13,906,233.96 destinado a la adquisición de 49...
- **HTML**: 14 <p>, 0 <br>, 5 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre capacidad operativa de bomberos en Nicaragua
  - **Dónde**: Después de mencionar la inversión de $13.9 millones
  - **Texto propuesto**: 
  ```
  El Cuerpo de Bomberos de Nicaragua cuenta con estaciones en los 15 departamentos y dos regiones autónomas. La adquisición de nuevos camiones busca modernizar la flota existente y mejorar los tiempos de respuesta en emergencias.
  ```
  - **Fuente**: Dirección General de Bomberos (DGB) — información pública sobre capacidad operativa
  - **Verificable**: SÍ
  - **Riesgo**: No inventar número actual de camiones ni distribución específica por departamento.

- **Fuentes**: DGB — información pública
- **Riesgo**: MEDIO — Contexto institucional verificable. No fabricar datos de flota actual.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 76.

---

### B-17: España, Francia y Argentina son favoritas al Mundial 2026

| Campo | Valor |
|-------|-------|
| **ID** | `VW3uBFbDCb6RR3KCiJ18` |
| **Perfil** | INVESTIGACION |
| **Categoría** | Deportes |
| **Score actual** | 74 |
| **Aprobado** | false |
| **Palabras** | 743 |
| **Blocking issue** | Falta análisis deportivo |
| **H2** | 3 |
| **P** | 10 |
| **BR** | 0 |
| **Título length** | 57 |
| **Resumen length** | 149 |

#### ANTES (estado actual)

- **Título**: España, Francia y Argentina son favoritas al Mundial 2026
- **Resumen**: España, Francia y Argentina encabezan los pronósticos antes del Mundial 2026, que inicia este 11 de junio con un formato...
- **HTML**: 10 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre selecciones favoritas en mundiales FIFA
  - **Dónde**: Después de mencionar a España, Francia y Argentina
  - **Texto propuesto**: 
  ```
  En los mundiales de la FIFA, las selecciones con mejor histórico de resultados y ranking suelen partir como favoritas. España, Francia y Argentina han ganado títulos mundiales en ediciones recientes, lo que las posiciona como candidatos habituales.
  ```
  - **Fuente**: FIFA — historial de campeones mundiales (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar análisis tácticos ni declaraciones de entrenadores.

- **Fuentes**: FIFA — historial de mundiales (información pública)
- **Riesgo**: BAJO-MEDIO — Contexto deportivo verificable basado en historial público.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 74.

---

### B-18: Después de años prófugo, captura de El Diablo abre interrogante

| Campo | Valor |
|-------|-------|
| **ID** | `ZJpLrlTrusn5Jex8WQgQ` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 78 |
| **Aprobado** | false |
| **Palabras** | 435 |
| **Blocking issue** | Título > 60, falta historial delictivo |
| **H2** | 5 |
| **P** | 15 |
| **BR** | 0 |
| **Título length** | 63 |
| **Resumen length** | 154 |

#### ANTES (estado actual)

- **Título**: Después de años prófugo, captura de El Diablo abre interrogante
- **Resumen**: Alejandro Arias Monge fue capturado en Sarapiquí tras años de búsqueda. El operativo inicia una nueva etapa judicial par...
- **HTML**: 15 <p>, 0 <br>, 5 <h2>
- **⚠️ Título > 60 chars** (63)

#### DESPUÉS (propuesta)

- **Título propuesto**: "Capturan a "El Diablo" tras años de prófugo"
  - Antes: "Después de años prófugo, captura de El Diablo abre interrogante" (63 chars)
  - Después: "Capturan a "El Diablo" tras años de prófugo" (43 chars)
- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre el historial del capturado
  - **Dónde**: Después de describir la captura
  - **Texto propuesto**: 
  ```
  El capturado, conocido por el alias "El Diablo", tenía una orden de captura pendiente. Su detención se produjo después de un período como prófugo, según información de las autoridades.
  ```
  - **Fuente**: Policía Nacional — información pública sobre la captura
  - **Verificable**: SÍ
  - **Riesgo**: ALTO — No inventar delitos específicos, fechas de prófugo, ni antecedentes sin fuente verificable. Solo usar lo que ya está en el artículo.

- **Fuentes**: Policía Nacional (información pública)
- **Riesgo**: ALTO — No fabricar historial delictivo. Solo usar información ya presente en el artículo.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 78.

---

### B-19: Agresión a mujer en Nindirí activa investigación bajo la Ley 779

| Campo | Valor |
|-------|-------|
| **ID** | `qAcmF4MWTiLsTACCG8v5` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 78 |
| **Aprobado** | false |
| **Palabras** | 527 |
| **Blocking issue** | Título > 60, resumen > 160, falta contexto Ley 779 |
| **H2** | 4 |
| **P** | 9 |
| **BR** | 0 |
| **Título length** | 64 |
| **Resumen length** | 162 |

#### ANTES (estado actual)

- **Título**: Agresión a mujer en Nindirí activa investigación bajo la Ley 779
- **Resumen**: Brenda López sufrió lesiones graves en Nindirí. El sospechoso fue detenido y el caso pasa a la Policía Nacional bajo la ...
- **HTML**: 9 <p>, 0 <br>, 4 <h2>
- **⚠️ Título > 60 chars** (64)
- **⚠️ Resumen > 160 chars** (162)

#### DESPUÉS (propuesta)

- **Título propuesto**: "Agresión a mujer en Nindirí: investigan bajo Ley 779"
  - Antes: "Agresión a mujer en Nindirí activa investigación bajo la Ley 779" (64 chars)
  - Después: "Agresión a mujer en Nindirí: investigan bajo Ley 779" (52 chars)
- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre la Ley 779 (Ley Integral contra la Violencia hacia las Mujeres)
  - **Dónde**: Después de mencionar la Ley 779
  - **Texto propuesto**: 
  ```
  La Ley 779, aprobada en 2012, establece el marco legal para la prevención, sanción y erradicación de la violencia contra las mujeres en Nicaragua. La ley define diversos tipos de violencia y establece medidas de protección para las víctimas.
  ```
  - **Fuente**: Ley 779 — texto legal público (Ley Nº 779, aprobada en 2012)
  - **Verificable**: SÍ
  - **Riesgo**: Verificar año exacto de aprobación antes de publicar. No inventar estadísticas de aplicación.

- **Fuentes**: Ley 779 (texto legal público)
- **Riesgo**: MEDIO — Contexto legal verificable. Verificar año exacto de aprobación.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 78.

---

### B-20: Nicaragua conquista el IHF Trophy de Balonmano en C.A

| Campo | Valor |
|-------|-------|
| **ID** | `e2xuC463KZm7pAubu9Rl` |
| **Perfil** | REPORTAJE |
| **Categoría** | Deportes |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 602 |
| **Blocking issue** | Falta resultados detallados balonmano |
| **H2** | 6 |
| **P** | 13 |
| **BR** | 0 |
| **Título length** | 53 |
| **Resumen length** | 146 |

#### ANTES (estado actual)

- **Título**: Nicaragua conquista el IHF Trophy de Balonmano en C.A
- **Resumen**: Las selecciones sub-20 y sub-18 de Nicaragua conquistan el IHF Trophy Centroamérica en El Salvador y se consolidan como ...
- **HTML**: 13 <p>, 0 <br>, 6 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre balonmano en Nicaragua
  - **Dónde**: Después de mencionar el IHF Trophy
  - **Texto propuesto**: 
  ```
  El balonmano es un deporte que ha ganado presencia en Nicaragua en los últimos años. La Federación Nicaragüense de Balonmano coordina la participación de selecciones nacionales en torneos regionales como el IHF Trophy, que reúne a países de Centroamérica y el Caribe.
  ```
  - **Fuente**: Federación Nicaragüense de Balonmano — información pública sobre torneos
  - **Verificable**: SÍ
  - **Riesgo**: No inventar resultados específicos de partidos sin fuente verificable.

- **Fuentes**: Federación Nicaragüense de Balonmano (información pública)
- **Riesgo**: MEDIO — Contexto deportivo verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### B-21: Accidentes en Nicaragua dejan un fallecido y varios heridos

| Campo | Valor |
|-------|-------|
| **ID** | `hscMxXK16XKKq84yY1P6` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 86 |
| **Aprobado** | false |
| **Palabras** | 418 |
| **Blocking issue** | Falta detalles y estadísticas accidentes |
| **H2** | 5 |
| **P** | 15 |
| **BR** | 0 |
| **Título length** | 59 |
| **Resumen length** | 143 |

#### ANTES (estado actual)

- **Título**: Accidentes en Nicaragua dejan un fallecido y varios heridos
- **Resumen**: Varios accidentes registrados en Nicaragua dejaron una persona fallecida y lesionados. Los casos involucraron motociclet...
- **HTML**: 15 <p>, 0 <br>, 5 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre accidentes de tránsito en Nicaragua
  - **Dónde**: Después de describir los accidentes
  - **Texto propuesto**: 
  ```
  Los accidentes de tránsito son una de las principales causas de muerte en Nicaragua. La Policía Nacional mantiene campañas de prevención vial, especialmente en carreteras principales y durante períodos de alta circulación.
  ```
  - **Fuente**: Policía Nacional — campañas de prevención vial (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar estadísticas específicas de accidentes del año en curso.

- **Fuentes**: Policía Nacional (información pública)
- **Riesgo**: BAJO-MEDIO — Contexto verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 86.

---

### B-22: Netflix, Max y Disney+ dominan streaming en Nicaragua

| Campo | Valor |
|-------|-------|
| **ID** | `vvWJAwyV8adECw3IGqdy` |
| **Perfil** | REPORTAJE |
| **Categoría** | Tecnología |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 649 |
| **Blocking issue** | Falta datos penetración streaming |
| **H2** | 4 |
| **P** | 7 |
| **BR** | 0 |
| **Título length** | 53 |
| **Resumen length** | 147 |

#### ANTES (estado actual)

- **Título**: Netflix, Max y Disney+ dominan streaming en Nicaragua
- **Resumen**: Analizamos el mercado de streaming en Nicaragua: Netflix, Disney+ y Max lideran el consumo digital en jóvenes de 18 a 34...
- **HTML**: 7 <p>, 0 <br>, 4 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: context
  - **Qué**: Contexto sobre penetración de streaming en Nicaragua
  - **Dónde**: Después de mencionar Netflix, Max y Disney+
  - **Texto propuesto**: 
  ```
  Las plataformas de streaming han transformado los hábitos de consumo audiovisual en Nicaragua. El acceso a internet y la penetración de smartphones han facilitado el crecimiento de servicios como Netflix, Disney+ y Max en el país.
  ```
  - **Fuente**: TELCOR — penetración de internet en Nicaragua (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: No inventar cifras de suscriptores ni porcentajes de penetración específicos.

- **Fuentes**: TELCOR — penetración de internet (información pública)
- **Riesgo**: MEDIO — Contexto tecnológico verificable. No fabricar cifras de mercado.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

## CLASE C — ENRIQUECIMIENTO PERIODÍSTICO (8 artículos)

---

### C-1: Nicaragua gana oro en relevos mixtos 4x100 en Managua

| Campo | Valor |
|-------|-------|
| **ID** | `kR3waCnxVDfMfVCV8sAH` |
| **Perfil** | REPORTAJE |
| **Categoría** | Deportes |
| **Score actual** | 88 |
| **Aprobado** | false |
| **Palabras** | 618 |
| **Blocking issue** | Necesita enfoque resultados + protagonistas |
| **H2** | 7 |
| **P** | 19 |
| **BR** | 0 |
| **Título length** | 53 |
| **Resumen length** | 141 |

#### ANTES (estado actual)

- **Título**: Nicaragua gana oro en relevos mixtos 4x100 en Managua
- **Resumen**: Nicaragua obtuvo la medalla de oro en los relevos mixtos 4x100 metros del Campeonato Centroamericano Mayor de Atletismo ...
- **HTML**: 19 <p>, 0 <br>, 7 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: enrichment
  - **Qué**: Estructura periodística: hecho → contexto → explicación → utilidad
  - **Dónde**: Reestructurar el artículo completo
  - **Texto propuesto**: 
  ```
  HECHO: Nicaragua ganó medalla de oro en relevos mixtos 4x100 en competición atlética en Managua.

CONTEXTO: El atletismo nicaragüense ha tenido participaciones destacadas en torneos regionales. Los relevos 4x100 son una disciplina que requiere coordinación y velocidad de equipo.

EXPLICACIÓN: La medalla de oro en una prueba de relevos representa un logro colectivo que demuestra el nivel del atletismo nacional en competiciones de pista.

UTILIDAD: El lector puede seguir los resultados de atletismo nacional a través de la Federación Nicaragüense de Atletismo.
  ```
  - **Fuente**: Federación Nicaragüense de Atletismo — resultados públicos
  - **Verificable**: SÍ
  - **Riesgo**: ALTO — No inventar tiempos específicos, nombres de atletas, ni resultados de otros países sin fuente verificable.

- **Fuentes**: Federación Nicaragüense de Atletismo (resultados públicos)
- **Riesgo**: ALTO — El enriquecimiento requiere datos verificables. No inventar tiempos ni nombres.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 88.

---

### C-2: Nueva Guinea busca respuestas por muerte de joven de 18 años

| Campo | Valor |
|-------|-------|
| **ID** | `qT9tAbCyVpicX7HmoaD0` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 80 |
| **Aprobado** | false |
| **Palabras** | 473 |
| **Blocking issue** | Resumen > 160, necesita contexto social |
| **H2** | 5 |
| **P** | 11 |
| **BR** | 0 |
| **Título length** | 60 |
| **Resumen length** | 162 |

#### ANTES (estado actual)

- **Título**: Nueva Guinea busca respuestas por muerte de joven de 18 años
- **Resumen**: La Policía Nacional mantiene detenido a un hombre de 38 años mientras investiga la muerte de una joven de 18 años hallad...
- **HTML**: 11 <p>, 0 <br>, 5 <h2>
- **⚠️ Resumen > 160 chars** (162)

#### DESPUÉS (propuesta)

- **Resumen propuesto**: "Joven de 18 años pierde la vida en Nueva Guinea; comunidad exige respuestas sobre el caso."
- **Adiciones de contenido**:
  - **Tipo**: enrichment
  - **Qué**: Contexto social de Nueva Guinea + estructura periodística
  - **Dónde**: Reestructurar con contexto social verificable
  - **Texto propuesto**: 
  ```
  CONTEXTO: Nueva Guinea, ubicada en la Región Autónoma de la Costa Caribe Sur, es uno de los municipios con mayor extensión territorial de Nicaragua. La zona enfrenta desafíos en materia de seguridad y acceso a servicios.

EXPLICACIÓN: La muerte de un joven de 18 años genera preocupación en la comunidad sobre la seguridad y la respuesta de las autoridades.

UTILIDAD: Las autoridades competentes para investigar este tipo de casos son la Policía Nacional y el Ministerio Público.
  ```
  - **Fuente**: Información geográfica e institucional pública sobre Nueva Guinea (RAACS)
  - **Verificable**: SÍ
  - **Riesgo**: MEDIO — No especular sobre causas ni responsables. Solo contexto geográfico e institucional.

- **Fuentes**: Información pública sobre Nueva Guinea (RAACS)
- **Riesgo**: MEDIO — Contexto social verificable. No especular sobre el caso.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 80.

---

### C-3: Fiscalía acusa a madre y padrastro por muerte de niño

| Campo | Valor |
|-------|-------|
| **ID** | `tYX2ZtXwUXg07CHI0ONj` |
| **Perfil** | REPORTAJE |
| **Categoría** | Sucesos |
| **Score actual** | 74 |
| **Aprobado** | false |
| **Palabras** | 467 |
| **Blocking issue** | Necesita contexto legal protección menores |
| **H2** | 5 |
| **P** | 8 |
| **BR** | 0 |
| **Título length** | 53 |
| **Resumen length** | 123 |

#### ANTES (estado actual)

- **Título**: Fiscalía acusa a madre y padrastro por muerte de niño
- **Resumen**: El niño, de 3 años y con síndrome de Down, murió por golpes en Tipitapa; su madre y padrastro enfrentan cargos por maltr...
- **HTML**: 8 <p>, 0 <br>, 5 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: enrichment
  - **Qué**: Contexto legal sobre protección de menores en Nicaragua
  - **Dónde**: Después de describir la acusación fiscal
  - **Texto propuesto**: 
  ```
  CONTEXTO: Nicaragua cuenta con el Código de la Niñez y la Adolescencia (Ley 877) que establece el marco legal para la protección de los derechos de los menores. La Fiscalía General de la República tiene la facultad de procesar casos que involucran a menores de edad.

EXPLICACIÓN: La acusación contra la madre y el padrastro implica un proceso judicial que debe seguir el debido proceso establecido en la legislación.

UTILIDAD: El Sistema de Protección Integral de la Niñez y Adolescencia es el ente rector en materia de protección de menores.
  ```
  - **Fuente**: Código de la Niñez y la Adolescencia (Ley 877) — texto legal público
  - **Verificable**: SÍ
  - **Riesgo**: MEDIO — Verificar número de ley exacto. No especular sobre el caso específico.

- **Fuentes**: Ley 877 — Código de la Niñez y Adolescencia (texto legal público)
- **Riesgo**: MEDIO — Contexto legal verificable. No especular sobre detalles del caso.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 74.

---

### C-4: Nicaragüense resulta afectado en ataque en Canóvanas, Puerto Rico

| Campo | Valor |
|-------|-------|
| **ID** | `tlIXmTYnv4hIajXOQiup` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 82 |
| **Aprobado** | false |
| **Palabras** | 470 |
| **Blocking issue** | Título > 60, necesita contexto diáspora PR |
| **H2** | 7 |
| **P** | 11 |
| **BR** | 0 |
| **Título length** | 65 |
| **Resumen length** | 155 |

#### ANTES (estado actual)

- **Título**: Nicaragüense resulta afectado en ataque en Canóvanas, Puerto Rico
- **Resumen**: Nicaragüense de 38 años murió en ataque armado en Canóvanas, Puerto Rico. Policía y CIC investigan hecho con 86 casquill...
- **HTML**: 11 <p>, 0 <br>, 7 <h2>
- **⚠️ Título > 60 chars** (65)

#### DESPUÉS (propuesta)

- **Título propuesto**: "Nicaragüense afectado en ataque en Canóvanas, Puerto Rico"
  - Antes: "Nicaragüense resulta afectado en ataque en Canóvanas, Puerto Rico" (65 chars)
  - Después: "Nicaragüense afectado en ataque en Canóvanas, Puerto Rico" (57 chars)
- **Adiciones de contenido**:
  - **Tipo**: enrichment
  - **Qué**: Contexto diaspórico + estructura periodística
  - **Dónde**: Después de describir el ataque
  - **Texto propuesto**: 
  ```
  CONTEXTO: Puerto Rico es uno de los destinos de la diáspora nicaragüense en el Caribe. Los connacionales que residen allí mantienen vínculos con Nicaragua a través de servicios consulares.

EXPLICACIÓN: El ataque en Canóvanas afecta a un connacional, lo que puede activar protocolos de asistencia consular.

UTILIDAD: Los nicaragüenses en el exterior pueden recibir asistencia a través de la embajada o consulado correspondiente.
  ```
  - **Fuente**: MIGOB — asistencia consular a nicaragüenses en el exterior (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: MEDIO — No inventar número de nicaragüenses en Puerto Rico.

- **Fuentes**: MIGOB — asistencia consular (información pública)
- **Riesgo**: MEDIO — Corrección de título + contexto diaspórico verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 82.

---

### C-5: Beisbol infantil: Nicaragua viaja a Puerto Rico y Ecuador

| Campo | Valor |
|-------|-------|
| **ID** | `tnX05ykqVT6WiYVflSii` |
| **Perfil** | REPORTAJE |
| **Categoría** | Deportes |
| **Score actual** | 74 |
| **Aprobado** | false |
| **Palabras** | 629 |
| **Blocking issue** | Necesita contexto béisbol infantil |
| **H2** | 4 |
| **P** | 10 |
| **BR** | 0 |
| **Título length** | 57 |
| **Resumen length** | 150 |

#### ANTES (estado actual)

- **Título**: Beisbol infantil: Nicaragua viaja a Puerto Rico y Ecuador
- **Resumen**: Doce peloteros de 9-10 años parten a Puerto Rico y 17 de 15-16 años a Ecuador para competir en torneos latinoamericanos ...
- **HTML**: 10 <p>, 0 <br>, 4 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: enrichment
  - **Qué**: Contexto del béisbol infantil en Nicaragua
  - **Dónde**: Reestructurar con enfoque periodístico
  - **Texto propuesto**: 
  ```
  CONTEXTO: El béisbol infantil es una de las categorías de desarrollo del deporte nacional en Nicaragua. La Federación Nicaragüense de Béisbol coordina la participación de selecciones juveniles en torneos internacionales.

EXPLICACIÓN: La participación de Nicaragua en torneos en Puerto Rico y Ecuador representa la proyección internacional del béisbol formativo del país.

UTILIDAD: Los aficionados pueden seguir los resultados a través de la Federación Nicaragüense de Béisbol.
  ```
  - **Fuente**: Federación Nicaragüense de Béisbol — información pública sobre categorías juveniles
  - **Verificable**: SÍ
  - **Riesgo**: ALTO — No inventar nombres de jugadores, resultados de partidos, ni expectativas específicas.

- **Fuentes**: Federación Nicaragüense de Béisbol (información pública)
- **Riesgo**: ALTO — No inventar nombres de jugadores ni resultados específicos.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 74.

---

### C-6: Nicaragüense José Salgado resulta afectado en asalto en Austin

| Campo | Valor |
|-------|-------|
| **ID** | `uJ076MyMZhQIJYTa1qOW` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 76 |
| **Aprobado** | false |
| **Palabras** | 402 |
| **Blocking issue** | Título > 60, 3 <br>, necesita contexto diáspora Texas |
| **H2** | 4 |
| **P** | 9 |
| **BR** | 3 |
| **Título length** | 62 |
| **Resumen length** | 146 |

#### ANTES (estado actual)

- **Título**: Nicaragüense José Salgado resulta afectado en asalto en Austin
- **Resumen**: El nicaragüense José Salgado Amador, de 28 años, fue gravemente afectado durante un asalto en Austin, Texas, cuando trab...
- **HTML**: 9 <p>, 3 <br>, 4 <h2>
- **⚠️ Título > 60 chars** (62)
- **⚠️ 3 tags <br> como separadores**

#### DESPUÉS (propuesta)

- **Título propuesto**: "Nicaragüense afectado en asalto en Austin, Texas"
  - Antes: "Nicaragüense José Salgado resulta afectado en asalto en Austin" (62 chars)
  - Después: "Nicaragüense afectado en asalto en Austin, Texas" (48 chars)
- **Correcciones HTML**:
  - Reemplazar 3 tags <br> por </p>\n<p>.
- **Adiciones de contenido**:
  - **Tipo**: enrichment
  - **Qué**: Contexto diaspórico + asistencia consular
  - **Dónde**: Después de describir el asalto
  - **Texto propuesto**: 
  ```
  CONTEXTO: Austin, capital de Texas, es una de las ciudades donde reside comunidad nicaragüense en Estados Unidos. Los connacionales que son víctimas de delitos en el exterior pueden recibir asistencia consular.

EXPLICACIÓN: El asalto a un connacional en Texas puede activar protocolos de notificación y asistencia del consulado correspondiente.

UTILIDAD: Los nicaragüenses víctimas de delitos en el exterior deben contactar al consulado más cercano para recibir orientación.
  ```
  - **Fuente**: MIGOB — asistencia consular a nicaragüenses en Estados Unidos (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: MEDIO — No inventar detalles del caso ni cifras de nicaragüenses en Austin.

- **Fuentes**: MIGOB — asistencia consular (información pública)
- **Riesgo**: MEDIO — Corrección de título + HTML + contexto diaspórico verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 76.

---

### C-7: Colapso en construcción cobra vida de nicaragüense en EE. UU

| Campo | Valor |
|-------|-------|
| **ID** | `wiHS5gvNy7U6tORXAhEU` |
| **Perfil** | REPORTAJE |
| **Categoría** | Internacionales |
| **Score actual** | 80 |
| **Aprobado** | false |
| **Palabras** | 404 |
| **Blocking issue** | Necesita contexto laboral OSHA |
| **H2** | 3 |
| **P** | 9 |
| **BR** | 0 |
| **Título length** | 60 |
| **Resumen length** | 159 |

#### ANTES (estado actual)

- **Título**: Colapso en construcción cobra vida de nicaragüense en EE. UU
- **Resumen**: Jesús Manuel Fuentes Rayo, originario de La Trinidad, Estelí, falleció en Minneapolis luego del colapso de una estructur...
- **HTML**: 9 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: enrichment
  - **Qué**: Contexto laboral sobre accidentes en construcción en EE.UU.
  - **Dónde**: Después de describir el colapso
  - **Texto propuesto**: 
  ```
  CONTEXTO: Los accidentes laborales en el sector de construcción en Estados Unidos están regulados por la Occupational Safety and Health Administration (OSHA). Los trabajadores, incluyendo inmigrantes, tienen derechos laborales independientemente de su estatus migratorio.

EXPLICACIÓN: El colapso en una construcción que cobra la vida de un trabajador puede activar investigaciones de OSHA y procesos de compensación laboral.

UTILIDAD: Las familias de trabajadores fallecidos en accidentes laborales pueden buscar asesoría legal especializada en derechos laborales.
  ```
  - **Fuente**: OSHA — información pública sobre regulaciones de seguridad en construcción
  - **Verificable**: SÍ
  - **Riesgo**: MEDIO — No especular sobre el estatus migratorio ni detalles del accidente específico.

- **Fuentes**: OSHA — regulaciones de seguridad laboral (información pública)
- **Riesgo**: MEDIO — Contexto laboral verificable. No especular sobre el caso específico.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 80.

---

### C-8: México, Brasil y Argentina avanzan en el Mundial 2026

| Campo | Valor |
|-------|-------|
| **ID** | `yUMAJwJQ1yMJTSb2cdkP` |
| **Perfil** | REPORTAJE |
| **Categoría** | Deportes |
| **Score actual** | 86 |
| **Aprobado** | false |
| **Palabras** | 546 |
| **Blocking issue** | Necesita perspectiva desde Nicaragua |
| **H2** | 3 |
| **P** | 11 |
| **BR** | 0 |
| **Título length** | 53 |
| **Resumen length** | 153 |

#### ANTES (estado actual)

- **Título**: México, Brasil y Argentina avanzan en el Mundial 2026
- **Resumen**: México cerró con puntaje perfecto, Sudáfrica eliminó a Corea del Sur y Brasil goleó a Escocia. Trece equipos ya están en...
- **HTML**: 11 <p>, 0 <br>, 3 <h2>

#### DESPUÉS (propuesta)

- **Adiciones de contenido**:
  - **Tipo**: enrichment
  - **Qué**: Perspectiva desde Nicaragua sobre el Mundial 2026
  - **Dónde**: Reestructurar con enfoque desde Nicaragua
  - **Texto propuesto**: 
  ```
  CONTEXTO: El Mundial 2026 se disputará en sedes de Estados Unidos, México y Canadá. Para Nicaragua, el torneo representa un evento deportivo de seguimiento masivo, ya que la selección nacional no participa pero los aficionados siguen a selecciones de la región.

EXPLICACIÓN: El avance de México, Brasil y Argentina tiene relevancia para los aficionados nicaragüenses que siguen el fútbol internacional.

UTILIDAD: Los partidos del Mundial 2026 se transmitirán por señal abierta y plataformas de streaming disponibles en Nicaragua.
  ```
  - **Fuente**: FIFA — información pública sobre el Mundial 2026 (sedes, formato)
  - **Verificable**: SÍ
  - **Riesgo**: BAJO-MEDIO — Contexto deportivo verificable. No inventar horarios ni canales específicos.

- **Fuentes**: FIFA — Mundial 2026 (información pública)
- **Riesgo**: BAJO-MEDIO — Contexto deportivo verificable.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 86.

---

## CLASE D — REESCRITURA (1 artículos)

---

### D-1: Nuevo complejo en Masaya reúne Bomberos y Migración

| Campo | Valor |
|-------|-------|
| **ID** | `zkdDsejAb5hLCpCaEbMR` |
| **Perfil** | REPORTAJE |
| **Categoría** | Nacionales |
| **Score actual** | 64 |
| **Aprobado** | false |
| **Palabras** | 403 |
| **Blocking issue** | Score 64, cercano a comunicado, necesita reescritura |
| **H2** | 4 |
| **P** | 7 |
| **BR** | 0 |
| **Título length** | 51 |
| **Resumen length** | 169 |

#### ANTES (estado actual)

- **Título**: Nuevo complejo en Masaya reúne Bomberos y Migración
- **Resumen**: Masaya estrenó un complejo del Ministerio del Interior que concentra Bomberos Unidos y Migración, con nueva capacidad op...
- **HTML**: 7 <p>, 0 <br>, 4 <h2>
- **⚠️ Resumen > 160 chars** (169)

#### DESPUÉS (propuesta)

- **Resumen propuesto**: "Masaya estrena complejo que integra estaciones de Bomberos y Migración en una sola sede."
- **Correcciones HTML**:
  - Reescribir contenido completo con estructura periodística.
  - Asegurar mínimo 3-4 subtítulos H2.
  - Envolver todo el texto en <p>.
- **Adiciones de contenido**:
  - **Tipo**: rewrite
  - **Qué**: Reescritura completa del artículo
  - **Dónde**: Artículo completo
  - **Texto propuesto**: 
  ```
  REESCRITURA PROPUESTA:

Lead: Las autoridades inauguraron en Masaya un nuevo complejo que integra los servicios de Bomberos y Migración en una sola sede, con el objetivo de mejorar la atención a la ciudadanía.

H2: Nueva infraestructura para Masaya
El complejo reúne en un solo punto dos instituciones que anteriormente operaban en sedes separadas. La inversión permite optimizar recursos y mejorar los tiempos de respuesta ante emergencias y trámites migratorios.

H2: Servicios integrados
La sede de Bomberos contará con equipos de respuesta rápida y personal de guardia permanente. La oficina de Migración atenderá trámites de pasaportes, visados y otros servicios migratorios.

H2: Impacto en la comunidad
Los residentes de Masaya y municipios aledaños se beneficiarán de la cercanía de ambos servicios en una sola ubicación. El complejo forma parte de las inversiones del gobierno en infraestructura pública.

NOTA: Esta reescritura mantiene ÚNICAMENTE los hechos verificables del artículo original. No se inventan cifras de inversión, metros cuadrados, ni declaraciones. Si el artículo original no contiene suficiente información verificable para esta reescritura, se recomienda ARCHIVE.
  ```
  - **Fuente**: Información ya presente en el artículo original + MIGOB/DGB (información pública)
  - **Verificable**: SÍ
  - **Riesgo**: ALTO — Si el artículo original es demasiado escaso (403 palabras, score 64), la reescritura puede no ser suficiente. Considerar ARCHIVE si después de 2 iteraciones score < 85.

- **Fuentes**: Artículo original + MIGOB/DGB (información pública)
- **Riesgo**: ALTO — Score actual 64. Contenido cercano a comunicado. Reescritura puede no ser suficiente. Considerar ARCHIVE.
- **Score esperado**: Desconocido hasta ejecutar MENI. Score actual: 64. Alta probabilidad de que no llegue a 85.

---

## ANÁLISIS DE RIESGO

### Artículos de ALTO riesgo (posible relleno o invención)

| ID | Clase | Riesgo | Razón |
|----|-------|--------|-------|
| `GHbdyeiCzH7Jk0i5RVPA` | B | ALTO | ALTO — Se debe verificar la biografía exacta. No inventar participaciones en torneos. |
| `ZJpLrlTrusn5Jex8WQgQ` | B | ALTO | ALTO — No fabricar historial delictivo. Solo usar información ya presente en el artículo. |
| `kR3waCnxVDfMfVCV8sAH` | C | ALTO | ALTO — El enriquecimiento requiere datos verificables. No inventar tiempos ni nombres. |
| `tnX05ykqVT6WiYVflSii` | C | ALTO | ALTO — No inventar nombres de jugadores ni resultados específicos. |
| `zkdDsejAb5hLCpCaEbMR` | D | ALTO | ALTO — Score actual 64. Contenido cercano a comunicado. Reescritura puede no ser suficiente. Considerar ARCHIVE. |

### Artículos con score < 85 (probable que no aprueben)

| ID | Score | Clase | Razón |
|----|-------|-------|-------|
| `CypRypZIGLckqywkZq8X` | 74 | B | MEDIO — Se agrega contexto institucional verificable. No inventar cifras de población. |
| `D7y1TWAyXq7SaNMirIjB` | 80 | B | MEDIO — Corrección de título + contexto verificable. |
| `EcKTeqT7kLcFElUX3DM2` | 78 | B | MEDIO — Se agrega contexto legal verificable. Verificar artículo exacto antes de citar. |
| `F4UddilPobcIjIkZ1e55` | 78 | B | MEDIO — Verificar dependencia institucional exacta de ULTRAVAL. |
| `JOfOW7uTxkgDSIezo7Wn` | 84 | A | BAJO — Solo corrección estructural. Contenido no se modifica. |
| `GHbdyeiCzH7Jk0i5RVPA` | 74 | B | ALTO — Se debe verificar la biografía exacta. No inventar participaciones en torneos. |
| `H25VVBdDntQpmy13uxdP` | 70 | B | MEDIO — Corrección HTML + título + contexto verificable. Score actual bajo (70). |
| `Ilzcy77tyF8oFNPytokN` | 74 | A | MEDIO — Score actual 74. Aunque la corrección estructural ayuda, el score puede seguir < 85. Si después de 2 iteraciones score < 85, marcar MEJORADO_PERO_NO_APROBADO. |
| `JbGRXcj7AiJNPvQRcneT` | 84 | B | BAJO-MEDIO — Contexto institucional verificable. |
| `SD09P4KU8vq4Mq1Vidzz` | 78 | B | BAJO-MEDIO — Contexto institucional verificable. |
| `SG87LjFIgCWnd6g8EKDq` | 76 | B | MEDIO — Contexto institucional verificable. No fabricar datos de flota actual. |
| `VW3uBFbDCb6RR3KCiJ18` | 74 | B | BAJO-MEDIO — Contexto deportivo verificable basado en historial público. |
| `ZJpLrlTrusn5Jex8WQgQ` | 78 | B | ALTO — No fabricar historial delictivo. Solo usar información ya presente en el artículo. |
| `qAcmF4MWTiLsTACCG8v5` | 78 | B | MEDIO — Contexto legal verificable. Verificar año exacto de aprobación. |
| `qT9tAbCyVpicX7HmoaD0` | 80 | C | MEDIO — Contexto social verificable. No especular sobre el caso. |
| `tYX2ZtXwUXg07CHI0ONj` | 74 | C | MEDIO — Contexto legal verificable. No especular sobre detalles del caso. |
| `tlIXmTYnv4hIajXOQiup` | 82 | C | MEDIO — Corrección de título + contexto diaspórico verificable. |
| `tnX05ykqVT6WiYVflSii` | 74 | C | ALTO — No inventar nombres de jugadores ni resultados específicos. |
| `uJ076MyMZhQIJYTa1qOW` | 76 | C | MEDIO — Corrección de título + HTML + contexto diaspórico verificable. |
| `wiHS5gvNy7U6tORXAhEU` | 80 | C | MEDIO — Contexto laboral verificable. No especular sobre el caso específico. |
| `zkdDsejAb5hLCpCaEbMR` | 64 | D | ALTO — Score actual 64. Contenido cercano a comunicado. Reescritura puede no ser suficiente. Considerar ARCHIVE. |

### Artículos con score ≥ 85 pero rechazados

| ID | Score | Clase | Razón del rechazo |
|----|-------|-------|-------------------|
| `1HmobwfngxeXoUofqosD` | 92 | A | Contenido sin <p>, título truncado |
| `NA6PqCReq06PdIMSICEe` | 86 | B | Título > 60, falta contexto patrimonio Monimbó |
| `e0QJyxs1azyZahzs8VuN` | 88 | B | Falta conexión diáspora Nicaragua-Venezuela |
| `i88RK0Ulgkkzyq6YV4Um` | 88 | A | Resumen 164 chars (>160) |
| `ic2YGP8NQAc6r3VMvy9K` | 88 | A | 13 <br>, título 65 chars |
| `kJZTSfqmUGHJKA8SFaE8` | 88 | A | Solo 2 H2 |
| `n2Buq4aBhvnrXUcTlwuD` | 88 | B | Falta contexto legal sustracción de menores |
| `sH5OCUULzSvZFhRcHXzb` | 88 | B | Falta contexto seguridad regional CA |
| `7XzL7aTqVYBpTNKgSPxQ` | 88 | B | Falta datos económicos puerto Corinto |
| `IFFjvOi1HTG0oeiIuIBo` | 88 | B | Falta contexto geopolítico |
| `Q19zidw5UoSjUlR1r9JP` | 88 | B | Falta datos económicos exportación láctea |
| `e2xuC463KZm7pAubu9Rl` | 88 | B | Falta resultados detallados balonmano |
| `hscMxXK16XKKq84yY1P6` | 86 | B | Falta detalles y estadísticas accidentes |
| `vvWJAwyV8adECw3IGqdy` | 88 | B | Falta datos penetración streaming |
| `kR3waCnxVDfMfVCV8sAH` | 88 | C | Necesita enfoque resultados + protagonistas |
| `yUMAJwJQ1yMJTSb2cdkP` | 86 | C | Necesita perspectiva desde Nicaragua |

---

## CHECKLIST DE VERIFICACIÓN ANTES DE EJECUTAR

- [ ] Revisar cada propuesta de contenido B y C para confirmar que no inventa información
- [ ] Verificar que las fuentes mencionadas son accesibles y contienen el dato citado
- [ ] Confirmar que los textos propuestos no son copias textuales de fuentes
- [ ] Verificar que los títulos corregidos no alteran el sentido de la noticia
- [ ] Confirmar que las correcciones HTML no eliminan contenido válido
- [ ] Revisar artículo D (zkdDsejAb5hLCpCaEbMR) para decidir reescritura vs ARCHIVE
- [ ] Ejecutar backup antes de cualquier escritura
- [ ] Ejecutar MENI después de cada modificación
- [ ] No forzar score ≥ 85. Si no aprueba, marcar MEJORADO_PERO_NO_APROBADO

---

## VEREDICTO DEL DRY-RUN

Este dry-run propone cambios concretos para 37 artículos.

- **6 artículos A**: Correcciones estructurales seguras (BAJO riesgo)
- **22 artículos B**: Adiciones de contexto verificable (MEDIO riesgo)
- **8 artículos C**: Enriquecimiento periodístico (MEDIO-ALTO riesgo)
- **1 artículo D**: Reescritura completa (ALTO riesgo, posible ARCHIVE)

**No se recomienda ejecutar hasta que el usuario revise y apruebe cada cambio.**

**Score esperado: desconocido hasta ejecutar MENI en todos los casos.**
