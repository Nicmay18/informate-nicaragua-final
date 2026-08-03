# AUTHORITY_ENGINE_REPORT.md

## Resumen

Se implementó el **Authority Engine FASE 2** para fortalecer la confianza editorial, autoridad SEO y percepción profesional de Nicaragua Informate. Todos los cambios se construyeron sobre la arquitectura actual sin modificar MENI V3.2, EOS, NIOS, Home Ranking ni lógica de motores internos.

## Objetivo

Aumentar señales E-E-A-T (Experiencia, Competencia, Autoridad, Confianza) y ofrecer transparencia pública sobre metodología, autores, fuentes y correcciones.

## Cambios implementados

### 1. Página pública `/autoridad`

- **Metodología editorial**: sección con los 6 pasos del proceso (detección, verificación, redacción, revisión, publicación, actualización).
- **Transparencia**: sección "Cómo trabajamos" con política de correcciones, política de fuentes, separación información/opinión, uso responsable de IA y compromiso editorial.
- **Autores verificados**: tarjetas con foto, biografía, áreas de cobertura y experiencia.
- **JSON-LD**: `AboutPage`, `Organization`, `WebSite` y esquemas `Person` para cada autor (`knowsAbout`, `sameAs`, `worksFor`).
- Enlaces a `/correcciones`, `/politica-editorial` y `/contacto`.

### 2. Página `/correcciones` con registro público

- Se mantuvo la política de correcciones existente.
- Se agregó lectura dinámica de la colección `editor_corrections` de Firestore.
- Se une cada corrección con el título y slug del artículo correspondiente.
- Se muestra: fecha, artículo corregido, cambio realizado y motivo.

### 3. Autores mejorados

- `lib/authors.ts` ahora incluye `coverageAreas` y `experience`.
- Cada autor tiene áreas de cobertura y experiencia profesional.
- `app/autor/[slug]/page.tsx` muestra estas áreas y experiencia.
- Schema `Person` en la página de autor ya existía; ahora enriquecido en `/autoridad`.

### 4. Fuentes en noticias

- `lib/types.ts`: se agregaron `fuente` (string) y `fuentesComplementarias` (string[]) a `Noticia`.
- `lib/data.ts`: se mapean esos campos en listados y carga por slug.
- `components/ArticlePage.tsx`: sección visual "Fuentes" al final del artículo cuando existen.

### 5. "Actualizado por última vez"

- `ArticlePage` ya mostraba la fecha de actualización; se mantuvo visible con la etiqueta `Actualizado`.
- El componente `AuthorCard` también muestra `Publicado` y `Actualizado` en la tarjeta de autor.

### 6. JSON-LD EEAT en artículos

- `app/noticias/[slug]/page.tsx` ahora inyecta:
  - `Organization`
  - `WebSite`
  - `NewsArticle`
  - `BreadcrumbList`
  - `FAQPage` (cuando aplica)
- `lib/seo/schema.ts`: el `NewsArticle` ahora vincula el `author` con `@id`, `sameAs` (redes sociales) y `knowsAbout` (áreas de cobertura).

### 7. Módulo `Authority Health` en `/admin/nios`

- `lib/nios/command-center/authority-health.ts`: calcula un score 0-100 sobre 5 pilares:
  - autores completos
  - noticias con fuentes
  - artículos actualizados
  - páginas confianza
  - transparencia
- `lib/nios/command-center/types.ts`: nuevos tipos `AuthorityPillar` y `AuthorityHealth`; `BusinessCommandCenter` incluye `authority`.
- `lib/nios/command-center/index.ts`: `buildCommandCenter` y `getCommandCenter` incluyen el cálculo.
- `components/nios/command-center/AuthorityPanel.tsx`: panel UI con score, barras y veredicto.
- `components/nios/command-center/CommandCenterShell.tsx`: nueva pestaña "Authority" con icono `Award`.

## Archivos afectados

- `lib/types.ts`
- `lib/data.ts`
- `lib/authors.ts`
- `lib/correcciones.ts` (nuevo)
- `lib/seo/schema.ts`
- `lib/nios/command-center/authority-health.ts` (nuevo)
- `lib/nios/command-center/types.ts`
- `lib/nios/command-center/index.ts`
- `app/autoridad/page.tsx` (nuevo)
- `app/autoridad/layout.tsx` (nuevo)
- `app/correcciones/page.tsx`
- `app/autor/[slug]/page.tsx`
- `app/noticias/[slug]/page.tsx`
- `components/ArticlePage.tsx`
- `components/nios/command-center/AuthorityPanel.tsx` (nuevo)
- `components/nios/command-center/CommandCenterShell.tsx`

## Qué NO se modificó

- Ningún archivo de `lib/meni/`, `lib/eos/`, `lib/nios/` que implemente motores.
- No se alteró Home Ranking, NIOS Intelligence, MENI V3.2 ni EOS.
- No se tocó lógica de puntuación editorial.

## Validaciones

- `npx tsc --noEmit`: ✅
- `npm run build`: ✅
- `npm run test:merge`: ✅
