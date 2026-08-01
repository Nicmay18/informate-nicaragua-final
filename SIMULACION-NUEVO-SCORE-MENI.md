# Simulación de nuevo score MENI

Fuente: `DIAGNOSTICO-RANKING-227.json`.

## Fórmula alternativa

| Criterio | Peso |
| --- | --- |
| Valor para el lector (Utilidad) | 30% |
| Profundidad | 20% |
| Originalidad | 15% |
| EEAT | 15% |
| Aporte Nicaragua Informate | 10% |
| Penalizaciones técnicas (puntuación técnica) | 10% |

## Conversión de etiquetas a números

| Concepto | Etiquetas → Valor |
| --- | --- |
| Utilidad | `A) Alto valor` = 100, `B) Medio valor` = 60, `C) Bajo valor` = 30, `D) Sin valor` = 0 |
| Profundidad, Originalidad, EEAT | `Alta/Alto` = 95, `Media/Medio` = 60, `Baja/Bajo` = 30, `Muy baja` = 10 |
| Técnica | `puntuacionTecnica` directa (0-100) |
| Aporte Nicaragua Informate | Sin campo directo: se aproxima con Originalidad |

## Estadísticas generales

- Total noticias: 227
- Promedio score actual: 92.35
- Promedio score nuevo: 82.86
- Suben: 14
- Bajan: 213
- Iguales: 0
- Mayor mejora: España gana Mundial 2026 y es recibida con honores en Madrid (1 pts)
- Mayor caída: Chinandega estrena 75 viviendas con servicios completos (-34 pts)

## Distribución por categorías

| Categoría | N | Score actual | Score nuevo | Δ promedio |
| --- | --- | --- | --- | --- |
| Espectáculos | 8 | 98.25 | 88.63 | -9.63 |
| Tecnología | 11 | 94.00 | 87.82 | -6.18 |
| Nacionales | 65 | 92.89 | 85.17 | -7.72 |
| Deportes | 37 | 92.92 | 85.05 | -7.86 |
| Sucesos | 70 | 91.60 | 81.13 | -10.47 |
| Internacionales | 36 | 90.44 | 77.03 | -13.42 |

## Análisis

1. **Noticias medias que pasarían a excelentes (≥95):** 0
2. **Noticias excelentes actuales que bajarían (<95):** 18
3. **Categoría que más mejora:** Tecnología (Δ promedio -6.18)
4. **Criterio con mayor contribución ponderada promedio:** utilidad
5. **¿Representa mejor el valor editorial?** El nuevo score separa noticias con MENI alto pero Originalidad baja o Utilidad media: 18 casos con originalidad baja y 0 con utilidad no-alta bajan de rango.

## Casos de validación (MENI alto, editorial débil)

| # | Slug | Título | Actual | Nuevo | Δ |
| --- | --- | --- | --- | --- | --- |
| 1 | nicaragua-en-santo-domingo-2026-medallas-beisbol-y-retos | Nicaragua en Santo Domingo 2026: medallas, béisbol y retos. | 100 | 88 | -12 |
| 2 | investigan-ataque-en-el-riguero-que-hirio-a-nino-de-10-ano | Investigan ataque en El Riguero que hirió a niño de 10 año. | 100 | 88 | -12 |
| 3 | agenda-cultural-eventos-en-managua-del-20-al-30-de-junio | Agenda cultural: Eventos en Managua del 20 al 30 de junio | 100 | 88 | -12 |
| 4 | dos-hermanos-fallecen-por-sumersion-en-rio-de-acoyapa-chontales | Dos hermanos fallecen por sumersión en río de Acoyapa, Chont | 100 | 88 | -12 |
| 5 | metal-sonic-se-integra-oficialmente-a-la-pelicula-sonic-4 | Metal Sonic se integra oficialmente a la película Sonic 4 | 100 | 88 | -12 |
| 6 | amanda-miguel-ofrece-concierto-internacional-en-managua | Amanda Miguel ofrece concierto internacional en Managua | 100 | 88 | -12 |
| 7 | pokemon-dona-100-millones-de-yenes-tras-terremoto-en-japon | Pokémon dona 100 millones de yenes tras terremoto en Japón . | 98 | 88 | -10 |
| 8 | nicaragua-abre-ante-colombia-en-santo-domingo-2026 | Nicaragua abre ante Colombia en Santo Domingo 2026. | 98 | 83 | -15 |
| 9 | oleaje-dana-embarcaciones-y-afecta-turismo-en-rivas | Oleaje daña embarcaciones y afecta turismo en Rivas | 98 | 88 | -10 |
| 10 | hallan-sin-vida-a-profesor-desaparecido-en-cementerio-de-boaco | Hallan sin vida a profesor desaparecido en cementerio de Boa | 98 | 82 | -16 |
| 11 | panama-deporta-a-20-nicaraguenses-por-infracciones | Panamá deporta a 20 nicaragüenses por infracciones migratori | 96 | 88 | -8 |
| 12 | rayo-mcqueen-y-19-personajes-llegan-con-exhibicion-a-managua | Rayo McQueen y 19 personajes llegan con exhibición a Managua | 96 | 88 | -8 |
| 13 | tatiana-guzman-hace-historia-en-mundial-fifa-2026-con-var | Tatiana Guzmán hace historia en Mundial FIFA 2026 con VAR | 96 | 88 | -8 |
| 14 | cafe-nicaraguense-alcanza-record-mundial-y-abre-nuevos-retos | Café nicaragüense alcanza récord mundial y abre nuevos retos | 96 | 88 | -8 |
| 15 | capturan-a-autores-de-doble-crimen-en-san-ramon-matagalpa | Capturan a autores de doble crimen en San Ramón, Matagalpa | 96 | 88 | -8 |

Resultado JSON guardado en `E:\PROYECTO\informate-nicaragua-final\SIMULACION-NUEVO-SCORE-MENI.json`.