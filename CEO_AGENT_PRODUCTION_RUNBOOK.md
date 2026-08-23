# CEO Agent — Production Runbook

## 1. Requisitos de entorno

- Node.js 18+
- Variables de entorno en `.env.local`:
  - `ADMIN_API_KEY` para `/api/admin/ceo-agent/*` y `/api/admin/news`.
  - `FIREBASE_ADMIN_KEY_BASE64` o `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un JSON de Firebase Admin.
  - `NEXT_PUBLIC_SITE_URL` (si se usa en snippets/evidencia).
- Colecciones Firestore requeridas:
  - `noticias`
  - `traffic_log` (raw)
  - `traffic_daily/{date}/articles` (pre-aggregado)
  - `ceo_decisions` (nuevo; creada automáticamente por `runCEODecisionForArticle`)
  - `ceo_briefs` (opcional para cron diario)

## 2. Despliegue

```bash
npm install
npm run type-check
npm run lint
npm run test
npm run build
npm run start
```

Orden obligatorio: `type-check` y `test` deben pasar antes de `build`. Si `lib/ceo-agent.test.ts` falla, no desplegar.

## 3. Activación del CEO Agent

### Automática
Cada `POST /api/admin/news` ejecuta `runCEODecisionForArticle(slug)` no bloqueante. La decisión se almacena en `ceo_decisions/{slug}`.

### Manual
Panel administrativo: `/admin/ceo-agent`.
- Analizar por slug: `POST /api/admin/ceo-agent/analyze`.
- Brief diario: `GET /api/admin/ceo-agent/daily`.

### Diaria
Aún no hay cron; se recomienda exponer `/api/admin/ceo-agent/daily` como cron o invocarlo una vez al día desde el panel.

## 4. Decisiones posibles

| Acción | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| `PUBLISH` | Publicar | MENI aprobado, interés real o ausencia de riesgo. |
| `DO_NOT_PUBLISH` | No publicar | MENI rechazado, score bajo, contenido duplicado. |
| `UPDATE_EXISTING` | Actualizar existente | Artículo duplicado o contenido antiguo con tráfico cayendo. |
| `IMPROVE_HEADLINE` | Mejorar titular | Titular > 60 caracteres o GSC bajo CTR. |
| `IMPROVE_SNIPPET` | Mejorar snippet | GSC evidencia snippet poco claro. |
| `ADD_CONTEXT` | Agregar contexto | Nota < 250 palabras o MENI aprobado pero sin suficiente contenido. |
| `WRITE_FOLLOWUP` | Escribir seguimiento | Interés alto sin ser servicio/suceso. |
| `NO_ACTION` | No hacer nada | Sin evidencia suficiente (datos NO_DATA). |

## 5. Monitoreo

- **Logs:** buscar `CEO decision not stored` o `CEO analysis error` en `/api/admin/news`.
- **Firestore:** revisar `ceo_decisions/{slug}` para ver la decisión, urgencia, evidencia y `status: 'pending_review'`.
- **Dashboard:** `/admin/ceo-agent` muestra alertas y recomendaciones.
- **Observabilidad:** `logger.info` en `traffic-reader.ts` para trazas normales; `logger.warn` para fallos tolerados.

## 6. Troubleshooting

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| `traffic.status === 'NO_DATA'` para todos | Falta `traffic_daily` y `traffic_log` vacío | Verificar tracking y populate de `traffic_log`. |
| `meni.status === 'NO_DATA'` | `scoreMeni` no escrito | Revisar `guardarConMeni` para incluir `scoreMeni`. |
| `CEO decision not stored` | `getNewsBySlug` null (borrador) | Esperado para `publicado: false`; no es error. |
| `type-check` falla | `vistas` ahora `number \| undefined` en `GrowthMetrics` | Actualizar consumidores respetando `undefined`. |

## 7. Seguridad

- Todos los endpoints administrativos requieren header `x-admin-token` con `ADMIN_API_KEY`.
- No exponer `ADMIN_API_KEY` en el cliente.
- `ceo_decisions` no contiene PII sensible, pero usa reglas Firestore adecuadas.

## 8. Límites operativos

- `aggregateTrafficFromLog` lee hasta 5,000 eventos de `traffic_log` en fallback.
- `getNews(50)` es el pool del CEO para duplicados/relacionados.
- `analyzeForPublication` es síncrono y no llama a servicios externos (salvo `context` ya resuelto).
