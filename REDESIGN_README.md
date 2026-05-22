# 🇳🇮 Rediseño Profesional de Nicaragua Informate

## Overview

Este rediseño moderniza **nicaragua-informate.com** con un stack profesional Next.js/TypeScript, implementando una arquitectura de componentes reutilizables, estilos CSS modulares y una experiencia mobile-first.

## ✨ Características Principales

### 🎨 Diseño
- **Mobile-First**: Base optimizada para móvil (320px), escalable a desktop (1920px+)
- **Paleta de Colores Profesional**:
  - Azul marino: `#0f1b33` (primario)
  - Dorado/Beige: `#c9a96e` (acento)
  - Fondo cálido: `#faf9f6`
  - Tipografía: Inter (UI) + Merriweather (contenido)

### 🖥️ Componentes Reutilizables

```
components/
├── Header.tsx              # Navegación sticky con menú móvil
├── MobileMenu.tsx          # Menú hamburguesa deslizable
├── ProgressBar.tsx         # Barra de progreso de lectura
├── HeroSection.tsx         # Noticia destacada principal
├── NewsCard.tsx            # Tarjeta reutilizable de noticia
├── NewsGrid.tsx            # Grid de noticias por sección
├── Sidebar.tsx             # Lo más leído, tags, newsletter
├── Footer.tsx              # Pie de página de 4 columnas
├── ArticlePage.tsx         # Página completa de artículo
├── ShareBar.tsx            # Botones de compartir en redes
└── AuthorBox.tsx           # Perfil del autor con redes sociales
```

### 🎯 Hooks Personalizados

```
hooks/
├── useTheme.ts             # Modo oscuro/claro con localStorage
└── useScrollProgress.ts    # Progreso de scroll para lectura
```

### 🎨 Estilos Modulares

```
app/styles/
├── globals.css             # Variables CSS, reset, base
├── components.css          # Estilos de componentes
└── responsive.css          # Media queries (mobile-first)
```

## 📱 Breakpoints (Mobile-First)

| Breakpoint | Ancho | Uso |
|-----------|-------|-----|
| Mobile | 320px - 639px | Smartphones |
| sm | 640px+ | Tablets pequeñas |
| md | 768px+ | Tablets |
| lg | 1024px+ | Escritorio |
| xl | 1280px+ | Pantallas grandes |
| 2xl | 1920px+ | Pantallas XL |

## 🌓 Modo Oscuro/Claro

- Toggle en el header
- Persistencia en localStorage
- Variables CSS automáticas
- Soporte para preferencia del sistema

## ♿ Accesibilidad (WCAG 2.1 AA)

- ✅ Contraste mínimo 4.5:1
- ✅ Skip-to-content link
- ✅ ARIA labels en botones
- ✅ Alt text en imágenes
- ✅ Focus states visibles
- ✅ Navegación con Tab

## 📄 Páginas Rediseñadas

### 1. Home (`/`)
- Hero section con noticia destacada
- Grid de noticias (2 columnas móvil, 3 tablets, 4 escritorio)
- Sidebar: Lo más leído, newsletter, tags
- Footer profesional

### 2. Página Individual (`/noticias/[slug]`)
- Breadcrumb de navegación
- Metadatos completos (autor, fecha, categoría)
- Imagen hero responsiva
- Contenido formateado con párrafos, títulos, listas
- Barra de compartir (Facebook, Twitter, WhatsApp, copiar)
- Tags del artículo
- Caja del autor con bio y redes
- Noticias relacionadas (3 tarjetas)
- Sidebar con trending y newsletter
- Barra de progreso de lectura

## 🎬 Animaciones & Transiciones

- Fade-in al cargar elementos
- Slide-in en navegación
- Hover effects en tarjetas (elevación + borde dorado)
- Transiciones suaves entre estados
- Respeto a `prefers-reduced-motion`

## 📦 Estructura de Archivos

```
app/
├── styles/
│   ├── globals.css          # Variables y base
│   ├── components.css       # Componentes
│   └── responsive.css       # Media queries
├── layout.tsx               # Layout raíz con Header, Footer
├── page.tsx                 # Home page
└── noticias/
    └── [slug]/
        └── page.tsx         # Página individual

components/
├── Header.tsx
├── MobileMenu.tsx
├── ProgressBar.tsx
├── HeroSection.tsx
├── NewsCard.tsx
├── NewsGrid.tsx
├── Sidebar.tsx
├── Footer.tsx
├── ArticlePage.tsx
├── ShareBar.tsx
└── AuthorBox.tsx

hooks/
├── useTheme.ts
└── useScrollProgress.ts
```

## 🚀 Uso

### Importar Componentes
```tsx
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import Sidebar from '@/components/Sidebar';
import ArticlePage from '@/components/ArticlePage';
```

### Usar Hooks
```tsx
'use client';

import { useTheme } from '@/hooks/useTheme';
import { useScrollProgress } from '@/hooks/useScrollProgress';

export default function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  const progress = useScrollProgress();

  return (
    <div>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <div style={{ width: `${progress}%` }} />
    </div>
  );
}
```

## 🎨 Personalización de Colores

Modificar variables en `app/styles/globals.css`:

```css
:root {
  --primary: #0f1b33;        /* Azul marino */
  --accent: #c9a96e;         /* Dorado */
  --background: #faf9f6;     /* Fondo */
  --text: #1a1a1a;           /* Texto */
}

[data-theme="dark"] {
  --primary: #0f1b33;
  --background: #0f1b33;
  --text: #faf9f6;
}
```

## 📊 Ventajas del Rediseño

| Aspecto | Antes | Después |
|--------|-------|---------|
| Tipografía | Genérica | Serif para títulos, Sans para UI |
| Hero | Inexistente | Noticia destacada con imagen |
| Grid | Lista plana | 2-4 columnas responsivo |
| Sidebar | Ausente | Lo más leído, tags, newsletter |
| Modo Oscuro | No | Sí, con persistencia |
| Animaciones | Ninguna | Fade-in, slide, hover effects |
| Mobile | Básico | Menú hamburguesa, fully responsive |
| Accesibilidad | Mínima | WCAG 2.1 AA completo |
| SEO | Good | Optimizado con Schema.org |

## 🔧 Stack Tecnológico

- **Framework**: Next.js 14
- **Lenguaje**: TypeScript
- **Estilos**: CSS Puro (Variables CSS)
- **Tipografía**: Google Fonts (Inter, Merriweather)
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Iconos**: Lucide React
- **Fechas**: date-fns
- **SEO**: Schema.org JSON-LD

## 🌐 Navegadores Soportados

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome mobile)

## 📈 Mejoras de Rendimiento

- Lazy loading de imágenes
- Code splitting automático
- CSS crítico optimizado
- Variables CSS para transiciones suaves
- Animations respeta `prefers-reduced-motion`

## 🎯 Próximos Pasos (Roadmap)

- [ ] Sistema de paginación en home
- [ ] Filtros por categoría avanzados
- [ ] Search bar global
- [ ] Comments section
- [ ] Reading time estimado
- [ ] Social sharing mejorado
- [ ] AMP version
- [ ] PWA offline support

## 📝 Notas de Implementación

1. **CSS Puro**: No se usa Tailwind ni Bootstrap, todo CSS personalizado con variables
2. **Sin Inline Styles**: Estilos en archivos CSS separados (excepto dinámicos en handlers)
3. **Componentes Separados**: Cada componente es un archivo independiente
4. **Mobile-First**: Media queries comienzan desde mobile y escalan hacia arriba
5. **Accesibilidad**: Todos los elementos interactivos son navegables con teclado

## 🤝 Contribuir

Para mantener la consistencia:

1. Respetar la estructura de componentes separados
2. Usar variables CSS definidas en `globals.css`
3. Implementar mobile-first en media queries
4. Agregar aria-labels en elementos interactivos
5. Testear en móvil, tablet y desktop

---

**Diseñado con ❤️ para Nicaragua Informate**  
Última actualización: Mayo 2026
