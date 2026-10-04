# ARTICLE PAGE — Documento final (NI 4.0)

## Arquitectura

- Ruta: `app/noticias/[slug]/page.tsx` (Server Component, `revalidate = 300`)
- Renderer: `components/ArticlePage.tsx` (`'use client'`, estilos inline + `app/article-page.css`)
- Pipeline de contenido:
  ```
  noticia.contenido (Firestore)
    → injectTocIds        (ids en H2/H3 reales)
    → enhanceArticleHtml  (links externos nofollow+_blank, img lazy+decoding)
    → editorialCleanup    (dedup de oraciones, muletillas; omite structural en notas sensibles)
    → injectInternalLinks (máx 2 "Si te interesa")
    → sanitizeArticleHtml (whitelist de tags/atributos — XSS safe)
    → dangerouslySetInnerHTML
  ```
- Metadata: `generateMetadata` — title/descripcion/canonical/OG/Twitter/robots/JSON-LD (Article + Breadcrumb + Organization + WebSite con nonce CSP)
- Autoridad editorial: `isPublicArticle` gate + redirect `permanentRedirect` si el slug cambió

## Componentes

| Componente | Rol | Cuándo aparece |
|---|---|---|
| ReadingProgress | barra de lectura | siempre |
| ShareBar floating + chips | FB/WA/TG/X/copiar | siempre (flotante + final) |
| KeyPoints | puntos clave | ≥2 puntos válidos (≥40c, no duplican título/resumen) |
| AudioButton (lazy) | TTS navegador | siempre |
| AdsenseUnit ×3 (lazy) | rectangle / in-article / autorelaxed | siempre |
| TOC | "En este artículo" | ≥4 H2/H3 reales y ≥500 palabras |
| PullQuote (lazy) | cita destacada | si hay párrafo citable |
| Fuentes | fuente + complementarias | si hay datos |
| AuthorCard | firma | siempre |
| NewsletterSignup | captación | siempre |
| Lea también | relacionados | máx 3 (excluye inline) |
| SupportMedium | apoyo | ≥500 palabras |

## Layout

- `.article-page`: `max-width 980px`, centrada, `overflow-x:hidden`
- Cuerpo: 940px a 1440px de viewport (verificado en producción), Merriweather, 1em base, line-height 1.85
- Hero: `aspect-ratio 16/9`, `max-height 460px` (280px en ≤480px), border-radius, sombra, caption solo si `pieFoto` real
- Sin sidebar — diseño de columna editorial única (la medida tipográfica es la correcta; los anuncios van inline y nunca alteran el grid)

## Responsive

Verificado en producción vía auditoría DOM (Playwright) en 360/390/768/1440/1920:

- `scrollWidth == clientWidth` en todos los breakpoints — **sin scroll horizontal**
- Defecto corregido: a ≤480px el logo nowrap + acciones del header (live-btn + search + hamburger) excedían 366px del inner → desborde de ~15px. Fix en `pro-design.css`: media ≤480px reduce gaps, oculta `ni-live-btn` (redundante con el menú), `wordmark 0.85rem`, `hamburger min-width 40px`.

## Imágenes

- Hero: `getResponsiveImageUrl` + `loading=eager` + `fetchPriority=high` + fallback `FALLBACK_IMAGE` onError
- Cuerpo: `enhanceArticleHtml` añade `loading=lazy decoding=async` a cada `<img>`
- **Fix raíz §8**: `sanitizeArticleHtml` despojaba `src` de `data:image/*` (el CMS embebe base64) → imágenes "desaparecían". Ahora permite `data:image/(png|jpeg|jpg|gif|webp|avif|bmp);base64` — `javascript:` y `data:text/html` siguen bloqueados. Beneficia a cualquier noticia histórica con imágenes embebidas.
- Sanitizer conserva `srcset`, `sizes`, `width`, `height`; `style` se elimina (CSS gobierna).

## Audio

- `AudioButton` — Web Speech API (`es-NI`, voz `es-*`), lazy-load.
- Copy del lector: "Escuchar esta noticia" / "Audio de la noticia" / "Lectura en voz alta disponible".
- Eliminado lenguaje interno: "Voz generada localmente — sin costos de servidor", "Usando síntesis de voz del navegador".
- Errores ya legibles ("Tu navegador no soporta lectura de voz…"); cleanup al desmontar/cambiar nota.

## Puntos clave

- Fuente: `noticia.puntosClave` (generado en el guardado).
- Filtro en render: ≥2 puntos, cada uno ≥40c, Jaccard <0.6 vs resumen y <0.7 vs título → nunca duplican ni se cortan.
- Componente `KeyPoints` con `aria-label`; React escapa (ningún HTML suelto).

## TOC

- `injectTocIds` toma solo H2/H3 **reales** del HTML (ids `toc-N`); se muestra si hay ≥4 ítems y ≥500 palabras. Anchors válidos por construcción.

## Publicidad

- 3 slots: rectangle 336×250 (post-keypoints, `minHeight 250` reserva CLS-safe), in-article fluid (post-cuerpo), autorelaxed (final). Lazy-loaded; width contenido en el flujo editorial — medido en producción: ningún slot altera el ancho del cuerpo ni produce overflow.

## Sharing

- `ShareBar` con URL/título encodeURIComponent: `facebook.com/sharer/sharer.php?u=`, `wa.me/?text=título — url`, `t.me/share/url`, `twitter.com/intent/tweet` + `navigator.clipboard`. Verificado en producción: 8 enlaces presentes y correctos.

## Fuentes

- Bloque "Fuentes" al final: "Cobertura propia" si `fuente` contiene el medio; "Fuente principal" + lista de `fuentesComplementarias`. Sin JSON, IDs ni metadatos internos.

## Relacionados

- "Lea también": máx 3, excluye los enlaces inline; imagen `OptimizedImage` o placeholder 📰, badge de categoría, título, fecha.

## SEO

- `generateMetadata`: `title` editorial (fuente de verdad — la plantilla SEO solo entra si el título original es severamente deficiente, score <50), descripción efectiva, canonical, OG completo (type=article, published/modified, section, imagen 1200×630), Twitter summary_large_image, robots `max-image-preview: large`, noindex cuando corresponde.
- JSON-LD: NewsArticle + BreadcrumbList + Organization + WebSite (nonce CSP).
- Fix: `generateOptimizedTitle` ya no concatena `contexto` que duplica palabras del título (eliminado el word-salad "…Nicaragua Dos mujeres").

## Performance

- Lazy: AudioButton, PullQuote, los 3 AdsenseUnit.
- Imágenes del cuerpo: lazy + decoding=async; hero eager+high.
- CSS muerto eliminado: `app/articulo.css` (clases `av-*` sin consumidores) ya no se importa en cada página de artículo.

## Accesibilidad

- A−/A+ con `aria-label` individual + `role="group" aria-label="Tamaño del texto"` (etiqueta "Texto" eliminada).
- Hamburger `aria-expanded`, landmarks (`nav` breadcrumb, `aside` autor/relacionados, `itemScope/itemType` NewsArticle), toc con `aria-label`, share con aria-labels, imágenes con `alt` (título o `pieFoto`).

## Compatibilidad histórica

- Renderer absorbe: HTML antiguo (sanitizer whitelist), imágenes `http`/`https`/relativas/`data:` (fix §8), sin imagen (placeholder), sin fuente (bloque omitido), sin puntos clave (omitido), notas sensibles (editorialCleanup respeta `isSensitiveArticle` + `CLEANUP_ALLOWED_SLUGS`).

## Tests

- `tests/article-page-final.test.ts` — data:image preservada + XSS bloqueado + título sin duplicación de contexto (5/5).
- Suite: **1266 tests / 108 archivos — PASS**. tsc 0 errores · lint 0 warnings (archivos tocados) · `npm run build` PASS.

## Evidencia visual

- Auditoría DOM Playwright contra producción (`ni-shots`/`ni-dom-audit`): 11 capturas antes/después + métricas por breakpoint.
- Antes: hscroll=true @390/360 (home, artículo, categoría); `title` "Dos mujeres mueren deja afectados en Nicaragua Dos mujeres"; `audioText=INTERNAL_LANG`; label TEXTO visible.
- Después (deploy `fd42d8b7`): hscroll=false en todos; title editorial correcto; `audio=OK_nuevo`; `textoLabel=0`; shareLinks=8; related=3; 0 imgs rotas en todas las páginas.

## Deployment

- Commit `fd42d8b7` → `origin/master` → Vercel producción `nicaraguainformate.com` verificado en vivo.
