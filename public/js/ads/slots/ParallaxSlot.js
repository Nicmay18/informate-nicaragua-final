/**
 * ParallaxAdSlot - Efecto parallax para engagement (experimental)
 */
class ParallaxAdSlot extends BaseAdSlot {
  constructor(element, config) {
    super(element, config);
    this.type = 'parallax';
    this.scrollHandler = null;
  }

  setupAdAttributes() {
    this.element.style.cssText = `
      position: relative;
      height: 400px;
      overflow: hidden;
      margin: 32px 0;
    `;
    
    // Contenedor con efecto parallax
    const parallaxContainer = document.createElement('div');
    parallaxContainer.className = 'parallax-ad-container';
    parallaxContainer.style.cssText = `
      position: absolute;
      top: -50px;
      left: 0;
      right: 0;
      height: 500px;
      will-change: transform;
    `;
    
    parallaxContainer.appendChild(this.insElement);
    this.element.appendChild(parallaxContainer);
    
    this.parallaxContainer = parallaxContainer;
  }

  load() {
    // Efecto parallax en scroll
    this.scrollHandler = () => {
      const rect = this.element.getBoundingClientRect();
      const scrolled = window.scrollY;
      const rate = scrolled * 0.3;
      
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        this.parallaxContainer.style.transform = `translateY(${rate}px)`;
      }
    };
    
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    return super.load();
  }

  destroy() {
    window.removeEventListener('scroll', this.scrollHandler);
    super.destroy();
  }
}

window.ParallaxAdSlot = ParallaxAdSlot;
