# Simulación MENI V3.1

Muestra: 99 noticias reales de `validacion-meni-v3.json`.
No se modifica código; los tres modelos se calculan sobre los datos existentes.

## Modelos simulados

### V3 actual
```
valorEditorial = Σ(dimensión * peso)
scoreFinal = round(base * 0.5 + valorEditorial * 0.5)
```

### V3.1 — Factor de piso
```
minDim = min(utilidad, profundidad, eeat)
valorEditorial = valorEditorial * (minDim / 100)
scoreFinal = round(base * 0.5 + valorEditorial * 0.5)
```

### V3.2 — Penalización por dimensión crítica baja
```
minDim = min(utilidad, profundidad, eeat)
factor = minDim >= 60 ? 1 : minDim / 60
valorEditorial = valorEditorial * factor
scoreFinal = round(base * 0.5 + valorEditorial * 0.5)
```

## Estadísticas comparativas

| Modelo | Media | Mediana | Std | Min | Max |
|---|---|---|---|---|---|
| V3 actual | 89.08 | 90 | 5.45 | 72 | 97 |
| V3.1 piso | 78.30 | 80 | 11.15 | 50 | 96 |
| V3.2 crítica | 86.80 | 90 | 9.41 | 53 | 97 |

## Ranking top 10

| Pos | V3 | V3.1 | V3.2 |
|---|---|---|---|
| 1 | agenda-cultural-eventos-en-managua-del-20-al-30-de-junio (97) | como-anular-el-record-policial-en-nicaragua-en-2026 (96) | agenda-cultural-eventos-en-managua-del-20-al-30-de-junio (97) |
| 2 | cinco-accidentes-de-transito-dejan-tres-fallecido-y-varios-herido (97) | familia-lesionada-tras-volcamiento-de-camion-en-matagalpa (96) | cinco-accidentes-de-transito-dejan-tres-fallecido-y-varios-herido (97) |
| 3 | capturan-en-esteli-a-nicaraguense-requerido-por-caso-en-ee-uu (96) | masaya-analisis-del-fatal-accidente-vial-en-villa-bosco (95) | capturan-en-esteli-a-nicaraguense-requerido-por-caso-en-ee-uu (96) |
| 4 | como-anular-el-record-policial-en-nicaragua-en-2026 (96) | capturan-acusado-de-quemar-a-un-hombre-en-rivas-nicaragua (95) | como-anular-el-record-policial-en-nicaragua-en-2026 (96) |
| 5 | yadel-y-camerata-bach-fusionan-regueton-y-cultura-en-managua (96) | comerciante-fallece-tras-altercado-en-terminal-de-rosita (95) | yadel-y-camerata-bach-fusionan-regueton-y-cultura-en-managua (96) |
| 6 | familia-lesionada-tras-volcamiento-de-camion-en-matagalpa (96) | investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields (94) | familia-lesionada-tras-volcamiento-de-camion-en-matagalpa (96) |
| 7 | lucho-diez-dias-por-su-vida-y-fallecio-tras-ataque-de-expareja (95) | lucho-diez-dias-por-su-vida-y-fallecio-tras-ataque-de-expareja (93) | lucho-diez-dias-por-su-vida-y-fallecio-tras-ataque-de-expareja (95) |
| 8 | managua-inicia-sus-fiestas-2026-con-programa-y-asuetos (95) | managua-inicia-sus-fiestas-2026-con-programa-y-asuetos (93) | managua-inicia-sus-fiestas-2026-con-programa-y-asuetos (95) |
| 9 | amanda-miguel-ofrece-concierto-internacional-en-managua (95) | escolta-de-ultraval-enfrenta-juicio-por-robo-en (93) | amanda-miguel-ofrece-concierto-internacional-en-managua (95) |
| 10 | masaya-analisis-del-fatal-accidente-vial-en-villa-bosco (95) | cuatro-victimas-deja-accidentalidad-vial-entre-sabado-y-domingo (92) | masaya-analisis-del-fatal-accidente-vial-en-villa-bosco (95) |

## Ranking bottom 10

| Pos | V3 | V3.1 | V3.2 |
|---|---|---|---|
| 1 | polemica-en-el-mundial-no-frena-reconocimiento-a-tatiana (72) | prueba-de-ia-obliga-a-openai-a-reforzar-su-seguridad-digital (50) | prueba-de-ia-obliga-a-openai-a-reforzar-su-seguridad-digital (53) |
| 2 | campeonato-de-1-4-de-milla-adrenalina-y-tecnica-en-managua (72) | baile-de-los-chinegros-mantiene-vivo-un-ritual-de-400-anos (52) | baile-de-los-chinegros-mantiene-vivo-un-ritual-de-400-anos (56) |
| 3 | prueba-de-ia-obliga-a-openai-a-reforzar-su-seguridad-digital (75) | nasa-cuestiona-limite-de-tormentas-solares-con-estudio-en (55) | nasa-cuestiona-limite-de-tormentas-solares-con-estudio-en (61) |
| 4 | baile-de-los-chinegros-mantiene-vivo-un-ritual-de-400-anos (76) | dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami (57) | dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami (65) |
| 5 | nasa-cuestiona-limite-de-tormentas-solares-con-estudio-en (76) | medio-millon-participa-en-vigilia-del-papa-en-madrid (57) | medio-millon-participa-en-vigilia-del-papa-en-madrid (65) |
| 6 | kimi-ai-acelera-la-carrera-mundial-por-la-inteligencia-artificial (79) | kimi-ai-acelera-la-carrera-mundial-por-la-inteligencia-artificial (60) | kimi-ai-acelera-la-carrera-mundial-por-la-inteligencia-artificial (68) |
| 7 | medio-millon-participa-en-vigilia-del-papa-en-madrid (80) | muere-trabajador-tras-ataque-de-un-perro-en-managua (60) | muere-trabajador-tras-ataque-de-un-perro-en-managua (68) |
| 8 | noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de (80) | panama-deporta-a-20-nicaraguenses-por (61) | panama-deporta-a-20-nicaraguenses-por (69) |
| 9 | sandboarding-en-cerro-negro-conquista-redes-y-atrae-turistas-a-leon (81) | sandboarding-en-cerro-negro-conquista-redes-y-atrae-turistas-a-leon (63) | noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de (72) |
| 10 | fallece-la-actriz-venezolana-gabriela-fleritt-tras-sismo (81) | nasa-registra-bola-de-fuego-que-cruzo-seis-estados-de-ee-uu (63) | polemica-en-el-mundial-no-frena-reconocimiento-a-tatiana (72) |

## Cambios de posición (V3.1 vs V3)

### Noticias que más suben
| Slug | Categoría | Δ posición | V3 | V3.1 |
|---|---|---|---|---|
| colapsa-vivienda-ancestral-en-monimbo-masaya-familia-de-7-ilesa | Sucesos | -42 | 89 | 89 |
| victima-de-golpiza-en-chichigalpa-enfrenta-otro-proceso-judicial | Sucesos | -36 | 88 | 86 |
| 8-motociclistas-fallecen-en-accidentes-este-fin-de-semana | Sucesos | -21 | 87 | 80 |
| chile-declara-estado-de-catastrofe-en-coquimbo-y-huasco | Internacionales | -20 | 91 | 87 |
| dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua | Sucesos | -20 | 90 | 85 |
| escolta-de-ultraval-enfrenta-juicio-por-robo-en | Sucesos | -20 | 93 | 93 |
| soldador-de-casa-blanca-sufrio-descarga-electrica-durante-trabajo | Sucesos | -19 | 89 | 84 |
| seis-miembros-de-una-familia-mueren-en-incendio-en-honduras | Internacionales | -18 | 88 | 82 |
| mundial-2030-por-que-habra-partidos-en-sudamerica-y-europa | Deportes | -18 | 88 | 82 |
| robo-de-caja-fuerte-con-14-000-en-quilali-termina-con-un-detenido | Sucesos | -18 | 91 | 86 |

### Noticias que más bajan
| Slug | Categoría | Δ posición | V3 | V3.1 |
|---|---|---|---|---|
| investigan-ataque-en-el-riguero-que-hirio-a-nino-de-10-ano | Sucesos | +38 | 94 | 79 |
| yadel-y-camerata-bach-fusionan-regueton-y-cultura-en-managua | Espectáculos | +28 | 96 | 85 |
| pokemon-dona-100-millones-de-yenes-tras-terremoto-en-japon | Espectáculos | +25 | 92 | 77 |
| metal-sonic-se-integra-oficialmente-a-la-pelicula-sonic-4 | Espectáculos | +24 | 93 | 80 |
| samsung-revela-que-galaxy-recibiran-android-17 | Tecnología | +22 | 90 | 71 |
| cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una | Internacionales | +21 | 93 | 82 |
| nicaragua-en-santo-domingo-2026-medallas-beisbol-y-retos | Deportes | +20 | 92 | 79 |
| amanda-miguel-ofrece-concierto-internacional-en-managua | Espectáculos | +19 | 95 | 86 |
| stanling-orozco-conserva-triple-corona-del-pomares-2026 | Deportes | +18 | 91 | 76 |
| joven-de-masaya-fallece-en-la-laguna-de-apoyo-este-20-de-julio | Sucesos | +18 | 90 | 72 |

## Cambios de posición (V3.2 vs V3)

### Noticias que más suben
| Slug | Categoría | Δ posición | V3 | V3.2 |
|---|---|---|---|---|
| puerto-corinto-lidera-llegada-de-11-buques-a-nicaragua | Nacionales | -8 | 82 | 79 |
| polemica-en-el-mundial-no-frena-reconocimiento-a-tatiana | Deportes | -8 | 72 | 72 |
| campeonato-de-1-4-de-milla-adrenalina-y-tecnica-en-managua | Deportes | -8 | 72 | 72 |
| nicaragua-tendra-presencia-en-la-final-del-mundial-gracias-a-fifa | Deportes | -7 | 83 | 83 |
| incendio-destruye-vivienda-en-monsenor-lezcano-y-deja-un-herido | Sucesos | -7 | 86 | 86 |
| sandboarding-en-cerro-negro-conquista-redes-y-atrae-turistas-a-leon | Nacionales | -6 | 81 | 75 |
| fallece-la-actriz-venezolana-gabriela-fleritt-tras-sismo | Espectáculos | -6 | 81 | 75 |
| dueno-de-semovientes-paga-c-769-mil-por-muerte-en-jalapa | Sucesos | -6 | 85 | 85 |
| santo-domingo-de-guzman-inicia-sus-fiestas-con-tradicion-y-fe | Nacionales | -5 | 84 | 84 |
| carreteras-del-pais-dejan-un-fin-de-semana-con-varios-accidentes | Sucesos | -4 | 86 | 86 |

### Noticias que más bajan
| Slug | Categoría | Δ posición | V3 | V3.2 |
|---|---|---|---|---|
| samsung-revela-que-galaxy-recibiran-android-17 | Tecnología | +16 | 90 | 87 |
| joven-de-masaya-fallece-en-la-laguna-de-apoyo-este-20-de-julio | Sucesos | +15 | 90 | 87 |
| accidentes-en-nicaragua-dejan-un-fallecido-y-varios-heridos | Sucesos | +13 | 89 | 85 |
| accidentes-dejan-un-fallecido-y-varios-lesionados-en-nicaragua | Sucesos | +12 | 87 | 77 |
| muere-joven-baleado-en-barrio-mexico-investigan-el-ataque | Sucesos | +12 | 89 | 86 |
| dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami | Internacionales | +10 | 83 | 65 |
| panama-deporta-a-20-nicaraguenses-por | Internacionales | +9 | 84 | 69 |
| tatiana-guzman-hace-historia-en-mundial-fifa-2026-con-var | Deportes | +7 | 87 | 84 |
| muere-trabajador-tras-ataque-de-un-perro-en-managua | Sucesos | +7 | 83 | 68 |
| nasa-registra-bola-de-fuego-que-cruzo-seis-estados-de-ee-uu | Internacionales | +5 | 84 | 74 |

## Reducción de falsos positivos inferidos

Criterio: noticias con `minDim < 60` que todavía obtienen `score >= 85`.

| Modelo | Falsos positivos | Δ vs V3 |
|---|---|---|
| V3 actual | 9 | — |
| V3.1 piso | 0 | -9 |
| V3.2 crítica | 4 | -5 |

## Análisis de estabilidad

- **Rango V3.1:** 50–96 (rango 46)
- **Rango V3.2:** 53–97 (rango 44)
- **Media V3.1:** 78.30 (Δ -10.78)
- **Media V3.2:** 86.80 (Δ -2.28)

## Conclusión

V3.2 reduce drásticamente los falsos positivos y conserva la estabilidad del sistema (cambio de media ≤ 5 puntos).
