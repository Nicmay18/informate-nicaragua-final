# Sistema de Color V2 — Nicaragua Informate

## Paleta Institucional

| Rol | Variable | Valor | Uso |
|-----|----------|-------|-----|
| Header/Overlay | `--primary` | `#0f172a` | Fondo del header, hero overlay, footer |
| Header light | `--primary-light` | `#1a2d4d` | Gradientes, fondos oscuros |
| Header deep | `--primary-dark` | `#080f1f` | Fondos más profundos |
| CTA dorado | `--accent` | `#d4a373` | **EXCLUSIVO** para CTAs y slider activo |
| CTA hover | `--accent-hover` | `#b8945a` | Hover de botones dorados |
| Texto hero | — | `#ffffff` | Títulos sobre fondos oscuros |
| Badge base | — | `rgba(255,255,255,0.15)` | Fondo de badges en hero oscuro |
| Chips fondo | `--chip-bg` | `#f8fafc` | Fondo de chips de tendencias |
| Chips texto | `--chip-text` | `#64748b` | Texto de chips de tendencias |

> **Regla del dorado:** `#d4a373` es EXCLUSIVO para CTAs y estados activos del slider. No se usa en categorías.

---

## Colores de Categoría (6 distintivos — VETO: ningún otro)

| # | Categoría | Variable | Color | Fondo suave | Significado |
|---|-----------|----------|-------|-------------|-------------|
| 1 | **Sucesos** | `--cat-sucesos` | `#dc2626` | `rgba(220,38,38,0.12)` | Alerta, urgencia |
| 2 | **Nacionales** | `--cat-nacionales` | `#2563eb` | `rgba(37,99,235,0.12)` | Institucional, confianza |
| 3 | **Espectáculos** | `--cat-espectaculos` | `#db2777` | `rgba(219,39,119,0.12)` | Entretenimiento, magenta |
| 4 | **Deportes** | `--cat-deportes` | `#ea580c` | `rgba(234,88,12,0.12)` | Energía, dinamismo |
| 5 | **Tecnología** | `--cat-tecnologia` | `#7c3aed` | `rgba(124,58,237,0.12)` | Innovación, futuro |
| 6 | **Internacionales** | `--cat-internacionales` | `#059669` | `rgba(5,150,105,0.12)` | Mundo, global |

> **VETO ABSOLUTO:** Ningún otro color fuera de esta paleta de 6 + institucional puede usarse en categorías. "Economía" NO existe como categoría.

---

## Reglas de Uso

### DONDE SÍ usar el color de categoría
1. **Badge pill** de la categoría
2. **Rayita izquierda** en el menú móvil (`border-left: 3px solid`)
3. **Borde izquierdo** de card destacada (`border-left: 3px solid`)

### DONDE NUNCA usar el color de categoría
1. **Fondo completo de una sección** (satura visualmente)
2. **Botones principales** (confunde con CTAs)
3. **Texto de artículos** (reduce legibilidad)
4. **Fondos de cards** (excepto el fondo suave `rgba(...,0.12)`)

---

## Variables CSS (Copiar y pegar)

```css
:root {
  /* Institucional */
  --primary:#0f172a;
  --primary-light:#1a2d4d;
  --primary-dark:#080f1f;
  --accent:#d4a373;        /* EXCLUSIVO CTAs y slider activo */
  --accent-hover:#b8945a;
  --accent-light:#e8dcc8;

  /* Chips */
  --chip-bg:#f8fafc;
  --chip-text:#64748b;

  /* Categorías (6 colores — VETO: ningún otro) */
  --cat-sucesos:#dc2626;
  --cat-sucesos-bg:rgba(220,38,38,0.12);
  --cat-nacionales:#2563eb;
  --cat-nacionales-bg:rgba(37,99,235,0.12);
  --cat-espectaculos:#db2777;
  --cat-espectaculos-bg:rgba(219,39,119,0.12);
  --cat-deportes:#ea580c;
  --cat-deportes-bg:rgba(234,88,12,0.12);
  --cat-tecnologia:#7c3aed;
  --cat-tecnologia-bg:rgba(124,58,237,0.12);
  --cat-internacionales:#059669;
  --cat-internacionales-bg:rgba(5,150,105,0.12);
}
```

---

## Demo Visual: Badges sobre Fondo Oscuro (#0f172a)

```
┌──────────────────────────────────────────────────────────┐
│ FONDO: #0f172a                                            │
│                                                           │
│  [SUCESOS]        [NACIONALES]      [ESPECTACULOS]       │
│  bg:rgba(220,38,38,0.15)  bg:rgba(37,99,235,0.15)       │
│  text:#dc2626             text:#2563eb                   │
│                                                           │
│  [DEPORTES]       [TECNOLOGIA]      [INTERNACIONALES]    │
│  bg:rgba(234,88,12,0.15)  bg:rgba(124,58,237,0.15)      │
│  text:#ea580c             text:#7c3aed                   │
│                                                           │
│  [SUCESOS]  —  bg: rgba(255,255,255,0.15) sobre oscuro   │
│  text: #ffffff (para legibilidad sobre hero)             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Demo Visual: Badges sobre Fondo Claro (#ffffff)

```
┌──────────────────────────────────────────────────────────┐
│ FONDO: #ffffff                                            │
│                                                           │
│  [SUCESOS]        [NACIONALES]      [ESPECTACULOS]       │
│  bg:#fef2f2               bg:#eff6ff              bg:#fdf2f8│
│  text:#dc2626             text:#2563eb            text:#db2777│
│                                                           │
│  [DEPORTES]       [TECNOLOGIA]      [INTERNACIONALES]    │
│  bg:#fff7ed             bg:#f5f3ff              bg:#ecfdf5│
│  text:#ea580c             text:#7c3aed            text:#059669│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Clases CSS Disponibles

```css
/* Badges de categoría */
.cat-badge--sucesos
.cat-badge--nacionales
.cat-badge--espectaculos
.cat-badge--deportes
.cat-badge--tecnologia
.cat-badge--internacionales

/* Rayita menú móvil (requiere data-cat="{slug}") */
.mobile-nav a[data-cat="sucesos"]      /* border-left: 3px solid #dc2626 */
.mobile-nav a[data-cat="nacionales"]   /* border-left: 3px solid #2563eb */
.mobile-nav a[data-cat="espectaculos"] /* border-left: 3px solid #db2777 */
.mobile-nav a[data-cat="deportes"]     /* border-left: 3px solid #ea580c */
.mobile-nav a[data-cat="tecnologia"]   /* border-left: 3px solid #7c3aed */
.mobile-nav a[data-cat="internacionales"] /* border-left: 3px solid #059669 */

/* Borde card destacada (requiere data-cat="{slug}") */
.news-card.featured[data-cat="sucesos"]      /* border-left: 3px solid #dc2626 */
.news-card.featured[data-cat="nacionales"]   /* border-left: 3px solid #2563eb */
.news-card.featured[data-cat="espectaculos"] /* border-left: 3px solid #db2777 */
.news-card.featured[data-cat="deportes"]     /* border-left: 3px solid #ea580c */
.news-card.featured[data-cat="tecnologia"]   /* border-left: 3px solid #7c3aed */
.news-card.featured[data-cat="internacionales"] /* border-left: 3px solid #059669 */
```

---

## Regla de Veto

> **"Ningún otro color fuera de esta paleta de 6 + institucional puede usarse en categorías."**

- ❌ No crear una categoría "Economía" (no existe en el sitio)
- ❌ No usar `#1e3a8a` (azul corporativo) como color de categoría
- ❌ No usar `#d4a373` (dorado) como color de categoría
- ❌ No usar `#c2410c` o cualquier otro color no listado arriba
- ✅ Las 6 categorías son: Sucesos, Nacionales, Espectáculos, Deportes, Tecnología, Internacionales

---

## Mockup de Homepage con Colores Aplicados

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER: fondo #0f172a, logo blanco, nav items rgba(255,255,255,0.7) │
│ [LOGO] Inicio Sucesos Nacionales Espectaculos Deportes Tecnologia  │
│ Internacionales                                          [🔍] [🌙] │
├─────────────────────────────────────────────────────────────────────┤
│ HERO: imagen con overlay #0f172a a 85% opacidad                     │
│                                                                     │
│         ┌────────────────────────────────────┐                     │
│         │  [SUCESOS]  ← #dc2626 pill         │                     │
│         │  Título blanco #ffffff             │                     │
│         │  Extracto rgba(255,255,255,0.85)     │                     │
│         │  [Leer más →] ← CTA dorado #d4a373 │                     │
│         └────────────────────────────────────┘                     │
├─────────────────────────────────────────────────────────────────────┤
│ SUCESOS: título con acento #dc2626                                  │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│ │ [SUCESOS]    │ │ [SUCESOS]    │ │ [SUCESOS]    │               │
│ │ Título #1a1a │ │ Título #1a1a │ │ Título #1a1a │               │
│ └──────────────┘ └──────────────┘ └──────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│ DEPORTES: título con acento #ea580c                                 │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│ │ [DEPORTES]   │ │ [DEPORTES]   │ │ [DEPORTES]   │               │
│ │ Título #1a1a │ │ Título #1a1a │ │ Título #1a1a │               │
│ └──────────────┘ └──────────────┘ └──────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│ FOOTER: fondo #0f172a, texto blanco, iconos dorado hover            │
│ Categorías │ Sobre nosotros │ Contacto │ Síguenos                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Componentes React (Categorías actualizadas)

```tsx
// Header.tsx y Footer.tsx
const CATEGORIES = [
  { slug: 'sucesos', label: 'Sucesos' },
  { slug: 'nacionales', label: 'Nacionales' },
  { slug: 'espectaculos', label: 'Espectáculos' },
  { slug: 'deportes', label: 'Deportes' },
  { slug: 'tecnologia', label: 'Tecnología' },
  { slug: 'internacionales', label: 'Internacionales' },
];
```

> **Nota:** "Economía" ha sido eliminada. Las 6 categorías reales están confirmadas arriba.
