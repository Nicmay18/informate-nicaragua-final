# GOOGLE_READINESS_REPORT.md

## Fuente
Análisis sobre las últimas 50 noticias del backup real `scripts/backup/backup-noticias-2026-06-16.json`, complementado con revisión de código de rutas SEO.

## 1. Titles (títulos)

| Métrica | Valor |
|---|---:|
| Títulos > 60 caracteres | 16 / 50 |
| Promedio longitud | 58.3 caracteres |
| Títulos sin palabra clave (heurística) | 0 |

El sistema optimiza títulos en `lib/seo/title.ts` y los corta a 60 caracteres si exceden el límite.

## 2. Meta descriptions

| Métrica | Valor |
|---|---:|
| Sin meta descripción | 5 / 50 |
| Meta > 160 caracteres | 17 / 50 |
| Promedio longitud | 156.5 caracteres |

Si falta `metaDescription`, `lib/seo/meta.ts` genera una automáticamente a partir del contenido.

## 3. Canonical

* Cada artículo expone `alternates.canonical` en `generateMetadata`.
* Cada página legal y de confianza incluye `canonical` explícito.
* Estado: **Implementado**.

## 4. Schema (datos estructurados)

* `app/noticias/[slug]/page.tsx` inyecta `NewsArticle`, `BreadcrumbList` y `FAQPage` JSON-LD.
* `app/centro-confianza/page.tsx` inyecta `NewsMediaOrganization`.
* Estado: **Implementado**.

## 5. Authors

| Métrica | Valor |
|---|---:|
| Noticias con autor | 50 / 50 |
| Sin autor | 0 / 50 |

* Los perfiles de autores son estáticos en `lib/authors.ts` y se muestran en `/autores`.
* Cada artículo genera `author` en metadata OpenGraph y schema.

## 6. Fechas

| Métrica | Valor |
|---|---:|
| Con fecha de publicación | 50 / 50 |
| Con fecha de actualización | 47 / 50 |

## 7. Imágenes

| Métrica | Valor |
|---|---:|
| Con imagen principal | 50 / 50 |
| Con imagen destacada | 50 / 50 |
| Sin imagen | 0 / 50 |

## 8. Sitemap

* Ruta: `/sitemap.xml` generada por `app/sitemap.ts`.
* Incluye home, categorías, guías evergreen, autores y noticias publicadas.
* Regenera cada 1 hora (`revalidate = 3600`).

## 9. News Sitemap

* Ruta: `/news-sitemap.xml` generada por `app/news-sitemap.xml/route.ts`.
* Incluye noticias de los últimos 7 días.
* Cumple formato `urlset` con namespace `news`.

## 10. Flags de noindex

| Métrica | Valor |
|---|---:|
| Noticias con noindex | 0 / 50 |

## 11. Conclusión de Google Readiness

| Requisito | Estado |
|---|---|
| Títulos | REVISAR |
| Metas | REVISAR |
| Canonical | OK |
| Schema | OK |
| Authors | OK |
| Fechas | OK |
| Imágenes | OK |
| Sitemap | OK |
| News Sitemap | OK |

**Google Readiness: CON GAPS MENORES**
