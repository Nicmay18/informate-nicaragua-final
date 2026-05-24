# Checklist Visual de Publicación — Nicaragua Informate

**Jefe de Diseño:** Antes de publicar cualquier noticia, verificar esta checklist.

---

## Checklist de 8 Puntos

| # | Verificación | Estado |
|---|--------------|--------|
| 1 | **La imagen principal tiene ratio correcto** (16:9 si es hero, 4:3 si es thumbnail) | ☐ |
| 2 | **El watermark no tapa el rostro ni el elemento principal** de la foto | ☐ |
| 3 | **El título cabe en 2 líneas en móvil** (máximo 60 caracteres ideales) | ☐ |
| 4 | **Hay al menos 24px de espacio debajo de la imagen** antes del texto del cuerpo | ☐ |
| 5 | **El badge de categoría tiene el color correcto** según la sección | ☐ |
| 6 | **El texto es legible sin hacer zoom** (16px+ en móvil) | ☐ |
| 7 | **Hay un botón o enlace visible para compartir** (no oculto en submenús) | ☐ |
| 8 | **La preview en redes sociales (Open Graph)** se ve bien con la imagen elegida | ☐ |

---

## Criterios de Aprobación

### APROBADO
- **Todos los 8 puntos marcados como ☑**
- Publicar inmediatamente.

### RECHAZADO
- **Cualquier punto sin marcar**
- No publicar hasta corregir.
- Lista de errores con prioridad visual.

---

## Detalles de Cada Punto

### 1. Ratio de Imagen Correcto
**Hero (noticia destacada):**
- Ratio: 16:9 (1920x1080px mínimo)
- Aplicación: Homepage hero, artículo principal

**Thumbnail (card secundaria):**
- Ratio: 4:3 (800x600px mínimo)
- Aplicación: Grid de noticias, cards de categoría

**Cómo verificar:**
- Abrir DevTools → Elements → Inspeccionar imagen
- Verificar `aspect-ratio` en CSS
- Si la imagen está cortada, recrop con herramienta de imagen

### 2. Watermark No Tapa Elementos Principales
**Reglas del watermark:**
- Opacidad: 30-40%
- Posición: Esquina inferior derecha
- Margen: 16px desde bordes
- **NUNCA** sobre rostros, textos, o elementos críticos

**Cómo verificar:**
- Zoom al 200% en la imagen
- Verificar que el watermark no interfiere con el contenido
- Si tapa algo, reposicionar o reducir opacidad

### 3. Título Cabe en 2 Líneas en Móvil
**Especificación:**
- Máximo 60 caracteres (ideal)
- Móvil: 16px font-size, 2 líneas máx
- Desktop: puede ser más largo, pero mantener conciso

**Cómo verificar:**
- Abrir DevTools → Device Toolbar → iPhone SE (375px)
- Contar caracteres del título
- Si excede 60 caracteres, acortar o usar subtítulo

### 4. Espacio Debajo de la Imagen
**Especificación:**
- Mínimo 24px entre imagen y texto del cuerpo
- Aplicación: Hero de artículo, cards de noticias

**Cómo verificar:**
- DevTools → Elements → Inspeccionar spacing
- Verificar `padding-bottom` o `margin-bottom`
- Si es < 24px, ajustar en CSS

### 5. Badge de Categoría con Color Correcto
**Paleta de categorías:**
- Nacionales: `#2563eb` (azul)
- Sucesos: `#dc2626` (rojo)
- Internacionales: `#059669` (verde)
- Tecnología: `#7c3aed` (violeta)
- Espectáculo: `#d97706` (ámbar)
- Deportes: `#ea580c` (naranja)

**Cómo verificar:**
- Inspeccionar el badge
- Verificar que usa la clase correcta: `.cat-badge--{categoria}`
- Si el color es incorrecto, cambiar la categoría en el CMS

### 6. Texto Legible Sin Zoom
**Especificación:**
- Mínimo 16px en móvil
- Interlineado 1.4-1.65
- Contraste mínimo 4.5:1

**Cómo verificar:**
- DevTools → Device Toolbar → iPhone SE (375px)
- Verificar font-size del cuerpo del texto
- Si es < 16px, ajustar en CSS

### 7. Botón de Compartir Visible
**Especificación:**
- Botón visible en el fold (sin scroll)
- No oculto en submenús
- Accesible en 1 click

**Cómo verificar:**
- Abrir la página en móvil
- Verificar que el botón de compartir es visible sin scroll
- Si está oculto, moverlo arriba o añadir botón sticky

### 8. Preview de Redes Sociales (Open Graph)
**Especificación:**
- Imagen: 1200x630px (1.91:1)
- Título: 60 caracteres máx
- Descripción: 160 caracteres máx

**Cómo verificar:**
- Usar [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- Pegar URL de la noticia
- Verificar que la imagen se vea bien
- Si la imagen está cortada, cambiar la imagen OG

---

## Flujo de Trabajo

### Antes de Publicar
1. **Redactor:** Escribe la noticia y sube la imagen
2. **Editor:** Revisa contenido y categorización
3. **Diseñador:** Ejecuta este checklist visual
4. **Jefe de Diseño:** Aprueba o rechaza

### Si APROBADO
- Publicar inmediatamente
- Notificar al equipo de que la noticia está en vivo

### Si RECHAZADO
- **Prioridad Alta:** Imagen incorrecta, watermark tapando, título muy largo
- **Prioridad Media:** Espacio insuficiente, badge incorrecto, texto pequeño
- **Prioridad Baja:** Botón de compartir oculto, OG image cortada
- Notificar al redactor/editor con lista de errores
- Revisar nuevamente después de correcciones

---

## Herramientas de Verificación

1. **DevTools (Chrome):** Inspeccionar elementos, device toolbar
2. **Facebook Sharing Debugger:** Verificar Open Graph
3. **Twitter Card Validator:** Verificar preview en Twitter/X
4. **WebAIM Contrast Checker:** Verificar contraste de texto
5. **Character Counter:** Verificar longitud de títulos

---

## Referencias

- Sistema de color: `docs/sistema-color.md`
- Sistema de cards: `docs/sistema-cards.md`
- Accesibilidad: `docs/checklist-accesibilidad.md`
- Mapa de navegación: `docs/mapa-navegacion.md`
