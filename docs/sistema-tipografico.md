# Sistema Tipográfico — Nicaragua Informate

## 1. Escala Tipográfica Visual

| Nivel | Uso | Móvil (< 640px) | Tablet (640-1024px) | Desktop (> 1024px) | Peso | Interlineado | Color |
|-------|-----|-----------------|---------------------|-------------------|------|---------------|-------|
| **H1** | Título principal (hero, article) | 28px | 34px | 42px | 800 | 1.2 | #111111 |
| **H2** | Subtítulo de sección | 22px | 26px | 32px | 700 | 1.3 | #111111 |
| **H3** | Título de card, sección secundaria | 18px | 20px | 24px | 700 | 1.4 | #111111 |
| **Lead** | Extracto/lead de artículo | 18px | 19px | 20px | 400 | 1.6 | #333333 |
| **Body** | Cuerpo de artículo | 16px | 17px | 18px | 400 | 1.65 | #1a1a1a |
| **Caption** | Pie de foto, leyenda | 13px | 14px | 14px | 400 | 1.4 | #666666 |
| **Meta** | Categoría, autor, fecha | 12px | 13px | 13px | 600 | 1.3 | #666666 |
| **Nav** | Menú, enlaces de navegación | 13px | 14px | 14px | 600 | 1.2 | #4a4a4a |

## 2. Familias Tipográficas

### Títulos: Playfair Display
- **Uso:** H1, H2, H3, nombres de secciones
- **Características:** Serif editorial, autoridad periodística
- **Pesos disponibles:** 400, 500, 600, 700, 800, 900
- **Pesos usados:** 700 (H2, H3), 800 (H1)

### Cuerpo: Inter
- **Uso:** Body, Lead, Caption, Meta, Nav
- **Características:** Sans-serif legible, optimizada para pantalla
- **Pesos disponibles:** 100-900
- **Pesos usados:** 400 (Body, Lead, Caption), 600 (Meta, Nav)

## 3. Variables CSS

```css
:root {
  /* ===== TIPOGRAFÍA ===== */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;

  /* Tamaños base */
  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
  --text-4xl: 42px;

  /* Interlineados */
  --leading-tight: 1.2;
  --leading-snug: 1.3;
  --leading-normal: 1.4;
  --leading-relaxed: 1.6;
  --leading-loose: 1.65;

  /* Pesos */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* Colores de texto (WCAG AA 4.5:1+) */
  --text-primary: #111111;      /* Ratio 15.3:1 sobre #fff */
  --text-secondary: #333333;   /* Ratio 12.6:1 sobre #fff */
  --text-tertiary: #666666;    /* Ratio 7.0:1 sobre #fff */
  --text-muted: #737373;        /* Ratio 5.9:1 sobre #fff */
  --text-light: #a3a3a3;        /* Ratio 3.5:1 sobre #fff */

  /* Color corporativo para metadatos */
  --text-meta: #4a4a4a;         /* Ratio 8.6:1 sobre #fff */
}
```

## 4. CSS Aplicado

```css
/* ===== H1: Título Principal ===== */
.typo-h1 {
  font-family: var(--font-display);
  font-size: clamp(28px, 5vw, 42px);
  font-weight: var(--font-extrabold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
  letter-spacing: -0.025em;
}

/* ===== H2: Subtítulo de Sección ===== */
.typo-h2 {
  font-family: var(--font-display);
  font-size: clamp(22px, 4vw, 32px);
  font-weight: var(--font-bold);
  line-height: var(--leading-snug);
  color: var(--text-primary);
  letter-spacing: -0.015em;
}

/* ===== H3: Título de Card / Sección Secundaria ===== */
.typo-h3 {
  font-family: var(--font-display);
  font-size: clamp(18px, 3vw, 24px);
  font-weight: var(--font-bold);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* ===== Lead: Extracto de Artículo ===== */
.typo-lead {
  font-family: var(--font-body);
  font-size: clamp(18px, 2.5vw, 20px);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
}

/* ===== Body: Cuerpo de Artículo ===== */
.typo-body {
  font-family: var(--font-body);
  font-size: clamp(16px, 2vw, 18px);
  font-weight: var(--font-normal);
  line-height: var(--leading-loose);
  color: var(--text-primary);
}

/* ===== Caption: Pie de Foto / Leyenda ===== */
.typo-caption {
  font-family: var(--font-body);
  font-size: clamp(13px, 1.5vw, 14px);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-tertiary);
}

/* ===== Meta: Categoría, Autor, Fecha ===== */
.typo-meta {
  font-family: var(--font-body);
  font-size: clamp(12px, 1.3vw, 13px);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== Nav: Menú / Navegación ===== */
.typo-nav {
  font-family: var(--font-body);
  font-size: clamp(13px, 1.5vw, 14px);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-meta);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* ===== Responsive Tweaks ===== */
@media (max-width: 640px) {
  .typo-h1 { font-size: 28px; }
  .typo-h2 { font-size: 22px; }
  .typo-h3 { font-size: 18px; }
  .typo-lead { font-size: 18px; }
  .typo-body { font-size: 16px; }
  .typo-caption { font-size: 13px; }
  .typo-meta { font-size: 12px; }
  .typo-nav { font-size: 13px; }
}

@media (min-width: 1024px) {
  .typo-h1 { font-size: 42px; }
  .typo-h2 { font-size: 32px; }
  .typo-h3 { font-size: 24px; }
  .typo-lead { font-size: 20px; }
  .typo-body { font-size: 18px; }
  .typo-caption { font-size: 14px; }
  .typo-meta { font-size: 13px; }
  .typo-nav { font-size: 14px; }
}
```

## 5. Ejemplo Aplicado: Noticia de Sucesos

### Título Largo (Simulado)
"Incendio devora mercado oriental de Managua: miles de familias pierden sus medios de subsistencia tras el fuego que destruyó más de 500 puestos comerciales"

### Renderizado

```html
<article class="article-page">
  <!-- Metadatos -->
  <div class="article-meta">
    <span class="typo-meta" style="color: var(--accent);">SUCESOS</span>
    <span class="typo-meta">•</span>
    <time class="typo-meta">Hace 2 horas</time>
    <span class="typo-meta">•</span>
    <span class="typo-meta">Por Carlos Méndez</span>
  </div>

  <!-- H1: Título Principal -->
  <h1 class="typo-h1">
    Incendio devora mercado oriental de Managua: miles de familias pierden sus medios de subsistencia tras el fuego que destruyó más de 500 puestos comerciales
  </h1>

  <!-- Lead: Extracto -->
  <p class="typo-lead">
    Un incendio de grandes proporciones consumió este domingo el mercado oriental de Managua, uno de los centros comerciales más importantes de la capital nicaragüense. Bomberos trabajaron durante más de seis horas para controlar las llamas, pero no pudieron evitar que más de 500 puestos fueran destruidos.
  </p>

  <!-- Body: Cuerpo del Artículo -->
  <div class="typo-body">
    <p>
      El fuego se inició alrededor de las 3:00 a.m. en la sección de alimentos del mercado, según testigos. Las llamas se propagaron rápidamente debido a la gran cantidad de materiales inflamables almacenados en los puestos, incluyendo plásticos, madera y productos químicos.
    </p>

    <p>
      "Escuchamos gritos y cuando salimos, todo estaba ardiendo", relató María González, comerciante que perdió su puesto de 20 años. "Perdí todo mi capital, no sé qué voy a hacer ahora con mis tres hijos".
    </p>

    <p>
      El cuerpo de bomberos de Managua desplegó 15 unidades para combatir el incendio, pero la densidad del mercado y la falta de acceso dificultaron las labores de extinción. Hasta el momento no se reportan víctimas fatales, aunque dos personas sufrieron quemaduras leves al intentar salvar sus mercancías.
    </p>

    <p>
      El alcalde de Managua, Enrique Argüello, declaró que se abrirá una cuenta especial para ayudar a los afectados y que se evaluará la reconstrucción del mercado con medidas de seguridad más estrictas.
    </p>
  </div>

  <!-- Caption: Pie de Foto -->
  <figure class="article-figure">
    <img src="incendio-mercado.jpg" alt="Bomberos combaten incendio en mercado oriental de Managua" />
    <figcaption class="typo-caption">
      Bomberos trabajan para controlar el incendio que destruyó más de 500 puestos en el mercado oriental de Managua. Foto: Nicaragua Informate
    </figcaption>
  </figure>
</article>
```

## 6. Reglas de Accesibilidad

### Contraste WCAG AA
- **Texto normal (16px+):** Mínimo 4.5:1
- **Texto grande (18px+ bold, 24px+ normal):** Mínimo 3:1
- **Componentes de interfaz:** Mínimo 3:1

### Verificación de Contraste
| Color | Fondo #fff | Ratio | Estado |
|-------|-----------|-------|--------|
| #111111 | #ffffff | 15.3:1 | ✅ AA+ |
| #333333 | #ffffff | 12.6:1 | ✅ AA+ |
| #666666 | #ffffff | 7.0:1 | ✅ AA |
| #737373 | #ffffff | 5.9:1 | ✅ AA |
| #a3a3a3 | #ffffff | 3.5:1 | ⚠️ Solo para texto grande |

### Tamaño Mínimo
- **Cuerpo de texto:** 16px en móvil (WCAG recomienda 18px)
- **Títulos:** 28px en móvil (legible en luz solar)
- **Metadatos:** 12px en móvil (mínimo legible)

### Interlineado
- **Cuerpo:** 1.65 (recomendado para lectura prolongada)
- **Títulos:** 1.2-1.3 (compacto pero legible)
- **Lead:** 1.6 (espacio para respiración visual)

## 7. Optimización para Luz Solar (Nicaragua)

### Ajustes para Alta Luminosidad
- **Texto:** #111111 (no #000000, evita fatiga visual)
- **Fondo:** #FFFFFF (máximo contraste)
- **Sombra en texto:** Evitar (reduce legibilidad en luz directa)
- **Grosor de fuente:** 400-800 (evitar 100-300, ilegible en luz solar)

### Recomendaciones de UI
- Evitar gradientes de fondo en áreas de texto
- Usar bordes sólidos (#f0f0f0) en lugar de sombras para separación
- Aumentar padding en botones (mínimo 12px vertical)
- Iconos: #333333 mínimo, nunca #999999 en áreas clave
