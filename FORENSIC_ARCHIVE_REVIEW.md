# FORENSIC ARCHIVE REVIEW — FASE 15.1
## Revisión individual de 7 candidatos a archivado
## Fecha: 2026-08-12

---

## METODOLOGÍA

Cada candidato fue analizado individualmente considerando:
- ¿Es agenda/previsión o cobertura de evento pasado?
- ¿Contiene información histórica, resultados, o protagonistas?
- ¿Tiene tráfico, enlaces internos, o valor evergreen?
- ¿Es útil para búsqueda?
- ¿Es reversible?

Clasificación: `ARCHIVE_CONFIRMED` | `ARCHIVE_REVIEW` | `KEEP`

---

## 1. Nicaragua debuta en súper ronda con la mira en Lima 2027

| Campo | Valor |
|-------|-------|
| **ID** | `2JtGQ8X981oq4giKYxQo` |
| **Slug** | `nicaragua-debuta-en-super-ronda-con-la-mira-en-lima-2027` |
| **Fecha** | Sin fecha (vacía en Firestore) |
| **Score MENI** | 98 |
| **Aprobado MENI** | true |
| **Estado publicado** | true |
| **Categoría** | Deportes |
| **Palabras** | 580 |
| **Motivo obsolescencia** | JUEGOS_SANTO_DOMINGO_FINALIZADOS |

### Análisis
- **¿Agenda/previsión?** No — cubre el debut real en la súper ronda
- **¿Información histórica?** SÍ — contiene resultados deportivos del evento
- **¿Protagonistas?** SÍ — atletas nicaragüenses en competencia internacional
- **¿Valor evergreen?** PARCIAL — referencia histórica para Lima 2027
- **¿Útil para búsqueda?** SÍ — "Nicaragua Santo Domingo 2026" seguirá siendo consultado
- **Riesgo SEO** | Bajo — contenido de calidad, score 98
- **Riesgo de URL** | Bajo — URL descriptiva, no temporal
- **Reversibilidad** | Total — basta cambiar `estado` a 'archivado' y revertir

### Clasificación: **KEEP**
**Justificación**: Cobertura de resultado deportivo histórico. Score 98 (ORO). Contiene protagonistas y resultados. Seguirá siendo consultado como referencia de Santo Domingo 2026. Archivar sería perder contenido de valor.

---

## 2. De Arjona a Aventura: conciertos anunciados para Nicaragua

| Campo | Valor |
|-------|-------|
| **ID** | `AoP9lWscit6xRvpPwJ6N` |
| **Slug** | `de-arjona-a-aventura-conciertos-anunciados-para-nicaragua` |
| **Fecha** | 2026-06-10 |
| **Score MENI** | 92 |
| **Aprobado MENI** | true |
| **Estado publicado** | true |
| **Categoría** | Nacionales |
| **Palabras** | 580 |
| **Motivo obsolescencia** | EVENTO_ANUNCIADO_YA_PASO |

### Análisis
- **¿Agenda/previsión?** SÍ — era agenda de conciertos futuros
- **¿Información histórica?** PARCIAL — registro de eventos culturales realizados
- **¿Protagonistas?** SÍ — artistas (Arjona, Aventura)
- **¿Valor evergreen?** NO — los conciertos ya pasaron; la información de "anunciados" es obsoleta
- **¿Útil para búsqueda?** BAJO — "conciertos anunciados Nicaragua 2026" pierde relevancia
- **Riesgo SEO** | Medio — contenido desactualizado puede generar bounce
- **Riesgo de URL** | Bajo — URL genérica, no problemática
- **Reversibilidad** | Total

### Clasificación: **ARCHIVE_REVIEW**
**Justificación**: Era agenda de eventos que ya ocurrieron. El título dice "anunciados" lo que es engañoso después de que pasaron. Sin embargo, tiene score 92 y podría tener valor como registro histórico. Recomendación: archivar o actualizar título a pasado ("Conciertos realizados en Nicaragua: de Arjona a Aventura").

---

## 3. Arrancó la Feria Ganadera Agostina 2026 en Managua

| Campo | Valor |
|-------|-------|
| **ID** | `hSohwt9sC0cfwiXEITLg` |
| **Slug** | `arranco-la-feria-ganadera-agostina-2026-en-managua` |
| **Fecha** | Sin fecha (vacía en Firestore) |
| **Score MENI** | 88 |
| **Aprobado MENI** | false |
| **Estado publicado** | false (despublicado por aprobadoMeni=false) |
| **Categoría** | Nacionales |
| **Palabras** | 563 |
| **Motivo obsolescencia** | FERIA_GANADERA_FINALIZADA |

### Análisis
- **¿Agenda/previsión?** No — cubre la inauguración (evento que arrancó)
- **¿Información histórica?** SÍ — registro de evento cultural/económico importante
- **¿Protagonistas?** SÍ — sector ganadero, autoridades
- **¿Valor evergreen?** BAJO — la feria ya terminó
- **¿Útil para búsqueda?** MEDIO — "Feria Ganadera 2026 Managua" puede seguir siendo consultado
- **Riesgo SEO** | Medio — ya está despublicado, no genera tráfico
- **Riesgo de URL** | Bajo
- **Reversibilidad** | Total

### Clasificación: **ARCHIVE_CONFIRMED**
**Justificación**: Evento finalizado, ya despublicado por MENI (score 88, no aprobado), sin valor evergreen significativo. Archivar formalmente para limpiar el backlog.

---

## 4. Nicaragua abre ante Colombia en Santo Domingo 2026

| Campo | Valor |
|-------|-------|
| **ID** | `mnOKSoFSHJBxuosmF3Tw` |
| **Slug** | `nicaragua-abre-ante-colombia-en-santo-domingo-2026` |
| **Fecha** | 2026-07-02 |
| **Score MENI** | 90 |
| **Aprobado MENI** | true |
| **Estado publicado** | true |
| **Categoría** | Deportes |
| **Palabras** | 505 |
| **Motivo obsolescencia** | JUEGOS_SANTO_DOMINGO_FINALIZADOS |

### Análisis
- **¿Agenda/previsión?** No — cubre el partido inaugural real
- **¿Información histórica?** SÍ — resultado deportivo, enfrentamiento Nicaragua-Colombia
- **¿Protagonistas?** SÍ — selección nacional, atletas
- **¿Valor evergreen?** PARCIAL — referencia histórica de los Juegos
- **¿Útil para búsqueda?** SÍ — "Nicaragua Colombia Santo Domingo 2026" seguirá siendo consultado
- **Riesgo SEO** | Bajo — score 90, aprobado
- **Riesgo de URL** | Bajo
- **Reversibilidad** | Total

### Clasificación: **KEEP**
**Justificación**: Cobertura de evento deportivo internacional con resultados. Score 90 (aprobado). Valor histórico como registro del debut de Nicaragua en Santo Domingo 2026.

---

## 5. Con 204 representantes, Nicaragua va por nuevas medallas

| Campo | Valor |
|-------|-------|
| **ID** | `nyF9rfm2AkQACTQPzFAn` |
| **Slug** | `con-204-representantes-nicaragua-va-por-nuevas-medallas` |
| **Fecha** | 2026-07-21 |
| **Score MENI** | 92 |
| **Aprobado MENI** | true |
| **Estado publicado** | true |
| **Categoría** | Deportes |
| **Palabras** | 592 |
| **Motivo obsolescencia** | JUEGOS_SANTO_DOMINGO_FINALIZADOS |

### Análisis
- **¿Agenda/previsión?** PARCIAL — "va por nuevas medallas" es expectativa pre-resultado
- **¿Información histórica?** SÍ — registro de la delegación nicaragüense (204 atletas)
- **¿Protagonistas?** SÍ — delegación completa
- **¿Valor evergreen?** BAJO-MEDIO — el dato de 204 representantes es histórico
- **¿Útil para búsqueda?** MEDIO — "Nicaragua Santo Domingo medallas" seguirá consultándose
- **Riesgo SEO** | Bajo — score 92, aprobado
- **Riesgo de URL** | Bajo
- **Reversibilidad** | Total

### Clasificación: **KEEP**
**Justificación**: Aunque es pre-resultados, contiene dato histórico relevante (204 representantes). Score 92 (aprobado). El contenido tiene valor como registro de la participación nicaragüense. No archivar.

---

## 6. KFC busca a 50 fans para inaugurar su primer local en Nicaragua

| Campo | Valor |
|-------|-------|
| **ID** | `s3JrANBvskSO61lPqPrv` |
| **Slug** | `kfc-busca-a-50-fans-para-inaugurar-su-primer-local-en-nicaragua` |
| **Fecha** | 2026-07-18 |
| **Score MENI** | 92 |
| **Aprobado MENI** | true |
| **Estado publicado** | true |
| **Categoría** | Nacionales |
| **Palabras** | 406 |
| **Motivo obsolescencia** | KFC_INAUGURACION_YA_REALIZADA |

### Análisis
- **¿Agenda/previsión?** SÍ — "busca a 50 fans" era un llamado pre-inauguración
- **¿Información histórica?** SÍ — registro del debut de KFC en Nicaragua (hecho económico relevante)
- **¿Protagonistas?** SÍ — marca KFC, fans nicaragüenses
- **¿Valor evergreen?** BAJO — el llamado ya no aplica
- **¿Útil para búsqueda?** MEDIO — "KFC Nicaragua inaugural" puede seguir siendo consultado
- **Riesgo SEO** | Medio — "busca a 50 fans" es engañoso después de la inauguración
- **Riesgo de URL** | Bajo
- **Reversibilidad** | Total

### Clasificación: **ARCHIVE_REVIEW**
**Justificación**: El llamado a fans ya no aplica. El título es engañoso en tiempo presente. Sin embargo, el hecho económico (KFC llega a Nicaragua) tiene valor histórico. Recomendación: archivar o actualizar título a pasado ("KFC inauguró su primer local en Nicaragua con 50 fans").

---

## 7. Nuevo complejo en Masaya reúne Bomberos y Migración (DO_NOT_PUBLISH)

| Campo | Valor |
|-------|-------|
| **ID** | `zkdDsejAb5hLCpCaEbMR` |
| **Slug** | `nuevo-complejo-en-masaya-reune-bomberos-y-migracion` |
| **Fecha** | 2026-07-07 |
| **Score MENI** | 64 |
| **Aprobado MENI** | false |
| **Estado publicado** | false (despublicado por aprobadoMeni=false) |
| **Categoría** | Nacionales |
| **Palabras** | 403 |
| **Motivo clasificación** | score_64_insuficiente |

### Análisis
- **¿Puede rescatarse con información verificable?** POSIBLE — el tema (nuevo complejo para Bomberos y Migración en Masaya) es un hecho verificable
- **¿Qué falta?** Contexto: por qué se construyó, inversión, impacto en la comunidad, capacidad del complejo, qué servicios específicos ofrecerá
- **¿Qué fuente sería necesaria?** Comunicado oficial de MIGOB o Alcaldía de Masaya, datos de inversión
- **¿Tipo de intervención?** B — enriquecimiento (agregar contexto y datos)
- **Score actual** | 64 — muy por debajo del mínimo (90)
- **Contexto score** | 25 (bajo)
- **Valor score** | 75 (aceptable)
- **Riesgo SEO** | Bajo — ya está despublicado
- **Riesgo de URL** | Bajo
- **Reversibilidad** | Total

### Clasificación: **EDITORIAL_ENRICHMENT** (no archivar)
**Justificación**: El artículo tiene un hecho verificable y relevante (nueva infraestructura pública en Masaya). Score 64 indica que MENI detectó falta de contexto y explicación, no que el contenido sea erróneo. Con enriquecimiento editorial (agregar inversión, capacidad, servicios, impacto) podría alcanzar aprobación. **No archivar automáticamente por score bajo.** Pasar a cola de enriquecimiento editorial como caso especial.

---

## RESUMEN

| Clasificación | Cantidad | IDs |
|---------------|----------|-----|
| **KEEP** | 3 | `2JtGQ8X981oq4giKYxQo`, `mnOKSoFSHJBxuosmF3Tw`, `nyF9rfm2AkQACTQPzFAn` |
| **ARCHIVE_REVIEW** | 2 | `AoP9lWscit6xRvpPwJ6N`, `s3JrANBvskSO61lPqPrv` |
| **ARCHIVE_CONFIRMED** | 1 | `hSohwt9sC0cfwiXEITLg` |
| **→ EDITORIAL_ENRICHMENT** (recategorizado) | 1 | `zkdDsejAb5hLCpCaEbMR` |

### Acciones recomendadas

1. **KEEP (3)**: No modificar. Permanecen publicados.
2. **ARCHIVE_REVIEW (2)**: Actualizar título a tiempo pasado O archivar. Decisión editorial manual.
3. **ARCHIVE_CONFIRMED (1)**: Cambiar `estado` a 'archivado' en Firestore.
4. **EDITORIAL_ENRICHMENT (1)**: El artículo DO_NOT_PUBLISH recategorizado. Agregar a cola de enriquecimiento con prioridad. No archivar.

### Totales ajustados

- ARCHIVE_CONFIRMED: **1** (no 6)
- ARCHIVE_REVIEW: **2**
- KEEP (reclasificados desde ARCHIVE): **3**
- EDITORIAL_ENRICHMENT (recategorizado desde DO_NOT_PUBLISH): **1**
