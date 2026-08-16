# NICARAGUA INFORMATE — FINAL REENGINEERING PLAN
## From Beta → Sustainable Digital Media Company

> **Author:** Senior Architecture & Product Office (Devin)  
> **Date:** 2026-08-16  
> **Status:** APPROVED BLUEPRINT — READY FOR STAGED EXECUTION  
> **Mandate:** CEO Mandate — "Sistema Operativo Empresarial"

---

## 1. EXECUTIVE DIAGNOSIS (EL ESTADO REAL)

### 1.1 Qué ya funciona (The Solid Core)
1. **Pipeline de Ingesta y Decisión Editorial (MENI + Supervisor Gate):**
   - La cirugía anti-bypass en `lib/supervisor/editorial-supervisor.ts` y `lib/editorial/guardar-con-meni.ts` es sólida.
   - 38/38 tests automáticos garantizan que no se publica contenido sin cumplir los invariantes de calidad (`aprobadoMeni`, `recomendacion === 'publicar'`, `score >= 90`).
   - Categorización canónica en 6 verticales públicas nicaragüenses (`lib/editorial/canonical.ts`).
2. **Conectividad a Fuentes Externas Reales:**
   - **Google Search Console:** Conexión probada con la Service Account (`siteOwner` en `sc-domain:nicaraguainformate.com`).
   - **Google Analytics 4:** Conexión verificada con la Property `525672447` (`runReport` operativo).
   - **Firebase/Firestore:** Lectura/escritura confirmada sobre `noticias`, `traffic_log`, `nios_daily_snapshots`, `config`.
3. **Data Contracts Base:**
   - `lib/contracts/index.ts` y `lib/observability/types.ts` definen las estructuras limpias sin PII y con semántica estricta de nulos.
4. **Calidad de Contenido Base:**
   - Auditoría de 291 artículos en Firestore demostró 0 artículos con <300 palabras y 0 slugs/títulos duplicados.

---

### 1.2 Qué está roto, duplicado o es falso positivo (Technical & Business Debt)

| Síntoma / Módulo | Diagnóstico Técnico | Impacto de Negocio | Decisión |
|---|---|---|---|
| **Semáforos ciegos (RED/YELLOW/GREEN)** | Reglas que marcan un artículo como "RED" simplemente porque no tiene tráfico en 7 días o tiene 350 palabras. | Desmoraliza la redacción, induce a reescrituras innecesarias y gasta tiempo editorial. | **ELIMINAR semáforos.** Reemplazar por `[Observación, Evidencia, Diagnóstico, Acción]`. |
| **Falso "Thin Content" (<400 palabras)** | Regla rígida que confunde brevedad con baja calidad. Muchas noticias de última hora o servicio útil tienen 350 palabras y están editorialmente completas. | Forzar texto de relleno artificial que daña la experiencia del usuario y el E-E-A-T. | **PROHIBIR falso thin.** Clasificar en: `SHORT_USEFUL`, `THIN_CANDIDATE`, `THIN_CONFIRMED`, `EDITORIALLY_COMPLETE`. |
| **Fragmentación de ~90 API Routes en `/api/admin/*`** | 90+ endpoints aislados (`analizar-v4`, `phase15-1`, `phase16`, `quitar-emocional`, `expandir-thin`, etc.), muchos creados como scripts de un solo uso o parches rápidos. | Inmantenible, superficie de ataque amplia, confusión sobre cuál API es la autoridad. | **PURGAR Y CONSOLIDAR** en un conjunto limpio de API controllers empresariales. |
| **Fragmentación de NIOS en 25+ subcarpetas** | `lib/nios/` tiene `business-brain`, `command-center`, `copilot`, `mission-engine`, `learning-system`, etc., muchos solapados y calculando métricas redundantes en memoria. | Caos conceptual, lentitud en crons, divergencia de métricas. | **RECONSTRUIR en 4 capas limpias:** Ingesta → Normalización → Inteligencia de Negocio → Acciones. |
| **Colección `traffic_log` sin TTL automático** | Cada visita escribe un documento individual en Firestore sin política de expiración programada. | Riesgo de explosión de costos de Firestore conforme crezca el tráfico. | **IMPLEMENTAR agregación en memoria/batch** y TTL estricto a 30 días. |
| **Métricas desconectadas del negocio** | Dashboards que muestran scores inventados ("Discover Score 84", "AdSense Score 92") que no representan ingresos ni usuarios recurrentes. | Ceguera empresarial: el medio no sabe qué contenido retiene lectores ni qué canales convierten. | **CONVERTIR A MÉTRICAS DE NEGOCIO:** Usuarios activos, Recirculación, Retención, CTR real, RPM y Conversión. |

---

## 2. ARQUITECTURA FINAL DEL SISTEMA OPERATIVO

El negocio digital de Nicaragua Informate se estructura en **3 Sistemas Autónomos pero Coordinados**:

```
                    ┌─────────────────────────────────────────┐
                    │      NICARAGUA INFORMATE PLATFORM       │
                    └─────────────────────────────────────────┘
                                         │
     ┌───────────────────────────────────┼───────────────────────────────────┐
     ▼                                   ▼                                   ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│       SISTEMA 1       │   │       SISTEMA 2       │   │       SISTEMA 3       │
│         MENI          │   │         SITE          │   │         NIOS          │
│  (Editorial Engine)   │   │  (Reader Experience)  │   │ (Business & Intel OS) │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
  • Redacción & Estilo        • Next.js 15 App Router     • Ingesta GSC / GA4 / Logs
  • Calidad Periodística      • Web Vitals / Performance  • Observación de Sesión
  • Canonicidad & DNA         • SEO On-Page & Schema      • Growth & LifeCycle Engine
  • Supervisor Gate           • Distribución Omnicanal    • Money Engine & AdSense
  • Publicación Invariante    • Experiencia Lectores      • CEO Daily & Weekly Brief
```

### Principio de Aislamiento de Autoridad:
- **MENI** es la autoridad editorial: Dice si un artículo está bien escrito y es ético. **NIOS NO toca MENI ni altera notas.**
- **SITE** es la experiencia de lectura: Rápido, accesible, limpio, diseñado para nicaragüenses.
- **NIOS** es el sistema operativo del negocio: Observa qué pasa con la audiencia, Google, redes sociales e ingresos, y genera **recomendaciones ejecutivas priorizadas**.

---

## 3. MAPA DEFINITIVO DE MÓDULOS: QUÉ SE ELIMINA, QUÉ SE CONSERVA, QUÉ SE RECONSTRUYE

### 3.1 Módulos a CONSERVAR (Core Intacto)
- `lib/editorial/canonical.ts` (Resolución canónica de categorías)
- `lib/supervisor/editorial-supervisor.ts` (Supervisor Gate y decision logic)
- `lib/editorial/guardar-con-meni.ts` (Persistencia canónica de noticias)
- `lib/contracts/index.ts` (Data contracts unificados)
- `lib/observability/types.ts` y `lib/observability/session.ts` (Ingesta de JourneyEvents sin PII)
- `components/OptimizedImage.tsx`, `components/Footer.tsx`, `components/Header.tsx` (UI central)

### 3.2 Módulos a ELIMINAR (Deuda Técnica / Parches obsoletos)
- `app/api/admin/phase*` (Scripts antiguos de fases 15, 16, etc.)
- `app/api/admin/quitar-emocional*`, `limpiar-palabras-sensibles`, `rescribir-sucesos` (Parches ad-hoc de reescritura que violan el principio editorial)
- `lib/nios/copilot/`, `lib/nios/mission-engine/`, `lib/nios/business-brain/` (Estructuras redundantes que calculan scores artificiales)
- `app/api/admin/adsense-repair-*` (Generadores de texto artificial que ponían en riesgo la cuenta)

### 3.3 Módulos a FUSIONAR Y RECONSTRUIR (El Nuevo NIOS v2)
Reorganizar `lib/nios/` en una estructura limpia de **5 dominios empresariales**:

1. **`lib/nios/collectors/`** (Ingesta Robusta):
   - `gsc.ts`: Extrae impresiones, clics, queries y páginas de Search Console con manejo de estados (`CONNECTED_WITH_DATA`, `CONNECTED_NO_DATA`, `STALE_DATA`).
   - `ga4.ts`: Extrae usuarios activos, sesiones, engagement time y fuentes de tráfico.
   - `internal.ts`: Extrae métricas de interacción interna y sesiones desde `traffic_log` / `nios_telemetry`.

2. **`lib/nios/lifecycle/`** (Ciclo de Vida del Contenido):
   - Rastrea cada nota a las 1h, 6h, 24h, 3d, 7d, 14d, 30d.
   - Estados de ciclo: `CREATED → PUBLISHED → OBSERVED → LEARNING → GROWING → STABLE → UPDATE_REQUIRED → DECLINING → ARCHIVE_CANDIDATE`.

3. **`lib/nios/growth/`** (Motor de Oportunidades):
   - Detector de Oportunidades de Alto Impacto (ej. alto volumen de impresiones en GSC + bajo CTR → sugerencia de prueba de título).
   - Detector de Recirculación y Enlazado Interno (artículos con alta retención que necesitan enlaces a notas frescas).

4. **`lib/nios/revenue/`** (Inteligencia de Monetización):
   - Preparación y monitoreo de AdSense / Patrocinios locales.
   - Infraestructura de Apoyo Comunitario ("Apoya el periodismo de Nicaragua Informate").

5. **`lib/nios/executive/`** (Toma de Decisiones CEO):
   - **CEO Morning Brief**: "Buenos Días, Nicaragua Informate" (Máximo 5 puntos críticos diarios).
   - **Weekly Strategic Report**: Qué creció, qué cayó, por qué y qué 3 acciones tomar.

---

## 4. LAS MÉTRICAS EMPRESARIALES QUE REALMENTE IMPORTAN

Dejamos de medir scores artificiales y pasamos a medir la salud del medio:

| Dimensión | Métrica de Vanidad (DESCARTADA) | Métrica Empresarial Real (ADOPTADA) |
|---|---|---|
| **Audiencia** | "Total de visitas acumuladas" | **Usuarios Activos Semanales + Tasa de Recurrencia (Returning Readers)** |
| **Retención** | "Páginas vistas totales" | **Profundidad de Recorrido (Páginas/Sesión) + Tiempo Medio de Lectura** |
| **Google Search** | "Discover Score 0-100" | **Impresiones Reales + CTR Promedio + Posición Top 10** |
| **Social / Redes** | "Likes en Facebook" | **Tráfico Referido Efectivo + Tasa de Rebote Social** |
| **Editorial** | "Word Count promedio" | **Completitud Editorial + Tasa de Enlazado Interno + Cobertura Balanceada** |
| **Monetización** | "AdSense Score predictivo" | **RPM Efectivo + Páginas Monetizables + Donaciones / Apoyo Directo** |

---

## 5. ROADMAP FINAL DE IMPLEMENTACIÓN POR BLOQUES

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   ROADMAP: FROM BETA TO ENTERPRISE                       │
└──────────────────────────────────────────────────────────────────────────┘

  BLOQUE 1: FOUNDATION & CLEANUP
  ├── Purgar endpoints obsoletos en app/api/admin/
  ├── Consolidar configuración y eliminar dependencias huérfanas
  └── Garantizar TTL y eficiencia en Firestore

  BLOQUE 2: OBSERVABILITY & JOURNEY TRACKING
  ├── Conectar JourneyEvents desde la navegación real del lector
  ├── Mapeo de flujos: Portada → Categoría → Nota → Enlaces relacionados
  └── Agregación anónima de sesiones sin PII

  BLOQUE 3: BUSINESS INTELLIGENCE ENGINE (NIOS v2)
  ├── Conexión robusta y tolerante a fallos con GSC & GA4
  ├── Content Lifecycle Tracker (1h, 24h, 7d, 30d)
  └── Growth Opportunity Detector (Search & Recirculación)

  BLOQUE 4: REVENUE & SUSTAINABILITY
  ├── Módulo de AdSense Readiness con evidencia objetiva
  ├── Módulo de Apoyo Comunitario / Donaciones éticas
  └── Rastreo de RPM y valor por categoría

  BLOQUE 5: CEO OPERATING SYSTEM & GO-LIVE
  ├── Generador del "CEO Morning Brief" (5 prioridades del día)
  ├── Generador del "Weekly Strategic Report"
  ├── Documentación maestra: docs/NI/OPERATING_SYSTEM.md
  └── Gate de Aceptación Final en Producción Real
```

---

## 6. CRITERIOS DE TERMINACIÓN (DEFINITION OF DONE EMPRESARIAL)

Una etapa o bloque solo se declarará terminada si cumple:
1. **Código:** Tipado estricto en TypeScript (`tsc --noEmit` = 0 errores).
2. **Pruebas:** Test suite unitario y de integración pasando al 100%.
3. **Datos Reales:** Demostrado contra Firestore, GSC y GA4 reales (no mocks).
4. **Semántica:** Sin semáforos ciegos; `null` = desconocido, no cero.
5. **Impacto:** Produce una acción concreta para el negocio o el periodista.
6. **Documentación:** Explicado en el sistema operativo maestro.

---

> **FIN DEL PLAN — PROCEDIMIENTO SIGUIENTE:**
> Según el mandato del CEO, el agente **se detiene aquí** para revisión y aprobación del plan antes de iniciar el Bloque 1 de programación.
