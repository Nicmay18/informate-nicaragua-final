# VALIDACIÓN AUDITOR REAL MENI — 10 NOTICIAS

## Metodología

1. Se seleccionaron 5 noticias con score MENI más alto y 5 con score MENI más bajo de las 227 analizadas.
2. Se leyó el contenido real desde Firebase Firestore.
3. Se ejecutó `runMeniAsync` del motor MENI sin modificaciones.
4. Se registraron slugs, títulos, palabras, categorías y score final.
5. Se extrajeron variables: utilidad, originalidad, EEAT, profundidad, contexto, aporte propio y riesgo AdSense.
6. Se vinculó cada puntuación con una frase concreta del texto.

## Fórmula de evaluación

MENI ejecuta submotores especializados. Cada uno devuelve un score 0-100:

- `auditoria.utilidad` = utilidad para el lector.
- `auditoria.originalidad` = originalidad y aporte propio.
- `auditoria.redaccion` = profundidad periodística.
- `auditoria.experienciaLector` = contexto y satisfacción de búsqueda.
- `eeat.score` = autoridad, fuentes y confianza.
- `adsense.score` = riesgo de contenido para AdSense.
- `valorEditorial.aportePropio` y `items` = aporte propio Nicaragua Informate.

El `scoreFinal` es el resultado ponderado del `editorial-brain` según umbrales por categoría y tier detectado.

## Resultados por noticia

### 1. noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de

**Título actual:** Noruega vuelve a octavos del Mundial tras 28 años de ausencia
**Palabras:** 398
**Categoría:** Deportes
**Score MENI actual:** 100
**Calificación:** PUBLICABLE ORO

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | La selección de Noruega derrotó 2-1 a Costa de Marfil este martes 30 de junio en los dieciseisavos de final de la Copa Mundial 2026 en el AT&T Stadium de Arlington , Texas, Estados Unidos. |
| Originalidad | 100 | Sin aporte propio claro. Sin datos distintivos |
| Profundidad | 100 | El técnico Ståle Solbakken señaló en conferencia de prensa que la presencia de Haaland cambió la dinámica del equipo en la fase de grupos. |
| Contexto | 93 | La FIFA confirmó que el partido iniciará a las 14:00 horas , tiempo del este de Estados Unidos. |
| EEAT | 100 | Autor: José Luis López Ramírez; Fuentes: ninguna |
| Aporte propio NI | No | Sin items diferenciadores |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (6 puntos a favor, 1 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Valor noticioso medio (61/100)
- El lector aprenderá algo nuevo
- Diferenciación del 77% frente a competencia
- La nota ayuda al lector
- Faltan 9 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 2. mundial-2026-sorpresas-favoritos-y-como-se-vive-en-nicaragua

**Título actual:** Mundial 2026: sorpresas, favoritos y cómo se vive en Nicaragua
**Palabras:** 460
**Categoría:** Deportes
**Score MENI actual:** 100
**Calificación:** PUBLICABLE ORO

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | El Mundial 2026 cerró su fase de grupos este sábado 27 de junio y este domingo arranca la ronda de dieciseisavos de final con el primer cruce eliminatorio en Los Ángeles. |
| Originalidad | 100 | Sin aporte propio claro. Sin datos distintivos |
| Profundidad | 100 | Con 48 equipos hay más margen para que equipos chicos hagan daño", dijo un aficionado nicaragüense que sigue el torneo desde Managua y prefirió no dar su nombre. |
| Contexto | 93 | La fiebre mundialista se siente en los hogares nicaragüenses, donde las reuniones frente al televisor se convirtieron en el formato preferido para seguir el torneo desde que arrancó el 11 de junio. |
| EEAT | 100 | Autor: Keyling Elieth Rivera Muñoz; Fuentes: autoridad |
| Aporte propio NI | No | organización editorial |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (6 puntos a favor, 1 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Alto valor noticioso (76/100)
- El lector aprenderá algo nuevo
- Diferenciación del 87% frente a competencia
- La nota ayuda al lector
- Faltan 5 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 3. messi-iguala-record-historico-de-16-goles-en-mundiales

**Título actual:** Messi iguala récord histórico de 16 goles en Mundiales
**Palabras:** 731
**Categoría:** Deportes
**Score MENI actual:** 100
**Calificación:** PUBLICABLE ORO

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | Lionel Messi alcanzó los 16 goles en Copas del Mundo tras marcar tres veces en la victoria de Argentina por 3-0 sobre Argelia durante la fase de grupos del Mundial 2026 . |
| Originalidad | 100 | Sin aporte propio claro. El hat-trick le permitió llegar a 16 y alcanzar la cifra establecida por Klose durante sus participaciones con Alemania entre 2002 y 2014. |
| Profundidad | 100 | Sin citas o contexto |
| Contexto | 93 | Sebastián Sawe rompe barrera de 2 horas en maratón |
| EEAT | 100 | Autor: Maycol Josué Nicaragua Rivas; Fuentes: oficiales |
| Aporte propio NI | No | Sin items diferenciadores |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (6 puntos a favor, 1 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Valor noticioso medio (65/100)
- El lector aprenderá algo nuevo
- Diferenciación del 87% frente a competencia
- La nota ayuda al lector
- Faltan 3 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 4. nicaragua-en-santo-domingo-2026-medallas-beisbol-y-retos

**Título actual:** Nicaragua en Santo Domingo 2026: medallas, béisbol y retos
**Palabras:** 865
**Categoría:** Deportes
**Score MENI actual:** 100
**Calificación:** PUBLICABLE ORO

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | Nicaragua continúa su participación en los XXV Juegos Centroamericanos y del Caribe Santo Domingo 2026 con una delegación nacional integrada por 204 personas y presencia en 21 disciplinas deportivas. |
| Originalidad | 100 | Aporte propio detectado. Delegación nicaragüense en Santo Domingo 2026 Nicaragua participa en los Juegos Centroamericanos y del Caribe Santo Domingo 2026 con una delegación conformada por: 148 atletas 35 entrenadores 19 delegados 2 oficiales En total, son 204 integrantes que |
| Profundidad | 100 | Cierre defensivo: Colombia logró descontar una carrera, pero el relevista Kenword Burton controló el cierre del partido y aseguró la victoria nicaragüense. |
| Contexto | 93 | La competencia continuará hasta el 9 de agosto , fecha en la que Nicaragua buscará cerrar su participación con nuevos logros deportivos. |
| EEAT | 100 | Autor: Maycol Josué Nicaragua Rivas; Fuentes: oficiales |
| Aporte propio NI | Sí | marca propia |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (6 puntos a favor, 1 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Valor noticioso medio (63/100)
- El lector aprenderá algo nuevo
- Diferenciación del 97% frente a competencia
- La nota ayuda al lector
- Faltan 4 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 5. investigan-ataque-en-el-riguero-que-hirio-a-nino-de-10-ano

**Título actual:** Investigan ataque en El Riguero que hirió a niño de 10 año.
**Palabras:** 1014
**Categoría:** Sucesos
**Score MENI actual:** 100
**Calificación:** PUBLICABLE ORO

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | La herida de un niño de 10 años convirtió un enfrentamiento ocurrido ayer en el barrio El Riguero , en Managua, en un caso que ahora busca explicar algo más que el momento del disparo: cómo una situación entre adultos terminó afectando a una persona que no formaba parte del conflicto. |
| Originalidad | 100 | Aporte propio detectado. Sin datos distintivos |
| Profundidad | 100 | Según la información conocida por Nicaragua Informate, el niño fue sometido a una intervención quirúrgica anoche y permanece bajo vigilancia médica mientras los especialistas evalúan su evolución. |
| Contexto | 93 | Nicaragua Informate mantendrá seguimiento sobre la evolución médica del niño y sobre los avances oficiales relacionados con el caso ocurrido en el barrio El Riguero, Managua. |
| EEAT | 100 | Autor: Keyling Elieth Rivera Muñoz; Fuentes: Hospital, autoridades, Policía Nacional, oficiales |
| Aporte propio NI | Sí | marca propia; cobertura editorial múltiple |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (6 puntos a favor, 1 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Alto valor noticioso (80/100)
- El lector aprenderá algo nuevo
- Diferenciación del 100% frente a competencia
- La nota ayuda al lector
- Faltan 4 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 6. colapsa-vivienda-ancestral-en-monimbo-masaya-familia-de-7-ilesa

**Título actual:** Colapsa vivienda ancestral en Monimbó, Masaya: familia de 7 ilesa
**Palabras:** 2196
**Categoría:** Sucesos
**Score MENI actual:** 82
**Calificación:** MEJORAR

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | MONIMBÓ / MASAYA — Siete miembros de una misma familia, entre ellos dos adultos mayores, resultaron ilesos tras el colapso parcial de su vivienda de estructura ancestral la noche de este martes en la segunda etapa del Reparto El Corozal, en el histórico barrio de Monimbó, Masaya . |
| Originalidad | 100 | Aporte propio detectado. Sin datos distintivos |
| Profundidad | 100 | "Ya le dijimos a la delegada que venga a ver, pero solo nos dijeron que esperáramos" , comentó un residente cercano a la vivienda colapsada. |
| Contexto | 93 | Recursos y prevención Instituciones de contacto: Policía Nacional: 118 (emergencias) Cruz Blanca: 128 (ambulancias) Bomberos Unidos: 115 (emergencias) Nicaragua Informate actualizará esta información si las autoridades competentes emiten comunicado oficial. |
| EEAT | 100 | Autor: Keyling Elieth Rivera Muñoz; Fuentes: Bomberos, Policía, Alcaldía, COMUPRED, Policía Nacional, Autoridades, Cruz Roja, autoridades |
| Aporte propio NI | Sí | marca propia; cobertura editorial múltiple |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (6 puntos a favor, 1 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Alto valor noticioso (88/100)
- El lector aprenderá algo nuevo
- Diferenciación del 100% frente a competencia
- La nota ayuda al lector
- Faltan 9 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 7. campeonato-de-1-4-de-milla-adrenalina-y-tecnica-en-managua

**Título actual:** Campeonato de 1/4 de Milla: Adrenalina y técnica en Managua
**Palabras:** 409
**Categoría:** Deportes
**Score MENI actual:** 74
**Calificación:** NO PUBLICAR

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | La cuarta fecha del Campeonato Nacional de Motociclismo y Automovilismo se efectuó este domingo 21 de junio en la Pista Villa Sol, Managua . |
| Originalidad | 100 | Sin aporte propio claro. Sin datos distintivos |
| Profundidad | 97 | Por su parte, el competidor Julio César Urbina afirmó que la competencia se desarrolla bajo medidas de seguridad normadas, lo que permite la obtención de registros oficiales. |
| Contexto | 93 | Competición: Registros de pista y declaraciones de los pilotos Roberto Carlos Pasquier y Julio César Urbina. |
| EEAT | 100 | Autor: Maycol Josué Nicaragua Rivas; Fuentes: oficiales |
| Aporte propio NI | No | Sin items diferenciadores |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (5 puntos a favor, 2 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Valor noticioso bajo (50/100)
- El lector aprenderá algo nuevo
- Diferenciación del 67% frente a competencia
- La nota ayuda al lector
- Faltan 12 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 8. espana-francia-y-argentina-llegan-como-favoritas-al-mundial-2026

**Título actual:** España, Francia y Argentina son favoritas al Mundial 2026
**Palabras:** 743
**Categoría:** Deportes
**Score MENI actual:** 74
**Calificación:** NO PUBLICAR

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | Modelos estadísticos y analítica de datos en el arranque de la Copa del Mundo Las proyecciones ejecutadas por superordenadores de análisis estadístico y modelos avanzados de inteligencia artificial coinciden en colocar a las selecciones de España , Francia y Argentina al frente de los pronósticos pa |
| Originalidad | 100 | Sin aporte propio claro. Sin datos distintivos |
| Profundidad | 100 | Sin citas o contexto |
| Contexto | 93 | También te puede interesar Luka Modrić recibe tratamiento y club evalúa recuperación Luca Zidane recibe atención médica; club evalúa recuperación Messi iguala récord histórico de 16 goles en Mundiales |
| EEAT | 100 | Autor: Maycol Josué Nicaragua Rivas; Fuentes: oficiales |
| Aporte propio NI | No | organización editorial |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (6 puntos a favor, 1 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Valor noticioso medio (72/100)
- El lector aprenderá algo nuevo
- Diferenciación del 67% frente a competencia
- La nota ayuda al lector
- Faltan 8 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 9. polemica-en-el-mundial-no-frena-reconocimiento-a-tatiana

**Título actual:** Polémica en el Mundial no frena reconocimiento a Tatiana Guzmán
**Palabras:** 385
**Categoría:** Deportes
**Score MENI actual:** 74
**Calificación:** NO PUBLICAR

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | La árbitro nicaragüense Tatiana Auxiliadora Guzmán Arguello , de 38 años, se convirtió en el nombre más mencionado del Mundial 2026 tras anular desde el VAR el gol que habría clasificado a Alemania este lunes 29 de junio en el Gillette Stadium de Boston , Estados Unidos. |
| Originalidad | 100 | Sin aporte propio claro. Sin datos distintivos |
| Profundidad | 100 | Jürgen Klopp , exentrenador del Liverpool, señaló desde la transmisión oficial que jugadas similares ocurren en la Premier League sin ser sancionadas. |
| Contexto | 93 | El anuncio de la Copresidenta Rosario Murillo llega mientras el nombre de Guzmán encabeza titulares en todo el mundo. |
| EEAT | 100 | Autor: Keyling Elieth Rivera Muñoz; Fuentes: Ministerio |
| Aporte propio NI | No | Sin items diferenciadores |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (6 puntos a favor, 1 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Valor noticioso medio (56/100)
- El lector aprenderá algo nuevo
- Diferenciación del 67% frente a competencia
- La nota ayuda al lector
- Faltan 11 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

### 10. beisbol-infantil-nicaragua-viaja-a-puerto-rico-y

**Título actual:** Beisbol infantil: Nicaragua viaja a Puerto Rico y Ecuador
**Palabras:** 633
**Categoría:** Deportes
**Score MENI actual:** 74
**Calificación:** NO PUBLICAR

#### Variables MENI

| Variable | Score | Evidencia textual |
| ---- | ---- | ---- |
| Utilidad para lector | 100 | MANAGUA / NICARAGUA — La seleccion de beisbol categoria Minor , integrada por 12 atletas de 9 y 10 años , viajo este fin de semana a Loiza, Puerto Rico , para competir en la Serie Latinoamericana y del Caribe de Pequenas Ligas , que se disputara del 25 de junio al 3 de julio . |
| Originalidad | 100 | Aporte propio detectado. "Nuestros atletas, entrenadores y familias nicaraguenses estan seguros de que hay apoyo y respaldo total para nuestros deportistas." — Dirigente deportivo Tras el abanderamiento Los peloteros menores competiran en Puerto Rico ante representaciones de |
| Profundidad | 100 | Los dos viajes Segun informacion de las autoridades deportivas, tambien partio la seleccion Senior , conformada por 17 peloteros de 15 y 16 años del departamento de Rivas . |
| Contexto | 93 | Para muchos de estos niños, la experiencia de representar a Nicaragua en el extranjero constituye un momento de gran orgullo personal y familiar, y representa una motivación para continuar su desarrollo deportivo con la aspiración de alcanzar algún día el béisbol profesional, siguiendo los pasos de  |
| EEAT | 100 | Autor: José Luis López Ramírez; Fuentes: autoridades, oficiales |
| Aporte propio NI | Sí | cobertura editorial múltiple |
| Riesgo AdSense | 100 | Sin advertencias |

#### Diagnóstico

Esta nota tiene potencial (5 puntos a favor, 2 en contra). Con 2 mejora(s) puede ser una nota sólida de Nicaragua Informate.

#### Qué falta / qué cambio aumentaría el valor

- Valor noticioso bajo (52/100)
- El lector aprenderá algo nuevo
- Diferenciación del 67% frente a competencia
- La nota ayuda al lector
- Faltan 8 respuestas
- 3 explicaciones de servicio
- Reader Journey con 3 puntos de aprendizaje

## Comparación: noticia de alto valor vs noticia de bajo valor

### Alto valor: noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de

- **Score MENI:** 100
- **Palabras:** 398
- **Variables clave:** utilidad: 100 | originalidad: 100 | redaccion: 100 | experienciaLector: 93 | eeat: 100 | adsense: 100
- **Evidencia:** La selección de Noruega derrotó 2-1 a Costa de Marfil este martes 30 de junio en los dieciseisavos de final de la Copa Mundial 2026 en el AT&T Stadium de Arlington , Texas, Estados Unidos.

### Bajo valor: beisbol-infantil-nicaragua-viaja-a-puerto-rico-y

- **Score MENI:** 74
- **Palabras:** 633
- **Variables clave:** utilidad: 100 | originalidad: 100 | redaccion: 100 | experienciaLector: 93 | eeat: 100 | adsense: 100
- **Evidencia:** MANAGUA / NICARAGUA — La seleccion de beisbol categoria Minor , integrada por 12 atletas de 9 y 10 años , viajo este fin de semana a Loiza, Puerto Rico , para competir en la Serie Latinoamericana y del Caribe de Pequenas Ligas , que se disputara del 25 de junio al 3 de julio .

### Contraste

La noticia de alto valor presenta mejor puntuación y contexto verificable. La noticia de bajo valor se limita a un hecho aislado: MANAGUA / NICARAGUA — La seleccion de beisbol categoria Minor , integrada por 12 atletas de 9 y 10 años , viajo este fin de semana a Loiza, Puerto Rico , para competir en la Serie Latinoamericana y del Caribe de Pequenas Ligas , que se disputara del 25 de junio al 3 de julio .. El cambio concreto que aumentaría el valor de la segunda es agregar cobertura editorial múltiple para responder la intención del lector.

## Conclusión

MENI ejecuta un análisis repetible: lee el contenido real, evalúa variables concretas y devuelve score, calificación y acciones. La trazabilidad de cada puntuación está en las variables, advertencias y evidencias del texto.
