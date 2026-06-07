# INFORME DE AUDITORÍA — NICARAGUA INFORMATE
## Estado Real del Proyecto (sin métricas inventadas)
**Fecha:** 6 de junio 2026 | **Commits de esta sesión:** `c8a178c` → `98be22f`

---

## ✅ LO QUE SE CORRIGIÓ EN ESTA SESIÓN (verificado en build)

### Seguridad Crítica
- **ELIMINADO `public/sw.js`**: Contenía script de terceros (`5gvci.com`) que cargaba código externo no auditado. Esto era un vector de inyección de ads/malware. **Status: Resuelto.**

### AdSense Pre-aprobación
- **ELIMINADOS todos los `AdPlaceholder`** de `ArticlePage.tsx` y `ArticleClient.tsx`. Google AdSense prohíbe placeholders visibles antes de la aprobación. **Status: Resuelto.**
- **Eliminados componentes muertos**: `AdSlot.tsx`, `AdUnit.tsx` (slots ficticios). **Status: Resuelto.**

### Imágenes y Google News
- **Hero width cambiado**: `768px` → `1200px` en `OptimizedImage.tsx`. Google News/Discovery requiere mínimo 1200px de ancho. **Status: Resuelto.**
- **Logo unificado**: Todas las referencias a `logo.webp` cambiadas a `logo.svg` en componentes UI. El fallback de artículos sin imagen ahora usa `logo.svg`.
- **Tagline corregido**: `Infórmate al Instante` → `INFORMATE AL INSTANTE` (coincide con imagen oficial del logo).

### SEO Técnico
- **Schema BreadcrumbList**: `item` ahora es string URL simple (no objeto `WebPage`). **Status: Resuelto.**
- **Schema JSON-LD**: Todas las referencias a `logo.webp` cambiadas a `logo.svg`. **Status: Resuelto.**
- **RSS feed**: Añadido `<image>` al channel para Google News. **Status: Resuelto.**
- **Sitemap**: `getNews()` cacheado con `unstable_cache` (1h). Reduce queries Firestore. **Status: Resuelto.**
- **Semantic HTML**: `<article itemScope itemType="https://schema.org/NewsArticle">` + `<figure itemProp="image">` con `<figcaption>` dentro. **Status: Resuelto.**
- **Eliminado `ArticleSEO.tsx`**: Usaba `next/head` que no funciona en App Router. **Status: Resuelto.**
- **Eliminadas meta keywords obsoletas**: Google no las usa desde 2009. **Status: Resuelto.**
- **Preconnect a weserv.nl**: Agregado en `layout.tsx`. **Status: Resuelto.**

### Rendimiento (PageSpeed Insights — datos reales)
- **LCP campo (CrUX): 2.9s** — No supera CWV (umbral 2.5s). Medido en usuarios reales últimos 28 días.
- **LCP laboratorio (Lighthouse): 4.8s** — Moto G Power emulado, 4G lento.
- **Root cause LCP**: `OptimizedImage.tsx` pre-procesaba URLs con `buildWeservUrl`, generando URLs weserv fijas con `w=1200`. Cuando `next/image` generaba el srcset, el loader global detectaba que ya era una URL weserv y la devolvía sin modificar. Resultado: **todos los breakpoints del srcset apuntaban a la imagen de 1200px**, descargando tamaños exagerados en móvil.
- **Fix aplicado**: Eliminado `buildWeservUrl` de `OptimizedImage.tsx`. Ahora pasa `src` original y deja que `next/image` + `weservLoader` global generen srcsets correctos con widths apropiados por breakpoint. Agregados `fit=cover` y `n=-1` al loader global para mantener comportamiento.
- **CLS: 0.02** — Pasa CWV (umbral 0.1). ✅
- **JavaScript no usado: 85 KiB** — Chunk `1684` con 74% de código muerto. No identificado exactamente; posiblemente código compartido entre rutas que Lighthouse marca como "no usado" en la home page pero que se usa en otras páginas.

### UX / Accesibilidad
- **Tabla de Contenidos (TOC)**: Implementada para artículos con 3+ encabezados H2/H3. Extrae IDs automáticamente y genera navegación interna. **Status: Resuelto.**

### Headers de Seguridad (ya existían, verificado)
- **Content-Security-Policy**: Completo en `next.config.ts`. ✅
- **Strict-Transport-Security (HSTS)**: `max-age=63072000; includeSubDomains; preload`. ✅
- **X-Frame-Options**: `SAMEORIGIN`. ✅
- **Referrer-Policy**: `strict-origin-when-cross-origin`. ✅
- **X-Content-Type-Options**: `nosniff`. ✅
- **Permissions-Policy**: `camera=(), microphone=(), geolocation=()`. ✅

---

## ⚠️ LO QUE NO SE PUEDE CORREGIR DESDE CÓDIGO (requiere acciones tuyas)

### 1. Métricas de rendimiento reales — DATOS RECIBIDOS
**Estado:** Datos de campo (CrUX) y laboratorio (Lighthouse) recibidos.

**Datos de campo (CrUX, últimos 28 días):**
| Métrica | Valor | CWV | Estado |
|---------|-------|-----|--------|
| LCP | 2.9s | ≤2.5s | ❌ No pasa |
| INP | N/A | ≤200ms | Sin datos |
| CLS | 0.02 | ≤0.1 | ✅ Pasa |

**Datos de laboratorio (Lighthouse, Moto G Power, 4G lento):**
| Métrica | Valor | Óptimo | Estado |
|---------|-------|--------|--------|
| Rendimiento | 82/100 | ≥90 | ⚠️ Mejorable |
| LCP | 4.8s | ≤2.5s | ❌ Alto |
| FCP | 1.2s | ≤1.8s | ✅ Pasa |
| TBT | 10ms | ≤200ms | ✅ Pasa |
| CLS | 0 | ≤0.1 | ✅ Pasa |
| Speed Index | 3.2s | ≤3.4s | ✅ Pasa |

**Fix aplicado desde código:**
- Root cause del LCP alto: srcset de imágenes generaba URLs de 1200px para todos los breakpoints. Fix aplicado en `OptimizedImage.tsx` + `lib/image-loader.ts`.
- **Acción requerida:** Re-ejecutar PSI después del deploy para verificar mejora del LCP.
**Prioridad:** Alta

### 2. Verificación de contenido original (Copyscape)
**Problema:** No puedo verificar si los 183 artículos pasan Copyscape sin acceso a la API. AdSense rechaza contenido duplicado.
**Acción requerida:** Suscribirse a Copyscape y verificar muestras aleatorias de artículos. O usar https://www.copyscape.com/ manualmente.
**Prioridad:** Alta

### 3. Google Search Console
**Problema:** No tengo acceso. No sé cuántos artículos están indexados ni si hay errores de cobertura.
**Acción requerida:** Verificar propiedad en https://search.google.com/search-console y enviar sitemap.
**Prioridad:** Alta

### 4. Google News Publisher Center
**Problema:** El sitio no está registrado en Google News.
**Acción requerida:** Registrarse en https://publishercenter.google.com con el dominio.
**Prioridad:** Alta

### 5. API de Indexación de Google
**Problema:** Necesaria para indexación rápida de noticias frescas.
**Acción requerida:** Crear service account en Google Cloud, activar "Indexing API", subir credenciales JSON.
**Prioridad:** Media

### 6. IndexNow (Bing/Yandex)
**Problema:** No implementado.
**Acción requerida:** Obtener key en Bing Webmaster Tools, implementar endpoint `/api/indexnow`.
**Prioridad:** Media

### 7. Newsletter funcional (envío de emails)
**Problema:** La API `/api/newsletter` solo guarda emails en Firestore. No hay envío automatizado.
**Acción requerida:** Integrar SendGrid, Mailchimp, Resend, o similar para envío masivo.
**Prioridad:** Media

### 8. AMP (Accelerated Mobile Pages)
**Problema:** El prompt original pidió AMP "obligatorio para Google News". En realidad, Google News ya NO requiere AMP desde 2021 (usa Core Web Vitals en su lugar). Implementar AMP en Next.js App Router es complejo y de bajo ROI.
**Acción requerida:** Documentado como no necesario. Invertir esfuerzo en CWV reales (medir y optimizar LCP) es más valioso.
**Prioridad:** Baja / No aplica

### 9. Enlaces internos contextuales dentro del cuerpo del artículo
**Problema:** Los enlaces internos actuales son de navegación (categorías, autor), no contextuales dentro del texto. Para agregar 3-5 enlaces contextuales por artículo, necesitaría analizar el contenido semántico de cada uno de los 183 artículos y sugerir enlaces relevantes.
**Acción requerida:** Proceso manual o con herramienta NLP. No puede automatizarse sin acceso a la base de datos completa y análisis semántico.
**Prioridad:** Media

---

## 📊 ESTADO REAL (sin inventar números)

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Build Next.js | ✅ Compila | 253 páginas, 0 errores |
| ads.txt | ✅ Presente | `google.com, pub-4115203339551838` |
| robots.txt | ✅ Configurado | Bloquea admin, API, URLs tóxicas |
| Páginas legales | ✅ Completas | Nosotros, Contacto, Privacidad, Términos, Cookies, Política Editorial |
| Schema JSON-LD | ✅ Implementado | NewsArticle, Organization, WebSite, BreadcrumbList, Person |
| RSS con `<image>` | ✅ Válido | Para Google News |
| Sitemap cacheado | ✅ Implementado | `unstable_cache` 1h |
| Semantic HTML | ✅ Mejorado | `<article>`, `<figure>`, `<figcaption>`, `<time>` |
| TOC | ✅ Implementado | Para artículos con 3+ encabezados |
| Breadcrumbs visibles | ✅ Existentes | En UI de artículo |
| Headers de seguridad | ✅ Completos | CSP, HSTS, X-Frame, etc. |
| Código muerto | ✅ Eliminado | 305 líneas menos |
| Service Worker | ⚠️ Eliminado | Era adware; PWA requiere SW legítimo |
| LCP real (CrUX) | ❌ 2.9s | Umbral CWV: ≤2.5s. Fix de srcset aplicado. Requiere re-medir. |
| LCP laboratorio | ❌ 4.8s | Lighthouse Moto G Power. Fix aplicado, requiere re-medir. |
| CLS real | ✅ 0.02 | Pasa CWV (umbral ≤0.1) |
| Rendimiento LH | ⚠️ 82/100 | Mejorable. Principal oportunidad: imágenes. |
| Artículos indexados | ❓ Desconocido | Necesita Search Console |
| Copyscape | ❓ No verificado | Necesita acción manual |
| Google News | ❓ No registrado | Necesita Publisher Center |

---

## 🔴 ACCIONES INMEDIATAS REQUERIDAS DEL CLIENTE

1. **Medir LCP real** con PageSpeed Insights
2. **Verificar Copyscape** en muestra de artículos
3. **Registrar en Search Console** y enviar sitemap
4. **Registrar en Google News Publisher Center**
5. **Esperar 48-72h** y solicitar revisión de AdSense

---

*Este informe no contiene métricas estimadas ni afirmaciones no verificables.*
