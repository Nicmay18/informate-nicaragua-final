# Especificación Visual de Imágenes — Nicaragua Informate

## 1. Watermark: Especificación Visual

### Ubicación y Dimensiones
- **Posición:** Esquina inferior derecha
- **Margen:** 16px desde el borde derecho y 16px desde el borde inferior
- **Tamaño:** 10-12% del ancho de la imagen (mínimo 80px, máximo 140px)
- **Área segura:** Nunca debe intersectar la zona central 60% de la imagen (donde están rostros, texto relevante, logos de terceros)

### Tipografía
- **Fuente:** Inter (consistente con el sistema de diseño del sitio)
- **Peso:** 300 (Light) o 400 (Regular) — nunca bold
- **Tamaño:** 12-14px dependiendo del ancho de la imagen
- **Letter-spacing:** 0.5px para legibilidad
- **Text-transform:** Title Case (Nicaragua Informate)

### Color y Opacidad
- **Color:** Blanco (#FFFFFF) con sombra sutil
- **Opacidad:** 35% (0.35) — sutil pero legible
- **Sombra:** `text-shadow: 0 1px 4px rgba(0,0,0,0.4)`
- **Fondo opcional:** Si la imagen es muy clara, usar fondo semitransparente: `rgba(0,0,0,0.3)` con border-radius 4px

### Reglas de Exclusión
- **Nunca tapar:** Rostros humanos, texto incrustado en la foto, logos de terceros, vehículos/matrículas, documentos
- **Zonas prohibidas:** Centro de la imagen (60% del área), esquina superior izquierda (donde van las etiquetas de categoría)
- **Casos especiales:** En fotos verticales (9:16), el watermark debe ir en la esquina inferior derecha del área visible del crop (no del archivo original)

---

## 2. Plantilla de Crops Recomendados

### Hero (Noticia Principal)
- **Ratio:** 16:9 (landscape)
- **Dimensiones mínimas:** 1920x1080px
- **Dimensiones web:** 1200x675px (WebP, 80-120KB)
- **Fallback:** JPG 1920x1080px (150KB máx)
- **Área segura:** Dejar 20% de margen en todos los bordes para texto superpuesto
- **Focal point:** Centrar en el sujeto principal, dejar espacio superior para título

### Thumbnails de Listado (NewsCard)
- **Ratio:** 4:3 (landscape) o 3:2 (landscape)
- **Dimensiones mínimas:** 800x600px (4:3) o 900x600px (3:2)
- **Dimensiones web:** 600x450px (4:3) o 600x400px (3:2) (WebP, 40-60KB)
- **Fallback:** JPG 800x600px (80KB máx)
- **Área segura:** Dejar 15% de margen en bordes para etiqueta de categoría

### Cards Destacadas (Horizontal 40/60)
- **Ratio:** 1:1 (cuadrado) para layout horizontal en móvil
- **Dimensiones mínimas:** 600x600px
- **Dimensiones web:** 400x400px (WebP, 30-50KB)
- **Fallback:** JPG 600x600px (60KB máx)

### Sidebar / Widgets
- **Ratio:** 16:9 o 4:3
- **Dimensiones mínimas:** 400x300px
- **Dimensiones web:** 300x225px (WebP, 20-30KB)
- **Fallback:** JPG 400x300px (40KB máx)

### Artículos Relacionados
- **Ratio:** 4:3
- **Dimensiones mínimas:** 600x450px
- **Dimensiones web:** 400x300px (WebP, 25-40KB)
- **Fallback:** JPG 600x450px (50KB máx)

---

## 3. CSS: object-fit: cover con Fallback

### Estilos Base para Imágenes

```css
/* ===== IMAGE FALLBACK SYSTEM ===== */
img {
  background-color: #f0f0f0;
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d1d5db"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 48px;
  color: transparent;
}

/* Hero editorial image */
.hero-editorial-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f0f0f0;
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d1d5db"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 64px;
}

/* News card images */
.news-image img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f0f0f0;
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d1d5db"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 32px;
}

/* Article hero image */
.article-hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f0f0f0;
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d1d5db"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 64px;
}

/* Avatar images */
.article-author-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f0f0;
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d1d5db"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 32px;
}

/* Related card images */
.related-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f0f0f0;
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d1d5db"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 32px;
}
```

### Watermark Overlay (CSS Overlay)

```css
/* ===== WATERMARK OVERLAY ===== */
.image-with-watermark {
  position: relative;
  overflow: hidden;
}

.image-watermark {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.35);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

/* Watermark con fondo para imágenes claras */
.image-watermark.with-bg {
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 4px;
}

/* Responsive watermark */
@media (max-width: 640px) {
  .image-watermark {
    font-size: 10px;
    bottom: 12px;
    right: 12px;
  }
}
```

---

## 4. ALT Text: Guía de Diseño de Contenido

### Reglas Generales
- **Describir el contenido visual, no decorar:** "Presidente Daniel Ortega habla en Managua" vs "Foto del presidente"
- **Incluir contexto relevante:** "Manifestantes marchan en Plaza de la Revolución, Managua, Nicaragua"
- **Mantenerlo conciso:** 8-15 palabras idealmente, máximo 25
- **Evitar redundancia:** No repetir "Foto de" o "Imagen de" al inicio

### Plantillas por Tipo de Contenido

**Política / Gobierno:**
- `[Persona] [acción] en [lugar], [contexto]`
- Ejemplo: "Presidente Daniel Ortega firma acuerdo en Palacio Nacional"

**Sucesos:**
- `[Evento] en [lugar], [detalle relevante]`
- Ejemplo: "Incendio en mercado oriental de Managua, bomberos en acción"

**Deportes:**
- `[Deportista] durante [evento] en [lugar]`
- Ejemplo: "Jugador de fútbol celebra gol en estadio Nacional"

**Economía:**
- `[Elemento visual] relacionado con [tema económico]`
- Ejemplo: "Gráfico de inflación en Nicaragua, Banco Central"

**Internacionales:**
- `[Líder / Evento] en [país], [contexto]`
- Ejemplo: "Joe Biden en conferencia de prensa en Washington DC"

---

## 5. Checklist para Editores de Fotos

Antes de subir una imagen al panel de administración:

- [ ] Ratio correcto según tipo (16:9 hero, 4:3 listado, 1:1 destacada)
- [ ] Dimensiones mínimas cumplidas (ver sección 2)
- [ ] Watermark aplicado en esquina inferior derecha, opacidad 35%
- [ ] Watermark no tapa rostros, texto relevante o logos de terceros
- [ ] Focal point centrado en sujeto principal
- [ ] Compresión WebP aplicada (80KB listado, 150KB hero)
- [ ] Fallback JPG generado
- [ ] ALT text descriptivo redactado (8-15 palabras)
- [ ] Nombre de archivo descriptivo: `categoria-titulo-slug.webp`
