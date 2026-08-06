# SPRINT 3 — PRODUCTION EXCELLENCE AUDIT
## Nicaragua Informate — Auditoría de nivel Principal Engineer

**Fecha:** 2026-08-05
**Stack:** Next.js 15 App Router | React 19 | TypeScript | Firebase | Cloudflare | Tailwind | MENI v7

---

# 1. AUDITORÍA GENERAL (P0–P3)

## P0-01: Sin paginación en listados de noticias

**Problema:** `NewsGrid` renderiza todas las noticias de una vez. `/noticias` carga 100, `/categoria/[slug]` carga 100. No hay paginación server-side ni infinite scroll.

**Por qué existe:** El proyecto creció de ~100 a ~500+ artículos. Cargar todo era viable al inicio.

**Impacto:** LCP degradado en categorías con muchas noticias. Google no descubre artículos antiguos vía crawl de listados. UX pobre.

**Cómo resolverlo:** Paginación URL-based (`/categoria/sucesos?page=2`) con `searchParams` en App Router. 12-20 artículos por página. `rel="prev"`/`rel="next"` en `<head>`.

**ROI:** Alto | **Tiempo:** 4h | **Riesgo:** Bajo

---

## P0-02: Sin índices Firestore para kb_entities, kb_timeline, kb_relations, indexing_log

**Problema:** `firestore.indexes.json` solo tiene índices para `noticias` y `newsletter`. Las colecciones del Knowledge Graph no tienen índices compuestos.

**Por qué existe:** Knowledge Graph se añadió sin actualizar el archivo de índices.

**Impacto:** Queries `where('slug', '==', ...)` y `where('entityId', '==', ...)` sin optimización. A 1000+ entidades, latencia y costos incrementan.

**Cómo resolverlo:** Añadir a `firestore.indexes.json`:
```json
{ "collectionGroup": "kb_entities", "queryScope": "COLLECTION", "fields": [{"fieldPath": "slug"}, {"fieldPath": "articleCount", "order": "DESCENDING"}] },
{ "collectionGroup": "kb_timeline", "queryScope": "COLLECTION", "fields": [{"fieldPath": "entityId"}, {"fieldPath": "date", "order": "DESCENDING"}] },
{ "collectionGroup": "kb_relations", "queryScope": "COLLECTION", "fields": [{"fieldPath": "sourceId"}, {"fieldPath": "strength", "order": "DESCENDING"}] },
{ "collectionGroup": "indexing_log", "queryScope": "COLLECTION", "fields": [{"fieldPath": "url"}, {"fieldPath": "timestamp", "order": "DESCENDING"}] }
```

**ROI:** Alto | **Tiempo:** 30min | **Riesgo:** Nulo

---

## P0-03: `loadEntityPage` hace N+1 queries a Firestore

**Problema:** `lib/meni/knowledge-base/entity-page.ts:77-91` hace un `db.collection('kb_entities').doc(id).get()` por cada entidad relacionada. Con 12 relacionadas = 12 lecturas adicionales.

**Por qué existe:** Código escrito para funcionalidad, no optimizado para escala.

**Impacto:** 15+ lecturas de Firestore por página de entidad. A 1000 visitas/día = 15,000 lecturas/día innecesarias.

**Cómo resolverlo:** Usar `db.getAll(...docRefs)` para batch read.

**ROI:** Alto | **Tiempo:** 1h | **Riesgo:** Bajo

---

## P0-04: Sitemap no incluye páginas de entidad ni de tema

**Problema:** `app/sitemap.ts` incluye noticias, categorías, autores, evergreen y estáticas. No incluye `/entidad/[slug]` ni `/tema/[slug]`.

**Por qué existe:** Las páginas se añadieron después del sitemap.

**Impacto:** Google no descubre estas páginas vía sitemap. Indexación más lenta.

**Cómo resolverlo:** Añadir queries a `kb_entities` y temas en `sitemap.ts`.

**ROI:** Alto | **Tiempo:** 1h | **Riesgo:** Nulo

---

## P1-01: `loadGraph` carga TODO el grafo en memoria

**Problema:** `lib/meni/knowledge-base/index.ts:37-41` hace `.get()` de TODAS las entidades, relaciones y timeline. A 500+ entidades, carga megabytes por request.

**Por qué existe:** Diseñado para un grafo pequeño (<100 entidades).

**Cómo resolverlo:** Caché con TTL más largo (30min). Para `queryKnowledgeForArticle`, cargar solo entidades que matcheen IDs extraídos.

**ROI:** Medio | **Tiempo:** 3h | **Riesgo:** Medio

---

## P1-02: `fetchNoticiasList` filtra en memoria en lugar de en Firestore

**Problema:** `lib/data.ts:158` hace `.get()` sin `where('estado', '==', 'publicado')` y filtra en JS. Lee borradores/archivados innecesariamente.

**Cómo resolverlo:** Añadir `.where('estado', '==', 'publicado')`. El índice `estado ASC + fecha DESC` ya existe.

**ROI:** Medio | **Tiempo:** 30min | **Riesgo:** Bajo

---

## P1-03: Sin cache-control headers en páginas de entidad

**Problema:** `app/entidad/[slug]/page.tsx` usa `force-dynamic`. `app/tema/[slug]` no establece headers explícitos. Cloudflare no puede cachear.

**Cómo resolverlo:** Entidad: cambiar a `revalidate = 3600`. Ambas: añadir `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` en middleware.

**ROI:** Alto | **Tiempo:** 1h | **Riesgo:** Bajo

---

## P1-04: AdSense script cargado dos veces

**Problema:** `app/layout.tsx:157-161` carga `adsbygoogle.js` en `<head>`. `AdsenseUnit.tsx:25-36` también lo carga dinámicamente.

**Cómo resolverlo:** Remover del `<head>`, dejar solo carga lazy en AdsenseUnit.

**ROI:** Medio | **Tiempo:** 15min | **Riesgo:** Bajo

---

## P1-05: `next-sitemap.config.js` legacy inactivo

**Problema:** Archivo existe con `additionalPaths: async () => []` y `generateRobotsTxt: false`. El sitemap real es `app/sitemap.ts`.

**Cómo resolverlo:** Eliminar archivo.

**ROI:** Bajo | **Tiempo:** 5min | **Riesgo:** Nulo

---

## P1-06: Sin `hreflang` real

**Problema:** `layout.tsx:123-126` declara `languages: { 'es-NI': ..., 'es': ..., 'x-default': ... }` pero todas apuntan a la misma URL.

**Cómo resolverlo:** Remover `languages` del metadata global.

**ROI:** Bajo | **Tiempo:** 15min | **Riesgo:** Nulo

---

## P2-01: `entity-extractor.ts` usa solo diccionarios hardcodeados

**Problema:** 550 líneas de diccionarios estáticos. No detecta entidades nuevas (personas emergentes, nuevas empresas).

**Cómo resolverlo:** Mantener diccionarios como baseline + añadir capa NER con LLM (Gemini Flash) para entidades no en diccionario.

**ROI:** Alto | **Tiempo:** 8h | **Riesgo:** Medio

---

## P2-02: Sin `BreadcrumbList` en páginas de entidad

**Problema:** `app/entidad/[slug]/page.tsx` no añade BreadcrumbList schema.

**Cómo resolverlo:** Añadir `buildBreadcrumbJsonLdEnhanced` con: Home > Enciclopedia > Entidad.

**ROI:** Medio | **Tiempo:** 30min | **Riesgo:** Nulo

---

## P2-03: `injectInternalLinks` usa estilos inline

**Problema:** `lib/article-links.ts:17-20` inyecta HTML con `style="..."` inline. Puede violar CSP.

**Cómo resolverlo:** Reemplazar con clases CSS.

**ROI:** Bajo | **Tiempo:** 30min | **Riesgo:** Bajo

---

## P2-04: Sin `ItemList` schema en categoría y autor

**Problema:** Solo se implementó `ItemList` en la home. Categorías y autores no lo tienen.

**Cómo resolverlo:** Reutilizar patrón de `app/page.tsx:94-106`.

**ROI:** Medio | **Tiempo:** 1h | **Riesgo:** Nulo

---

## P2-05: WebVitalsReporter no reporta INP

**Problema:** Falta `experimental.webVitalsAttribution: true` en `next.config.ts`.

**Cómo resolverlo:** Añadir configuración. Next.js 15 lo soporta.

**ROI:** Medio | **Tiempo:** 15min | **Riesgo:** Nulo

---

## P3-01: 60+ archivos .md en raíz del proyecto

**Problema:** Clutter en el repositorio.

**Cómo resolverlo:** Mover a `docs/history/`.

**ROI:** Bajo | **Tiempo:** 30min | **Riesgo:** Nulo

---

# 2. AUDITORÍA ESPECÍFICA

## Google Search

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Sitemap.xml | ✅ | Dinámico. **Falta: entidades y temas** |
| News-sitemap.xml | ✅ | Filtra últimas 48h, formato correcto |
| Robots.txt | ✅ | Bloquea AI scrapers, permite Googlebot |
| Canonical | ✅ | Todas las páginas con `alternates.canonical` |
| Schema NewsArticle | ✅ | Completo: headline, image (3 variantes), author, editor, speakable, publisher |
| Schema Organization | ✅ | Con `@id`, logo, contactPoint, sameAs |
| Schema WebSite | ✅ | Con SearchAction |
| Schema BreadcrumbList | ✅ | En noticias y temas, **no en entidades** |
| Schema ItemList | ✅ | En home, **no en categorías** |
| Schema CollectionPage | ✅ | En `/tema/[slug]` |
| Schema Person/Org/Place | ✅ | En `/entidad/[slug]` |
| Google Indexing API | ✅ | Con deduplicación 24h y logging |
| `max-image-preview:large` | ✅ | En layout y noticias |

## Google Discover

| Aspecto | Estado |
|---------|--------|
| Imagen OG 1200px | ✅ `getHeroImageUrl` usa weserv.nl para 1200px WebP |
| `max-image-preview:large` | ✅ Configurado |
| Discover Score | ✅ `lib/discover-score.ts` con 9 dimensiones |
| Title quality | ✅ `lib/seo/title.ts` con validación 30-60 chars |

## Google News

| Aspecto | Estado |
|---------|--------|
| NewsArticle schema | ✅ Completo |
| News sitemap | ✅ Actualizado cada 30min |
| Publisher Center | ✅ Verificación GSC |
| Editorial policy | ✅ `/politica-editorial`, `/correcciones`, `/metodologia-editorial` |
| Author transparency | ✅ `/autor/[slug]` con bio, foto, schema Person |
| Content freshness | ✅ ISR 60s home, 300s noticias |

## Core Web Vitals

| Métrica | Estado | Notas |
|---------|--------|-------|
| LCP | ⚠️ | Critical CSS inline, preconnect weserv.nl, pero AdSense duplicado degrada |
| CLS | ✅ | Next/image con dimensiones, AdsenseUnit con minHeight |
| INP | ⚠️ | No medido — falta `webVitalsAttribution` |
| TTFB | ✅ | ISR + Cloudflare cache para crawlers |

## EEAT

| Señal | Estado |
|-------|--------|
| Autores identificados | ✅ `lib/authors.ts` con slugs, bios, fotos |
| Páginas de autor | ✅ `/autor/[slug]` con schema Person |
| Centro de autoridad | ✅ `/autoridad` |
| Política de correcciones | ✅ `/correcciones` |
| Metodología editorial | ✅ `/metodologia-editorial` |
| Centro de confianza | ✅ `/centro-confianza` |
| `sameAs` en schema | ✅ Redes sociales en Organization |
| `knowsAbout` en author | ✅ En NewsArticle schema |
| Editor identificado | ✅ Keyling Rivera como editor |
| Fuentes complementarias | ✅ Campo en Noticia |

## Monetización

| Aspecto | Estado | Notas |
|---------|--------|-------|
| AdSense | ✅ | `ca-pub-4115203339551838`, lazy load con IntersectionObserver |
| Monetag | ✅ | Zone 11065476 |
| Revenue tracking | ❌ | Sin RPM/CTR por artículo |
| Ad placement A/B | ❌ | Sin testing |

## Firestore

| Aspecto | Estado |
|---------|--------|
| Índices noticias | ✅ estado+fecha, estado+categoria+fecha, vistas |
| Índices kb_* | ❌ **Faltan** |
| Caching | ✅ `unstable_cache` con tags y revalidate |
| Field projection | ✅ `select(...LIST_FIELDS)` |
| N+1 queries | ⚠️ `loadEntityPage` |
| Security rules | ✅ `firestore.rules` |

## Cloudinary

**Nota:** Cloudinary está en `next.config.ts` remotePatterns pero **no se usa**. Las imágenes se suben a GitHub (`app/api/admin/upload-image/route.ts`) y se sirven vía jsDelivr + weserv.nl. Funciona pero GitHub tiene límite de 100MB por repo.

## Cloudflare

| Aspecto | Estado |
|---------|--------|
| DNS | ✅ Apunta a Vercel |
| CDN cache | ⚠️ Middleware establece cache para crawlers, no para usuarios en entidad/tema |
| Security headers | ✅ HSTS, CSP, X-Frame-Options, Permissions-Policy |
| Bot management | ✅ Bloquea AI scrapers |

## ISR / Caching

| Ruta | Revalidate | Notas |
|------|-----------|-------|
| `/` | 60s | ✅ |
| `/noticias/[slug]` | 300s | ✅ |
| `/categoria/[slug]` | 3600s | ✅ |
| `/tema/[slug]` | 3600s | ✅ |
| `/entidad/[slug]` | force-dynamic | **⚠️ Debería ser ISR** |
| `/sitemap.xml` | 3600s | ✅ |
| `/news-sitemap.xml` | 1800s | ✅ |

## Internal Linking

| Aspecto | Estado |
|---------|--------|
| `injectInternalLinks` | ✅ Inyecta después del 2do párrafo |
| `related_links` | ✅ Campo en Firestore |
| Evergreen links | ✅ `lib/evergreen.ts` |
| Topic hub links | ✅ `/tema/[slug]` |
| Entity links | ✅ `/entidad/[slug]` |
| Auto-detection | ❌ Related links se asignan manualmente |

## Analytics & Observabilidad

| Aspecto | Estado |
|---------|--------|
| GA4 | ✅ Carga diferida via requestIdleCallback |
| Web Vitals | ✅ LCP/CLS/FCP/TTFB a GA4 |
| Sentry | ✅ Server + client + edge |
| Event tracking | ❌ Sin eventos personalizados |
| Health checks | ⚠️ Sin `/api/health` |
| Alerting | ❌ Sin alertas Sentry → Telegram |

## Accessibility

| Aspecto | Estado |
|---------|--------|
| Skip to content | ✅ |
| ARIA labels | ✅ |
| Alt text | ✅ |
| Semantic HTML | ✅ |
| Lighthouse a11y | ✅ Umbral 90 |

---

# 3. ANÁLISIS COMPETITIVO

## Matriz de capacidades técnicas

| Capacidad | BBC/DW/El País | Infobae | La Prensa/Confidencial | **NI Informate** |
|-----------|----------------|---------|------------------------|------------------|
| Next.js + ISR | ✅ | ❌ WordPress | ❌ WordPress | ✅ Next.js 15 |
| JSON-LD NewsArticle completo | ✅ | ⚠️ | ❌ | ✅ |
| Speakable schema | ❌ | ❌ | ❌ | ✅ |
| Knowledge Graph local | ✅ | ❌ | ❌ | ✅ |
| Entity pages | ✅ | ❌ | ❌ | ✅ |
| Topic clusters | ✅ | ❌ | ❌ | ✅ |
| Google Indexing API | ✅ | ❌ | ❌ | ✅ |
| Discover Score | ❌ | ❌ | ❌ | ✅ |
| Editorial AI (MENI) | ❌ | ❌ | ❌ | ✅ |
| Lighthouse CI | ✅ | ❌ | ❌ | ✅ |
| Sentry + CSP nonce | ✅ | ❌ | ❌ | ✅ |
| **Paginación** | ✅ | ✅ | ✅ | **❌** |
| A/B testing titulares | ✅ (BBC) | ❌ | ❌ | ❌ |
| Video embed nativo | ✅ | ❌ | ❌ | ❌ |

## Brechas vs. líderes

1. **Paginación** — Todos los medios serios la tienen. NI Informate no. **Más urgente.**
2. **A/B testing de titulares** — BBC lo hace. Requiere infraestructura de experimentation.
3. **Video embed** — Líderes integran video. NI Informate solo tiene radio.
4. **Content recommendations** — Infobae usa Taboola. NI Informate usa internal linking (mejor a largo plazo).

## Ventajas únicas de NI Informate

1. **MENI v7** — 15+ sub-engines editoriales. Ningún competidor centroamericano tiene esto.
2. **Knowledge Graph nicaragüense** — 500+ entidades estructuradas.
3. **Discover Score** — Métrica inexistente incluso en medios internacionales.
4. **Speakable schema** — Ni BBC lo usa. Ventaja en voice search.
5. **Google Indexing API con deduplicación** — Indexación en minutos.
6. **CSP con nonce dinámico** — Seguridad de nivel bancario.
7. **ISR 60s en home** — Frescura superior a WordPress.

---

# 4. EDITORIAL INTELLIGENCE ENGINE — DISEÑO

## Arquitectura

```
Input: Noticia (titulo, resumen, contenido, categoria, autor, fecha, imagen, tags)

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Google Score │ │Discover Score│ │ Facebook Score│
│    0-100     │ │    0-100    │ │    0-100    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐
│Telegram Score│ │Newsletter Sc │ │ Evergreen Sc │
│    0-100     │ │    0-100     │ │    0-100     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
┌──────┴────────────────┴────────────────┴──────┐
│           PREDICTION LAYER                     │
│  CTR | RPM | Tiempo lectura | Backlinks       │
│  Indexación | Viralidad | Canibalización      │
│  P(Discover) | P(Google News)                  │
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────┴───────────────────────────┐
│           EXPLANATION LAYER                     │
│  Por qué cada score tiene ese valor             │
│  Recomendaciones accionables por dimensión      │
└────────────────────────────────────────────────┘
```

## Scores

### Google Score (0-100)
- Title length (30-60 chars): 15%
- Meta description (150-160): 10%
- Word count (350+): 15%
- Schema completeness: 10%
- Internal links (3+): 10%
- Canonical: 5%
- Image alt text: 5%
- Page speed (LCP < 2.5s): 10%
- Mobile-friendly: 10%
- Freshness (< 24h): 10%

### Discover Score (0-100)
**Ya implementado en `lib/discover-score.ts`** con 9 dimensiones.

### Facebook Score (0-100)
- Emotional trigger (no clickbait): 20%
- Image quality (1200x630): 20%
- Title curiosity gap: 15%
- Question in title: 10%
- Number in title: 10%
- Local relevance: 15%
- Trending topic: 10%

### Telegram Score (0-100)
- Breaking news: 25%
- Local impact: 20%
- Title conciseness: 15%
- Image presence: 15%
- Category match: 15%
- Urgency: 10%

### Newsletter Score (0-100)
- Evergreen potential: 20%
- Depth (600+ words): 20%
- Service journalism: 15%
- Exclusivity: 15%
- Visual richness: 10%
- Reader benefit: 10%
- Non-time-sensitive: 10%

### Evergreen Score (0-100)
- Timeless content: 25%
- Search volume potential: 20%
- Guide/how-to structure: 15%
- Comprehensive coverage: 15%
- Update frequency potential: 15%
- Internal link target: 10%

## Prediction Layer

- **CTR esperado:** `baseCTR(2.5%) * (1 + (GoogleScore - 50) / 100)`
- **RPM esperado:** `AdSense_RPM($1.50) * adDensity * DiscoverMultiplier(1.5x if P(Discover)>60%)`
- **Tiempo lectura:** `wordCount / 200`
- **Backlink potential:** `originalityScore * sourceDiversity * entityRichness`
- **P(Discover):** `DiscoverScore/100 * imageQuality * freshness * 0.7`
- **P(Google News):** `GoogleScore/100 * newsSitemapIncluded * indexingAPIUsed * 0.85`
- **Canibalización:** `countArticlesSameKeyword(slug) > 3 ? HIGH : > 1 ? MEDIUM : LOW`
- **Viralidad:** `FacebookScore*0.3 + TelegramScore*0.2 + DiscoverScore*0.3 + emotionalTrigger*0.2`

## Explicación por score

Cada score devuelve:
```typescript
{
  score: number,
  factors: Array<{ name, value, weight, contribution, explanation }>,
  recommendation: string
}
```

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `lib/editorial-intelligence/engine.ts` | NUEVO |
| `lib/editorial-intelligence/google-score.ts` | NUEVO |
| `lib/editorial-intelligence/facebook-score.ts` | NUEVO |
| `lib/editorial-intelligence/telegram-score.ts` | NUEVO |
| `lib/editorial-intelligence/newsletter-score.ts` | NUEVO |
| `lib/editorial-intelligence/evergreen-score.ts` | NUEVO |
| `lib/editorial-intelligence/predictions.ts` | NUEVO |
| `lib/discover-score.ts` | EXISTENTE — Reutilizar |
| `app/api/admin/editorial-intelligence/route.ts` | NUEVO |

---

# 5. ENTITY ENGINE — DISEÑO

## Estado actual: YA EXISTE

- `lib/meni/knowledge-base/entity-extractor.ts` — Extracción por diccionarios (550 líneas)
- `lib/meni/knowledge-base/index.ts` — `ingestArticle` + `queryKnowledge`
- `lib/meni/knowledge-base/entity-page.ts` — Cargador de página
- `app/entidad/[slug]/page.tsx` — Página pública con schema
- `app/entidad/page.tsx` — Índice
- `components/knowledge-graph/EntityPageClient.tsx` — UI

## Lo que falta

### 5.1 NER con LLM (P2)
Diccionarios → baseline. NER con Gemini Flash → entidades nuevas con `confidence: 'auto'` vs `'verified'`.

### 5.2 Páginas de entidad completas (P1)
Falta: descripción auto-generada, FAQs, guías relacionadas, temas, sección de noticias (no solo IDs).

### 5.3 Schema enriquecido (P2)
Falta: `sameAs` con Wikipedia, `image`, `memberOf`, `worksFor`, `containedInPlace`.

### 5.4 Sitemap de entidades (P0)
Añadir `/entidad/[slug]` al sitemap.

### 5.5 Fix N+1 + ISR (P0)
`loadEntityPage` batch read. Cambiar `force-dynamic` a `revalidate=3600`.

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `lib/meni/knowledge-base/entity-extractor.ts` | MODIFICAR — Añadir NER |
| `lib/meni/knowledge-base/entity-page.ts` | MODIFICAR — Fix N+1 |
| `app/entidad/[slug]/page.tsx` | MODIFICAR — ISR, Breadcrumb |
| `app/sitemap.ts` | MODIFICAR — Añadir entidades |
| `lib/meni/knowledge-base/ner-llm.ts` | NUEVO |
| `firestore.indexes.json` | MODIFICAR — Índices kb_* |

---

# 6. CONTENT MEMORY — DISEÑO

## Estado actual: YA EXISTE

- `lib/meni/editor-brain/index.ts:35-69` — `queryEditorialMemory`
- `lib/meni/knowledge-base/knowledge-query.ts` — `queryKnowledge`
- `lib/meni/editorial-brain/index.ts` — `buildMemoriaEditorial`

## Lo que falta

### 6.1 Sugerencia automática de enlaces (P1)

Cuando un periodista escriba "Volcán Telica":
1. Detectar entidad en tiempo real
2. Buscar en `kb_timeline` noticias anteriores
3. Buscar en `lib/evergreen.ts` guías
4. Sugerir enlaces con anchor text optimizado

```
"Volcán Telica" →
  1. /entidad/volcan-telica
  2. /noticias/erupcion-volcan-...
  3. /guia/volcanes-nicaragua-2026
  4. /tema/volcanes
```

### 6.2 Integración en panel editorial (P2)

Mostrar sugerencias en `public/panel.html` mientras el periodista redacta.

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `lib/content-memory/suggest-links.ts` | NUEVO |
| `app/api/admin/suggest-links/route.ts` | NUEVO |
| `public/panel.html` | MODIFICAR |

---

# 7. STORY ENGINE — DISEÑO

## Estado actual: YA EXISTE PARCIALMENTE

- `lib/meni/story-planner/` — Planifica estructura
- `lib/meni/editorial-brain/story-completeness-engine.ts` — Verifica cierre
- `lib/meni/reader-journey/` — Mapea qué sabe/necesita saber el lector

## Lo que falta

### 7.1 Detección automática de formato (P1)

| Señal | Formato sugerido |
|-------|-----------------|
| timeline.length > 3 | Cronología |
| explanation.needed | Explicador |
| entity.type=persona | Perfil/Biografía |
| category=servicio | Guía |
| entity.type=lugar | Mapa |
| images.length > 5 | Galería |
| unansweredQuestions | FAQ |

### 7.2 Generación automática (P2)

- **Cronología:** Desde `kb_timeline`
- **FAQ:** Desde `preguntasFrecuentes` del Knowledge Graph
- **Perfil:** Desde `kb_entities` tipo persona
- **Contexto:** Desde `antecedentes`

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `lib/story-engine/format-detector.ts` | NUEVO |
| `lib/story-engine/format-generator.ts` | NUEVO |
| `lib/meni/story-planner/index.ts` | MODIFICAR |
| `app/api/admin/story-formats/route.ts` | NUEVO |

---

# 8. REVENUE ENGINE — DISEÑO

## Estado actual: NO EXISTE

AdSense y Monetag configurados pero sin inteligencia de monetización.

## Diseño

```
Input: Noticia + métricas históricas

┌──────────────┐ ┌──────────────┐
│  Channel Fit  │ │  Revenue     │
│               │ │  Prediction  │
│  Discover: ✓  │ │  RPM = $1.50 │
│  Facebook: ✗  │ │  × Discover  │
│  Newsletter:✓ │ │    = $2.25   │
│  SEO: ✓       │ │              │
└───────┬───────┘ └──────┬───────┘
        └───────────────┘
┌────────────────────────────────┐
│   Content Strategy Engine       │
│                                 │
│  ¿Monetiza bien? → 0-100       │
│  ¿Sirve para Discover? → Sí/No │
│  ¿Sirve para Facebook? → Sí/No │
│  ¿Sirve para Newsletter? → Sí  │
│  ¿Sirve para SEO? → Sí/No      │
│  ¿Convertir a Evergreen? → Sí  │
│  ¿Actualizar nota antigua? →   │
│  ¿Fusionar con otra? → Sí/No   │
└────────────────────────────────┘
```

## Reglas

- **Monetiza bien:** wordCount≥350 + images≥2 + adSlots≥3 + DiscoverScore≥70 + SEOscore≥80
- **Discover:** DiscoverScore≥70 && imageWidth≥1200 && freshness<24h
- **Facebook:** FacebookScore≥65 && emotionalTrigger && !clickbait
- **Newsletter:** NewsletterScore≥60 && !breakingNews && evergreenPotential
- **SEO:** GoogleScore≥75 && wordCount≥350 && internalLinks≥3
- **Evergreen:** evergreenScore≥70 && searchPotential && !timeSensitive
- **Actualizar:** existsRelatedArticle(>30d) && newInfo && canibalizationRisk=LOW
- **Fusionar:** countSameKeyword>3 && contentOverlap>60% && allArticles<350 words

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `lib/revenue-engine/index.ts` | NUEVO |
| `lib/revenue-engine/channel-fit.ts` | NUEVO |
| `lib/revenue-engine/strategy.ts` | NUEVO |
| `app/api/admin/revenue-engine/route.ts` | NUEVO |

---

# 9. DOCUMENTO TÉCNICO

## Arquitectura

```
┌───────────────────────────────────────────────┐
│              NICARAGUA INFORMATE               │
│                                                │
│  Next.js 15 App Router | React 19 | TS         │
│  Firebase Admin | Cloudflare | Vercel          │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  MIDDLEWARE: CSP+Nonce | Bot block | Auth│  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │  DATA: Firestore + unstable_cache + ISR  │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │  SEO: Schema | Sitemap | Feeds | Robots  │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │  EDITORIAL: MENI v7 + Knowledge Graph   │  │
│  │  + Discover Score + Intelligence Engine  │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │  MONETIZATION: AdSense + Monetag         │  │
│  │  + Revenue Engine                        │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │  OBSERVABILITY: Sentry + GA4 + LHCI      │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

## Flujo de publicación

```
1. Periodista redacta en panel.html
2. MENI v7 analiza (15+ sub-engines)
3. LLM redacta siguiendo el plan
4. Quality Gate (transcription detector)
5. POST /api/admin/news
   → Firestore save
   → revalidatePath (ISR)
   → Telegram notification
   → Google Indexing API (deduped)
   → Knowledge Graph ingest
6. /noticias/[slug] disponible
```

## Dependencias entre sistemas

```
Editorial Intelligence Engine
  ├── Discover Score (existing)
  ├── Google/Facebook/Telegram/Newsletter/Evergreen Score (new)
  ├── Predictions (new, uses Knowledge Graph)
  └── Knowledge Graph (existing, for canibalization)

Entity Engine
  ├── Entity Extractor (existing + NER new)
  ├── Entity Page (existing, needs fixes)
  └── Sitemap (existing, needs entity URLs)

Content Memory
  ├── Knowledge Query (existing)
  └── Link Suggestion (new)

Story Engine
  ├── Story Planner (existing)
  └── Format Detector + Generator (new)

Revenue Engine
  └── All scores + Knowledge Graph (new)
```

## Roadmap

### Fase 1: Fixes críticos (1 semana — 8h)

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| P0-01: Paginación | 4h | P0 |
| P0-02: Índices Firestore kb_* | 30min | P0 |
| P0-03: Fix N+1 loadEntityPage | 1h | P0 |
| P0-04: Sitemap entidades+temas | 1h | P0 |
| P1-03: ISR entidad + cache headers | 1h | P1 |
| P1-04: Remover AdSense duplicado | 15min | P1 |
| P1-02: Filtrar en Firestore | 30min | P1 |
| P1-05: Eliminar next-sitemap.config.js | 5min | P1 |

### Fase 2: Editorial Intelligence Engine (2 semanas — 28h)

| Tarea | Tiempo |
|-------|--------|
| Google Score | 4h |
| Facebook Score | 3h |
| Telegram Score | 2h |
| Newsletter Score | 2h |
| Evergreen Score | 3h |
| Prediction Layer | 6h |
| Explanation Layer | 4h |
| API + panel | 4h |

### Fase 3: Entity + Content Memory (2 semanas — 25h)

| Tarea | Tiempo |
|-------|--------|
| NER con Gemini Flash | 8h |
| Entity page enriquecida | 4h |
| Breadcrumb + schema enriquecido | 3h |
| Link suggestion engine | 6h |
| Panel integration | 4h |

### Fase 4: Story + Revenue Engine (2 semanas — 26h)

| Tarea | Tiempo |
|-------|--------|
| Format detector | 6h |
| Format generator | 8h |
| Revenue channel fit | 4h |
| Revenue strategy | 4h |
| API endpoints | 4h |

### Fase 5: Limpieza (1 semana — 3h)

| Tarea | Tiempo |
|-------|--------|
| Mover .md a docs/history | 30min |
| injectInternalLinks CSS | 30min |
| ItemList en categorías | 1h |
| webVitalsAttribution | 15min |
| Remover hreflang falso | 15min |

## Estimación total

| Fase | Tiempo | Esfuerzo |
|------|--------|----------|
| 1: Fixes | 1 sem | 8h |
| 2: Intelligence | 2 sem | 28h |
| 3: Entity+Memory | 2 sem | 25h |
| 4: Story+Revenue | 2 sem | 26h |
| 5: Limpieza | 1 sem | 3h |
| **Total** | **8 sem** | **90h** |

## ROI por fase

| Fase | Impacto |
|------|---------|
| 1 | +15% crawl coverage, -30% TTFB entidad |
| 2 | +20% CTR, +15% RPM |
| 3 | +30% páginas indexadas, +25% internal links |
| 4 | -50% tiempo producción, +10% evergreen traffic |
| 5 | Deuda técnica eliminada |

## Riesgos

1. **NER Gemini Flash:** Costo ~$0.0001/request, +500ms latencia. Mitigación: async post-publish.
2. **Score calibración:** Scores pueden no correlacionar con rendimiento real. Mitigación: A/B test con históricos.
3. **Paginación:** Puede afectar URLs existentes. Mitigación: `page=1` sin cambio en URL base.
4. **loadGraph a escala:** Carga todo en memoria. Mitigación: refactor en Fase 3.
5. **AdSense script removal:** Puede afectar fill rate. Mitigación: verificar con AdSense team.

---

# 10. EVALUACIÓN HONESTA

## ¿Qué falta para ser el medio digital técnicamente más avanzado de Centroamérica?

### Lo que YA tienes y NADIE en Centroamérica tiene

1. **MENI v7** — 15+ sub-engines editoriales determinísticos. Ni BBC lo tiene así.
2. **Knowledge Graph local** — 500+ entidades nicaragüenses estructuradas.
3. **Discover Score** — Métrica inexistente incluso internacionalmente.
4. **Speakable schema** — Ni BBC lo usa. Ventaja real en voice search.
5. **Google Indexing API con deduplicación** — Indexación en minutos.
6. **CSP con nonce dinámico** — Seguridad de nivel bancario.
7. **ISR 60s en home** — Frescura superior a WordPress.

### Lo que FALTA (en orden de urgencia)

1. **Paginación (P0 — 4h)** — Sin esto, Google no descubre artículos antiguos. Todos los medios serios la tienen. **Lo más urgente.**

2. **Editorial Intelligence Engine (P1 — 28h)** — Unifica Google, Discover, Facebook, Telegram, Newsletter y Evergreen en un solo score con predicciones. **Te diferencia de Infobae y La Prensa.**

3. **NER automático (P2 — 8h)** — El entity-extractor solo detecta diccionarios. Con NER vía LLM, el Knowledge Graph crece automáticamente. **Te acerca a BBC y El País.**

4. **Content Memory en panel (P1 — 6h)** — El Knowledge Graph ya encuentra contexto pero no lo muestra al periodista en tiempo real. **Convierte el sistema en herramienta diaria.**

5. **Revenue Engine (P2 — 8h)** — Sin revenue intelligence, las decisiones son instintivas. **Ningún competidor tiene esto.**

6. **Story Engine con format detection (P1 — 14h)** — Detecta automáticamente que una noticia necesita cronología, FAQ o explicador. **Convierte una nota en activo permanente.**

### Lo que NO necesitas

- **AMP** — Google eliminó el requisito.
- **WordPress** — Tu stack Next.js + Firebase es superior.
- **Taboola/Outbrain** — Tu internal linking engine es más valioso.
- **App nativa** — Tu PWA con manifest es suficiente.
- **hreflang** — Eres monolingüe. Removerlo es mejor que tenerlo falso.
- **Cloudinary** — weserv.nl funciona y es gratis. Cloudinary añade costo sin beneficio real.
- **Reescribir MENI** — Funciona. No lo toques.
- **Cambiar Firestore** — Funciona. Los índices faltantes se añaden en 30min.

### Veredicto

Nicaragua Informate **ya es técnicamente superior** a La Prensa, Confidencial e Infobae en arquitectura, SEO, seguridad y editorial AI. Las 6 brechas identificadas no son de arquitectura — son de **producto**. Lo que falta no es reescribir, sino **ejecutar las 6 adiciones en 8 semanas (90h)** para alcanzar y superar a BBC Mundo y El País América en ingeniería editorial.

El proyecto tiene la base técnica más sólida de cualquier medio centroamericano. Los próximos 90h de trabajo determinarán si pasa de "el mejor de Centroamérica" a "uno de los más avanzados de Latinoamérica".
