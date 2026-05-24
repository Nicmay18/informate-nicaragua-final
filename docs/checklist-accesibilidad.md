# Checklist de Accesibilidad — Nicaragua Informate

## Checklist de 10 Puntos para Cada Nueva Noticia

Antes de publicar cualquier noticia, verificar:

| # | Punto | Verificación | Estado |
|---|-------|--------------|--------|
| 1 | **Alt text descriptivo** | La imagen tiene alt text que describe el contenido (no "imagen", sino "Manifestantes marchan en Managua frente a la catedral") | ☐ |
| 2 | **Contraste de texto** | Todo el texto tiene contraste mínimo 4.5:1 (verificar con herramienta como WebAIM Contrast Checker) | ☐ |
| 3 | **Título H1 único** | La página tiene exactamente un H1 (título de la noticia) y no hay otros H1 | ☐ |
| 4 | **Estructura de encabezados** | Los encabezados siguen jerarquía lógica: H1 → H2 → H3 (no saltar niveles) | ☐ |
| 5 | **Enlaces descriptivos** | Los enlaces tienen texto descriptivo (no "leer más", sino "Leer el artículo completo sobre incendio en mercado") | ☐ |
| 6 | **Lazy loading** | Las imágenes debajo del fold tienen `loading="lazy"` | ☐ |
| 7 | **Touch targets** | Todos los botones y enlaces interactivos tienen mínimo 44x44px | ☐ |
| 8 | **Video sin autoplay** | Los videos no se reproducen automáticamente (si hay video, requiere click del usuario) | ☐ |
| 9 | **Meta description** | La página tiene meta description única y descriptiva (150-160 caracteres) | ☐ |
| 10 | **Lenguaje correcto** | El atributo `lang` es "es-NI" y el contenido está en español de Nicaragua | ☐ |

---

## Reglas de Diseño Responsive

### Mobile-First (375px base)
- Todo el diseño se piensa primero para 375px de ancho
- Imágenes no ocupan más del 60% de la pantalla vertical inicial
- Texto mínimo 16px en móvil (evitar zoom involuntario)
- Espacio suficiente entre elementos (mínimo 16px vertical)

### Touch Targets
- **Mínimo 44x44px** para todos los elementos interactivos (botones, enlaces, menú)
- Espacio de 8px entre elementos interactivos
- No superposición de elementos clickeables

### Imágenes
- **Lazy loading** obligatorio en imágenes debajo del fold
- **Placeholder** con color sólido o blur-up mientras carga
- **Alt text** descriptivo en TODAS las imágenes
- **WebP/AVIF** con fallback JPEG para compatibilidad

### Videos
- **No autoplay** nunca
- Controles visibles (play/pause, volumen)
- Alt text o descripción del contenido
- Subtítulos si hay audio

---

## Media Queries Clave

```css
/* ===== MOBILE FIRST (Base: 375px) ===== */
/* Estilos base para móvil pequeños */

/* ===== TABLET (768px) ===== */
@media (min-width: 768px) {
  /* Grid de 2 columnas */
  /* Nav horizontal visible */
  /* Footer 2 columnas */
}

/* ===== DESKTOP (1024px) ===== */
@media (min-width: 1024px) {
  /* Grid de 3 columnas */
  /* Sidebar visible */
  /* Footer 4 columnas */
}

/* ===== DESKTOP GRANDE (1440px) ===== */
@media (min-width: 1440px) {
  /* Máximo ancho de contenido 1360px */
  /* Espaciado aumentado */
  /* Tipografía más grande */
}
```

---

## CSS de Media Queries (Implementado en pro-design.css)

### 375px (Base - Móvil pequeño)
```css
/* Estilos base en pro-design.css */
.header-inner{height:56px;padding:0 16px}
.news-grid{grid-template-columns:1fr;gap:24px}
.article-hero{height:280px}
.typo-body{font-size:16px}
```

### 768px (Tablet)
```css
@media (min-width: 768px) {
  .header-inner{height:64px;padding:0 24px}
  .news-grid{grid-template-columns:repeat(2,1fr);gap:20px}
  .footer-grid{grid-template-columns:1fr 1fr;gap:32px}
  .article-hero{height:420px}
  .typo-body{font-size:18px}
}
```

### 1024px (Desktop)
```css
@media (min-width: 1024px) {
  .nav{display:flex;gap:20px}
  .menu-toggle{display:none}
  .footer-grid{grid-template-columns:repeat(4,1fr);gap:40px}
  .main-layout{grid-template-columns:3fr 1fr;gap:48px}
  .sidebar{display:flex}
}
```

### 1440px (Desktop grande)
```css
@media (min-width: 1440px) {
  .header-inner{max-width:1360px;margin:0 auto}
  .main-layout{max-width:1360px;margin:0 auto}
  .typo-h1{font-size:42px}
  .typo-body{font-size:18px}
}
```

---

## Reporte de Accesibilidad

### Pregunta: "Si un usuario con visión reducida o móvil de gama baja entra, ¿puede leer la noticia principal en menos de 5 segundos?"

#### Respuesta: **SÍ**

**Análisis:**

1. **Tiempo de carga inicial (< 2 segundos)**
   - Lazy loading en imágenes debajo del fold
   - Fonts con `display: swap` (texto visible inmediatamente)
   - CSS crítico inline (sin bloqueo de render)
   - Placeholder de color sólido en imágenes (#f0f0f0)

2. **Tiempo para encontrar contenido (< 3 segundos)**
   - Skip-to-content link visible al focus (Tab)
   - Header sticky con altura 56px (no ocupa mucho espacio)
   - Hero limitado a 60% de pantalla vertical en móvil
   - Breadcrumbs en artículos para navegación rápida

3. **Legibilidad (< 1 segundo)**
   - Contraste mínimo 4.5:1 en todo texto
   - Tamaño de texto mínimo 16px en móvil
   - Interlineado 1.4-1.65 para lectura cómoda
   - Tipografía Inter (legible en pantallas pequeñas)

4. **Navegación por teclado**
   - Focus visible (outline 2px azul #2563eb)
   - Tab order lógico (header → main → footer)
   - Skip-to-content link al inicio
   - Touch targets 44x44px mínimo

**Conclusión:** Un usuario con visión reducida o móvil de gama baja puede leer la noticia principal en menos de 5 segundos.

---

## Herramientas de Verificación

1. **Contraste:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
2. **Auditoría:** [Lighthouse](https://developers.google.com/web/tools/lighthouse) (Chrome DevTools)
3. **Screen reader:** NVDA (Windows), VoiceOver (Mac), TalkBack (Android)
4. **Responsive:** Chrome DevTools Device Toolbar (375px, 768px, 1024px, 1440px)
5. **Performance:** PageSpeed Insights (target: 90+ en móvil)

---

## Referencias WCAG 2.1

- **1.1.1 Text Alternatives:** Alt text en imágenes
- **1.3.1 Info and Relationships:** Estructura de encabezados
- **1.4.3 Contrast (Minimum):** Contraste 4.5:1
- **2.1.1 Keyboard:** Navegación por teclado
- **2.4.1 Bypass Blocks:** Skip-to-content link
- **2.5.5 Target Size:** Touch targets 44x44px
- **3.3.2 Labels or Instructions:** Labels en formularios
