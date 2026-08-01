# Validación Final MENI Score V2

Muestra: 99 noticias reales de Firestore.
Fecha: 2026-08-01T14:49:34.362Z

## 1. Distribución de scores

| Métrica | V1 | V2 |
|---|---|---|
| n | 99 | 99 |
| media | 92.71 | 92.6 |
| mediana | 94 | 93 |
| std | 4.96 | 4.09 |
| p5 | 86 | 88.9 |
| p25 | 90 | 91 |
| p75 | 96 | 95 |
| p95 | 100 | 98 |
| min | 74 | 74 |
| max | 100 | 98 |

## 2. Correlaciones

| Variable | Pearson V1 | Pearson V2 | Spearman V1 | Spearman V2 |
|---|---|---|---|---|
| utilidad | 0 | 0 | 0 | 0 |
| profundidad | 0 | 0 | 0 | 0 |
| originalidad | 0.32 | 0.66 | -0.01 | 0.38 |
| eeat | 0 | 0 | 0 | 0 |
| adnNI | 0.3 | 0.55 | 0.03 | 0.28 |
| aportePropio | 0.14 | 0.45 | 0.12 | 0.56 |

## 3. Matriz de influencia

| Variable | Influencia V1 | Influencia V2 | Desviación | Peso |
|---|---|---|---|---|
| utilidad | 0 | 0 | 0 | 0.1 |
| profundidad | 0 | 0 | 0 | 0.2 |
| originalidad | 0.32 | 0.83 | 8.29 | 0.2 |
| EEAT | 0 | 0 | 0 | 0.2 |
| aporte propio | 0.14 | 1.25 | 50 | 0.05 |
| ADN | 0.3 | 0.63 | 5.07 | 0.25 |
| técnica | 0.04 | 1.89 | 3.78 | 0.5 |

## 4. Casos V1 alto / dimensiones bajas (V2 penaliza)

- **nicaragua-tendra-dos-arbitros-en-el-mundial-2026** (Deportes): V1=94 → V2=88 (Δ-6). orig=77 eeat=100 prof=100 aporte=0
- **portugal-elimina-a-croacia-y-el-mundial-se-despide-de** (Deportes): V1=94 → V2=89 (Δ-5). orig=77 eeat=100 prof=100 aporte=0
- **puerto-corinto-lidera-llegada-de-11-buques-a-nicaragua** (Nacionales): V1=90 → V2=90 (Δ0). orig=96 eeat=100 prof=100 aporte=0
- **medio-millon-participa-en-vigilia-del-papa-en-madrid** (Internacionales): V1=90 → V2=90 (Δ0). orig=100 eeat=100 prof=100 aporte=0
- **terremotos-en-venezuela-cifra-de-fallecidos-sube-a-2-954** (Internacionales): V1=90 → V2=90 (Δ0). orig=100 eeat=100 prof=100 aporte=0

## 5. Casos V1 medio / dimensiones altas (V2 recompensa)

- **victima-de-golpiza-en-chichigalpa-enfrenta-otro-proceso-judicial** (Sucesos): V1=82 → V2=89 (Δ7). orig=100 eeat=100 prof=100 aporte=100

## 6. Casos anómalos

Excelentes que bajan demasiado: 0
Malas que suben demasiado: 0

## 7. Recomendaciones de pesos (FASE 7)

- **utilidad**: reducir — desviación baja (0) y sensibilidad 0 (< 0.5)
- **profundidad**: reducir — desviación baja (0) y sensibilidad 0 (< 0.5)
- **originalidad**: mantener — aporta proporcionalmente (30.55%)
- **EEAT**: reducir — desviación baja (0) y sensibilidad 0 (< 0.5)
- **aporte propio**: reducir — domina el 46.07% del movimiento del score
- **ADN NI**: mantener — aporta proporcionalmente (23.38%)

## 8. Conclusión

V2 mejora la correlación con originalidad (Δ0.34) y EEAT (Δ0). Promedio V1=92.71, V2=92.6. Anomalías: 0 excelentes bajan demasiado, 0 malas suben demasiado.
