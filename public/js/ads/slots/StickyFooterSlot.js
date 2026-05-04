/**
 * StickyFooterAdSlot - Anchor ad en footer (muy rentable)
 */
class StickyFooterAdSlot extends BaseAdSlot {
  constructor(element, config) {
    super(element, config);
    this.type = 'sticky-footer';
    this.closeButton = null;
    this.isClosed = false;
  }

  setupAdAttributes() {
    this.element.style.display = 'none'; // Mostrar solo después de scroll
    this.insElement.style.minHeight = '90px';
  }

  async load() {
    // Crear estructura con botón de cierre
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 728px;
      margin: 0 auto;
    `;
    
    // Botón de cierre (requerido por AdSense para anchor ads)
    this.closeButton = document.createElement('button');
    this.closeButton.innerHTML = '✕';
    this.closeButton.setAttribute('aria-label', 'Cerrar publicidad');
    this.closeButton.style.cssText = `
      position: absolute;
      top: -28px;
      right: 0;
      background: #1e293b;
      color: #fff;
      border: none;
      padding: 4px 12px;
      border-radius: 4px 4px 0 0;
      font-size: 12px;
      cursor: pointer;
      z-index: 10;
    `;
    
    this.closeButton.onclick = () => this.close();
    
    wrapper.appendChild(this.closeButton);
    wrapper.appendChild(this.insElement);
    this.element.appendChild(wrapper);
    
    // Mostrar después de 3 segundos o scroll
    setTimeout(() => this.show(), 3000);
    
    // O mostrar en scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) this.show();
    }, { once: true, passive: true });
    
    return super.load();
  }

  show() {
    if (!this.isClosed && this.element.style.display === 'none') {
      this.element.style.display = 'block';
      // Animación suave
      this.element.animate([
        { transform: 'translateY(100%)' },
        { transform: 'translateY(0)' }
      ], {
        duration: 300,
        easing: 'ease-out'
      });
    }
  }

  close() {
    this.isClosed = true;
    this.element.style.display = 'none';
    
    // No mostrar por 1 hora
    localStorage.setItem('ad_sticky_closed', Date.now().toString());
  }

  getAdFormat() {
    return 'horizontal';
  }
}

window.StickyFooterAdSlot = StickyFooterAdSlot;
