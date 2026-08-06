# NIOS Intelligence Platform v1.0

## Resumen

Sistema de inteligencia editorial basado **únicamente en datos reales** de Google Search Console, Google Analytics 4, Firestore y Google Indexing API.

**Regla de oro**: NIOS no dice "Creo...". NIOS dice "Google Search Console indica..." o "Google Analytics muestra...". Si no existe evidencia, responde: "No hay datos suficientes para emitir una recomendación."

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    NIOS Intelligence Platform                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  GSC         │  │  GA4         │  │  Firestore       │   │
│  │  Collector   │  │  Collector   │  │  (noticias +     │   │
│  │              │  │              │  │   MENI scores)   │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                 │                   │              │
│         └────────┬────────┘                   │              │
│                  ▼                            │              │
│         ┌────────────────┐                    │              │
│         │  Data Merger   │◄───────────────────┘              │
│         │  (ArticleFusion)│                                  │
│         └───────┬────────┘                                   │
│                 │                                            │
│     ┌───────────┼───────────┬──────────────┐                 │
│     ▼           ▼           ▼              ▼                 │
│  ┌──────┐  ┌────────┐  ┌─────────┐  ┌──────────┐            │
│  │Rules │  │Compl.  │  │Readiness│  │Dashboard │            │
│  │(M4)  │  │(M0)    │  │(M6)     │  │(M5)      │            │
│  └──┬───┘  └───┬────┘  └────┬────┘  └────┬─────┘            │
│     │          │            │             │                  │
│     └──────────┴────────────┴─────────────┘                  │
│                    │                                         │
│                    ▼                                         │
│          ┌─────────────────┐                                 │
│          │  Firestore      │                                 │
│          │  nios_daily_    │                                 │
│          │  snapshots      │                                 │
│          └─────────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

## Módulos

### Módulo 0: Google Compliance Intelligence
**Archivo**: `lib/nios/intelligence/compliance.ts`

Responde: ¿Qué está viendo Google como "contenido de poco valor"?

Compara score MENI con impresiones reales de Google Search Console:
- **MENI sobreestima**: Score MENI ≥ 90 pero Google muestra 0 impresiones
- **MENI subestima**: Score MENI < 85 pero Google muestra >1000 impresiones
- **Alineados**: MENI y Google coinciden

### Módulo 1: GSC Collector
**Archivo**: `lib/nios/intelligence/gsc-collector.ts`

Obtiene diariamente de Google Search Console API:
- Impresiones, clics, CTR, posición media por URL
- Consultas (queries) que generan tráfico
- Datos por país y dispositivo
- Discover y Google News (si existen)
- Top queries por página

### Módulo 2: GA4 Collector
**Archivo**: `lib/nios/intelligence/ga4-collector.ts`

Obtiene diariamente de Google Analytics 4 Data API:
- Usuarios, sesiones, pageviews
- Tiempo promedio de engagement
- Tasa de engagement
- Fuentes de tráfico
- Dispositivos
- Páginas más vistas

### Módulo 3: Data Merger
**Archivo**: `lib/nios/intelligence/data-merger.ts`

Fusiona datos de Firestore (MENI), GSC y GA4 por artículo. Cada noticia queda con:
- Score MENI
- Impresiones, clics, CTR, posición de Google
- Usuarios, sesiones, engagement de GA4

### Módulo 4: Editorial Intelligence
**Archivo**: `lib/nios/intelligence/editorial-rules.ts`

Genera recomendaciones basadas **únicamente en reglas** (no IA):

| Regla | Condición | Recomendación |
|-------|-----------|---------------|
| Título | CTR alto + posición baja | Mejorar título |
| Meta | Posición alta + CTR bajo | Revisar meta description |
| Snippet | Muchas impresiones + pocos clics | Revisar snippet |
| Update | Alto engagement + pocas impresiones | Actualizar artículo |
| SEO | Alto tráfico Facebook + cero Google | Revisar SEO técnico |
| Google ignora | 0 impresiones + MENI alto | Verificar indexación |

Cada recomendación incluye: fuente, API, fecha, métrica, valor, comparación, confianza.

### Módulo 5: Dashboard Google Intelligence
**Archivo**: `lib/nios/intelligence/dashboard.ts` + `components/nios/GoogleIntelligenceClient.tsx`
**URL**: `/admin/nios/google-intelligence`

Responde:
- ¿Cuáles son las 20 notas con más impresiones?
- ¿Cuáles tienen mejor CTR?
- ¿Cuáles tienen CTR malo?
- ¿Qué categorías crecen?
- ¿Qué consulta genera más tráfico?
- ¿Qué URLs nunca reciben impresiones?
- ¿Qué URLs Google ignora?

### Módulo 6: AdSense Readiness
**Archivo**: `lib/nios/intelligence/readiness.ts`

Analiza TODAS las noticias en 11 dimensiones:
- Contenido útil, Profundidad, Originalidad, Contexto, Servicio
- Experiencia, Enlaces internos, Autoridad, EEAT, Actualizado, Duplicidad

Compara con Search Console para descubrir dónde MENI se equivoca.

### Módulo 7: Justificación
Toda recomendación incluye evidencia completa:
```
Fuente: Google Search Console
API: searchanalytics.query
Fecha: 2026-07-08 a 2026-08-05
Métrica: CTR
Valor: 0.8%
Comparación: Promedio del sitio: 3.9%
```

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/nios-collect` | POST | Ejecuta pipeline completo |
| `/api/admin/nios-collect` | GET | Estado del pipeline |
| `/api/admin/nios-intelligence` | GET | Dashboard + reportes |
| `/api/admin/nios-intelligence?action=compliance` | GET | Reporte de compliance |
| `/api/admin/nios-intelligence?action=readiness` | GET | Reporte de readiness |
| `/api/admin/nios-intelligence?action=history` | GET | Snapshots históricos |
| `/api/cron/nios-collect` | GET | Cron diario (Vercel Cron) |

## Cron Diario

Configurado en `vercel.json`:
```json
{
  "path": "/api/cron/nios-collect",
  "schedule": "0 6 * * *"
}
```

Se ejecuta a las 6:00 UTC (00:00 CST Nicaragua) diariamente.

## Variables de Entorno Requeridas

| Variable | Descripción | Estado |
|----------|-------------|--------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | ✅ Ya configurado |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | ✅ Ya configurado |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | ✅ Ya configurado |
| `NIOS_SITE_URL` | URL del sitio en GSC | Opcional (default: `https://nicaraguainformate.com`) |
| `NIOS_GA4_PROPERTY_ID` | GA4 Property ID (numérico) | ⚠️ **Requerido para GA4** |
| `CRON_SECRET` | Secreto para cron endpoint | ⚠️ **Requerido para cron** |
| `ADMIN_API_KEY` | API key para endpoints admin | ✅ Ya configurado |

## Colección Firestore

### `nios_daily_snapshots/{YYYY-MM-DD}`

Cada documento contiene:
- `date`: Fecha del snapshot
- `collectedAt`: Timestamp de recolección
- `gsc`: Snapshot completo de Google Search Console
- `ga4`: Snapshot completo de Google Analytics 4
- `articlesFused`: Artículos fusionados (MENI + Google + GA4)
- `recommendations`: Recomendaciones generadas
- `compliance`: Reporte de compliance
- `readiness`: Reporte de AdSense Readiness

**Los snapshots nunca se sobrescriben** (preserva histórico).

## Lo que NO se implementa

- ❌ Revenue Engine / RPM / AdSense API (AdSense rechazado)
- ❌ Predicciones
- ❌ Machine Learning
- ❌ IA para generar opiniones
- ❌ Estimaciones de CTR o impresiones

Hasta tener mínimo **90 días de datos reales**.

## Tests

```bash
npx vitest run tests/nios-intelligence.test.ts
```

14 tests cubriendo:
- Data Merger (2 tests)
- Editorial Rules (5 tests)
- Compliance Intelligence (3 tests)
- AdSense Readiness (2 tests)
- Dashboard Builder (2 tests)

## Estructura de Archivos

```
lib/nios/intelligence/
├── types.ts              # Tipos TypeScript
├── gsc-collector.ts      # Módulo 1: GSC Collector
├── ga4-collector.ts      # Módulo 2: GA4 Collector
├── data-merger.ts        # Módulo 3: Data Merger
├── editorial-rules.ts    # Módulo 4: Editorial Intelligence
├── compliance.ts         # Módulo 0: Compliance Intelligence
├── readiness.ts          # Módulo 6: AdSense Readiness
├── dashboard.ts          # Módulo 5: Dashboard Builder
├── store.ts              # Firestore persistence
├── orchestrator.ts       # Pipeline orchestrator
└── index.ts              # Barrel export

app/api/admin/
├── nios-collect/route.ts     # API: ejecutar pipeline
└── nios-intelligence/route.ts # API: obtener dashboard/reportes

app/api/cron/
└── nios-collect/route.ts     # Cron diario

app/admin/nios/
└── google-intelligence/page.tsx  # Dashboard page

components/nios/
└── GoogleIntelligenceClient.tsx  # Dashboard UI

tests/
└── nios-intelligence.test.ts    # Tests
```
