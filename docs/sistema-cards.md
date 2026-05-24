# Sistema de Cards — Nicaragua Informate

## Regla de Oro
**Nunca mostrar más de 3 tamaños de card diferentes en la misma pantalla.**

## 1. Card Principal (Hero)

### Uso
- Noticia destacada principal
- Top de sección "Últimas noticias" (primera card)

### Estructura
```html
<article class="card-hero">
  <div class="card-image">
    <img src="..." alt="..." />
  </div>
  <div class="card-body">
    <div class="card-meta">
      <span class="cat-badge cat-badge--sucesos">Sucesos</span>
      <span class="time-meta">Hace 2 horas</span>
    </div>
    <h2 class="card-title">Título de la noticia...</h2>
    <p class="card-excerpt">Extracto de 2 líneas máximo...</p>
  </div>
</article>
```

### Especificaciones
| Propiedad | Valor |
|-----------|-------|
| Imagen | 16:9, scale(1.02) en hover |
| Título | Playfair Display, 24-35px, peso 800, line-height 1.2 |
| Extracto | Inter, 16-18px, peso 400, 2 líneas máximo (clamp) |
| Metadatos | Badge de categoría + tiempo |
| Padding | 24px |
| Sombra | shadow-md → shadow-lg en hover |

---

## 2. Card Secundaria (Grid)

### Uso
- Grid de 2-3 columnas en homepage
- Cards de categorías (Nacionales, Sucesos, etc.)

### Estructura
```html
<article class="card-grid">
  <div class="card-image">
    <img src="..." alt="..." />
  </div>
  <div class="card-body">
    <div class="card-meta">
      <span class="cat-badge cat-badge--nacionales">Nacionales</span>
      <span class="time-meta">Hace 3 horas</span>
    </div>
    <h3 class="card-title">Título de la noticia...</h3>
    <p class="card-excerpt">Extracto de 1 línea...</p>
  </div>
</article>
```

### Especificaciones
| Propiedad | Valor |
|-----------|-------|
| Imagen | 4:3, scale(1.04) en hover |
| Título | Playfair Display, 17-20px, peso 700, 2 líneas máximo |
| Extracto | Inter, 13.6px, 1 línea máximo (opcional) |
| Metadatos | Badge de categoría + tiempo (sin autor) |
| Padding | 18px |
| Hover | translateY(-4px) + shadow-lg |

---

## 3. Card Listado (Vertical móvil)

### Uso
- Listados verticales en móvil
- "Más leídas" / "Más noticias"

### Estructura
```html
<article class="card-list">
  <div class="card-image">
    <img src="..." alt="..." />
  </div>
  <div class="card-body">
    <div class="card-meta">
      <span class="cat-badge cat-badge--deportes">Deportes</span>
      <span class="time-meta">Hace 5 horas</span>
    </div>
    <h3 class="card-title">Título de la noticia...</h3>
  </div>
</article>
```

### Especificaciones
| Propiedad | Valor |
|-----------|-------|
| Layout | Horizontal: imagen izquierda + texto derecha |
| Imagen | 100x75px fijo, border-radius sm |
| Título | Playfair Display, 16px, peso 700, 2 líneas máximo |
| Divider | 1px #e0e0e0 entre cards |
| Padding | 16px vertical |

---

## 4. Badge de Categoría

### Colores por categoría
| Categoría | Color texto | Color fondo |
|-----------|-------------|-------------|
| Nacionales | #2563eb (azul) | rgba(37,99,235,0.12) |
| Sucesos | #dc2626 (rojo) | rgba(220,38,38,0.12) |
| Internacionales | #16a34a (verde) | rgba(22,163,74,0.12) |
| Tecnología | #9333ea (morado) | rgba(147,51,234,0.12) |
| Economía | #d97706 (dorado) | rgba(217,119,6,0.12) |
| Deportes | #ea580c (naranja) | rgba(234,88,12,0.12) |

### Especificaciones
| Propiedad | Valor |
|-----------|-------|
| Forma | Pill redondeada (border-radius: 100px) |
| Padding | 4px 12px |
| Texto | 11px, bold, uppercase, letter-spacing 0.5px |
| Font | Inter |

### Uso en HTML
```html
<span class="cat-badge cat-badge--nacionales">Nacionales</span>
<span class="cat-badge cat-badge--sucesos">Sucesos</span>
<span class="cat-badge cat-badge--internacionales">Internacionales</span>
<span class="cat-badge cat-badge--tecnologia">Tecnología</span>
<span class="cat-badge cat-badge--economia">Economía</span>
<span class="cat-badge cat-badge--deportes">Deportes</span>
```

---

## 5. Combinaciones Permitidas por Pantalla

### Homepage (Desktop)
- 1 Card Hero (principal)
- 4-6 Cards Grid (secundarias)
- **Total: 2 tamaños**

### Homepage (Móvil)
- 1 Card Hero (principal)
- 3 Cards Listado (verticales)
- **Total: 2 tamaños**

### Página de Categoría
- 1 Card Hero (destacada de la categoría)
- 6-8 Cards Grid (resto)
- **Total: 2 tamaños**

### Sidebar "Más Leídas"
- 5 Cards Listado
- **Total: 1 tamaño**

---

## 6. Variables CSS

```css
:root {
  /* Badges de categoría */
  --cat-nacionales: #2563eb;
  --cat-nacionales-bg: rgba(37,99,235,0.12);
  --cat-sucesos: #dc2626;
  --cat-sucesos-bg: rgba(220,38,38,0.12);
  --cat-internacionales: #16a34a;
  --cat-internacionales-bg: rgba(22,163,74,0.12);
  --cat-tecnologia: #9333ea;
  --cat-tecnologia-bg: rgba(147,51,234,0.12);
  --cat-economia: #d97706;
  --cat-economia-bg: rgba(217,119,6,0.12);
  --cat-deportes: #ea580c;
  --cat-deportes-bg: rgba(234,88,12,0.12);
}
```

## 7. Clases CSS Disponibles

| Clase | Descripción |
|-------|-------------|
| `.card-hero` | Card principal con imagen 16:9 |
| `.card-grid` | Card secundaria con imagen 4:3 |
| `.card-list` | Card listado horizontal |
| `.card-image` | Contenedor de imagen con fallback gradiente |
| `.card-body` | Contenedor de contenido textual |
| `.card-meta` | Fila de metadatos (badge + tiempo) |
| `.card-title` | Título de la noticia |
| `.card-excerpt` | Extracto/descripción |
| `.cat-badge` | Badge base de categoría |
| `.cat-badge--{categoria}` | Variante de color por categoría |
| `.time-meta` | Texto de tiempo ("Hace X horas") |
