# FORENSIC PHASE 16 — DRY RUN
## Rescate Editorial Forense — Cola de 37 artículos
## Nicaragua Informate — 2026-08-12

---

## RESUMEN EJECUTIVO

| Clasificación | Cantidad | Descripción |
|---------------|----------|-------------|
| **A — Corrección simple** | 6 | Solo estructura/HTML/título/resumen |
| **B — Contexto verificable** | 22 | Necesita datos verificables + correcciones |
| **C — Enriquecimiento periodístico** | 8 | Necesita capa periodística + correcciones |
| **D — Reescritura** | 1 | Reescritura completa |
| **E — No rescatable** | 0 | — |
| **Total** | 37 | |

### Distribución por score

| Score | Cantidad | Clasificación predominante |
|-------|----------|---------------------------|
| 64 | 1 | D |
| 70 | 1 | B |
| 74 | 4 | B/C |
| 76 | 2 | B/C |
| 78 | 4 | B |
| 80 | 2 | B/C |
| 82 | 1 | C |
| 84 | 2 | B |
| 86 | 2 | B/C |
| 88 | 14 | A/B |
| 92 | 1 | A |

### Problemas estructurales detectados

| Problema | Cantidad | Artículos |
|----------|----------|-----------|
| **Sin tags `<p>`** | 1 | `1HmobwfngxeXoUofqosD` |
| **`<br>` excesivos** | 4 | `JOfOW7uTxkgDSIezo7Wn` (7), `ic2YGP8NQAc6r3VMvy9K` (13), `H25VVBdDntQpmy13uxdP` (12), `uJ076MyMZhQIJYTa1qOW` (3) |
| **Título > 60 chars** | 9 | `D7y1TWAyXq7SaNMirIjB`, `NA6PqCReq06PdIMSICEe`, `ic2YGP8NQAc6r3VMvy9K`, `GHbdyeiCzH7Jk0i5RVPA`, `H25VVBdDntQpmy13uxdP`, `ZJpLrlTrusn5Jex8WQgQ`, `qAcmF4MWTiLsTACCG8v5`, `tlIXmTYnv4hIajXOQiup`, `uJ076MyMZhQIJYTa1qOW` |
| **Resumen > 160 chars** | 4 | `i88RK0Ulgkkzyq6YV4Um`, `qAcmF4MWTiLsTACCG8v5`, `qT9tAbCyVpicX7HmoaD0`, `zkdDsejAb5hLCpCaEbMR` |
| **Pocos `<h2>` (< 3)** | 2 | `kJZTSfqmUGHJKA8SFaE8` (2), `Ilzcy77tyF8oFNPytokN` (1) |

---

## PASO 1 — INVENTARIO COMPLETO

### Tabla maestra de 37 artículos

| # | ID | Título | Score | Aprob. | Perfil | Categoría | Pal. | Blocking issues (MENI) | Originalidad | Contexto | Explicación | Valor | Utilidad | Acción | Clasif. |
|---|-----|--------|-------|--------|--------|-----------|------|----------------------|-------------|----------|-------------|-------|----------|--------|---------|
| 1 | `1HmobwfngxeXoUofqosD` | Primeros bebés del Día de las Madres nacen en hospitales de… | 92 | false | REPORTAJE | Nacionales | 572 | Falta: qué cambia, qué institución interviene, qué sigue | Propia | Datos MINSA | Cobertura de hecho | Alta | Información para madres | Envolver en `<p>`, corregir título | A |
| 2 | `CypRypZIGLckqywkZq8X` | Nicaragüense sigue desaparecida tras terremotos en Venezuela | 74 | false | REPORTAJE | Internacionales | 435 | Falta: qué investiga, qué falta conocer, contexto | Propia | Sin conexión diáspora | Hecho verificable | Alta | Connacionales en Venezuela | Agregar contexto diáspora | B |
| 3 | `D7y1TWAyXq7SaNMirIjB` | Dos nicaragüenses fallecen en el extranjero en casos distintos | 80 | false | REPORTAJE | Internacionales | 388 | Falta: utilidad para lector, contexto | Propia | Sin contexto diáspora | Hecho verificable | Media | Connacionales en exterior | Corregir título + contexto diáspora | B |
| 4 | `EcKTeqT7kLcFElUX3DM2` | Dueño de semovientes paga C$769 mil por muerte en Jalapa | 78 | false | REPORTAJE | Sucesos | 377 | Falta: qué falta conocer, antecedentes | Propia | Sin marco legal | Hecho verificable | Media | Precedente legal | Agregar contexto legal (Código Civil) | B |
| 5 | `F4UddilPobcIjIkZ1e55` | Escolta de ULTRAVAL enfrenta juicio por robo en Managua | 78 | false | REPORTAJE | Sucesos | 718 | Falta: qué falta conocer, utilidad | Propia | Sin contexto ULTRAVAL | Hecho verificable | Media | Impacto en transporte | Agregar contexto institucional ULTRAVAL | B |
| 6 | `JOfOW7uTxkgDSIezo7Wn` | Capturan acusado de agredir a un hombre en Rivas | 84 | false | INVESTIGACION | Sucesos | 2201 | Falta: utilidad para lector | Propia | Sin contexto seguridad | Detallado | Media | Seguridad local | Reemplazar `<br>` por `<p>` | A |
| 7 | `NA6PqCReq06PdIMSICEe` | Colapsa vivienda ancestral en Monimbó, Masaya: familia de 7 ilesa | 86 | false | REPORTAJE | Sucesos | 2196 | Falta: antecedentes, contexto | Propia | Sin patrimonio Monimbó | Detallado | Alta | Patrimonio cultural | Corregir título + contexto patrimonio | B |
| 8 | `e0QJyxs1azyZahzs8VuN` | Venezuela: 164 afectados y 30 mil desaparecidos tras sismos | 88 | false | REPORTAJE | Internacionales | 448 | Falta: por qué importa en Nicaragua | Propia | Sin conexión diáspora | Hecho verificable | Alta | Connacionales en Venezuela | Agregar conexión diáspora | B |
| 9 | `i88RK0Ulgkkzyq6YV4Um` | Chinandega estrena 75 viviendas con servicios completos | 88 | false | REPORTAJE | Nacionales | 397 | Falta: qué cambia, qué sigue | Propia | Sin contexto programa | Hecho verificable | Media | Vivienda social | Acortar resumen | A |
| 10 | `ic2YGP8NQAc6r3VMvy9K` | Venezuela: réplicas continúan con 920 víctimas y miles sin rastro | 88 | false | REPORTAJE | Internacionales | 463 | Falta: por qué importa en Nicaragua | Propia | Sin conexión diáspora | Hecho verificable | Alta | Connacionales en Venezuela | Reemplazar `<br>` + corregir título | A |
| 11 | `kJZTSfqmUGHJKA8SFaE8` | Julieta Venegas interpreta himno cultural del Mundial 2026 | 88 | false | REPORTAJE | Internacionales | 375 | Falta: por qué importa en Nicaragua | Propia | Sin contexto cultural | Hecho verificable | Baja | Cultura | Agregar H2 adicionales | A |
| 12 | `n2Buq4aBhvnrXUcTlwuD` | Capturan a pinolero por llevarse a niña de 13 años | 88 | false | REPORTAJE | Internacionales | 360 | Falta: contexto, antecedentes | Propia | Sin marco legal | Hecho verificable | Alta | Protección de menores | Agregar contexto legal (sustracción) | B |
| 13 | `sH5OCUULzSvZFhRcHXzb` | Cinco agentes fallecen en operativo en Honduras | 88 | false | INVESTIGACION | Internacionales | 608 | Falta: contexto, antecedentes | Propia | Sin contexto regional | Hecho verificable | Alta | Seguridad regional | Agregar contexto seguridad CA | B |
| 14 | `7XzL7aTqVYBpTNKgSPxQ` | Puerto Corinto lidera llegada de 11 buques a Nicaragua | 88 | false | REPORTAJE | Nacionales | 500 | Falta: contexto, antecedentes | Propia | Sin datos económicos | Hecho verificable | Media | Economía portuaria | Agregar datos cuantitativos EPN | B |
| 15 | `GHbdyeiCzH7Jk0i5RVPA` | Polémica en el Mundial no frena reconocimiento a Tatiana Guzmán | 74 | false | REPORTAJE | Deportes | 385 | Falta: resultado, contexto, significado | Propia | Sin biografía | Hecho verificable | Media | Deportes Nicaragua | Corregir título + biografía + contexto | B |
| 16 | `H25VVBdDntQpmy13uxdP` | Incendio destruye vivienda en Monseñor Lezcano y deja un herido | 70 | false | REPORTAJE | Sucesos | 379 | Falta: qué investiga, qué falta | Propia | Sin estadísticas incendios | Hecho verificable | Media | Seguridad ciudadana | Reemplazar `<br>` + título + contexto | B |
| 17 | `IFFjvOi1HTG0oeiIuIBo` | Costa Rica detiene a palestino con vínculos a Hamás | 88 | false | REPORTAJE | Internacionales | 455 | Falta: por qué importa en Nicaragua | Propia | Sin contexto geopolítico | Hecho verificable | Media | Seguridad regional | Agregar contexto geopolítico | B |
| 18 | `Ilzcy77tyF8oFNPytokN` | Campeonato de 1/4 de Milla: Adrenalina y técnica en Managua | 74 | false | REPORTAJE | Deportes | 409 | Falta: qué cambia, a quién beneficia | Propia | Sin contexto deportivo | Superficial | Baja | Deportes motor | Agregar H2 + contexto deportivo | A |
| 19 | `JbGRXcj7AiJNPvQRcneT` | Capturan a autores de doble crimen en San Ramón, Matagalpa | 84 | false | REPORTAJE | Sucesos | 523 | Falta: antecedentes, información adicional | Propia | Sin contexto seguridad | Hecho verificable | Media | Seguridad Matagalpa | Agregar contexto seguridad regional | B |
| 20 | `Q19zidw5UoSjUlR1r9JP` | Nicaragua abastece el 47% de lácteos que consume El Salvador | 88 | false | REPORTAJE | Nacionales | 484 | Falta: contexto, antecedentes | Propia | Sin datos económicos | Hecho verificable | Alta | Economía láctea | Agregar datos MAG exportación | B |
| 21 | `SD09P4KU8vq4Mq1Vidzz` | Capturan a sujeto por robo de US$30 mil en Jalapa | 78 | false | INVESTIGACION | Sucesos | 744 | Falta: antecedentes, información adicional | Propia | Sin contexto seguridad | Detallado | Media | Seguridad Nueva Segovia | Agregar contexto seguridad regional | B |
| 22 | `SG87LjFIgCWnd6g8EKDq` | Nicaragua invertirá $13.9 millones en 49 camiones de bombero | 76 | false | REPORTAJE | Nacionales | 545 | Falta: qué investiga, qué falta | Propia | Sin detalles técnicos | Hecho verificable | Alta | Seguridad ciudadana | Agregar contexto capacidad DGB | B |
| 23 | `VW3uBFbDCb6RR3KCiJ18` | España, Francia y Argentina son favoritas al Mundial 2026 | 74 | false | INVESTIGACION | Deportes | 743 | Falta: contexto, antecedentes | Propia | Sin análisis deportivo | Superficial | Baja | Deportes | Agregar análisis FIFA | B |
| 24 | `ZJpLrlTrusn5Jex8WQgQ` | Después de años prófugo, captura de El Diablo abre interrogante | 78 | false | REPORTAJE | Internacionales | 435 | Falta: cómo afecta comunidad, utilidad | Propia | Sin historial delictivo | Hecho verificable | Media | Seguridad ciudadana | Corregir título + historial delictivo | B |
| 25 | `qAcmF4MWTiLsTACCG8v5` | Agresión a mujer en Nindirí activa investigación bajo la Ley 779 | 78 | false | REPORTAJE | Sucesos | 527 | Falta: antecedentes, información adicional | Propia | Sin contexto Ley 779 | Hecho verificable | Alta | Violencia de género | Corregir título + resumen + contexto Ley 779 | B |
| 26 | `e2xuC463KZm7pAubu9Rl` | Nicaragua conquista el IHF Trophy de Balonmano en C.A | 88 | false | REPORTAJE | Deportes | 602 | Falta: contexto, antecedentes | Propia | Sin resultados detallados | Hecho verificable | Alta | Deportes Nicaragua | Agregar resultados + contexto balonmano | B |
| 27 | `hscMxXK16XKKq84yY1P6` | Accidentes en Nicaragua dejan un fallecido y varios heridos | 86 | false | REPORTAJE | Sucesos | 418 | Falta: qué cambia, a quién beneficia | Propia | Sin estadísticas | Hecho verificable | Media | Seguridad vial | Agregar detalles + estadísticas | B |
| 28 | `vvWJAwyV8adECw3IGqdy` | Netflix, Max y Disney+ dominan streaming en Nicaragua | 88 | false | REPORTAJE | Tecnología | 649 | Falta: cómo afecta precios, qué significa | Propia | Sin datos penetración | Hecho verificable | Alta | Consumo tecnología | Agregar datos penetración streaming | B |
| 29 | `kR3waCnxVDfMfVCV8sAH` | Nicaragua gana oro en relevos mixtos 4x100 en Managua | 88 | false | REPORTAJE | Deportes | 618 | Falta: qué cambia, qué sigue | Propia | Sin contexto atlético | Resultado deportivo | Alta | Deportes Nicaragua | Enriquecer con resultados + tiempos | C |
| 30 | `qT9tAbCyVpicX7HmoaD0` | Nueva Guinea busca respuestas por muerte de joven de 18 años | 80 | false | REPORTAJE | Sucesos | 473 | Falta: qué falta, cómo afecta comunidad | Propia | Sin contexto social | Hecho verificable | Alta | Seguridad Nueva Guinea | Acortar resumen + contexto social | C |
| 31 | `tYX2ZtXwUXg07CHI0ONj` | Fiscalía acusa a madre y padrastro por muerte de niño | 74 | false | REPORTAJE | Sucesos | 467 | Falta: qué investiga, antecedentes | Propia | Sin contexto legal | Hecho verificable | Alta | Protección de menores | Agregar contexto Ley 877 Niñez | C |
| 32 | `tlIXmTYnv4hIajXOQiup` | Nicaragüense resulta afectado en ataque en Canóvanas, Puerto Rico | 82 | false | REPORTAJE | Internacionales | 470 | Falta: qué falta, utilidad lector | Propia | Sin contexto diaspórico | Hecho verificable | Media | Connacionales en PR | Corregir título + contexto diáspora | C |
| 33 | `tnX05ykqVT6WiYVflSii` | Beisbol infantil: Nicaragua viaja a Puerto Rico y Ecuador | 74 | false | REPORTAJE | Deportes | 629 | Falta: quiénes jugaron, cómo queda tabla | Propia | Sin contexto deportivo | Superficial | Media | Deportes infantil | Enriquecer con jugadores + expectativas | C |
| 34 | `uJ076MyMZhQIJYTa1qOW` | Nicaragüense José Salgado resulta afectado en asalto en Austin | 76 | false | REPORTAJE | Internacionales | 402 | Falta: qué falta, utilidad lector | Propia | Sin contexto diaspórico | Hecho verificable | Media | Connacionales en Texas | Corregir título + `<br>` + contexto | C |
| 35 | `wiHS5gvNy7U6tORXAhEU` | Colapso en construcción cobra vida de nicaragüense en EE. UU | 80 | false | REPORTAJE | Internacionales | 404 | Falta: qué falta, cómo afecta comunidad | Propia | Sin contexto laboral | Hecho verificable | Media | Connacionales en EE.UU. | Agregar contexto laboral OSHA | C |
| 36 | `yUMAJwJQ1yMJTSb2cdkP` | México, Brasil y Argentina avanzan en el Mundial 2026 | 86 | false | REPORTAJE | Deportes | 546 | Falta: por qué importa en Nicaragua | Propia | Sin perspectiva NI | Hecho verificable | Baja | Deportes | Enriquecer con análisis desde NI | C |
| 37 | `zkdDsejAb5hLCpCaEbMR` | Nuevo complejo en Masaya reúne Bomberos y Migración | 64 | false | REPORTAJE | Nacionales | 403 | Falta: qué investiga, qué falta, utilidad | Propia | Cercano a comunicado | Superficial | Baja | Información institucional | Reescribir con identidad NI | D |

---

## PASO 2 — CLASIFICACIÓN DETALLADA

---

### CLASIFICACIÓN A — CORRECCIÓN SIMPLE (6 artículos)

Correcciones de estructura, HTML, título, resumen. No requiere contenido nuevo.

---

#### A1. `1HmobwfngxeXoUofqosD` — Score 92

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 92, aprobado false, 572 palabras, 0 tags `<p>`, 3 H2 |
| **PROBLEMA** | Contenido sin envolver en `<p>`. Texto suelto entre H2. Estructura HTML deficiente. Título truncado con "…". |
| **FUENTE** | N/A — corrección estructural |
| **CAMBIO PROPUESTO** | 1) Envolver cada párrafo en `<p>`. 2) Corregir título: "Primeros bebés del Día de las Madres nacen en hospitales de Managua" (59 chars). 3) Mantener contenido intacto. |
| **DESPUÉS** | Score esperado: 92-94 (mejora estructural puede sumar puntos) |
| **RIESGO** | Bajo — solo estructura HTML, sin cambiar contenido |

---

#### A2. `JOfOW7uTxkgDSIezo7Wn` — Score 84

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 84, aprobado false, 2201 palabras, 6 H2, 7 `<br>` |
| **PROBLEMA** | 7 tags `<br>` usados como separadores de párrafo en lugar de `<p>`. |
| **FUENTE** | N/A — corrección estructural |
| **CAMBIO PROPUESTO** | Reemplazar `<br>` por cierre de `</p>` y apertura de `<p>`. Mantener contenido intacto. |
| **DESPUÉS** | Score esperado: 84-86 (mejora estructural) |
| **RIESGO** | Bajo — solo estructura HTML |

---

#### A3. `i88RK0Ulgkkzyq6YV4Um` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 397 palabras, 3 H2, 9 P, resumen 164 chars |
| **PROBLEMA** | Resumen de 164 caracteres (límite 160). |
| **FUENTE** | N/A — corrección de resumen |
| **CAMBIO PROPUESTO** | Acortar resumen a ≤160 chars: "Setenta y cinco familias reciben viviendas con servicios completos en Chinandega, como parte de un plan de 307 casas del gobierno." (128 chars) |
| **DESPUÉS** | Score esperado: 88-90 (corrección de resumen puede sumar) |
| **RIESGO** | Bajo — solo resumen |

---

#### A4. `ic2YGP8NQAc6r3VMvy9K` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 463 palabras, 4 H2, 2 P, 13 `<br>`, título 65 chars |
| **PROBLEMA** | 13 tags `<br>` como separadores. Solo 2 tags `<p>`. Título de 65 chars. |
| **FUENTE** | N/A — corrección estructural |
| **CAMBIO PROPUESTO** | 1) Reemplazar `<br>` por `</p><p>`. 2) Título: "Venezuela: 920 víctimas y miles sin rastro tras sismos" (54 chars). |
| **DESPUÉS** | Score esperado: 88-90 (estructura + título) |
| **RIESGO** | Bajo — estructura HTML + título |

---

#### A5. `kJZTSfqmUGHJKA8SFaE8` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 375 palabras, 2 H2, 6 P |
| **PROBLEMA** | Solo 2 subtítulos H2 (mínimo recomendado: 3-4). |
| **FUENTE** | N/A — corrección estructural |
| **CAMBIO PROPUESTO** | Agregar 1-2 H2 adicionales dividiendo secciones existentes. No agregar contenido nuevo. |
| **DESPUÉS** | Score esperado: 88-90 (mejora de estructura) |
| **RIESGO** | Bajo — solo estructura |

---

#### A6. `Ilzcy77tyF8oFNPytokN` — Score 74

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 74, aprobado false, 409 palabras, 1 H2, 6 P |
| **PROBLEMA** | Solo 1 H2. Score bajo (74). |
| **FUENTE** | N/A — corrección estructural |
| **CAMBIO PROPUESTO** | Agregar 2-3 H2 dividiendo secciones existentes. No agregar contenido nuevo. |
| **DESPUÉS** | Score esperado: 74-78 (estructura sola probablemente no alcance 90) |
| **RIESGO** | Medio — score probablemente seguirá < 85. Registrar como MEJORADO_PERO_NO_APROBADO. |

---

### CLASIFICACIÓN B — CONTEXTO VERIFICABLE (22 artículos)

Necesita datos verificables agregados. Cada dato con fuente.

---

#### B1. `CypRypZIGLckqywkZq8X` — Score 74

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 74, aprobado false, 435 palabras, 4 H2 |
| **PROBLEMA** | Falta contexto sobre comunidad nicaragüense en Venezuela y relación histórica |
| **FUENTE** | MIGOB — estimación de nicaragüenses en Venezuela (datos públicos) |
| **CAMBIO PROPUESTO** | Agregar 50-75 palabras de contexto: diáspora nicaragüense en Venezuela, relación diplomática, asistencia consular |
| **DESPUÉS** | Score esperado: 78-84 |
| **RIESGO** | Medio — requiere dato verificable de MIGOB |

---

#### B2. `D7y1TWAyXq7SaNMirIjB` — Score 80

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 80, aprobado false, 388 palabras, 4 H2, título 62 chars |
| **PROBLEMA** | Falta contexto diáspora. Título > 60. |
| **FUENTE** | MIGOB — connacionales en el exterior |
| **CAMBIO PROPUESTO** | 1) Título: "Dos nicaragüenses fallecen en el extranjero en casos distintos" → "Dos nicaragüenses fallecen en el extranjero en casos separados" (61 chars) o "Nicaragüenses fallecen en el extranjero en dos casos distintos" (61 chars). 2) Agregar contexto de diáspora. |
| **DESPUÉS** | Score esperado: 82-86 |
| **RIESGO** | Medio |

---

#### B3. `EcKTeqT7kLcFElUX3DM2` — Score 78

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 78, aprobado false, 377 palabras, 3 H2 |
| **PROBLEMA** | Falta contexto legal sobre responsabilidad civil por daños con semovientes |
| **FUENTE** | Código Civil de Nicaragua — responsabilidad por daños causados por animales (artículos verificables) |
| **CAMBIO PROPUESTO** | Agregar contexto legal: marco normativo nicaragüense sobre responsabilidad por semovientes |
| **DESPUÉS** | Score esperado: 82-86 |
| **RIESGO** | Medio — requiere referencia legal verificable |

---

#### B4. `F4UddilPobcIjIkZ1e55` — Score 78

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 78, aprobado false, 718 palabras, 5 H2 |
| **PROBLEMA** | Falta contexto institucional sobre ULTRAVAL y impacto del robo en transporte |
| **FUENTE** | MTI — información pública sobre ULTRAVAL (Empresa de Transporte Urbano de Valores) |
| **CAMBIO PROPUESTO** | Agregar contexto: qué es ULTRAVAL, función, impacto del robo en sistema de valores |
| **DESPUÉS** | Score esperado: 82-86 |
| **RIESGO** | Medio |

---

#### B5. `NA6PqCReq06PdIMSICEe` — Score 86

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 86, aprobado false, 2196 palabras, 5 H2, título 65 chars |
| **PROBLEMA** | Título > 60. Falta contexto patrimonial sobre viviendas ancestrales en Monimbó. |
| **FUENTE** | INC — patrimonio cultural de Masaya/Monimbó (información pública) |
| **CAMBIO PROPUESTO** | 1) Título: "Colapsa vivienda ancestral en Monimbó: familia de 7 ilesa" (56 chars). 2) Agregar contexto sobre patrimonio de Monimbó. |
| **DESPUÉS** | Score esperado: 88-92 |
| **RIESGO** | Bajo-medio |

---

#### B6. `e0QJyxs1azyZahzs8VuN` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 448 palabras, 3 H2 |
| **PROBLEMA** | Falta conexión con Nicaragua (diáspora) |
| **FUENTE** | MIGOB — nicaragüenses en Venezuela |
| **CAMBIO PROPUESTO** | Agregar 50-75 palabras: conexión diáspora, asistencia consular |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo — 88 está cerca de 90 |

---

#### B7. `n2Buq4aBhvnrXUcTlwuD` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 360 palabras, 3 H2 |
| **PROBLEMA** | Falta contexto legal sobre sustracción de menores |
| **FUENTE** | Código Penal — sustracción de menores; tratados internacionales |
| **CAMBIO PROPUESTO** | Agregar contexto legal: marco normativo, tratados bilateral México-Nicaragua |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo — 88 está cerca de 90 |

---

#### B8. `sH5OCUULzSvZFhRcHXzb` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 608 palabras, 3 H2 |
| **PROBLEMA** | Falta contexto regional de seguridad centroamericana |
| **FUENTE** | Policía Nacional — datos públicos de seguridad regional |
| **CAMBIO PROPUESTO** | Agregar contexto: impacto en seguridad centroamericana, cooperación |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo |

---

#### B9. `7XzL7aTqVYBpTNKgSPxQ` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 500 palabras, 4 H2 |
| **PROBLEMA** | Falta datos económicos: tonelaje, valor de mercancías |
| **FUENTE** | EPN — Empresa Portuaria Nacional (datos públicos) |
| **CAMBIO PROPUESTO** | Agregar datos cuantitativos del puerto: tonelaje, comparación anual |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo |

---

#### B10. `GHbdyeiCzH7Jk0i5RVPA` — Score 74

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 74, aprobado false, 385 palabras, 3 H2, título 63 chars |
| **PROBLEMA** | Falta contexto sobre Tatiana Guzmán y polémica. Título > 60. |
| **FUENTE** | FIFA — información pública sobre árbitros |
| **CAMBIO PROPUESTO** | 1) Título: "Reconocimiento a Tatiana Guzmán sobrevive polémica del Mundial" (61 chars) o "Tatiana Guzmán recibe reconocimiento pese a polémica mundialista" (64→acortar). 2) Agregar biografía y contexto. |
| **DESPUÉS** | Score esperado: 80-86 |
| **RIESGO** | Medio |

---

#### B11. `H25VVBdDntQpmy13uxdP` — Score 70

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 70, aprobado false, 379 palabras, 4 H2, 1 P, 12 `<br>`, título 63 chars |
| **PROBLEMA** | 12 `<br>` como separadores. Solo 1 `<p>`. Título > 60. Score bajo. |
| **FUENTE** | Bomberos — información pública; MINSA |
| **CAMBIO PROPUESTO** | 1) Reemplazar `<br>` por `</p><p>`. 2) Título: "Incendio destruye vivienda en Monseñor Lezcano; un herido" (56 chars). 3) Agregar contexto: estadísticas de incendios en Managua. |
| **DESPUÉS** | Score esperado: 76-82 |
| **RIESGO** | Medio-alto — score 70 necesita mejora significativa |

---

#### B12. `IFFjvOi1HTG0oeiIuIBo` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 455 palabras, 3 H2 |
| **PROBLEMA** | Falta contexto geopolítico y impacto en seguridad centroamericana |
| **FUENTE** | Migración CR — información pública |
| **CAMBIO PROPUESTO** | Agregar contexto: relaciones Centroamérica-Medio Oriente, cooperación |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo |

---

#### B13. `JbGRXcj7AiJNPvQRcneT` — Score 84

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 84, aprobado false, 523 palabras, 6 H2 |
| **PROBLEMA** | Falta detalles del caso y contexto de seguridad en Matagalpa |
| **FUENTE** | Policía Nacional — información pública |
| **CAMBIO PROPUESTO** | Agregar contexto: seguridad en Matagalpa, estadísticas regionales |
| **DESPUÉS** | Score esperado: 88-92 |
| **RIESGO** | Bajo-medio |

---

#### B14. `Q19zidw5UoSjUlR1r9JP` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 484 palabras, 3 H2 |
| **PROBLEMA** | Falta datos de exportación, valor económico |
| **FUENTE** | MAG — datos públicos de exportación láctea |
| **CAMBIO PROPUESTO** | Agregar datos: volumen, valor, impacto en productores |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo |

---

#### B15. `SD09P4KU8vq4Mq1Vidzz` — Score 78

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 78, aprobado false, 744 palabras, 7 H2 |
| **PROBLEMA** | Falta contexto de incidencia de robos en Jalapa |
| **FUENTE** | Policía Nacional — datos públicos |
| **CAMBIO PROPUESTO** | Agregar contexto: seguridad en Nueva Segovia, sistema judicial |
| **DESPUÉS** | Score esperado: 82-86 |
| **RIESGO** | Medio |

---

#### B16. `SG87LjFIgCWnd6g8EKDq` — Score 76

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 76, aprobado false, 545 palabras, 5 H2 |
| **PROBLEMA** | Falta detalles técnicos: proveedor, financiamiento, distribución |
| **FUENTE** | MINVAH/DGB — información pública sobre compra de equipos |
| **CAMBIO PROPUESTO** | Agregar contexto: capacidad actual vs nueva, distribución por departamento |
| **DESPUÉS** | Score esperado: 80-86 |
| **RIESGO** | Medio |

---

#### B17. `VW3uBFbDCb6RR3KCiJ18` — Score 74

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 74, aprobado false, 743 palabras, 3 H2 |
| **PROBLEMA** | Falta análisis deportivo: por qué son favoritas |
| **FUENTE** | FIFA — ranking e información pública |
| **CAMBIO PROPUESTO** | Agregar análisis: datos de equipos, contexto deportivo |
| **DESPUÉS** | Score esperado: 80-86 |
| **RIESGO** | Medio |

---

#### B18. `ZJpLrlTrusn5Jex8WQgQ` — Score 78

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 78, aprobado false, 435 palabras, 5 H2, título 63 chars |
| **PROBLEMA** | Falta biografía e historial de "El Diablo". Título > 60. |
| **FUENTE** | Policía Nacional — información pública |
| **CAMBIO PROPUESTO** | 1) Título: "Capturan a "El Diablo" tras años prófugo en Nicaragua" (56 chars). 2) Agregar historial delictivo verificable. |
| **DESPUÉS** | Score esperado: 82-86 |
| **RIESGO** | Medio |

---

#### B19. `qAcmF4MWTiLsTACCG8v5` — Score 78

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 78, aprobado false, 527 palabras, 4 H2, título 64 chars, resumen 162 chars |
| **PROBLEMA** | Falta contexto Ley 779. Título > 60. Resumen > 160. |
| **FUENTE** | Ley 779 — texto legal público; Comisaría de la Mujer |
| **CAMBIO PROPUESTO** | 1) Título: "Agresión a mujer en Nindirí activa investigación bajo Ley 779" (60 chars). 2) Resumen: "Brenda López sufrió lesiones en Nindirí. El sospechoso fue detenido y el caso pasa a la Policía bajo la Ley 779." (113 chars). 3) Agregar contexto legal. |
| **DESPUÉS** | Score esperado: 82-86 |
| **RIESGO** | Medio |

---

#### B20. `e2xuC463KZm7pAubu9Rl` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 602 palabras, 6 H2 |
| **PROBLEMA** | Falta resultados detallados y contexto del balonmano en Nicaragua |
| **FUENTE** | Federación de Balonmano — información pública |
| **CAMBIO PROPUESTO** | Agregar resultados y contexto deportivo |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo |

---

#### B21. `hscMxXK16XKKq84yY1P6` — Score 86

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 86, aprobado false, 418 palabras, 5 H2 |
| **PROBLEMA** | Falta detalles: ubicaciones, causas, estadísticas |
| **FUENTE** | Policía Nacional, Cruz Roja — datos públicos |
| **CAMBIO PROPUESTO** | Agregar detalles y estadísticas de accidentes |
| **DESPUÉS** | Score esperado: 88-92 |
| **RIESGO** | Bajo-medio |

---

#### B22. `vvWJAwyV8adECw3IGqdy` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 649 palabras, 4 H2 |
| **PROBLEMA** | Falta datos de penetración de streaming en Nicaragua |
| **FUENTE** | Estudios de mercado, Telcor — datos públicos |
| **CAMBIO PROPUESTO** | Agregar datos: penetración, precios, hábitos |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo |

---

### CLASIFICACIÓN C — ENRIQUECIMIENTO PERIODÍSTICO (8 artículos)

---

#### C1. `kR3waCnxVDfMfVCV8sAH` — Score 88

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 88, aprobado false, 618 palabras, 7 H2 |
| **PROBLEMA** | Necesita enfoque en resultados y protagonistas |
| **FUENTE** | Federación de Atletismo — resultados públicos |
| **CAMBIO PROPUESTO** | Enriquecer con resultados detallados, tiempos, contexto atlético |
| **DESPUÉS** | Score esperado: 90-92 |
| **RIESGO** | Bajo |

---

#### C2. `qT9tAbCyVpicX7HmoaD0` — Score 80

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 80, aprobado false, 473 palabras, 5 H2, resumen 162 chars |
| **PROBLEMA** | Necesita contexto social de Nueva Guinea. Resumen > 160. |
| **FUENTE** | Contexto social verificable de Nueva Guinea (RAAS) |
| **CAMBIO PROPUESTO** | 1) Resumen: "La Policía detiene a un hombre de 38 años por la muerte de una joven de 18 en la laguna Las Vegas, Nueva Guinea." (113 chars). 2) Agregar contexto social. |
| **DESPUÉS** | Score esperado: 84-88 |
| **RIESGO** | Medio |

---

#### C3. `tYX2ZtXwUXg07CHI0ONj` — Score 74

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 74, aprobado false, 467 palabras, 5 H2 |
| **PROBLEMA** | Necesita contexto legal y de protección de menores |
| **FUENTE** | Código de la Niñez y Adolescencia (Ley 877) — texto legal público |
| **CAMBIO PROPUESTO** | Agregar capa periodística: contexto legal, protección de menores |
| **DESPUÉS** | Score esperado: 80-86 |
| **RIESGO** | Medio |

---

#### C4. `tlIXmTYnv4hIajXOQiup` — Score 82

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 82, aprobado false, 470 palabras, 7 H2, título 65 chars |
| **PROBLEMA** | Necesita contexto diaspórico. Título > 60. |
| **FUENTE** | Datos verificables de nicaragüenses en Puerto Rico |
| **CAMBIO PROPUESTO** | 1) Título: "Nicaragüense afectado en ataque en Canóvanas, Puerto Rico" (57 chars). 2) Agregar contexto diaspórico. |
| **DESPUÉS** | Score esperado: 86-90 |
| **RIESGO** | Medio |

---

#### C5. `tnX05ykqVT6WiYVflSii` — Score 74

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 74, aprobado false, 629 palabras, 4 H2 |
| **PROBLEMA** | Necesita contexto del béisbol infantil, jugadores, expectativas |
| **FUENTE** | Federación Nicaragüense de Béisbol — información pública |
| **CAMBIO PROPUESTO** | Enriquecer con contexto deportivo, jugadores, expectativas |
| **DESPUÉS** | Score esperado: 80-86 |
| **RIESGO** | Medio |

---

#### C6. `uJ076MyMZhQIJYTa1qOW` — Score 76

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 76, aprobado false, 402 palabras, 4 H2, 3 `<br>`, título 62 chars |
| **PROBLEMA** | Necesita contexto diaspórico. Título > 60. 3 `<br>`. |
| **FUENTE** | Datos verificables de nicaragüenses en Texas |
| **CAMBIO PROPUESTO** | 1) Título: "Nicaragüense José Salgado afectado en asalto en Austin" (55 chars). 2) Reemplazar `<br>` por `<p>`. 3) Agregar contexto diaspórico. |
| **DESPUÉS** | Score esperado: 80-86 |
| **RIESGO** | Medio |

---

#### C7. `wiHS5gvNy7U6tORXAhEU` — Score 80

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 80, aprobado false, 404 palabras, 3 H2 |
| **PROBLEMA** | Necesita contexto de accidentes laborales y derechos laborales |
| **FUENTE** | OSHA — estadísticas públicas de accidentes laborales |
| **CAMBIO PROPUESTO** | Agregar contexto laboral: estadísticas, derechos, protocolos |
| **DESPUÉS** | Score esperado: 84-88 |
| **RIESGO** | Medio |

---

#### C8. `yUMAJwJQ1yMJTSb2cdkP` — Score 86

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 86, aprobado false, 546 palabras, 3 H2 |
| **PROBLEMA** | Necesita enfoque desde Nicaragua: por qué importa |
| **FUENTE** | FIFA — información pública |
| **CAMBIO PROPUESTO** | Enriquecer con análisis desde perspectiva nicaragüense |
| **DESPUÉS** | Score esperado: 88-92 |
| **RIESGO** | Bajo-medio |

---

### CLASIFICACIÓN D — REESCRITURA (1 artículo)

---

#### D1. `zkdDsejAb5hLCpCaEbMR` — Score 64

| Campo | Valor |
|-------|-------|
| **ANTES** | Score 64, aprobado false, 403 palabras, 4 H2, 7 P, resumen 169 chars |
| **PROBLEMA** | Score muy bajo (64). Contenido cercano a comunicado oficial. Falta explicación, contexto, utilidad. Resumen > 160. |
| **FUENTE** | MIGOB, alcaldía de Masaya — información pública del proyecto |
| **CAMBIO PROPUESTO** | 1) Reescribir con identidad Nicaragua Informate. 2) Resumen: "Masaya estrena complejo del MINT que integra Bomberos y Migración para 422 mil habitantes." (89 chars). 3) Agregar contexto: inversión, capacidad, servicios, impacto. 4) Estructura: entrada periodística → contexto → detalles → qué sigue. |
| **DESPUÉS** | Score esperado: 78-86 |
| **RIESGO** | Alto — reescritura completa. Mantener todos los hechos verificables. |

---

### CLASIFICACIÓN E — NO RESCATABLE (0 artículos)

Ningún artículo se clasifica como E en esta fase. Todos tienen información verificable que puede ser mejorada.

---

## ESTRATEGIA DE EJECUCIÓN

### Orden de procesamiento

1. **Primero: Clasificación A** (6 artículos) — Correcciones estructurales sin contenido nuevo. Riesgo bajo.
2. **Segundo: Clasificación B score 88** (10 artículos) — Contexto verificable, cercanos a 90.
3. **Tercero: Clasificación C score 86-88** (3 artículos) — Enriquecimiento, cercanos a 90.
4. **Cuarto: Clasificación B score 84-86** (3 artículos) — Contexto verificable.
5. **Quinto: Clasificación B/C score 74-82** (14 artículos) — Requieren más trabajo.
6. **Sexto: Clasificación D** (1 artículo) — Reescritura.

### Límite de iteraciones

Máximo 2 iteraciones por artículo. Si después de 2 iteraciones el score sigue < 85:
- Clasificar como MEJORADO_PERO_NO_APROBADO
- No continuar modificando

### Reglas de ejecución

1. **No inventar** información, cifras, declaraciones, ni análisis
2. **No agregar** palabras únicamente para subir score
3. **Sanitizar** antes de guardar
4. **guardarConMeni()** después de cada modificación
5. **Registrar** score antes/después, aprobado antes/después
6. **Provenance** completo en `cambiosRealizados`

---

## RESUMEN DE CAMBIOS PROPUESTOS

| Tipo de cambio | Cantidad | Artículos |
|----------------|----------|-----------|
| **Envolver texto en `<p>`** | 1 | `1HmobwfngxeXoUofqosD` |
| **Reemplazar `<br>` por `<p>`** | 4 | `JOfOW7uTxkgDSIezo7Wn`, `ic2YGP8NQAc6r3VMvy9K`, `H25VVBdDntQpmy13uxdP`, `uJ076MyMZhQIJYTa1qOW` |
| **Acortar título** | 9 | `D7y1TWAyXq7SaNMirIjB`, `NA6PqCReq06PdIMSICEe`, `ic2YGP8NQAc6r3VMvy9K`, `GHbdyeiCzH7Jk0i5RVPA`, `H25VVBdDntQpmy13uxdP`, `ZJpLrlTrusn5Jex8WQgQ`, `qAcmF4MWTiLsTACCG8v5`, `tlIXmTYnv4hIajXOQiup`, `uJ076MyMZhQIJYTa1qOW` |
| **Acortar resumen** | 4 | `i88RK0Ulgkkzyq6YV4Um`, `qAcmF4MWTiLsTACCG8v5`, `qT9tAbCyVpicX7HmoaD0`, `zkdDsejAb5hLCpCaEbMR` |
| **Agregar H2** | 2 | `kJZTSfqmUGHJKA8SFaE8`, `Ilzcy77tyF8oFNPytokN` |
| **Agregar contexto verificable** | 22 | Todos los B |
| **Enriquecimiento periodístico** | 8 | Todos los C |
| **Reescritura completa** | 1 | `zkdDsejAb5hLCpCaEbMR` |

---

## SCORES ESPERADOS POST-INTERVENCIÓN

| Score esperado | Cantidad | Artículos |
|----------------|----------|-----------|
| **90+ (aprobado)** | 10-14 | A1, A4, A5, B6, B7, B8, B9, B12, B14, B20, B22, C1, C8, B21 |
| **85-89 (mejorado)** | 12-16 | A2, A3, A6, B1, B2, B3, B4, B5, B10, B11, B13, B15, B16, B17, B18, B19 |
| **80-84 (mejorado)** | 6-8 | C2, C3, C4, C5, C6, C7, D1 |
| **< 80 (no rescatable en 2 iteraciones)** | 2-4 | B11, B17, C3, C5 |

**Estimación de aprobados**: 10-14 de 37 (27-38%)
**Estimación de mejorados pero no aprobados**: 18-23 de 37
**Estimación de no rescatables**: 2-4 de 37

---

## AUTORIZACIÓN PENDIENTE

**Este dry-run no ejecuta ningún cambio.**

Se requiere autorización explícita para:
1. Ejecutar correcciones de Clasificación A (estructurales)
2. Ejecutar correcciones de Clasificación B (contexto verificable)
3. Ejecutar correcciones de Clasificación C (enriquecimiento)
4. Ejecutar reescritura de Clasificación D
5. Confirmar fuentes de datos para contexto verificable

**No se ejecutará ninguna modificación hasta aprobación.**
