/**
 * SidebarAdSlot - Anuncio sticky en sidebar
 */
class SidebarAdSlot extends BaseAdSlot {
  constructor(element, config) {
    super(element, config);
    this.type = 'sidebar';
    this.stickyController = null;
  }

  setupAdAttributes() {
    // Configurar sticky behavior
    this.element.style.position = 'sticky';
    this.element.style.top = '100px';
    this.insElement.style.minHeight = '600px';
    this.insElement.style.minWidth = '300px';
  }

  getAdFormat() {
    return 'vertical';
  }

  load() {
    // Iniciar control de sticky
    this.initStickyController();
    return super.load();
  }

  initStickyController() {
    // Pausar refrescos cuando sidebar está fuera de viewport
    // (usuario scrolleó hasta el final del artículo)
    const articleEnd = document.querySelector('.article-end') || 
                       document.querySelector('footer');
    
    if (articleEnd) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Llegamos al final, pausar refrescos de sidebar
            this.emit('pause-refresh');
          }
        });
      });
      
      observer.observe(articleEnd);
      this.stickyController = observer;
    }
  }

  destroy() {
    this.stickyController?.disconnect();
    super.destroy();
  }

  emit(eventName) {
    // Evento para AdManager
    window.dispatchEvent(new CustomEvent('adslot-event', {
      detail: { slotId: this.id, event: eventName }
    }));
  }
}

window.SidebarAdSlot = SidebarAdSlot;
