# Auditoría SEO Completa — Nicaragua Informate

**Fecha:** 23 de mayo de 2026
**Auditor:** Guardián de Calidad SEO
**Dominio:** https://nicaraguainformate.com

---

## Resumen Ejecutivo

| Categoría | Errores Críticos | Errores Medios | Advertencias |
|-----------|------------------|----------------|--------------|
| Metadata | 2 | 3 | 2 |
| Contenido | 1 | 3 | 1 |
| Técnico | 1 | 1 | 2 |
| **TOTAL** | **4** | **7** | **5** |

**Estado general:** RECHAZADO para publicación masiva. Requiere correcciones antes de escalar tráfico.

---

## 🔴 ERRORES CRÍTICOS (Corregir antes de publicar)

### 1. FAQ Schema hardcoded en TODOS los artículos

**Archivo:** `app/noticias/[slug]/page.tsx` (líneas 143-180)

**Problema:** El schema de FAQ sobre "anulación de récord policial" está hardcodeado y se inyecta en **TODOS** los artículos, no solo en los que tratan ese tema. Google puede penalizar por structured data irrelevante.

```typescript
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta anular el récord policial en Nicaragua 2026?',
      // ... FAQ hardcoded sobre récord policial
    },
  ],
};
```

**Impacto:** Penalización de Google por datos estructurados engañosos (violación de guidelines).

**Solución:** Eliminar el FAQ schema hardcodeado o generarlo dinámicamente desde el contenido del artículo.

---

### 2. Meta descripción homepage menciona categorías no existentes

**Archivo:** `app/page.tsx` (línea 10)

**Problema:** La meta descripción menciona "política" y "cultura" que NO son categorías principales del menú.

```
"Portal de noticias de Nicaragua... política, economía, deportes, tecnología, sucesos y cultura."
```

**Categorías REALES del menú:** Nacionales, Sucesos, Internacionales, Tecnología, Economía, Deportes.

**Impacto:** Confusión para Google sobre el enfoque del sitio. Dilución de relevancia temática.

**Solución:** Reescribir meta descripción usando SOLO las 6 categorías del menú.

---

### 3. Schema JSON-LD duplicado en homepage

**Archivo:** `app/page.tsx` (líneas 45-97)

**Problema:** Se inyectan 3 schemas JSON-LD inline (ItemList, NewsMediaOrganization, WebSite) en el body del HTML. Aunque no es técnicamente incorrecto, aumenta el peso del HTML y podría consolidarse en el layout.

**Impacto:** Aumento innecesario de ~1.5 kB en cada carga de homepage.

**Solución:** Mover schemas globales (Organization, WebSite) al `layout.tsx`.

---

### 4. Categoría "Espectáculos" mencionada en múltiples lugares

**Archivos afectados:**
- `app/categoria/page.tsx` (línea 9): "Sucesos, Nacionales, Deportes, Internacionales, Tecnología y **Espectáculos**"
- `app/categoria/[slug]/page.tsx` (línea 33): metadata completa para "espectaculos"
- `app/nosotros/page.tsx` (línea 100): lista de categorías incluye Espectáculos
- `app/noticias/[slug]/page.tsx` (línea 26): NOTICIA_TIPOS incluye 'Espectáculos'

**Problema:** "Espectáculos" no está en las categorías principales del menú (según reglas del usuario: Nacionales, Sucesos, Internacionales, Tecnología, Economía, Deportes).

**Impacto:** Inconsistencia en la arquitectura temática del sitio.

---

## 🟠 ERRORES MEDIOS (Corregir esta semana)

### 5. Meta descripción genérica en /noticias

**Archivo:** `app/noticias/page.tsx` (línea 14)

```
description: `Noticias de ${cat} en Nicaragua.`
```

**Problema:** Descripción demasiado corta y genérica. No incluye palabras clave ni llamado a la acción.

**Solución:** `Últimas noticias de ${cat} en Nicaragua. Cobertura periodística verificada desde Managua.`

---

### 6. Título de categoría "Nacionales" menciona "Política"

**Archivo:** `app/categoria/[slug]/page.tsx` (línea 17)

```
titulo: 'Noticias Nacionales de Nicaragua | Política, Economía y Sociedad'
```

**Problema:** Menciona "Política" que no es categoría principal del menú.

**Solución:** `Noticias Nacionales de Nicaragua | Actualidad y Sociedad`

---

### 7. Homepage tiene H1 oculto para SEO

**Archivo:** `app/page.tsx` (líneas 40-43)

**Problema:** El H1 está dentro de una sección con clase `visually-hidden`. Aunque común para SEO, el contenido es extenso (47 palabras) y podría considerarse keyword stuffing.

```html
<section className="visually-hidden" aria-label="Introduccion SEO">
  <h1>Noticias de Nicaragua en tiempo real — Nicaragua Informate</h1>
  <p>Nicaragua Informate es el portal...</p>
</section>
```

**Impacto:** Posible penalización por contenido oculto si Google lo detecta como manipulación.

**Solución:** Acortar el texto a máximo 25 palabras o hacer visible la sección.

---

### 8. Nosotros page menciona "espectáculos" como categoría

**Archivo:** `app/nosotros/page.tsx` (línea 29)

```
Publicamos contenido diario sobre sucesos, noticias nacionales, deportes, internacionales, tecnología y espectáculos
```

**Problema:** Menciona categoría que no está en el menú principal.

---

### 9. Título de categoría "Economía" no existe en CATEGORIA_META

**Archivo:** `app/categoria/[slug]/page.tsx` (líneas 11-35)

**Problema:** No hay metadata definida para la categoría "economia". Usará fallback genérico.

**Impacto:** Menor CTR en resultados de búsqueda para categoría Economía.

---

### 10. OpenGraph image usa logo.png de 512x512

**Archivo:** `app/categoria/[slug]/page.tsx` (línea 69)

```
images: [{ url: `${SITE_URL}/logo.png`, width: 512, height: 512, alt: 'Nicaragua Informate' }]
```

**Problema:** La imagen OG debería ser 1200x630 para mostrarse correctamente en redes sociales.

---

## 🟡 ADVERTENCIAS (Mejorar cuando sea posible)

### 11. Legal pages tienen estilos inline masivos

**Archivos:** `privacidad/page.tsx`, `terminos/page.tsx`, `politica-editorial/page.tsx`, `cookies/page.tsx`

**Problema:** Cada página legal tiene ~150 líneas de estilos inline repetidos. Esto viola DRY y dificulta mantenimiento.

**Impacto:** Mantenimiento difícil, inconsistencia visual.

**Solución:** Crear componente `LegalPageLayout` con estilos compartidos.

---

### 12. No hay breadcrumb schema en homepage

**Archivo:** `app/page.tsx`

**Problema:** El homepage no tiene breadcrumb schema (aunque es opcional para página raíz).

---

### 13. Descripciones OG de categoría son genéricas

**Archivo:** `app/categoria/page.tsx` (línea 17)

```
description: 'Explora todas las secciones de Nicaragua Informate.'
```

**Problema:** Descripción OG demasiado corta (7 palabras).

---

### 14. Nosotros page no usa ProLayout

**Archivo:** `app/nosotros/page.tsx`

**Problema:** La página nosotros no está envuelta en ProLayout, por lo que no tiene header/footer/radio bar del sitio.

**Impacto:** Experiencia inconsistente para el usuario.

---

### 15. Keywords hardcoded en layout

**Archivo:** `app/layout.tsx` (línea 33)

```
keywords: ['Nicaragua', 'noticias Nicaragua', 'actualidad Nicaragua', 'periodismo Nicaragua', 'Managua', 'Noticias de hoy']
```

**Problema:** Keywords son irrelevantes para SEO moderno (Google ignora meta keywords).

**Impacto:** Ninguno para SEO, pero aumenta HTML innecesariamente.

---

## ✅ LO QUE ESTÁ BIEN

1. **Estructura H1:** Cada página tiene exactamente 1 H1
2. **Canonical URLs:** Todas las páginas tienen canonical definido
3. **Schema.org:** JSON-LD implementado correctamente (Organization, WebSite, Article, Breadcrumb)
4. **OpenGraph:** OG tags completos con imágenes, títulos y descripciones
5. **Twitter Cards:** Implementados con imágenes
6. **Alt attributes:** Imágenes principales tienen alt descriptivo
7. **URL amigables:** Slugs con guiones, sin parámetros
8. **Responsive:** Viewport configurado correctamente
9. **Sitemap:** Sitemap.xml y news-sitemap.xml generados
10. **RSS:** Feed RSS disponible
11. **Robots:** index, follow configurado
12. **Tema:** data-theme implementado para modo oscuro

---

## 📋 Checklist de Correcciones Prioritarias

| Prioridad | Acción | Archivo | Tiempo |
|-------------|--------|---------|--------|
| 🔴 Alta | Eliminar FAQ schema hardcodeado | `noticias/[slug]/page.tsx` | 10 min |
| 🔴 Alta | Corregir meta descripción homepage | `page.tsx` | 5 min |
| 🔴 Alta | Eliminar menciones de "Espectáculos" | `categoria/page.tsx`, `nosotros/page.tsx` | 10 min |
| 🔴 Alta | Corregir título categoría Nacionales | `categoria/[slug]/page.tsx` | 5 min |
| 🟠 Media | Mejorar meta descripción /noticias | `noticias/page.tsx` | 5 min |
| 🟠 Media | Agregar metadata para Economía | `categoria/[slug]/page.tsx` | 5 min |
| 🟠 Media | Crear imagen OG 1200x630 para categorías | `public/` | 30 min |
| 🟠 Media | Acortar texto SEO oculto | `page.tsx` | 5 min |
| 🟡 Baja | Consolidar estilos legal pages | Nuevo componente | 1 hora |
| 🟡 Baja | Eliminar meta keywords obsoletas | `layout.tsx` | 2 min |

---

## 🎯 Meta: Pasar de RECHAZADO a APROBADO

Para que el sitio esté APROBADO para publicación masiva:

1. Corregir los 4 errores críticos
2. Corregir al menos 4 de los 7 errores medios
3. Verificar en Google Search Console que no hay errores de structured data
4. Validar en PageSpeed Insights > 90 en móvil

**Tiempo estimado:** 2-3 horas de trabajo
