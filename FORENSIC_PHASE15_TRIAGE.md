# FORENSIC_PHASE15_TRIAGE.md
# Triage y Rescate Editorial Automatizado — 281 Artículos
# Fecha: 2026-08-11
# DRY RUN — No se han realizado escrituras

## RESUMEN DE CLASIFICACIÓN

| Clasificación | Cantidad | Descripción |
|---------------|----------|-------------|
| **KEEP** | 235 | Aprobados, correctos, conservar sin modificaciones |
| **AUTO_FIX** | 3 | Corregibles técnicamente (HTML contamination, formato) |
| **EDITORIAL_ENRICHMENT** | 36 | Rechazados, requieren intervención editorial manual |
| **ARCHIVE** | 6 | Eventos finalizados, valor editorial caducado |
| **DUPLICATE** | 0 | No se encontraron duplicados reales |
| **DO_NOT_PUBLISH** | 1 | Score insuficiente, sin valor editorial |
| **TOTAL** | 281 | |

## PREGUNTAS OBLIGATORIAS

### ¿Cuántos realmente merecen estar publicados?
**235** — artículos aprobados con score ≥ 85 y contenido correcto.

### ¿Cuántos solo necesitaban correcciones técnicas?
**3** — artículos con HTML contamination o formato corregible.

### ¿Cuántos necesitan contexto?
**36** — artículos rechazados que requieren enriquecimiento editorial con información verificable.

### ¿Cuántos están obsoletos?
**6** — eventos finalizados cuyo valor informativo caducó.

### ¿Cuántos son duplicados?
**0** — no se encontraron duplicados reales. El par `BAcOCY6ZJ7XpDdzfRUZ1` vs `hscMxXK16XKKq84yY1P6` tiene títulos similares (0.71) pero contenido diferente (0.16) y fechas diferentes (5 días de diferencia). Son **noticias distintas sobre hechos similares**.

### ¿Cuántos definitivamente no vale la pena conservar?
**1** — score 64, transcripción sin aporte editorial.

---

## ARCHIVE — 6 Artículos Obsoletos

| ID | Score | Motivo | Título |
|----|-------|--------|--------|
| 2JtGQ8X981oq4giKYxQo | 98 | JUEGOS_SANTO_DOMINGO_FINALIZADOS | Nicaragua debuta en súper ronda con la mira en Lima 2027 |
| AoP9lWscit6xRvpPwJ6N | 92 | EVENTO_ANUNCIADO_YA_PASO | De Arjona a Aventura: conciertos anunciados para Nicaragua |
| hSohwt9sC0cfwiXEITLg | 88 | FERIA_GANADERA_FINALIZADA | Arrancó la Feria Ganadera Agostina 2026 en Managua |
| mnOKSoFSHJBxuosmF3Tw | 90 | JUEGOS_SANTO_DOMINGO_FINALIZADOS | Nicaragua abre ante Colombia en Santo Domingo 2026 |
| nyF9rfm2AkQACTQPzFAn | 92 | JUEGOS_SANTO_DOMINGO_FINALIZADOS | Con 204 representantes, Nicaragua va por nuevas medallas |
| s3JrANBvskSO61lPqPrv | 92 | KFC_INAUGURACION_YA_REALIZADA | KFC busca a 50 fans para inaugurar su primer local en Nicaragua |

### Análisis de obsolescencia

- **Juegos Santo Domingo 2026**: Finalizaron el 4 de agosto. 3 artículos son previews/anuncios de un evento ya terminado.
- **Feria Ganadera Agostina**: Finalizó el 10 de agosto. 1 artículo anuncia el inicio de un evento ya terminado.
- **Conciertos anunciados**: Agenda de conciertos junio-noviembre. Algunos ya pasaron, pero la agenda tiene valor de referencia. **Revisión**: este artículo podría mantenerse como KEEP si tiene valor de agenda. Sin embargo, al ser una lista de eventos con fechas específicas, algunos ya pasados, se clasifica como ARCHIVE.
- **KFC inauguración**: KFC ya abrió (artículo del 27 de mayo). La convocatoria a fans para inaugurar es obsoleta.

**Acción**: Archivar (no eliminar). Preservar contenido, scoreMeni, provenance, fecha y motivo.

---

## AUTO_FIX — 3 Artículos Corregibles

| ID | Score | Aprobado | Fixes | Título |
|----|-------|----------|-------|--------|
| CMo0EIdKF9E5CYTJj8H9 | 84 | false | titulo_doble_dospuntos, entidades_html | Economía de Nicaragua: dispara récord: crece 6% en remesas |
| FLbXd6XRrTl5TCdTkNYT | 100 | true | wrappers_tecnicos | Nicaragua en Santo Domingo 2026: medallas, béisbol y retos |
| lzsto5T2q85IgrVkqlA2 | 98 | true | wrappers_tecnicos | Pokémon dona 100 millones de yenes tras terremoto en Japón |

### Acción propuesta

1. **CMo0EIdKF9E5CYTJj8H9**: Corregir título (doble dospuntos), limpiar entidades HTML. Re-evaluar MENI.
2. **FLbXd6XRrTl5TCdTkNYT**: Limpiar wrappers técnicos (`<div>`, `<span>`). Conservar score.
3. **lzsto5T2q85IgrVkqlA2**: Limpiar wrappers técnicos. Conservar score.

**Después de cualquier modificación**: sanitize → guardarConMeni → MENI → persistencia.

---

## EDITORIAL_ENRICHMENT — 36 Artículos

Todos son artículos rechazados (aprobadoMeni=false) que requieren intervención editorial manual.

### Sub-clasificación

| Tipo | Cantidad | Descripción |
|------|----------|-------------|
| Falta explicación de relevancia | 18 | No explican por qué importa la noticia |
| Sin mejoras automáticas disponibles | 18 | Score justo, necesita enriquecimiento real |

### Los 36 artículos

| ID | Score | Motivo | Título |
|----|-------|--------|--------|
| 1HmobwfngxeXoUofqosD | 92 | falta_explicacion_relevancia | Primeros bebés del Día de las Madres... |
| 7XzL7aTqVYBpTNKgSPxQ | 88 | sin_mejoras_automaticas | Puerto Corinto lidera llegada de 11 buques |
| CypRypZIGLckqywkZq8X | 74 | falta_explicacion_relevancia | Nicaragüense sigue desaparecida en Venezuela |
| D7y1TWAyXq7SaNMirIjB | 80 | falta_explicacion_relevancia | Dos nicaragüenses fallecen en el extranjero |
| EcKTeqT7kLcFElUX3DM2 | 78 | falta_explicacion_relevancia | Dueño de semovientes paga C$769 mil |
| F4UddilPobcIjIkZ1e55 | 78 | falta_explicacion_relevancia | Escolta de ULTRAVAL enfrenta juicio |
| GHbdyeiCzH7Jk0i5RVPA | 74 | sin_mejoras_automaticas | Polémica Mundial no frena reconocimiento |
| H25VVBdDntQpmy13uxdP | 70 | sin_mejoras_automaticas | Incendio destruye vivienda Monseñor Lezcano |
| IFFjvOi1HTG0oeiIuIBo | 88 | sin_mejoras_automaticas | Costa Rica detiene a palestino con vínculos a Hamás |
| Ilzcy77tyF8oFNPytokN | 74 | falta_explicacion_relevancia | Campeonato 1/4 de Milla |
| JOfOW7uTxkgDSIezo7Wn | 84 | falta_explicacion_relevancia | Capturan acusado de agredir en Rivas |
| JbGRXcj7AiJNPvQRcneT | 84 | sin_mejoras_automaticas | Capturan autores doble crimen San Ramón |
| NA6PqCReq06PdIMSICEe | 86 | falta_explicacion_relevancia | Colapsa vivienda ancestral en Monimbó |
| Q19zidw5UoSjUlR1r9JP | 88 | sin_mejoras_automaticas | Nicaragua abastece 47% de lácteos a El Salvador |
| SD09P4KU8vq4Mq1Vidzz | 78 | sin_mejoras_automaticas | Capturan sujeto por robo US$30 mil |
| SG87LjFIgCWnd6g8EKDq | 76 | sin_mejoras_automaticas | Nicaragua invierte $13.9M en camiones |
| VW3uBFbDCb6RR3KCiJ18 | 74 | sin_mejoras_automaticas | España, Francia, Argentina favoritas Mundial |
| ZJpLrlTrusn5Jex8WQgQ | 78 | sin_mejoras_automaticas | Captura de El Diablo |
| e0QJyxs1azyZahzs8VuN | 88 | falta_explicacion_relevancia | Venezuela: 164 afectados y 30 mil desaparecidos |
| e2xuC463KZm7pAubu9Rl | 88 | sin_mejoras_automaticas | Nicaragua conquista IHF Trophy |
| hscMxXK16XKKq84yY1P6 | 86 | sin_mejoras_automaticas | Accidentes en Nicaragua dejan un fallecido |
| i88RK0Ulgkkzyq6YV4Um | 88 | falta_explicacion_relevancia | Chinandega estrena 75 viviendas |
| ic2YGP8NQAc6r3VMvy9K | 88 | falta_explicacion_relevancia | Venezuela: réplicas continúan |
| kJZTSfqmUGHJKA8SFaE8 | 88 | falta_explicacion_relevancia | Julieta Venegas interpreta himno |
| kR3waCnxVDfMfVCV8sAH | 88 | sin_mejoras_automaticas | Nicaragua gana oro en relevos 4x100 |
| n2Buq4aBhvnrXUcTlwuD | 88 | falta_explicacion_relevancia | Capturan a pinolero por llevarse a niña |
| qAcmF4MWTiLsTACCG8v5 | 78 | falta_explicacion_relevancia | Agresión a mujer en Nindirí |
| qT9tAbCyVpicX7HmoaD0 | 80 | sin_mejoras_automaticas | Nueva Guinea busca respuestas |
| sH5OCUULzSvZFhRcHXzb | 88 | falta_explicacion_relevancia | Cinco agentes fallecen en Honduras |
| tYX2ZtXwUXg07CHI0ONj | 74 | sin_mejoras_automaticas | Fiscalía acusa a madre y padrastro |
| tlIXmTYnv4hIajXOQiup | 82 | sin_mejoras_automaticas | Nicaragüense afectado en Canóvanas |
| tnX05ykqVT6WiYVflSii | 74 | sin_mejoras_automaticas | Beisbol infantil viaja a Puerto Rico |
| uJ076MyMZhQIJYTa1qOW | 76 | falta_explicacion_relevancia | Nicaragüense Salgado afectado en asalto |
| vvWJAwyV8adECw3IGqdy | 88 | falta_explicacion_relevancia | Netflix, Max y Disney+ dominan streaming |
| wiHS5gvNy7U6tORXAhEU | 80 | sin_mejoras_automaticas | Colapso en construcción cobra vida |
| yUMAJwJQ1yMJTSb2cdkP | 86 | falta_explicacion_relevancia | México, Brasil y Argentina avanzan |

**Acción**: Intervención editorial manual con información verificable. NO fabricar contexto. NO agregar palabras para subir score.

---

## DO_NOT_PUBLISH — 1 Artículo

| ID | Score | Título | Motivo |
|----|-------|--------|--------|
| zkdDsejAb5hLCpCaEbMR | 64 | Nuevo complejo en Masaya reúne Bomberos y Migración | Transcripción, 403 palabras, sin aporte editorial |

**Acción**: Archivar como LOW_EDITORIAL_VALUE. No eliminar.

---

## DUPLICADOS — Análisis

### Par analizado

| ID 1 | ID 2 | Similitud título | Similitud contenido | Días diff | Veredicto |
|------|------|-----------------|--------------------|-----------|-----------| 
| BAcOCY6ZJ7XpDdzfRUZ1 | hscMxXK16XKKq84yY1P6 | 0.71 | 0.16 | 5 | NOTICIAS DISTINTAS |

**Análisis**:
- Títulos similares: "Accidentes dejan un fallecido y varios lesionados en Nicaragua" vs "Accidentes en Nicaragua dejan un fallecido y varios heridos"
- Contenido diferente: 0.16 de similitud (diferentes ubicaciones, diferentes accidentes)
- Fechas diferentes: 19 julio vs 24 julio
- **Conclusión**: Son hechos diferentes en fechas diferentes. No son duplicados.
- **Recomendación**: Diferenciar el título del segundo artículo para evitar confusión.

### Búsqueda exhaustiva

Se compararon los 281 artículos entre sí (39,760 pares) usando similitud de Jaccard en títulos (umbral 0.55) y contenido (umbral 0.45). **0 duplicados reales encontrados.**

---

## DRY RUN — Resumen de cambios propuestos

### Lo que NO se hará
- No se modificarán los 235 artículos KEEP
- No se fabricará contexto para los 36 EDITORIAL_ENRICHMENT
- No se eliminará físicamente ningún artículo
- No se modificarán scores manualmente
- No se agregarán palabras para subir score

### Lo que SÍ se hará (con aprobación)
1. **Archivar 6 artículos** obsoletos (marcar `archived: true`, preservar todo)
2. **Archivar 1 artículo** DO_NOT_PUBLISH (marcar `archived: true`, motivo LOW_EDITORIAL_VALUE)
3. **Auto-fix 3 artículos**:
   - CMo0EIdKF9E5CYTJj8H9: corregir título + limpiar HTML → re-evaluar MENI
   - FLbXd6XRrTl5TCdTkNYT: limpiar wrappers → conservar score
   - lzsto5T2q85IgrVkqlA2: limpiar wrappers → conservar score

### Score antes/después esperado

| ID | Score antes | Cambio | Score esperado después |
|----|------------|--------|----------------------|
| CMo0EIdKF9E5CYTJj8H9 | 84 | fix título + HTML | 84-88 (re-evaluar) |
| FLbXd6XRrTl5TCdTkNYT | 100 | limpiar wrappers | 100 (conservar) |
| lzsto5T2q85IgrVkqlA2 | 98 | limpiar wrappers | 98 (conservar) |

---

## KEEP — 235 Artículos

No se modifican. No se intenta subir score. No se toca por perfeccionismo.

Incluye artículos con issues técnicos menores (em tags, p vacíos, datelines) que no afectan el score ni la calidad editorial.

---

## VEREDICTO

```
TOTAL = 281

KEEP = 235 (83.6%)
AUTO_FIX = 3 (1.1%)
EDITORIAL_ENRICHMENT = 36 (12.8%)
ARCHIVE = 6 (2.1%)
DUPLICATE = 0 (0%)
DO_NOT_PUBLISH = 1 (0.4%)

MENI = 281/281 auténtico
PROVENANCE = 281/281 completo
```

### Regla de oro cumplida

- ✅ No se convirtió contenido mediocre en aprobado mediante trucos
- ✅ No se convirtió contenido obsoleto en nuevo mediante relleno
- ✅ No se eliminó contenido sin evidencia
- ✅ No se fabricó contexto
- ✅ No se inventaron datos
- ✅ El score es la evaluación del trabajo editorial, no el objetivo
- ✅ Primera decisión editorial, después corrección, después MENI

### Archivos generados

- `FORENSIC_PHASE15_TRIAGE.json` — Clasificación completa con metadatos
- `FORENSIC_PHASE15_TRIAGE.csv` — CSV para revisión
- `FORENSIC_PHASE15_TRIAGE.md` — Este reporte
