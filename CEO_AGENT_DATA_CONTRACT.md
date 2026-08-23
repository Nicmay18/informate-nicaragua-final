# CEO Agent — Data Contract

## 1. Disponibilidad de datos

Toda métrica consumida por el CEO Agent se reporta con uno de estos estados:

- `REAL`: dato presente y verificable.
- `NO_DATA`: dato ausente (no confundir con `0`).
- `ACCESS_BLOCKED`: no se pudo acceder a la fuente (credenciales, permisos, red).

## 2. Artículo (`Noticia`)

Campos obligatorios para `analyzeForPublication`:

| Campo | Tipo | Uso |
|-------|------|-----|
| `id` | `string` | Identificador Firestore |
| `slug` | `string` | URL canónica |
| `titulo` | `string` | Headline |
| `resumen` | `string` | Snippet/meta |
| `contenido` | `string` | Cuerpo |
| `categoria` | `string` | Categoría interna |
| `fecha` | `string` (ISO) | Fecha de publicación |
| `vistas` | `number \| undefined` | Vistas históricas totales (`undefined` = `NO_DATA`) |
| `aprobadoMeni` | `boolean` | Estado MENI |
| `scoreMeni` | `number \| undefined` | Score MENI (`undefined` = no evaluado) |
| `palabras` | `number \| undefined` | Conteo de palabras |

## 3. Evidencia de tráfico (`TrafficEvidence`)

```ts
interface TrafficEvidence {
  viewsTotal?: number;   // vistas acumuladas históricas
  viewsRecent?: number;  // vistas recientes (rolling 24h o diarias)
  source?: string;       // fuente canónica
  status: 'REAL' | 'NO_DATA' | 'ACCESS_BLOCKED';
}
```

- `viewsRecent === 0` indica cero tráfico real, no `NO_DATA`.
- `viewsRecent === undefined` indica `NO_DATA`.
- `viewsRecent` prevalece sobre `viewsTotal` cuando ambos están presentes (`??`, no `||`).

## 4. Taxonomía canónica de fuentes de tráfico

Valores permitidos para `TrafficSource`:

- `GOOGLE_SEARCH`
- `GOOGLE_DISCOVER`
- `FACEBOOK`
- `TELEGRAM`
- `WHATSAPP`
- `DIRECT`
- `REFERRAL`
- `OTHER`
- `UNKNOWN`

La función `normalizeTrafficSource(raw: string): TrafficSource` en `lib/analytics/traffic-aggregator.ts` es la única normalizadora. Todo `traffic_log` y `traffic_daily` debe escribir con estas claves.

## 5. Umbrales de interés del lector

| Nivel | Vistas efectivas | Acción sugerida |
|-------|-----------------|-----------------|
| `HIGH` | `>= 500` | Publicar / seguimiento |
| `MEDIUM` | `>= 100` | Publicar con monitoreo |
| `LOW` | `>= 20` | Monitorear |
| `LOW` (0-19) | `>= 0` | Monitorear / no forzar |
| `UNKNOWN` | `undefined` | No decidir sin datos reales |

## 6. Salida del CEO Agent (`CEOAnalysis`)

```ts
interface CEOAnalysis {
  action: CEOAction;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  whatIsHappening: string;
  whyItMatters: string;
  evidence: string[];
  whatToDo: string;
  whatNotToDo: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  meni: CEODataSignal;
  traffic: CEODataSignal;
  google: CEODataSignal;
  dataStatus: CEODataStatus[];
  relatedArticles: CEORelatedArticle[];
  existingArticle: CEOExistingArticle | null;
  alert: CEOAlert | null;
}
```

Toda decisión incluye `evidence` y `whatNotToDo`. No se permite inventar datos.

## 7. Esquema de `ceo_decisions` en Firestore

Cada documento usa `slug` como ID:

```ts
{
  ...CEOAnalysis,
  slug: string;
  headline: string;
  createdAt: string;      // ISO
  status: 'pending_review' | 'applied' | 'dismissed';
}
```

- `pending_review`: decisión automática sin intervención humana.
- `applied`: editor aplicó la recomendación.
- `dismissed`: editor descartó la recomendación.

## 8. Fuentes de datos

| Fuente | Colección/Función | Usado por |
|--------|-------------------|-----------|
| MENI | `noticias.scoreMeni`, `noticias.aprobadoMeni` | `buildMeniSignal` |
| Vistas históricas | `noticias.vistas` | `readTraffic` fallback |
| Vistas recientes | `traffic_daily` o `traffic_log` | API `/api/admin/ceo-agent/analyze` |
| GSC | `gsc` mock/externo | `detectGoogleOpportunities` |
| Artículos relacionados | `noticias` pool | `findRelatedArticles`, `findExistingArticleOpportunity` |

## 9. Garantías

- Ninguna función del CEO inventa vistas, clicks, impresiones o scores.
- `NO_DATA` y `0` son representados distintamente.
- Los `alert` solo se emiten con evidencia concreta.
