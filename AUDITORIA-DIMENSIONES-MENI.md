# Auditoría Técnica de Utilidad, Profundidad y EEAT

Muestra: 48 noticias reales de Firestore.
Fecha: 2026-08-01T15:03:07.214Z

## 1. Funciones auditadas

| Variable | Función | Archivo | Rol |
|---|---|---|---|
| utilidad | runNewsValueEngine | lib/meni/editorial-brain/news-value-engine.ts | Calcula utilidad del hecho por palabras clave y categoría |
| profundidad | runExplanationEngine | lib/meni/editorial-brain/explanation-engine.ts | Calcula capacidad explicativa por tipo de hecho y longitud |
| EEAT | analyzeEEAT | lib/meni/eeat.ts | Pasa `result.eeat.score` del motor editorial |
| selloNI.utilidad | computeEditorialDNA | lib/meni/editorial-dna/engine.ts | Multiplica `newsValue.utilidad * 10` y aplica clamp |
| selloNI.explica | computeEditorialDNA | lib/meni/editorial-dna/engine.ts | Copia `decision.explanation.score` |

## 2. Reglas internas detectadas

### Utilidad (runNewsValueEngine → computeEditorialDNA)

- Puntos base: 40.
- Suma 25 si encuentra "cómo", "qué hacer", "paso a paso".
- Suma 20 si encuentra teléfono/contacto/horario.
- Suma 15 si encuentra consejo/recomendación.
- Toma el máximo entre eso y un puntaje por categoría (Economía/Salud 85, Sucesos 55, Deportes 25).
- **Saturation**: `selloNI.utilidad = newsValue.utilidad * 10` luego `clamp(0, 100)`. Si `newsValue.utilidad` ≥ 10, el resultado es 100.

### Profundidad (runExplanationEngine → computeEditorialDNA)

- Puntos base: 70.
- Suma 10 si `porQueOcurrio` tiene > 50 caracteres.
- Suma 10 si `comoAfecta` tiene > 50 caracteres.
- Suma 10 si el texto contiene "nicaragua" o "nicaragüense".
- **Techo bajo**: todas las respuestas son plantillas predefinidas, casi siempre > 50 caracteres, y casi siempre mencionan Nicaragua.
- **Resultado**: score suele ser 100 o 90.

### EEAT (analyzeEEAT)

- No computa; lee `result.eeat.score` del pipeline editorial.
- El score editorial parece binario: noticias válidas reciben 100, las que no cumplen una condición reciben 0.
- Eso produce desviación estándar 0 cuando todas las noticias de la muestra pasan el umbral.

## 3. Distribución estadística

| Variable | n | min | max | media | mediana | std | p5 | p95 | moda |
|---|---|---|---|---|---|---|---|---|---|
| newsValueUtilidadRaw | 48 | 40 | 100 | 58.65 | 60 | 13.68 | 40 | 83.25 | 40 |
| explanationScoreRaw | 48 | 100 | 100 | 100 | 100 | 0 | 100 | 100 | 100 |
| eeatScore | 48 | 100 | 100 | 100 | 100 | 0 | 100 | 100 | 100 |
| utilidadSello | 48 | 100 | 100 | 100 | 100 | 0 | 100 | 100 | 100 |
| profundidadSello | 48 | 100 | 100 | 100 | 100 | 0 | 100 | 100 | 100 |

## 4. Saturación

- **newsValueUtilidadRaw**: 12 noticias recibieron 60. Ejemplo: carreteras-del-pais-dejan-un-fin-de-semana-con-varios-accidentes
- **explanationScoreRaw**: 48 noticias recibieron 100. Ejemplo: lucho-diez-dias-por-su-vida-y-fallecio-tras-ataque-de-expareja
- **eeatScore**: 48 noticias recibieron 100. Ejemplo: lucho-diez-dias-por-su-vida-y-fallecio-tras-ataque-de-expareja

## 5. Noticias con el mismo valor (muestra)

- newsValueUtilidadRaw=60: carreteras-del-pais-dejan-un-fin-de-semana-con-varios-accidentes
- newsValueUtilidadRaw=60: managua-inicia-sus-fiestas-2026-con-programa-y-asuetos
- newsValueUtilidadRaw=60: primeros-bebes-del-dia-de-las-madres-nacen-en-managua-y-rivas
- explanationScoreRaw=100: lucho-diez-dias-por-su-vida-y-fallecio-tras-ataque-de-expareja
- explanationScoreRaw=100: carreteras-del-pais-dejan-un-fin-de-semana-con-varios-accidentes
- explanationScoreRaw=100: accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte
- eeatScore=100: lucho-diez-dias-por-su-vida-y-fallecio-tras-ataque-de-expareja
- eeatScore=100: carreteras-del-pais-dejan-un-fin-de-semana-con-varios-accidentes
- eeatScore=100: accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte

## 6. Dataset de calidad (30 noticias)

| Nivel | Slug | V1 | U | P | E | O | ADN |
|---|---|---|---|---|---|---|---|
| alta | samsung-revela-que-galaxy-recibiran-android-17 | 98 | 100 | 100 | 100 | 100 | 89 |
| alta | taskslinger-la-alternativa-rapida-al-administrador-de-tareas | 98 | 100 | 100 | 100 | 100 | 89 |
| alta | managua-inicia-sus-fiestas-2026-con-programa-y-asuetos | 94 | 100 | 100 | 100 | 100 | 88 |
| alta | nicaraguense-muere-en-costa-rica-tras-choque-y-fuga-vial | 92 | 100 | 100 | 100 | 100 | 88 |
| alta | cinco-equipos-dominan-la-lucha-por-el-liderato-del-pomares | 90 | 100 | 100 | 100 | 100 | 86 |
| alta | nicaragua-en-santo-domingo-2026-medallas-beisbol-y-retos | 95 | 100 | 100 | 100 | 97 | 85 |
| alta | agenda-cultural-eventos-en-managua-del-20-al-30-de-junio | 95 | 100 | 100 | 100 | 100 | 85 |
| alta | pronostico-semanal-temperaturas-y-lluvias-en-nicaragua | 94 | 100 | 100 | 100 | 100 | 85 |
| alta | cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una | 94 | 100 | 100 | 100 | 100 | 84 |
| alta | nicaraguense-fallece-en-accidente-laboral-en-wisconsin | 96 | 100 | 100 | 100 | 100 | 84 |
| media | nicaragua-impulsa-talento-digital-ia-y-expansion-del-5g | 92 | 100 | 100 | 100 | 100 | 91 |
| media | baile-de-los-chinegros-mantiene-vivo-un-ritual-de-400-anos | 92 | 100 | 100 | 100 | 100 | 90 |
| media | prueba-de-ia-obliga-a-openai-a-reforzar-su-seguridad-digital | 90 | 100 | 100 | 100 | 100 | 89 |
| media | pokemon-dona-100-millones-de-yenes-tras-terremoto-en-japon | 98 | 100 | 100 | 100 | 100 | 89 |
| media | dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami | 92 | 100 | 100 | 100 | 100 | 88 |
| media | ia-medica-en-2026-diagnosticos-mas-certeros-que-medicos | 94 | 100 | 100 | 100 | 100 | 88 |
| media | toy-story-5-llegara-a-nicaragua-con-woody-y-buzz-en-la-era-digital | 98 | 100 | 100 | 100 | 100 | 87 |
| media | tecnologia-global-ia-agentica-lidera-cambios-en-2026 | 98 | 100 | 100 | 100 | 100 | 87 |
| media | nasa-cuestiona-limite-de-tormentas-solares-con-estudio-en | 92 | 100 | 100 | 100 | 100 | 87 |
| media | santo-domingo-de-guzman-inicia-sus-fiestas-con-tradicion-y-fe | 92 | 100 | 100 | 100 | 100 | 86 |

## 7. Diagnóstico

Utilidad y profundidad están saturadas por diseño. Utilidad: `newsValue.utilidad * 10` + clamp fuerza 100 para cualquier valor ≥10. Profundidad: puntuación aditiva con base 70, bonificaciones fáciles y sin penalización por ausencia de contexto. EEAT: `analyzeEEAT` actúa como paso a través de `result.eeat.score`, que en la muestra es constante 100.
