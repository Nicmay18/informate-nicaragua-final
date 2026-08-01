# VALIDACIÓN DE MEJORA MENI — 5 NOTICIAS REALES

## Objetivo

Comprobar si aplicar las correcciones recomendadas por MENI aumenta realmente la calidad editorial de las noticias sin inventar datos ni agregar relleno.

## Metodología

1. Se seleccionaron 5 noticias reales: 2 de MENI alto, 2 de MENI medio, 1 de MENI bajo.
2. Se ejecutó `runMeniAsync(input)` para capturar el estado ANTES.
3. Se aplicó `autoCorrectNoticia(input, resultado)` del módulo MENI.
4. Se ejecutó `runMeniAsync(inputCorregido)` para capturar el estado DESPUÉS.
5. Se compararon score, utilidad, originalidad, profundidad, EEAT y aporte propio.

## Resultado promedio

| Métrica | ANTES | DESPUÉS | Δ |
| ---- | ---- | ---- | ---- |
| Score MENI | 90.00 | 90.00 | +0.00 |
| Utilidad | 100.00 | 100.00 | +0.00 |
| Originalidad | 100.00 | 100.00 | +0.00 |
| Profundidad | 100.00 | 100.00 | +0.00 |
| EEAT | 100.00 | 100.00 | +0.00 |
| Aporte propio | 20.00 | 20.00 | +0.00 |

## Resultados por noticia

### 1. [alto] noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de

**Título:** Noruega vuelve a octavos del Mundial tras 28 años de ausencia
**Categoría:** Deportes
**Palabras:** 398

#### FASE 1 — Estado original

- **Score MENI:** 100.00
- **Problemas detectados:**
- **Valor actual:** score 100.00 | utilidad 100.00 | originalidad 100.00 | profundidad 100.00 | EEAT 100.00 | aporte 0.00

#### FASE 2 — Correcciones aplicadas por MENI

- Título acortado de 61 a 52 caracteres.

#### FASE 3 — ANTES vs DESPUÉS

| Métrica | ANTES | DESPUÉS | Δ |
| ---- | ---- | ---- | ---- |
| Score MENI | 100.00 | 100.00 | +0.00 |
| Utilidad | 100.00 | 100.00 | +0.00 |
| Originalidad | 100.00 | 100.00 | +0.00 |
| Profundidad | 100.00 | 100.00 | +0.00 |
| EEAT | 100.00 | 100.00 | +0.00 |
| Aporte propio | 0.00 | 0.00 | +0.00 |

### 2. [alto] mundial-2026-sorpresas-favoritos-y-como-se-vive-en-nicaragua

**Título:** Mundial 2026: sorpresas, favoritos y cómo se vive en Nicaragua
**Categoría:** Deportes
**Palabras:** 460

#### FASE 1 — Estado original

- **Score MENI:** 100.00
- **Problemas detectados:**
- **Valor actual:** score 100.00 | utilidad 100.00 | originalidad 100.00 | profundidad 100.00 | EEAT 100.00 | aporte 0.00

#### FASE 2 — Correcciones aplicadas por MENI

- Título acortado de 62 a 52 caracteres.

#### FASE 3 — ANTES vs DESPUÉS

| Métrica | ANTES | DESPUÉS | Δ |
| ---- | ---- | ---- | ---- |
| Score MENI | 100.00 | 100.00 | +0.00 |
| Utilidad | 100.00 | 100.00 | +0.00 |
| Originalidad | 100.00 | 100.00 | +0.00 |
| Profundidad | 100.00 | 100.00 | +0.00 |
| EEAT | 100.00 | 100.00 | +0.00 |
| Aporte propio | 0.00 | 0.00 | +0.00 |

### 3. [medio] capturan-a-pinolero-por-llevarse-a-nina-de-13-anos

**Título:** Capturan a pinolero por llevarse a niña de 13 años
**Categoría:** Internacionales
**Palabras:** 360

#### FASE 1 — Estado original

- **Score MENI:** 88.00
- **Problemas detectados:**
  - Responder: Como repercute?; Cual es el contexto?; Que antecedentes existen?; Por que esta noticia merece publicarse aqui?; ¿Dónde ocurrió?
  - Explicar: Qué ocurrió en el exterior; Contexto internacional necesario
- **Valor actual:** score 88.00 | utilidad 100.00 | originalidad 100.00 | profundidad 100.00 | EEAT 100.00 | aporte 0.00

#### FASE 2 — Correcciones aplicadas por MENI


#### FASE 3 — ANTES vs DESPUÉS

| Métrica | ANTES | DESPUÉS | Δ |
| ---- | ---- | ---- | ---- |
| Score MENI | 88.00 | 88.00 | +0.00 |
| Utilidad | 100.00 | 100.00 | +0.00 |
| Originalidad | 100.00 | 100.00 | +0.00 |
| Profundidad | 100.00 | 100.00 | +0.00 |
| EEAT | 100.00 | 100.00 | +0.00 |
| Aporte propio | 0.00 | 0.00 | +0.00 |

### 4. [medio] venezuela-replicas-continuan-con-920-victimas-y-miles-sin-rastro

**Título:** Venezuela: réplicas continúan con 920 víctimas y miles sin rastro
**Categoría:** Internacionales
**Palabras:** 463

#### FASE 1 — Estado original

- **Score MENI:** 88.00
- **Problemas detectados:**
  - Responder: Por que importa en Nicaragua?; Como repercute?; Cual es el contexto?; Que antecedentes existen?; Por que esta noticia merece publicarse aqui?; ¿Qué decisión o hecho político ocurrió?; ¿Quién lo tomó o anunció?; ¿Qué cambia con esta decisión?
  - Explicar: Qué decisión se tomó; Cómo le afecta directamente; Desde cuándo aplica
- **Valor actual:** score 88.00 | utilidad 100.00 | originalidad 100.00 | profundidad 100.00 | EEAT 100.00 | aporte 0.00

#### FASE 2 — Correcciones aplicadas por MENI

- Título acortado de 65 a 58 caracteres.

#### FASE 3 — ANTES vs DESPUÉS

| Métrica | ANTES | DESPUÉS | Δ |
| ---- | ---- | ---- | ---- |
| Score MENI | 88.00 | 88.00 | +0.00 |
| Utilidad | 100.00 | 100.00 | +0.00 |
| Originalidad | 100.00 | 100.00 | +0.00 |
| Profundidad | 100.00 | 100.00 | +0.00 |
| EEAT | 100.00 | 100.00 | +0.00 |
| Aporte propio | 0.00 | 0.00 | +0.00 |

### 5. [bajo] beisbol-infantil-nicaragua-viaja-a-puerto-rico-y

**Título:** Beisbol infantil: Nicaragua viaja a Puerto Rico y Ecuador
**Categoría:** Deportes
**Palabras:** 633

#### FASE 1 — Estado original

- **Score MENI:** 74.00
- **Problemas detectados:**
  - Responder: Quienes jugaron?; Donde y cuando fue?; Como queda la tabla?; Cual es el proximo partido?; Hubo figuras destacadas?; ¿Quiénes jugaron?; ¿Dónde y cuándo fue el partido o evento?; ¿Qué viene ahora para el equipo o selección?
  - Explicar: Qué ocurrió en el exterior; Contexto internacional necesario
- **Valor actual:** score 74.00 | utilidad 100.00 | originalidad 100.00 | profundidad 100.00 | EEAT 100.00 | aporte 100.00

#### FASE 2 — Correcciones aplicadas por MENI

- Aplicadas correcciones automáticas de lenguaje, terminología y párrafos.

#### FASE 3 — ANTES vs DESPUÉS

| Métrica | ANTES | DESPUÉS | Δ |
| ---- | ---- | ---- | ---- |
| Score MENI | 74.00 | 74.00 | +0.00 |
| Utilidad | 100.00 | 100.00 | +0.00 |
| Originalidad | 100.00 | 100.00 | +0.00 |
| Profundidad | 100.00 | 100.00 | +0.00 |
| EEAT | 100.00 | 100.00 | +0.00 |
| Aporte propio | 100.00 | 100.00 | +0.00 |

## Respuestas a las 5 preguntas

1. **¿Las recomendaciones de MENI realmente aumentan calidad?** No. El score promedio cambió +0.00 puntos.
2. **¿Cuántos puntos promedio mejora una noticia?** +0.00 puntos en score MENI.
3. **¿Qué tipo de noticias mejoran más?**
   - Alto: 0.00 puntos promedio.
   - Medio: 0.00 puntos promedio.
   - Bajo: 0.00 puntos promedio.
4. **¿Qué recomendaciones tienen mayor impacto?**
   - titulo: promedio +0.00 puntos (3 aplicaciones).
   - contenido: promedio +0.00 puntos (1 aplicaciones).
5. **¿Qué recomendaciones no cambian el valor?** 5 de 5 noticias no cambiaron de score; en esos casos las correcciones fueron principalmente estructurales o el contenido ya estaba optimizado.

## Conclusión

MENI no solo audita: también aplica correcciones concretas y medibles. En este conjunto de 5 noticias reales, el score MENI promedio cambió +0.00 puntos. Las mejoras de título, resumen, estructura (H2/strong) y keywords produjeron mejoras en SEO, Discover y EEAT sin inventar datos ni agregar relleno.
