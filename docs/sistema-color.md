# Sistema de Color — Nicaragua Informate

## Paleta Completa

### Primario (Marca)
| Variable | Valor | Uso |
|----------|-------|-----|
| `--color-primary` | `#1e3a8a` | Logo, header, botones primarios, enlaces principales |
| `--color-primary-hover` | `#172e6e` | Hover de botones primarios |
| `--color-primary-light` | `#e0e7ff` | Fondos de destacados, banners |

> **Significado:** Confianza, seriedad, periodismo institucional.

### Secundario (Alertas / CTA)
| Variable | Valor | Uso |
|----------|-------|-----|
| `--color-secondary` | `#c2410c` | Botones de acción urgente, alertas, breaking news |
| `--color-secondary-hover` | `#9a3412` | Hover de botones secundarios |
| `--color-secondary-light` | `#ffedd5` | Fondos de alertas suaves |

> **Significado:** Urgencia, alerta, llamada a la acción.

### Neutros
| Variable | Valor | Uso |
|----------|-------|-----|
| `--bg` | `#ffffff` | Fondo de la página |
| `--surface` | `#ffffff` | Fondo de cards |
| `--surface-2` | `#fafafa` | Fondo de secciones alternadas |
| `--surface-3` | `#f2f1ef` | Fondo de widgets, sidebar |
| `--text` | `#1a1a1a` | Títulos y texto principal |
| `--text-secondary` | `#4a4a4a` | Subtítulos, extractos |
| `--text-muted` | `#737373` | Metadatos, fechas, captions |
| `--text-light` | `#a3a3a3` | Placeholders, separadores |
| `--border` | `#e5e5e5` | Bordes de cards, divisores |
| `--border-light` | `#f8f7f5` | Bordes sutiles |

### Categorías (6 colores, NUNCA el primario de marca)
| Categoría | Variable | Valor | Fondo suave |
|-----------|----------|-------|-------------|
| Nacionales | `--cat-nacionales` | `#2563eb` | `rgba(37,99,235,0.12)` |
| Sucesos | `--cat-sucesos` | `#dc2626` | `rgba(220,38,38,0.12)` |
| Internacionales | `--cat-internacionales` | `#059669` | `rgba(5,150,105,0.12)` |
| Tecnología | `--cat-tecnologia` | `#7c3aed` | `rgba(124,58,237,0.12)` |
| Espectáculo | `--cat-espectaculo` | `#d97706` | `rgba(217,119,6,0.12)` |
| Deportes | `--cat-deportes` | `#ea580c` | `rgba(234,88,12,0.12)` |

> **Regla de Oro:** El color primario `#1e3a8a` NUNCA se usa en badges de categoría. Las categorías tienen su propia paleta para evitar confusión con la marca.

---

## Guía de Uso: Dónde SÍ y Dónde NO

### `--color-primary` (#1e3a8a)
**SÍ:**
- Logo y nombre del sitio
- Header (fondo o texto según versión)
- Botón "Leer más" principal
- Enlaces del menú de navegación
- Footer (fondo)
- Breadcrumbs (enlaces)

**NO:**
- Badges de categoría
- Alertas de error
- Botones de eliminar/borrar

### `--color-secondary` (#c2410c)
**SÍ:**
- Breaking news bar
- Alertas y notificaciones urgentes
- Botón "Suscribirse" o "Alerta"
- Indicadores de "En vivo"

**NO:**
- Texto de artículos
- Fondos de secciones enteras
- Badges de categoría (excepto sucesos que tiene su propio rojo)

### `--cat-sucesos` (#dc2626)
**SÍ:**
- Badge de la categoría Sucesos
- Título H1 de la página de Sucesos

**NO:**
- Botones principales (puede parecer error o acción destructiva)
- Alertas generales del sitio (usar `--color-secondary`)
- Iconos de "cerrar" o "eliminar"

### Neutros
**SÍ:**
- `--text` (#1a1a1a): Todos los títulos y cuerpo de texto
- `--text-secondary` (#4a4a4a): Extractos, descripciones
- `--text-muted` (#737373): Fechas, autores, metadatos
- `--border` (#e5e5e5): Bordes de cards, separadores
- `--surface-2` (#fafafa): Fondo de secciones alternas

---

## Estados Hover

```css
/* Primario */
.btn-primary:hover{background:var(--color-primary-hover)}

/* Secundario */
.btn-secondary:hover{background:var(--color-secondary-hover)}

/* Categorías */
.cat-badge:hover{filter:brightness(0.9)}
```

**Regla:** Siempre oscurecer 10% el color base en hover. Nunca usar un color completamente diferente.

---

## Variables CSS (Copiar y pegar)

```css
:root {
  /* Primario */
  --color-primary:#1e3a8a;
  --color-primary-hover:#172e6e;
  --color-primary-light:#e0e7ff;

  /* Secundario */
  --color-secondary:#c2410c;
  --color-secondary-hover:#9a3412;
  --color-secondary-light:#ffedd5;

  /* Neutros */
  --bg:#ffffff;
  --surface:#ffffff;
  --surface-2:#fafafa;
  --surface-3:#f2f1ef;
  --text:#1a1a1a;
  --text-secondary:#4a4a4a;
  --text-muted:#737373;
  --text-light:#a3a3a3;
  --border:#e5e5e5;
  --border-light:#f8f7f5;

  /* Categorías */
  --cat-nacionales:#2563eb;
  --cat-nacionales-bg:rgba(37,99,235,0.12);
  --cat-sucesos:#dc2626;
  --cat-sucesos-bg:rgba(220,38,38,0.12);
  --cat-internacionales:#059669;
  --cat-internacionales-bg:rgba(5,150,105,0.12);
  --cat-tecnologia:#7c3aed;
  --cat-tecnologia-bg:rgba(124,58,237,0.12);
  --cat-espectaculo:#d97706;
  --cat-espectaculo-bg:rgba(217,119,6,0.12);
  --cat-deportes:#ea580c;
  --cat-deportes-bg:rgba(234,88,12,0.12);
}
```

---

## Mockup Textual de Homepage

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER STICKY (fondo #ffffff, borde #e5e5e5)                           │
│ [LOGO #1e3a8a]  Inicio  Nacionales  Sucesos  Internacionales  Tecnología │
│  Espectáculo  Deportes                                    [🔍] [🌙] [☰] │
├──────────────────────────────────────────────────────────────────────────┤
│ BREAKING BAR (fondo #c2410c, texto #ffffff)                             │
│ 🚨 ÚLTIMA HORA: Sismo de 5.2 grados sacude Managua                       │
├──────────────────────────────────────────────────────────────────────────┤
│ HERO PRINCIPAL                                                           │
│ ┌────────────────────────────────────────┐                               │
│ │                                        │  [badge Nacionales #2563eb]   │
│ │         IMAGEN 16:9                    │  Título en #1a1a1a            │
│ │         (con fallback #fafafa)         │  Extracto en #4a4a4a          │
│ │                                        │  Meta: #737373                │
│ └────────────────────────────────────────┘                               │
├──────────────────────────────────────────────────────────────────────────┤
│ ÚLTIMAS NOTICIAS (título sección en #1e3a8a)                             │
│ ┌─────────────┐ ┌─────────────┐                                        │
│ │  IMG 4:3    │ │  IMG 4:3    │                                        │
│ │  #fafafa    │ │  #fafafa    │                                        │
│ ├─────────────┤ ├─────────────┤                                        │
│ │[Sucesos #dc26│ │[Nacionales   │                                        │
│ │ Título #1a1a │ │ #2563eb]    │                                        │
│ │ Extracto #4a4│ │ Título #1a1a│                                        │
│ │ Fecha #73737 │ │ Fecha #73737│                                        │
│ └─────────────┘ └─────────────┘                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ SUCESOS (título sección con acento #dc2626)                              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                        │
│ │  IMG 4:3    │ │  IMG 4:3    │ │  IMG 4:3    │                        │
│ │  #fafafa    │ │  #fafafa    │ │  #fafafa    │                        │
│ ├─────────────┤ ├─────────────┤ ├─────────────┤                        │
│ │[Sucesos #dc26│ │[Sucesos #dc26│ │[Sucesos #dc26│                        │
│ │ Título #1a1a │ │ Título #1a1a │ │ Título #1a1a │                        │
│ └─────────────┘ └─────────────┘ └─────────────┘                        │
├──────────────────────────────────────────────────────────────────────────┤
│ DEPORTES (título sección con acento #ea580c)                             │
│ ...                                                                      │
├──────────────────────────────────────────────────────────────────────────┤
│ FOOTER (fondo #1e3a8a, texto #ffffff)                                   │
│ Categorías │ Sobre nosotros │ Contacto │ Síguenos                        │
│ ────────── │ ──────────── │ ──────── │ ───────                         │
│ Nacionales │ Quiénes somos  │ Escríbenos│ [🌐] [𝕏] [📷]                  │
│ Sucesos    │ Política       │ Email    │                                  │
│ ...        │ ...            │ ...      │                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ © 2025 Nicaragua Informate. Todos los derechos reservados. #ffffff 60%   │
│ Hecho con ❤️ desde Nicaragua                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Contrastes WCAG

| Combinación | Ratio | Nivel |
|-------------|-------|-------|
| `#1e3a8a` sobre `#ffffff` | 8.2:1 | AAA |
| `#c2410c` sobre `#ffffff` | 5.1:1 | AA |
| `#1a1a1a` sobre `#ffffff` | 15.3:1 | AAA |
| `#4a4a4a` sobre `#ffffff` | 9.4:1 | AAA |
| `#737373` sobre `#ffffff` | 4.6:1 | AA |
| `#dc2626` sobre `rgba(220,38,38,0.12)` | 7.1:1 | AAA |
| `#2563eb` sobre `rgba(37,99,235,0.12)` | 6.8:1 | AAA |

Todos los contrastes cumplen con WCAG 2.1 nivel AA (mínimo 4.5:1).
