# Diseño — Invalidación granular de cachés (NO IMPLEMENTADO)

**Estado**: diseño para revisión. No desplegar sin autorización y sin
métricas de `metrics_daily` que confirmen las ráfagas.

## Problema medido

Cada publicación/edición ejecuta `revalidateTag('noticias')` (7 call sites).
Casi todas las cachés de datos comparten ese tag único:

| Cache | Tag actual | Docs/regen aprox |
|---|---|---|
| news_pool | `noticias` | ~200 |
| news_by_category (×6) | `noticias` | ~48-400 |
| article `_cachedGetBySlug` (×~750 slugs) | `noticias` | 1 + related_pool ~200 |
| related_pool (×categorías) | `noticias` | ~48-400 |
| news_paginated (×páginas) | `noticias` | ~96-700 |
| category counts/paginadas | `noticias` | ~24-96 |
| mas_leidas | `noticias`,`popular-news` | ~120 |
| homepage audit | `noticias` | ~200-270 |
| tema_articles/paginated (×6) | `noticias`,`temas` | ~100-540 (post-PR48) |
| feeds (×6 rutas) | (fetchFeedArticles, sin tag propio) | ~250 |
| sitemap_news | `sitemap-news-full` + paths | ~740 |

**Consecuencia**: una sola publicación invalida el detalle cacheado de
**las ~750 noticias**, todas las categorías (incluidas las no afectadas),
todos los temas y los feeds. Los crawlers que llegan después disparan
regeneraciones en ráfaga. Con ~4 publicaciones/día (medido: 11 en 3 días),
esto es candidato principal de la brecha lecturas-app vs Billing.

## Diseño propuesto

### Tags con scope

```
noticias:pool            — portada/listados globales (necesita invalidar siempre)
noticias:cat:<slug>      — news_by_category, related_pool, category_paginated de ESA categoría
noticia:<slug>           — _cachedGetBySlug de ESE artículo
noticias:page:<n>        — news_paginated global (o aceptar TTL 900s sin tag)
noticias:home            — homepage audit
noticias:feed            — los 6 feeds (comparten fetchFeedArticles)
noticias:sitemap         — sitemap_news
noticias:tema:<slug>     — tema_articles/paginated de ESE tema
autor:<slug>             — si existe caché por autor
```

### Reglas de invalidación por evento

**Publicación nueva** (con slug, categoría, `temas` calculado):
- `noticias:pool`, `noticias:home`, `noticias:feed`, `noticias:sitemap` — siempre (contenido global).
- `noticias:cat:<categoria>` — solo la categoría afectada.
- `noticias:tema:<t>` para cada t en `computeTemaSlugs(noticia)` — el campo
  `temas` ya existe (PR #48): invalidación exacta sin lecturas extra.
- `noticias:page:1` (la nueva noticia entra en página 1; páginas profundas
  por TTL).
- NO invalidar `noticia:<otros slugs>` — el detalle de otros artículos no
  cambia (related_links se gestionan aparte).
- `revalidatePath` puntuales se mantienen (/, /noticias, artículo, categoría,
  sitemaps) — son baratos.

**Edición de artículo existente**:
- `noticia:<slug>` siempre.
- Si cambió `categoria`: `noticias:cat:<vieja>` + `noticias:cat:<nueva>`.
- Si cambió `temas`: `noticias:tema:<viejos>` + `noticias:tema:<nuevos>`.
- pool/home/feed/sitemap igual que publicación.

**Borrado/archivado**: mismas reglas que edición + pool/home/feed/sitemap.

### Qué NO cambia

- TTLs de `unstable_cache` (red de seguridad).
- Contenido renderizado: las cachés devuelven los mismos datos; solo cambia
  CUÁNDO se regeneran.
- Frescura: una noticia nueva aparece al instante en portada/listado/
  feeds/sitemap y en SU categoría/temas — igual que hoy. Lo único que puede
  tardar hasta el TTL (≤900s) son listados de OTRAS categorías que no la
  contienen (correcto: no la contienen).

### Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Categoría mal etiquetada → noticia no aparece en su categoría | `categoryToSlug` ya es canónico en escritura; test de integración publicación→categoría. |
| `temas` desactualizado tras edición que cambia contenido | Las vías de escritura ya recalculan `temas` (PR #48); verificar en tests. |
| Categoría nueva sin tag previo | `revalidateTag` en tag inexistente es no-op seguro; el TTL cubre. |
| Algún consumidor olvida tag → contenido viejo hasta TTL | TTLs ≤900s acotan la deriva; auditoría de los ~15 call sites de revalidateTag. |

### Implementación estimada

- ~6 archivos: `lib/data.ts` (tags por función), `lib/topics.ts`,
  `lib/feed-articles.ts` (wrapper con tag), `app/api/admin/news*/route.ts`,
  `app/api/articles/route.ts`, `app/api/admin/guardar-directo/route.ts`.
- Tests: publicar → verificar tags invalidados (mock de revalidateTag).
- Rollback: revert del PR; las tags viejas pueden convivir temporalmente.

### Ganancia esperada (a medir, NO confirmada)

Si las ráfagas de publicación explican una fracción relevante de las
~1.66M reads/día del período PRE, la invalidación granular reduce las
regeneraciones post-publicación en ~60-80% (solo las claves afectadas).
Comparar `m.regen.*` por día de publicación vs días sin publicación en
`metrics_daily` antes de implementar.
