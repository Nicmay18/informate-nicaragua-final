# EVIDENCIA DE CAMBIOS — Nicaragua Informate Master v1.0

## Contexto
- **Fecha del cierre:** 31 de julio de 2026
- **Commit base (HEAD):** `44d5218` — `Elimina panel_parent.html duplicado no usado`
- **Estado de los cambios:** en working tree, **sin commit**. El usuario decide cuándo hacer el commit final.

## git status --short
```
 M app/autor/[slug]/page.tsx
 M app/categoria/page.tsx
 M app/feed.xml/route.ts
 M app/guia/[slug]/page.tsx
 M app/layout.tsx
 M app/news-sitemap.xml/route.ts
 M app/nosotros/page.tsx
 M app/noticias/[slug]/page.tsx
 M app/page.tsx
 M components/Footer.tsx
 M components/HomePagePro.tsx
 M components/LegalPageShell.tsx
 M components/SEO/JsonLdSchema.tsx
 M lib/data.ts
 M lib/formateo.ts
 M lib/sanitize.ts
 M lib/seo/schema.ts
 M middleware.ts
 M next.config.ts
 M public/panel.html
?? MASTER-RELEASE-v1.0.md
?? app/metodologia-editorial/
?? lib/nonce.ts
```

## git log --oneline -10
```
44d5218 (HEAD -> master) Elimina panel_parent.html duplicado no usado
682f050 (origin/master, origin/HEAD)  fix:evitar-sufijos-lugar-en-titulos-meni
910e7b1  fix:no-agregar-bullet-al-titulo-en-lista-admin
931c289  feat:score-maestro-100-cuando-meni-aprueba-todas
bb1ec20 fix:alinear-quality-gate-con-editorial-brain
9464365 feat:meni-perfil-sucesos-seis-puntos
f75ddca feat:meni-regla-repeticion-estructura-titulo
b4b3837 fix:pulir-relacionadas-articulo
5cc1a33 fix:css-articulo-imagenes-mas-profesional
ac56b76 fix:csp-quitar-nonce-style-src
```

## Tabla de cambios de código

| Cambio | ¿Implementado? | Archivo(s) | Evidencia |
|---|---|---|---|
| CSP con nonce | ✅ | `middleware.ts`, `lib/nonce.ts`, `app/layout.tsx`, `app/page.tsx`, `app/noticias/[slug]/page.tsx`, `app/guia/[slug]/page.tsx`, `app/nosotros/page.tsx`, `app/autor/[slug]/page.tsx`, `components/SEO/JsonLdSchema.tsx` | `middleware.ts` genera `nonce` y lo pone en `script-src`; `lib/nonce.ts` exporta `getCspNonce()`; cada página con `dangerouslySetInnerHTML` aplica `nonce={nonce}`. |
| DOMPurify sanitizer | ✅ | `lib/sanitize.ts` | Reemplaza lógica manual por `isomorphic-dompurify`. |
| `normalizeEditorialTitle()` | ✅ | `lib/formateo.ts`, `lib/data.ts`, `lib/seo/schema.ts`, `app/noticias/[slug]/page.tsx`, `app/feed.xml/route.ts`, `app/news-sitemap.xml/route.ts` | Función nueva en `lib/formateo.ts`; usada en `mapDocToNoticia`, JSON-LD y feeds. |
| ISR 300 s / 3600 s | ✅ | `app/page.tsx`, `app/noticias/[slug]/page.tsx`, `app/categoria/page.tsx`, `lib/data.ts` | `revalidate` y tiempos de `unstable_cache` ajustados. |
| Schema 1200 px Discover | ✅ | `lib/seo/schema.ts` | `getHeroImageUrl(article.imagen, 1200)` en imagen `NewsArticle`. |
| Hero 1200 px | ✅ | `components/HomePagePro.tsx` | `getHeroImageUrl(hero.imagen, 1200)` y `sizes="(max-width: 1200px) 100vw, 1200px"`. |
| Metodología editorial | ✅ | `app/metodologia-editorial/page.tsx` | Archivo creado; aparece como `?? app/metodologia-editorial/` en `git status`. |
| Correcciones | ✅ (preexistente) | `app/correcciones/page.tsx` | No modificado en este ciclo; ya existía en el repo. |
| Footer actualizado | ✅ | `components/Footer.tsx`, `components/LegalPageShell.tsx` | Enlace `/metodologia-editorial` agregado en ambos footers. |
| Schema actualizado | ✅ | `lib/seo/schema.ts` | `normalizeEditorialTitle` en `headline` y breadcrumb. |
| `next.config.ts` ESLint | ✅ | `next.config.ts` | `ignoreDuringBuilds: false`. |
| Build exitoso | ✅ | Salida de `npm run build` | Exit code `0` con `NODE_OPTIONS='--max-old-space-size=8192'`. |
| Documentación release | ✅ (doc) | `MASTER-RELEASE-v1.0.md` | Archivo nuevo; no es código, es el documento de cierre. |

## Archivos nuevos (untracked)
- `lib/nonce.ts`
- `app/metodologia-editorial/page.tsx`
- `MASTER-RELEASE-v1.0.md`

## Evidencia por archivo

A continuación se incluyen los fragmentos reales que demuestran que cada cambio existe en el código **hoy**, en el working tree.

### `lib/nonce.ts` (nuevo)
```typescript
import { headers } from 'next/headers';

export async function getCspNonce(): Promise<string> {
  const h = await headers();
  return h.get('x-nonce') ?? '';
}
```

### `middleware.ts` — CSP con nonce
```typescript
const nonce = generateNonce();
request.headers.set('x-nonce', nonce);

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com ...`,
  "img-src 'self' data: blob: https:",
  `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' ...`,
```

### `app/layout.tsx` — consume nonce
```typescript
import { getCspNonce } from '@/lib/nonce';

const nonce = await getCspNonce();

<style nonce={nonce} dangerouslySetInnerHTML={{ __html: criticalCss }} />
<script type="application/ld+json" nonce={nonce} ... />
<script type="application/ld+json" nonce={nonce} ... />
```

### `lib/sanitize.ts` — DOMPurify
```typescript
import DOMPurify from 'isomorphic-dompurify';
```

### `lib/formateo.ts` — `normalizeEditorialTitle()`
```typescript
export function normalizeEditorialTitle(title: string): string {
  if (!title) return title;
  return title
    .replace(/\s*-\s*Managua\s*$/i, '')
    ...
```

### `lib/data.ts` — uso de `normalizeEditorialTitle`
```typescript
import { capitalizeFirst, normalizeEditorialTitle } from './formateo';

titulo: normalizeEditorialTitle(capitalizeFirst(data.titulo || '')),

const titulo = normalizeEditorialTitle(capitalizeFirst(data.titulo || ''));
```

### `lib/seo/schema.ts` — schema 1200 px y títulos normalizados
```typescript
import { normalizeEditorialTitle } from '../formateo';

headline: normalizeEditorialTitle(article.titulo),

const absoluteImageUrl = toAbsoluteUrl(getHeroImageUrl(article.imagen, 1200) || article.imagen);

{
  '@type': 'ImageObject',
  url: absoluteImageUrl,
  width: 1200,
  height: 675,
  ...
}

name: normalizeEditorialTitle(articleTitle),
```

### `app/page.tsx` — ISR 300 s
```typescript
export const revalidate = 300; // 5 minutos para un medio de noticias
```

### `app/noticias/[slug]/page.tsx` — ISR 300 s + nonce
```typescript
import { getCspNonce } from '@/lib/nonce';

export const revalidate = 300;

const nonce = await getCspNonce();

<script type="application/ld+json" nonce={nonce} ... />
```

### `components/HomePagePro.tsx` — hero 1200 px
```typescript
const heroImg = hero ? getHeroImageUrl(hero.imagen, 1200) : FALLBACK_IMAGE;

<Image
  src={heroImg}
  alt={hero.titulo}
  fill
  priority
  sizes="(max-width: 1200px) 100vw, 1200px"
  style={{ objectFit: 'cover' }}
/>
```

### `components/Footer.tsx` — enlace metodología
```tsx
<li><NoPrefetchLink href="/metodologia-editorial">Metodología Editorial</NoPrefetchLink></li>
```

### `next.config.ts` — ESLint activo en build
```typescript
eslint: {
  ignoreDuringBuilds: false,
},
```

### `app/feed.xml/route.ts` — títulos normalizados en RSS
```typescript
import { normalizeEditorialTitle } from '@/lib/formateo';

title: normalizeEditorialTitle(d.titulo as string),
```

### `app/news-sitemap.xml/route.ts` — títulos normalizados en sitemap de noticias
```typescript
import { normalizeEditorialTitle } from '@/lib/formateo';

<news:title>${escapeXml(normalizeEditorialTitle(article.titulo))}</news:title>
```

### `app/metodologia-editorial/page.tsx` (nuevo)
```typescript
export const metadata: Metadata = {
  title: 'Metodología Editorial',
  description: 'Proceso de verificación, fuentes, estándares de calidad y criterios editoriales de Nicaragua Informate.',
  alternates: { canonical: 'https://nicaraguainformate.com/metodologia-editorial' },
};
```
