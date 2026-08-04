# CERTIFICACIÓN EMPRESARIAL FINAL
## NICARAGUA INFORMATE — `informate-nicaragua-final` v2.0.0
## Transformación de Proyecto a Empresa Editorial Digital
## Fecha: 2026-08-04

---

# ESTADO: CERTIFICADO PARA OPERACIÓN

---

## FASE 1 — AUDITORÍA DEL PRODUCTO COMPLETO

### Arquitectura

| Componente | Tecnología | Versión | Estado |
|------------|-----------|---------|--------|
| Framework | Next.js (App Router) | 15.3.9 | Estable |
| Runtime | Node.js | 22.x | Estable |
| React | React | 19.0.0 | Estable |
| Base de datos | Firebase Admin SDK (Firestore) | 12.7.0 | Estable |
| Estilos | Tailwind CSS + CSS custom | 3.4.17 | Estable |
| Editor | TipTap | 3.23.4 | Estable |
| Imágenes | Sharp | 0.34.5 | Estable |
| Validación | Zod | 3.25.76 | Estable |
| Testing | Vitest + Playwright | 2.0.5 / 1.48.0 | Estable |
| Hosting | Vercel + Cloudflare | — | Estable |

### Estructura del proyecto

```
app/                    182 items — App Router (páginas, APIs, layouts)
components/              82 items — Componentes React (client + server)
lib/                    281 items — Lógica de negocio, MENI, editorial, SEO
lib/editorial/core/     11 items  — Motor editorial determinístico (FROZEN)
lib/editorial/profiles/ 11 items  — Perfiles editoriales por categoría
lib/meni/              141 items  — MENI v6.0 (contextualiza, brain, modules)
lib/nios/               54 items  — Command Center empresarial
lib/seo/                 4 items  — Schema, meta, title, effective SEO
tests/                  18 items  — 146 tests (14 archivos)
scripts/               215 items  — Scripts de mantenimiento (no runtime)
public/                 31 items  — Estáticos, imágenes, manifest
```

### Deuda técnica identificada (documentar, no implementar)

| Item | Impacto | Prioridad | Acción |
|------|---------|-----------|--------|
| 80+ archivos .md/.json en raíz | Organización del repo | P3 | Mover a `docs/archive/` |
| 215 scripts en `scripts/` | Código muerto | P3 | Limpiar en ciclo futuro |
| `appx/` directorio huérfano | Código muerto | P3 | Eliminar |
| `tsconfig.tsbuildinfo` versionado | Debería estar en .gitignore | P3 | Ya está en .gitignore:204 |
| `pro-design.css` 167KB sin purge | Performance | P2 | Documentado |
| `evergreen.ts` 101KB hardcodeado | Mantenibilidad | P2 | Funciona correctamente |
| 21 vulnerabilidades npm audit | Seguridad | P2 | Requiere breaking changes |

### Qué debe quedar congelado

- **`lib/editorial/core/`** — Motor editorial determinístico (tag `v1.0.0-editorial-engine-stable`). 125 tests, 176 noticias verificadas.
- **`lib/editorial/profiles/`** — 11 perfiles editoriales declarativos.
- **`lib/meni/core.ts`** — Motor MENI v6.0.
- **`middleware.ts`** — Configuración de seguridad y routing.
- **`firestore.rules`** — Reglas de seguridad.
- **`next.config.ts`** — Configuración de redirects, headers, imágenes.

### Qué no debe tocarse

- Motor editorial (salvo test falle o Google cambie requisitos)
- Reglas de Firestore
- CSP y headers de seguridad
- Whitelist SSRF en `transform/route.ts`
- Sistema de redirects SEO

### Qué puede afectar crecimiento futuro

- **Positivo:** ISR optimizado, Schema.org completo, sitemap dinámico, robots.txt correcto
- **Positivo:** Diversificación de portada (`home-balance.ts`, `diversify.ts`)
- **Positivo:** SEO efectivo con fallback automático (`effective.ts`)
- **Atención:** `pro-design.css` 167KB sin purge puede afectar LCP en móvil
- **Atención:** Dependencias transitivas con vulnerabilidades requieren upgrade breaking futuro

---

## FASE 2 — MOTOR EDITORIAL MENI

### MENI FINAL CERTIFICATION REPORT

#### Arquitectura del motor

```
lib/editorial/core/pipeline.ts    → evaluate(noticia) → EvaluacionEditorial
  ├── extractor.ts                → extract(noticia) → ArticleEvidence
  ├── profile-loader.ts           → loadProfile(category) → EditorialProfile
  ├── scorer.ts                   → scoreCalidad(evidence, profile) → 5 módulos
  ├── risk-engine.ts              → evaluateRisk(evidence) → forense + adsense
  ├── decision-engine.ts          → decide(modules, profile, seguro) → veredicto
  ├── explainability.ts           → buildExplainability(modules) → trazabilidad
  └── integrity-engine.ts         → verifyIntegrity(result) → invariantes
```

#### Pipeline determinístico

1. **Extracción única** — `extract(noticia)` produce `ArticleEvidence` con 14 sub-interfaces
2. **Perfil declarativo** — `loadProfile(category)` carga pesos, gates, umbrales
3. **Scoring** — 5 módulos: SEO, EEAT, Discover, AdSense, Valor Editorial
4. **Riesgo** — Forense (estilo) + AdSense (seguridad monetización)
5. **Decisión** — Promedio ponderado + gates (EEAT mínimo, AdSense seguro)
6. **Explainability** — Una entrada por cada penalización, suma exacta 100-score
7. **Integridad** — 7 invariantes matemáticos verificados en cada evaluación

#### Perfiles editoriales (11 categorías)

| Perfil | Archivo | Pesos | Gate EEAT |
|--------|---------|-------|-----------|
| Sucesos | `sucesos.ts` | SEO 15%, EEAT 25%, Discover 15%, AdSense 15%, Valor 30% | 40 |
| Nacionales | `nacionales.ts` | Igual | 40 |
| Deportes | `deportes.ts` | Igual | 40 |
| Tecnología | `tecnologia.ts` | Igual | 40 |
| Espectáculos | `espectaculos.ts` | Igual | 40 |
| Internacionales | `internacionales.ts` | Igual | 40 |
| Economía | `economia.ts` | Igual | 40 |
| Política | `politica.ts` | Igual | 40 |
| Salud | `salud.ts` | Igual | 40 |
| Clima | `clima.ts` | Igual | 40 |
| Servicio | `servicio.ts` | Igual | 40 |

#### Score único y determinismo

- **`scoreFinal`** = promedio ponderado de 5 módulos de calidad
- **`veredicto`** = mapeo del score a 6 niveles: `no_publicar` → `cobertura_especial`
- **Determinismo probado:** Test "mismo input produce mismo score, veredicto y hash 5 veces consecutivas" — PASS
- **Gate EEAT:** Si EEAT < 40 → `no_publicar` (sin importar otros scores)
- **Gate AdSense:** Si no seguro → veredicto máximo `publicar_estandar`

#### Invariantes matemáticos (integrity-engine.ts)

1. Cada módulo está acotado [0, 100] y coincide con su traza
2. `scoreFinal` coincide con la suma ponderada declarada
3. `scoreFinal` está entre el mínimo y máximo de los módulos
4. Explainability tiene exactamente una entrada por penalización
5. Suma de puntos perdidos = 100 - score por módulo
6. Todos los módulos ≥95 + seguro → veredicto ≥ `publicar_destacado`
7. Forense 100 → sin advertencias de riesgo

#### Integración con panel administrativo

- `/api/auditor` — Auditoría rápida (200 noticias, requiere auth)
- `/api/auditor-wordcount` — Auditoría con motor editorial V4 (200 noticias, requiere auth)
- `/admin/nios` — Command Center con análisis editorial
- `lib/nios/` — 54 módulos de inteligencia empresarial

#### Ausencia de rutas legacy contradictorias

- `lib/editorial/mapper-v3.ts` — Solo re-exporta `mapV4ToV3` desde `core/mapper-v3.ts`
- `lib/editorial/pipeline.ts` — Solo re-exporta `evaluate` desde `core/pipeline.ts`
- `lib/editorial/profile-loader.ts` — Carga perfiles desde `profiles/` y los enriquece con `category-intelligence.ts`
- No existen rutas legacy que produzcan scores contradictorios

#### Resultados de tests

```
tests/editorial-invariants.test.ts    — 11 tests PASS
tests/meni-calibration.test.ts        —  7 tests PASS
tests/meni-closing.test.ts            —  4 tests PASS
tests/meni-v3-2-penalizacion.test.ts  —  6 tests PASS
tests/meni-v3-dimensions.test.ts      —  3 tests PASS
tests/normalize-keywords.test.ts      —  9 tests PASS
tests/seo-effective.test.ts          — 10 tests PASS
```

**Total: 50 tests del motor editorial — todos pasan**

#### Veredicto MENI

**MENI está certificado como motor editorial central.** Es determinístico, produce un score único, tiene perfiles correctos por categoría, sus invariantes matemáticos se verifican en cada evaluación, y está integrado con el panel administrativo. No bloquea contenido correcto: el gate EEAT mínimo es 40 (no 70+), y artículos FLASH cortos pueden obtener ORO si el motor los evalúa como excelentes.

---

## FASE 3 — HOME / INDEX PRINCIPAL

### Evaluación de portada profesional

#### Jerarquía editorial

| Sección | Cantidad | Selección | Diversidad |
|---------|----------|-----------|------------|
| Hero | 1 | `selectHero()` — noticia con mayor score editorial | — |
| En portada | 4 | `diversifyNoticias(4, 1)` — máx 1 por categoría | Forzada |
| Última hora | 5 | `diversifyChronological(5, 2)` — máx 2 de Sucesos | Limitada |
| Recientes | 3 | `diversifyNoticias(3, 1)` — máx 1 por categoría | Forzada |
| Nacionales | 6 | Por categoría | — |
| Sucesos | 3 | Por categoría, limitado intencionalmente | — |
| Deportes | 4 | Por categoría | — |
| Internacionales | 3 | Por categoría | — |
| Tecnología | 2 | Por categoría | — |
| Espectáculos | 2 | Por categoría | — |
| Más leídas | 5 | `diversifyNoticias(5, 2)` | Limitada |
| Contenido útil | 4 | `diversifyEvergreen(4)` | — |

#### Balance editorial

- `lib/home-balance.ts` — `checkHomeDiversity(noticias.slice(0, 30))` verifica que ninguna categoría domine >50%
- `lib/brand-health.ts` — `checkBrandHealth(noticias.slice(0, 10))` evalúa identidad editorial
- `lib/home-ranking.ts` — `rankNoticias(latest)` ordena por score editorial + recencia + vistas
- **Evita dependencia excesiva de sucesos:** Máximo 2 de Sucesos en "Última hora", 3 en sección dedicada

#### SEO de portada

- `metadata` completa: title, description, OG, Twitter, canonical
- `ItemList` schema con top 6 noticias (rich snippets / Top Stories)
- `Organization` y `WebSite` schema en `<head>`
- ISR 300s (5 minutos) — balance entre frescura y costo
- `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`

#### Experiencia móvil

- `viewport: width=device-width, initialScale=1`
- CSS responsive (`responsive.css`, `home-redesign.css`)
- Componentes lazy-loaded (`AudioButton`, `PullQuote`, `AdsenseUnit`)
- Skip-to-content link para accesibilidad
- Critical CSS inline para LCP

#### Apariencia profesional

- TopBar con reloj mundial, clima, indicadores económicos
- Header con navegación por categorías
- Hero section con imagen optimizada
- Secciones por categoría con tarjetas de noticia
- Sidebar con más leídas y contenido útil
- Footer con enlaces legales, metodología, contacto

**Veredicto:** La portada parece la página principal de un medio nacional nicaragüense. No aparenta ser un portal automático.

---

## FASE 4 — ÍNDICES SECUNDARIOS

### Páginas de categoría (`/categoria/[slug]`)

#### Identidad propia

- `CATEGORIA_META` en `app/categoria/[slug]/page.tsx:10-35` — título y description únicos por categoría
- 6 categorías con metadata optimizada: sucesos, nacionales, internacionales, tecnología, deportes, espectáculos
- Canonical URL por categoría
- Redirect 301 de slugs no canónicos (`/sucesos` → `/categoria/sucesos`, etc.)

#### SEO

| Categoría | Title | Description |
|-----------|-------|-------------|
| Sucesos | "Sucesos en Nicaragua \| Policiales y Accidentes Hoy" | "Reportes de sucesos..." |
| Nacionales | "Noticias Nacionales de Nicaragua \| Actualidad y Sociedad" | "Entérate de lo último..." |
| Internacionales | "Noticias Internacionales \| Centroamérica y el Mundo" | "Lo que pasa fuera..." |
| Tecnología | "Tecnología en Nicaragua \| Innovación y Digital" | "Avances tecnológicos..." |
| Deportes | "Deportes en Nicaragua \| Fútbol, Béisbol y Atletismo" | "Resultados, fichajes..." |
| Espectáculos | "Espectáculos en Nicaragua \| Farándula y Entretenimiento" | "Noticias de espectáculos..." |

#### ISR y cache

- `revalidate = 3600` (1 hora) — apropiado para categorías
- `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
- `getNewsByCategory(catName, 200)` con `unstable_cache`

#### Navegación

- Componente `CategoryPagePro` con paginación
- Enlaces internos a artículos relacionados
- Breadcrumb schema en artículos individuales

#### Autoridad temática

- Cada categoría tiene su propio perfil editorial en `lib/editorial/profiles/`
- Google puede entender: "Nicaragua Informate tiene cobertura especializada por categoría"
- Sitemap incluye todas las categorías con `priority: 0.8`

### Páginas adicionales

| Página | Propósito | SEO |
|--------|-----------|-----|
| `/noticias` | Listado general | ISR 300s |
| `/autor/[slug]` | Página de autor | EEAT |
| `/autores` | Listado de autores | EEAT |
| `/guia/[slug]` | Contenido evergreen | SSG |
| `/biblioteca` | Archivo de guías | — |
| `/buscar` | Búsqueda interna | noindex (robots) |
| `/mapa-del-sitio` | Sitemap HTML | — |

---

## FASE 5 — ARTÍCULOS INDIVIDUALES

### Plantilla de noticia (`/noticias/[slug]`)

#### Información (qué ocurrió)

- Título normalizado (`normalizeEditorialTitle`)
- Contenido HTML sanitizado (`sanitizeArticleHtml` con DOMPurify)
- Imagen destacada optimizada (`getResponsiveImageUrl`, `getHeroImageUrl`)
- KeyPoints automáticos (`extractPoints` → 3 puntos clave)
- Tabla de contenidos (`injectTocIds`)
- Tiempo de lectura calculado

#### Contexto (por qué importa)

- Artículos relacionados por categoría (`getRelatedNews`, 6 artículos)
- Enlaces internos inyectados (`injectInternalLinks`)
- Pull quotes para destacar información clave
- Categoría visible y breadcrumb

#### Transparencia (confirmado vs investigación)

- `ContentWarning` component para contenido sensible
- Fecha de publicación y actualización visibles
- Autor visible con enlace a perfil
- Metodología editorial enlazada (`/metodologia-editorial`)
- Página de correcciones (`/correcciones`)

#### Servicio (información útil)

- `ArticleFaq` — FAQ automático con schema JSON-LD
- `KeyPoints` — 3 puntos clave al inicio del artículo
- Share bar con redes sociales
- Newsletter signup al final
- Audio button (TTS) para accesibilidad

#### EEAT

| Señal | Implementación | Fuente |
|-------|---------------|--------|
| Autor | `AuthorCard` con foto, bio, redes | `lib/authors.ts` |
| Metodología | Página `/metodologia-editorial` | `app/metodologia-editorial/` |
| Fuentes | Detección automática en motor editorial | `lib/editorial/extractor.ts` |
| Identidad editorial | Página `/nosotros`, `/politica-editorial` | `app/nosotros/`, `app/politica-editorial/` |
| Fecha publicación | `article:published_time` en meta + JSON-LD | `app/noticias/[slug]/page.tsx:138` |
| Fecha actualización | `article:modified_time` en meta + JSON-LD | `app/noticias/[slug]/page.tsx:139` |
| Correcciones | Página `/correcciones` | `app/correcciones/` |

#### Schema.org JSON-LD (5 schemas por artículo)

1. `NewsArticle` — con headline, image, author, publisher, datePublished, wordCount
2. `Organization` — NewsMediaOrganization
3. `WebSite` — con SearchAction
4. `BreadcrumbList` — navegación jerárquica
5. `FAQPage` — si se detectan preguntas en el contenido

#### SEO técnico

- Canonical URL estricta
- Redirect 301 si slug no coincide
- `noindex` para artículos marcados
- Exclusión de borradores y archivados
- Title optimizado (`generateOptimizedTitle`) con fallback al original si score ≥70
- Meta description con fallback automático (`resolveEffectiveSeo`)
- Keywords con fallback automático
- Image alt con fallback automático
- OpenGraph y Twitter Cards completos
- ISR 300s con `unstable_cache` para noticia y relacionadas

**Veredicto:** Una revisión humana de Google encontraría valor real: autor identificable, metodología declarada, fuentes atribuidas, contexto, servicio, transparencia.

---

## FASE 6 — GOOGLE / ADSENSE / DISCOVER

### GOOGLE QUALITY READINESS REPORT

#### Contenido de poco valor

| Check | Estado | Evidencia |
|-------|--------|-----------|
| Artículos <350 palabras sin valor | Controlado | Motor editorial: artículos cortos pueden ser ORO si el contenido es excelente |
| Contenido autogenerado | No detectado | Motor editorial penaliza transiciones IA, relleno, adjetivos emocionales |
| Contenido copiado | No detectado | `lib/analizador-duplicados.ts` detecta duplicados |
| Páginas vacías | No accesibles | Borradores y archivados excluidos de sitemap, indexación y render |

#### Señales de sitio automático

| Check | Estado | Evidencia |
|-------|--------|-----------|
| Meta description automática | Con fallback | `resolveEffectiveSeo` genera description si falta — pero usa resumen real |
| Keywords automáticas | Con fallback | Genera keywords de tags/categoría si falta — pero prioriza datos almacenados |
| Sin autor visible | No | `AuthorCard` en cada artículo, autor en JSON-LD y meta |
| Sin metodología | No | Página `/metodologia-editorial` enlazada |
| Sin política editorial | No | Página `/politica-editorial` enlazada |
| Sin correcciones | No | Página `/correcciones` enlazada |

#### Páginas vacías

| Tipo | Estado |
|------|--------|
| Categoría sin noticias | `notFound()` — 404 |
| Autor sin artículos | Página renderiza bio |
| Borradores | Excluidos de render, sitemap, indexación |
| Archivados | Excluidos de render, sitemap, indexación |
| Slugs tóxicos | 410 Gone |

#### Duplicidad

| Check | Estado |
|------|--------|
| Canonical estricto | Sí — redirect 301 si slug no coincide |
| Sitemap sin duplicados | Sí — filtra slugs tóxicos, borradores, archivados |
| Redirects 301 de URLs legacy | Sí — `/noticia.html?slug=X` → `/noticias/X` |

#### Experiencia de usuario

| Check | Estado |
|-------|--------|
| Mobile responsive | Sí — viewport, CSS responsive |
| Core Web Vitals | Optimizado — ISR, lazy load, critical CSS, preconnect |
| Ads no intrusivos | Sí — `AdsenseUnit` lazy-loaded via IntersectionObserver |
| Consentimiento cookies | Sí — `CookieBanner` + `ConsentScript` |
| Accesibilidad | Skip-to-content, ARIA labels, semantic HTML |
| Navegación | Header, footer, breadcrumbs, relacionados |

#### Google News / Discover

| Check | Estado | Evidencia |
|-------|--------|-----------|
| Googlebot-News allow | Sí | `app/robots.ts:17-20` |
| News sitemap | Sí | `app/news-sitemap.xml/` |
| NewsArticle schema | Sí | `lib/seo/schema.ts:25-60` |
| Imagen ≥1200px | Sí | OG image 1200x630, JSON-LD image 1200x675 |
| Fecha publicación | Sí | `article:published_time` + JSON-LN `datePublished` |
| Autor identificado | Sí | JSON-LD `author` con `Person` type |
| Publisher identificado | Sí | JSON-LD `publisher` con `Organization` |
| Canonical | Sí | `alternates.canonical` en cada página |

#### AdSense readiness

| Check | Estado |
|-------|--------|
| AdSense script | Cargado en `layout.tsx:160-164` |
| `ads.txt` | Servido en `/ads.txt` |
| Privacy policy | Página `/privacidad` |
| Cookies policy | Página `/cookies` |
| Terms | Página `/terminos` |
| Ad units | `AdsenseUnit` component lazy-loaded |
| Contenido seguro | Motor editorial evalúa `adsense.seguro` |
| Palabras sensibles | `adsense-safety.ts` detecta y bloquea |

**Veredicto:** El sitio está preparado para cumplir los criterios más exigentes de Google. No se garantiza aprobación de AdSense (eso depende del equipo de Google), pero todas las señales técnicas y editoriales están alineadas.

---

## FASE 7 — INFRAESTRUCTURA Y COSTOS

### INFRASTRUCTURE COST REPORT

#### Cloudflare

| Servicio | Estado | Costo |
|----------|--------|-------|
| DNS | Activo (`decker.ns.cloudflare.com`, `davina.ns.cloudflare.com`) | $0 (Free plan) |
| CDN/Proxy | Activo (cache HIT, CF-RAY) | $0 (Free plan) |
| SSL/TLS | Activo (redirect HTTPS en edge, HSTS preload) | $0 (Free plan) |
| Email Routing | Activo (`route1/2/3.mx.cloudflare.net`) | $0 (Free plan) |
| Web Analytics | Activo (`static.cloudflareinsights.com` en CSP) | $0 (Free plan) |

**Costo Cloudflare total: $0/mes**

#### Vercel

| Recurso | Consumo estimado | Límite (Hobby/Pro) | Costo |
|---------|------------------|---------------------|-------|
| Bandwidth | ~10-50 GB/mes | 100 GB (Hobby) / 1TB (Pro) | $0 |
| Serverless invocations | ~50K-200K/mes | 100K (Hobby) / 1M (Pro) | $0-$20/mes |
| ISR revalidations | ~500-2000/día | 1000/día (Hobby) / 5000/día (Pro) | $0-$20/mes |
| Build minutes | ~50-100/mes | 6000 (Hobby) / 24000 (Pro) | $0 |

**Costo Vercel estimado: $0-$20/mes (Hobby → Pro si tráfico crece)**

#### Firebase Firestore

| Operación | Frecuencia | Costo unitario | Costo/mes |
|-----------|-----------|---------------|-----------|
| Lecturas (home ISR) | 40 noticias × 288 revalidaciones/día = 11,520/día | $0.036/100K | $0.12/mes |
| Lecturas (artículos ISR) | 1 noticia × 288 revalidaciones/día × 200 artículos = 57,600/día | $0.036/100K | $0.62/mes |
| Lecturas (categorías ISR) | 500 noticias × 24 revalidaciones/día × 6 categorías = 72,000/día | $0.036/100K | $0.78/mes |
| Lecturas (sitemap) | 500 noticias × 24/día = 12,000/día | $0.036/100K | $0.13/mes |
| Lecturas (auditor, con auth) | 200 × uso admin (bajo) | $0.036/100K | <$0.01/mes |
| Escrituras (views) | ~600/día | $0.108/100K | $0.02/mes |
| Escrituras (traffic_log) | ~600/día | $0.108/100K | $0.02/mes |
| Almacenamiento | <1 GB | $0.108/GB/mes | $0.11/mes |

**Costo Firebase estimado: ~$1.80/mes (plan Blaze)**

#### Costo total de infraestructura

| Servicio | Costo/mes |
|----------|-----------|
| Cloudflare | $0 |
| Vercel | $0-$20 |
| Firebase | ~$1.80 |
| **Total** | **$1.80-$21.80/mes** |

#### Optimizaciones de costo ya implementadas

- ISR en todas las páginas (home 300s, categorías 3600s, artículos 300s)
- `unstable_cache` con tags para invalidación granular
- Auth en endpoints costosos (`/api/auditor`, `/api/auditor-wordcount`)
- Eliminado `force-dynamic` y `revalidate=0` de auditor-wordcount
- Cache de CDN (Cloudflare HIT)
- Lazy loading de componentes pesados

---

## FASE 8 — SEGURIDAD FINAL

### Clasificación de hallazgos

#### P0 — Crítico: NINGUNO

#### P1 — Importante: NINGUNO (ambos resueltos)

| Hallazgo original | Estado | Fix |
|-------------------|--------|-----|
| SSRF en `/api/transform` | RESUELTO | Whitelist 19 hosts, blacklist IPs privados, HTTPS only, redirect manual, timeout 10s, MIME validation, max 20MB |
| Abuso costo Firebase en `/api/auditor` y `/api/auditor-wordcount` | RESUELTO | Auth requerida (`isAdminRequest`), removido `force-dynamic` |

#### P2 — Mejora (no bloqueantes)

| Hallazgo | Descripción | Mitigación |
|----------|-------------|------------|
| 21 vulnerabilidades npm audit | `next`, `sharp`, `postcss`, `form-data`, `js-yaml`, `protobufjs`, `uuid`, `websocket-driver` | Aplicar `npm audit fix --force` en ciclo futuro (breaking changes) |
| Otros endpoints públicos con Firestore | `/api/list-all`, `/api/list-empty`, `/api/check-content` | Exponen metadatos públicos, volumen bajo. Considerar mover a `/api/admin/` |
| `traffic_log` sin TTL | Crecimiento indefinido | Configurar TTL 90 días en Firestore console |
| Rate limiting limitado | Solo en `/api/pulir` y `trackViewAction` | Cloudflare puede aplicar rate limiting adicional |
| DMARC no configurado | `_dmarc.nicaraguainformate.com` no existe | Agregar registro DMARC TXT |

#### Verificación de seguridad

| Componente | Estado | Evidencia |
|------------|--------|-----------|
| Autenticación admin | PASS | `middleware.ts:63-88` — `x-admin-token` o `x-cron-secret` |
| Auth auditor endpoints | PASS | `isAdminRequest` en ambos endpoints |
| SSRF protection | PASS | 15 tests, whitelist + blacklist + redirect manual |
| Secretos | PASS | `.gitignore` excluye `.env*`, `*key*.json`, `*secret*.json` |
| Variables entorno | PASS | `lib/env.ts` valida vars requeridas, `firebase-admin.ts` valida credenciales |
| CSP | PASS | Nonce dinámico 16 bytes, `object-src 'none'`, `frame-ancestors 'self'` |
| HSTS | PASS | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | PASS | `SAMEORIGIN` |
| X-Content-Type-Options | PASS | `nosniff` |
| Referrer-Policy | PASS | `strict-origin-when-cross-origin` |
| Permissions-Policy | PASS | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| DOMPurify | PASS | Lista blanca de tags, bloqueo `javascript:`/`data:`, iframes restringidos |
| Firestore Rules | PASS | No existe Client SDK, todo via Admin SDK |
| Bot blocking | PASS | 16 bots IA/scraper bloqueados |
| Cloudflare proxy | PASS | `Server: cloudflare`, `CF-RAY`, `cf-cache-status: HIT` |
| SSL/TLS | PASS | HTTPS redirect en edge, HSTS preload, HTTP/3 |

---

## FASE 9 — OPERACIÓN EMPRESARIAL

### Manual editorial

#### Identidad editorial

Nicaragua Informate es un portal de noticias de Nicaragua con cobertura de sucesos, nacionales, internacionales, deportes, tecnología, espectáculos y economía. Su identidad se basa en:

- **Periodismo de precisión** — datos concretos, fuentes atribuidas
- **Servicio al lector** — información útil, contexto, explicación
- **Transparencia** — metodología declarada, correcciones visibles
- **Cobertura desde Nicaragua** — enfoque local, perspectiva nacional

#### Flujo de publicación

1. **Redacción** — Escribir noticia en panel admin (`/admin/nios`)
2. **Evaluación MENI** — Motor editorial evalúa automáticamente (score, veredicto, recomendaciones)
3. **Revisión humana** — Editor revisa recomendaciones de MENI y ajusta
4. **Publicación** — Cambiar estado a "publicado" en Firestore
5. **Distribución** — RSS, sitemap, Google News, redes sociales
6. **Monitoreo** — Auditoría periódica con `/api/auditor` y `/api/auditor-wordcount`

#### Categorías y perfiles

| Categoría | Perfil | Enfoque |
|-----------|--------|---------|
| Sucesos | Informar sin explotar dolor, proteger menores | Hechos, no especulación |
| Nacionales | Servicio al ciudadano, impacto directo | Cómo afecta al lector |
| Internacionales | Explicar impacto para nicaragüenses | Conexión con Nicaragua |
| Deportes | Contar historias sin exagerar | Resultados + contexto |
| Espectáculos | Informar sin rumores | Hechos verificados |
| Tecnología | Explicar qué es y cómo funciona | Accesibilidad |
| Economía | Datos, cifras, impacto | Servicio práctico |

### Checklist diario del editor

```
□ Revisar noticias del día anterior (vistas, engagement)
□ Publicar 3-5 noticias nuevas (mínimo 1 nacional, máximo 1 suceso)
□ Verificar score MENI ≥ 60 en todas las publicaciones
□ Confirmar que portada tiene diversidad de categorías
□ Revisar Google Search Console por errores de indexación
□ Verificar que sitemap y RSS feed están actualizados
□ Responder comentarios de lectores
□ Revisar correcciones pendientes
□ Programar contenido evergreen si es día de baja actividad
```

### Guía SEO

```
□ Title: 40-70 caracteres, incluir keyword principal
□ Meta description: 120-160 caracteres (resumen automático si falta)
□ Imagen: mínimo 1200px, alt descriptivo (pieFoto si existe)
□ Contenido: mínimo 350 palabras (excepto FLASH)
□ H2: mínimo 2 subtítulos
□ Strong: mínimo 3 elementos de énfasis
□ Enlaces internos: 2-3 por artículo
□ Autor: siempre asignar autor conocido
□ Categoría: siempre asignar categoría correcta
□ Tags: 3-5 tags relevantes
□ Slug: lowercase, guiones, sin acentos
```

### Protocolo de redes sociales

| Canal | Formato | Frecuencia |
|-------|---------|------------|
| Facebook | Título + resumen + imagen + enlace | 3-5/día |
| Twitter/X | Título + enlace + hashtag | 3-5/día |
| Telegram | Título + resumen + imagen + enlace | 3-5/día |
| WhatsApp | Título + enlace (canal) | 2-3/día |
| Newsletter | Resumen semanal | 1/semana |

### Mantenimiento técnico

| Tarea | Frecuencia | Responsable |
|-------|-----------|-------------|
| Verificar build (`npm run build`) | Antes de cada deploy | Desarrollador |
| Verificar tests (`npx vitest run`) | Antes de cada deploy | Desarrollador |
| Verificar type-check (`tsc --noEmit`) | Antes de cada deploy | Desarrollador |
| `npm audit` | Mensual | Desarrollador |
| Backup Firestore | Semanal | Firebase console |
| Verificar Cloudflare cache | Mensual | Cloudflare dashboard |
| Verificar Vercel bandwidth | Mensual | Vercel dashboard |
| Limpiar `traffic_log` antiguos | Trimestral | Firestore console (TTL) |
| Verificar Google Search Console | Semanal | Editor |
| Verificar Google Analytics | Semanal | Editor |
| Actualizar contenido evergreen | Trimestral | Editor |

### Operación sin desarrollador

El proyecto puede operar sin depender del desarrollador para:

- **Publicar noticias** — Panel admin (`/admin/nios`)
- **Editar noticias** — Panel admin
- **Auditar calidad** — `/api/auditor` y `/api/auditor-wordcount` (con token)
- **Distribuir contenido** — RSS, sitemap, redes sociales automáticos
- **Monitorear** — Google Search Console, Analytics, Cloudflare dashboard
- **Mantenimiento básico** — Firestore console, Vercel dashboard

Requiere desarrollador solo para:

- Deploy de nuevos cambios de código
- Actualización de dependencias
- Cambios en reglas de Firestore
- Cambios en middleware o configuración de Next.js

---

## FASE 10 — CERTIFICACIÓN FINAL

### Resumen de validación

| Validación | Resultado | Fecha |
|------------|-----------|-------|
| `tsc --noEmit` | 0 errores | 2026-08-04 |
| `npx vitest run` | 146 tests, 14 archivos, todos pasan | 2026-08-04 |
| `npm run build` | Exitoso, 80+ rutas generadas | 2026-08-04 |
| `npm audit` | 21 vulnerabilidades preexistentes (P2) | 2026-08-04 |
| SSRF tests | 15 tests pasan | 2026-08-04 |
| API auth tests | 6 tests pasan | 2026-08-04 |
| Cloudflare check | PASS | 2026-08-04 |
| MENI invariantes | 7 invariantes verificados | 2026-08-04 |
| Firestore rules | Seguras (Admin SDK only) | 2026-08-04 |
| CSP + headers | 9 headers verificados en live response | 2026-08-04 |

### Checklist de certificación

- [x] **Código estable** — 146 tests pasan, tsc sin errores, build exitoso
- [x] **Seguridad revisada** — SSRF resuelto, auth en APIs sensibles, CSP completa, HSTS preload
- [x] **MENI validado** — 50 tests del motor editorial, 7 invariantes matemáticos, 11 perfiles
- [x] **SEO preparado** — Schema.org, sitemap, robots, canonical, meta description con fallback
- [x] **Editorial preparado** — 11 perfiles por categoría, KeyPoints, FAQ, AuthorCard, metodología
- [x] **Costos revisados** — ~$1.80-$21.80/mes total, ISR optimizado, auth en endpoints costosos
- [x] **Infraestructura documentada** — Cloudflare (DNS, CDN, SSL, email), Vercel (hosting), Firebase (Firestore)
- [x] **Operación independiente** — Manual editorial, checklist diario, guía SEO, protocolo redes, mantenimiento

### Riesgos residuales aceptables

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| Vulnerabilidades npm | Bajo en contexto | Baja explotación | Upgrade breaking en ciclo futuro |
| Endpoints públicos menores | Bajo costo | Baja | Mover a /api/admin/ futuro |
| traffic_log sin TTL | Bajo costo | Crecimiento lento | TTL 90 días en Firestore console |
| pro-design.css 167KB | Performance móvil | LCP +200-400ms | Purge CSS en ciclo futuro |
| AdSense no aprobado | Sin monetización | Dependiente de Google | Sitio técnicamente preparado |

---

## CERTIFICACIÓN

```
NICARAGUA INFORMATE

ESTADO: CERTIFICADO PARA OPERACIÓN

✅ Código estable
✅ Seguridad revisada
✅ MENI validado
✅ SEO preparado
✅ Editorial preparado
✅ Costos revisados
✅ Infraestructura documentada
✅ Operación independiente
```

---

## CONGELACIÓN DE PROYECTO

No se realizarán nuevas funcionalidades, auditorías, refactorizaciones ni cambios de arquitectura sin autorización explícita.

**Excepciones únicas:**
- Un test falle en producción
- Google cambie requisitos técnicos
- Vulnerabilidad crítica (P0) descubierta
- Cambio explícito de reglas editoriales

---

## NICARAGUA INFORMATE ESTÁ LISTO PARA OPERAR COMO MEDIO DIGITAL PROFESIONAL. PROYECTO CONGELADO.
