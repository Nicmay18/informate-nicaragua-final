# ANALISIS FORENSE: Paquete de Optimizacion vs. Proyecto Actual

## Veredicto General: RECHAZAR reemplazo completo. EXTRAER mejoras selectivas.

El paquete es generico y NO conoce la arquitectura real del proyecto.
Reemplazar archivos completos romperia funcionalidades criticas.

---

## 1. next.config.ts

| Aspecto | Paquete | Nuestro Actual | Veredicto |
|---|---|---|---|
| output | standalone | (ninguno) | Mejor paquete |
| images.loader | (ninguno) | custom (weserv.nl) | CRITICO: nuestro |
| images.remotePatterns | (ninguno) | 15 dominios | CRITICO: nuestro |
| redirects | 2 (solo www/https) | 30+ (SEO, toxic, categorias) | CRITICO: nuestro |
| cache headers | 2 reglas | 15+ reglas | CRITICO: nuestro |
| CSP | frame-ancestors 'none' | SAMEORIGIN | Mejor paquete |
| Permissions-Policy | interest-cohort=() | (no tiene) | Mejor paquete |
| optimizeCss | true | false (critters falla) | RIESGO: sabemos que falla |
| dangerouslyAllowSVG | true | false | RIESGO: XSS |

**ACCION**: Extraer mejoras selectivas, NO reemplazar.

---

## 2. middleware.ts

| Aspecto | Paquete | Nuestro Actual | Veredicto |
|---|---|---|---|
| 410 Gone toxic | NO | SI | CRITICO: nuestro |
| Security headers | duplicados con next.config.ts | no duplicados | Mejor nuestro |
| Cache s-maxage=60 | SI | NO | RIESGO: cache edge muy corto |
| Matcher regex | negativa compleja | simple | Mejor nuestro |
| Rate limiting | loggea IP, no limita | (no tiene) | Neutral |

**ACCION**: NO reemplazar. Nuestro middleware es mas enfocado.

---

## 3. layout.tsx (CRITICO)

| Aspecto | Paquete | Nuestro Actual | Veredicto |
|---|---|---|---|
| CookieBanner | NO | SI | CRITICO: nuestro |
| ConsentScript | NO | SI | CRITICO: nuestro |
| DeferredAnalytics | NO | SI | CRITICO: nuestro (acabamos de crearlo) |
| ThemeScript | NO | SI | CRITICO: nuestro |
| criticalCss | NO | SI | CRITICO: nuestro |
| Merriweather font | NO | SI | Nuestro |
| Skip link | NO | SI | Nuestro |
| Semantic HTML | NO (solo children) | SI (header, main, footer) | Nuestro |
| RSS/JSON feeds | NO | SI | Nuestro |
| Schema escapeJsonLd | NO (JSON.stringify crudo) | SI | CRITICO: nuestro |
| Preload font | `inter.style.fontFamily` (NO es URL) | NO | BUG en paquete |
| GTM noscript | SI | NO | Innecesario si usamos GA4 directo |
| className | `inter.className` | variables CSS | Nuestro |

**ACCION**: NO reemplazar. Perderiamos 10+ funcionalidades.

---

## 4. sitemap.ts

| Aspecto | Paquete | Nuestro Actual | Veredicto |
|---|---|---|---|
| Imports | `@/lib/articles` (NO existe) | `@/lib/data` | CRITICO: nuestro |
| safeDate (Firestore) | NO | SI | Nuestro |
| Autores | NO | SI | Nuestro |
| Evergreen | NO | SI | Nuestro |
| revalidate | 3600 | (no tiene) | Mejor paquete |

**ACCION**: Agregar `revalidate = 3600` al nuestro.

---

## 5. robots.ts

| Aspecto | Paquete | Nuestro Actual | Veredicto |
|---|---|---|---|
| `disallow: /*?*` | SI | NO | RIESGO: bloquea utm_source, fbclid |
| Googlebot-News | SI | SI | Igual |
| AdsBot-Google | SI | NO | Mejor paquete |
| news-sitemap.xml | NO | SI | Nuestro |

**ACCION**: Agregar AdsBot-Google. NO agregar `/*?*`.

---

## 6. AdSenseLazy.tsx

| Aspecto | Paquete | Nuestro AdsenseUnit | Veredicto |
|---|---|---|---|
| IntersectionObserver | SI | SI | Igual |
| minHeight prop | SI | NO | Mejor paquete |
| script global unico | SI | SI | Igual |
| ID real | placeholder | real | Nuestro |
| background placeholder | gradiente | transparente/f8fafc | Mejor paquete |

**ACCION**: Extraer `minHeight` y mejorar placeholder.

---

## 7. getBlurData.ts

| Aspecto | Estado |
|---|---|
| Dependencia | plaiceholder (nueva) |
| Cache | Map (bueno) |
| Fetch remoto | Cada imagen en build |
| Urgencia | Baja |

**ACCION**: Interesante pero no prioritario. Dejar para despues.

---

## 8. verify-deploy.sh

**ACCION**: Crear. Util para verificacion post-deploy.

---

## RESUMEN DE ACCIONES

### Aplicar AHORA (seguro):
1. next.config.ts: `output: 'standalone'`, `frame-ancestors 'none'`, `interest-cohort=()`
2. next.config.ts: `image/avif` primero, `scrollRestoration: true`
3. robots.ts: Agregar AdsBot-Google
4. sitemap.ts: Agregar `revalidate = 3600`
5. AdsenseUnit.tsx: Agregar `minHeight` prop y mejorar placeholder
6. Crear verify-deploy.sh

### NO aplicar (riesgoso):
1. Reemplazo completo de next.config.ts (pierde redirects y cache)
2. Reemplazo de middleware.ts (pierde 410 Gone)
3. Reemplazo de layout.tsx (pierde 10+ componentes)
4. Reemplazo de sitemap.ts (imports incorrectos)
5. Reemplazo de [slug]/page.tsx (no coincide estructura)
6. getBlurData.ts (nueva dependencia, no urgente)
7. `optimizeCss: true` (sabemos que critters falla)
8. `dangerouslyAllowSVG: true` (riesgo XSS)
9. `disallow: /*?*` en robots.txt (bloquea params utiles)

---

*Analisis: Cascade AI | Fecha: Junio 2026*
