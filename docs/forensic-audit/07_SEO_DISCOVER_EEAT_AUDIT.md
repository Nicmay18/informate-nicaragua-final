# 07 — SEO / DISCOVER / E-E-A-T AUDIT

**Auditor:** SEO Specialist + Google News Specialist
**Fecha:** 2026-08-03

---

## 1. METADATA BASE

**Archivo:** `app/layout.tsx:70-140`

| Elemento | Estado | Nota |
|---|---|---|
| `metadataBase` | ✅ | `https://nicaraguainformate.com` |
| `title.template` | ✅ | `%s \| Nicaragua Informate` |
| `title.default` | ✅ | Completo con keywords |
| `description` | ✅ | 155 chars, keywords incluidos |
| `robots` | ✅ | `index: true, follow: true` + googleBot config |
| `icons` | ✅ | favicon.ico, svg, apple-touch |
| `openGraph` | ✅ | type, locale, url, siteName, images |
| `twitter` | ✅ | `summary_large_image`, @NicInformate |
| `alternates` | ✅ | canonical, RSS, JSON Feed |
| `verification` | ✅ | Google Search Console |
| `manifest` | ✅ | `/manifest.json` |

## 2. JSON-LD STRUCTURED DATA

**Archivo:** `lib/seo/schema.ts`

| Schema type | Estado | Detalle |
|---|---|---|
| `NewsArticle` | ✅ | Completo: headline, image (3 sizes), author, editor, speakable, publisher, wordCount, articleBody |
| `Organization` (NewsMediaOrganization) | ✅ | founders, employees, contactPoint, sameAs, address, ethicsPolicy, masthead, correctionsPolicy |
| `WebSite` (with SearchAction) | ✅ | Sitelinks searchbox |
| `BreadcrumbList` | ✅ | Home > Noticias > Categoría > Artículo |
| `FAQPage` | ✅ | Generado dinámicamente desde contenido |
| `ItemList` (Home) | ✅ | Top 6 noticias en home |

**Evaluación:** Schema.org excelente. Cubre todos los rich snippets relevantes para Google News.

## 3. SITEMAP

**Archivo:** `app/sitemap.ts`
- URLs estáticas: 16 ✅
- URLs de autores: dinámico ✅
- URLs evergreen: dinámico ✅
- URLs de artículos: hasta 500, con `lastModified`, `priority` dinámico por antigüedad ✅
- Filtro de slugs tóxicos ✅
- Filtro de borradores/archivados ✅
- `revalidate: 3600` (1h) ✅
- Cache: `unstable_cache` con tag ✅

## 4. ROBOTS.TXT

**Archivo:** `app/robots.ts`
- `*` allow `/`, `/_next/`, `/opengraph-image`, `/js/` ✅
- `*` disallow `/buscar`, `/api/`, `/admin/`, `/cdn-cgi/` ✅
- `Googlebot` y `Googlebot-News` reglas específicas ✅
- `AdsBot-Google` allow `/` ✅
- Sitemap: 2 URLs (sitemap + news-sitemap) ✅
- Host: `https://nicaraguainformate.com` ✅

## 5. E-E-A-T

### Experience
- **Authors:** `lib/authors.ts` define autores con bio, foto, role, coverageAreas, social ✅
- **Author pages:** `/autor/[slug]` con perfil completo ✅
- **AuthorCard:** Componente en artículo con foto y bio ✅

### Expertise
- **`AUTHORS` object:** Define roles (Directora Editorial, Periodista) ✅
- **`knowsAbout`** en schema ✅
- **coverageAreas** en perfiles ✅

### Authoritativeness
- **NewsMediaOrganization** schema con founders ✅
- **masthead** URL ✅
- **ethicsPolicy** URL ✅
- **correctionsPolicy** URL ✅
- **Páginas:** `/nosotros`, `/politica-editorial`, `/correcciones`, `/metodologia-editorial` ✅

### Trustworthiness
- **verificationFactCheckingPolicy** ✅
- **privacyPolicy** ✅
- **ownershipFundingInfo** ✅
- **actionableFeedbackPolicy** ✅
- **HSTS** preload ✅
- **HTTPS** forzado via redirects ✅

## 6. GOOGLE NEWS

| Requisito | Estado | Evidencia |
|---|---|---|
| News sitemap | ✅ | `/news-sitemap.xml` route |
| Articles con `datePublished` | ✅ | JSON-LD `datePublished` |
| Articles con `dateModified` | ✅ | JSON-LD `dateModified` |
| Author identificado | ✅ | JSON-LD `author` con `@id` |
| Publisher identificado | ✅ | JSON-LD `publisher` Organization |
| `NewsArticle` schema | ✅ | Completo |
| URLs permanentes | ✅ | Redirects 301 de URLs legacy |
| `Googlebot-News` allow | ✅ | `robots.ts` |
| `isAccessibleForFree` | ✅ | `true` en schema |

## 7. GOOGLE DISCOVER

| Requisito | Estado |
|---|---|
| Imágenes grandes (≥1200px) | ✅ | JSON-LD image 1200x675 |
| `max-image-preview: large` | ✅ | `layout.tsx:86` |
| Contenido fresco | ✅ | ISR 5min |
| Títulos no clickbait | ✅ | `normalizeEditorialTitle()` |
| `speakable` | ✅ | JSON-LD speakable |

## 8. ADSENSE

| Requisito | Estado |
|---|---|
| `ads.txt` | ✅ | `/public/ads.txt` |
| AdSense script | ✅ | `layout.tsx:160-164` |
| `AdsenseUnit` component | ✅ | Lazy-load via IntersectionObserver |
| `ca-pub-4115203339551838` | ✅ | En layout |
| Privacy policy | ✅ | `/privacidad` |
| Cookies consent | ✅ | `CookieBanner` component |
| `adsbygoogle` push | ✅ | En `AdsenseUnit.tsx` |

## 9. HALLAZGOS

### H-SEO-01: Schema.org excelente y completo
- **Evidencia:** `lib/seo/schema.ts` — 341 líneas con NewsArticle, Organization, WebSite, Breadcrumb, FAQ
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-02: `safeIsoDate` previene fechas inválidas en JSON-LD
- **Evidencia:** `lib/seo/schema.ts:19-23` — fallback a `new Date().toISOString()`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-03: `toAbsoluteUrl` asegura URLs absolutas en JSON-LD
- **Evidencia:** `lib/seo/schema.ts:12-16`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-04: `escapeJsonLd` previene inyección
- **Evidencia:** `lib/jsonld.ts` usado en `layout.tsx:171-172` y `page.tsx:122`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-05: Redirects 301 conservan link equity
- **Evidencia:** `next.config.ts:55-299` — 30+ redirects permanentes
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-06: www → non-www redirect
- **Evidencia:** `next.config.ts:58-62` — `www.nicaraguainformate.com` → `nicaraguainformate.com`
- **Impacto:** Positivo — canonicalización
- **Riesgo:** N/A

### H-SEO-07: HTTP → HTTPS redirect
- **Evidencia:** `next.config.ts:63-68`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-08: `noindex` soportado por artículo
- **Evidencia:** `lib/data.ts:133` — `noindex: !!data.noindex`
- **Impacto:** Positivo — control granular
- **Riesgo:** N/A

### H-SEO-09: `isToxicSlug` filtra contenido removido del sitemap
- **Evidencia:** `app/sitemap.ts:78` — `if (isToxicSlug(article.slug)) return false`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-10: `normalizeEditorialTitle` aplica estilo editorial a títulos
- **Evidencia:** `lib/formateo.ts` — usado en `data.ts:115` y `schema.ts:49`
- **Impacto:** Positivo — consistencia
- **Riesgo:** N/A

### H-SEO-11: `smartTruncate` para meta descriptions
- **Evidencia:** `app/page.tsx:27-32` — trunca respetando límites de palabras
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-12: `generarFaqSchema` extrae preguntas del contenido
- **Evidencia:** `lib/seo/schema.ts:309-340` — regex `¿[^?]+\?` máximo 3 preguntas
- **Impacto:** Positivo — rich snippets FAQ
- **Riesgo:** N/A

### H-SEO-13: Internal linking via `injectInternalLinks`
- **Evidencia:** `components/ArticlePage.tsx:12` — `injectInternalLinks`
- **Impacto:** Positivo — SEO interno
- **Riesgo:** N/A

### H-SEO-14: `injectTocIds` genera tabla de contenidos
- **Evidencia:** `components/ArticlePage.tsx:9` — `injectTocIds`
- **Impacto:** Positivo — UX + SEO
- **Riesgo:** N/A

### H-SEO-15: `google-indexing.ts` para IndexNow
- **Evidencia:** `lib/google-indexing.ts` = 3,013 bytes
- **Evidencia:** `app/api/indexnow/route.ts` — endpoint IndexNow
- **Impacto:** Positivo — indexación rápida
- **Riesgo:** N/A

### H-SEO-16: RSS + JSON Feed
- **Evidencia:** `app/feed.xml/route.ts`, `app/feed.json/route.ts`
- **Impacto:** Positivo — distribución
- **Riesgo:** N/A

### H-SEO-17: `og:image` dinámico
- **Evidencia:** `app/opengraph-image.tsx` = 3,231 bytes — genera OG image dinámica
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-18: `KeyPoints` component para resumen estructurado
- **Evidencia:** `components/KeyPoints.tsx` = 2,214 bytes
- **Impacto:** Positivo — UX + SEO
- **Riesgo:** N/A

### H-SEO-19: `ArticleFaq` component
- **Evidencia:** `components/ArticleFaq.tsx` = 2,172 bytes
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEO-20: `ArticleDataCard` para datos estructurados
- **Evidencia:** `components/ArticleDataCard.tsx` = 3,202 bytes
- **Impacto:** Positivo
- **Riesgo:** N/A

## 10. SCORE

| Dimensión | Score |
|---|---|
| Metadata | 9/10 |
| Schema.org | 10/10 |
| Sitemap | 9/10 |
| Robots | 9/10 |
| E-E-A-T | 9/10 |
| Google News | 9/10 |
| Google Discover | 9/10 |
| AdSense compliance | 8/10 |
| Internal linking | 8/10 |
| **Total** | **8.9/10** |
