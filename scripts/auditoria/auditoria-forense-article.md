# AUDITORÍA FORENSE: ArticlePage.tsx vs Template Ideal

## Fecha: 2025-06-17
## Objetivo: Mapear gaps entre implementación actual y estructura HTML5 semántica profesional

---

## 1. ESTRUCTURA SEMÁNTICA (HTML5)

| Elemento | Template Ideal | ArticlePage.tsx Actual | Acción |
|----------|---------------|----------------------|--------|
| `<article>` | ✅ itemscope NewsArticle | ✅ Ya existe (línea 197) | Ninguna |
| `<header>` | ✅ Dentro de article | ❌ Falta | **AGREGAR** |
| `<h1>` | ✅ itemprop="headline" | ✅ Ya existe (línea 211) | Ninguna |
| `<figure>` | ✅ itemprop="image" ImageObject | ✅ Ya existe (línea 251) | Ninguna |
| `<figcaption>` | ✅ Dentro de figure | ✅ Ya existe (línea 265) | Ninguna |
| `<section>` articleBody | ✅ itemprop="articleBody" | ❌ Falta (contenido en div) | **AGREGAR** |
| `<footer>` tags | ✅ Etiquetas al final | ❌ Falta (tags en div) | **AGREGAR** |
| `<aside>` author | ✅ itemprop="author" Person | ❌ Falta (author en div) | **AGREGAR** |
| `<aside>` read-more | ✅ Lea además | ❌ Falta (nav en div plano) | **AGREGAR** |
| `<time>` datetime | ✅ ISO 8601 | ✅ Ya existe (línea 226) | Ninguna |
| Skip Link | ✅ href="#main-content" | ✅ Ya existe en layout.tsx | Ninguna |
| `<main>` | ✅ id="main-content" | ✅ Ya existe en layout.tsx | Ninguna |

**Resultado: 6/12 elementos semánticos faltan. Prioridad: Alta.**

---

## 2. MICRODATOS (Schema.org inline)

| Atributo | Template | Actual | Estado |
|----------|----------|--------|--------|
| itemscope itemType="NewsArticle" | ✅ | ✅ | OK |
| itemprop="headline" | ✅ | ✅ | OK |
| itemprop="description" | ✅ | ✅ | OK |
| itemprop="articleSection" | ✅ | ✅ | OK |
| itemprop="datePublished" | ✅ | ✅ | OK |
| itemprop="dateModified" | ✅ | ✅ | OK |
| itemprop="image" + ImageObject | ✅ | ✅ | OK |
| itemprop="articleBody" | ✅ | ❌ Falta en section | **AGREGAR** |
| itemprop="author" + Person | ✅ | ❌ Falta (solo en JSON-LD) | **AGREGAR** |
| itemprop="relatedLink" | ✅ | ❌ Falta | Opcional |

**Resultado: 8/10 atributos presentes. 2 faltan.**

---

## 3. CSS / ESTILOS

| Feature | Template | Actual | Estado |
|---------|----------|--------|--------|
| Variables CSS | ✅ 12+ variables | ✅ Ya existe en globals.css | OK |
| clamp() tipografía | ✅ title, body | ✅ Ya existe (línea 211) | OK |
| text-wrap: balance | ✅ h1 | ❌ Falta | **AGREGAR** |
| prefers-color-scheme | ✅ Dark mode | ✅ Ya existe en globals.css | OK |
| @media print | ✅ Oculta ads | ✅ Agregado hoy | OK |
| Critical CSS inline | ✅ Solo viewport | ✅ Ya existe en layout.tsx | OK |
| CSS deferido lazy | ✅ media="print" | ❌ No implementado | Opcional |
| .data-card / .data-table | ✅ Fichas técnicas | ❌ No existe | Opcional |

**Resultado: 6/8 OK. 2 mejoras posibles.**

---

## 4. ADSENSE

| Feature | Template | Actual | Estado |
|---------|----------|--------|--------|
| data-ad-layout="in-article" | ✅ 2 slots | ✅ Ya existe | OK |
| data-ad-format="fluid" | ✅ | ✅ | OK |
| Lazy loading (Suspense) | N/A | ✅ Ya existe | OK |

**Resultado: 100% OK.**

---

## 5. PERFORMANCE / LCP

| Feature | Template | Actual | Estado |
|---------|----------|--------|--------|
| Preconnect fonts | ✅ | ✅ Ya existe | OK |
| fetchpriority="high" img | ✅ | ✅ Ya existe | OK |
| loading="eager" img | ✅ | ✅ (priority={true}) | OK |
| width/height img | ✅ 1200x675 | ✅ (aspect-ratio) | OK |
| Inline critical CSS | ✅ | ✅ Ya existe | OK |

**Resultado: 100% OK.**

---

## 6. ACCESIBILIDAD

| Feature | Template | Actual | Estado |
|---------|----------|--------|--------|
| Skip link | ✅ | ✅ Ya existe | OK |
| `<main>` landmark | ✅ | ✅ Ya existe | OK |
| `<article>` landmark | ✅ | ✅ Ya existe | OK |
| `<header>` inside article | ✅ | ❌ Falta | **AGREGAR** |
| `<footer>` inside article | ✅ | ❌ Falta | **AGREGAR** |
| `<aside>` landmarks | ✅ | ❌ Falta | **AGREGAR** |
| ARIA labels | ✅ | ✅ Parcialmente | OK |

**Resultado: 5/7 OK.**

---

## RESUMEN EJECUTIVO

### Estado General: 78% Completado
- ✅ JSON-LD Schema.org (completo)
- ✅ Open Graph / Twitter Cards (completos)
- ✅ Canonical / Robots (completos)
- ✅ Imágenes optimizadas (width/height/fetchpriority)
- ✅ Critical CSS inline
- ✅ AdSense in-article + fluid
- ✅ Variables CSS + Dark mode
- ✅ Print styles
- ✅ Tablas semánticas

### Faltantes críticos (implementar ahora):
1. **`<header>`** envolviendo categoría + h1 + resumen + meta
2. **`<section itemProp="articleBody">`** envolviendo el cuerpo del artículo
3. **`<footer>`** envolviendo tags
4. **`<aside>`** envolviendo AuthorCard
5. **`<aside>`** envolviendo "Lea además" / navegación
6. **itemprop="author"** microdatos en la bio visible
7. **text-wrap: balance** en h1

### Faltantes opcionales:
8. CSS deferido con media="print" trick
9. Componente .data-card para fichas técnicas

---

## ACCIÓN RECOMENDADA

Implementar los 7 items críticos en `ArticlePage.tsx` mediante reemplazo de divs por elementos semánticos HTML5, preservando todos los estilos inline y funcionalidad existente.
