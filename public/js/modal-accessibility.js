/**
 * ModalAccessibility - Sistema de accesibilidad para modales
 * @version 1.0.0
 * @author Nicaragua Informate
 * 
 * Características:
 * - Focus trap (navegación con Tab contenida en el modal)
 * - Escape para cerrar
 * - Restauración de foco al cerrar
 * - Atributos ARIA automáticos
 * - Prevención de scroll en body
 */

class ModalAccessibility {
  constructor(modalId, options = {}) {
    this.modalId = modalId;
    this.modal = document.getElementById(modalId);
    
    if (!this.modal) {
      console.warn(`Modal con ID "${modalId}" no encontrado`);
      return;
    }

    this.config = {
      closeOnEscape: options.closeOnEscape ?? true,
      closeOnBackdropClick: options.closeOnBackdropClick ?? true,
      restoreFocus: options.restoreFocus ?? true,
      onOpen: options.onOpen || null,
      onClose: options.onClose || null
    };

    // Selectores de elementos enfocables
    this.focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    this.firstFocusable = null;
    this.lastFocusable = null;
    this.previouslyFocused = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    // Asegurar atributos ARIA básicos
    if (!this.modal.hasAttribute('role')) {
      this.modal.setAttribute('role', 'dialog');
    }
    if (!this.modal.hasAttribute('aria-modal')) {
      this.modal.setAttribute('aria-modal', 'true');
    }
    if (!this.modal.hasAttribute('tabindex')) {
      this.modal.setAttribute('tabindex', '-1');
    }

    // Bind de métodos
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
  }

  open() {
    if (this.isOpen) return;

    // Guardar elemento con foco actual
    if (this.config.restoreFocus) {
      this.previouslyFocused = document.activeElement;
    }

    // Mostrar modal
    this.modal.style.display = 'flex';
    this.isOpen = true;

    // Prevenir scroll en body
    document.body.style.overflow = 'hidden';

    // Configurar focus trap
    this.setupFocusTrap();

    // Event listeners
    this.modal.addEventListener('keydown', this.handleKeyDown);
    
    if (this.config.closeOnBackdropClick) {
      this.modal.addEventListener('click', this.handleBackdropClick);
    }

    // Enfocar el modal después de un pequeño delay para animaciones
    setTimeout(() => {
      if (this.firstFocusable) {
        this.firstFocusable.focus();
      } else {
        this.modal.focus();
      }
    }, 100);

    // Callback
    if (typeof this.config.onOpen === 'function') {
      this.config.onOpen(this.modal);
    }

    console.log(`♿ Modal "${this.modalId}" abierto con accesibilidad`);
  }

  close() {
    if (!this.isOpen) return;

    // Ocultar modal
    this.modal.style.display = 'none';
    this.isOpen = false;

    // Restaurar scroll en body
    document.body.style.overflow = '';

    // Remover event listeners
    this.modal.removeEventListener('keydown', this.handleKeyDown);
    this.modal.removeEventListener('click', this.handleBackdropClick);

    // Restaurar foco
    if (this.config.restoreFocus && this.previouslyFocused) {
      this.previouslyFocused.focus();
      this.previouslyFocused = null;
    }

    // Callback
    if (typeof this.config.onClose === 'function') {
      this.config.onClose(this.modal);
    }

    console.log(`♿ Modal "${this.modalId}" cerrado`);
  }

  setupFocusTrap() {
    // Obtener todos los elementos enfocables
    const focusableElements = this.modal.querySelectorAll(this.focusableSelectors);
    const focusableArray = Array.from(focusableElements);

    if (focusableArray.length === 0) {
      this.firstFocusable = null;
      this.lastFocusable = null;
      return;
    }

    this.firstFocusable = focusableArray[0];
    this.lastFocusable = focusableArray[focusableArray.length - 1];
  }

  handleKeyDown(e) {
    // Escape para cerrar
    if (e.key === 'Escape' && this.config.closeOnEscape) {
      e.preventDefault();
      this.close();
      return;
    }

    // Focus trap con Tab
    if (e.key === 'Tab') {
      // Si no hay elementos enfocables, prevenir Tab
      if (!this.firstFocusable) {
        e.preventDefault();
        return;
      }

      // Shift + Tab en el primer elemento -> ir al último
      if (e.shiftKey && document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable.focus();
      }
      // Tab en el último elemento -> ir al primero
      else if (!e.shiftKey && document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable.focus();
      }
    }
  }

  handleBackdropClick(e) {
    // Solo cerrar si se hace clic en el backdrop, no en el contenido
    if (e.target === this.modal) {
      this.close();
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  updateFocusableElements() {
    // Útil si el contenido del modal cambia dinámicamente
    this.setupFocusTrap();
  }

  destroy() {
    if (this.isOpen) {
      this.close();
    }
    
    this.modal.removeEventListener('keydown', this.handleKeyDown);
    this.modal.removeEventListener('click', this.handleBackdropClick);
    
    console.log(`♿ ModalAccessibility destruido para "${this.modalId}"`);
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ModalAccessibility = ModalAccessibility;
}

// Helper: Crear clase visually-hidden si no existe
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.id = 'modal-accessibility-styles';
  style.textContent = `
    .visually-hidden {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
    
    /* Mejorar indicador de foco */
    [role="dialog"]:focus {
      outline: none;
    }
    
    [role="dialog"] *:focus {
      outline: 2px solid #3B82F6;
      outline-offset: 2px;
    }
    
    [role="dialog"] button:focus {
      outline: 2px solid #3B82F6;
      outline-offset: 2px;
    }
  `;
  
  // Agregar estilos cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!document.getElementById('modal-accessibility-styles')) {
        document.head.appendChild(style);
      }
    });
  } else {
    if (!document.getElementById('modal-accessibility-styles')) {
      document.head.appendChild(style);
    }
  }
}
