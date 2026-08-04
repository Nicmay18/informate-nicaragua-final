# 09 — UX/UI AUDIT

**Auditor:** UX/UI Lead + Frontend Designer
**Fecha:** 2026-08-03

---

## 1. SISTEMA DE DISEÑO

### Tipografía
- **Inter** (sans-serif) — cuerpo de texto, UI. `next/font/google` con `preload: true`
- **Merriweather** (serif) — titulares. `next/font/google` con `preload: false`
- **Spectral** (serif) — rediseño de portada. Cargado via Google Fonts CDN
- **IBM Plex Mono** (mono) — elementos técnicos. Cargado via Google Fonts CDN

### Colores
- **Tema:** Dark navy `#0A192F` (themeColor)
- **CSS variables:** Definidas en `pro-design.css`
- **Dark mode:** `ThemeScript` component con `suppressHydrationWarning`

### Layout
- **Header:** `TopBar` (radio, clima, reloj) + `Header` (logo, navegación, búsqueda)
- **Main:** Flex column con `min-height: 100vh`
- **Footer:** `Footer` component con enlaces, redes, newsletter
- **Skip link:** `Saltar al contenido principal` ✅

## 2. COMPONENTES UI

| Componente | Tamaño | Función |
|---|---|---|
| `HomePagePro` | 13.7KB | Homepage con grid de noticias |
| `ArticlePage` | 25.7KB | Página de artículo completo |
| `NewsCard` | 3.9KB | Tarjeta de noticia |
| `NewsGrid` | 1.1KB | Grid de noticias |
| `Header` | 8.8KB | Header con navegación |
| `Footer` | 7.9KB | Footer completo |
| `TopBar` | 2.6KB | Barra superior (radio, clima) |
| `RadioPlayer` | 16KB | Reproductor de radio |
| `WeatherWidget` | 7.3KB | Widget de clima |
| `WorldClock` | 4.7KB | Reloj mundial |
| `EconomicBar` | 2.9KB | Barra económica |
| `CookieBanner` | 6.7KB | Banner de cookies |
| `ShareBar` | 9.9KB | Barra de compartir |
| `KeyPoints` | 2.2KB | Puntos clave del artículo |
| `ArticleFaq` | 2.2KB | FAQ del artículo |
| `ArticleDataCard` | 3.2KB | Tarjeta de datos |
| `AuthorCard` | 7.6KB | Tarjeta de autor |
| `NewsletterSignup` | 2.2KB | Suscripción newsletter |
| `ReadingProgress` | 1.6KB | Barra de progreso de lectura |
| `ContentWarning` | 1.7KB | Aviso de contenido |
| `PullQuote` | 0.9KB | Quote destacado |
| `OptimizedImage` | 3.1KB | Imagen optimizada |
| `SafeImage` | 0.9KB | Imagen con fallback |
| `CategoryPagePro` | 6.6KB | Página de categoría |
| `LegalPageShell` | 6.6KB | Shell para páginas legales |

## 3. HALLAZGOS

### H-UX-01: Skip link de accesibilidad ✅
- **Evidencia:** `app/layout.tsx:175` — `<a href="#main-content" className="skip-to-content">`
- **Impacto:** Positivo — accesibilidad WCAG
- **Riesgo:** N/A

### H-UX-02: `aria-label` en main content ✅
- **Evidencia:** `app/layout.tsx:181` — `aria-label="Contenido principal"`
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-UX-03: `suppressHydrationWarning` para dark mode
- **Evidencia:** `app/layout.tsx:145,174` — evita flash de hidratación
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-UX-04: `ThemeScript` inline para evitar FOUC
- **Evidencia:** `components/ThemeScript.tsx` = 387 bytes
- **Impacto:** Positivo — tema aplicado antes de hidratación
- **Riesgo:** N/A

### H-UX-05: `CookieBanner` con consentimiento granular
- **Evidencia:** `components/CookieBanner.tsx` = 6,743 bytes
- **Impacto:** Positivo — GDPR/consent compliance
- **Riesgo:** N/A

### H-UX-06: `ConsentScript` carga scripts tras consentimiento
- **Evidencia:** `components/ConsentScript.tsx` = 1,268 bytes
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-UX-07: `DeferredAnalytics` retrasa GA4 hasta interacción
- **Evidencia:** `components/DeferredAnalytics.tsx` = 2,150 bytes
- **Impacto:** Positivo — no bloquea LCP
- **Riesgo:** N/A

### H-UX-08: `ReadingProgress` mejora UX de lectura
- **Evidencia:** `components/ReadingProgress.tsx` = 1,577 bytes
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-UX-09: `KeyPoints` muestra resumen estructurado
- **Evidencia:** `components/KeyPoints.tsx` = 2,214 bytes
- **Impacto:** Positivo — escaneabilidad
- **Riesgo:** N/A

### H-UX-10: `AudioButton` para TTS (text-to-speech)
- **Evidencia:** `components/AudioButton.tsx` = 4,310 bytes, lazy-loaded
- **Impacto:** Positivo — accesibilidad
- **Riesgo:** N/A

### H-UX-11: `ContentWarning` para contenido sensible
- **Evidencia:** `components/ContentWarning.tsx` = 1,665 bytes
- **Impacto:** Positivo — sucesos, violencia
- **Riesgo:** N/A

### H-UX-12: `ClientTime` para fechas relativas
- **Evidencia:** `components/ClientTime.tsx` = 1,761 bytes
- **Impacto:** Positivo — evita hidratación mismatch con fechas
- **Riesgo:** N/A

### H-UX-13: Font size adjustment en ArticlePage
- **Evidencia:** `components/ArticlePage.tsx:38-40` — 4 tamaños de fuente
- **Impacto:** Positivo — accesibilidad
- **Riesgo:** N/A

### H-UX-14: `not-found.tsx` personalizado
- **Evidencia:** `app/not-found.tsx` = 2,522 bytes
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-UX-15: `error.tsx` personalizado
- **Evidencia:** `app/error.tsx` = 1,560 bytes
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-UX-16: `loading.tsx` skeleton
- **Evidencia:** `app/loading.tsx` = 801 bytes
- **Impacto:** Positivo — perceived performance
- **Riesgo:** N/A

### H-UX-17: `pro-design.css` = 167KB — excesivo
- **Evidencia:** `app/pro-design.css` = 167,321 bytes
- **Impacto:** CSS masivo puede contener estilos no usados, afecta load time
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** PurgeCSS

### H-UX-18: Responsive design
- **Evidencia:** `app/styles/responsive.css` importado en layout
- **Evidencia:** `browserslist` en `package.json:76-85` — soporta últimos 2 versiones de Chrome, Firefox, Safari, Edge
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-UX-19: `OneSignalProvider` para push notifications
- **Evidencia:** `components/OneSignalProvider.tsx` = 1,275 bytes
- **Impacto:** Positivo — engagement
- **Riesgo:** N/A

### H-UX-20: `IndicadoresWidget` para datos económicos
- **Evidencia:** `components/IndicadoresWidget.tsx` = 5,191 bytes
- **Impacto:** Positivo — valor agregado
- **Riesgo:** N/A

## 4. PÁGINAS LEGALES Y DE CONFIANZA

| Página | Estado | Ruta |
|---|---|---|
| Sobre nosotros | ✅ | `/nosotros` |
| Contacto | ✅ | `/contacto` |
| Privacidad | ✅ | `/privacidad` |
| Términos | ✅ | `/terminos` |
| Cookies | ✅ | `/cookies` |
| Política editorial | ✅ | `/politica-editorial` |
| Correcciones | ✅ | `/correcciones` |
| Metodología editorial | ✅ | `/metodologia-editorial` |
| Publicidad | ✅ | `/publicidad` |
| Centro de confianza | ✅ | `/centro-confianza` |
| Newsletter | ✅ | `/newsletter` |

## 5. SCORE

| Dimensión | Score |
|---|---|
| Accesibilidad | 8/10 |
| Responsive | 8/10 |
| Componentes | 8/10 |
| Páginas de confianza | 10/10 |
| Performance visual | 6/10 |
| Consistencia | 7/10 |
| **Total** | **7.8/10** |
