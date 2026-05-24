# Checklist de Calidad Frontend - Pre-publicación

## REGLAS DE ACCESIBILIDAD

### 1. CONTRASTE WCAG AA
- [ ] Todo texto sobre imagen debe pasar WCAG AA (4.5:1)
- [ ] Verificar con herramienta online: https://webaim.org/resources/contrastchecker/
- [ ] Overlay de hero debe tener opacidad suficiente (0.8-0.9) para texto blanco
- [ ] Texto sobre fondo oscuro (#0f172a) debe ser blanco o #e2e8f0 con contraste > 4.5:1

### 2. COLORES DE CATEGORÍA
- [ ] Sucesos (#dc2626): contraste > 3:1 sobre blanco, > 4.5:1 sobre oscuro
- [ ] Nacionales (#2563eb): contraste > 3:1 sobre blanco, > 4.5:1 sobre oscuro
- [ ] Espectáculos (#db2777): contraste > 3:1 sobre blanco, > 4.5:1 sobre oscuro
- [ ] Deportes (#ea580c): contraste > 3:1 sobre blanco, > 4.5:1 sobre oscuro
- [ ] Tecnología (#7c3aed): contraste > 3:1 sobre blanco, > 4.5:1 sobre oscuro
- [ ] Internacionales (#059669): contraste > 3:1 sobre blanco, > 4.5:1 sobre oscuro
- [ ] Badge pill con 0.9 opacidad sobre imagen para mejor legibilidad

### 3. FOCUS VISIBLE
- [ ] Outline 2px #d4a373 para todos los elementos interactivos (botones, links, inputs)
- [ ] Focus visible en modo oscuro y claro
- [ ] Focus visible en drawer móvil y menú desktop
- [ ] Focus visible en cards y CTAs

### 4. SKIP LINK
- [ ] "Ir al contenido principal" oculto hasta focus
- [ ] Position absolute, top -40px, z-index 10000
- [ ] Transition top 0.3s para smooth reveal
- [ ] Background #0f172a, color white, padding 8px 16px

### 5. ALT TEXT DESCRIPTIVO
- [ ] Nunca genérico como "imagen" o "foto"
- [ ] Describir acción o contexto: "Pista del aeropuerto de Bluefields en obras de modernización"
- [ ] Incluir contexto de categoría si es relevante
- [ ] Para imágenes decorativas, alt="" (vacío)

## REGLAS DE PERFORMANCE

### 6. LCP DEL HERO < 2.5s
- [ ] Preload de imagen hero con fetchpriority="high"
- [ ] Imagen hero en WebP, < 150KB
- [ ] Thumbnails en WebP, < 80KB
- [ ] LCP medido con Lighthouse: < 2.5s

### 7. IMÁGENES OPTIMIZADAS
- [ ] Formato WebP para todas las imágenes
- [ ] Hero: max-width 1920px, calidad 85%, < 150KB
- [ ] Thumbnails: max-width 400px, calidad 80%, < 80KB
- [ ] Lazy loading para imágenes below-the-fold (loading="lazy")

### 8. FUENTES OPTIMIZADAS
- [ ] Google Fonts con display=swap
- [ ] Merriweather: weights 400, 700, 900
- [ ] Inter: weights 400, 500, 600
- [ ] Self-hosting opcional para mejor performance

### 9. PREFERS-REDUCED-MOTION
- [ ] Animaciones respetan prefers-reduced-motion
- [ ] Pulse animations deshabilitadas si reduced-motion
- [ ] Transiciones suaves pero no abruptas
- [ ] No autoplay de videos en reduced-motion

## VALIDACIÓN DE CATEGORÍAS

### 10. CATEGORÍAS REALES
- [ ] Categoría es una de las 6: Sucesos, Nacionales, Espectáculos, Deportes, Tecnología, Internacionales
- [ ] Si trata de economía local → asignar a "Nacionales"
- [ ] Si trata de economía global → asignar a "Internacionales"
- [ ] Nunca crear categoría "Economía" en CMS
- [ ] Badge de categoría usa color correcto según paleta

---

## PROCESO DE VALIDACIÓN

1. **Antes de publicar**: Ejecutar checklist completo
2. **Verificar contraste**: Usar WebAIM Contrast Checker
3. **Testear focus**: Navegar con Tab, verificar outline #d4a373
4. **Testear reduced-motion**: Habilitar en OS, verificar animaciones
5. **Medir LCP**: Lighthouse → Performance → LCP
6. **Validar categoría**: Confirmar que es una de las 6 reales

## HERRAMIENTAS DE VALIDACIÓN

- **Contraste**: https://webaim.org/resources/contrastchecker/
- **Lighthouse**: Chrome DevTools → Lighthouse
- **AXE**: Chrome DevTools → Accessibility
- **WAVE**: https://wave.webaim.org/
- **Screen Reader**: NVDA (Windows), VoiceOver (Mac)
