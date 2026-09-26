# AUDITORÍA DEL PANEL ADMINISTRATIVO — NAVEGACIÓN, DUPLICADOS Y SUPERFICIES

> Solo descubrimiento. Sin cambios, sin commits, sin deploys.
> Evidencia: código real de `public/panel.html`, `app/panel/**`, `app/admin/**`, `components/**`, `lib/**`. 2026-09-25.

---

## 1. MAPA COMPLETO DEL MENÚ

Panel principal: `public/panel.html` — menú de 19 entradas, secciones "Principal" (16) y "Gestión" (3). Dos mecanismos: tabs inline (`showTab`) y enlaces externos (`href`, algunos `_blank`, otros iframe embebido).

| Menú | URL/Target | Componente | Backend/API | Función | Duplicado? | Alias? | Canónica | Evidencia |
|------|-----------|-----------|-------------|---------|-----------|--------|----------|-----------|
| Dashboard | tab `dashboard-tab` | inline panel.html | `/api/admin/news`, `/api/admin/metricas`, `/api/admin/traffic` | Resumen redacción + audiencia | No | — | Sí | L572 |
| Centro de Comando | `/panel/centro-de-comando` | `app/panel/centro-de-comando/page.tsx` | `/api/admin/centro-de-comando`, `POST /api/admin/nios/loop` | NIOS Executive + ejecutar loop CEO | Sí (vs CEO Agent) | — | Sí | L521 |
| Nueva Noticia | tab `nueva-tab` | inline | `/api/admin/analizar`, `/guardar-directo`, `/enrich-links`, `/enrich-strong`, `/index`, `/distribuir`, `/api/pulir` | Redacción + publicación | No | — | Sí | L522 |
| Noticias | tab `noticias-tab` | inline | `GET/PUT/DELETE /api/admin/news[/{id}]` | Listado + edición + archivo | No | — | Sí | L523 |
| Evaluador | tab `evaluador-tab` | inline | `/api/admin/meni/evaluar`, `/api/admin/analizar` | Evaluar nota con MENI | No | — | Sí | L524 |
| Auditoría Maestra | tab `calidad-tab` | inline | `/api/auditor`, `/api/admin/auditoria-completa`, `/auditor-dashboard`, `/metricas` | Diagnóstico de corpus | Parcial (vs auditoria-tab huérfano) | — | Sí | L525 |
| Correcciones | tab `correcciones-tab` (PELIGRO) | inline | ~12 endpoints `?secret=` legacy: `limpiar-sucesos`, `limpiar-palabras-sensibles`, `exportar-sucesos`, `redistribuir-autores`, `rescribir-sucesos`, `eliminar-viejas`, `limpiar-noindex`, `reindexar-google`, `auto-restore`, `batch-restore`, `clean-seo`, `cache-purge` | Mutaciones masivas del corpus | No | — | Sí (función real, de riesgo) | L526 |
| Crecimiento | `/panel/nios/performance` `_blank` | NIOS performance page | NIOS intel store | Métricas de crecimiento NIOS | Parcial (nombre solapa con Agente IA) | — | Sí | L527 |
| Editor IA | `/panel/nios/editorial-strategy` `_blank` | editorial-strategy page | `getAdminDb` + 4 reportes intel | Estrategia editorial NIOS | **Sí** | — | — | L528 |
| MENI Diagnóstico | `/panel/nios/editorial-strategy` `_blank` | **misma página** | mismas APIs | (mismo destino) | **Sí** | Sí | — | L529 |
| NIOS | tab `nios-tab` → iframe `/panel/nios` | `NiosPanelPageContent` | `lib/nios` directo (server) | Dashboard NIOS agregado (V3+V4+Exec) | Parcial (nombre solapa con Crecimiento) | — | Sí | L530 |
| Estrategia Editorial | tab `editorial-strategy-tab` → iframe `/panel/nios/editorial-strategy` | **misma página** | mismas APIs | (mismo destino) | **Sí** | Sí | — | L531 |
| Entidades | tab `entities-tab` → iframe `/panel/entities` | `EntitiesPageContent` | server + `adminDb` | Knowledge graph de entidades | No | — | Sí | L532 |
| Agente IA | tab `agente-tab` | inline | `/api/admin/metricas`, `/api/admin/distribuir`, `ejecutarAgenteManual` | Distribución multicanal | Parcial (nombre solapa con Crecimiento) | — | Sí | L533 |
| CEO Agent | `/panel/centro-de-comando` `_blank` | **misma página** que Centro de Comando | mismas APIs | (mismo destino) | **Sí** | Sí | — | L534 |
| Guías Editoriales | tab `guias-tab` | inline | — | Documentación editorial en panel | No | — | Sí | L535 |
| Categorías | tab `categorias-tab` | inline | `/api/admin/news` | Gestión de categorías | No | — | Sí | L541 |
| Analytics | tab `analytics-tab` | inline | `/api/admin/traffic`, GA4 | Métricas de tráfico | Parcial (vs Dashboard/agente) | — | Sí | L542 |
| Configuración | tab `config-tab` | inline | `/api/admin/config` (GET/POST), `/api/admin/estado`, `/verificar-telegram`, `/api/revalidate` | Config + tests de conectividad | No | — | Sí | L543 |

---

## 2. MAPA DE RUTAS

### Rutas públicas del panel (alcanzables desde menú o enlace)

| Ruta | Origen de enlace | Notas |
|------|------------------|-------|
| `/panel.html` | entrada principal | shell monolítico, ~19 tabs |
| `/panel/centro-de-comando` | menú ×2 (Centro de Comando, CEO Agent) + iframe `centro-comando-tab` (huérfano) | **tiene autoridad ejecutiva**: POST `/api/admin/nios/loop` |
| `/panel/nios` | menú NIOS → iframe | NiosPanelPageContent — V3+V4+Exec+TeHabla+PlanOfToday |
| `/panel/nios/performance` | menú Crecimiento | growth/performance |
| `/panel/nios/editorial-strategy` | menú ×3 (Editor IA, MENI Diagnóstico, Estrategia Editorial iframe) | estrategia editorial |
| `/panel/entities` | menú Entidades → iframe | knowledge graph |

### Tabs internos sin entrada de menú (ocultos)

| Tab | Acceso | Estado |
|-----|--------|--------|
| `redaccion-tab` | botón "Redactar con IA" en dashboard (L645) | Funcional, acceso secundario |
| `auditoria-tab` | **ninguno** — sin nav-link ni showTab programático | **Huérfano** — "Auditoría Inteligente" existe pero no es alcanzable |
| `centro-comando-tab` | **ninguno** — iframe markup sin showTab | **Markup muerto** |

### Superficie paralela `/admin/*` (23 páginas — App Router)

Páginas: `correcciones`, `editor`, `editor-completo`, `noticias`, `meni`, `meni-dashboard`, `meni/arquitectura`, `nios` + `nios/adsense-recovery` + `nios/adsense-report` + `nios/learning`, `knowledge`, `portada`, `trafico`, `growth`, `crecimiento`, `ads`, `distribute`, `google-news`, `ceo-agent`, `command-center`, `reparaciones`, `analytics`, `search-console`, `editorial`.

- **Auth**: `isAuthenticatedAdmin` → cookie `admin_session` → `verifyAdminToken` (server-side, lib/admin-auth.ts).
- **Enlaces internos entre sí** existen (e.g. `/admin/meni` ↔ `/admin/meni/arquitectura`, `NiosExecutiveCenter` → `/admin/nios`, `/admin/nios/adsense-*`).
- **Ningún enlace desde panel.html ni desde el menú** → superficie paralela accesible solo por URL directa.
- `/admin/correcciones` enlaza a `/admin/index.html` (archivo estático histórico — posible enlace a ruta que ya no existe como página app).

---

## 3. MAPA NIOS — ¿un NIOS o varias generaciones?

**Un solo NIOS lógico, varias superficies y al menos 4 "generaciones" de dashboard visibles:**

| Superficie | Componente | Generación | Estado | Evidencia |
|-----------|-----------|-----------|--------|-----------|
| `/panel/nios` | `NiosPanelPageContent` — apila `NiosTeHabla`, `NiosPlanOfToday`, `NiosExecutiveDashboard`, **`NiosV3Dashboard`**, **`NiosV4Dashboard`** | V3 + V4 + Executive en UNA página | Activa — es el dashboard NIOS canónico del panel | imports en `components/nios/NiosPanelPageContent.tsx` |
| `/panel/nios/performance` | página propia | growth | Activa | menú "Crecimiento" |
| `/panel/nios/editorial-strategy` | `EditorialStrategyClient` + `editor-ceo-report`, `meni-learning`, `google-trust`, `intelligence/store` | estrategia | Activa | menú ×3 |
| `/panel/entities` | `EntitiesPageContent` (título "Entidades \| **NIOS**") | knowledge | Activa | menú Entidades |
| `/admin/nios` | `NiosExecutiveCenter` + `DepartamentoCentralSummary` | Executive Center | Activa (paralela) | `app/admin/nios/page.tsx` |
| `/admin/nios/adsense-recovery`, `/admin/nios/adsense-report`, `/admin/nios/learning` | subsuperficies | históricas/especializadas | Parcialmente activas | enlazadas desde `NiosExecutiveCenter` L461-462 |
| APIs `/api/nios/*` (34 rutas) + `/api/admin/nios/loop` | backend | — | Activas | consumidas por las superficies |

**Conclusión**: no hay "varios NIOS" — hay **un backend NIOS** (`lib/nios`, `lib/departamento-central`) con **múltiples dashboards de distintas generaciones coexistiendo**, algunos apilados literalmente en la misma página (`/panel/nios` muestra V3 + V4 + Executive a la vez), y una superficie paralela `/admin/nios` con el Executive Center.

---

## 4. CENTRO DE COMANDO / CEO AGENT — relación exacta

```text
Menú "Centro de Comando" → href /panel/centro-de-comando  (misma pestaña)
Menú "CEO Agent"         → href /panel/centro-de-comando  (_blank)
Tab centro-comando-tab   → iframe /panel/centro-de-comando (markup sin activador — muerto)
```

- **Exactamente la misma página**, mismos permisos, mismas funciones.
- La página tiene **autoridad ejecutiva**: botón que hace `POST /api/admin/nios/loop` — ejecuta el loop del CEO Agent.
- "CEO Agent" no es una pantalla distinta: es un **segundo nombre para Centro de Comando**. Probable origen: la página muestra el Executive Center del "CEO Agent" de NIOS — el menú refleja dos conceptos (la consola y el agente) sobre un único destino.
- Clasificación: Centro de Comando = **CANÓNICA** (nombre del destino); CEO Agent = **ALIAS** (apunta intencionalmente; distinguible solo por `_blank` y badge).

---

## 5. EDITOR IA / MENI DIAGNÓSTICO / ESTRATEGIA EDITORIAL — relación exacta

```text
Menú "Editor IA"            → href /panel/nios/editorial-strategy (_blank)
Menú "MENI Diagnóstico"     → href /panel/nios/editorial-strategy (_blank)
Menú "Estrategia Editorial" → tab iframe → /panel/nios/editorial-strategy
```

- **Las tres entradas llegan a la MISMA página** (`app/panel/nios/editorial-strategy/page.tsx` → `EditorialStrategyClient`).
- La página real hace: `getLatestSnapshot` + `generateGoogleTrustReport` + `generateEditorCEOReport` + `generateMeniLearningFeedback` — es la superficie de **estrategia editorial/CEO report de NIOS**.
- "Editor IA" y "MENI Diagnóstico" son **nombres aspiracionales** que no corresponden al contenido real de la página (no es un editor y no es un diagnóstico MENI interactivo). "Estrategia Editorial" es el nombre **canónico** (coincide con la ruta y el título de página `Editorial Strategy | NIOS | Panel`).
- Relación exacta: **una sola función con tres nombres**.

---

## 6. SUPERFICIES CANÓNICAS (clasificación por evidencia)

| Superficie | Clasificación | Evidencia |
|-----------|---------------|-----------|
| Dashboard | CANÓNICA | stats reales, entrada principal |
| `/panel/centro-de-comando` | CANÓNICA (nombre "Centro de Comando") | única página; autoridad ejecutiva |
| Nueva Noticia | CANÓNICA | única superficie de publicación inline |
| Noticias | CANÓNICA | único listado inline del corpus |
| Evaluador | CANÓNICA | evaluación MENI interactiva |
| Auditoría Maestra | CANÓNICA | diagnóstico de corpus |
| Correcciones | CANÓNICA (riesgo) | mutaciones masivas legacy `?secret=` |
| `/panel/nios/performance` | CANÓNICA ("Crecimiento" es el menú) | growth real |
| `/panel/nios` | CANÓNICA (dashboard NIOS) | agregador activo |
| `/panel/nios/editorial-strategy` | CANÓNICA (nombre "Estrategia Editorial") | la página es esto, no "Editor IA" |
| `/panel/entities` | CANÓNICA | knowledge graph |
| Agente IA | CANÓNICA | distribución real |
| Guías / Categorías / Analytics / Configuración | CANÓNICA | funcionalidad propia |
| `redaccion-tab` | AUXILIAR | acceso vía botón del dashboard |
| `auditoria-tab` | **HISTÓRICA/HUÉRFANA** | sin acceso desde UI |
| `centro-comando-tab` | **HUÉRFANO (markup muerto)** | iframe nunca activado |
| `/admin/*` (23 páginas) | **PARALELA — DESCONOCIDA** | auth propia, sin enlace desde el menú; puede ser la superficie "nueva generación" o legacy avanzado — requiere decisión editorial antes de clasificar canónico |

---

## 7. DUPLICADOS REALES (con evidencia)

| Par/Terna | Tipo | Evidencia |
|-----------|------|-----------|
| Centro de Comando ↔ CEO Agent | **Alias exacto** | ambos href `/panel/centro-de-comando` — L521, L534 |
| Editor IA ↔ MENI Diagnóstico ↔ Estrategia Editorial | **Tres nombres, una superficie** | los tres → `/panel/nios/editorial-strategy` — L528, L529, L531 |
| Crecimiento ↔ Agente IA | **Solapamiento de función** (no duplicado) | ambos muestran distribución/crecimiento; Crecimiento usa datos NIOS intel, Agente IA usa `/api/admin/metricas` + distribución — **datos diferentes para funciones similares** |
| Dashboard ↔ Agente IA ↔ Analytics | **Solapamiento parcial** | los tres muestran "vistas/distribuciones" desde APIs distintas — mismo KPI, tres cálculos |
| `auditoria-tab` ↔ Auditoría Maestra | **Duplicado funcional huérfano** | dos superficies de "auditoría" — una en menú, otra sin acceso |
| `/admin/*` ↔ tabs del panel | **Duplicación estructural** | `/admin/noticias`, `/admin/men(u)`, `/admin/correcciones`, `/admin/analytics`, `/admin/growth`, `/admin/ceo-agent`, `/admin/command-center`… replican cada capacidad del panel en otra superficie con otro auth |

---

## 8. RIESGOS

1. **Mismo KPI, tres cálculos**: vistas/distribuciones se calculan en Dashboard (admin/news+metricas), Agente IA (admin/metricas+distribuciones) y Analytics (admin/traffic). Dos pantallas "iguales" con números potencialmente distintos.
2. **Dos pantallas de correcciones**: tab Correcciones (panel.html, `?secret=` legacy) vs `/admin/correcciones` — **distinta autoridad y distinto mecanismo de auth** para la misma función destructiva.
3. **Autoridad no evidente en menú**: Centro de Comando ejecuta el loop CEO (`POST /api/admin/nios/loop`) — nada en el nombre/beta "NUEVO" indica que dispara procesos autónomos.
4. **Nomenclatura contradictoria**: "Editor IA" no edita; "MENI Diagnóstico" no diagnostica; "CEO Agent" no es un agente separado — los nombres mienten sobre el contenido.
5. **Enlaces a históricos**: `/admin/correcciones` → `/admin/index.html` (archivo estático que probablemente ya no sirve esa página).
6. **Superficie paralela invisible**: `/admin/*` completa existe con auth por cookie y no aparece en el menú — puede generar confusión de "dos paneles".
7. **Auth divergente entre superficies**: panel.html usa `x-admin-token` header; `/admin/*` usa cookie `admin_session`; correcciones del panel usa `?secret=` query — **tres mecanismos de auth conviviendo** (ya documentado en el incidente de auth).
8. **auditoria-tab huérfana**: código funcional sin acceso — deuda silenciosa.

---

## 9. RECOMENDACIÓN DE LIMPIEZA — SOLO PROPUESTA

| Acción | Superficie | Justificación |
|--------|-----------|---------------|
| **Mantener** | Dashboard, Nueva Noticia, Noticias, Evaluador, Auditoría Maestra, Categorías, Analytics, Configuración, Guías | funcionalidad única |
| **Renombrar menú** | "Editor IA"→Estrategia Editorial; eliminar entrada extra | el nombre real de la página es Estrategia Editorial |
| **Convertir en alias/unificar** | CEO Agent → fusionar con Centro de Comando (1 entrada) | mismo destino |
| **Unificar** | Editor IA + MENI Diagnóstico + Estrategia Editorial → 1 entrada "Estrategia Editorial" | mismo destino |
| **Ocultar/decidir** | `/admin/*` completa | decidir si es la superficie canónica futura (y enlazarla) o legacy (y archivarla) — NO tocar hasta decisión |
| **Decidir** | auditoria-tab | restaurar acceso o eliminar markup |
| **Decidir** | `?secret=` endpoints del tab Correcciones | migrar a auth admin o restringir |
| **NO tocar** | `/api/nios/*`, `lib/nios`, `lib/departamento-central`, middleware, session | backend NIOS único y sano |

---

## 10. IMPACTO DE FUSIÓN/ELIMINACIÓN

- **Eliminar entrada "CEO Agent"**: sin riesgo — misma URL.
- **Eliminar "Editor IA"/"MENI Diagnóstico"**: sin riesgo — misma URL; "Estrategia Editorial" ya la cubre.
- **Eliminar `centro-comando-tab` markup**: sin riesgo — sin activador.
- **Eliminar `auditoria-tab`**: bajo riesgo — sin acceso actual; perdería la función "Auditoría Inteligente" si algún código futuro la referencia.
- **Fusionar Agente IA + Crecimiento**: riesgo medio — datos y funciones distintas (una distribuye, otra informa); unificar solo la nomenclatura.
- **Eliminar `/admin/*`**: riesgo alto — superficie paralela completa; puede contener la única versión de `/admin/nios` executive center, `/admin/meni` dashboard, `/admin/search-console`. Decisión previa obligatoria.

---

## CRITERIOS DE TERMINACIÓN — respuestas con evidencia

1. **Superficies reales**: 19 entradas de menú → ~14 superficies únicas en panel.html + 4 rutas `/panel/*` externas + 23 páginas `/admin/*` paralelas.
2. **Canónicas**: 15 (ver §6).
3. **Duplicadas**: 2 casos comprobados (CEO Agent↔Centro de Comando; Editor IA↔MENI Diagnóstico↔Estrategia Editorial) + 1 paralela estructural (`/admin/*`).
4. **Aliases**: CEO Agent, MENI Diagnóstico, Editor IA (apuntan a destinos canónicos).
5. **Históricas/huérfanas**: `auditoria-tab` (sin acceso), `centro-comando-tab` (markup muerto), posible enlace `/admin/index.html` roto.
6. **Qué es NIOS**: un único backend (`lib/nios` + `lib/departamento-central` + `/api/nios/*`) con múltiples dashboards de 3-4 generaciones coexistiendo — V3, V4 y Executive apilados en `/panel/nios`, más Executive Center separado en `/admin/nios`.
7. **Por qué dos entradas NIOS**: "Crecimiento"→`/panel/nios/performance` (growth) y "NIOS"→`/panel/nios` (dashboard) — superficies distintas bajo el mismo nombre; no son duplicado, son confusión de nomenclatura.
8. **Por qué Centro de Comando = CEO Agent**: la página del command center muestra el loop del CEO Agent; el menú expone concepto y consola como dos entradas sobre un mismo destino.
9. **Por qué Editor IA = MENI Diagnóstico**: ambos apuntan a `/panel/nios/editorial-strategy` — nombres aspiracionales sin relación con el contenido real de la página.
10. **Qué debe permanecer**: todas las CANÓNICAS de §6 + backend NIOS completo.
11. **Qué puede fusionarse**: las 3 entradas → editorial-strategy en 1; Centro de Comando + CEO Agent en 1.
12. **Qué puede eliminarse con seguridad**: markup de `centro-comando-tab`, entradas de menú redundantes (no las rutas).
13. **Qué NO debe tocarse**: `/admin/*` (decisión pendiente), backend NIOS, auth, `?secret=` endpoints (migración de auth separada), `redaccion-tab`, `auditoria-tab` (hasta decidir restaurar vs eliminar).
