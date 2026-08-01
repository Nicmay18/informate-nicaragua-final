# VALIDACIÓN CIENTÍFICA: MENI vs NUEVO AUDITOR

## METODOLOGÍA

- Se analizaron 228 noticias reales de Firestore.
- MENI: puntuación final de runMeniAsync (skipEditorBrain: true).
- Auditor: resultado del script scripts/auditar-firestore-228.ts.
- El auditor es binario (aprobada/reprobada). El proxy de severidad es la cantidad de puntos a corregir.

## 1. CORRELACIÓN MENI vs AUDITOR

No es posible calcular una correlación lineal con el veredicto binario del auditor porque rechazó el 100% de las noticias (varianza cero).

Como proxy se usó la cantidad de puntos a corregir:

- Correlación Pearson entre score MENI y puntos a corregir: -0.1325
- Un valor negativo indica que a menor score MENI le corresponden más fallos del auditor.
- Un valor cercano a cero indica que ambos sistemas no están midiendo lo mismo de forma lineal.

## 2. DISTRIBUCIÓN DE SCORES MENI

| Rango | Cantidad | % |
| ---- | ---- | ---- |
| 70-79 | 4 | 1.8% |
| 80-89 | 32 | 14.1% |
| 90-99 | 180 | 79.3% |
| 100-109 | 11 | 4.8% |

## 3. ESTADÍSTICAS DESCRIPTIVAS

| Métrica | MENI | Auditor |
| ---- | ---- | ---- |
| N analizadas | 227 | 227 |
| Promedio score | 92.35 | 2.67 puntos a corregir |
| Mediana | 92.00 | 3 puntos a corregir |
| Desviación estándar | 4.37 | 0.83 |
| Mínimo | 74 | 1 |
| Máximo | 100 | 5 |
| Aprobadas (score >= 90) | 191 (84.1%) | 0 (0%) |
| Reprobadas | 36 | 227 (100%) |

## 4. TOP 20 NOTICIAS DONDE COINCIDEN AMBOS SISTEMAS (ambos reprobadas)

El auditor no aprobó ninguna noticia. Las coincidencias en reprobación son las 20 noticias con score MENI < 90 que ambos sistemas reprueban.

| # | slug | Título | MENI | Puntos auditor |
| ---- | ---- | ---- | ---- | ---- |
| 1 | polemica-en-el-mundial-no-frena-reconocimiento-a-tatiana | Polémica en el Mundial no frena reconocimiento a Tatiana Guz | 74 | 3 |
| 2 | beisbol-infantil-nicaragua-viaja-a-puerto-rico-y | Beisbol infantil: Nicaragua viaja a Puerto Rico y Ecuador | 74 | 2 |
| 3 | campeonato-de-1-4-de-milla-adrenalina-y-tecnica-en-managua | Campeonato de 1/4 de Milla: Adrenalina y técnica en Managua | 74 | 4 |
| 4 | espana-francia-y-argentina-llegan-como-favoritas-al-mundial-2026 | España, Francia y Argentina son favoritas al Mundial 2026 | 74 | 2 |
| 5 | victima-de-golpiza-en-chichigalpa-enfrenta-otro-proceso-judicial | Víctima de golpiza en Chichigalpa enfrenta otro proceso judi | 82 | 4 |
| 6 | colapsa-vivienda-ancestral-en-monimbo-masaya-familia-de-7-ilesa | Colapsa vivienda ancestral en Monimbó, Masaya: familia de 7  | 82 | 2 |
| 7 | 8-motociclistas-fallecen-en-accidentes-este-fin-de-semana | 8 motociclistas fallecen en accidentes este fin de semana | 84 | 2 |
| 8 | incendio-destruye-vivienda-en-monsenor-lezcano-y-deja-un-herido | Incendio destruye vivienda en Monseñor Lezcano y deja un her | 84 | 2 |
| 9 | soldador-de-casa-blanca-sufrio-descarga-electrica-durante-trabajo | Soldador de Casa Blanca sufrió descarga eléctrica durante tr | 86 | 2 |
| 10 | terremoto-de-7-1-deja-muertos-desaparecidos-y-caos-en-japon | Terremoto de 7.1 deja muertos, desaparecidos y caos en Japón | 86 | 4 |
| 11 | guia-de-senalizacion-vial-en-nicaragua-lineas-y-multas-ley-431 | Guía de señalización vial en Nicaragua: Líneas y multas Ley  | 86 | 3 |
| 12 | fiscalia-acusa-a-madre-y-padrastro-por-muerte-de-nino | Fiscalía acusa a madre y padrastro por muerte de niño | 86 | 5 |
| 13 | dos-perdidas-reabren-llamado-a-cuidar-la-salud-emocional | Dos pérdidas reabren llamado a cuidar la salud emocional | 86 | 3 |
| 14 | dos-sismos-en-39-segundos-sacuden-venezuela-y-caracas | Dos sismos en 39 segundos sacuden Venezuela y Caracas | 86 | 4 |
| 15 | lluvias-vientos-y-rayos-dejan-danos-y-dos-fallecidos | Dos trabajadores fallecen tras descargas eléctricas en Nicar | 86 | 3 |
| 16 | dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua | Cuatro obreros afectados en accidentes laborales en Nicaragu | 86 | 3 |
| 17 | accidente-laboral-deja-un-fallecido-y-un-lesionado-en-managua-y-estel | Un afectado y un personas afectado en accidente laboral en… | 86 | 3 |
| 18 | colapso-en-construccion-cobra-vida-de-nicaraguense-en-ee-uu | Colapso en construcción cobra vida de nicaragüense en EE. UU | 88 | 4 |
| 19 | desaparecen-cuatro-marinos-tras-zarpar-de-corn-island | Desaparecen cuatro marinos tras zarpar de Corn Island | 88 | 2 |
| 20 | fallo-judicial-reabre-debate-sobre-la-defensa-de-una-madre | Fallo judicial reabre debate sobre la defensa de una madre. | 88 | 2 |

## 5. TOP 20 NOTICIAS CON MAYOR DISCREPANCIA (MENI aprueba, auditor reprueba)

| # | slug | Título | MENI | Puntos auditor |
| ---- | ---- | ---- | ---- | ---- |
| 1 | nicaragua-en-santo-domingo-2026-medallas-beisbol-y-retos | Nicaragua en Santo Domingo 2026: medallas, béisbol y retos. | 100 | 3 |
| 2 | investigan-ataque-en-el-riguero-que-hirio-a-nino-de-10-ano | Investigan ataque en El Riguero que hirió a niño de 10 año. | 100 | 3 |
| 3 | dos-hermanos-fallecen-por-sumersion-en-rio-de-acoyapa-chontales | Dos hermanos fallecen por sumersión en río de Acoyapa, Chont | 100 | 2 |
| 4 | cinco-accidentes-de-transito-dejan-tres-fallecido-y-varios-herido | Cinco accidentes de tránsito dejan tres fallecido y varios h | 100 | 2 |
| 5 | noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de | Noruega vuelve a octavos del Mundial tras 28 años de ausenci | 100 | 3 |
| 6 | mundial-2026-sorpresas-favoritos-y-como-se-vive-en-nicaragua | Mundial 2026: sorpresas, favoritos y cómo se vive en Nicarag | 100 | 3 |
| 7 | agenda-cultural-eventos-en-managua-del-20-al-30-de-junio | Agenda cultural: Eventos en Managua del 20 al 30 de junio | 100 | 3 |
| 8 | messi-iguala-record-historico-de-16-goles-en-mundiales | Messi iguala récord histórico de 16 goles en Mundiales | 100 | 2 |
| 9 | amanda-miguel-ofrece-concierto-internacional-en-managua | Amanda Miguel ofrece concierto internacional en Managua | 100 | 3 |
| 10 | yadel-y-camerata-bach-fusionan-regueton-y-cultura-en-managua | Yadel reúne a más de 30 mil personas en Managua | 100 | 2 |
| 11 | metal-sonic-se-integra-oficialmente-a-la-pelicula-sonic-4 | Metal Sonic se integra oficialmente a la película Sonic 4 | 100 | 3 |
| 12 | pokemon-dona-100-millones-de-yenes-tras-terremoto-en-japon | Pokémon dona 100 millones de yenes tras terremoto en Japón . | 98 | 3 |
| 13 | nicaraguense-de-jinotepe-se-corona-campeon-de-espana-en-sanda | Nicaragüense de Jinotepe se corona campeón de España en Sand | 98 | 2 |
| 14 | hallan-sin-vida-a-profesor-desaparecido-en-cementerio-de-boaco | Hallan sin vida a profesor desaparecido en cementerio de Boa | 98 | 5 |
| 15 | joven-de-masaya-fallece-en-la-laguna-de-apoyo-este-20-de-julio | Joven de Masaya fallece en la Laguna de Apoyo este 20 de jul | 98 | 2 |
| 16 | capturan-en-esteli-a-nicaraguense-requerido-por-caso-en-ee-uu | Capturan en Estelí a nicaragüense requerido por caso en EE.  | 98 | 1 |
| 17 | argentina-supera-a-suiza-y-va-contra-inglaterra-en-semis | Argentina supera a Suiza y va contra Inglaterra en semis. | 98 | 3 |
| 18 | nicaragua-abre-ante-colombia-en-santo-domingo-2026 | Nicaragua abre ante Colombia en Santo Domingo 2026. | 98 | 4 |
| 19 | copa-2026-alemania-y-paises-bajos-fuera-brasil-y-canada-avanzan | Copa 2026: Alemania y Países Bajos fuera; Brasil y Canadá av | 98 | 3 |
| 20 | parque-de-la-familia-en-esteli-reabre-tras-millonaria-inversion | Parque de la Familia en Estelí reabre tras millonaria invers | 98 | 3 |

## 6. FRECUENCIA DE REGLAS DEL AUDITOR

| Regla | Noticias afectadas | % |
| ---- | ---- | ---- |
| Título exacto 70 caracteres | 227 | 100.0% |
| Lead: falta qué/dónde/cuándo | 199 | 87.7% |
| Extensión mínima 500 palabras | 78 | 34.4% |
| Relleno emocional | 50 | 22.0% |
| Transiciones IA | 41 | 18.1% |
| Lead: mínimo 20 palabras | 10 | 4.4% |

## 7. REGLAS DEL AUDITOR: ANÁLISIS Y CLASIFICACIÓN

### A) Correctas — deben mantenerse

1. **Relleno emocional / sensacionalismo** (lista: consternación, dolor, tragedia, etc.). Esto respalda Google Search Essentials y las políticas contra contenido sensacionalista. MENI lo detecta en detectSensationalism y quality-gate/validator.ts.
2. **Subtítulos H2** como factor de estructura. MENI lo incluye en discoverListo (lib/meni/quality-gate/quality-gate.ts, líneas 43-47). Debe ser factor, no bloqueo absoluto.

### B) Demasiado estrictas — deben recalibrarse

1. **Título exactamente 70 caracteres**. Ninguna guía pública de Google exige 70 exactos. MENI acepta 40-90 para Discover y 50-68 para SEO (lib/meni/intelligence/google-engine.ts:90). Rechazaría a casi todas. Debe ser rango 40-90 o 50-70 con penalización suave.
2. **Extensión mínima 500 palabras**. MENI usa tiers: 80/200/400/600 (lib/meni/editorial-tiers.ts:29-82). Un medio serio publica noticias sólidas de 200-350 palabras. 500 como mínimo universal es excesivo.
3. **Lead de 20 palabras mínimo**. No hay requisito de longitud de lead en Google. MENI evalúa el lead por valor semántico, no por conteo. Debe recalibrar a 8-25 o eliminar el mínimo absoluto.
4. **Lead con qué/dónde/cuándo por listado cerrado**. Las listas de palabras (días, meses, ayer, hoy, etc.) generan falsos negativos. Google no exige esas palabras exactas. Debe reemplazarse por detección de entidades (NER) o reducir peso.
5. **Transiciones IA** (además, por otro lado, cabe señalar). No son señal confiable de IA. MENI las penaliza levemente como contaminación.ia (lib/meni/intelligence/originality-engine.ts:132). Deben ser observación, no bloqueo.

### C) Incorrectas — deben eliminarse

1. **Título exacto de 70 caracteres como condición necesaria**. No es un requisito editorial ni de Google. Es un criterio inventado.
2. **Mínimo de 500 palabras para todo tipo de nota**. Es arbitrario y contradice la realidad del sitio. MENI aprueba noticias de 250-400 palabras con score 90-100.
3. **Lead con fórmula cerrada de qué/dónde/cuándo**. Demasiado rígida; descalifica leads válidos. Debe eliminarse como bloqueo.

## 8. REGLAS DE MENI QUE PODRÍAN FORTALECERSE

1. **H2 en el editor**: MENI ya lo detecta, pero no pesa fuerte. El auditor encontró pocos casos sin H2, así que no es prioridad.
2. **Conectores tipo IA**: MENI ya penaliza levemente en originality-engine.ts y quality-gate. Apropiado como advertencia.
3. **Rangos de título**: MENI maneja correctamente 40-90 para Discover y 50-68 para SEO. No requiere cambios.
4. **Score ejecutivo transparente**: calcularScoreEjecutivo (lib/meni/editorial-brain/index.ts:524) resta puntos por acciones editoriales (3-25 puntos). Es consistente y auditado.

## 9. PROPUESTA DE MODELO UNIFICADO

1. Mantener a MENI como el motor editorial principal y única fuente de verdad del score.
2. Transformar al auditor en un linter técnico de segundo nivel, no en aprobador binario.
3. Convertir cada regla del auditor en una penalización gradual (0-5 puntos) dentro de MENI o como advertencia:
   - Título fuera de 40-90: -5
   - Extensión bajo el mínimo del tier (80/200/400/600): -3 a -10
   - Lead menor a 10 palabras: -3
   - H2 faltante: -2
   - Relleno emocional: -8 (igual que MENI)
   - Conector IA tipo además: -1 por hallazgo, máximo -3
4. Sincronizar el umbral de aprobación con MENI (score >= 90), no con reglas binarias.
5. El auditor no debe invalidar notas con score MENI >= 95; solo debe sugerir mejoras técnicas.

## 10. CONCLUSIÓN

El resultado "0 de 228 noticias aprobadas" no es consistente con la calidad real del sitio ni con los criterios públicos de Google. Es producto de una calibración excesivamente estricta del nuevo auditor, especialmente:

- Título exacto de 70 caracteres (criterio arbitrario).
- Mínimo de 500 palabras (ignora tiers editoriales).
- Lead con fórmula cerrada de qué/dónde/cuándo (falsos negativos).
- Penalización absoluta de conectores comunes como "además".

MENI, en contraste, otorgó score >= 90 (PUBLICABLE) a 191 de 227 noticias (84.1%) con puntuación promedio 92.35 y mediana 92.00. Esto refleja mejor la calidad editorial del corpus, porque evalúa valor diferencial, utilidad para el lector y contexto nicaragüense en lugar de contar caracteres.

Recomendación técnica: el auditor debe transformarse de pasar/falla absoluto a un sistema de penalizaciones graduales integrado a MENI. De lo contrario, seguirá generando falsos negativos masivos y contradirá las aprobaciones históricas del motor editorial.

## REFERENCIAS DE CÓDIGO

- Nuevo auditor: scripts/auditar-firestore-228.ts, líneas 125-145.
- MENI scoring ejecutivo: lib/meni/editorial-brain/index.ts, calcularScoreEjecutivo (líneas 524-565).
- MENI ADN NI: lib/meni/editorial-dna/engine.ts (líneas 165-171).
- MENI thresholds: lib/meni/editorial-tiers.ts (líneas 29-82).
- MENI títulos/Discover: lib/meni/quality-gate/quality-gate.ts (líneas 34-48).
- MENI SEO títulos: lib/meni/intelligence/google-engine.ts (líneas 88-91).
- MENI contaminación IA: lib/meni/intelligence/originality-engine.ts (líneas 132-134).