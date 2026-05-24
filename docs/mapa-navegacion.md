# Mapa de Navegación Visual — Nicaragua Informate

## Regla de Accesibilidad
**El buscador debe estar visible en menos de 2 segundos.** El icono de lupa siempre está accesible en el header; el input se expande al hacer click.

---

## 1. Header Sticky (Desktop > 768px)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [LOGO]          Inicio  Nacionales  Sucesos  Internacionales  Tecnología  Economía  Deportes    🔍 🌙 │
└─────────────────────────────────────────────────────────────────────┘
```

### Especificaciones Desktop
| Elemento | Especificación |
|----------|---------------|
| Altura | 64px |
| Fondo | #ffffff (blanco) |
| Borde inferior | 1px solid #e5e5e5 |
| Sombra | shadow-sm (sutil) |
| Logo | Playfair Display, 1.5rem, color #0f1b33 |
| Nav items | Inter 0.82rem, weight 600, uppercase, color #4a4a4a |
| Hover nav | Línea dorada inferior (2px var(--accent)) |
| Search | Icono lupa → expande a 280px input al hacer click |
| Theme toggle | Icono sol/luna, 40x40px |
| Sticky | position: sticky; top: 0; z-index: 1000 |

---

## 2. Header Sticky (Móvil < 768px)

```
┌──────────────────────────────────┐
│ [LOGO]                    🔍 🌙 ☰ │
└──────────────────────────────────┘
```

### Al tocar ☰ (menú hamburguesa)
```
┌──────────────────────────────────┐
│ [LOGO]                    🔍 🌙 ✕ │
├──────────────────────────────────┤
│ Inicio                           │
│ Nacionales                       │
│ Sucesos                          │
│ Internacionales                  │
│ Tecnología                       │
│ Economía                         │
│ Deportes                         │
└──────────────────────────────────┘
```

### Especificaciones Móvil
| Elemento | Especificación |
|----------|---------------|
| Altura | 56px |
| Padding | 0 16px |
| Logo | 1.15rem |
| Nav | Oculto (se muestra en mobile-nav al tocar ☰) |
| Search | Icono lupa → expande a 200px input |
| Menú | ☰ hamburguesa, se convierte en ✕ al abrir |
| Mobile nav | Fondo blanco, borde inferior dorado, full width |
| Mobile nav items | 13px, uppercase, padding 12px 0, separador #f0eeea |

---

## 3. Breadcrumbs (Solo en artículos individuales)

```
Inicio > Sucesos > Incendio devora mercado oriental de Managua: miles de fa...
```

### Especificaciones
| Elemento | Especificación |
|----------|---------------|
| Ubicación | Debajo del header, encima del título del artículo |
| Texto | 13px, Inter, weight 500 |
| Color enlaces | #4a4a4a → hover #c9a96e (dorado) |
| Color separador | #a3a3a3, font-size 12px |
| Color actual (título) | #111111, weight 600, truncado con ellipsis |
| Max-width título | 400px desktop, 200px móvil |
| Separador | ">" |
| Estructura | Inicio > Categoría > Título truncado |

---

## 4. Barra de Búsqueda Expandible

### Estado cerrado (default)
```
[🔍]  ← solo icono visible
```

### Estado expandido
```
[Buscar noticias de Nicaragua...          ] [🔍]
```

### Especificaciones
| Elemento | Especificación |
|----------|---------------|
| Input | #f5f5f5 fondo, borde 1.5px #f0eeea, border-radius 100px |
| Placeholder | "Buscar noticias de Nicaragua..." |
| Font | Inter 0.85rem |
| Ancho expandido | 280px desktop, 200px móvil |
| Transición | width 0.3s ease, opacity 0.3s ease |
| Focus | Borde dorado, fondo blanco |
| Submit | Enter redirige a /buscar?q={query} |
| Botón activo (móvil) | Fondo #0f1b33, texto blanco |

---

## 5. Footer (Desktop > 768px)

```
┌─────────────────────────────────────────────────────────────────┐
│ CATEGORÍAS      SOBRE NOSOTROS      CONTACTO      SÍGUENOS     │
│ ──────────      ──────────────      ────────      ────────     │
│ Nacionales      Portal de noticias  Escríbenos    Mantente      │
│ Sucesos         independiente...    info@...      informado    │
│ Internacionales                     Privacidad      [🌐] [𝕏] [📷] [RSS]│
│ Tecnología                        Términos                     │
│ Economía                          Cookies                       │
│ Deportes                                                      │
│ Todas las noticias                                             │
├─────────────────────────────────────────────────────────────────┤
│          © 2025 Nicaragua Informate. Todos los derechos       │
│                    Hecho con ❤️ desde Nicaragua               │
└─────────────────────────────────────────────────────────────────┘
```

### Especificaciones Desktop
| Elemento | Especificación |
|----------|---------------|
| Grid | 4 columnas (repeat(4, 1fr)), gap 40px |
| Fondo | #0f1b33 (primary) |
| Texto | Blanco |
| Títulos | Playfair Display 1.1rem, weight 800 |
| Links | Inter 0.88rem, rgba(255,255,255,0.7), hover dorado |
| Iconos sociales | 36x36px, fondo rgba(255,255,255,0.1), hover dorado |
| Divider | 1px rgba(255,255,255,0.1), margin 32px |
| Copyright | 0.8rem, rgba(255,255,255,0.6) |
| Padding | 48px 24px 24px |

---

## 6. Footer (Móvil < 480px)

```
┌─────────────────────────────┐
│ CATEGORÍAS                  │
│ Nacionales                  │
│ Sucesos                     │
│ ...                         │
│                             │
│ SOBRE NOSOTROS              │
│ Portal de noticias...       │
│ Quiénes somos               │
│ ...                         │
│                             │
│ CONTACTO                    │
│ Escríbenos                  │
│ ...                         │
│                             │
│ SÍGUENOS                    │
│ Mantente informado          │
│ [🌐] [𝕏] [📷] [RSS]        │
├─────────────────────────────┤
│ © 2025 Nicaragua Informate │
│ Hecho con ❤️ desde Nicaragua│
└─────────────────────────────┘
```

### Especificaciones Móvil
| Elemento | Especificación |
|----------|---------------|
| Grid | 1 columna, gap 28px |
| Padding | 36px 20px 20px |
| Iconos | Misma especificación |

---

## 7. Footer (Tablet 480-768px)

```
┌──────────────────────────────────┐
│ CATEGORÍAS      SOBRE NOSOTROS   │
│ Internacionales Portal de...     │
│ ...             ...                │
│                                 │
│ CONTACTO        SÍGUENOS        │
│ Escríbenos      Mantente...     │
│ ...             [🌐] [𝕏] [📷]   │
├──────────────────────────────────┤
│ © 2025 Nicaragua Informate    │
└──────────────────────────────────┘
```

### Especificaciones Tablet
| Elemento | Especificación |
|----------|---------------|
| Grid | 2 columnas (1fr 1fr), gap 32px |
| Padding | 36px 20px 20px |

---

## 8. Flujo de Navegación Completo

### Homepage
```
[Header sticky] → [Radio player] → [Hero] → [Trends] → [Últimas noticias]
                                                      → [Nacionales] → [Sucesos] → ...
                                                      → [Sidebar: Más leídas, Clima, Newsletter]
                                                      → [Footer 4 cols]
                                                      → [Bottom nav (móvil)]
```

### Artículo Individual
```
[Header sticky] → [Breadcrumbs] → [Article hero] → [3 puntos clave] → [Cuerpo del artículo]
                                                              → [Sidebar: Relacionadas, Más leídas]
                                                              → [Footer 4 cols]
                                                              → [Bottom nav (móvil)]
```

### Categoría
```
[Header sticky] → [Radio player] → [Categoría destacada] → [Grid de noticias de la categoría]
                                                              → [Sidebar]
                                                              → [Footer 4 cols]
```

### Búsqueda
```
[Header sticky] → [Input de búsqueda expandido] → [Resultados grid] → [Footer]
```

---

## 9. Checklist de Navegación

- [ ] Logo siempre visible y clickable (vuelve a Inicio)
- [ ] Header sticky en todas las páginas
- [ ] 6 categorías accesibles en 1 click (desktop) o 2 clicks (móvil)
- [ ] Buscador visible en < 2 segundos (icono inmediato, input en 1 click)
- [ ] Breadcrumbs solo en artículos individuales
- [ ] Footer con acceso a todas las categorías, página de contacto, y redes sociales
- [ ] Bottom nav en móvil para acceso rápido a home, búsqueda, categorías
- [ ] Transiciones suaves (0.3s) en hover y expansión de elementos
