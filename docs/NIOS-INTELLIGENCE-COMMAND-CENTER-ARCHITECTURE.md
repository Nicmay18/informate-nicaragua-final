# NIOS Intelligence Command Center — Arquitectura de Integración

**Baseline commit:** `a89e1a8` (último sync)  
**Fecha:** 2026-08-31  
**Propósito:** unificar módulos existentes en un solo cerebro operativo, no crear otro dashboard.

---

## 1. Diagnóstico del estado actual

### 1.1 Módulos que ya existen

| Módulo | Ubicación clave | Estado actual |
|--------|-----------------|---------------|
| NIOS Orchestrator | `lib/nios/intelligence/orchestrator.ts` | Código completo, ganchos a GSC/GA4/Firestore. Nunca probado con datos reales en este entorno. |
| NIOS Executive Center | `lib/nios/executive-center.ts` + `app/admin/nios/page.tsx` | Lee snapshots de Firestore y construye vista. Depende de que el pipeline haya corrido. |
| CEO Loop | `lib/nios/ceo-loop.ts` | CICLO OBSERVE/DECIDE/EXECUTE/VERIFY/LEARN/MEMORY completo. Necesita Firestore. |
| CEO Observatory | `lib/nios/ceo-observatory.ts` | Conecta `commandCenter`, `businessBrain`, `latestSnapshot`, `traffic`. |
| CEO Memory | `lib/nios/ceo-memory.ts` | Persiste en `nios_memory`. |
| CEO Learning | `lib/nios/ceo-learning.ts` | Carga patrones de `nios_memory` y calcula boost. |
| CEO Decision Engine | `lib/nios/ceo-decision-engine.ts` | Convierte diagnósticos en `NO_ACTION|AUTO_EXECUTE|QUEUE_FOR_HUMAN|BLOCKED`. |
| CEO Action Registry | `lib/nios/ceo-action-registry.ts` | Define acciones, modos y scoring. |
| GSC Collector | `lib/nios/intelligence/gsc-collector.ts` | Usa cuenta de servicio Firebase, requiere permisos en GSC. |
| GA4 Collector | `lib/nios/intelligence/ga4-collector.ts` | Requiere `NIOS_GA4_PROPERTY_ID` y permisos. |
| Traffic | `lib/analytics/traffic-reader.ts` + `traffic-aggregator.ts` | Lee `traffic_daily` / `traffic_log` en Firestore. |
| MENI Learning | `lib/nios/intelligence/meni-learning.ts` | Feedback MENI → NIOS. |
| Store | `lib/nios/intelligence/store.ts` | Guarda `nios_daily_snapshots` y subcolecciones. |
| Forense | `lib/nios/editorial-diagnosis.ts` + `lib/meni/*` | Diagnóstico editorial calidad. |
| Editor IA | `lib/editor-jefe-v4/` + `lib/editorial/` | Motor de redacción/evaluación. |
| Growth | `lib/nios/growth.ts` + `lib/growth.ts` | Detección de oportunidades. |
| Entidades | `lib/meni/utils/entities.ts` | Extracción/relación de entidades. |
| Cron | `vercel.json` | 2 jobs: `nios-collect` 8:00, `supervisor-watch` cada 30m. |

### 1.2 Variables de entorno (valores ocultos)

| Variable | Requerida por | Estado .env.local |
|----------|---------------|-------------------|
| `FIREBASE_PROJECT_ID` | Firestore, GA4 | SET |
| `FIREBASE_CLIENT_EMAIL` | Firestore, GSC, GA4 | SET |
| `FIREBASE_PRIVATE_KEY` | Firestore, GSC, GA4 | SET |
| `GSC_PROPERTY` / `NIOS_GSC_SITE_URL` | GSC | DEFAULT en código `https://nicaraguainformate.com` |
| `NIOS_GA4_PROPERTY_ID` | GA4 | UNSET |
| `GOOGLE_ADSENSE_CLIENT_ID` | AdSense | UNSET |
| `NIOS_CRON_SECRET` | Autorización cron | UNSET |

### 1.3 Problema principal identificado

El sistema no es una colección de módulos aislados: **ya está conectado por tipo**, pero no existe un **modelo único de eventos** que permita rastrear toda la inteligencia de un artículo y que el CEO tome decisiones con contexto completo. Además, faltan credenciales para GSC/GA4 y AdSense.

---

## 2. Modelo de datos unificado

### 2.1 IntelligenceEvent

```typescript
interface IntelligenceEvent {
  id: string;                    // uuid o derivado
  articleId?: string;            // slug / noticiaId
  timestamp: string;             // ISO
  source: 'MENI' | 'FORENSE' | 'EDITOR' | 'GSC' | 'GA4' | 'TRAFFIC' | 'GROWTH' | 'ENTITIES' | 'CEO' | 'NISO';
  module: string;                // nombre del módulo concreto
  signal: string;                // slug de la señal, ej. 'gsc_ctr_low'
  metric?: string;               // métrica asociada
  value: number | string | null; // valor real del dato
  status: NiosDataStatus;        // REAL|BLOCKED|NO_DATA...
  confidence: number;            // 0-1
  evidence: EvidenceItem[];      // cada dato con source+timestamp
  recommendation?: string;       // sugerencia en lenguaje natural
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  action?: string;               // acción sugerida (id)
  expectedOutcome?: string;
}
```

### 2.2 EvidenceItem

```typescript
interface EvidenceItem {
  source: string;           // 'GSC API', 'GA4 API', 'Firestore noticias', 'MENI engine', 'Forense'
  api?: string;             // endpoint o función
  dateRange?: { start: string; end: string };
  metric: string;           // 'clicks', 'MENI score', 'forense_severity'
  value: number | string;
  comparison?: string;
  collectedAt: string;      // ISO
  freshness?: number;       // horas de antigüedad
  confidence: number;       // 0-1
}
```

### 2.3 Decision

```typescript
interface CommandDecision {
  id: string;
  articleId?: string;
  timestamp: string;
  signal: string;
  source: string;            // módulos que aportaron evidencia
  inputs: string[];          // IDs de IntelligenceEvents
  decision: 'NO_ACTION' | 'AUTO_EXECUTE' | 'QUEUE_FOR_HUMAN' | 'BLOCKED';
  priority: number;          // 0-1
  confidence: number;        // 0-1
  impact: number;            // 0-1
  risk: number;              // 0-1
  actionId?: string;         // referencia a action registry
  actionTitle: string;
  reason: string;            // explicación ejecutiva
  expectedOutcome: string;
  evidence: EvidenceItem[];
}
```

### 2.4 ArticleIntelligence

```typescript
interface ArticleIntelligence {
  identity: {
    articleId: string;
    url: string;
    title: string;
    category: string;
    author: string;
    publishedAt: string;
    updatedAt: string;
  };
  editorial: {
    meni: number | null;
    forense: { status: string; issues: string[] };
    quality: number | null;
    originality: string;
    eeat: string;
    issues: string[];
  };
  seo: {
    gscImpressions: number | null;
    gscClicks: number | null;
    gscCtr: number | null;
    gscPosition: number | null;
    gscTopQueries: { query: string; impressions: number; clicks: number }[];
    gscStatus: NiosDataStatus;
    indexStatus: string;
  };
  audience: {
    ga4Users: number | null;
    ga4Sessions: number | null;
    ga4Pageviews: number | null;
    ga4EngagementTimeSec: number | null;
    ga4Status: NiosDataStatus;
  };
  traffic: {
    internalViews: number | null;
    topSource: string | null;
    status: NiosDataStatus;
  };
  distribution: {
    facebook?: number;
    telegram?: number;
    x?: number;
    push?: number;
    indexNow?: boolean;
    status: NiosDataStatus;
  };
  growth: {
    momentum: number | null;
    trend: 'rising' | 'falling' | 'stable' | null;
    potential: 'alto' | 'medio' | 'bajo' | null;
  };
  entities: string[];        // entidades detectadas
  opportunities: string[];   // recomendaciones abiertas
  decisions: string[];       // IDs de decisiones activas
  learning: string[];        // aprendizajes asociados
  lastUpdated: string;
}
```

---

## 3. Mapa de módulos conectados

```
┌─────────────────────────────────────────────────────────────────┐
│                        NIOS COMMAND CENTER                        │
│                   (app/admin/nios/page.tsx)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   EDITORIAL   │     │   AUDIENCIA   │     │   OPERACIÓN   │
│   (MENI)      │     │ (GSC/GA4/Tra) │     │  (Pipeline)   │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        │    ┌────────────────┼────────────────┐    │
        │    │                │                │    │
        ▼    ▼                ▼                ▼    ▼
  lib/meni/*            lib/nios/intelligence/*   lib/nios/ceo-*
  lib/editorial/*       gsc-collector.ts          repair-engine.ts
  lib/nios/editorial-   ga4-collector.ts          ceo-loop.ts
    diagnosis.ts        traffic-*.ts              ceo-memory.ts
                        lib/analytics/*           ceo-learning.ts
                                                lib/nios/forense*  ← si existe
┌─────────────────────────────────────────────────────────────────┐
│                      INTELLIGENCE GRAPH                          │
│              (lib/nios/command-center/intelligence-graph.ts)     │
│   fusiona artículos + señales + decisiones + aprendizaje        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CEO AGENT                                  │
│                 (lib/nios/ceo-loop.ts)                           │
│   OBSERVE → DIAGNOSE → DECIDE → EXECUTE → VERIFY → LEARN        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ACCIONES + APRENDIZAJE                       │
│   nios_memory, nios_daily_snapshots, nios_alerts, noticias       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Source of Truth por métrica

| Métrica | Fuente real | Collection/Archivo | Frecuencia | Estado actual |
|---------|-------------|--------------------|------------|---------------|
| MENI score | `lib/meni/...` | `noticias.scoreMeni` | al publicar/editar | CODE OK |
| Forense | `lib/nios/editorial-diagnosis.ts` + `lib/meni` | `noticias` / snapshot | al publicar | CODE OK |
| GSC clicks/impressions/ctr/posición | GSC API v3 | `nios_daily_snapshots.gsc` | 1/día | CONFIG OK, permisos desconocidos |
| GA4 users/sessions/pageviews | GA4 Data API | `nios_daily_snapshots.ga4` | 1/día | BLOCKED: `NIOS_GA4_PROPERTY_ID` UNSET |
| Vistas internas | `lib/analytics/traffic-reader.ts` | `traffic_daily` / `traffic_log` | cada vista/1 día | CODE OK |
| Facebook reach/engagement | Facebook scraper? | `nios_daily_snapshots.socialConversion` | ? | NOT_PROVEN |
| Telegram reach | - | - | - | NOT_CONFIGURED |
| Push | - | - | - | NOT_CONFIGURED |
| Entidades | `lib/meni/utils/entities.ts` | `noticias.entidades` / generado | al publicar | CODE OK |
| Momentum | `lib/nios/intelligence/article-momentum.ts` | derivado de snapshots | 1/día | CODE OK |
| Decisiones CEO | `lib/nios/ceo-loop.ts` | `nios_memory` | cada ciclo | CODE OK |

### 4.1 Regla crítica

`NO_DATA` y `ACCESS_BLOCKED` nunca se convierten a `0`. Cada métrica mantiene su semántica y estado.

---

## 5. Esquema de estados permitidos

```
VERIFIED        → dato comprobado contra su fuente
PARTIAL         → dato parcial o con advertencias
STALE           → dato viejo, posiblemente obsoleto
DEGRADED        → fuente lenta o incompleta
NO_DATA         → no se pudo obtener dato pero la conexión existe
ACCESS_BLOCKED  → credenciales sin permisos
ERROR           → excepción no esperada
NOT_CONFIGURED  → variable/permiso no existe
```

---

## 6. Decision flow

```
SIGNAL (IntelligenceEvent)
  ↓
VALIDATION (source, freshness, confidence)
  ↓
CONFIDENCE ≥ umbral?
  ↓ NO  → NO_ACTION / BLOCKED
  ↓ SI
IMPACT × CONFIDENCE / RIESGO
  ↓
PRIORITY
  ↓
RECOMMENDATION
  ↓
ACTION (AUTO_EXECUTE | QUEUE_FOR_HUMAN)
  ↓
MEASUREMENT (24h / 72h / 7d)
  ↓
LEARNING (guardar en nios_memory)
```

---

## 7. Ruta a implementar

### 7.1 Paso 1: runtime real de datos

1. Configurar `NIOS_GA4_PROPERTY_ID` en `.env.local`.
2. Probar `getAdminDb()` con `npx tsx` o similar.
3. Ejecutar `collectGSC()` y verificar permisos.
4. Ejecutar `collectGA4()` y verificar propiedad.
5. Ejecutar `runNIOSPipeline(db, NIOS_CONFIG)` y guardar snapshot.
6. Ejecutar `runCEOLoop(db)` dos veces para probar memoria/learning.

### 7.2 Paso 2: Intelligence Graph

1. Crear `lib/nios/command-center/intelligence-graph.ts`.
2. Implementar `buildArticleIntelligence(db, slug)`.
3. Implementar `buildIntelligenceEvents(db, limit)`.
4. Implementar `buildDecisionsFromEvents(events)`.

### 7.3 Paso 3: Command Center UI

1. Refactor `app/admin/nios/page.tsx` para mostrar:
   - System Status
   - Executive Brief
   - Content Intelligence (top/rising/falling/needs-update)
   - Google (GSC/GA4 separados con estados)
   - Audience
   - Editorial
   - Distribution
   - Growth
   - Alerts
   - CEO Actions con evidencia explícita

### 7.4 Paso 4: Decision + Learning

1. Conectar `runCEOLoop` al Command Center.
2. Guardar cada decisión CEO en `nios_memory`.
3. Medir resultados 24/48/72h.
4. Actualizar `calculateLearningBoost` con mediciones reales.

---

## 8. Prueba definitiva

Para 3 artículos reales, demostrar:

```
noticia X
  ↓ MENI + Forense
  ↓ Firestore (datos artículo)
  ↓ GSC (queries, impresiones, clics)
  ↓ GA4 (users, sessions)
  ↓ Traffic (vistas internas)
  ↓ Distribution (canales)
  ↓ Growth (momentum)
  ↓ CEO (decisión)
  ↓ Acción ejecutada o encolada
  ↓ Resultado medido 24/48/72h
  ↓ Learning persistido
```

---

## 9. Blockers identificados

1. `NIOS_GA4_PROPERTY_ID` = UNSET. GA4 no puede recolectar.
2. `npx tsx` no disponible. Sin runner de TS no se puede ejecutar código fuera de `next build`/`vitest`.
3. `GSC` tiene credenciales pero permisos reales no verificados.
4. `NIOS_CRON_SECRET` = UNSET. No se puede probar `/api/cron/nios-collect` sin exponer secret.
5. `GOOGLE_ADSENSE_CLIENT_ID` = UNSET. AdSense no recolecta.

---

## 10. Próximos pasos sugeridos

1. Establecer `NIOS_GA4_PROPERTY_ID` en `.env.local`.
2. Permitir un runner TS (`npx tsx` o instalar `tsx` como `devDependency`).
3. Ejecutar `collectGSC()` y `collectGA4()` con `dotenv`.
4. Corregir permisos si `ACCESS_BLOCKED`.
5. Ejecutar pipeline completo y guardar snapshot.
6. Ejecutar 2 ciclos de CEO loop y verificar `nios_memory`.
7. Luego refactorizar UI y agregar `ArticleIntelligence`.

---

## 11. Notas de implementación

- No se modifica `lib/meni/` ni `lib/editorial/` salvo que un test falle.
- No se duplica lógica: el nuevo Command Center consume funciones existentes.
- Se mantiene estricto: `NO_DATA` no se transforma en `0`.
- Se documenta cada SOURCE, VALUE, TIMESTAMP, FRESHNESS, STATUS y CONFIDENCE.
