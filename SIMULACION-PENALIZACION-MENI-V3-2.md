# Simulación de calibración MENI V3.2

Muestra: 99 noticias reales.
No se modifica código ni se alteran `MENI_V2_WEIGHTS`, `MENI_V2_BLEND` ni los analizadores V3.
Se aplica una penalización aditiva al `scoreFinal` por dimensiones críticas por debajo de 60.

## Definición de la penalización

```
déficit = Σ(60 - dim) para utilidad, profundidad, eeat cuando dim < 60
penalización = min(déficit, maxPen)
scoreNuevo = max(0, round(scoreOriginal - penalización))
```

## Resumen por escenario

| Escenario | Media | Mediana | Std | Min | Max | FP (minDim<60 y score>=85) |
|---|---|---|---|---|---|---|
| –5 | 87.87 | 90 | 6.95 | 70 | 97 | 2 |
| –10 | 87.01 | 90 | 8.44 | 65 | 97 | 2 |
| –15 | 86.25 | 90 | 9.91 | 60 | 97 | 2 |
| –20 | 85.75 | 90 | 11.04 | 55 | 97 | 2 |

## Detalle escenario –5

**Cambios en top 10:** entran 0 noticias, salen 0.
- El top 10 se mantiene igual.

**Cambios en bottom 10:** entran 0 noticias, salen 0.
- El bottom 10 se mantiene igual.

**Noticias que bajan más de 10 puntos:** 0

## Detalle escenario –10

**Cambios en top 10:** entran 0 noticias, salen 0.
- El top 10 se mantiene igual.

**Cambios en bottom 10:** entran 1 noticias, salen 1.
- Entran: tecnologia-global-ia-agentica-lidera-cambios-en-2026
- Salen: polemica-en-el-mundial-no-frena-reconocimiento-a-tatiana

**Noticias que bajan más de 10 puntos:** 0

## Detalle escenario –15

**Cambios en top 10:** entran 0 noticias, salen 0.
- El top 10 se mantiene igual.

**Cambios en bottom 10:** entran 3 noticias, salen 3.
- Entran: dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami, muere-trabajador-tras-ataque-de-un-perro-en-managua, tecnologia-global-ia-agentica-lidera-cambios-en-2026
- Salen: sandboarding-en-cerro-negro-conquista-redes-y-atrae-turistas-a-leon, polemica-en-el-mundial-no-frena-reconocimiento-a-tatiana, campeonato-de-1-4-de-milla-adrenalina-y-tecnica-en-managua

**Noticias que bajan más de 10 puntos:** 15
| Slug | V3 | Nuevo | Δ |
|---|---|---|---|
| baile-de-los-chinegros-mantiene-vivo-un-ritual-de-400-anos | 76 | 61 | 15 |
| nasa-registra-bola-de-fuego-que-cruzo-seis-estados-de-ee-uu | 84 | 69 | 15 |
| dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami | 83 | 68 | 15 |
| medio-millon-participa-en-vigilia-del-papa-en-madrid | 80 | 65 | 15 |
| panama-deporta-a-20-nicaraguenses-por | 84 | 69 | 15 |
| noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de | 80 | 65 | 15 |
| prueba-de-ia-obliga-a-openai-a-reforzar-su-seguridad-digital | 75 | 60 | 15 |
| taskslinger-la-alternativa-rapida-al-administrador-de-tareas | 86 | 71 | 15 |
| tecnologia-global-ia-agentica-lidera-cambios-en-2026 | 82 | 67 | 15 |
| nasa-cuestiona-limite-de-tormentas-solares-con-estudio-en | 76 | 61 | 15 |
| kimi-ai-acelera-la-carrera-mundial-por-la-inteligencia-artificial | 79 | 64 | 15 |
| fallece-la-actriz-venezolana-gabriela-fleritt-tras-sismo | 81 | 66 | 15 |
| toy-story-5-llegara-a-nicaragua-con-woody-y-buzz-en-la-era-digital | 84 | 69 | 15 |
| accidentes-dejan-un-fallecido-y-varios-lesionados-en-nicaragua | 87 | 72 | 15 |
| muere-trabajador-tras-ataque-de-un-perro-en-managua | 83 | 68 | 15 |

## Detalle escenario –20

**Cambios en top 10:** entran 0 noticias, salen 0.
- El top 10 se mantiene igual.

**Cambios en bottom 10:** entran 4 noticias, salen 4.
- Entran: panama-deporta-a-20-nicaraguenses-por, dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami, muere-trabajador-tras-ataque-de-un-perro-en-managua, tecnologia-global-ia-agentica-lidera-cambios-en-2026
- Salen: sandboarding-en-cerro-negro-conquista-redes-y-atrae-turistas-a-leon, noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de, polemica-en-el-mundial-no-frena-reconocimiento-a-tatiana, campeonato-de-1-4-de-milla-adrenalina-y-tecnica-en-managua

**Noticias que bajan más de 10 puntos:** 15
| Slug | V3 | Nuevo | Δ |
|---|---|---|---|
| baile-de-los-chinegros-mantiene-vivo-un-ritual-de-400-anos | 76 | 56 | 20 |
| dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami | 83 | 63 | 20 |
| medio-millon-participa-en-vigilia-del-papa-en-madrid | 80 | 60 | 20 |
| panama-deporta-a-20-nicaraguenses-por | 84 | 64 | 20 |
| prueba-de-ia-obliga-a-openai-a-reforzar-su-seguridad-digital | 75 | 55 | 20 |
| tecnologia-global-ia-agentica-lidera-cambios-en-2026 | 82 | 62 | 20 |
| nasa-cuestiona-limite-de-tormentas-solares-con-estudio-en | 76 | 56 | 20 |
| kimi-ai-acelera-la-carrera-mundial-por-la-inteligencia-artificial | 79 | 59 | 20 |
| fallece-la-actriz-venezolana-gabriela-fleritt-tras-sismo | 81 | 61 | 20 |
| muere-trabajador-tras-ataque-de-un-perro-en-managua | 83 | 63 | 20 |
| nasa-registra-bola-de-fuego-que-cruzo-seis-estados-de-ee-uu | 84 | 69 | 15 |
| noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de | 80 | 65 | 15 |
| taskslinger-la-alternativa-rapida-al-administrador-de-tareas | 86 | 71 | 15 |
| toy-story-5-llegara-a-nicaragua-con-woody-y-buzz-en-la-era-digital | 84 | 69 | 15 |
| accidentes-dejan-un-fallecido-y-varios-lesionados-en-nicaragua | 87 | 72 | 15 |

## Noticias editorialmente fuertes castigadas injustamente (escenario D)

Criterio: `v3 >= 85`, `adnNI >= 80`, `originalidad >= 80`, al menos 2 de las 3 dimensiones V3 >= 80, pero al menos 1 dimensión V3 < 60. Tras aplicar –20 bajan por debajo de 85.

| Slug | Categoría | V3 | D (-20) | Utilidad | Profundidad | EEAT | Δ |
|---|---|---|---|---|---|---|---|
| bebe-sufre-quemaduras-con-agua-caliente-en-diria | Sucesos | 86 | 76 | 80 | 50 | 100 | 10 |
| tatiana-guzman-hace-historia-en-mundial-fifa-2026-con-var | Deportes | 87 | 82 | 80 | 55 | 95 | 5 |
| accidentes-en-nicaragua-dejan-un-fallecido-y-varios-heridos | Sucesos | 89 | 84 | 90 | 55 | 95 | 5 |

## Recomendación

Se recomienda el **escenario –5** (penalización máxima acumulada de 5 puntos).

Razones:
- Reduce los falsos positivos de 9 a 2.
- La media desciende solo 1.21 puntos (87.87 vs 89.08), lo que conserva la estabilidad general.
- El top 10 cambia en 0 noticias y el bottom 10 en 0, lo cual es aceptable para una corrección de dimensión crítica.
- No se detectan castigos injustos severos bajo este umbral.

No se implementan cambios hasta validación posterior.
