# NIOS Intelligence Platform — FASE 2: Google Trust & AdSense Recovery

## Objetivo

Construir módulos de análisis basados en datos reales para entender cómo Google percibe el contenido de `nicaraguainformate.com`, detectar señales de "contenido de poco valor" y preparar el camino hacia una re-aprobación de AdSense sin inventar datos ni hacer suposiciones.

**Reglas estrictas de FASE 2:**
- **No** generar más contenido por volumen.
- **No** asumir que Google aprobará AdSense.
- **No** usar IA ni datos inventados.
- **No** implementar módulos de ingresos.
- Todos los insights deben incluir fuente, métrica, rango de fecha, confianza y evidencia.

## Módulos implementados

### FASE 2.1 — Google Trust Audit (`lib/nios/intelligence/google-trust.ts`)

Evalúa:
- **Autoridad editorial (EEAT)**: autor visible, fecha de actualización, fuentes, contexto, enlaces internos.
- **Valor del contenido**: tráfico orgánico, CTR, posición, engagement, profundidad, frescura, categoría fuerte.
- **Thin content**: < 400 palabras, duplicados, falta de contexto o fuentes.
- **Google Trust Score**: 0-100 por artículo y promedio del sitio.
- **Riesgo**: `alto` < 40, `medio` < 70, `bajo` ≥ 70.
- **Salidas**: `GoogleTrustReport`, `ThinContentArticle[]`, `GoogleTrustArticle[]`.

### FASE 2.2 — AdSense Recovery (`lib/nios/intelligence/adsense-recovery.ts` y `/admin/nios/adsense-recovery`)

Proporciona:
- Nivel de riesgo global (`alto`, `medio`, `bajo`).
- Porcentajes: originalidad, autor, contexto, fuentes, utilidad.
- **Top 20 URLs** que probablemente afectan la aprobación de AdSense.
- Thin content detectado.
- Recomendaciones accionables por severidad.

### FASE 2.3 — Google Feedback Loop (`lib/nios/intelligence/google-feedback.ts`)

Compara `scoreMeni` con la percepción real de Google:
- `meni_correct`
- `meni_overestimates`
- `meni_underestimates`
- `insufficient_data`

Persiste patrones en la colección `google_learning_patterns` de Firestore y genera resúmenes.

### FASE 2.4 — NIOS Weekly Intelligence (`lib/nios/intelligence/weekly-report.ts` y `/admin/nios/weekly`)

Reporte semanal para el CEO que responde 6 preguntas:
1. ¿Qué contenido está funcionando en Google?
2. ¿Qué contenido Google ignora?
3. ¿Qué categorías tienen oportunidad?
4. ¿Qué debemos producir la próxima semana?
5. ¿Qué debemos actualizar?
6. ¿Qué está bloqueando AdSense?

**Regla**: primero optimizar lo existente, no publicar más.

## Integración

- `orchestrator.ts`: cada corrida del pipeline genera Trust, AdSense Recovery, Learning Patterns y Weekly, y guarda `trust` y `learningPatterns` en el `DailySnapshot`.
- `store.ts`: el snapshot diario ahora incluye `trust` y `learningPatterns`.
- `index.ts`: todos los módulos FASE 2 exportados en el barrel.
- `app/api/admin/nios-intelligence/route.ts`: nuevas acciones:
  - `?action=trust`
  - `?action=adsense-recovery`
  - `?action=weekly`
  - `?action=learning-patterns`
- Nuevas páginas admin:
  - `/admin/nios/adsense-recovery`
  - `/admin/nios/weekly`

## Umbrales y métricas clave

| Métrica | Umbral |
|---|---|
| Thin content | < 400 palabras |
| Riesgo alto | Trust Score < 40 |
| Riesgo medio | Trust Score < 70 |
| Riesgo bajo | Trust Score ≥ 70 |

Categorías monitoreadas: Nacionales, Sucesos, Internacionales, Deportes, Tecnología, Cultura.

## Testing

- `tests/nios-fase2.test.ts`: 11 pruebas cubriendo Google Trust, thin content, AdSense Recovery, Google Feedback Loop y NIOS Weekly.
- `npx tsc --noEmit`: sin errores.

## Próximos pasos

1. Verificar recolección real de GSC y GA4 en producción.
2. Ejecutar `POST /api/admin/nios-collect` para llenar snapshots.
3. Revisar manualmente el top 20 de URLs de riesgo de AdSense antes de cualquier acción.
4. Monitorizar `google_learning_patterns` para ajustar el modelo MENI.
