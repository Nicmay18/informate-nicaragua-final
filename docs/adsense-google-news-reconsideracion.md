# Guía: Solicitar Reconsideración AdSense + Aplicar a Google News
## Nicaragua Informate — Junio 2026

---

## ESTADO ACTUAL DEL SITIO (CHECKLIST PRE-SOLICITUD)

### Antes de empezar
- [x] Score Maestro del panel: **100/100**
- [x] 163 noticias en base de datos
- [x] Thin content: **0%** (todas >= 350 palabras, promedio 588)
- [x] Sin imágenes faltantes: **0**
- [x] Sin autor faltante: **0**
- [x] Sin noindex activo: **0**
- [x] Títulos SEO: **100%** (163/163, 30-65 chars)
- [x] Meta descriptions: **100%** (163/163, 120-160 chars)
- [x] Links internos: **100%** (163/163 con related_links)
- [x] E-E-A-T: **100/100** (autoría, fuentes, estructura editorial)
- [x] Contenido fresco: 44 noticias < 7 días
- [x] 6 categorías activas

---

## PARTE 1: RECONSIDERACIÓN ADSENSE

### 1.1 Requisitos que cumplís (no enviar sin estos)

| Requisito AdSense | Estado | Evidencia |
|---|---|---|
| Política de contenido original | ✅ | 163 noticias propias, promedio 588 palabras |
| Sin thin content | ✅ | 0 noticias < 350 palabras |
| Navegación clara | ✅ | Menú por categorías, breadcrumbs en artículos |
| Política de privacidad | ⚠️ | VERIFICAR que existe `/politica-privacidad` |
| Páginas "Quiénes Somos" y "Contacto" | ⚠️ | VERIFICAR que existen y tienen datos reales |
| Sin contenido prohibido (violencia, adulto, drogas) | ✅ | Panel auditoría: 0 críticas |
| Velocidad de carga aceptable | ⚠️ | Testear en PageSpeed Insights |
| SSL/HTTPS | ✅ | `https://nicaraguainformate.com` |

### 1.2 Pasos para solicitar reconsideración

**Paso 1 — Verificar páginas legales**

Asegurate de que existan estas URLs:
- `https://nicaraguainformate.com/politica-privacidad`
- `https://nicaraguainformate.com/quienes-somos`
- `https://nicaraguainformate.com/contacto`

Si no existen, creálas HOY antes de enviar la solicitud.

**Paso 2 — Test de velocidad**

Andá a [PageSpeed Insights](https://pagespeed.web.dev/) y pegá:
```
https://nicaraguainformate.com
https://nicaraguainformate.com/noticias/[slug-de-una-noticia-reciente]
```

Meta mínima: **Móvil > 50, Desktop > 80**. Si está por debajo, optimizar imágenes (WebP, lazy loading) y reducir JS.

**Paso 3 — Acceder a AdSense**

1. Andá a [https://www.google.com/adsense/](https://www.google.com/adsense/)
2. Iniciá sesión con la cuenta de Google del sitio
3. Si te rechazaron antes, buscá el mensaje de rechazo y clickeá **"Solicitar reconsideración"**
4. Si no hay botón, andá a **"Política" → "Centro de políticas"** y buscá infracciones resueltas

**Paso 4 — Redactar mensaje de reconsideración (copiar y pegar, adaptar)**

```
Estimado equipo de Google AdSense,

Solicito reconsideración para nicaraguainformate.com.

El sitio es un medio de noticias digital de Nicaragua con contenido
editorial original producido por un equipo de periodistas. 

Cambios realizados desde la última revisión:
- Eliminamos todo contenido "thin" (<350 palabras). Actualmente: 0 artículos thin de 163 publicados. Promedio: 588 palabras.
- Implementamos autoría en 100% de las noticias (sin autor = 0).
- Optimizamos 100% de los títulos (30-65 caracteres) y meta descriptions (120-160 caracteres).
- Agregamos links internos en 100% de las noticias para mejorar navegación.
- Implementamos estructura editorial con E-E-A-T: autores identificados, fuentes citadas, fechas de actualización.
- Eliminamos contenido marcado como noindex que bloqueaba indexación.
- Verificamos que no hay contenido prohibido, violento, adulto ni drogas.

Páginas legales disponibles:
- Política de privacidad: https://nicaraguainformate.com/politica-privacidad
- Quiénes somos: https://nicaraguainformate.com/quienes-somos
- Contacto: https://nicaraguainformate.com/contacto

Dashboard de calidad interno: 100/100 en métricas de contenido, SEO y AdSense.

Agradezco su revisión.

Saludos,
[Nombre del responsable del sitio]
[Correo electrónico de contacto]
```

**Paso 5 — Enviar y esperar**

- Tiempo de respuesta típico: **2 días a 2 semanas**
- No enviar múltiples solicitudes. Esperar respuesta.
- Si rechazan de nuevo, leer el motivo específico y corregir antes de volver a intentar.

---

## PARTE 2: APLICAR A GOOGLE NEWS

### 2.1 Requisitos técnicos obligatorios

| Requisito | Estado | Acción |
|---|---|---|
| Dominio propio + HTTPS | ✅ | `nicaraguainformate.com` |
| Estructura de URLs permanentes | ✅ | Slugs estáticos `/noticias/{slug}` |
| Fechas claras en cada artículo | ✅ | Campo `fecha` en Firestore + `<time>` en HTML |
| Autores identificados | ✅ | Campo `autor` en 100% de noticias |
| Contacto del editor visible | ⚠️ | Verificar `/contacto` con email real |
| Página "Quiénes Somos" con info del equipo | ⚠️ | Verificar `/quienes-somos` |
| Sitemap de noticias | ✅ | `sitemap-news.xml` |
| Feeds RSS/Atom recomendado | ⚠️ | Crear si no existe |

### 2.2 Verificar markup técnico (hacer HOY)

**Test 1 — Rich Results Test**
1. Andá a [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)
2. Pegá URL de una noticia reciente: `https://nicaraguainformate.com/noticias/[slug]`
3. Verificar que detecte:
   - `NewsArticle` schema
   - `headline` (título)
   - `datePublished`
   - `dateModified` (si aplica)
   - `author` (nombre)
   - `image` (URL absoluta)
   - `publisher` (nombre + logo)

**Test 2 — Structured Data Testing Tool**
1. Andá a la misma herramienta
2. Pegá HTML fuente de una noticia
3. Verificar `BreadcrumbList` y `NewsArticle` sin errores

### 2.3 Requisitos editoriales Google News

| Requisito | Estado | Nota |
|---|---|---|
| Contenido original y oportuno | ✅ | Noticias diarias de Nicaragua |
| Transparencia de autoría | ✅ | Autor en cada noticia |
| No contenido copiado/duplicate | ✅ | Contenido propio |
| No clickbait engañoso | ✅ | Títulos validados 30-65 chars |
| Cobertura de interés general | ✅ | Sucesos, Nacionales, Deportes, etc. |
| Múltiples fuentes citadas cuando aplica | ✅ | Blockquotes y links externos en noticias |

### 2.4 Pasos para aplicar a Google News

**Paso 1 — Crear Publisher Center**

1. Andá a [https://publishercenter.google.com/](https://publishercenter.google.com/)
2. Iniciá sesión con la cuenta de Google del sitio
3. Clickeá **"Agregar propiedad"**
4. Escribí: `https://nicaraguainformate.com`
5. Verificar dominio (DNS o meta tag)

**Paso 2 — Configurar secciones**

En Publisher Center, agregar secciones que correspondan a las categorías:
- Sucesos
- Nacionales
- Deportes
- Tecnología
- Internacionales
- Cultura

Para cada sección, agregar la URL del feed o de la página de categoría:
```
https://nicaraguainformate.com/categoria/sucesos
https://nicaraguainformate.com/categoria/nacionales
```

**Paso 3 — Subir logo (MUY IMPORTANTE)**

Google News requiere logo en formato específico:
- **Rectangular**: 1200x300 px o 1200x600 px, fondo blanco o transparente
- **Cuadrado**: 1200x1200 px (opcional pero recomendado)
- Formato: PNG o JPG de alta calidad
- Sin texto pequeño ni detalles finos

**Paso 4 — Solicitar inclusión**

1. En Publisher Center, andá a **"Configuración" → "Información de la publicación"**
2. Completá:
   - Nombre: Nicaragua Informate
   - Idioma: Español
   - País: Nicaragua
   - Descripción: Medio de noticias digital de Nicaragua
3. Clickeá **"Solicitar inclusión en Google News"**
4. Tiempo de respuesta: **1-4 semanas**

**Paso 5 — Crear RSS/Atom feed (recomendado)**

Si no tenés feed, creá `app/feed.xml/route.ts` en Next.js o un archivo estático. Google News prefiere feeds para descubrimiento rápido.

Ejemplo mínimo de feed:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Nicaragua Informate</title>
    <link>https://nicaraguainformate.com</link>
    <description>Noticias de Nicaragua</description>
    <language>es</language>
    <item>
      <title>Título de la noticia</title>
      <link>https://nicaraguainformate.com/noticias/slug</link>
      <pubDate>Mon, 30 Jun 2026 06:00:00 GMT</pubDate>
      <author>autor@ejemplo.com (Nombre Autor)</author>
    </item>
  </channel>
</rss>
```

---

## PARTE 3: CHECKLIST PRE-ENVÍO (HACER MAÑANA ANTES DE SOLICITAR)

### Páginas obligatorias (verificar que existan y carguen)
- [ ] `https://nicaraguainformate.com/politica-privacidad`
- [ ] `https://nicaraguainformate.com/quienes-somos`
- [ ] `https://nicaraguainformate.com/contacto`

### Contenido de páginas legales
**Política de privacidad** debe mencionar:
- Qué datos recopilás (cookies, analytics)
- Cómo se usan esos datos
- Cómo contactar para dudas de privacidad

**Quiénes Somos** debe tener:
- Nombre del medio
- Misión/visión breve
- Nombre del editor/director (persona real)
- Ubicación física (ciudad, país)
- Email de contacto editorial

**Contacto** debe tener:
- Email real (no genérico tipo gmail si es posible, usar @nicaraguainformate.com)
- Teléfono (opcional)
- Formulario o email claro

### Velocidad
- [ ] PageSpeed Insights móvil > 50
- [ ] PageSpeed Insights desktop > 80

### Schema markup
- [ ] Rich Results Test pasa sin errores para `NewsArticle`
- [ ] `datePublished` y `author` están presentes
- [ ] `publisher` con `logo` incluido

### Sitemap
- [ ] `https://nicaraguainformate.com/sitemap.xml` accesible
- [ ] `https://nicaraguainformate.com/sitemap-news.xml` accesible
- [ ] Última modificación del sitemap: fecha reciente

---

## PARTE 4: SI TE RECHAZAN

### AdSense — motivos comunes y soluciones

| Motivo de rechazo | Causa probable | Solución |
|---|---|---|
| "Valor insuficiente" | Thin content o falta de páginas legales | Ya resuelto (100/100), verificar páginas legales |
| "Problemas de navegación" | Menús rotos o falta de categorías | Verificar que todas las categorías carguen |
| "Contenido copiado" | Duplicados internos o externos | Revisar canonical tags |
| "Tráfico invalidado" | Clicks propios o tráfico bot | No hacer clic en tus propios ads |

### Google News — motivos comunes

| Motivo | Solución |
|---|---|
| "No cumple con los estándares editoriales" | Revisar que haya autores reales, fuentes citadas, sin clickbait |
| "Problemas técnicos" | Revisar schema markup, feeds, sitemap |
| "Contenido insuficiente" | Necesitan ver publicación sostenida (semanas/meses). Asegurar 3-5 noticias/semana. |
| "Problemas de transparencia" | Mejorar "Quiénes Somos" y "Contacto" con datos reales |

---

## PARTE 5: MANTENIMIENTO POST-APROBACIÓN

### Si AdSense aprueba
- No modificar estructura del sitio drásticamente
- No poner más de 3 bloques de ads por página
- Seguir publicando contenido fresco (Google detecta sitios abandonados)
- Revisar el panel de AdSense cada semana para infracciones

### Si Google News aprueba
- Publicar mínimo 3-5 noticias por semana (ideal: diario)
- Mantener fechas actualizadas (`fechaActualizacion` en Firestore)
- No cambiar slugs de noticias publicadas (rompe URLs indexadas)
- Usar la herramienta "Editorial Content" en Publisher Center para destacar noticias importantes

---

## ENLACES DIRECTOS

- AdSense: https://www.google.com/adsense/
- Publisher Center: https://publishercenter.google.com/
- PageSpeed Insights: https://pagespeed.web.dev/
- Rich Results Test: https://search.google.com/test/rich-results
- Google Search Console: https://search.google.com/search-console

---

**Fecha de preparación:** 30 de junio de 2026
**Score del sitio:** 100/100
**Estado:** LISTO PARA ENVIAR (después de verificar páginas legales y PageSpeed)
