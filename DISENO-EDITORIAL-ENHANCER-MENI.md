# DISEÑO DEL MOTOR DE CIRUGÍA EDITORIAL MENI

## Resumen de validación

La validación demostró lo siguiente:

- MENI analiza correctamente y con trazabilidad.
- `autoCorrectNoticia` mejora SEO técnico: título, resumen, `<strong>`, `<h2>`, keywords.
- `autoCorrectNoticia` no aumenta el valor editorial real.
- Subir el score no es lo mismo que mejorar una noticia.

Por eso se propone un nuevo módulo separado: `editorialEnhancer`.

## Arquitectura propuesta

```
MENI detecta → editorialEnhancer propone → periodista decide → MENI vuelve a medir
```

| Módulo | Responsabilidad |
| ---- | ---- |
| MENI | Auditar, medir, trazar puntuaciones. |
| autoCorrectNoticia | Optimizar SEO técnico sin inventar contenido. |
| editorialEnhancer | Proponer mejoras editoriales de valor real por categoría. |

## Principios del editorialEnhancer

1. No corrige HTML.
2. No corrige SEO.
3. No inventa datos.
4. No rellena palabras.
5. No modifica el texto directamente.
6. Hace preguntas editoriales al periodista.
7. Muestra qué información falta para que la noticia tenga valor.
8. Sugiere secciones a redactar manualmente.
9. Señala riesgos de inventar información.
10. Está dividido por categoría porque cada una exige una lógica distinta.

## Estructura del módulo

Cada categoría define:

- Preguntas que la noticia debe responder.
- Información faltante que eleva valor.
- Secciones recomendadas a agregar.
- Riesgos de inventar información.
- Ejemplo de transformación: noticia básica → noticia con valor agregado.

---

## 1. SUCESOS

### Preguntas que debe responder la noticia

- ¿Qué ocurrió?
- ¿Dónde ocurrió?
- ¿Cuándo ocurrió?
- ¿Quiénes estuvieron involucrados?
- ¿Qué hicieron las autoridades?
- ¿Qué investiga la autoridad competente?
- ¿Qué consecuencias tiene para la comunidad?
- ¿Qué debe saber una familia o persona expuesta a un riesgo similar?
- ¿Qué marco legal o institucional aplica?
- ¿Qué preguntas quedan sin responder?

### Información faltante que eleva valor

- Cronología confirmada del hecho.
- Actuación de autoridades.
- Declaración atribuida de una fuente oficial.
- Contexto social del sector o barrio.
- Marco legal aplicable.
- Información de prevención.
- Datos sobre atención a víctimas.

### Secciones recomendadas

1. Qué ocurrió.
2. Cuándo y dónde ocurrió.
3. Actuación de autoridades.
4. Contexto social.
5. Marco legal o prevención.
6. Qué se sabe y qué falta confirmar.

### Riesgos de inventar información

- No nombrar presuntos responsables sin sentencia.
- No afirmar causas no confirmadas.
- No inventar declaraciones de autoridades.
- No especular con edades, nombres de menores ni identidades de víctimas.
- No inventar datos de lugares u horas exactas sin fuente.

### Ejemplo de transformación

**Antes:**

> Una persona murió en un accidente en Managua. La policía investiga.

**Después:**

> Una persona falleció la mañana del jueves en un accidente de tránsito registrado en la carretera Norte de Managua. El Cuerpo de Bomberos atendió la emergencia y trasladó al herido al hospital más cercano, donde confirmaron el deceso. La Policía Nacional indicó que el percance ocurrió por exceso de velocidad y que el caso quedó en manos de la autoridad competente. Se conoce la edad de la víctima, pero su identidad no fue revelada mientras se notifica a la familia. El exceso de velocidad es una de las principales causas de siniestros viales en Nicaragua, según datos de la Dirección de Tránsito Nacional.

---

## 2. NACIONALES

### Preguntas que debe responder la noticia

- ¿Por qué importa esta noticia?
- ¿A quién afecta directamente?
- ¿Qué cambia para el ciudadano?
- ¿Qué institución tomó la decisión?
- ¿Qué datos oficiales respaldan la información?
- ¿Hay cifras comparativas o históricas?
- ¿Qué antecedentes tiene este anuncio o decisión?
- ¿Qué sigue después?

### Información faltante que eleva valor

- Nombre de la institución o autoridad.
- Dato oficial.
- Cifra comparativa.
- Impacto ciudadano concreto.
- Antecedente verificable.
- Fecha de entrada en vigor o plazo.

### Secciones recomendadas

1. Qué se anunció o decidió.
2. Quién lo anunció.
3. Impacto ciudadano.
4. Datos oficiales.
5. Antecedentes.
6. Qué sigue.

### Riesgos de inventar información

- No atribuir declaraciones a instituciones.
- No anticipar fechas no confirmadas.
- No inventar cifras de impacto.
- No afirmar consecuencias sin evidencia.

### Ejemplo de transformación

**Antes:**

> El gobierno anunció un bono para familias. Se entregará en los próximos días.

**Después:**

> El Ministerio de la Familia anunció un bono de 1.500 córdobas para familias en situación vulnerable. La medida afecta a 120.000 hogares, según el registro oficial del programa. El pago comenzará el 15 de agosto y se realizará a través de los bancos del sistema. En 2024 se entregó un bono similar de 1.000 córdobas, según datos del mismo ministerio. Las familias interesadas deben verificar si ya están inscritas en el padrón del programa.

---

## 3. INTERNACIONALES

### Preguntas que debe responder la noticia

- ¿Qué pasó y dónde?
- ¿Por qué importa a Nicaragua?
- ¿Afecta a nicaragüenses en el exterior?
- ¿Hay impacto económico, migratorio o social para Nicaragua?
- ¿Qué posición o acción ha tomado Nicaragua o la región?
- ¿Cuál es el contexto regional?
- ¿Qué consecuencias a corto plazo podría tener?

### Información faltante que eleva valor

- Conexión con Nicaragua.
- Dato sobre población afectada en la región.
- Declaración de autoridad nicaragüense o centroamericana.
- Contexto de relación bilateral.
- Cifra de comercio, migración o remesas si aplica.

### Secciones recomendadas

1. Qué ocurrió en el país o región afectada.
2. Contexto internacional.
3. Impacto para Nicaragua.
4. Reacción regional.
5. Consecuencias esperadas.

### Riesgos de inventar información

- No afirmar acciones de Nicaragua sin comunicado oficial.
- No inventar cifras de afectados nicaragüenses.
- No extrapolar consecuencias sin base.
- No confundir declaraciones de otros países con posición de Nicaragua.

### Ejemplo de transformación

**Antes:**

> España regularizó a un millón de extranjeros. Esto afecta a migrantes.

**Después:**

> España aprobó la regularización de 1.050.000 extranjeros, una medida que podría beneficiar a miles de nicaragüenses que residen de forma irregular en ese país. Según datos del Instituto Nacional de Estadística español, más de 20.000 nicaragüenses viven en España. La medida exige haber residido al menos tres años en el país. En Centroamérica, Guatemala y Honduras han anunciado que monitorearán el impacto migratorio. Nicaragua no emitió un comunicado oficial hasta el cierre de esta nota.

---

## 4. DEPORTES

### Preguntas que debe responder la noticia

- ¿Quién es el protagonista?
- ¿Qué logró?
- ¿Cuál es su trayectoria?
- ¿Por qué este logro es importante?
- ¿Qué significa para Nicaragua?
- ¿Qué antecedentes deportivos tiene el evento?
- ¿Qué viene ahora?

### Información faltante que eleva valor

- Edad, trayectoria y club del protagonista.
- Dato histórico del torneo o selección.
- Estadística del evento.
- Reacción de entrenador o federación.
- Significado para Nicaragua.

### Secciones recomendadas

1. Resultado o logro.
2. Perfil del protagonista.
3. Trayectoria.
4. Importancia histórica.
5. Significado para Nicaragua.
6. Siguiente paso.

### Riesgos de inventar información

- No inventar estadísticas del jugador.
- No afirmar fichajes o contratos no confirmados.
- No exagerar el impacto sin evidencia.
- No inventar declaraciones del cuerpo técnico.

### Ejemplo de transformación

**Antes:**

> Nicaragua ganó un partido de béisbol. El pitcher fue figura.

**Después:**

> Nicaragua venció 3-1 a Puerto Rico en el Premundial de Béisbol. El pitcher Juan Cruz, de 22 años y actual jugador de un equipo local de Managua, lanzó seis entradas sin permitir carreras. Cruz debutó con la selección absoluta en 2024 y en este torneo acumula 15 ponches en 12 entradas. Es la segunda victoria de Nicaragua sobre Puerto Rico en la historia del certamen, según registros de la Confederación Panamericana de Béisbol. El próximo partido define el boleto al Mundial.

---

## 5. CULTURA

### Preguntas que debe responder la noticia

- ¿Qué evento, obra o homenaje se reporta?
- ¿Cuál es la historia o tradición detrás?
- ¿Por qué es relevante para Nicaragua?
- ¿Qué artistas o instituciones están involucrados?
- ¿Qué público asiste o se beneficia?
- ¿Qué aporta al patrimonio cultural?

### Información faltante que eleva valor

- Contexto histórico del evento o artista.
- Institución organizadora.
- Trayectoria de los protagonistas.
- Relevancia local.
- Datos de asistencia o ediciones anteriores.

### Secciones recomendadas

1. Qué ocurrió o se presentó.
2. Historia o tradición.
3. Protagonistas.
4. Relevancia nacional.
5. Instituciones involucradas.

### Riesgos de inventar información

- No inventar biografías de artistas.
- No afirmar datos de asistencia sin fuente.
- No confundir ediciones o fechas.
- No extrapolar importancia sin evidencia.

### Ejemplo de transformación

**Antes:**

> Se presentó una obra de teatro en Managua. El público aplaudió.

**Después:**

> Se presentó en Managua la obra "La casa de Bernarda Alba" en una versión nicaragüense dirigida por la compañía Teatro Popular Nicaragüense. La puesta en escena forma parte del programa de fiestas patrias del Ministerio de Cultura. La compañía, fundada en 1985, ha montado más de 40 obras sobre textos universales con elenco local. La función contó con entrada gratuita y se realiza en el Teatro Nacional Rubén Darío.

---

## 6. TECNOLOGÍA

### Preguntas que debe responder la noticia

- ¿Qué tecnología se reporta?
- ¿Cómo funciona en términos sencillos?
- ¿Para quién es útil?
- ¿Qué cambia para el usuario común?
- ¿Qué beneficios y riesgos tiene?
- ¿Hay disponibilidad en Nicaragua?
- ¿Qué datos oficiales o de mercado respaldan el anuncio?

### Información faltante que eleva valor

- Explicación sencilla del funcionamiento.
- Caso de uso real.
- Beneficio y riesgo documentado.
- Disponibilidad o precio en Nicaragua.
- Comparación con tecnología anterior.

### Secciones recomendadas

1. Qué es la tecnología.
2. Cómo funciona.
3. Para quién es útil.
4. Beneficios y riesgos.
5. Disponibilidad en Nicaragua.

### Riesgos de inventar información

- No inventar especificaciones técnicas.
- No afirmar precios o fechas de lanzamiento sin fuente.
- No confundir funciones de productos similares.
- No exagerar beneficios sin evidencia.

### Ejemplo de transformación

**Antes:**

> Lanzaron una nueva IA. Ayuda a hacer tareas.

**Después:**

> La empresa lanzó una IA que permite automatizar respuestas de correos y resúmenes de documentos. La herramienta funciona conectándose a cuentas de correo y generando borradores a partir de indicaciones escritas. Según la compañía, reduce el tiempo de lectura de correos en un 30%. El servicio costará 20 dólares al mes y estará disponible en Nicaragua a partir de octubre. Usuarios de pymes consultadas por el medio indican que la principal duda es si la herramienta maneja español nicaragüense con precisión.

---

## Cómo se conecta con MENI

1. MENI audita una noticia y devuelve score, problemas y trazabilidad.
2. `autoCorrectNoticia` corrige SEO técnico.
3. `editorialEnhancer` recibe el `MeniResult` y la categoría.
4. `editorialEnhancer` genera un plan con las preguntas y secciones recomendadas.
5. El periodista decide qué agregar, sin inventar datos.
6. La noticia editada vuelve a MENI para nueva medición.

## Límites del módulo

- `editorialEnhancer` no escribe párrafos.
- No reemplaza al periodista.
- No garantiza un score alto: solo estructura el trabajo editorial.
- La mejora final depende de datos verificables que el periodista consiga.

## Criterio de éxito

Una noticia editada con el apoyo de `editorialEnhancer` debe poder responder:

> "Si un lector llega desde Google, ¿encuentra algo que no obtiene en cualquier otro medio?"

---
