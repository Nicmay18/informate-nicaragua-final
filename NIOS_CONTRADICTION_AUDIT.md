# NIOS Contradiction Audit

## 1. Contradicciones identificadas

| Contradicción | NIOS dice | Otra fuente dice | Veredicto |
| --- | --- | --- | --- |
| Thin content | 109 artículos thin | `FORENSIC_281_CERTIFICATION.md`: Thin Content 0 | `DATA_CONFLICT` |
| Health Score | 78/100 | `HOME_HEALTH_SCORE.md`: 29/100 (home) | `DATA_CONFLICT` (son scores distintos) |
| Google Trust | 270 artículos riesgo alto / score 29 | GSC `ACCESS_BLOCKED` | `INVALID` — riesgo no es de Google |
| GSC impresiones | 0 impresiones | GSC `ACCESS_BLOCKED` | `INVALID` — no se consultó GSC |
| GA4 datos | GA4 sin datos | Captura GA4: 6.8k, 4.3k, 678 usuarios activos | `DATA_CONFLICT` / `ACCESS_BLOCKED` collector |
| Artículos analizados | 270 | Varios snapshots: 281, 286, 287, 277 | `DATA_CONFLICT` (universos distintos) |
| MENI ≥90 sin GSC | 270 | GSC bloqueado | `INVALID` — 0 impresiones no comprobable |
| MENI <80 con tráfico real | 0 | `traffic_log` real con 922 eventos 24h | `NEEDS_CONTEXT` — no se cruza por artículo |

## 2. Causas de las contradicciones

### 2.1 Thin content 109 vs 0

- `lib/nios/intelligence/google-trust.ts` define `THIN_WORDS_THRESHOLD = 400`.
- `detectThinContent` marca como thin si el artículo tiene:
  - menos de 400 palabras;
  - menos de 200 palabras;
  - menos de 2 tags;
  - sin enlaces internos;
  - sin autor visible;
  - `palabras >= 200 && gscImpressions === 0 && scoreMeni < 80`.
- La `Auditoría Maestra` (`FORENSIC_281_CERTIFICATION.md`) reportó `Thin Content: 0` con un universo 281, palabra y score MENI distintos.
- **Conclusión:** los umbrales, universo y reglas son distintos. NIOS incluye `gscImpressions === 0` como flag, lo que falsea thin cuando GSC está bloqueado.

### 2.2 Health Score 78/100

- `lib/nios/intelligence/health-score.ts` calcula score sobre el pipeline NIOS (performance, firestore, reliability, scalability).
- No es un score editorial ni de calidad de artículos.
- El nombre `Health Score` sin prefijo `NIOS_Pipeline_` es ambiguo; parece referirse a salud editorial.
- **Conclusión:** el score no responde adecuadamente qué hacer; es un score técnico del pipeline.

### 2.3 Google Trust 29/100 y 270 artículos riesgo alto

- `lib/nios/intelligence/google-trust.ts` pesa `gscClicks`, `gscImpressions`, `gscPosition`, `ga4AvgEngagementTimeSec`.
- Cuando GSC y GA4 están bloqueados, todos los artículos reciben score bajo por `gscImpressions === 0`.
- El score se llama `Google Trust` pero no proviene de Google; es una estimación interna con datos inexistentes.
- **Conclusión:** inválido. Debe llamarse `Internal Risk Estimate` y reportar `NO_DATA`/`ACCESS_BLOCKED`.

### 2.4 GA4 sin datos vs captura con usuarios

- `lib/nios/intelligence/ga4-collector.ts` falla porque `FIREBASE_PRIVATE_KEY` / `GA4_PROPERTY_ID` no están operativos.
- La captura de GA4 UI muestra datos del 22 ago 2026; NIOS puede tener un snapshot del 20 ago 2026.
- **Conclusión:** `STALE_DATA` / `ACCESS_BLOCKED` en NIOS; datos reales existen en GA4 UI.

## 3. Impacto en decisiones

| Consecuencia anterior | Estado | Razón |
| --- | --- | --- |
| "89 artículos pero 0 impresiones en Google" | `INVALID` | GSC no disponible |
| "Limitar nueva producción" | `INVALID` | Sin evidencia orgánica |
| "270 artículos de riesgo alto" | `INVALID` | Basado en `0` de GSC bloqueado |
| "Health Score 78/100" | `NEEDS_AUDIT` | Score del pipeline, no editorial |
| "GA4 sin datos" | `INVALID` | Captura contradice; collector bloqueado |

## 4. Acciones requeridas

1. Renombrar `Google Trust` a `Internal Risk Estimate` o `Editorial Risk Estimate`.
2. En `google-trust.ts` no penalizar por `0` cuando `gscStatus !== 'REAL'`.
3. Documentar qué score es de pipeline, qué de artículo, qué de Google.
4. Sincronizar definición de thin content entre NIOS y Auditoría Maestra.
5. Configurar credenciales GSC/GA4 para resolver conflictos.
