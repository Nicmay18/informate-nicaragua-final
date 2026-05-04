# Content Protection Module

Sistema modular de protección de contenido para Nicaragua Informate.

## Características

- ✅ Protección contra clic derecho
- ✅ Protección contra copiar/pegar
- ✅ Protección contra atajos de teclado (F12, Ctrl+C, etc.)
- ✅ Protección contra arrastrar imágenes
- ✅ Modal personalizable con botones de compartir
- ✅ Configuración flexible
- ✅ Auto-cierre configurable
- ✅ Soporte para accesibilidad (permite selección en inputs)

## Uso Básico

```html
<!-- Incluir el script -->
<script src="/js/content-protection.js"></script>

<!-- Inicializar con configuración por defecto -->
<script>
  new ContentProtection();
</script>
```

## Configuración Avanzada

```javascript
new ContentProtection({
  // Habilitar/deshabilitar protección
  enabled: true,
  
  // Permitir selección de texto (para accesibilidad)
  allowTextSelection: false,
  
  // Mensaje personalizado
  message: 'Tu mensaje personalizado aquí',
  
  // Título del modal
  title: 'Contenido Protegido',
  
  // Nombre del sitio
  siteName: 'Nicaragua Informate',
  
  // URL para compartir
  shareUrl: window.location.href,
  
  // Tiempo de auto-cierre (ms), 0 para deshabilitar
  autoCloseDelay: 5000,
  
  // Protecciones individuales
  preventContextMenu: true,
  preventCopy: true,
  preventKeyboardShortcuts: true,
  preventDrag: true,
  
  // Mostrar botones de compartir
  showShareButtons: true
});
```

## Métodos

### destroy()

Desactiva la protección y limpia todos los event listeners y estilos.

```javascript
const protection = new ContentProtection();

// Más tarde...
protection.destroy();
```

## Ejemplos de Uso

### Protección Básica

```javascript
// Protección completa con configuración por defecto
new ContentProtection();
```

### Protección con Selección de Texto Permitida

```javascript
// Útil para mejorar accesibilidad
new ContentProtection({
  allowTextSelection: true,
  preventCopy: true // Aún previene copiar
});
```

### Protección Solo de Imágenes

```javascript
// Solo protege imágenes y videos
new ContentProtection({
  preventContextMenu: true,
  preventDrag: true,
  preventCopy: false,
  preventKeyboardShortcuts: false,
  allowTextSelection: true
});
```

### Protección Sin Botones de Compartir

```javascript
// Modal simple sin botones sociales
new ContentProtection({
  showShareButtons: false,
  message: 'Este contenido está protegido'
});
```

### Protección Temporal

```javascript
// Activar protección por 1 hora
const protection = new ContentProtection();

setTimeout(() => {
  protection.destroy();
}, 3600000); // 1 hora
```

## Personalización de Estilos

El módulo inyecta estilos CSS automáticamente. Para personalizar:

```css
/* Sobrescribir estilos del modal */
.protection-modal {
  border-radius: 20px !important;
  padding: 48px !important;
}

.protection-btn {
  border-radius: 12px !important;
}
```

## Compatibilidad

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+
- ✅ Móviles (iOS Safari, Chrome Android)

## Notas de Seguridad

⚠️ **Importante**: Esta protección es a nivel de interfaz de usuario. Usuarios técnicos avanzados pueden:
- Deshabilitar JavaScript
- Usar herramientas de desarrollador
- Inspeccionar el código fuente

Esta protección está diseñada para:
- Disuadir usuarios casuales
- Promover el uso de botones oficiales de compartir
- Proteger contra scraping básico

## Licencia

© 2026 Nicaragua Informate. Todos los derechos reservados.
