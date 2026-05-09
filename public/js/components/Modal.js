/**
 * Modal - Componente de modal accesible
 * @module components/Modal
 */

import { formatearFecha, toTitleCase, sanitizarImagen, calcularTiempoLectura } from '../core/utils.js';

export class Modal {
  constructor(modalId, options = {}) {
    this.modalId = modalId;
    this.modal = document.getElementById(modalId);
    
    if (!this.modal) {
      console.warn(`Modal: elemento "${modalId}" no encontrado`);
      return;
    }

    this.options = {
      closeOnEscape: true,
      closeOnBackdrop: true,
      restoreFocus: true,
      onOpen: null,
      onClose: null,
      ...options
    };

    this.isOpen = false;
    this.previouslyFocused = null;
    this.focusableElements = [];
    
    this.init();
  }

  /**
   * Inicializa el modal
   * @private
   */
  init() {
    // Asegurar atributos ARIA
    if (!this.modal.hasAttribute('role')) {
      this.modal.setAttribute('role', 'dialog');
    }
    if (!this.modal.hasAttribute('aria-modal')) {
      this.modal.setAttribute('aria-modal', 'true');
    }

    // Event listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
  }

  /**
   * Abre el modal con contenido de noticia
   * @param {Object} noticia - Datos de la noticia
   */
  openWithNoticia(noticia) {
    if (!noticia) return;

    const img = sanitizarImagen(noticia.imagen, noticia.id, noticia.categoria);
    const titulo = toTitleCase(noticia.titulo || '');
    const fecha = formatearFecha(noticia.fecha);
    const minLectura = calcularTiempoLectura(noticia.contenido || noticia.resumen || '');
    const contenido = noticia.contenido || noticia.resumen || '';

    // Actualizar contenido del modal
    const modalTitle = this.modal.querySelector('#modal-title');
    const modalImg = this.modal.querySelector('#mImg');
    const modalCat = this.modal.querySelector('#mCat');
    const modalFecha = this.modal.querySelector('#mFecha');
    const modalReadTime = this.modal.querySelector('#mReadTime');
    const modalCont = this.modal.querySelector('#mCont');

    if (modalTitle) modalTitle.textContent = titulo;
    if (modalImg) {
      modalImg.src = img;
      modalImg.alt = titulo;
    }
    if (modalCat) {
      modalCat.className = `tag ${noticia.categoria}`;
      modalCat.textContent = noticia.categoria;
    }
    if (modalFecha) modalFecha.textContent = `📅 ${fecha}`;
    if (modalReadTime) modalReadTime.textContent = minLectura;
    if (modalCont) modalCont.textContent = contenido;

    this.open();
  }

  /**
   * Abre el modal
   */
  open() {
    if (this.isOpen) return;

    // Guardar elemento con foco
    if (this.options.restoreFocus) {
      this.previouslyFocused = document.activeElement;
    }

    // Mostrar modal
    this.modal.style.display = 'flex';
    this.isOpen = true;

    // Prevenir scroll
    document.body.style.overflow = 'hidden';

    // Setup focus trap
    this.setupFocusTrap();

    // Event listeners
    this.modal.addEventListener('keydown', this.handleKeyDown);
    if (this.options.closeOnBackdrop) {
      this.modal.addEventListener('click', this.handleBackdropClick);
    }

    // Enfocar primer elemento
    setTimeout(() => {
      if (this.focusableElements.length > 0) {
        this.focusableElements[0].focus();
      } else {
        this.modal.focus();
      }
    }, 100);

    // Callback
    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(this.modal);
    }

    console.log(`📰 Modal abierto: ${this.modalId}`);
  }

  /**
   * Cierra el modal
   */
  close() {
    if (!this.isOpen) return;

    // Ocultar modal
    this.modal.style.display = 'none';
    this.isOpen = false;

    // Restaurar scroll
    document.body.style.overflow = '';

    // Remover event listeners
    this.modal.removeEventListener('keydown', this.handleKeyDown);
    this.modal.removeEventListener('click', this.handleBackdropClick);

    // Restaurar foco
    if (this.options.restoreFocus && this.previouslyFocused) {
      this.previouslyFocused.focus();
      this.previouslyFocused = null;
    }

    // Callback
    if (typeof this.options.onClose === 'function') {
      this.options.onClose(this.modal);
    }

    console.log(`📰 Modal cerrado: ${this.modalId}`);
  }

  /**
   * Toggle modal
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Setup focus trap
   * @private
   */
  setupFocusTrap() {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    this.focusableElements = Array.from(
      this.modal.querySelectorAll(focusableSelectors)
    );
  }

  /**
   * Maneja eventos de teclado
   * @private
   */
  handleKeyDown(e) {
    // Escape para cerrar
    if (e.key === 'Escape' && this.options.closeOnEscape) {
      e.preventDefault();
      this.close();
      return;
    }

    // Focus trap con Tab
    if (e.key === 'Tab' && this.focusableElements.length > 0) {
      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Maneja click en backdrop
   * @private
   */
  handleBackdropClick(e) {
    if (e.target === this.modal) {
      this.close();
    }
  }

  /**
   * Destruye el modal
   */
  destroy() {
    if (this.isOpen) {
      this.close();
    }
    
    this.modal.removeEventListener('keydown', this.handleKeyDown);
    this.modal.removeEventListener('click', this.handleBackdropClick);
    
    console.log(`📰 Modal destruido: ${this.modalId}`);
  }
}

export default Modal;
