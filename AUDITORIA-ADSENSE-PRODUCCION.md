# Auditoría forense AdSense — Nicaragua Informate en producción

**Fecha:** 2026-08-01  
**MENI:** v3.2 — congelado, no se modificó  
**Fuentes:** `scripts/auditor-adsense.mjs`, `INFORME-PULIDO-EDITORIAL-ADSENSE.md`, `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx`, suite de tests `HomePagePro`

---

## Resumen ejecutivo

Google evalúa el sitio como **bajo valor para anunciantes** principalmente por tres vectores:

1. **Calidad del contenido (CRÍTICO):** 174 de 228 noticias (76 %) no cumplen los criterios mínimos de AdSense.
2. **Señales de automatización / IA (ALTO):** 106 noticias tienen adjetivos sensacionalistas y 21 presentan conectores de transiciones IA.
3. **Experiencia y presentación (MEDIO):** el sitio está funcional pero con deuda de diseño, homepage con fallback vacío y componentes móviles pendientes.

El motor MENI en sí está sano; el problema no es el score, sino la **distancia entre el score editorial y el producto final que Googlebot y AdsBot ven**.

---

## 1. CONTENIDO

### Datos de producción

| Métrica | Valor | Impacto AdSense |
|---|---|---|
| Noticias auditadas | 228 | Base de evaluación |
| Aprobadas | 54 (23,7 %) | Páginas con valor publicitario seguro |
| Rechazadas | 174 (76,3 %) | Riesgo de bajo valor publicitario |
| < 500 palabras | 78 | **Thin content** penalizable |
| Lead < 20 palabras | 22 | Lead sin contexto completo |
| Adjetivos sensacionalistas | 106 | Riesgo de violación de políticas |
| Transiciones de IA | 21 | Huella de contenido generado automáticamente |
| Sin H2 claros | 3 | Estructura técnica débil |
| Promedio MENI AdSense (Pulido) | 14,98 % | Cumplimiento promedio muy bajo |
| Lista 1 (corregir ya) | 20 noticias | Mayor retorno de inversión editorial |
| Lista 2 (ya fuertes) | 20 noticias | Referencia de calidad |
| Lista 3 (mejora no prioritaria) | 187 noticias | Colchón de deuda editorial |

### Hallazgos por dimensión de contenido

| Dimensión | Severidad | Justificación |
|---|---|---|
| **Thin content (< 500 palabras)** | **CRÍTICO** | 78 noticias sin extensión mínima. Google califica esto como poco útil. |
| **Lenguaje sensacionalista** | **CRÍTICO** | 106 noticias con adjetivos emocionales. AdSense penaliza sensacionalismo, especialmente en sucesos. |
| **Baja originalidad / aporte propio** | **ALTO** | Lista 1 incluye múltiples notas con originalidad Media/Baja y Muy baja. Los módulos internacionales repiten hechos sin ángulo nicaragüense. |
| **Conectores IA** | **ALTO** | 21 noticias con conectores robóticos. AdsBot detecta patrones de texto generado. |
| **Lead débil** | **MEDIO** | 22 noticias con lead < 20 palabras. No responden Qué/Dónde/Cuándo de inmediato. |
| **Estructura H2** | **BAJO** | Solo 3 noticias sin H2 claros. Estructura general aceptable. |

---

## 2. EEAT

### Datos de producción

- 20 noticias tienen **EEAT Medio** según Pulido Editorial.
- Las mejoras apuntan a: verificar autor en byline, fuentes explícitas, instituciones actuantes.
- `app/layout.tsx` inyecta `Organization` y `WebSite` JSON-LD.
- `robots.ts` permite rastreo a Googlebot, Googlebot-News y AdsBot-Google.

### Hallazgos por dimensión EEAT

| Dimensión | Severidad | Justificación |
|---|---|---|
| **Byline / autoría** | **ALTO** | Pulido señala verificación de autor pendiente en 20 noticias. No hay evidencia de página de autores completa en producción. |
| **Fuentes y atribución** | **ALTO** | Noticias de sucesos e internacionales carecen de cronología confirmada, actuación de autoridades y datos verificables. |
| **Página editorial / contacto** | **MEDIO** | JSON-LD de organización presente, pero no se verificó `/sobre-nosotros`, `/contacto`, política de privacidad ni equipo editorial en vivo. |
| **Transparencia** | **MEDIO** | `CookieBanner` y `ConsentScript` presentes. Se requiere confirmar que el banner CMP cumple AdSense / GDPR. |
| **Reputación de tema** | **BAJO** | Las 20 noticias de Lista 2 son referencia de alta EEAT. El sitio tiene anclas de calidad. |

---

## 3. SEO

### Datos de producción

- `app/sitemap.ts` genera sitemap dinámico con `unstable_cache` y `getNews(500)`.
- `app/robots.ts` expone reglas por user-agent.
- `public/ads.txt` y `public/app-ads.txt` existen.
- Tests `HomePagePro` fallan porque el componente renderiza fallback "No hay noticias disponibles".

### Hallazgos por dimensión SEO

| Dimensión | Severidad | Justificación |
|---|---|---|
| **Sitemap y descubrimiento** | **BAJO** | Sitemap dinámico presente, cacheado y con 500 URLs. Robots.txt adecuado para AdsBot. |
| **Indexación de contenido vacío** | **ALTO** | `HomePagePro` muestra fallback cuando no hay noticias. Si Google rastrea una página vacía, la clasifica como poco útil. |
| **Canonical y URLs** | **MEDIO** | `isToxicSlug` filtra slugs problemáticos. No se detectaron duplicados explícitos, pero el fallback de homepage podría generar canonical auto-referenciado a una página vacía. |
| **Categorías y etiquetas** | **MEDIO** | Categorías y tags existen. El `keywords` y `palabrasClave` de muchas noticias están vacíos (los tests `normalize-keywords` detectaron `FALTAN_KEYWORDS`). |
| **Velocidad / cache** | **MEDIO** | Uso de `unstable_cache` y `revalidate` configurado. En producción funciona; en entorno de pruebas falla por falta de runtime Next.js. |

---

## 4. EXPERIENCIA

### Datos de producción

- `app/layout.tsx` importa `CookieBanner`, `ConsentScript`, `DeferredAnalytics`.
- Componente `HomePagePro` tiene fallback vacío en tests.
- `globals.css` y `pro-design.css` presentes.
- Recuerdo operativo: sitio restaurado a funcional; pendientes grid de homepage, tarjetas, header/footer/radio bar, responsive y "3 puntos clave".

### Hallazgos por dimensión de experiencia

| Dimensión | Severidad | Justificación |
|---|---|---|
| **Diseño responsive y homepage** | **ALTO** | Página principal con fallback vacío. Pendientes: grid 2 columnas, tarjetas, header, footer, radio bar, responsive. |
| **Publicidad / AdSense** | **MEDIO** | `ads.txt` y `app-ads.txt` presentes. `ConsentScript` configurado. Falta confirmar etiquetas publicitarias reales y posiciones. |
| **Navegación** | **MEDIO** | Estructura Next.js, header/footer existen. Sin evidencia de menú secundario o breadcrumbs. |
| **Velocidad** | **BAJO** | Fonts de Google con `display: swap`, precarga parcial. `unstable_cache` en sitemap. Sin métricas reales de Core Web Vitals. |
| **Accesibilidad** | **BAJO** | `pro-design.css` y componentes con estilos. No se auditó contraste ni ARIA. |

---

## Clasificación global de riesgos

| Categoría | Severidad | Hallazgo principal |
|---|---|---|
| Thin content | **CRÍTICO** | 78 noticias < 500 palabras |
| Sensacionalismo | **CRÍTICO** | 106 noticias con adjetivos emocionales |
| Aporte propio bajo | **ALTO** | 20 noticias prioritarias con originalidad Media/Baja/Muy baja |
| Homepage con fallback vacío | **ALTO** | Riesgo de indexación de página sin noticias |
| EEAT / autoría | **ALTO** | 20 noticias con EEAT Medio, byline y fuentes sin verificar |
| Conectores IA | **ALTO** | 21 noticias con huellas robóticas |
| Diseño responsive / UI | **ALTO** | Puntos pendientes del sitio restaurado |
| Sitemap y robots | **BAJO** | Configuración técnica correcta |
| Estructura H2 | **BAJO** | Solo 3 casos sin H2 |
| Cache y velocidad | **BAJO/MEDIO** | Configurada, sin mediciones reales |

---

## Conclusión

Google AdSense clasificaría el sitio como **bajo valor publicitario** por la combinación de:

1. **Muchas noticias delgadas o sensacionalistas** (CRÍTICO).
2. **Escasez de señales de autoridad y transparencia editorial** (ALTO).
3. **Experiencia visual y funcional incompleta**, especialmente en homepage y móvil (ALTO).

El motor MENI v3.2 identifica correctamente los problemas. El cuello de botella está en **la ejecución del pulido editorial y el deploy del nuevo diseño**, no en el motor de calidad.

---

## Recomendaciones priorizadas

1. **CRÍTICO:** Pulir las 20 noticias de Lista 1 y las 78 con < 500 palabras.
2. **CRÍTICO:** Reescribir 106 noticias con lenguaje sensacionalista.
3. **ALTO:** Eliminar conectores IA en 21 noticias.
4. **ALTO:** Verificar byline, fuentes e instituciones en las 20 noticias con EEAT Medio.
5. **ALTO:** Resolver el fallback de `HomePagePro` para que nunca indexe una página vacía.
6. **ALTO:** Completar diseño responsive, tarjetas, header/footer y radio bar.
7. **MEDIO:** Confirmar que `CookieBanner` + `ConsentScript` cumplen políticas de consentimiento de AdSense.
8. **MEDIO:** Agregar `/sobre-nosotros` y `/contacto` visibles y enlazados.
9. **BAJO:** Medir Core Web Vitals reales una vez desplegado el nuevo diseño.
10. **BAJO:** Implementar breadcrumbs y menú de categorías para mejorar navegación.

---

**Nota metodológica:** No se modificó MENI, scores, lógica editorial ni producción. Los datos provienen de auditorías existentes y de inspección de archivos de configuración de la aplicación.
