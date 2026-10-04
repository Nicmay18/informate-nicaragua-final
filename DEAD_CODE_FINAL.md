# DEAD CODE FINAL — candidatos y regla de eliminación

## Regla (del dueño)

Antes de borrar cualquier cosa hay que demostrar: quién lo llama, ruta dinámica, Server Action, cron, import indirecto, dependencia externa, producción, tests, función histórica.

**Solo se borra lo probado DEAD. Todo lo demás queda clasificado.**

## Método de inventario usado

1. Todas las rutas `app/api/**/route.ts` (114)
2. Todos los `fetch('/api/...')` en public/panel.html, app/, lib/, scripts/ (38 usados por el panel)
3. Crons de vercel.json
4. Callers internos entre rutas/libs

## CLASIFICACIÓN

### No borrar — caller externo real
- `/api/l/[id]` — shortlinks distribuidos en mensajes ya enviados
- `/api/telegram`, `/api/whatsapp`, `/api/facebook` — webhooks externos
- `/api/onesignal-sw` — service worker de push
- `/api/webhooks/departamento` — webhook interno de departamento-central

### SUPPORT (herramientas de mantenimiento — conservar)
- `/api/admin/kb-backfill`, `repair-fechas`, `redistribuir-autores`, `rescribir-sucesos`, `limpiar-*`, `exportar-sucesos`
- `scripts/` completo
- `articulos-*`, `revisadas/`, `meni-output/`, `reports/` — histórico, no código

### EXPERIMENTAL/MEMORY (pocos o ningún caller — no borrar, no tocar)
- `/api/nios/brief`, `/api/nios/growth`, `/api/nios/journey`, `/api/nios/lifecycle`, `/api/nios/swiss-watch`
- `/api/admin/meni-learning`, `/api/admin/meni/registry*`, `/api/admin/meni/arquitectura`, `/api/admin/ceo-agent/*`
- `/api/admin/auditor-dashboard`, `auditoria-taxonomia`, `nota-trust`, `portada-intel`, `research`, `social-conversion`, `stats`, `story`, `trafico`, `twitter`, `watch`, `linkedin`, `medium`, `push-notificar`, `health`, `departamento/*` admin-side

### VERIFICAR ANTES DE CLASIFICAR (candidatos legacy)
- `/api/transform`, `/api/expandir-7`, `/api/auditor-wordcount`, `/api/check-content`, `/api/count-news`, `/api/list-empty`, `/api/listar-categoria`, `/api/entity`, `/api/panel`, `/api/radio-proxy`, `/api/indexnow`
- `appx/` — ¿duplicado de app/? comparar contenido antes de archivar
- `utils/`, `types/`, `styles/` raíz — ¿duplican lib/?

### DEAD regenerable (seguro limpiar, no son código)
- `test-results/`, `playwright-report/` — artefactos de ejecución

### Docs históricos — separar de operativos (no borrar, mover a docs/archivo)
- ~20 `*AUDIT*.md`, `*REPORT*.md`, `*TRUTH*.md`, `PHASE_*` en raíz

## Resultado honesto

No se eliminó código en esta fase: todos los candidatos requieren una verificación final (logs de producción o confirmación de que el endpoint externo ya no se usa). Borrar una ruta webhook o de shortlink rompe producción silenciosamente.
