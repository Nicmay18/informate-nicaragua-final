# FORENSIC EDITORIAL QUEUE — FASE 16
## Cola de intervención editorial para 37 artículos
## Fecha: 2026-08-12 (corregido 2026-08-12)

---

## METODOLOGÍA

Cada artículo fue clasificado según el tipo de intervención necesaria:

- **A — Corrección simple**: Estructura, HTML, redundancias, título, resumen, datelines. Sin contenido nuevo.
- **B — Contexto verificable**: Necesita datos verificables con fuente (antecedentes, cronología, institución, ubicación).
- **C — Enriquecimiento periodístico**: Necesita capa periodística (hecho + contexto + explicación + utilidad).
- **D — Reescritura**: Contenido cercano a comunicado, mal estructurado, superficial. Reescritura completa.
- **E — No rescatable**: No existe suficiente información confiable. Marcar NO_RESCATABLE.

NO se inventa información. Cada artículo indica qué fuente sería necesaria.

---

## CLASIFICACIÓN A — CORRECCIÓN SIMPLE (6 artículos)

Correcciones de estructura, HTML, título, resumen. No requiere contenido nuevo.

### 1. Primeros bebés del Día de las Madres nacen en hospitales de…
| Campo | Valor |
|-------|-------|
| **ID** | `1HmobwfngxeXoUofqosD` |
| **Score** | 92 |
| **Aprobado** | false |
| **Palabras** | 572 |
| **Problema** | Contenido sin envolver en `<p>`. Título truncado con "…". |
| **Qué falta** | Envolver texto en `<p>`. Corregir título: "Primeros bebés del Día de las Madres nacen en hospitales de Managua" (59 chars). |
| **Fuente** | N/A — corrección estructural |
| **Intervención** | A — Corrección simple |

### 2. Capturan acusado de agredir a un hombre en Rivas
| Campo | Valor |
|-------|-------|
| **ID** | `JOfOW7uTxkgDSIezo7Wn` |
| **Score** | 84 |
| **Aprobado** | false |
| **Palabras** | 2201 |
| **Problema** | 7 tags `<br>` usados como separadores de párrafo en lugar de `<p>`. |
| **Qué falta** | Reemplazar `<br>` por cierre/apertura de `<p>`. Mantener contenido intacto. |
| **Fuente** | N/A — corrección estructural |
| **Intervención** | A — Corrección simple |

### 3. Chinandega estrena 75 viviendas con servicios completos
| Campo | Valor |
|-------|-------|
| **ID** | `i88RK0Ulgkkzyq6YV4Um` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 397 |
| **Problema** | Resumen de 164 caracteres (límite 160). |
| **Qué falta** | Acortar resumen a ≤160 chars. |
| **Fuente** | N/A — corrección de resumen |
| **Intervención** | A — Corrección simple |

### 4. Venezuela: réplicas continúan con 920 víctimas y miles sin rastro
| Campo | Valor |
|-------|-------|
| **ID** | `ic2YGP8NQAc6r3VMvy9K` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 463 |
| **Problema** | 13 tags `<br>` como separadores. Solo 2 tags `<p>`. Título de 65 chars. |
| **Qué falta** | Reemplazar `<br>` por `</p><p>`. Título: "Venezuela: 920 víctimas y miles sin rastro tras sismos" (54 chars). |
| **Fuente** | N/A — corrección estructural |
| **Intervención** | A — Corrección simple |

### 5. Julieta Venegas interpreta himno cultural del Mundial 2026
| Campo | Valor |
|-------|-------|
| **ID** | `kJZTSfqmUGHJKA8SFaE8` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 375 |
| **Problema** | Solo 2 subtítulos H2 (mínimo recomendado: 3-4). |
| **Qué falta** | Agregar 1-2 H2 adicionales dividiendo secciones existentes. No agregar contenido nuevo. |
| **Fuente** | N/A — corrección estructural |
| **Intervención** | A — Corrección simple |

### 6. Campeonato de 1/4 de Milla: Adrenalina y técnica en Managua
| Campo | Valor |
|-------|-------|
| **ID** | `Ilzcy77tyF8oFNPytokN` |
| **Score** | 74 |
| **Aprobado** | false |
| **Palabras** | 409 |
| **Problema** | Solo 1 H2. Score bajo (74). |
| **Qué falta** | Agregar 2-3 H2 dividiendo secciones existentes. No agregar contenido nuevo. |
| **Fuente** | N/A — corrección estructural |
| **Intervención** | A — Corrección simple (riesgo medio: score probablemente seguirá < 85 → MEJORADO_PERO_NO_APROBADO) |

---

## CLASIFICACIÓN B — CONTEXTO VERIFICABLE (22 artículos)

Necesita datos verificables agregados. Cada dato con fuente.

### 7. Nicaragüense sigue desaparecida tras terremotos en Venezuela
| Campo | Valor |
|-------|-------|
| **ID** | `CypRypZIGLckqywkZq8X` |
| **Score** | 74 |
| **Aprobado** | false |
| **Palabras** | 435 |
| **Problema** | Falta contexto sobre comunidad nicaragüense en Venezuela y relación histórica |
| **Qué falta** | Diáspora nicaragüense en Venezuela, relación diplomática, asistencia consular |
| **Fuente** | MIGOB — estimación de nicaragüenses en Venezuela (datos públicos) |
| **Intervención** | B — Agregar 50-75 palabras de contexto verificable |

### 8. Dos nicaragüenses fallecen en el extranjero en casos distintos
| Campo | Valor |
|-------|-------|
| **ID** | `D7y1TWAyXq7SaNMirIjB` |
| **Score** | 80 |
| **Aprobado** | false |
| **Palabras** | 388 |
| **Problema** | Falta contexto diáspora. Título > 60. |
| **Qué falta** | Contexto diáspora + corregir título |
| **Fuente** | MIGOB — connacionales en el exterior |
| **Intervención** | B — Corregir título + agregar contexto diáspora |

### 9. Dueño de semovientes paga C$769 mil por muerte en Jalapa
| Campo | Valor |
|-------|-------|
| **ID** | `EcKTeqT7kLcFElUX3DM2` |
| **Score** | 78 |
| **Aprobado** | false |
| **Palabras** | 377 |
| **Problema** | Falta contexto legal sobre responsabilidad civil por daños con semovientes |
| **Qué falta** | Marco normativo nicaragüense sobre responsabilidad por semovientes |
| **Fuente** | Código Civil de Nicaragua — responsabilidad por daños causados por animales |
| **Intervención** | B — Agregar contexto legal verificable |

### 10. Escolta de ULTRAVAL enfrenta juicio por robo en Managua
| Campo | Valor |
|-------|-------|
| **ID** | `F4UddilPobcIjIkZ1e55` |
| **Score** | 78 |
| **Aprobado** | false |
| **Palabras** | 718 |
| **Problema** | Falta contexto institucional sobre ULTRAVAL y impacto del robo en transporte |
| **Qué falta** | Qué es ULTRAVAL, función, impacto del robo en sistema de valores |
| **Fuente** | MTI — información pública sobre ULTRAVAL |
| **Intervención** | B — Agregar contexto institucional verificable |

### 11. Colapsa vivienda ancestral en Monimbó, Masaya: familia de 7 ilesa
| Campo | Valor |
|-------|-------|
| **ID** | `NA6PqCReq06PdIMSICEe` |
| **Score** | 86 |
| **Aprobado** | false |
| **Palabras** | 2196 |
| **Problema** | Título > 60. Falta contexto patrimonial sobre viviendas ancestrales en Monimbó. |
| **Qué falta** | Corregir título + contexto patrimonio Monimbó |
| **Fuente** | INC — patrimonio cultural de Masaya/Monimbó (información pública) |
| **Intervención** | B — Corregir título + agregar contexto patrimonial verificable |

### 12. Venezuela: 164 afectados y 30 mil desaparecidos tras sismos
| Campo | Valor |
|-------|-------|
| **ID** | `e0QJyxs1azyZahzs8VuN` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 448 |
| **Problema** | Falta conexión con Nicaragua (diáspora) |
| **Qué falta** | Conexión diáspora, asistencia consular |
| **Fuente** | MIGOB — nicaragüenses en Venezuela |
| **Intervención** | B — Agregar 50-75 palabras de contexto verificable |

### 13. Capturan a pinolero por llevarse a niña de 13 años
| Campo | Valor |
|-------|-------|
| **ID** | `n2Buq4aBhvnrXUcTlwuD` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 360 |
| **Problema** | Falta contexto legal sobre sustracción de menores |
| **Qué falta** | Marco normativo, tratados bilateral México-Nicaragua |
| **Fuente** | Código Penal — sustracción de menores; tratados internacionales |
| **Intervención** | B — Agregar contexto legal verificable |

### 14. Cinco agentes fallecen en operativo en Honduras
| Campo | Valor |
|-------|-------|
| **ID** | `sH5OCUULzSvZFhRcHXzb` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 608 |
| **Problema** | Falta contexto regional de seguridad centroamericana |
| **Qué falta** | Impacto en seguridad centroamericana, cooperación |
| **Fuente** | Policía Nacional — datos públicos de seguridad regional |
| **Intervención** | B — Agregar contexto regional verificable |

### 15. Puerto Corinto lidera llegada de 11 buques a Nicaragua
| Campo | Valor |
|-------|-------|
| **ID** | `7XzL7aTqVYBpTNKgSPxQ` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 500 |
| **Problema** | Falta datos económicos: tonelaje, valor de mercancías |
| **Qué falta** | Datos cuantitativos del puerto: tonelaje, comparación anual |
| **Fuente** | EPN — Empresa Portuaria Nacional (datos públicos) |
| **Intervención** | B — Agregar datos cuantitativos verificables |

### 16. Polémica en el Mundial no frena reconocimiento a Tatiana Guzmán
| Campo | Valor |
|-------|-------|
| **ID** | `GHbdyeiCzH7Jk0i5RVPA` |
| **Score** | 74 |
| **Aprobado** | false |
| **Palabras** | 385 |
| **Problema** | Falta contexto sobre Tatiana Guzmán y polémica. Título > 60. |
| **Qué falta** | Corregir título + biografía y contexto |
| **Fuente** | FIFA — información pública sobre árbitros |
| **Intervención** | B — Corregir título + agregar biografía verificable |

### 17. Incendio destruye vivienda en Monseñor Lezcano y deja un herido
| Campo | Valor |
|-------|-------|
| **ID** | `H25VVBdDntQpmy13uxdP` |
| **Score** | 70 |
| **Aprobado** | false |
| **Palabras** | 379 |
| **Problema** | 12 `<br>` como separadores. Solo 1 `<p>`. Título > 60. Score bajo. |
| **Qué falta** | Reemplazar `<br>` + corregir título + contexto estadísticas incendios |
| **Fuente** | Bomberos — información pública; MINSA |
| **Intervención** | B — Corrección estructural + contexto verificable |

### 18. Costa Rica detiene a palestino con vínculos a Hamás
| Campo | Valor |
|-------|-------|
| **ID** | `IFFjvOi1HTG0oeiIuIBo` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 455 |
| **Problema** | Falta contexto geopolítico y impacto en seguridad centroamericana |
| **Qué falta** | Relaciones Centroamérica-Medio Oriente, cooperación |
| **Fuente** | Migración CR — información pública |
| **Intervención** | B — Agregar contexto geopolítico verificable |

### 19. Capturan a autores de doble crimen en San Ramón, Matagalpa
| Campo | Valor |
|-------|-------|
| **ID** | `JbGRXcj7AiJNPvQRcneT` |
| **Score** | 84 |
| **Aprobado** | false |
| **Palabras** | 523 |
| **Problema** | Falta detalles del caso y contexto de seguridad en Matagalpa |
| **Qué falta** | Seguridad en Matagalpa, estadísticas regionales |
| **Fuente** | Policía Nacional — información pública |
| **Intervención** | B — Agregar contexto seguridad regional verificable |

### 20. Nicaragua abastece el 47% de lácteos que consume El Salvador
| Campo | Valor |
|-------|-------|
| **ID** | `Q19zidw5UoSjUlR1r9JP` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 484 |
| **Problema** | Falta datos de exportación, valor económico |
| **Qué falta** | Volumen, valor, impacto en productores |
| **Fuente** | MAG — datos públicos de exportación láctea |
| **Intervención** | B — Agregar datos económicos verificables |

### 21. Capturan a sujeto por robo de US$30 mil en Jalapa
| Campo | Valor |
|-------|-------|
| **ID** | `SD09P4KU8vq4Mq1Vidzz` |
| **Score** | 78 |
| **Aprobado** | false |
| **Palabras** | 744 |
| **Problema** | Falta contexto de incidencia de robos en Jalapa |
| **Qué falta** | Seguridad en Nueva Segovia, sistema judicial |
| **Fuente** | Policía Nacional — datos públicos |
| **Intervención** | B — Agregar contexto seguridad regional verificable |

### 22. Nicaragua invertirá $13.9 millones en 49 camiones de bombero
| Campo | Valor |
|-------|-------|
| **ID** | `SG87LjFIgCWnd6g8EKDq` |
| **Score** | 76 |
| **Aprobado** | false |
| **Palabras** | 545 |
| **Problema** | Falta detalles técnicos: proveedor, financiamiento, distribución |
| **Qué falta** | Capacidad actual vs nueva, distribución por departamento |
| **Fuente** | MINVAH/DGB — información pública sobre compra de equipos |
| **Intervención** | B — Agregar contexto técnico verificable |

### 23. España, Francia y Argentina son favoritas al Mundial 2026
| Campo | Valor |
|-------|-------|
| **ID** | `VW3uBFbDCb6RR3KCiJ18` |
| **Score** | 74 |
| **Aprobado** | false |
| **Palabras** | 743 |
| **Problema** | Falta análisis deportivo: por qué son favoritas |
| **Qué falta** | Datos de equipos, contexto deportivo |
| **Fuente** | FIFA — ranking e información pública |
| **Intervención** | B — Agregar análisis deportivo verificable |

### 24. Después de años prófugo, captura de El Diablo abre interrogante
| Campo | Valor |
|-------|-------|
| **ID** | `ZJpLrlTrusn5Jex8WQgQ` |
| **Score** | 78 |
| **Aprobado** | false |
| **Palabras** | 435 |
| **Problema** | Falta biografía e historial de "El Diablo". Título > 60. |
| **Qué falta** | Corregir título + historial delictivo verificable |
| **Fuente** | Policía Nacional — información pública |
| **Intervención** | B — Corregir título + agregar historial verificable |

### 25. Agresión a mujer en Nindirí activa investigación bajo la Ley 779
| Campo | Valor |
|-------|-------|
| **ID** | `qAcmF4MWTiLsTACCG8v5` |
| **Score** | 78 |
| **Aprobado** | false |
| **Palabras** | 527 |
| **Problema** | Falta contexto Ley 779. Título > 60. Resumen > 160. |
| **Qué falta** | Corregir título + resumen + contexto legal Ley 779 |
| **Fuente** | Ley 779 — texto legal público; Comisaría de la Mujer |
| **Intervención** | B — Corrección estructural + contexto legal verificable |

### 26. Nicaragua conquista el IHF Trophy de Balonmano en C.A
| Campo | Valor |
|-------|-------|
| **ID** | `e2xuC463KZm7pAubu9Rl` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 602 |
| **Problema** | Falta resultados detallados y contexto del balonmano en Nicaragua |
| **Qué falta** | Resultados y contexto deportivo |
| **Fuente** | Federación de Balonmano — información pública |
| **Intervención** | B — Agregar resultados verificables |

### 27. Accidentes en Nicaragua dejan un fallecido y varios heridos
| Campo | Valor |
|-------|-------|
| **ID** | `hscMxXK16XKKq84yY1P6` |
| **Score** | 86 |
| **Aprobado** | false |
| **Palabras** | 418 |
| **Problema** | Falta detalles: ubicaciones, causas, estadísticas |
| **Qué falta** | Detalles y estadísticas de accidentes |
| **Fuente** | Policía Nacional, Cruz Roja — datos públicos |
| **Intervención** | B — Agregar detalles verificables |

### 28. Netflix, Max y Disney+ dominan streaming en Nicaragua
| Campo | Valor |
|-------|-------|
| **ID** | `vvWJAwyV8adECw3IGqdy` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 649 |
| **Problema** | Falta datos de penetración de streaming en Nicaragua |
| **Qué falta** | Penetración, precios, hábitos |
| **Fuente** | Estudios de mercado, Telcor — datos públicos |
| **Intervención** | B — Agregar datos de mercado verificables |

---

## CLASIFICACIÓN C — ENRIQUECIMIENTO PERIODÍSTICO (8 artículos)

Necesita capa periodística: hecho + contexto + explicación + utilidad. No convertirlo en opinión.

### 29. Nicaragua gana oro en relevos mixtos 4x100 en Managua
| Campo | Valor |
|-------|-------|
| **ID** | `kR3waCnxVDfMfVCV8sAH` |
| **Score** | 88 |
| **Aprobado** | false |
| **Palabras** | 618 |
| **Problema** | Necesita enfoque en resultados y protagonistas |
| **Qué falta** | Resultados detallados, tiempos, contexto atlético |
| **Fuente** | Federación de Atletismo — resultados públicos |
| **Intervención** | C — Enriquecer con resultados + contexto atlético |

### 30. Nueva Guinea busca respuestas por muerte de joven de 18 años
| Campo | Valor |
|-------|-------|
| **ID** | `qT9tAbCyVpicX7HmoaD0` |
| **Score** | 80 |
| **Aprobado** | false |
| **Palabras** | 473 |
| **Problema** | Necesita contexto social de Nueva Guinea. Resumen > 160. |
| **Qué falta** | Acortar resumen + contexto social verificable |
| **Fuente** | Contexto social verificable de Nueva Guinea (RAAS) |
| **Intervención** | C — Corregir resumen + enriquecer con contexto social |

### 31. Fiscalía acusa a madre y padrastro por muerte de niño
| Campo | Valor |
|-------|-------|
| **ID** | `tYX2ZtXwUXg07CHI0ONj` |
| **Score** | 74 |
| **Aprobado** | false |
| **Palabras** | 467 |
| **Problema** | Necesita contexto legal y de protección de menores |
| **Qué falta** | Capa periodística: contexto legal, protección de menores |
| **Fuente** | Código de la Niñez y Adolescencia (Ley 877) — texto legal público |
| **Intervención** | C — Enriquecer con contexto legal verificable |

### 32. Nicaragüense resulta afectado en ataque en Canóvanas, Puerto Rico
| Campo | Valor |
|-------|-------|
| **ID** | `tlIXmTYnv4hIajXOQiup` |
| **Score** | 82 |
| **Aprobado** | false |
| **Palabras** | 470 |
| **Problema** | Necesita contexto diaspórico. Título > 60. |
| **Qué falta** | Corregir título + contexto diaspórico |
| **Fuente** | Datos verificables de nicaragüenses en Puerto Rico |
| **Intervención** | C — Corregir título + enriquecer con contexto diáspora |

### 33. Beisbol infantil: Nicaragua viaja a Puerto Rico y Ecuador
| Campo | Valor |
|-------|-------|
| **ID** | `tnX05ykqVT6WiYVflSii` |
| **Score** | 74 |
| **Aprobado** | false |
| **Palabras** | 629 |
| **Problema** | Necesita contexto del béisbol infantil, jugadores, expectativas |
| **Qué falta** | Contexto deportivo, jugadores, expectativas |
| **Fuente** | Federación Nicaragüense de Béisbol — información pública |
| **Intervención** | C — Enriquecer con contexto deportivo verificable |

### 34. Nicaragüense José Salgado resulta afectado en asalto en Austin
| Campo | Valor |
|-------|-------|
| **ID** | `uJ076MyMZhQIJYTa1qOW` |
| **Score** | 76 |
| **Aprobado** | false |
| **Palabras** | 402 |
| **Problema** | Necesita contexto diaspórico. Título > 60. 3 `<br>`. |
| **Qué falta** | Corregir título + reemplazar `<br>` + contexto diaspórico |
| **Fuente** | Datos verificables de nicaragüenses en Texas |
| **Intervención** | C — Corrección estructural + enriquecer con contexto diáspora |

### 35. Colapso en construcción cobra vida de nicaragüense en EE. UU
| Campo | Valor |
|-------|-------|
| **ID** | `wiHS5gvNy7U6tORXAhEU` |
| **Score** | 80 |
| **Aprobado** | false |
| **Palabras** | 404 |
| **Problema** | Necesita contexto de accidentes laborales y derechos laborales |
| **Qué falta** | Contexto laboral: estadísticas, derechos, protocolos |
| **Fuente** | OSHA — estadísticas públicas de accidentes laborales |
| **Intervención** | C — Enriquecer con contexto laboral verificable |

### 36. México, Brasil y Argentina avanzan en el Mundial 2026
| Campo | Valor |
|-------|-------|
| **ID** | `yUMAJwJQ1yMJTSb2cdkP` |
| **Score** | 86 |
| **Aprobado** | false |
| **Palabras** | 546 |
| **Problema** | Necesita enfoque desde Nicaragua: por qué importa |
| **Qué falta** | Análisis desde perspectiva nicaragüense |
| **Fuente** | FIFA — información pública |
| **Intervención** | C — Enriquecer con análisis desde perspectiva NI |

---

## CLASIFICACIÓN D — REESCRITURA (1 artículo)

Reescritura completa. Mantener todos los hechos verificables.

### 37. Nuevo complejo en Masaya reúne Bomberos y Migración (recategorizado desde DO_NOT_PUBLISH)
| Campo | Valor |
|-------|-------|
| **ID** | `zkdDsejAb5hLCpCaEbMR` |
| **Score** | 64 |
| **Aprobado** | false |
| **Palabras** | 403 |
| **Problema** | Score muy bajo (64). Contenido cercano a comunicado oficial. Falta explicación, contexto, utilidad. Resumen > 160. |
| **Qué falta** | Reescribir con identidad NI. Resumen acortar. Agregar contexto: inversión, capacidad, servicios, impacto. |
| **Fuente** | MIGOB, alcaldía de Masaya — información pública del proyecto |
| **Intervención** | D — Reescritura completa con identidad Nicaragua Informate |

---

## CLASIFICACIÓN E — NO RESCATABLE (0 artículos)

Ningún artículo se clasifica como E. Todos tienen información verificable que puede ser mejorada.

---

## RESUMEN

| Clasificación | Cantidad | Descripción |
|---------------|----------|-------------|
| **A — Corrección simple** | 6 | Estructura, HTML, título, resumen. Sin contenido nuevo. |
| **B — Contexto verificable** | 22 | Datos verificables con fuente. |
| **C — Enriquecimiento periodístico** | 8 | Capa periodística: hecho + contexto + explicación + utilidad. |
| **D — Reescritura** | 1 | Reescritura completa. Mantener hechos verificables. |
| **E — No rescatable** | 0 | — |
| **Total** | 37 | |

### Distribución por score

| Score | Cantidad |
|-------|----------|
| 64 | 1 |
| 70 | 1 |
| 74 | 4 |
| 76 | 2 |
| 78 | 4 |
| 80 | 2 |
| 82 | 1 |
| 84 | 2 |
| 86 | 2 |
| 88 | 14 |
| 92 | 1 |
| **Total** | 37 |

### Nota
El artículo `zkdDsejAb5hLCpCaEbMR` (score 64) fue recategorizado desde DO_NOT_PUBLISH a D (Reescritura) basado en que el score bajo no significa que el contenido sea erróneo, sino que le falta contexto. El tema (nueva infraestructura pública) es verificable y relevante.
