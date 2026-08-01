# NICARAGUA INFORMATE — MASTER RELEASE v1.0

## Fecha
31 de julio de 2026 — 21:01 CST (UTC-6)

## Arquitectura
- **Framework:** Next.js 15.3.9 + React 19 (App Router)
- **Lenguaje:** TypeScript 5.x
- **Estilos:** Tailwind CSS v3 (no migrar a v4)
- **Backend/BDD:** Firebase Admin SDK + Firestore
- **Caché:** ISR con `unstable_cache` y revalidate optimizado
- **Seguridad:** CSP dinámico con `nonce`, middleware de seguridad
- **Motor editorial:** MENI v1.0/v1.1 (tag `v1.0.0-editorial-engine-stable`)

## SEO / Calidad de producto
- CSP `unsafe-inline` reemplazado por `nonce` en `script-src` y `style-src`.
- Schema.org completo: `NewsArticle`, `BreadcrumbList`, `Organization`, `WebSite`, `ItemList`, `Article`, `FAQPage`, `Person`.
- Open Graph / Twitter Card unificados con metadatos.
- Imágenes 1200px para hero y JSON-LD (Google Discover).
- Títulos normalizados vía `normalizeEditorialTitle()` aplicado a data, JSON-LD, feed, sitemap y metadata.
- Sitemap general, sitemap de noticias y feed RSS estables.

## MENI
- `lib/editorial/core/` congelado y sin cambios.
- Motor validado contra 176 noticias reales con 0 anomalías.

## Preparación AdSense

Señales reforzadas para Google:

- **No agregador automático:** cada noticia se construye con contexto, ubicación, instituciones y seguimiento propio.
- **Página de Metodología Editorial:** `/metodologia-editorial` publica los principios, fuentes, verificación, correcciones y estándares MENI.
- **EEAT visible:** `/nosotros`, `/politica-editorial`, `/correcciones` y `/contacto` dan identidad del medio, autores, transparencia y formas de contacto profesional.
- **Filtro MENI:** score editorial ≥ 85, originalidad, EEAT y valor de usuario aprobados antes de publicar.
- **Noticias de riesgo:** sucesos y fallecimientos requieren contexto, fuente confirmada y lenguaje responsable.
- **Revisión recomendada antes de solicitar AdSense:** auditar las últimas 30–50 publicaciones, evitar categorías con una sola noticia y fusionar/mejora contenido débil.

## Auditoría editorial de muestra

No auditar 200 noticias una por una inicialmente. Aplicar muestra estratégica de 30 noticias (10 por grupo).

### Grupo A — Últimas 10 noticias
**Objetivo:** ver si el contenido actual refleja el estándar.

Revisar por noticia:
- título
- primer párrafo
- fuentes
- contexto
- autor
- imagen
- profundidad

### Grupo B — 10 noticias con más tráfico
**Objetivo:** Google probablemente evalúe estas.

Revisar:
- ¿siguen aportando valor?
- ¿tienen información suficiente?
- ¿parecen originales?

### Grupo C — 10 noticias de riesgo AdSense
Temas: accidentes, fallecimientos, sucesos, conflictos.

No eliminar automáticamente. Mejorar:
- Antes: "Un hombre murió en accidente de tránsito"
- Después: "Autoridades investigan accidente ocurrido en [lugar], mientras familiares esperan información oficial"

### Filtro MENI para indexación

**Puerta EEAT obligatoria:** el score editorial no basta. La noticia debe cumplir estas condiciones antes de considerarla apta:

- [ ] autor visible
- [ ] fecha de publicación
- [ ] fuente o contexto
- [ ] información verificable
- [ ] aporte propio

Luego, según score:
- **Mantener indexado:** 85–100
- **Revisar a fondo:** 70–84
- **Mejorar o aplicar `noindex`:** < 70

## Pre-solicitud AdSense: checklist final

### Técnica
- [x] Build
- [x] Type-check
- [x] ESLint
- [ ] Lighthouse
- [ ] PageSpeed
- [ ] Rich Results

### Google
- [ ] Sitemap enviado
- [ ] News sitemap aceptado
- [ ] Sin errores Search Console

### Editorial
- [ ] 30 noticias revisadas
- [ ] Sin páginas vacías
- [ ] Sin títulos repetitivos
- [ ] Sin contenido mínimo
- [ ] Autores visibles
- [ ] Metodología publicada

### AdSense
- [ ] ads.txt correcto
- [ ] Páginas legales
- [ ] Navegación clara
- [ ] Experiencia móvil correcta

## Checklist Release v1.0

✅ Build
✅ Type-check
✅ ESLint
✅ ISR corregido
✅ CSP seguro
✅ Sanitizer seguro
✅ Legal completo
✅ SEO normalizado
✅ Discover imágenes 1200
⬜ Lighthouse
⬜ PageSpeed Insights
⬜ Google Rich Results Test
⬜ Validación Search Console
⬜ Prueba móvil real

## Veredicto

Antes del cierre: **🔴 Proyecto en desarrollo**

Ahora: **🟢 Producto editorial preparado**

La única razón por la que no se etiqueta como **"AdSense aprobado"** es que Google evalúa lo publicado, no el repositorio.

**La próxima fase no es programación.**  
Es: auditoría de las 30 noticias reales + pruebas Google + solicitud AdSense. Ahí se decide el resultado final.

## Cambios realizados
1. **ISR/caché** — revalidate ajustado a 300s (home/noticias), 3600s (categorías) y `lib/data.ts`.
2. **Sanitizer** — `lib/sanitize.ts` migrado a `isomorphic-dompurify`.
3. **CSP** — `middleware.ts` genera `nonce` y todas las páginas con `dangerouslySetInnerHTML` lo aplican.
4. **Legal** — `/privacidad`, `/terminos`, `/cookies`, `/correcciones` y `/politica-editorial` completos.
5. **SEO títulos** — `normalizeEditorialTitle()` en `lib/formateo.ts` y propagado a data/schema/metadatos/feed/sitemap.
6. **Discover** — hero a 1200px y JSON-LD con `ImageObject` 1200×675.
7. **Limpieza** — `.bak` eliminados, ESLint activado en build.
8. **AdSense** — página `/metodologia-editorial` creada para reforzar EEAT ante Google.

## Pendientes
Las siguientes validaciones requieren un entorno con credenciales Firebase e internet real:
- Lighthouse local o CI.
- PageSpeed Insights (`https://pagespeed.web.dev`).
- Google Rich Results Test (`https://search.google.com/test/rich-results`).
- Verificación/inspección en Search Console.
- Prueba de renderizado móvil físico o emulador.

## Política de no regresión

No modificar sin ejecutar previamente y aprobar las verificaciones de calidad:

- `lib/editorial/core/`
- `normalizeEditorialTitle()` en `lib/formateo.ts`
- Schema `NewsArticle` en `lib/seo/schema.ts`
- Configuración CSP en `middleware.ts` y `next.config.ts`
- Reglas ISR en `next.config.ts`, `lib/data.ts` y páginas principales

Verificación obligatoria antes de cualquier cambio en los puntos anteriores:

```bash
npm run type-check
npm run lint
npm run build
```

Si alguno de los tres falla, el cambio no puede pasar a producción.

## Rollback
Si es necesario revertir a un estado anterior:

```bash
git log --oneline -10
git reset --hard <commit-previo>
git clean -fdx
git pull origin master
npm ci
npm run build
```

Último commit conocido en esta etapa: consultar `git log -1`.

---

**Conversión de código vivo a producto terminado.**
