# HOME_HEALTH_SCORE.md

## Fuente de datos
Análisis basado en el backup real de Firestore: `scripts/backup/backup-noticias-2026-06-16.json` (212 noticias publicadas). Se tomaron las 30 noticias más recientes como simulación de la home.

## 1. Distribución por categoría (30 noticias más recientes)

| Categoría | Cantidad | % |
|---|---:|---:|
| Sucesos | 13 | 43.3% |
| Nacionales | 7 | 23.3% |
| Deportes | 4 | 13.3% |
| Internacionales | 4 | 13.3% |
| Espectáculos | 1 | 3.3% |
| Tecnología | 1 | 3.3% |

## 2. Distribución proyectada del top 10 (con tope 30%)

| Categoría | Cantidad | % |
|---|---:|---:|
| Sucesos | 3 | 30.0% |
| Nacionales | 3 | 30.0% |
| Deportes | 2 | 20.0% |
| Espectáculos | 1 | 10.0% |
| Internacionales | 1 | 10.0% |

## 3. Diversidad

* Categorías presentes: **6 de 6** (Sucesos, Nacionales, Deportes, Internacionales, Espectáculos, Tecnología).
* Diversidad aparente: Alta.
* Tope por categoría aplicado: máximo 3 noticias (30%) en el top 10.

## 4. Repetición

* Títulos duplicados: **0** (todos los slugs son únicos).
* Palabras más frecuentes en títulos: Nicaragua, Managua, accidente, fallece, construcción, hospital (común en cobertura nacional).

## 5. Calidad editorial (promedio del top 10)

| Dimensión | Promedio |
|---|---:|
| Valor editorial | 57.8/100 |
| Claridad | 78.0/100 |
| Contexto | 46.4/100 |
| Utilidad | 47.0/100 |
| Confianza | 54.5/100 |

## 6. Alertas de marca (top 10)

* **ADVERTENCIA:** Sucesos representa 50% del Home.

## 7. Home Health Score

| Métrica | Valor | Estado |
|---|---|---|
| Visibilidad de Nacionales | Presente | OK |
| Visibilidad de Deportes | Presente | OK |
| Visibilidad de Internacionales | Presente | OK |
| Visibilidad de Tecnología | Presente | OK |
| Dominancia de Sucesos | 50% | REPARAR |
| Calidad editorial promedio | 58/100 | REPARAR |

**Score global de Home Health: 29/100**

Nota: score combinado penaliza baja calidad editorial y dominancia de Sucesos.
