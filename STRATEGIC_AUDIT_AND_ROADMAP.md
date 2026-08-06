# AUDITORÍA ESTRATÉGICA COMPLETA + DISEÑO DE ARQUITECTURA
## Nicaragua Informate — De Producción Certificada a Medio Digital de Referencia Nacional

**Fecha:** 4 agosto 2026  
**Auditor:** Staff Software Engineer / Technical SEO Engineer / News SEO Specialist / UX Researcher / Product Architect  
**Estado base:** ✅ Production Certified (tsc 0 errores, 146/146 tests, build exit 0)

---

# FASE 1 — AUDITORÍA COMPLETA

## 1.1 Arquitectura

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| ARQ-01 | P1 | `getRelatedNews` hace `getNews(30)` y filtra en memoria por categoría en lugar de query Firestore directo | Código legacy pre-optimización | O(n) por cada artículo visitado; 30 docs leídas para mostrar 3-6 relacionadas | Query Firestore con `where('categoria','==',cat)` + `where('estado','==','publicado')` + `limit(6)` | Bajo — ya existe índice de categoría | 2h |
| ARQ-02 | P2 | `getAllSlugs` usa `.select('slug')` pero Firestore Admin SDK no soporta `select()` en la misma forma que el client SDK | Malentendido de la API Admin SDK | Tráe documentos completos innecesariamente | Usar `collection.listDocuments()` o mantener query pero eliminar `.select()` | Bajo | 1h |
| ARQ-03 | P2 | 105 rutas API en `app/api/` — posible sobreingeniería o rutas muertas | Crecimiento orgánico del proyecto | Bundle size, mantenimiento, superficie de ataque | Auditar rutas con tráfico real (analytics) y archivar las que no se usan | Medio — puede romper integraciones | 4h |
| ARQ-04 | P3 | `lib/evergreen.ts` es 102KB con contenido hardcoded | Decisión de diseño inicial (guías como strings) | Bundle size, difícil de mantener | Migrar guías a Firestore colección `guias` o MDX | Bajo | 8h |

## 1.2 TypeScript

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| TS-01 | P2 | `(noticia as any).necesitaRevision` y `(noticia as any).fechaActualizacion` en `ArticlePage.tsx` | Campos existen en Firestore pero no en interface `Noticia` | Type safety perdido, bugs potenciales | Añadir `necesitaRevision?: boolean` y `fechaActualizacion?: string` ya existe en interface | Bajo | 0.5h |
| TS-02 | P3 | `window as any` en `Analytics.tsx` línea 19 | GA4 no tipa `window.gtag` | Sin impacto funcional | Declarar `declare global { interface Window { gtag: (...args: unknown[]) => void } }` | Bajo | 0.5h |

## 1.3 Performance

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| PERF-01 | P1 | `getNews(100)` en `app/page.tsx` y `getNews(500)` en sitemap sin paginación | Carga todas las noticias en cada render ISR | TTFB alto en home, consumo de Firestore elevado | Implementar paginación con cursor Firestore | Medio — requiere refactor de homepage | 6h |
| PERF-02 | P1 | Home ISR 60s + 3 queries Firestore simultáneas (`getLatestNews(40)`, `getTrendingNews(20)`, `getPopularNews(20)`) | Diseño para frescura | 3 reads Firestore por cada regeneración ISR (1440/día × 3 = 4320 reads/día solo de home) | Consolidar en 1 query con `orderBy('fecha','desc').limit(40)` y derivar trending/popular de cache | Medio | 4h |
| PERF-03 | P2 | `pro-design.css` es 167KB inline | CSS acumulado durante rediseño | CLS, parse time CSS | Auditar y eliminar reglas no usadas con PurgeCSS | Bajo | 4h |
| PERF-04 | P2 | `articulo.css` es 15KB inline | CSS específico de artículo | Parse time en cada página | Code-split con CSS modules | Bajo | 2h |
| PERF-05 | P2 | `ArticlePage.tsx` es client component de 529 líneas | Todo el artículo se renderiza en cliente | Hidratación costosa, INP alto | Mover parte estática (breadcrumb, meta, contenido HTML) a server component y solo interactividad a client | Alto — refactor significativo | 12h |
| PERF-06 | P3 | `optimizePackageImports` no incluye `@firebase/firestore` | Overlook | Bundle size | Añadir a array en `next.config.ts` | Bajo | 0.5h |

## 1.4 SEO Técnico

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| SEO-01 | P0 | No hay `hreflang` tags | Sitio monolingüe pero Google necesita `x-default` | Google puede mostrar versión incorrecta en resultados internacionales | Añadir `alternates.languages` en metadata de layout | Bajo | 1h |
| SEO-02 | P1 | Sitemap incluye 500 URLs sin paginación (límite Google: 50K por sitemap, pero >1000 URLs causa lentitud) | `getNews(500)` sin límite | Sitemap grande = crawl budget desperdiciado | Paginar sitemap en `/sitemap-1.xml`, `/sitemap-2.xml` con `sitemaps()` de Next.js | Bajo | 3h |
| SEO-03 | P1 | `getRelatedNews` solo relaciona por categoría, no por entidades/tags/temas | Implementación básica | Enlaces internos débiles para Google News y Discover | Implementar motor de enlaces por entidades (ver FASE 4) | Medio | 8h |
| SEO-04 | P1 | No hay `last-modified` header en páginas de artículo | ISR no expone `last-modified` | Google no sabe cuándo se actualizó una página sin visitarla | Añadir `headers()` en `next.config.ts` para `/noticias/*` con `Last-Modified` | Bajo | 2h |
| SEO-05 | P2 | Tags en ArticlePage usan `/buscar?q=${tag}` con `rel="nofollow"` | Diseño para evitar indexación de búsquedas | Enlaces internos wasted — podrían apuntar a categorías o entidades | Cambiar a `/categoria/${slug}` o crear páginas de tag indexables | Bajo | 2h |
| SEO-06 | P2 | `news-sitemap.xml` no incluye `<news:genres>` tag | Especificación Google News lo recomienda | Menor impacto en indexación News | Añadir `<news:genres>PressRelease, Blog</news:genres>` según corresponda | Bajo | 0.5h |
| SEO-07 | P2 | No hay `canonical` en páginas de categoría | Solo home y artículo tienen canonical | Posible contenido duplicado entre `/categoria/sucesos` y `/sucesos` (redirect existe pero canonical refuerza) | Añadir `alternates.canonical` en `categoria/[slug]/page.tsx` | Bajo | 1h |
| SEO-08 | P3 | `og:image` dimensions no especificadas en algunos artículos | Meta dinámica incompleta | Social cards sin dimensiones = render inconsistente | Añadir `width: 1200, height: 630` en OG image de article metadata | Bajo | 1h |

## 1.5 SEO Editorial

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| EDSEO-01 | P1 | Meta descriptions generadas con templates genéricos (`"${titulo}. El avance tecnológico..."`) | `lib/seo/meta.ts` usa templates por categoría | CTR bajo en SERPs — descripciones no específicas | Extraer primera oración del resumen como meta description; fallback a template solo si no hay resumen | Bajo | 3h |
| EDSEO-02 | P1 | Títulos SEO no siempre incluyen nombre del medio | `generateOptimizedTitle` no añade marca | Brand awareness perdido en SERPs | Añadir " — Nicaragua Informate" solo si título < 45 chars | Bajo | 1h |
| EDSEO-03 | P2 | `keywords` meta tag es ignorado por Google pero se genera | Legacy SEO | Sin impacto negativo pero desperdicia bytes | Eliminar `keywords` de metadata output | Bajo | 0.5h |
| EDSEO-04 | P2 | No hay "FAQ schema" en artículos que sí tienen secciones de preguntas | `generarFaqSchema` solo busca `¿...?` en texto, no detecta `<h2>FAQ</h2>` o `<h3>Pregunta</h3>` | Rich snippets perdidos | Mejorar detección de FAQ con patrones HTML estructurados | Bajo | 2h |

## 1.6 Google News

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| GN-01 | P0 | No hay registro en Google News Publisher Center | Falta de configuración | Artículos no aparecen en Google News carousel | Verificar dominio en Publisher Center, enviar sitemap news, configurar secciones | Bajo | 1h |
| GN-02 | P1 | `news-sitemap.xml` no incluye `<news:publication_date>` con timezone | Especificación requiere ISO 8601 con timezone | Google News puede rechazar entradas | Añadir timezone `-06:00` a fechas en sitemap | Bajo | 1h |
| GN-03 | P1 | No hay `<news:publication>` con `name` y `language` | Especificación Google News | Menor impacto pero recomendado | Añadir `<news:publication><news:name>Nicaragua Informate</news:name><news:language>es</news:language></news:publication>` | Bajo | 0.5h |
| GN-04 | P2 | Artículos sin `datePublished` ISO 8601 en JSON-LD — usan `safeIsoDate` que puede devolver fecha actual | `safeIsoDate` fallback a `new Date()` | Google News puede mostrar fecha incorrecta | Si no hay fecha válida, no publicar JSON-LD en lugar de usar fecha actual | Bajo | 1h |

## 1.7 Google Discover

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| DISC-01 | P1 | Imágenes OG no siempre son 1200×630 | Artículos usan imagen original sin dimensions | Discover requiere imágenes grandes ≥1200px | Asegurar que `og:image` sea siempre 1200×630 via `getHeroImageUrl(imagen, 1200)` | Bajo | 2h |
| DISC-02 | P1 | No hay datos estructurados `ImageObject` para imagen destacada en algunas páginas | Solo `NewsArticle` schema incluye imágenes | Discover usa `image` field de schema | Verificar que todos los artículos tengan `image` en JSON-LD con dimensions correctas | Bajo | 1h |
| DISC-03 | P2 | Títulos > 60 caracteres no se truncan para Discover | Discover tiene límite diferente a Search | Truncamiento en Discover puede cortar título mal | Optimizar títulos a 50-60 chars para ambos | Bajo | Ya implementado |
| DISC-04 | P2 | No hay `max-image-preview:large` robots directive | Falta en `robots.ts` | Discover no puede usar imágenes grandes | Añadir `max-image-preview:large` a robots meta | Bajo | 0.5h |

## 1.8 Core Web Vitals

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| CWV-01 | P1 | `ArticlePage.tsx` es client component — todo el HTML se hidrata en cliente | Diseño original | LCP retardado, INP alto, CLS por hidratación | Convertir a server component con islands de interactividad | Alto — refactor mayor | 16h |
| CWV-02 | P1 | 3 AdSense units lazy-loaded pero sin placeholder dimensionado | Ads cargan asíncrono | CLS cuando ads se renderizan | Reservar espacio con `min-height` en contenedor ad | Bajo | 1h |
| CWV-03 | P2 | `pro-design.css` 167KB + `articulo.css` 15KB + `home-redesign.css` 13KB = 195KB CSS | Acumulación de CSS | Parse blocking, LCP afectado | PurgeCSS + critical CSS inline | Bajo | 4h |
| CWV-04 | P2 | Fonts `preload: false` para Spectral y IBM Plex Mono | Configuración para evitar prioridad | FOUT/FOIT en fonts secundarias | `preload: true` para Spectral (usado en titulares) | Bajo | 0.5h |
| CWV-05 | P3 | `defer` no usado en scripts de terceros (Monetag) | Script inline con `dangerouslySetInnerHTML` | Ejecución bloquea parsing | Usar `strategy="lazyOnload"` de Next.js Script | Bajo | 0.5h |

## 1.9 UX

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| UX-01 | P1 | No hay "relacionados" al final del artículo en server-side — solo se inyectan via `injectInternalLinks` que requiere `related_links` | `related_links` viene de Firestore pero muchas noticias no lo tienen | Usuarios no tienen continuación natural | Generar relacionados automáticamente en server side (ver FASE 4) | Medio | 6h |
| UX-02 | P2 | Búsqueda `/buscar` no tiene autocomplete ni sugerencias | Implementación básica | Baja retención, users abandonan | Implementar autocomplete con entidades y categorías | Medio | 4h |
| UX-03 | P2 | No hay "tiempo de lectura" en cards de home | Solo en artículo | Users no saben cuánto leerán antes de clic | Añadir `tiempoLectura` en `NewsCard` | Bajo | 1h |
| UX-04 | P2 | Newsletter signup no confirma éxito/fracaso visualmente | Componente básico | Users no saben si se suscribieron | Añadir estado de feedback | Bajo | 1h |
| UX-05 | P3 | No hay modo oscuro persistente (ThemeScript existe pero no hay toggle visible) | Implementación parcial | Users no pueden cambiar tema | Añadir toggle en Header | Bajo | 2h |

## 1.10 Accesibilidad

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| A11Y-01 | P1 | Imágenes en ArticlePage usan `<img>` nativo en algunos casos (línea 224) | Optimización de performance | Screen readers no reciben alt consistente | Usar `next/image` con `alt` siempre | Bajo | 2h |
| A11Y-02 | P2 | Botones de fuente A+/A- no tienen `aria-pressed` | Falta de atributo ARIA | Screen readers no informan estado | Añadir `aria-pressed={fontIndex === 1}` | Bajo | 0.5h |
| A11Y-03 | P2 | Skip link existe pero no es visible al focus por defecto | CSS puede ocultarlo | Users de teclado no pueden saltar contenido | Asegurar `:focus` visible con `clip-path: none` | Bajo | 0.5h |
| A11Y-04 | P3 | Contraste de colores no auditado con axe | Diseño visual sin auditoría A11Y | Posible fallo WCAG AA | Ejecutar axe DevTools y corregir | Bajo | 2h |

## 1.11 Monetización

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| MON-01 | P1 | AdSense sin `data-ad-layout` para in-article ads | Configuración básica | RPM subóptimo | Usar `data-ad-layout="in-article"` con formato fluid | Bajo | 0.5h |
| MON-02 | P1 | Monetag script no tiene fallback si quge5.com falla | Sin error handling | Revenue perdido si CDN falla | Añadir timeout + fallback a AdSense | Bajo | 1h |
| MON-03 | P2 | No hay ad refresh para usuarios que permanecen >30s | Sin implementación | Revenue perdido en sesiones largas | Implementar ad refresh cada 30s con visibility API | Medio — puede violar AdSense ToS | 3h |
| MON-04 | P2 | `AdsenseUnit` lazy-loaded con `Suspense` pero sin `IntersectionObserver` real | Usa lazy import pero no IO | Ads se cargan inmediatamente después de hidratación | Implementar IO real para cargar ads solo cuando son visibles | Bajo | 2h |
| MON-05 | P3 | No hay tracking de revenue por artículo | Sin integración AdSense API | No se sabe qué artículos generan más revenue | Conectar AdSense Management API + GA4 para RPM por página | Medio | 6h |

## 1.12 Seguridad

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| SEC-01 | P2 | `dangerouslySetInnerHTML` en Monetag script sin nonce | Script inline de terceros | CSP bypass potencial | Mover a `StrategyScript` con `strategy="afterInteractive"` | Bajo | 1h |
| SEC-02 | P2 | `app/api/estado/route.ts` expone env vars sin auth | Diseño para debugging | Información sensible expuesta | Añadir `verifyAdminToken` o eliminar ruta | Bajo | 0.5h |
| SEC-03 | P3 | Rate limiting existe (`lib/rate-limit.ts`) pero no se aplica a todas las rutas API | Implementación parcial | Abuso de endpoints no protegidos | Aplicar rate limit middleware a todas las rutas | Bajo | 2h |

## 1.13 Observabilidad

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| OBS-01 | P0 | No hay error tracking (Sentry/Vercel Analytics) | Sin configurar | Errores 500 invisibles en producción | Integrar Sentry con Next.js | Bajo | 2h |
| OBS-02 | P1 | No hay Web Vitals reporting | Sin configurar | No se conoce LCP/CLS/INP real | Integrar `next/web-vitals` con GA4 o Vercel Analytics | Bajo | 1h |
| OBS-03 | P1 | No hay logging estructurado en API routes | `logger.ts` existe pero no se usa en todas las rutas | Debugging difícil en producción | Usar `logger` en todas las API routes con contexto | Bajo | 3h |
| OBS-04 | P2 | No hay alerting de Firestore quota | Sin configurar | Costos inesperados | Configurar Firebase alerts para quota 80% | Bajo | 1h |
| OBS-05 | P2 | No hay monitoring de 404s | Sin configurar | Enlaces rotos no detectados | Middleware logging de 404s + dashboard | Bajo | 2h |

## 1.14 Escalabilidad

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| ESC-01 | P1 | `getNews(N)` trae todos los documentos sin cursor pagination | Diseño simple inicial | No escala más allá de ~500 noticias | Implementar cursor-based pagination con `startAfter()` | Medio | 4h |
| ESC-02 | P2 | `unstable_cache` con tags pero sin `revalidateTag()` llamado en writes | Falta de integración | Cache stale después de actualizaciones | Llamar `revalidateTag('noticias')` en API de actualización | Bajo | 2h |
| ESC-03 | P2 | Firestore indexes solo para categoría y vistas — faltan para `fecha` + `categoria` compound | Índices mínimos | Queries lentas al crecer | Añadir índices compuestos en `firestore.indexes.json` | Bajo | 1h |

## 1.15 Código Muerto / Duplicación / Complejidad

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| DEAD-01 | P2 | 80+ archivos `.md` en raíz del proyecto | Reportes históricos | Repo bloat, confusión | Mover a `docs/archive/` | Bajo | 1h |
| DEAD-02 | P2 | Scripts sueltos en raíz (`aplicar-analizador-firestore.ts`, `auditar-nota.ts`, etc.) | Herramientas one-off | Confusión, mantenimiento | Mover a `scripts/` | Bajo | 0.5h |
| DEAD-03 | P3 | `appx/` directorio con 2 items | Posible experimento abandonado | Confusión | Auditar y eliminar | Bajo | 0.5h |
| DEAD-04 | P3 | `PropellerAds.tsx` y `TaboolaAds.tsx` componentes existen pero no se usan | Experimentos de monetización abandonados | Bundle size, confusión | Eliminar | Bajo | 0.5h |

## 1.16 Firestore

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| FS-01 | P1 | `getRelatedNews` lee 30 docs para filtrar 3-6 | Sin optimización | 30 reads por página de artículo | Query directa con `where` + `limit` | Bajo | 2h |
| FS-02 | P2 | `kb_entities` carga entidades relacionadas con N+1 queries | `loadEntityPage` hace 1 query por entidad relacionada | N reads extra por página de entidad | Batch get con `getAll()` | Bajo | 1h |
| FS-03 | P2 | `editor_corrections` query sin índice compuesto `fecha desc` | Falta de índice | Query lenta | Añadir índice en `firestore.indexes.json` | Bajo | 0.5h |
| FS-04 | P3 | No hay soft delete — `estado: 'archivado'` sigue en queries | Diseño sin trash | Storage cost | Excluir `archivado` en todas las queries o mover a subcolección | Medio | 3h |

## 1.17 ISR / Caching

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| ISR-01 | P1 | ISR revalidate de 60s en home pero sin `revalidateTag` en writes | Falta de integración | Home puede estar stale hasta 60s después de publicar | Llamar `revalidateTag('noticias')` en API de creación | Bajo | 1h |
| ISR-02 | P2 | `unstable_cache` tags no documentados | Sin documentación | Difícil saber qué cache invalidar | Documentar tags en `lib/cache-tags.ts` | Bajo | 0.5h |
| ISR-03 | P2 | No hay cache para `getRelatedNews` | Sin implementación | Query Firestore en cada visita a artículo | Envolver en `unstable_cache` con tag `related-${slug}` | Bajo | 1h |

## 1.18 Metadata / Schema.org

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| SCH-01 | P1 | No hay `Person` schema para autores en páginas de artículo (solo en `/autor/[slug]`) | Schema solo en página de autor | Google no vincula autor con artículo | Añadir `Person` schema referenciado desde `NewsArticle.author` | Bajo | Ya implementado en `buildNewsArticleJsonLdEnhanced` |
| SCH-02 | P2 | `BreadcrumbList` schema existe pero no se renderiza como JSON-LD en ArticlePage (solo en `page.tsx` server) | Renderizado en server pero no en client | Google puede no verlo si depende de CSR | Verificar que se inyecta en server-side render | Bajo | 1h |
| SCH-03 | P2 | No hay `CollectionPage` schema para páginas de categoría | Sin implementación | Google no entiende la estructura de categorías | Añadir `CollectionPage` JSON-LD en `categoria/[slug]/page.tsx` | Bajo | 2h |
| SCH-04 | P3 | `WebSite` schema no tiene `publisher` con `logo` completo | Falta de detalle | Rich snippets incompletos | Añadir `publisher` con `ImageObject` logo | Bajo | 0.5h |

## 1.19 Internal Linking

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| IL-01 | P0 | `related_links` viene de Firestore pero la mayoría de noticias no lo tienen | Sin generación automática | Enlaces internos prácticamente inexistentes | Generar `related_links` automáticamente en server (ver FASE 4) | Medio | 8h |
| IL-02 | P1 | `injectInternalLinks` inserta un bloque estático — no enlaza dentro del contenido | Diseño de bloque separado | Enlaces contextuales perdidos | Inyectar enlaces dentro del texto del artículo (entity linking) | Medio | 6h |
| IL-03 | P1 | No hay enlaces a guías evergreen desde noticias relacionadas | Sin integración | Guías no reciben tráfico de noticias | Detectar temas evergreen en noticias y enlazar a guías | Bajo | 3h |

## 1.20 Feeds (RSS / JSON)

| ID | Severidad | Descripción | Por qué existe | Impacto | Cómo resolver | Riesgo | Esfuerzo |
|---|---|---|---|---|---|---|---|
| FEED-01 | P2 | RSS feed no incluye `<media:content>` para imágenes | Sin implementación | Agregadores no muestran imágenes | Añadir namespace media y `<media:content url="..."/>` | Bajo | 2h |
| FEED-02 | P2 | JSON Feed no incluye `image` field | Sin implementación | Lectores modernos no muestran imagen | Añadir `image` en items de JSON Feed | Bajo | 1h |
| FEED-03 | P3 | RSS feed no tiene `<content:encoded>` con HTML completo | Sin implementación | Lectores muestran solo resumen | Añadir `content:encoded` con HTML sanitizado | Bajo | 1h |

---

# FASE 2 — SISTEMA EEAT COMPLETO

## 2.1 Estado actual

**Ya implementado:**
- ✅ `Organization` schema completo en `lib/seo/schema.ts` con `NewsMediaOrganization`
- ✅ `Person` schema para autores en `/autor/[slug]/page.tsx`
- ✅ Páginas: `/nosotros`, `/contacto`, `/politica-editorial`, `/correcciones`, `/metodologia-editorial`
- ✅ `NewsArticle` schema con `author`, `editor`, `publisher`, `speakable`
- ✅ `BreadcrumbList` schema
- ✅ `WebSite` schema con `SearchAction`
- ✅ `FAQPage` schema dinámico
- ✅ `Author` interface con bio, experiencia, cobertura temática, redes sociales
- ✅ `AuthorCard` component en ArticlePage
- ✅ `Correcciones` con Firestore `editor_corrections` y página pública
- ✅ Fuentes declaradas (`fuente`, `fuentesComplementarias`) en ArticlePage

**Faltante:**
- ❌ `Person` schema no se renderiza en ArticlePage (solo referenciado por `@id` en NewsArticle)
- ❌ No hay `AboutPage` schema en `/nosotros` (tiene `@graph` pero incompleto)
- ❌ No hay `ContactPage` schema en `/contacto`
- ❌ No hay `WebPage` schema en artículos
- ❌ Autores no tienen `sameAs` con perfiles profesionales (LinkedIn, ORCID)
- ❌ No hay `dateModified` visible en JSON-LD de algunas noticias
- ❌ No hay `factCheck` schema
- ❌ No hay `ClaimReview` schema para verificaciones de hechos

## 2.2 Diseño técnico — Mejoras EEAT

### 2.2.1 Person Schema en ArticlePage

**Objetivo:** Cada artículo debe emitir `Person` schema completo del autor.

**Problema:** `NewsArticle.author` referencia `@id` del autor pero no se emite el `Person` entity completo en la página.

**Diseño:**
```typescript
// En app/noticias/[slug]/page.tsx, añadir:
const authorSchema = knownAuthor ? {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': authorUrl,
  name: authorName,
  jobTitle: knownAuthor.role,
  url: authorUrl,
  image: knownAuthor.photo ? `https://nicaraguainformate.com${knownAuthor.photo}` : undefined,
  description: knownAuthor.bio,
  sameAs: knownAuthor.social ? Object.values(knownAuthor.social).filter(Boolean) : undefined,
  knowsAbout: knownAuthor.coverageAreas,
  worksFor: { '@id': 'https://nicaraguainformate.com/#organization' },
  alumniOf: knownAuthor.experience ? { '@type': 'EducationalOrganization', name: 'Universidad de Texas en Austin' } : undefined,
} : null;
```

**Archivos afectados:** `app/noticias/[slug]/page.tsx`, `lib/seo/schema.ts`  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 2h  
**Beneficio Google:** EEAT autor verificable por artículo  
**Beneficio usuarios:** Transparencia sobre quién escribe  
**Beneficio monetización:** AdSense prefiere sitios con EEAT demostrable

### 2.2.2 FactCheck + ClaimReview Schema

**Objetivo:** Marcar verificaciones de hechos con schema estructurado.

**Diseño:**
```typescript
// Nuevo: lib/seo/factcheck-schema.ts
export function buildFactCheckSchema(
  claim: string,
  rating: 'true' | 'false' | 'mixed' | 'unverified',
  url: string,
): Record<string, unknown> {
  const ratingMap = {
    true: 'https://schema.org/True',
    false: 'https://schema.org/False',
    mixed: 'https://schema.org/MixedClaim',
    unverified: 'https://schema.org/UnverifiedClaim',
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    claimReviewed: claim,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: 'true',
      worstRating: 'false',
      alternateName: ratingMap[rating],
    },
    itemReviewed: {
      '@type': 'CreativeWork',
      author: { '@type': 'Organization', name: 'Fuente original' },
      url,
    },
    author: { '@id': 'https://nicaraguainformate.com/#organization' },
    publisher: { '@id': 'https://nicaraguainformate.com/#organization' },
  };
}
```

**Archivos afectados:** `lib/seo/factcheck-schema.ts` (nuevo), `app/noticias/[slug]/page.tsx`  
**Riesgo:** Bajo — solo se emite si el artículo tiene `factCheck` field  
**Prioridad:** P2  
**Tiempo:** 3h  
**Beneficio Google:** Rich snippets de fact-checking, mayor confianza  
**Beneficio usuarios:** Verificación visible  
**Beneficio monetización:** AdSense prefiere sitios con fact-checking

### 2.2.3 AboutPage + ContactPage Schema

**Objetivo:** Completar schema EEAT en páginas institucionales.

**Archivos afectados:** `app/nosotros/page.tsx`, `app/contacto/page.tsx`  
**Riesgo:** Bajo  
**Prioridad:** P2  
**Tiempo:** 2h  
**Beneficio Google:** EEAT institucional completo

### 2.2.4 Autor con Artículos Publicados + Cobertura Temática

**Objetivo:** Página de autor muestra artículos agrupados por categoría y fecha.

**Diseño:** Modificar `/autor/[slug]/page.tsx` para:
1. Agrupar artículos por categoría
2. Mostrar total por categoría
3. Añadir `CollectionPage` schema
4. Mostrar fecha de última actualización

**Archivos afectados:** `app/autor/[slug]/page.tsx`, `lib/authors.ts`  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 3h

---

# FASE 3 — TOPICAL AUTHORITY

## 3.1 Estado actual

**Ya implementado:**
- ✅ Páginas de entidad (`/entidad/[slug]`) con Knowledge Graph en Firestore
- ✅ `kb_entities`, `kb_timeline`, `kb_relations` colecciones Firestore
- ✅ Páginas de categoría (`/categoria/[slug]`)
- ✅ Guías evergreen (`/guia/[slug]`)

**Faltante:**
- ❌ No hay hub pages temáticas (ej: `/tema/migracion`, `/tema/economia`)
- ❌ Noticias no se asignan automáticamente a temas
- ❌ No hay series editoriales
- ❌ Categorías son genéricas (6) — no hay sub-categorías o temas

## 3.2 Diseño técnico — Topic Clusters

### 3.2.1 Hub Pages Temáticas

**Objetivo:** Crear páginas hub por tema que agrupan noticias, guías, entidades y FAQ.

**Problema:** Las categorías son muy amplias (Sucesos, Nacionales, etc.). Google premia topical authority con clusters específicos.

**Diseño:**
```
/tema/migracion     → Noticias + Guías + Entidades + FAQ sobre migración
/tema/economia      → Noticias + Guías + Entidades + FAQ sobre economía
/tema/volcanes      → Noticias + Entidades (San Cristóbal, Telica, Masaya)
/tema/seguridad     → Noticias + Estadísticas + Entidades
```

**Estructura Firestore:**
```
topics/{slug}:
  name: string
  slug: string
  description: string
  parentCategory: string  // "Nacionales", "Sucesos", etc.
  keywords: string[]
  entityIds: string[]
  guideIds: string[]
  createdAt: timestamp
  updatedAt: timestamp
```

**Archivos afectados:**
- `app/tema/[slug]/page.tsx` (nuevo)
- `lib/topics.ts` (nuevo)
- `firestore.indexes.json` (índice para topics)
- `app/sitemap.ts` (incluir URLs de temas)

**Riesgo:** Medio — requiere migración de datos para asignar temas a noticias  
**Prioridad:** P1  
**Tiempo:** 8h  
**Beneficio Google:** Topical authority, hub-and-spoke model  
**Beneficio usuarios:** Encuentra toda la cobertura de un tema en un solo lugar  
**Beneficio monetización:** Páginas temáticas = CPM más alto por intención

### 3.2.2 Asignación Automática de Temas

**Objetivo:** Cada noticia se asigna automáticamente a 1-3 temas basado en entidades detectadas.

**Diseño:**
```typescript
// lib/topics.ts
export function detectTopics(noticia: Noticia, entities: string[]): string[] {
  const TOPIC_KEYWORDS: Record<string, string[]> = {
    'migracion': ['migración', 'migrante', 'deportación', 'frontera', 'visa', 'pasaporte', 'apostilla'],
    'economia': ['dólar', 'inflación', 'remesas', 'BCN', 'Banco Central', 'presupuesto', 'impuestos'],
    'seguridad': ['homicidio', 'robo', 'asalto', 'policía', 'crimen', 'delito', 'narco'],
    'salud': ['dengue', 'MINSA', 'hospital', 'vacuna', 'epidemia', 'covid'],
    'educacion': ['MINED', 'universidad', 'colegio', 'maestro', 'calendario escolar'],
    'deportes': ['fútbol', 'béisbol', 'selección', 'liga', 'torneo'],
    'tecnologia': ['internet', 'celular', 'IA', 'app', 'redes sociales'],
    'vivienda': ['INVUR', 'vivienda', 'construcción', 'alquiler', 'hipoteca'],
  };
  // Matching por keywords en título + contenido + entidades
}
```

**Archivos afectados:** `lib/topics.ts` (nuevo), API de creación de noticias  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 4h

### 3.2.3 Series Editoriales

**Objetivo:** Agrupar cobertura continua de un evento en desarrollo.

**Diseño:**
```
/serie/crisis-politica-2026    → Timeline + todas las noticias relacionadas
/serie/temporada-deportiva     → Calendario + resultados + análisis
```

**Archivos afectados:** `app/serie/[slug]/page.tsx` (nuevo), `lib/series.ts` (nuevo)  
**Riesgo:** Bajo  
**Prioridad:** P2  
**Tiempo:** 6h

---

# FASE 4 — MOTOR INTELIGENTE DE ENLACES INTERNOS

## 4.1 Estado actual

**Ya implementado:**
- ✅ `injectInternalLinks` en `lib/article-links.ts` — inserta bloque "También te puede interesar"
- ✅ `related_links` field en `Noticia` interface
- ✅ `getRelatedNews` en `lib/data.ts` — relaciona por categoría
- ✅ `enhanceArticleHtml` en `lib/html.ts` — procesa HTML del artículo
- ✅ `kb_entities` con entidades detectadas

**Faltante:**
- ❌ `related_links` vacío en la mayoría de noticias
- ❌ Relación solo por categoría, no por entidades/tags/temas
- ❌ No hay entity linking dentro del contenido (solo bloque separado)
- ❌ No hay enlaces a guías evergreen desde noticias
- ❌ No hay detección de canibalización

## 4.2 Diseño técnico — Motor de Enlaces

### 4.2.1 Generación Automática de Related Links

**Objetivo:** Generar `related_links` automáticamente en server-side para cada artículo.

**Problema:** `getRelatedNews` solo filtra por categoría. Necesita matching por entidades, tags, temas y similitud semántica.

**Diseño:**
```typescript
// lib/internal-linking-engine.ts (nuevo)
import type { Noticia } from '@/lib/types';

export interface LinkSuggestion {
  url: string;
  anchor: string;
  type: 'noticia' | 'guia' | 'entidad' | 'categoria';
  score: number;
  reason: string;
}

export async function generateRelatedLinks(
  noticia: Noticia,
  allNews: Noticia[],
): Promise<RelatedLink[]> {
  const candidates: Array<{ noticia: Noticia; score: number; reason: string }> = [];

  for (const candidate of allNews) {
    if (candidate.slug === noticia.slug) continue;
    let score = 0;
    const reasons: string[] = [];

    // 1. Mismo categoría: +1
    if (candidate.categoria === noticia.categoria) {
      score += 1;
      reasons.push('misma categoría');
    }

    // 2. Tags compartidos: +2 por cada tag
    const sharedTags = (noticia.tags || []).filter(t => candidate.tags?.includes(t));
    score += sharedTags.length * 2;
    if (sharedTags.length > 0) reasons.push(`${sharedTags.length} tags compartidos`);

    // 3. Entidades compartidas (via kb_entities): +3 por cada entidad
    // Requiere consultar kb_timeline para articleId
    // Implementación: batch query

    // 4. Similitud de título (Jaccard tokens): +1-3
    const titleSimilarity = jaccardSimilarity(
      tokenize(noticia.titulo),
      tokenize(candidate.titulo),
    );
    if (titleSimilarity > 0.3) {
      score += Math.round(titleSimilarity * 3);
      reasons.push('títulos similares');
    }

    // 5. Evergreen match: si noticia menciona tema evergreen, +3
    const evergreenMatch = checkEvergreenMatch(noticia, candidate);
    if (evergreenMatch) {
      score += 3;
      reasons.push('tema evergreen relacionado');
    }

    // 6. Recencia: preferir noticias de últimos 30 días
    const ageDays = (Date.now() - new Date(candidate.fecha).getTime()) / 86400000;
    if (ageDays < 7) score += 1;
    else if (ageDays > 180) score -= 1;

    if (score >= 3) {
      candidates.push({ noticia: candidate, score, reason: reasons.join(', ') });
    }
  }

  // Top 5, diversificado por categoría (máximo 2 de misma categoría)
  return diversify(candidates.sort((a, b) => b.score - a.score), 5, 2)
    .map(({ noticia: n }) => ({
      url: `/noticias/${n.slug}`,
      anchor: n.titulo,
      type: 'noticia',
    }));
}
```

**Archivos afectados:**
- `lib/internal-linking-engine.ts` (nuevo)
- `app/noticias/[slug]/page.tsx` — usar `generateRelatedLinks` si `related_links` está vacío
- `lib/data.ts` — `getRelatedNews` optimizado

**Riesgo:** Medio — requiere cache para evitar recálculo en cada visita  
**Prioridad:** P0  
**Tiempo:** 8h  
**Beneficio Google:** Enlaces internos contextuales mejoran crawl y ranking  
**Beneficio usuarios:** Continuación natural de lectura  
**Beneficio monetización:** Más pageviews por sesión

### 4.2.2 Entity Linking Within Content

**Objetivo:** Detectar entidades mencionadas en el contenido y enlazarlas automáticamente a sus páginas de entidad.

**Diseño:**
```typescript
// lib/entity-linker.ts (nuevo)
export function linkEntitiesInContent(
  html: string,
  entities: Array<{ name: string; slug: string; url: string }>,
): string {
  let result = html;
  for (const entity of entities) {
    // Solo enlazar primera ocurrencia, no dentro de <a> existentes
    const regex = new RegExp(`\\b${escapeRegex(entity.name)}\\b(?![^<]*</a>)`, 'i');
    result = result.replace(regex, `<a href="${entity.url}" rel="noopener">${entity.name}</a>`);
  }
  return result;
}
```

**Archivos afectados:** `lib/entity-linker.ts` (nuevo), `components/ArticlePage.tsx`  
**Riesgo:** Medio — puede enlazar incorrectamente si entidades son ambiguas  
**Prioridad:** P1  
**Tiempo:** 6h

### 4.2.3 Enlaces a Guías Evergreen

**Objetivo:** Si una noticia menciona "pasaporte", enlazar a la guía de apostillado.

**Diseño:**
```typescript
// lib/evergreen-linker.ts
const EVERGREEN_TRIGGERS: Record<string, string[]> = {
  'apostillar-documentos-nicaragua-2026': ['apostilla', 'apostillar', 'legalización documentos', 'cancillería'],
  'anular-recurso-policial-nicaragua-2026': ['récord policial', 'antecedentes penales', 'certificado de conducta'],
  // ... más guías
};

export function findEvergreenLinks(noticia: Noticia): LinkSuggestion[] {
  const text = `${noticia.titulo} ${noticia.resumen} ${noticia.contenido || ''}`.toLowerCase();
  return Object.entries(EVERGREEN_TRIGGERS)
    .filter(([_, triggers]) => triggers.some(t => text.includes(t)))
    .map(([slug]) => ({
      url: `/guia/${slug}`,
      anchor: 'Guía completa',
      type: 'guia',
      score: 5,
    }));
}
```

**Archivos afectados:** `lib/evergreen-linker.ts` (nuevo), `app/noticias/[slug]/page.tsx`  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 3h

---

# FASE 5 — SISTEMA EVERGREEN

## 5.1 Estado actual

**Ya implementado:**
- ✅ `lib/evergreen.ts` con 3 guías hardcoded (apostilla, récord policial, turismo)
- ✅ `lib/content-lifecycle.ts` con detección de potencial evergreen
- ✅ `findConversionOpportunities` que detecta noticias para convertir en guías
- ✅ Páginas de guía en `/guia/[slug]` con FAQ schema
- ✅ `ArticleFaq` component

**Faltante:**
- ❌ Detección automática de temas evergreen en nuevas noticias
- ❌ Sin sistema de conversión noticia → guía
- ❌ Guías en archivo TS, no en Firestore
- ❌ No hay checklist/comparativas
- ❌ No hay actualización automática de guías

## 5.2 Diseño técnico

### 5.2.1 Detección Automática Evergreen

**Objetivo:** Cuando se publica una noticia, detectar si tiene potencial evergreen y notificar al editor.

**Diseño:**
```typescript
// lib/evergreen-detector.ts (nuevo)
const EVERGREEN_PATTERNS = [
  { pattern: /pasaporte|visa|apostilla|legalización/i, topic: 'Trámites migratorios', guideSlug: 'apostillar-documentos-nicaragua-2026' },
  { pattern: /récord policial|antecedentes penales|certificado de conducta/i, topic: 'Récord policial', guideSlug: 'anular-recurso-policial-nicaragua-2026' },
  { pattern: /INSS|seguro social|pensiones|jubilación/i, topic: 'INSS', guideSlug: null },
  { pattern: /INVUR|vivienda social|subsidio de vivienda/i, topic: 'Vivienda', guideSlug: null },
  { pattern: /DGI|impuestos|declaración de renta|IR/i, topic: 'Impuestos', guideSlug: null },
  { pattern: /licencia de conducir|transito|SAT/i, topic: 'Licencia de conducir', guideSlug: null },
  { pattern: /matrícula|colegio|inscripción escolar/i, topic: 'Educación', guideSlug: null },
];

export function detectEvergreenPotential(noticia: Noticia): {
  hasPotential: boolean;
  topic: string | null;
  existingGuide: string | null;
  recommendation: 'LINK_TO_GUIDE' | 'CREATE_GUIDE' | 'NONE';
} {
  const text = `${noticia.titulo} ${noticia.resumen} ${noticia.contenido || ''}`;
  for (const { pattern, topic, guideSlug } of EVERGREEN_PATTERNS) {
    if (pattern.test(text)) {
      return {
        hasPotential: true,
        topic,
        existingGuide: guideSlug,
        recommendation: guideSlug ? 'LINK_TO_GUIDE' : 'CREATE_GUIDE',
      };
    }
  }
  return { hasPotential: false, topic: null, existingGuide: null, recommendation: 'NONE' };
}
```

**Archivos afectados:** `lib/evergreen-detector.ts` (nuevo), API de publicación  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 4h

### 5.2.2 Migración de Guías a Firestore

**Objetivo:** Mover guías de `lib/evergreen.ts` (102KB hardcoded) a Firestore.

**Estructura:**
```
guias/{slug}:
  title: string
  description: string
  category: string
  author: string
  authorSlug: string
  publishedDate: timestamp
  updatedDate: timestamp
  content: string (HTML)
  faqs: [{ question, answer }]
  triggers: string[]  // keywords que disparan enlaces
  status: 'published' | 'draft'
```

**Archivos afectados:** `lib/evergreen.ts` → `lib/db/guias.ts`, `app/guia/[slug]/page.tsx`  
**Riesgo:** Medio — requiere migración de datos  
**Prioridad:** P2  
**Tiempo:** 6h

---

# FASE 6 — OPTIMIZACIÓN GOOGLE DISCOVER

## 6.1 Análisis

**Factores Discover:**
1. **Títulos:** Deben ser 50-60 chars, sin clickbait, descriptivos
2. **Imágenes:** Mínimo 1200px, aspect ratio 16:9, no logos
3. **Frescura:** Contenido publicado en últimas 48h tiene prioridad
4. **Autoridad temática:** Cobertura continua de un tema
5. **CTR histórico:** Alto CTR en Search mejora Discover
6. **Clusters:** Noticias que pertenecen a un cluster temático reciben más impresiones
7. **Recirculación:** Enlaces internos mantienen users en el sitio

## 6.2 Diseño técnico

### 6.2.1 Discover Score

**Objetivo:** Cada noticia recibe un score de aptitud para Discover.

```typescript
// lib/discover-score.ts (nuevo)
export interface DiscoverScore {
  total: number; // 0-100
  factors: {
    titleLength: number;      // 0-15 (óptimo: 50-60)
    imageQuality: number;     // 0-20 (óptimo: 1200px+ 16:9)
    freshness: number;        // 0-20 (óptimo: <24h)
    topicalAuthority: number; // 0-15 (óptimo: tema con 5+ artículos)
    ctrHistory: number;       // 0-10 (óptimo: CTR >3% en Search)
    internalLinks: number;    // 0-10 (óptimo: 3+ enlaces internos)
    engagement: number;       // 0-10 (óptimo: tiempo lectura >2min)
  };
  recommendation: 'DISCOVER_READY' | 'OPTIMIZE_TITLE' | 'OPTIMIZE_IMAGE' | 'NEEDS_WORK';
}

export function calculateDiscoverScore(
  noticia: Noticia,
  topicArticleCount: number,
  ctr: number,
  avgTimeOnPage: number,
): DiscoverScore {
  // ... scoring logic
}
```

**Archivos afectados:** `lib/discover-score.ts` (nuevo)  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 4h

### 6.2.2 Optimización de Imágenes para Discover

**Objetivo:** Asegurar que todas las imágenes de artículos sean ≥1200px con aspect ratio 16:9.

**Diseño:** Modificar `getHeroImageUrl` para verificar dimensiones y usar `images.weserv.nl` para redimensionar si es necesario.

**Archivos afectados:** `lib/image-utils.ts`, `lib/seo/schema.ts`  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 3h

### 6.2.3 `max-image-preview:large` en robots

**Objetivo:** Permitir que Google use imágenes grandes en Discover.

```typescript
// app/robots.ts — añadir:
rules: [
  {
    userAgent: '*',
    allow: ['/', '/_next/', '/opengraph-image', '/js/'],
    disallow: ['/buscar', '/api/', '/admin/', '/cdn-cgi/'],
  },
],
// Añadir meta tag en layout:
// <meta name="robots" content="max-image-preview:large" />
```

**Archivos afectados:** `app/robots.ts`, `app/layout.tsx`  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 0.5h

---

# FASE 7 — REVENUE INTELLIGENCE

## 7.1 Estado actual

**Ya implementado:**
- ✅ `lib/revenue-intelligence.ts` con `detectRevenueOpportunities`
- ✅ `lib/distribution-intelligence.ts` con `recommendDistribution`
- ✅ `lib/content-lifecycle.ts` con `classifyContentLifecycle`
- ✅ AdSense con 4 slots (728x90, 300x250, in-article, autorelaxed)
- ✅ Monetag zone 11065476

**Faltante:**
- ❌ No hay score por artículo que combine todos los factores
- ❌ No hay tracking de RPM/CPM por artículo
- ❌ No hay recomendación automática de acción editorial
- ❌ No hay integración con AdSense Management API

## 7.2 Diseño técnico — Revenue Score

### 7.2.1 Revenue Score Multi-Factor

**Objetivo:** Cada noticia recibe un score que indica su potencial de monetización.

```typescript
// lib/revenue-score.ts (nuevo)
export interface RevenueScore {
  total: number; // 0-100
  channels: {
    discover: number;    // 0-20
    googleSearch: number; // 0-20
    facebook: number;    // 0-15
    telegram: number;    // 0-10
    newsletter: number;  // 0-10
    evergreen: number;   // 0-15
    backlinks: number;   // 0-10
  };
  rpm: number; // estimación RPM en USD
  action: 'PUBLICAR' | 'ACTUALIZAR' | 'EXPANDIR' | 'CONVERTIR_EN_GUIA' | 'DESCARTAR';
  reason: string;
}

export function calculateRevenueScore(
  noticia: Noticia,
  lifecycle: LifecycleProfile,
  discoverScore: DiscoverScore,
  views: number,
): RevenueScore {
  // ... multi-factor scoring
  // PUBLICAR: score > 70, frescura < 24h
  // ACTUALIZAR: score > 50, edad > 90 días, vistas > 50
  // EXPANDIR: score > 60, potencial evergreen, vistas > 100
  // CONVERTIR_EN_GUIA: score > 75, evergreen detectado
  // DESCARTAR: score < 30, sin vistas
}
```

**Archivos afectados:** `lib/revenue-score.ts` (nuevo), panel admin  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 6h

### 7.2.2 Ad Placement Optimization

**Objetivo:** Optimizar posición de ads basado en longitud de artículo y engagement.

**Diseño:**
- Artículos < 400 palabras: 1 ad (in-article)
- Artículos 400-800 palabras: 2 ads (after paragraph 2, after content)
- Artículos > 800 palabras: 3 ads (after paragraph 2, mid-content, after content)
- Artículos evergreen: ad refresh cada 30s

**Archivos afectados:** `components/ArticlePage.tsx`, `lib/ad-strategy.ts` (nuevo)  
**Riesgo:** Medio — AdSense ToS  
**Prioridad:** P2  
**Tiempo:** 3h

---

# FASE 8 — OBSERVABILIDAD

## 8.1 Diseño técnico

### 8.1.1 Sentry Error Tracking

**Objetivo:** Capturar todos los errores 500 y excepciones en producción.

**Diseño:**
```typescript
// instrumentation.ts (nuevo, raíz del proyecto)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// app/global-error.tsx (nuevo)
import * as Sentry from '@sentry/nextjs';
export default function GlobalError({ error, reset }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  // ... UI
}
```

**Archivos afectados:** `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.client.config.ts`, `instrumentation.ts`, `app/global-error.tsx`  
**Riesgo:** Bajo  
**Prioridad:** P0  
**Tiempo:** 2h  
**Beneficio:** Visibilidad completa de errores en producción

### 8.1.2 Web Vitals Reporting

**Objetivo:** Medir LCP, CLS, INP, TTFB reales en producción.

**Diseño:**
```typescript
// app/layout.tsx — añadir:
import { Analytics } from '@vercel/analytics/next';
// o usar next/web-vitals con GA4:
export function WebVitals() {
  const handleVitals = (metric) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 100 : metric.value),
        label: metric.id,
        non_interaction: true,
      });
    }
  };
  return <Script strategy="afterInteractive">{`...`}</Script>;
}
```

**Archivos afectados:** `app/layout.tsx`, `components/WebVitals.tsx` (nuevo)  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 1h

### 8.1.3 404/500 Monitoring

**Objetivo:** Loggear todos los 404 y 500 para detectar enlaces rotos.

**Diseño:** Middleware que loggea 404s a Firestore `error_logs` o Sentry breadcrumbs.

**Archivos afectados:** `middleware.ts`, `app/not-found.tsx`  
**Riesgo:** Bajo  
**Prioridad:** P1  
**Tiempo:** 2h

### 8.1.4 Firestore Quota Alerts

**Objetivo:** Alertar cuando Firestore se acerca al límite de reads/writes.

**Diseño:** Firebase Console alerts + custom dashboard en panel admin.

**Archivos afectados:** Panel admin (no código del sitio)  
**Riesgo:** Bajo  
**Prioridad:** P2  
**Tiempo:** 1h

---

# FASE 9 — AUTOMATIZACIONES EDITORIALES

## 9.1 Diseño técnico

### 9.1.1 Actualización Automática de Notas Antiguas

**Objetivo:** Detectar notas con tráfico decreciente y sugerir actualizaciones.

**Diseño:**
```typescript
// lib/automation/update-detector.ts (nuevo)
export async function findStaleArticles(): Promise<StaleArticle[]> {
  // Query Firestore: artículos con fechaActualizacion > 90 días
  // Comparar vistas de últimos 7 días vs 7 días anteriores
  // Si decay > 50%, marcar para actualización
}
```

**Riesgo:** Bajo  
**Prioridad:** P2  
**Tiempo:** 4h

### 9.1.2 Detección de Duplicados

**Objetivo:** Detectar noticias que cubren el mismo hecho.

**Ya implementado parcialmente:** `lib/analizador-duplicados.ts` existe.

**Mejora:** Integrar con API de publicación para bloquear duplicados antes de publicar.

**Riesgo:** Medio — puede bloquear cobertura legítima  
**Prioridad:** P2  
**Tiempo:** 3h

### 9.1.3 Detección de Canibalización SEO

**Objetivo:** Detectar cuando dos artículos compiten por la misma keyword.

**Diseño:**
```typescript
// lib/automation/canibalization-detector.ts (nuevo)
export async function detectCanibalization(): Promise<CanibalizationAlert[]> {
  // Para cada par de artículos:
  // 1. Comparar títulos (Jaccard similarity > 0.5)
  // 2. Comparar keywords compartidas
  // 3. Si ambos rankean para la misma query, alertar
}
```

**Riesgo:** Bajo  
**Prioridad:** P2  
**Tiempo:** 4h

### 9.1.4 Inserción Automática de Enlaces

**Objetivo:** Al publicar una noticia nueva, insertar enlaces en noticias antiguas relacionadas.

**Diseño:** Cron job que:
1. Obtiene noticias publicadas en últimas 24h
2. Para cada una, encuentra noticias antiguas relacionadas
3. Actualiza `related_links` en las noticias antiguas

**Riesgo:** Medio — modifica contenido existente  
**Prioridad:** P2  
**Tiempo:** 4h

### 9.1.5 Recordatorio de Contexto

**Objetivo:** Cuando se cubre un tema recurrente, recordar al editor el contexto anterior.

**Diseño:** Integrar con `buildEditorialContext` ya existente en `lib/meni/editor-brain/`.

**Riesgo:** Bajo  
**Prioridad:** P2  
**Tiempo:** 2h

---

# FASE 10 — ROADMAP PRIORIZADO

## 10.1 Criterios de Priorización

Cada mejora se evalúa por:
- **ROI:** Impacto / Costo
- **Impacto:** 1-10 (tráfico, revenue, UX)
- **Costo:** $ (esfuerzo en horas)
- **Tiempo:** Días estimados
- **Riesgo:** Bajo/Medio/Alto
- **Complejidad:** Baja/Media/Alta

## 10.2 Roadmap

### Sprint 1 (Semanas 1-2) — Fundaciones Críticas

| # | Mejora | P | Impacto | Esfuerzo | ROI | Riesgo | Semana |
|---|---|---|---|---|---|---|---|
| 1 | OBS-01: Sentry error tracking | P0 | 9 | 2h | 4.5 | Bajo | 1 |
| 2 | GN-01: Google News Publisher Center | P0 | 10 | 1h | 10 | Bajo | 1 |
| 3 | IL-01: Motor de enlaces internos automáticos | P0 | 10 | 8h | 1.25 | Medio | 1-2 |
| 4 | SEO-01: hreflang tags | P0 | 6 | 1h | 6 | Bajo | 1 |
| 5 | PERF-01: Paginación Firestore | P1 | 8 | 6h | 1.33 | Medio | 2 |
| 6 | PERF-02: Consolidar queries home | P1 | 7 | 4h | 1.75 | Medio | 2 |
| 7 | OBS-02: Web Vitals reporting | P1 | 7 | 1h | 7 | Bajo | 1 |
| 8 | DISC-04: max-image-preview:large | P1 | 5 | 0.5h | 10 | Bajo | 1 |

### Sprint 2 (Semanas 3-4) — SEO + Discover

| # | Mejora | P | Impacto | Esfuerzo | ROI | Riesgo | Semana |
|---|---|---|---|---|---|---|---|
| 9 | FASE 3.2.1: Hub pages temáticas | P1 | 9 | 8h | 1.13 | Medio | 3 |
| 10 | FASE 3.2.2: Asignación automática de temas | P1 | 8 | 4h | 2 | Bajo | 3 |
| 11 | FASE 4.2.2: Entity linking in content | P1 | 8 | 6h | 1.33 | Medio | 3-4 |
| 12 | FASE 4.2.3: Enlaces a guías evergreen | P1 | 7 | 3h | 2.33 | Bajo | 3 |
| 13 | FASE 6.2.1: Discover Score | P1 | 7 | 4h | 1.75 | Bajo | 4 |
| 14 | FASE 6.2.2: Optimización imágenes Discover | P1 | 6 | 3h | 2 | Bajo | 4 |
| 15 | EDSEO-01: Meta descriptions desde resumen | P1 | 7 | 3h | 2.33 | Bajo | 4 |
| 16 | SEO-02: Sitemap paginado | P1 | 5 | 3h | 1.67 | Bajo | 4 |

### Sprint 3 (Semanas 5-6) — EEAT + Revenue

| # | Mejora | P | Impacto | Esfuerzo | ROI | Riesgo | Semana |
|---|---|---|---|---|---|---|---|
| 17 | FASE 2.2.1: Person Schema en ArticlePage | P1 | 6 | 2h | 3 | Bajo | 5 |
| 18 | FASE 2.2.4: Autor con artículos agrupados | P1 | 5 | 3h | 1.67 | Bajo | 5 |
| 19 | FASE 7.2.1: Revenue Score | P1 | 8 | 6h | 1.33 | Bajo | 5-6 |
| 20 | FASE 5.2.1: Detección evergreen automática | P1 | 7 | 4h | 1.75 | Bajo | 5 |
| 21 | CWV-02: Placeholder dimensionado para ads | P1 | 5 | 1h | 5 | Bajo | 5 |
| 22 | MON-01: AdSense data-ad-layout | P1 | 4 | 0.5h | 8 | Bajo | 5 |
| 23 | SEO-04: Last-Modified header | P1 | 5 | 2h | 2.5 | Bajo | 6 |
| 24 | ISR-01: revalidateTag en writes | P1 | 6 | 1h | 6 | Bajo | 6 |

### Sprint 4 (Semanas 7-8) — Performance + UX

| # | Mejora | P | Impacto | Esfuerzo | ROI | Riesgo | Semana |
|---|---|---|---|---|---|---|---|
| 25 | CWV-01: ArticlePage server component | P1 | 9 | 16h | 0.56 | Alto | 7-8 |
| 26 | PERF-03: PurgeCSS pro-design.css | P2 | 5 | 4h | 1.25 | Bajo | 7 |
| 27 | UX-01: Relacionados en server-side | P1 | 7 | 6h | 1.17 | Medio | 7 |
| 28 | A11Y-01: next/image con alt siempre | P1 | 4 | 2h | 2 | Bajo | 7 |
| 29 | OBS-03: Logging estructurado API | P1 | 5 | 3h | 1.67 | Bajo | 8 |
| 30 | FS-01: getRelatedNews optimizado | P1 | 5 | 2h | 2.5 | Bajo | 8 |

### Sprint 5 (Semanas 9-10) — Automatización

| # | Mejora | P | Impacto | Esfuerzo | ROI | Riesgo | Semana |
|---|---|---|---|---|---|---|---|
| 31 | FASE 9.1.1: Update detector | P2 | 6 | 4h | 1.5 | Bajo | 9 |
| 32 | FASE 9.1.3: Canibalización detector | P2 | 5 | 4h | 1.25 | Bajo | 9 |
| 33 | FASE 9.1.4: Inserción automática enlaces | P2 | 6 | 4h | 1.5 | Medio | 10 |
| 34 | FASE 2.2.2: FactCheck schema | P2 | 4 | 3h | 1.33 | Bajo | 10 |
| 35 | FASE 2.2.3: AboutPage + ContactPage schema | P2 | 3 | 2h | 1.5 | Bajo | 10 |
| 36 | DEAD-01: Mover 80+ .md a docs/archive/ | P2 | 2 | 1h | 2 | Bajo | 10 |

### Sprint 6 (Semanas 11-12) — Pulido

| # | Mejora | P | Impacto | Esfuerzo | ROI | Riesgo | Semana |
|---|---|---|---|---|---|---|---|
| 37 | FASE 5.2.2: Migrar guías a Firestore | P2 | 5 | 6h | 0.83 | Medio | 11 |
| 38 | FASE 9.1.2: Detección duplicados | P2 | 4 | 3h | 1.33 | Medio | 11 |
| 39 | SCH-03: CollectionPage schema categorías | P2 | 3 | 2h | 1.5 | Bajo | 11 |
| 40 | FEED-01: media:content en RSS | P2 | 3 | 2h | 1.5 | Bajo | 12 |
| 41 | UX-02: Autocomplete en búsqueda | P2 | 4 | 4h | 1 | Medio | 12 |
| 42 | ESC-01: Cursor pagination | P1 | 6 | 4h | 1.5 | Medio | 12 |
| 43 | DEAD-04: Eliminar componentes no usados | P3 | 2 | 0.5h | 4 | Bajo | 12 |

## 10.3 Resumen de Inversión

| Sprint | Horas | P0 resueltos | P1 resueltos | P2 resueltos |
|---|---|---|---|---|
| 1 (Sem 1-2) | 23.5h | 4 | 4 | 0 |
| 2 (Sem 3-4) | 34h | 0 | 8 | 0 |
| 3 (Sem 5-6) | 24.5h | 0 | 8 | 0 |
| 4 (Sem 7-8) | 33h | 0 | 5 | 1 |
| 5 (Sem 9-10) | 18h | 0 | 0 | 6 |
| 6 (Sem 11-12) | 21.5h | 0 | 1 | 5 |
| **Total** | **154.5h** | **4** | **26** | **12** |

## 10.4 Impacto Esperado por Métrica

| Métrica | Actual | Objetivo Sprint 6 | Cómo |
|---|---|---|---|
| Tráfico orgánico Google | Baseline | +40% | EEAT, enlaces internos, topical authority |
| Impresiones Google Discover | 0 | +20K/mes | Imágenes optimizadas, max-image-preview, Discover score |
| Páginas indexadas Google News | 0 | 100% noticias 48h | Publisher Center, news-sitemap correcto |
| Core Web Vitals (LCP) | No medido | <2.5s P75 | Server components, CSS purge, Sentry monitoring |
| RPM AdSense | Baseline | +25% | Ad placement, más pageviews via enlaces internos |
| Pageviews/sesión | ~1.2 | ~1.8 | Enlaces internos contextuales, relacionados automáticos |
| Tiempo en página | No medido | >2min | Contenido mejor estructurado, relacionados relevantes |
| Errores 500 | No visible | <0.1% | Sentry, logging estructurado |
| Firestore reads/día | ~10K | ~5K | Query optimization, caching, pagination |

---

## CONCLUSIÓN

El proyecto Nicaragua Informate tiene una base técnica sólida (build limpio, tests pasando, seguridad corregida). Los 4 P0 y 26 P1 identificados representan la diferencia entre un sitio que funciona y un medio digital que compite con medios nacionales.

**Prioridad crítica inmediata:**
1. Sentry (visibilidad de errores)
2. Google News Publisher Center (tráfico News)
3. Motor de enlaces internos (retención + SEO)
4. Hub pages temáticas (topical authority)

**Inversión total estimada:** 154.5 horas (~12 semanas a 13h/semana)  
**ROI esperado:** +40% tráfico orgánico, +25% RPM, entrada a Google Discover y Google News
