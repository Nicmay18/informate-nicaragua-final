# PANEL CONSOLIDATION MAP — /panel/ superficie canónica

> Paso 2 de la fase de consolidación. Evidencia: inventario real de `app/admin/**` (23 page.tsx) + `public/panel.html` + `app/panel/**`.

## Matriz /admin/* → /panel/*

| Superficie | Función | Equivalente /panel | Canónica | Acción |
|-----------|---------|-------------------|----------|--------|
| `/admin/nios` | NIOS Intelligence Command Center (NiosExecutiveCenter + DepartamentoCentralSummary) | `/panel/nios` (apila V3+V4+Exec+TeHabla+Plan) | **ESTA es la vista NIOS más nueva** | **MIGRAR contenido → `/panel/nios`**; redirect `/admin/nios` |
| `/admin/nios/weekly` | Reporte semanal NIOS | — | única | MIGRAR → `/panel/nios/weekly` |
| `/admin/nios/recovery` | Recovery Queue | — | única | MIGRAR → `/panel/nios/recovery` |
| `/admin/nios/google-intelligence` | Google Intelligence | — | única | MIGRAR → `/panel/nios/google-intelligence` |
| `/admin/nios/adsense-recovery` | AdSense Recovery | — | única | MIGRAR → `/panel/nios/adsense-recovery` |
| `/admin/nios/adsense-report` | AdSense Report | — | única | MIGRAR → `/panel/nios/adsense-report` |
| `/admin/nios/reparaciones` | Motor de reparación (+ actions.ts) | — | única | MIGRAR → `/panel/nios/reparaciones` |
| `/admin/command-center` | SwissWatchBoard (NIOS command) | `/panel/centro-de-comando` (distinta vista) | única (submódulo NIOS) | MIGRAR → `/panel/nios/command-center` |
| `/admin/knowledge-center` | Knowledge health + business value | `/panel/entities` (grafo) | única | MIGRAR → `/panel/knowledge-center` |
| `/admin/meni` | Criterio Editorial MENI (923ln, usa `/api/admin/meni-rating`) | Evaluador tab (solo eval) | única (rating loop) | MIGRAR → `/panel/meni` |
| `/admin/meni/arquitectura` | MENI Registry v3.0 | — | única/auxiliar | MIGRAR → `/panel/meni/arquitectura` |
| `/admin/meni-dashboard` | Dashboard desempeño MENI | — | única | MIGRAR → `/panel/meni-dashboard` |
| `/admin/portada` | GeneradorPortada | — | única | MIGRAR → `/panel/portada` |
| `/admin/google-news` | Checklist Google News | — | única/informativa | MIGRAR → `/panel/google-news` |
| `/admin/ads` | Inventario de ads | — | única | MIGRAR → `/panel/ads` |
| `/admin/crecimiento` | Prompt Forense de Crecimiento | `/panel/nios/performance` (distinto) | única (herramienta) | MIGRAR → `/panel/crecimiento` |
| `/admin/editor` | Editor completo (guardar-directo) | tab Nueva Noticia | duplicada | REDIRECT → `/panel.html` |
| `/admin/correcciones` | Analizador + auditor + pulir | tabs Auditoría Maestra + Correcciones | duplicada | REDIRECT → `/panel.html` |
| `/admin/ceo-agent` | CEO Agent (daily/analyze) | `/panel/centro-de-comando` | duplicada | REDIRECT → `/panel/centro-de-comando` |
| `/admin/distribute` | Distribución automática | tab Agente IA | duplicada | REDIRECT → `/panel.html` |
| `/admin/trafico` | Analytics real | tab Analytics | duplicada | REDIRECT → `/panel.html` |
| `/admin/growth` | Growth dashboard | `/panel/nios/performance` | duplicada | REDIRECT → `/panel/nios/performance` |
| `/admin/entities` | — | ya redirect → `/panel/entities` | — | MANTENER stub |

## Matriz menú panel.html

| Entrada | Target | Acción |
|---------|--------|--------|
| Dashboard, Nueva Noticia, Noticias, Evaluador, Auditoría Maestra, Correcciones, NIOS, Entidades, Agente IA, Guías, Categorías, Analytics, Configuración | tabs/iframe | **MANTENER** |
| Centro de Comando | `/panel/centro-de-comando` | **MANTENER** (nombre canónico) |
| CEO Agent | `/panel/centro-de-comando` | **ELIMINAR entrada** (alias) |
| Crecimiento | `/panel/nios/performance` | **ELIMINAR entrada** (submódulo NIOS) |
| Editor IA | `/panel/nios/editorial-strategy` | **ELIMINAR entrada** (nombre incorrecto) |
| MENI Diagnóstico | `/panel/nios/editorial-strategy` | **ELIMINAR entrada** (nombre incorrecto) |
| Estrategia Editorial | iframe misma ruta | **ELIMINAR entrada + tab** (submódulo NIOS) |

## Matriz tabs huérfanos

| Tab | Acción |
|-----|--------|
| `centro-comando-tab` (iframe muerto) | ELIMINAR markup |
| `auditoria-tab` (sin acceso) | ELIMINAR markup (contenido reemplazado por Auditoría Maestra) |
| `editorial-strategy-tab` | ELIMINAR al quitar su entrada de menú |
| `redaccion-tab` | MANTENER (acceso vía botón dashboard) |

## Matriz NIOS interno (/panel/nios)

| Componente | Función | Estado | Acción |
|-----------|---------|--------|--------|
| `NiosExecutiveCenter` | Command Center: qué importa, plan del día, reparaciones, atención | flagship (/admin/nios) | **CANÓNICO** → vista principal |
| `DepartamentoCentralSummary` | Resumen departamento central | parte de /admin/nios | MANTENER en `/panel/nios` |
| `NiosExecutiveDashboard` | KPIs ejecutivos | generación previa | REEMPLAZADO por ExecutiveCenter → retirar del render |
| `NiosV3Dashboard` / `NiosV4Dashboard` | vistas de módulos/recomendaciones | generaciones viejas | RETIRAR del render |
| `NiosTeHabla` | saludo narrativo | solapa con headline del ExecCenter | RETIRAR del render |
| `NiosPlanOfToday` | plan del día | solapa con "Qué hacemos hoy" del ExecCenter | RETIRAR del render |
| `/panel/nios/performance` | growth | legítimo | MANTENER como submódulo |
| `/panel/nios/editorial-strategy` | estrategia | legítimo | MANTENER como submódulo |

## Auth post-consolidación
- Páginas movidas conservan `isAuthenticatedAdmin` (cookie `admin_session`) — funciona bajo `/panel/*`.
- Redirects incondicionales → la página destino aplica su propia auth.
- Sin cambios en middleware ni en `/api/*`.
