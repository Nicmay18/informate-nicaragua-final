# OPERACIÓN FINAL — cómo se opera el sistema día a día

## Publicar una noticia

1. Escribir/pegar en el panel (`public/panel.html`, ruta /panel).
2. **Analizar nota** → diagnóstico MENI:
   - 🟢 PUBLICAR → publicar directo
   - 🟡 PUBLICAR CON CAMBIOS → ver recomendaciones, publicar o ajustar
   - 🟠 REVISAR → ver hallazgos; si está correctamente documentada, «Confirmar como Editor Jefe»
   - 🔴 BLOQUEAR → corregir el defecto real (fuente faltante, atribución, defecto mecánico)
3. Al guardar: Firestore `noticias/{id}` + distribución automática a canales activos + revalidación ISR.

## Verificar que distribuyó

- Panel → estado de la nota → resultados por canal.
- Firestore `distribuciones` (log por slug) y `distribuciones_envios` (claim).
- Telegram: buscar el mensaje en el canal; cada envío es sendPhoto o sendMessage.
- Facebook: revisar la página.

## Crons y sus check

| Cron | Cuándo | Cómo verificar | Fallback manual |
|---|---|---|---|
| resumen-diario | 6am | doc `resumenes_diarios/{YYYY-MM-DD}` existe | `GET /api/cron/resumen-diario?secret=<ADMIN>&force=1` |
| distribuciones-retry | 5:15am | colección distribuciones_envios claims 'sent' | invocar /api/admin/distribuir con slug |
| departamento-* | 00-1am | heartbeat `departamento-central/heartbeat` | invocar ruta con ?secret= |
| nios-collect, nios-ceo-loop | 8am, 2am | heartbeat + colecciones nios_* | invocar con secret |
| supervisor-watch | 4am | heartbeat | — |
| traffic-cleanup | 3am | heartbeat | — |
| meni-learning-cycle | domingo | heartbeat | — |

Todos los crons aceptan `?secret=<ADMIN_API_KEY>` o `Authorization: Bearer <CRON_SECRET>`.

## Observabilidad

- `recordCronHeartbeat` — cada cron reporta ejecución a Firestore.
- `logger` — console logging estructurado (visible en Vercel logs).
- Endpoint de diagnóstico del panel: `diagnosticoAdmin()`.

## Estados de una noticia

- `estado: 'publicado'` o `publicado: true` → en el sitio
- scoreMeni + editorialVerdict → decisión
- Supervisor `INVESTIGAR_MAS`/`APROBAR`/`REVISAR`/`BLOQUEAR` → gate de guardado

## En producción

- Sitio: https://nicaraguainformate.com
- Panel: /panel (public/panel.html) — auth por ADMIN_API_KEY
- Deploys: git push → Vercel build automático → alias de producción
- ISR: `revalidate` tras guardar; el home puede tardar 60-120s en reflejar una nota
