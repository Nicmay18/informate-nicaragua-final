# Google News Publisher Center — Checklist de Cumplimiento

## Estado: ✅ Configurado | ❌ Pendiente | ⚠️ Revisar

### 1. Publisher Center
- [ ] Registrar dominio `nicaraguainformate.com` en https://publishercenter.google.com
- [ ] Verificar propiedad (ya verificado via Search Console)
- [ ] Configurar publicación: "Nicaragua Informate"
- [ ] URL principal: https://nicaraguainformate.com

### 2. News Sitemap
- ✅ `/news-sitemap.xml` existe y funciona
- ✅ Namespace `xmlns:news` correcto
- ✅ `<news:publication>` con name y language
- ✅ `<news:publication_date>` con timezone (-06:00)
- ✅ Solo noticias de últimas 48 horas
- ✅ Filtro de slugs tóxicos y estados borrador/archivado
- ✅ Referenciado en `robots.txt`

### 3. Robots.txt
- ✅ `Googlebot-News` con allow '/'
- ✅ Sitemap news referenciado
- ✅ `max-image-preview:large` en metadata

### 4. RSS Feed
- ✅ `/feed.xml` con RSS 2.0
- ✅ Namespace media incluido
- ✅ `<content:encoded>` con HTML completo
- ✅ `<media:content>` para imágenes
- ✅ `<dc:creator>` para autor
- ✅ `<atom:link>` self-referencing

### 5. JSON Feed
- ✅ `/feed.json` con JSON Feed 1.1
- ✅ `image` field en items
- ✅ `date_published` y `date_modified`
- ✅ `authors` field

### 6. Schema.org NewsArticle
- ✅ `NewsArticle` type en `buildNewsArticleJsonLdEnhanced`
- ✅ `headline` con título normalizado
- ✅ `author` con `Person` schema (@id, name, jobTitle, url, sameAs, knowsAbout)
- ✅ `publisher` con `Organization` schema (@id, name, logo)
- ✅ `datePublished` ISO 8601
- ✅ `dateModified` si existe fechaActualizacion
- ✅ `image` con URL absoluta
- ✅ `articleSection` con categoría
- ✅ `speakable` con selectores CSS
- ✅ `isAccessibleForFree: true`

### 7. Organization Schema
- ✅ `NewsMediaOrganization` type
- ✅ `name`, `url`, `logo`
- ✅ `foundingDate`
- ✅ `address` (Managua, NI)
- ✅ `contactPoint` con email
- ✅ `sameAs` con Facebook

### 8. WebSite Schema
- ✅ `WebSite` type
- ✅ `SearchAction` con potentialAction
- ✅ `url`, `name`, `publisher`

### 9. Metadata por artículo
- ✅ `title` optimizado SEO (max 60 chars)
- ✅ `description` desde resumen o generada
- ✅ `canonical` URL absoluta
- ✅ `openGraph` con type 'article'
- ✅ `publishedTime` y `modifiedTime`
- ✅ `section` con categoría
- ✅ `images` con width/height/alt
- ✅ `twitter:card` summary_large_image
- ✅ `robots` con max-image-preview:large

### 10. Páginas institucionales EEAT
- ✅ `/nosotros` con AboutPage schema
- ✅ `/politica-editorial` con canonical
- ✅ `/correcciones` con lista pública de correcciones
- ✅ `/metodologia-editorial` con proceso de verificación
- ✅ `/autor/[slug]` con Person schema

### 11. Configuración técnica
- ✅ `html lang="es-NI"`
- ✅ `hreflang` con es-NI, es, x-default
- ✅ Redirects www → non-www
- ✅ HTTP → HTTPS redirect
- ✅ HSTS header
- ✅ CSP con nonce

### Acciones pendientes (manuales)
1. **Registrar en Publisher Center** — ir a https://publishercenter.google.com
2. **Configurar secciones** — mapear categorías a secciones de Google News
3. **Enviar sitemap news** — añadir URL en Publisher Center
4. **Solicitar revisión** — después de configurar, solicitar revisión manual
